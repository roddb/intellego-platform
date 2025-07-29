import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  addCalendarEvent, 
  CalendarEvent, 
  getEventTypeColor,
  getUserCalendarData 
} from '@/lib/calendar-data'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      type, 
      subject, 
      date, 
      startTime, 
      endTime, 
      duration, 
      location, 
      description, 
      priority 
    } = body

    // Validaciones básicas
    if (!title || !type || !date) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: title, type, date', 
          success: false 
        },
        { status: 400 }
      )
    }

    // Validar tipo de evento
    const validTypes = ['exam', 'study_session', 'class', 'personal', 'extracurricular']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { 
          error: `Invalid event type. Must be one of: ${validTypes.join(', ')}`, 
          success: false 
        },
        { status: 400 }
      )
    }

    // Procesar fecha
    let eventDate: Date
    try {
      eventDate = new Date(date)
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date')
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format', success: false },
        { status: 400 }
      )
    }

    // Calcular endTime si no se proporciona pero se tiene duration
    let finalEndTime = endTime
    if (!endTime && startTime && duration) {
      const start = new Date(`2000-01-01T${startTime}:00`)
      const end = new Date(start.getTime() + duration * 60000)
      finalEndTime = end.toTimeString().substring(0, 5)
    }

    // Crear el evento
    const event: CalendarEvent = {
      id: `ai-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      date: eventDate,
      startTime: startTime || '15:00',
      endTime: finalEndTime || '16:00',
      type: type as CalendarEvent['type'],
      color: getEventTypeColor(type as CalendarEvent['type']),
      subject: subject || undefined,
      location: location || undefined,
      description: description || 'Creado automáticamente por IA Tutora',
      priority: priority || 'medium',
      duration: duration || 60
    }

    // Intentar agregar el evento al calendario del usuario
    const userId = session.user.id
    const success = addCalendarEvent(userId, event)

    if (!success) {
      return NextResponse.json(
        { 
          error: 'Failed to create event in calendar', 
          success: false 
        },
        { status: 500 }
      )
    }

    // Verificar que el evento se guardó correctamente
    const userData = getUserCalendarData(userId)
    const savedEvent = userData?.events.find(e => e.id === event.id)

    if (!savedEvent) {
      return NextResponse.json(
        { 
          error: 'Event was not saved correctly', 
          success: false 
        },
        { status: 500 }
      )
    }

    console.log(`🤖 IA creó evento: ${event.title} para ${userId}`)

    // Disparar evento global para notificar a los componentes frontend
    if (typeof globalThis !== 'undefined') {
      // Usar setTimeout para evitar problemas de timing
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('calendarEventCreated', {
            detail: { event: savedEvent, userId }
          }))
        }
      }, 100)
    }

    return NextResponse.json({
      success: true,
      event: savedEvent,
      message: `Evento "${event.title}" creado exitosamente`,
      totalEvents: userData?.events.length || 0
    })

  } catch (error) {
    console.error('❌ Error in AI calendar creation:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error while creating event', 
        success: false 
      },
      { status: 500 }
    )
  }
}