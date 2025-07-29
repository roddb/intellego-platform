import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchoolScheduleManager } from '@/lib/school-schedule-manager'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { scheduleData, source = 'manual', naturalLanguageText } = body

    let importResult

    if (naturalLanguageText) {
      // Procesar texto en lenguaje natural
      const parsedClasses = SchoolScheduleManager.parseNaturalLanguageSchedule(naturalLanguageText)
      
      importResult = await SchoolScheduleManager.importSchedule(
        session.user.id,
        {
          classes: parsedClasses,
          metadata: {
            schoolName: body.schoolName,
            academicYear: body.academicYear,
            semester: body.semester
          }
        },
        'manual'
      )
    } else {
      // Procesar datos estructurados
      importResult = await SchoolScheduleManager.importSchedule(
        session.user.id,
        scheduleData,
        source
      )
    }

    // Detectar conflictos
    const conflicts = SchoolScheduleManager.detectScheduleConflicts(importResult.classes)
    
    // Analizar slots de estudio
    const studySlots = SchoolScheduleManager.analyzeStudyTimeSlots(importResult.classes)

    return NextResponse.json({
      success: true,
      schedule: importResult,
      conflicts,
      studySlots,
      summary: {
        totalClasses: importResult.classes.length,
        totalHoursPerWeek: importResult.classes.reduce((sum, cls) => sum + cls.duration, 0) / 60,
        conflictsFound: conflicts.length,
        studySlotsAvailable: studySlots.length
      }
    })
    
  } catch (error) {
    console.error('Error importing schedule:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Aquí se cargaría el horario existente del estudiante
    // Por ahora retornamos un ejemplo de respuesta
    
    return NextResponse.json({
      hasSchedule: false,
      message: 'No hay horario importado. Use el endpoint POST para importar un horario.'
    })
    
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}