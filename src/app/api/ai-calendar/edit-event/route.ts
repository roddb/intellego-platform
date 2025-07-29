import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  updateCalendarEvent, 
  getUserCalendarData 
} from '@/lib/calendar-data'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId, updates } = body

    // Validaciones básicas
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required', success: false },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates are required', success: false },
        { status: 400 }
      )
    }

    // Procesar fecha si se actualiza
    if (updates.date && typeof updates.date === 'string') {
      try {
        updates.date = new Date(updates.date)
        if (isNaN(updates.date.getTime())) {
          throw new Error('Invalid date')
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date format in updates', success: false },
          { status: 400 }
        )
      }
    }

    // Actualizar el evento
    const userId = session.user.id
    const success = updateCalendarEvent(userId, eventId, updates)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update event or event not found', success: false },
        { status: 404 }
      )
    }

    // Obtener el evento actualizado
    const userData = getUserCalendarData(userId)
    const updatedEvent = userData?.events.find(e => e.id === eventId)

    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Event not found after update', success: false },
        { status: 500 }
      )
    }

    console.log(`🤖 IA editó evento: ${updatedEvent.title} para ${userId}`)

    // Disparar evento del lado del cliente
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calendarEventUpdated', {
          detail: { event: updatedEvent, userId }
        }))
      }, 100)
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: `Evento "${updatedEvent.title}" actualizado exitosamente`,
      totalEvents: userData?.events.length || 0
    })

  } catch (error) {
    console.error('❌ Error in AI calendar editing:', error)
    
    return NextResponse.json(
      { error: 'Internal server error while updating event', success: false },
      { status: 500 }
    )
  }
}