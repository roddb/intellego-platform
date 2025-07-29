// Sistema de Gestión de Horario Escolar
// Permite importar, gestionar y optimizar horarios académicos

import { StudentContext, StudentContextManager, AcademicCalendar } from './student-context'

export interface SchoolClass {
  id: string
  subject: string
  teacher?: string
  classroom?: string
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string // "08:00"
  endTime: string   // "09:30"
  duration: number  // minutes
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'workshop'
  recurring: boolean
  notes?: string
}

export interface SchoolTerm {
  name: string
  startDate: Date
  endDate: Date
  holidays: {
    name: string
    startDate: Date
    endDate: Date
    type: 'national' | 'school' | 'religious' | 'break'
  }[]
  examPeriods: {
    name: string
    startDate: Date
    endDate: Date
    type: 'midterm' | 'final' | 'quiz_week'
  }[]
}

export interface ImportedSchedule {
  source: 'manual' | 'csv' | 'json' | 'ical' | 'google_calendar' | 'school_system'
  importDate: Date
  classes: SchoolClass[]
  term: SchoolTerm
  metadata: {
    schoolName?: string
    academicYear?: string
    semester?: string
    totalCredits?: number
  }
}

export interface ScheduleConflict {
  type: 'time_overlap' | 'room_conflict' | 'teacher_conflict' | 'student_overload'
  severity: 'warning' | 'error' | 'critical'
  description: string
  affectedClasses: string[]
  suggestions: string[]
}

export interface StudyTimeSlot {
  day: string
  startTime: string
  endTime: string
  duration: number // minutes
  type: 'free' | 'short_break' | 'lunch_break' | 'study_period'
  recommendedFor: string[] // subjects that work well in this slot
  energy_level: 'high' | 'medium' | 'low'
}

export class SchoolScheduleManager {

  /**
   * Importa un horario escolar desde diferentes fuentes
   */
  static async importSchedule(
    userId: string,
    scheduleData: Partial<ImportedSchedule>,
    source: ImportedSchedule['source'] = 'manual'
  ): Promise<ImportedSchedule> {
    
    // Validar datos de entrada
    const validatedSchedule = this.validateScheduleData(scheduleData)
    
    // Detectar conflictos
    const conflicts = this.detectScheduleConflicts(validatedSchedule.classes)
    
    if (conflicts.some(c => c.severity === 'critical')) {
      throw new Error(`Conflictos críticos detectados: ${conflicts.map(c => c.description).join(', ')}`)
    }

    // Crear objeto de horario importado
    const importedSchedule: ImportedSchedule = {
      source,
      importDate: new Date(),
      classes: validatedSchedule.classes,
      term: validatedSchedule.term || this.createDefaultTerm(),
      metadata: {
        schoolName: validatedSchedule.metadata?.schoolName || 'Unknown School',
        academicYear: validatedSchedule.metadata?.academicYear || new Date().getFullYear().toString(),
        semester: validatedSchedule.metadata?.semester || 'Current Semester',
        totalCredits: this.calculateTotalCredits(validatedSchedule.classes)
      }
    }

    // Actualizar contexto del estudiante
    await this.updateStudentSchedule(userId, importedSchedule)

    // Generar análisis y recomendaciones
    await this.generateScheduleInsights(userId, importedSchedule)

    return importedSchedule
  }

  /**
   * Parsea texto de horario en lenguaje natural
   */
  static parseNaturalLanguageSchedule(text: string): SchoolClass[] {
    const classes: SchoolClass[] = []
    const lines = text.split('\n').filter(line => line.trim().length > 0)

    for (const line of lines) {
      const parsed = this.parseScheduleLine(line)
      if (parsed) {
        classes.push(parsed)
      }
    }

    return classes
  }

  /**
   * Parsea una línea individual de horario
   */
  private static parseScheduleLine(line: string): SchoolClass | null {
    // Patrones para diferentes formatos de horario
    const patterns = [
      // "Lunes 08:00-09:30 Matemáticas Aula 101 Prof. García"
      /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+([^,]+?)(?:\s+(?:aula|salón|lab)\s*(\w+))?\s*(?:prof\.?\s*(.+))?$/i,
      
      // "Matemáticas - Lunes 8:00 AM a 9:30 AM"
      /^([^-]+?)\s*-\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+(\d{1,2}:\d{2})\s*(?:am|pm)?\s*a\s*(\d{1,2}:\d{2})\s*(?:am|pm)?/i,
      
      // "08:00 Matemáticas (Lunes)"
      /^(\d{1,2}:\d{2})\s+([^(]+?)\s*\(\s*(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s*\)/i
    ]

    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        return this.createClassFromMatch(match, pattern)
      }
    }

    return null
  }

