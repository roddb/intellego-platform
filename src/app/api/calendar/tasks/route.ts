import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient, TaskStatus } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/calendar/tasks - Get user's tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const subject = url.searchParams.get('subject')
    const dueStart = url.searchParams.get('dueStart')
    const dueEnd = url.searchParams.get('dueEnd')

    let whereClause: any = {
      userId: session.user.id
    }

    // Add filters
    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (subject) {
      whereClause.subject = subject
    }

    if (dueStart && dueEnd) {
      whereClause.dueDate = {
        gte: new Date(dueStart),
        lte: new Date(dueEnd)
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    // Update overdue tasks
    const now = new Date()
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      task.dueDate < now && 
      task.status !== 'COMPLETED' &&
      task.status !== 'OVERDUE'
    )

    if (overdueTasks.length > 0) {
      await Promise.all(
        overdueTasks.map(task =>
          prisma.task.update({
            where: { id: task.id },
            data: { status: 'OVERDUE' }
          })
        )
      )

      // Refetch tasks with updated status
      const updatedTasks = await prisma.task.findMany({
        where: whereClause,
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' }
        ]
      })

      return NextResponse.json({ tasks: updatedTasks })
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/calendar/tasks - Create new task
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
      dueDate,
      priority,
      subject,
      estimatedHours
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Título es requerido" },
        { status: 400 }
      )
    }

    // Determine initial status based on due date
    let status: TaskStatus = 'PENDING'
    if (dueDate) {
      const due = new Date(dueDate)
      const now = new Date()
      if (due < now) {
        status = 'OVERDUE'
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status,
        subject,
        estimatedHours
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/calendar/tasks - Update task
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
      dueDate,
      priority,
      status,
      subject,
      estimatedHours
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID de la tarea es requerido" },
        { status: 400 }
      )
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    // Auto-update status based on due date if changing due date
    let newStatus = status
    if (dueDate && !status) {
      const due = new Date(dueDate)
      const now = new Date()
      if (due < now && existingTask.status !== 'COMPLETED') {
        newStatus = 'OVERDUE'
      } else if (existingTask.status === 'OVERDUE' && due >= now) {
        newStatus = 'PENDING'
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(priority && { priority }),
        ...(newStatus && { status: newStatus }),
        ...(subject !== undefined && { subject }),
        ...(estimatedHours !== undefined && { estimatedHours })
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar/tasks - Delete task
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
        { error: "ID de la tarea es requerido" },
        { status: 400 }
      )
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Tarea eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH /api/calendar/tasks - Update task status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID y estado son requeridos" },
        { status: 400 }
      )
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      )
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Error updating task status:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}