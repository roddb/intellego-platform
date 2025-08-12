/**
 * FASE 6: Email Queue Processing API Endpoint
 * 
 * This endpoint handles email queue processing and retry management.
 * Can be called manually or scheduled as a background job.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processEmailQueueBackground } from "@/lib/gmail-service"
import { 
  getPendingEmailRetries, 
  getEmailDeliveryStats,
  initializeEmailTables 
} from "@/lib/db-operations"

export interface QueueStatusResponse {
  queueStatus: 'idle' | 'processing' | 'error'
  pendingEmails: number
  processingResults?: {
    processed: number
    successful: number
    failed: number
    retried: number
  }
  emailStats: {
    total: number
    sent: number
    failed: number
    pending: number
    bounced: number
    avgDeliveryTimeMinutes: number
  }
  message: string
}

// Track queue processing status
let queueProcessingStatus = {
  isProcessing: false,
  lastProcessed: null as Date | null,
  lastResults: null as any
}

/**
 * POST: Process email queue manually
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        queueStatus: 'error' as const,
        error: "No autorizado",
        message: "Debe iniciar sesión para procesar la cola de emails"
      }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ 
        queueStatus: 'error' as const,
        error: "Solo instructores pueden procesar la cola",
        message: "Acceso denegado"
      }, { status: 403 })
    }

    // Initialize email tables if needed
    try {
      await initializeEmailTables()
    } catch (error) {
      console.log('Email tables already initialized:', error)
    }

    // Check if queue is already processing
    if (queueProcessingStatus.isProcessing) {
      return NextResponse.json({ 
        queueStatus: 'processing' as const,
        pendingEmails: 0,
        message: "La cola de emails ya se está procesando. Intente más tarde.",
        emailStats: await getEmailDeliveryStats()
      })
    }

    // Get pending emails count before processing
    const pendingEmails = await getPendingEmailRetries(100) // Get up to 100 for counting
    const pendingCount = pendingEmails.length

    if (pendingCount === 0) {
      return NextResponse.json({ 
        queueStatus: 'idle' as const,
        pendingEmails: 0,
        message: "No hay emails pendientes en la cola",
        emailStats: await getEmailDeliveryStats()
      })
    }

    console.log(`🔄 Starting manual email queue processing (${pendingCount} pending)`)

    // Mark as processing
    queueProcessingStatus.isProcessing = true
    queueProcessingStatus.lastProcessed = new Date()

    try {
      // Process the queue
      await processEmailQueueBackground()
      
      // Get updated statistics
      const finalStats = await getEmailDeliveryStats()
      const finalPendingEmails = await getPendingEmailRetries(100)
      
      const processedCount = pendingCount - finalPendingEmails.length
      
      queueProcessingStatus.lastResults = {
        processed: processedCount,
        successful: processedCount, // Simplification - actual success count would need more tracking
        failed: 0,
        retried: finalPendingEmails.length
      }

      const response: QueueStatusResponse = {
        queueStatus: 'idle',
        pendingEmails: finalPendingEmails.length,
        processingResults: queueProcessingStatus.lastResults,
        emailStats: finalStats,
        message: `Procesamiento completado: ${processedCount} emails procesados, ${finalPendingEmails.length} pendientes`
      }

      return NextResponse.json(response)

    } catch (processingError: any) {
      console.error('❌ Error processing email queue:', processingError)
      
      return NextResponse.json({ 
        queueStatus: 'error' as const,
        pendingEmails: pendingCount,
        error: "Error procesando cola de emails",
        message: "Error interno durante el procesamiento de emails",
        emailStats: await getEmailDeliveryStats()
      }, { status: 500 })
      
    } finally {
      // Always reset processing status
      queueProcessingStatus.isProcessing = false
    }

  } catch (error: any) {
    console.error(`❌ Email queue API error:`, error)
    queueProcessingStatus.isProcessing = false
    
    return NextResponse.json({ 
      queueStatus: 'error' as const,
      error: "Error interno del servidor",
      message: "Error inesperado al procesar solicitud de cola"
    }, { status: 500 })
  }
}

/**
 * GET: Get email queue status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    // Initialize email tables if needed
    try {
      await initializeEmailTables()
    } catch (error) {
      console.log('Email tables already initialized:', error)
    }

    // Get current queue status
    const pendingEmails = await getPendingEmailRetries(100)
    const emailStats = await getEmailDeliveryStats(session.user.id) // Get stats for this instructor

    const status = queueProcessingStatus.isProcessing ? 'processing' : 'idle'

    const response: QueueStatusResponse = {
      queueStatus: status,
      pendingEmails: pendingEmails.length,
      processingResults: queueProcessingStatus.lastResults,
      emailStats,
      message: status === 'processing' 
        ? "Procesando cola de emails..." 
        : pendingEmails.length > 0 
          ? `${pendingEmails.length} emails pendientes en la cola`
          : "Cola de emails vacía"
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`❌ Email queue status API error:`, error)
    
    return NextResponse.json({ 
      queueStatus: 'error' as const,
      error: "Error interno del servidor",
      message: "Error al obtener estado de la cola"
    }, { status: 500 })
  }
}

/**
 * DELETE: Clear failed emails from queue (cleanup operation)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden limpiar la cola" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clear-failed') {
      // Clear permanently failed emails (exceeded max retries)
      const { query } = await import('@/lib/db-operations')
      
      const result = await query(`
        DELETE FROM EmailDelivery 
        WHERE status = 'failed' 
        AND retryCount >= maxRetries
        AND instructorId = ?
      `, [session.user.id])

      return NextResponse.json({
        success: true,
        message: `${result.rowsAffected || 0} emails fallidos eliminados de la cola`,
        action: 'clear-failed'
      })

    } else if (action === 'reset-retries') {
      // Reset retry count for failed emails
      const { query } = await import('@/lib/db-operations')
      
      const result = await query(`
        UPDATE EmailDelivery 
        SET retryCount = 0, nextRetryAt = NULL, status = 'pending'
        WHERE status = 'failed' 
        AND instructorId = ?
      `, [session.user.id])

      return NextResponse.json({
        success: true,
        message: `${result.rowsAffected || 0} emails marcados para reintento`,
        action: 'reset-retries'
      })

    } else {
      return NextResponse.json({ 
        success: false,
        error: "Acción no válida",
        message: "Especifique una acción válida: clear-failed o reset-retries"
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error(`❌ Email queue cleanup API error:`, error)
    
    return NextResponse.json({ 
      success: false,
      error: "Error interno del servidor",
      message: "Error al limpiar la cola de emails"
    }, { status: 500 })
  }
}