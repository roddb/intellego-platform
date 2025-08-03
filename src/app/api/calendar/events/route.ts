import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/calendar/events - Get user's calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    let whereClause: any = {
      userId: session.user.id
    }

    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.AND = [
        {
          startDate: {
            gte: new Date(startDate)
          }
        },
        {
          endDate: {
            lte: new Date(endDate)
          }
        }
      ]
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'asc'
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/calendar/events - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      startDate,
      endDate,
      type,
      subject,
      location,
      color
    } = body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Título, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId: session.user.id,
        title,
        description,
        startDate: start,
        endDate: end,
        type: type || 'PERSONAL',
        subject,
        location,
        color: color || '#3B82F6'
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/calendar/events - Update calendar event
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      title,
      description,
      startDate,
      endDate,
      type,
      subject,
      location,
      color
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del evento es requerido" },
        { status: 400 }
      )
    }

    // Check if event exists and belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      )
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start >= end) {
        return NextResponse.json(
          { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
          { status: 400 }
        )
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(type && { type }),
        ...(subject !== undefined && { subject }),
        ...(location !== undefined && { location }),
        ...(color && { color })
      }
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar/events - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "ID del evento es requerido" },
        { status: 400 }
      )
    }

    // Check if event exists and belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      )
    }

    await prisma.calendarEvent.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Evento eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}