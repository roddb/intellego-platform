// API Endpoint para Analizar y Generar Notificaciones Proactivas
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService, NotificationContext, NotificationTrigger, NotificationPriority } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, trigger, academicContext } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId es requerido'
      }, { status: 400 })
    }

    const context: NotificationContext = {
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      trigger: trigger || NotificationTrigger.LEARNING_OPPORTUNITY,
      priority: NotificationPriority.MEDIUM,
      academicContext
    }

    // Analizar y generar notificaciones
    const notifications = await NotificationService.analyzeAndNotify(context)

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      message: `Se generaron ${notifications.length} notificaciones proactivas`
    })

  } catch (error) {
    console.error('Error in notification analysis:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al analizar y generar notificaciones'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({
      success: false,
      error: 'userId es requerido'
    }, { status: 400 })
  }

  try {
    // Obtener notificaciones locales
    const notifications = NotificationService.getLocalNotifications(userId)
    
    // Limpiar notificaciones antiguas
    NotificationService.clearOldNotifications(userId, 48) // 48 horas

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      message: 'Notificaciones obtenidas exitosamente'
    })

  } catch (error) {
    console.error('Error getting notifications:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al obtener notificaciones'
    }, { status: 500 })
  }
}