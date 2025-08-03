import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient, ScheduleType } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/schedule/templates - Get schedule templates
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') as ScheduleType | null
    const targetGroup = url.searchParams.get('targetGroup')

    let whereClause: any = {
      isPublic: true
    }

    if (type) {
      whereClause.type = type
    }

    if (targetGroup) {
      whereClause.targetGroup = targetGroup
    }

    const templates = await prisma.scheduleTemplate.findMany({
      where: whereClause,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching schedule templates:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/schedule/templates - Create new template (admin/instructor only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Only instructors can create templates
    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden crear templates" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      targetGroup,
      scheduleData,
      isPublic = true
    } = body

    // Validate required fields
    if (!name || !type || !targetGroup || !scheduleData) {
      return NextResponse.json(
        { error: "Nombre, tipo, grupo objetivo y datos del horario son requeridos" },
        { status: 400 }
      )
    }

    // Validate scheduleData is array
    if (!Array.isArray(scheduleData)) {
      return NextResponse.json(
        { error: "Los datos del horario deben ser un array" },
        { status: 400 }
      )
    }

    const template = await prisma.scheduleTemplate.create({
      data: {
        name,
        description,
        type: type as ScheduleType,
        targetGroup,
        scheduleData,
        isPublic,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule template:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH /api/schedule/templates - Update template usage count
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID del template es requerido" },
        { status: 400 }
      )
    }

    const template = await prisma.scheduleTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Error updating template usage:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}