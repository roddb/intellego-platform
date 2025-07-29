import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEvents } from '@/lib/temp-storage'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todos los eventos del usuario
    const allEvents = getEvents(session.user.id)
    
    // Filtrar eventos próximos (próximos 30 días)
    const now = new Date()
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    
    const upcomingEvents = allEvents
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= now && eventDate <= nextMonth
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10) // Máximo 10 eventos próximos

    // Formatear eventos para el dashboard
    const formattedEvents = upcomingEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      subject: event.subject,
      description: event.description,
      type: event.type
    }))

    return NextResponse.json(formattedEvents)
    
  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}