  /**
   * Crea un objeto SchoolClass desde una coincidencia de regex
   */
  private static createClassFromMatch(match: RegExpMatchArray, pattern: RegExp): SchoolClass {
    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    // Mapear nombres de días en español a inglés
    const dayMap: { [key: string]: SchoolClass['day'] } = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    }

    // Determinar el formato basado en el patrón
    let day: SchoolClass['day']
    let startTime: string
    let endTime: string
    let subject: string
    let teacher: string | undefined
    let classroom: string | undefined

    if (pattern.source.includes('lunes|martes')) {
      // Formato: "Día Hora-Hora Materia [Aula] [Prof]"
      day = dayMap[match[1].toLowerCase()]
      startTime = this.normalizeTime(match[2])
      endTime = this.normalizeTime(match[3])
      subject = match[4].trim()
      classroom = match[5]
      teacher = match[6]
    } else {
      // Otros formatos - ajustar según necesidad
      day = 'monday' // Default
      startTime = '08:00'
      endTime = '09:00'
      subject = 'Unknown Subject'
    }

    const duration = this.calculateDuration(startTime, endTime)

    return {
      id,
      subject: this.normalizeSubjectName(subject),
      teacher: teacher?.trim(),
      classroom: classroom?.trim(),
      day,
      startTime,
      endTime,
      duration,
      type: this.inferClassType(subject),
      recurring: true,
      notes: `Imported from natural language: "${match[0]}"`
    }
  }

  /**
   * Normaliza el nombre de una materia
   */
  private static normalizeSubjectName(subject: string): string {
    const normalized = subject.trim()
      .replace(/\s+/g, ' ')
      .replace(/^(el|la|los|las)\s+/i, '')
    
    // Capitalizar primera letra de cada palabra
    return normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Infiere el tipo de clase basado en el nombre de la materia
   */
  private static inferClassType(subject: string): SchoolClass['type'] {
    const subjectLower = subject.toLowerCase()
    
    if (subjectLower.includes('lab') || subjectLower.includes('laboratorio')) {
      return 'lab'
    }
    if (subjectLower.includes('taller') || subjectLower.includes('workshop')) {
      return 'workshop'
    }
    if (subjectLower.includes('seminario') || subjectLower.includes('seminar')) {
      return 'seminar'
    }
    if (subjectLower.includes('tutorial') || subjectLower.includes('tutoría')) {
      return 'tutorial'
    }
    
    return 'lecture'
  }

  /**
   * Normaliza formato de hora
   */
  private static normalizeTime(time: string): string {
    // Convertir formatos como "8:00", "08:00", "8", etc. a "08:00"
    const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?/)
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0')
      const minutes = timeMatch[2] || '00'
      return `${hours}:${minutes}`
    }
    return time
  }

  /**
   * Calcula la duración entre dos horas
   */
  private static calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)
    return end - start
  }

  /**
   * Convierte formato HH:MM a minutos desde medianoche
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Detecta conflictos en el horario
   */
  static detectScheduleConflicts(classes: SchoolClass[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []

    // Agrupar clases por día
    const classesByDay = classes.reduce((acc, cls) => {
      if (!acc[cls.day]) acc[cls.day] = []
      acc[cls.day].push(cls)
      return acc
    }, {} as { [day: string]: SchoolClass[] })

    // Detectar solapamientos de tiempo
    for (const [day, dayClasses] of Object.entries(classesByDay)) {
      const sortedClasses = dayClasses.sort((a, b) => 
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
      )

      for (let i = 0; i < sortedClasses.length - 1; i++) {
        const current = sortedClasses[i]
        const next = sortedClasses[i + 1]
        
        const currentEnd = this.timeToMinutes(current.endTime)
        const nextStart = this.timeToMinutes(next.startTime)

        if (currentEnd > nextStart) {
          conflicts.push({
            type: 'time_overlap',
            severity: 'error',
            description: `Solapamiento de clases el ${day}: ${current.subject} (${current.startTime}-${current.endTime}) con ${next.subject} (${next.startTime}-${next.endTime})`,
            affectedClasses: [current.id, next.id],
            suggestions: [
              'Ajustar horarios para evitar solapamiento',
              'Verificar que las horas estén correctas',
              'Considerar modalidad virtual para una de las clases'
            ]
          })
        }
      }
    }

    // Detectar sobrecarga diaria
    for (const [day, dayClasses] of Object.entries(classesByDay)) {
      const totalHours = dayClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60
      
      if (totalHours > 8) {
        conflicts.push({
          type: 'student_overload',
          severity: 'warning',
          description: `Día muy cargado el ${day}: ${totalHours.toFixed(1)} horas de clase`,
          affectedClasses: dayClasses.map(c => c.id),
          suggestions: [
            'Considerar distribuir algunas clases en otros días',
            'Planificar descansos adecuados',
            'Preparar material de estudio con anticipación'
          ]
        })
      }
    }

    return conflicts
  }

  /**
   * Analiza el horario y encuentra slots de tiempo libre para estudio
   */
  static analyzeStudyTimeSlots(classes: SchoolClass[]): StudyTimeSlot[] {
    const studySlots: StudyTimeSlot[] = []
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    for (const day of daysOfWeek) {
      const dayClasses = classes
        .filter(c => c.day === day)
        .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime))

      // Encontrar gaps entre clases
      const gaps = this.findTimeGaps(dayClasses, day)
      studySlots.push(...gaps)
    }

    return studySlots
  }

  /**
   * Encuentra gaps de tiempo entre clases
   */
  private static findTimeGaps(dayClasses: SchoolClass[], day: string): StudyTimeSlot[] {
    const gaps: StudyTimeSlot[] = []
    const dayStart = 7 * 60 // 7:00 AM en minutos
    const dayEnd = 22 * 60  // 10:00 PM en minutos

    if (dayClasses.length === 0) {
      // Día completo libre
      gaps.push({
        day,
        startTime: '08:00',
        endTime: '20:00',
        duration: 12 * 60,
        type: 'free',
        recommendedFor: ['any'],
        energy_level: 'high'
      })
      return gaps
    }

    // Gap antes de la primera clase
    const firstClassStart = this.timeToMinutes(dayClasses[0].startTime)
    if (firstClassStart > dayStart + 60) { // Al menos 1 hora
      gaps.push({
        day,
        startTime: this.minutesToTime(dayStart),
        endTime: dayClasses[0].startTime,
        duration: firstClassStart - dayStart,
        type: 'free',
        recommendedFor: ['review', 'preparation'],
        energy_level: 'high'
      })
    }

    // Gaps entre clases
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const currentEnd = this.timeToMinutes(dayClasses[i].endTime)
      const nextStart = this.timeToMinutes(dayClasses[i + 1].startTime)
      const gapDuration = nextStart - currentEnd

      if (gapDuration >= 30) { // Al menos 30 minutos
        const gapType = this.classifyTimeGap(gapDuration)
        gaps.push({
          day,
          startTime: dayClasses[i].endTime,
          endTime: dayClasses[i + 1].startTime,
          duration: gapDuration,
          type: gapType,
          recommendedFor: this.getRecommendedSubjects(gapDuration, currentEnd),
          energy_level: this.getEnergyLevel(currentEnd)
        })
      }
    }

    // Gap después de la última clase
    const lastClassEnd = this.timeToMinutes(dayClasses[dayClasses.length - 1].endTime)
    if (lastClassEnd < dayEnd - 60) { // Al menos 1 hora
      gaps.push({
        day,
        startTime: dayClasses[dayClasses.length - 1].endTime,
        endTime: this.minutesToTime(dayEnd),
        duration: dayEnd - lastClassEnd,
        type: 'free',
        recommendedFor: ['homework', 'projects', 'review'],
        energy_level: this.getEnergyLevel(lastClassEnd)
      })
    }

    return gaps
  }

  /**
   * Clasifica un gap de tiempo según su duración
   */
  private static classifyTimeGap(duration: number): StudyTimeSlot['type'] {
    if (duration <= 30) return 'short_break'
    if (duration <= 90) return 'study_period'
    if (duration >= 60 && duration <= 120) return 'lunch_break'
    return 'free'
  }

  /**
   * Recomienda materias según la duración y momento del día
   */
  private static getRecommendedSubjects(duration: number, timeInMinutes: number): string[] {
    const hour = Math.floor(timeInMinutes / 60)
    
    if (duration <= 30) {
      return ['review', 'flashcards', 'quick_reading']
    }
    
    if (duration <= 60) {
      return ['homework', 'practice_problems', 'note_review']
    }
    
    if (hour < 12) {
      return ['difficult_subjects', 'mathematics', 'science', 'new_concepts']
    } else if (hour < 15) {
      return ['reading', 'writing', 'research', 'projects']
    } else {
      return ['review', 'practice', 'creative_work', 'group_study']
    }
  }

  /**
   * Determina el nivel de energía según la hora del día
   */
  private static getEnergyLevel(timeInMinutes: number): StudyTimeSlot['energy_level'] {
    const hour = Math.floor(timeInMinutes / 60)
    
    if (hour >= 8 && hour <= 11) return 'high'
    if (hour >= 14 && hour <= 16) return 'high'
    if (hour >= 12 && hour <= 13) return 'low'
    if (hour >= 17 && hour <= 19) return 'medium'
    return 'low'
  }

  /**
   * Convierte minutos desde medianoche a formato HH:MM
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
    const mins = (minutes % 60).toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  /**
   * Valida los datos del horario importado
   */
  private static validateScheduleData(data: Partial<ImportedSchedule>): {
    classes: SchoolClass[]
    term?: SchoolTerm
    metadata?: ImportedSchedule['metadata']
  } {
    if (!data.classes || !Array.isArray(data.classes)) {
      throw new Error('Classes array is required')
    }

    // Validar cada clase
    const validatedClasses = data.classes.map(cls => this.validateClass(cls))

    return {
      classes: validatedClasses,
      term: data.term,
      metadata: data.metadata
    }
  }

  /**
   * Valida una clase individual
   */
  private static validateClass(cls: Partial<SchoolClass>): SchoolClass {
    if (!cls.subject || !cls.day || !cls.startTime || !cls.endTime) {
      throw new Error('Class must have subject, day, startTime, and endTime')
    }

    return {
      id: cls.id || `class_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      subject: cls.subject,
      teacher: cls.teacher,
      classroom: cls.classroom,
      day: cls.day,
      startTime: cls.startTime,
      endTime: cls.endTime,
      duration: cls.duration || this.calculateDuration(cls.startTime, cls.endTime),
      type: cls.type || 'lecture',
      recurring: cls.recurring !== false,
      notes: cls.notes
    }
  }

  /**
   * Crea un término académico por defecto
   */
  private static createDefaultTerm(): SchoolTerm {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Determinar si estamos en primer o segundo semestre
    const isFirstSemester = currentMonth >= 1 && currentMonth <= 6
    const semesterStart = isFirstSemester 
      ? new Date(currentYear, 1, 1)  // Febrero
      : new Date(currentYear, 7, 1)  // Agosto
    
    const semesterEnd = isFirstSemester
      ? new Date(currentYear, 6, 31) // Julio
      : new Date(currentYear, 11, 31) // Diciembre

    return {
      name: `${isFirstSemester ? 'Primer' : 'Segundo'} Semestre ${currentYear}`,
      startDate: semesterStart,
      endDate: semesterEnd,
      holidays: [],
      examPeriods: []
    }
  }

  /**
   * Calcula créditos totales (estimado)
   */
  private static calculateTotalCredits(classes: SchoolClass[]): number {
    // Estimación: 1 crédito por cada 50 minutos de clase semanal
    const totalWeeklyMinutes = classes.reduce((sum, cls) => sum + cls.duration, 0)
    return Math.round(totalWeeklyMinutes / 50)
  }

  /**
   * Actualiza el contexto del estudiante con el nuevo horario
   */
  private static async updateStudentSchedule(
    userId: string, 
    schedule: ImportedSchedule
  ): Promise<void> {
    const context = await StudentContextManager.getContext(userId)
    if (!context) return

    // Convertir clases a formato de calendario académico
    const academicCalendar: AcademicCalendar = {
      schoolSchedule: schedule.classes.map(cls => ({
        subject: cls.subject,
        day: cls.day,
        startTime: cls.startTime,
        endTime: cls.endTime,
        classroom: cls.classroom,
        teacher: cls.teacher
      })),
      examPeriods: schedule.term.examPeriods.map(period => ({
        subject: 'Multiple',
        date: period.startDate,
        startTime: '08:00',
        endTime: '18:00',
        type: period.type as any,
        syllabus: []
      })),
      assignments: [],
      holidays: schedule.term.holidays
    }

    await StudentContextManager.updateContext(userId, {
      academicCalendar
    })
  }

  /**
   * Genera insights y recomendaciones del horario
   */
  private static async generateScheduleInsights(
    userId: string,
    schedule: ImportedSchedule
  ): Promise<void> {
    const studySlots = this.analyzeStudyTimeSlots(schedule.classes)
    const conflicts = this.detectScheduleConflicts(schedule.classes)
    
    // Aquí se pueden generar insights adicionales como:
    // - Mejores momentos para estudiar cada materia
    // - Recomendaciones de horarios de estudio
    // - Alertas sobre días muy cargados
    // - Sugerencias de optimización

    console.log(`Generated ${studySlots.length} study time slots and detected ${conflicts.length} conflicts`)
  }
}