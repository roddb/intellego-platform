import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient, DayOfWeek, ScheduleType } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/schedule/recurring - Get user's recurring schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') as ScheduleType | null
    const isActive = url.searchParams.get('isActive')
    const semester = url.searchParams.get('semester')

    let whereClause: any = {
      userId: session.user.id
    }

    // Add filters
    if (type) {
      whereClause.type = type
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (semester) {
      whereClause.semester = semester
    }

    const schedules = await prisma.recurringSchedule.findMany({
      where: whereClause,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Error fetching recurring schedules:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/schedule/recurring - Create new recurring schedule
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
      type,
      dayOfWeek,
      startTime,
      endTime,
      location,
      color,
      category,
      semester
    } = body

    // Validate required fields
    if (!title || !type || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Título, tipo, día, hora de inicio y hora de fin son requeridos" },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Formato de hora inválido. Use HH:MM" },
        { status: 400 }
      )
    }

    // Validate time order
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { error: "La hora de fin debe ser posterior a la hora de inicio" },
        { status: 400 }
      )
    }

    // Check for conflicts with existing schedules
    const existingSchedules = await prisma.recurringSchedule.findMany({
      where: {
        userId: session.user.id,
        dayOfWeek: dayOfWeek as DayOfWeek,
        isActive: true
      }
    })

    const hasConflict = existingSchedules.some(existing => {
      const [existingStartHour, existingStartMin] = existing.startTime.split(':').map(Number)
      const [existingEndHour, existingEndMin] = existing.endTime.split(':').map(Number)
      const existingStartMinutes = existingStartHour * 60 + existingStartMin
      const existingEndMinutes = existingEndHour * 60 + existingEndMin

      return startMinutes < existingEndMinutes && endMinutes > existingStartMinutes
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: "Conflicto de horario detectado", hasConflict: true },
        { status: 409 }
      )
    }

    const schedule = await prisma.recurringSchedule.create({
      data: {
        userId: session.user.id,
        title,
        description,
        type: type as ScheduleType,
        dayOfWeek: dayOfWeek as DayOfWeek,
        startTime,
        endTime,
        location,
        color: color || '#3B82F6',
        category,
        semester
      }
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error("Error creating recurring schedule:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/schedule/recurring (batch create) - Create multiple schedules at once
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { schedules } = body

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Se requiere un array de horarios" },
        { status: 400 }
      )
    }

    // Validate each schedule
    for (const schedule of schedules) {
      if (!schedule.title || !schedule.type || !schedule.dayOfWeek || !schedule.startTime || !schedule.endTime) {
        return NextResponse.json(
          { error: "Cada horario debe tener título, tipo, día, hora de inicio y hora de fin" },
          { status: 400 }
        )
      }
    }

    // Create all schedules in a transaction
    const createdSchedules = await prisma.$transaction(async (tx) => {
      const results = []
      for (const scheduleData of schedules) {
        const schedule = await tx.recurringSchedule.create({
          data: {
            userId: session.user.id,
            title: scheduleData.title,
            description: scheduleData.description,
            type: scheduleData.type as ScheduleType,
            dayOfWeek: scheduleData.dayOfWeek as DayOfWeek,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            location: scheduleData.location,
            color: scheduleData.color || '#3B82F6',
            category: scheduleData.category,
            semester: scheduleData.semester
          }
        })
        results.push(schedule)
      }
      return results
    })

    return NextResponse.json({ 
      schedules: createdSchedules,
      count: createdSchedules.length 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating batch schedules:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/recurring - Delete recurring schedule
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
        { error: "ID del horario es requerido" },
        { status: 400 }
      )
    }

    // Check if schedule exists and belongs to user
    const existingSchedule = await prisma.recurringSchedule.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Horario no encontrado" },
        { status: 404 }
      )
    }

    await prisma.recurringSchedule.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Horario eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting recurring schedule:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH /api/schedule/recurring - Update schedule status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive, semester } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del horario es requerido" },
        { status: 400 }
      )
    }

    // Check if schedule exists and belongs to user
    const existingSchedule = await prisma.recurringSchedule.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Horario no encontrado" },
        { status: 404 }
      )
    }

    const schedule = await prisma.recurringSchedule.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(semester !== undefined && { semester })
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Error updating recurring schedule:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}