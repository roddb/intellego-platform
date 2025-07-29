import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  deleteCalendarEvent, 
  getUserCalendarData 
} from '@/lib/calendar-data'

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId } = body

    // Validaciones básicas
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required', success: false },
        { status: 400 }
      )
    }

    const userId = session.user.id
    
    // Obtener el evento antes de eliminarlo para el mensaje
    const userData = getUserCalendarData(userId)
    const eventToDelete = userData?.events.find(e => e.id === eventId)
    
    if (!eventToDelete) {
      return NextResponse.json(
        { error: 'Event not found', success: false },
        { status: 404 }
      )
    }

    // Eliminar el evento
    const success = deleteCalendarEvent(userId, eventId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete event', success: false },
        { status: 500 }
      )
    }

    console.log(`🤖 IA eliminó evento: ${eventToDelete.title} para ${userId}`)

    // Disparar evento del lado del cliente
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calendarEventDeleted', {
          detail: { eventId, userId, title: eventToDelete.title }
        }))
      }, 100)
    }

    // Obtener la cantidad actualizada de eventos
    const updatedUserData = getUserCalendarData(userId)

    return NextResponse.json({
      success: true,
      message: `Evento "${eventToDelete.title}" eliminado exitosamente`,
      deletedEvent: eventToDelete,
      totalEvents: updatedUserData?.events.length || 0
    })

  } catch (error) {
    console.error('❌ Error in AI calendar deletion:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while deleting event', success: false },
      { status: 500 }
    )
  }
}