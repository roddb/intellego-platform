import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchoolScheduleManager } from '@/lib/school-schedule-manager'
import { StudentContextManager } from '@/lib/student-context'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener contexto del estudiante
    const context = await StudentContextManager.getContext(session.user.id)
    
    if (!context || !context.academicCalendar.schoolSchedule.length) {
      return NextResponse.json({
        error: 'No hay horario escolar configurado',
        suggestion: 'Primero importa tu horario escolar usando el endpoint /api/school-schedule/import'
      }, { status: 404 })
    }

    // Convertir horario a formato SchoolClass para análisis
    const classes = context.academicCalendar.schoolSchedule.map(schedule => ({
      id: `class_${schedule.subject}_${schedule.day}`,
      subject: schedule.subject,
      teacher: schedule.teacher,
      classroom: schedule.classroom,
      day: schedule.day as any,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: SchoolScheduleManager['calculateDuration'](schedule.startTime, schedule.endTime),
      type: 'lecture' as const,
      recurring: true
    }))

    // Analizar conflictos
    const conflicts = SchoolScheduleManager.detectScheduleConflicts(classes)
    
    // Analizar slots de tiempo libre
    const studySlots = SchoolScheduleManager.analyzeStudyTimeSlots(classes)
    
    // Calcular estadísticas del horario
    const stats = {
      totalClasses: classes.length,
      totalHoursPerWeek: classes.reduce((sum, cls) => sum + cls.duration, 0) / 60,
      averageHoursPerDay: classes.reduce((sum, cls) => sum + cls.duration, 0) / (60 * 5), // Asumiendo 5 días
      busiesDay: this.findBusiestDay(classes),
      lightestDay: this.findLightestDay(classes),
      subjectDistribution: this.calculateSubjectDistribution(classes),
      dailySchedule: this.generateDailySchedule(classes)
    }

    // Generar recomendaciones
    const recommendations = this.generateScheduleRecommendations(classes, studySlots, conflicts)

    return NextResponse.json({
      analysis: {
        conflicts,
        studySlots,
        stats,
        recommendations
      },
      insights: {
        totalFreeHours: studySlots.reduce((sum, slot) => sum + slot.duration, 0) / 60,
        bestStudyTimes: studySlots
          .filter(slot => slot.energy_level === 'high')
          .slice(0, 3),
        warningsCount: conflicts.filter(c => c.severity === 'warning').length,
        errorsCount: conflicts.filter(c => c.severity === 'error').length
      }
    })
    
  } catch (error) {
    console.error('Error analyzing schedule:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}

// Funciones auxiliares (en una implementación real, estas estarían en SchoolScheduleManager)
function findBusiestDay(classes: any[]): { day: string, hours: number } {
  const dailyHours = classes.reduce((acc, cls) => {
    acc[cls.day] = (acc[cls.day] || 0) + cls.duration / 60
    return acc
  }, {} as { [day: string]: number })

  const busiestDay = Object.entries(dailyHours)
    .sort(([,a], [,b]) => b - a)[0]

  return { day: busiestDay[0], hours: busiestDay[1] }
}

function findLightestDay(classes: any[]): { day: string, hours: number } {
  const dailyHours = classes.reduce((acc, cls) => {
    acc[cls.day] = (acc[cls.day] || 0) + cls.duration / 60
    return acc
  }, {} as { [day: string]: number })

  const lightestDay = Object.entries(dailyHours)
    .sort(([,a], [,b]) => a - b)[0]

  return { day: lightestDay[0], hours: lightestDay[1] || 0 }
}

function calculateSubjectDistribution(classes: any[]): { [subject: string]: number } {
  return classes.reduce((acc, cls) => {
    acc[cls.subject] = (acc[cls.subject] || 0) + cls.duration / 60
    return acc
  }, {} as { [subject: string]: number })
}

function generateDailySchedule(classes: any[]): { [day: string]: any[] } {
  return classes.reduce((acc, cls) => {
    if (!acc[cls.day]) acc[cls.day] = []
    acc[cls.day].push(cls)
    return acc
  }, {} as { [day: string]: any[] })
}

function generateScheduleRecommendations(classes: any[], studySlots: any[], conflicts: any[]): string[] {
  const recommendations: string[] = []

  // Recomendaciones basadas en conflictos
  if (conflicts.length > 0) {
    recommendations.push(`Resolver ${conflicts.length} conflicto(s) de horario detectado(s)`)
  }

  // Recomendaciones basadas en carga de trabajo
  const totalHours = classes.reduce((sum, cls) => sum + cls.duration, 0) / 60
  if (totalHours > 35) {
    recommendations.push('Considerar reducir la carga académica o distribuir mejor las clases')
  }

  // Recomendaciones basadas en tiempo libre
  const freeHours = studySlots.reduce((sum, slot) => sum + slot.duration, 0) / 60
  if (freeHours < 10) {
    recommendations.push('Buscar más tiempo para estudio personal entre clases')
  }

  // Recomendaciones de optimización
  const highEnergySlots = studySlots.filter(slot => slot.energy_level === 'high')
  if (highEnergySlots.length > 0) {
    recommendations.push(`Aprovechar ${highEnergySlots.length} slot(s) de alta energía para materias difíciles`)
  }

  return recommendations
}