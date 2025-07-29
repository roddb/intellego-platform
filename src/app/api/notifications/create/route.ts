// API Endpoint para Crear Notificaciones Académicas Específicas
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService, NotificationTrigger } from '@/lib/notification-service'
import { AcademicSearchQuery } from '@/lib/academic-search-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      searchQuery, 
      trigger, 
      customTitle, 
      customMessage 
    } = body

    if (!userId || !searchQuery || !searchQuery.topic) {
      return NextResponse.json({
        success: false,
        error: 'userId y searchQuery.topic son requeridos'
      }, { status: 400 })
    }

    // Crear query académico
    const academicQuery: AcademicSearchQuery = {
      topic: searchQuery.topic,
      subject: searchQuery.subject,
      searchType: searchQuery.searchType || 'explanation',
      level: searchQuery.level || 'basic',
      language: searchQuery.language || 'es',
      userId,
      sessionId: searchQuery.sessionId
    }

    // Generar notificación académica
    const notification = await NotificationService.createAcademicNotification(
      userId,
      academicQuery,
      trigger || NotificationTrigger.KNOWLEDGE_GAP,
      customTitle,
      customMessage
    )

    return NextResponse.json({
      success: true,
      notification,
      searchResults: notification.searchResults,
      message: 'Notificación académica creada exitosamente'
    })

  } catch (error) {
    console.error('Error creating academic notification:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al crear notificación académica'
    }, { status: 500 })
  }
}