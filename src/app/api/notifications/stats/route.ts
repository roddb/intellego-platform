// API Endpoint para Estadísticas del Sistema de Notificaciones
import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const stats = NotificationService.getNotificationStats(userId || undefined)

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      message: 'Estadísticas de notificaciones obtenidas exitosamente'
    })

  } catch (error) {
    console.error('Error getting notification stats:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al obtener estadísticas de notificaciones'
    }, { status: 500 })
  }
}