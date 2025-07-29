// Planificador Inteligente de Sesiones de Estudio
// Genera planes de estudio personalizados y adaptativos basados en el contexto del estudiante

import { StudentContext, StudyGoal, SubjectPerformance } from './student-context'
import { StudyTimeSlot } from './school-schedule-manager'

export interface StudySession {
  id: string
  title: string
  subject: string
  topic: string
  date: Date
  startTime: string
  endTime: string
  duration: number // minutes
  type: 'review' | 'practice' | 'new_material' | 'exam_prep' | 'homework' | 'project'
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  techniques: StudyTechnique[]
  materials: StudyMaterial[]
  goals: string[]
  prerequisites?: string[]
  followUp?: string[]
  estimatedFocusLevel: number // 1-10
  energyRequirement: 'low' | 'medium' | 'high'
  environment: 'quiet' | 'moderate' | 'collaborative'
  status: 'planned' | 'in_progress' | 'completed' | 'postponed' | 'cancelled'
  actualDuration?: number
  effectivenessRating?: number // 1-10, filled after session
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface StudyTechnique {
  name: string
  description: string
  duration: number // minutes
  effectiveness: number // 1-10 for this student
  applicableSubjects: string[]
  requiredMaterials: string[]
}

export interface StudyMaterial {
  type: 'textbook' | 'notes' | 'video' | 'practice_problems' | 'flashcards' | 'online_resource'
  name: string
  source?: string
  chapter?: string
  pages?: string
  url?: string
  estimatedTime: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface StudyPlan {
  id: string
  userId: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  totalSessions: number
  completedSessions: number
  subjects: string[]
  goals: StudyGoal[]
  sessions: StudySession[]
  weeklySchedule: {
    [day: string]: StudySession[]
  }
  adaptiveSettings: {
    adjustDifficultyBasedOnPerformance: boolean
    prioritizeWeakSubjects: boolean
    respectEnergyLevels: boolean
    allowFlexibleScheduling: boolean
  }
  metrics: {
    totalPlannedHours: number
    actualStudyHours: number
    averageEffectiveness: number
    goalCompletionRate: number
    subjectBalance: { [subject: string]: number }
  }
  createdAt: Date
  updatedAt: Date
}

export interface PlanningPreferences {
  preferredSessionDuration: number // minutes
  maxSessionsPerDay: number
  breakDurationBetweenSessions: number // minutes
  preferredStudyTimes: string[] // ["08:00", "14:00", ...]
  avoidTimes: string[] // ["12:00", "20:00", ...]
  prioritizeWeakSubjects: boolean
  includeReviewSessions: boolean
  adaptToMood: boolean
  respectSleepSchedule: boolean
}

export class StudySessionPlanner {

  /**
   * Genera un plan de estudio inteligente basado en el contexto del estudiante
   */
  static async generateStudyPlan(
    context: StudentContext,
    planningPeriod: { startDate: Date, endDate: Date },
    preferences: Partial<PlanningPreferences> = {}
  ): Promise<StudyPlan> {
    
    // Configurar preferencias por defecto
    const defaultPreferences: PlanningPreferences = {
      preferredSessionDuration: 45,
      maxSessionsPerDay: 4,
      breakDurationBetweenSessions: 15,
      preferredStudyTimes: context.studyPatterns.patterns.mostProductiveHours,
      avoidTimes: [],
      prioritizeWeakSubjects: true,
      includeReviewSessions: true,
      adaptToMood: true,
      respectSleepSchedule: true,
      ...preferences
    }

    // Analizar necesidades académicas
    const academicNeeds = this.analyzeAcademicNeeds(context)
    
    // Identificar slots de tiempo disponibles
    const availableSlots = this.identifyAvailableTimeSlots(context, planningPeriod)
    
    // Generar sesiones de estudio
    const sessions = await this.generateStudySessions(
      context, 
      academicNeeds, 
      availableSlots, 
      defaultPreferences
    )

    // Optimizar distribución de sesiones
    const optimizedSessions = this.optimizeSessionDistribution(sessions, context)
    
    // Crear plan de estudio
    const studyPlan: StudyPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      userId: context.userId,
      title: this.generatePlanTitle(planningPeriod, academicNeeds),
      description: this.generatePlanDescription(academicNeeds, optimizedSessions.length),
      startDate: planningPeriod.startDate,
      endDate: planningPeriod.endDate,
      totalSessions: optimizedSessions.length,
      completedSessions: 0,
      subjects: [...new Set(optimizedSessions.map(s => s.subject))],
      goals: context.currentGoals,
      sessions: optimizedSessions,
      weeklySchedule: this.organizeSessionsByWeek(optimizedSessions),
      adaptiveSettings: {
        adjustDifficultyBasedOnPerformance: true,
        prioritizeWeakSubjects: defaultPreferences.prioritizeWeakSubjects,
        respectEnergyLevels: true,
        allowFlexibleScheduling: true
      },
      metrics: this.calculatePlanMetrics(optimizedSessions),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return studyPlan
  }

  /**
   * Analiza las necesidades académicas del estudiante
   */
  private static analyzeAcademicNeeds(context: StudentContext): {
    urgentDeadlines: Array<{subject: string, deadline: Date, type: string, preparationNeeded: number}>
    weakSubjects: Array<{subject: string, priority: number, hoursNeeded: number}>
    reviewNeeds: Array<{subject: string, topics: string[], frequency: string}>
    goalBasedNeeds: Array<{goal: StudyGoal, sessionsNeeded: number}>
  } {
    
    // Analizar deadlines urgentes
    const urgentDeadlines = context.subjectPerformances
      .flatMap(subject => 
        subject.upcomingDeadlines
          .filter(deadline => {
            const daysUntil = Math.ceil((deadline.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return daysUntil <= 14 && deadline.preparationStatus !== 'ready'
          })
          .map(deadline => ({
            subject: subject.subject,
            deadline: deadline.date,
            type: deadline.type,
            preparationNeeded: this.estimatePreparationHours(deadline.type, subject.difficultyLevel)
          }))
      )
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

    // Identificar materias débiles
    const weakSubjects = context.subjectPerformances
      .filter(subject => subject.averageGrade < 75 || subject.weakTopics.length > 0)
      .map(subject => ({
        subject: subject.subject,
        priority: this.calculateSubjectPriority(subject),
        hoursNeeded: this.estimateImprovementHours(subject)
      }))
      .sort((a, b) => b.priority - a.priority)

    // Determinar necesidades de repaso
    const reviewNeeds = context.subjectPerformances
      .map(subject => ({
        subject: subject.subject,
        topics: subject.strongTopics,
        frequency: this.determineReviewFrequency(subject)
      }))
      .filter(review => review.topics.length > 0)

    // Analizar objetivos
    const goalBasedNeeds = context.currentGoals
      .filter(goal => goal.progress < 100)
      .map(goal => ({
        goal,
        sessionsNeeded: this.estimateSessionsForGoal(goal)
      }))

    return { urgentDeadlines, weakSubjects, reviewNeeds, goalBasedNeeds }
  }

  /**
   * Identifica slots de tiempo disponibles para estudio
   */
  private static identifyAvailableTimeSlots(
    context: StudentContext, 
    period: { startDate: Date, endDate: Date }
  ): StudyTimeSlot[] {
    const slots: StudyTimeSlot[] = []
    const currentDate = new Date(period.startDate)
    
    while (currentDate <= period.endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate)
      
      // Obtener clases del día
      const dayClasses = context.academicCalendar.schoolSchedule
        .filter(schedule => schedule.day === dayOfWeek)
      
      // Generar slots basándose en el horario escolar y preferencias
      const daySlots = this.generateDaySlots(dayOfWeek, dayClasses, context)
      
      // Agregar fecha específica a cada slot
      daySlots.forEach(slot => {
        slots.push({
          ...slot,
          day: currentDate.toISOString().split('T')[0] // YYYY-MM-DD format
        })
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return slots
  }

  /**
   * Genera sesiones de estudio basadas en necesidades y slots disponibles
   */
  private static async generateStudySessions(
    context: StudentContext,
    needs: ReturnType<typeof this.analyzeAcademicNeeds>,
    availableSlots: StudyTimeSlot[],
    preferences: PlanningPreferences
  ): Promise<StudySession[]> {
    
    const sessions: StudySession[] = []
    let slotIndex = 0

    // 1. Crear sesiones para deadlines urgentes (prioridad máxima)
    for (const deadline of needs.urgentDeadlines) {
      const sessionsNeeded = Math.ceil(deadline.preparationNeeded / (preferences.preferredSessionDuration / 60))
      
      for (let i = 0; i < sessionsNeeded && slotIndex < availableSlots.length; i++) {
        const slot = availableSlots[slotIndex++]
        
        sessions.push(this.createStudySession({
          slot,
          subject: deadline.subject,
          type: 'exam_prep',
          priority: 'urgent',
          topic: `Preparación para ${deadline.type}`,
          deadline: deadline.deadline,
          preferences
        }))
      }
    }

    // 2. Crear sesiones para materias débiles
    for (const weakSubject of needs.weakSubjects) {
      const sessionsNeeded = Math.ceil(weakSubject.hoursNeeded / (preferences.preferredSessionDuration / 60))
      
      for (let i = 0; i < sessionsNeeded && slotIndex < availableSlots.length; i++) {
        const slot = availableSlots[slotIndex++]
        
        sessions.push(this.createStudySession({
          slot,
          subject: weakSubject.subject,
          type: 'practice',
          priority: 'high',
          topic: 'Refuerzo de conceptos débiles',
          preferences
        }))
      }
    }

    // 3. Crear sesiones de repaso
    if (preferences.includeReviewSessions) {
      for (const review of needs.reviewNeeds) {
        const reviewSession = this.createReviewSession(review, availableSlots[slotIndex++], preferences)
        if (reviewSession) {
          sessions.push(reviewSession)
        }
      }
    }

    // 4. Crear sesiones para objetivos específicos
    for (const goalNeed of needs.goalBasedNeeds) {
      for (let i = 0; i < goalNeed.sessionsNeeded && slotIndex < availableSlots.length; i++) {
        const slot = availableSlots[slotIndex++]
        
        sessions.push(this.createGoalBasedSession(goalNeed.goal, slot, preferences))
      }
    }

    return sessions
  }

  /**
   * Crea una sesión de estudio individual
   */
  private static createStudySession(params: {
    slot: StudyTimeSlot
    subject: string
    type: StudySession['type']
    priority: StudySession['priority']
    topic: string
    deadline?: Date
    preferences: PlanningPreferences
  }): StudySession {
    
    const { slot, subject, type, priority, topic, preferences } = params
    const duration = Math.min(slot.duration, preferences.preferredSessionDuration)
    
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      title: `${subject}: ${topic}`,
      subject,
      topic,
      date: new Date(slot.day),
      startTime: slot.startTime,
      endTime: this.addMinutesToTime(slot.startTime, duration),
      duration,
      type,
      difficulty: this.inferDifficulty(type, subject),
      priority,
      techniques: this.selectStudyTechniques(type, subject, duration),
      materials: this.selectStudyMaterials(subject, type),
      goals: [topic],
      estimatedFocusLevel: this.estimateFocusLevel(slot.energy_level, type),
      energyRequirement: this.mapEnergyLevel(slot.energy_level),
      environment: slot.type === 'free' ? 'quiet' : 'moderate',
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Optimiza la distribución de sesiones para evitar sobrecarga
   */
  private static optimizeSessionDistribution(
    sessions: StudySession[], 
    context: StudentContext
  ): StudySession[] {
    
    // Agrupar sesiones por día
    const sessionsByDay = sessions.reduce((acc, session) => {
      const dateKey = session.date.toISOString().split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(session)
      return acc
    }, {} as { [date: string]: StudySession[] })

    // Optimizar cada día
    const optimizedSessions: StudySession[] = []
    
    for (const [date, daySessions] of Object.entries(sessionsByDay)) {
      // Limitar sesiones por día según preferencias
      const maxSessions = context.learningStyle.preferences.sessionDuration === 'long' ? 2 : 4
      const prioritizedSessions = daySessions
        .sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority))
        .slice(0, maxSessions)
      
      // Balancear dificultad a lo largo del día
      const balancedSessions = this.balanceSessionDifficulty(prioritizedSessions)
      
      optimizedSessions.push(...balancedSessions)
    }

    return optimizedSessions
  }

  /**
   * Organiza sesiones por semana para el plan
   */
  private static organizeSessionsByWeek(sessions: StudySession[]): { [day: string]: StudySession[] } {
    return sessions.reduce((acc, session) => {
      const dayKey = session.date.toLocaleDateString('es-ES', { weekday: 'long' })
      if (!acc[dayKey]) acc[dayKey] = []
      acc[dayKey].push(session)
      return acc
    }, {} as { [day: string]: StudySession[] })
  }

  /**
   * Calcula métricas del plan de estudio
   */
  private static calculatePlanMetrics(sessions: StudySession[]): StudyPlan['metrics'] {
    const totalHours = sessions.reduce((sum, session) => sum + session.duration, 0) / 60
    
    const subjectBalance = sessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration / 60
      return acc
    }, {} as { [subject: string]: number })

    return {
      totalPlannedHours: totalHours,
      actualStudyHours: 0, // Se actualizará conforme se completen sesiones
      averageEffectiveness: 0, // Se calculará con feedback
      goalCompletionRate: 0, // Se actualizará con progreso
      subjectBalance
    }
  }

  // Funciones auxiliares
  
  private static estimatePreparationHours(type: string, difficultyLevel: number): number {
    const baseHours = {
      'exam': 8,
      'assignment': 4,
      'project': 12,
      'quiz': 2
    }
    return (baseHours[type as keyof typeof baseHours] || 4) * (difficultyLevel / 5)
  }

  private static calculateSubjectPriority(subject: SubjectPerformance): number {
    let priority = 0
    
    // Prioridad basada en calificación
    if (subject.averageGrade < 60) priority += 10
    else if (subject.averageGrade < 70) priority += 7
    else if (subject.averageGrade < 80) priority += 5
    
    // Prioridad basada en temas débiles
    priority += subject.weakTopics.length * 2
    
    // Prioridad basada en próximos deadlines
    priority += subject.upcomingDeadlines.length * 3
    
    // Prioridad basada en tiempo sin estudiar
    const daysSinceLastStudy = Math.floor((Date.now() - subject.lastStudied.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastStudy > 7) priority += 5
    
    return priority
  }

  private static estimateImprovementHours(subject: SubjectPerformance): number {
    const gradeGap = Math.max(0, 80 - subject.averageGrade) // Objetivo: llegar a 80
    const weakTopicsHours = subject.weakTopics.length * 2
    const difficultyMultiplier = subject.difficultyLevel / 5
    
    return (gradeGap * 0.5 + weakTopicsHours) * difficultyMultiplier
  }

  private static determineReviewFrequency(subject: SubjectPerformance): string {
    if (subject.averageGrade > 90) return 'monthly'
    if (subject.averageGrade > 80) return 'biweekly'
    return 'weekly'
  }

  private static estimateSessionsForGoal(goal: StudyGoal): number {
    const remainingProgress = 100 - goal.progress
    const complexity = goal.milestones.length
    return Math.ceil((remainingProgress / 100) * complexity * 2)
  }

  private static getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  private static generateDaySlots(
    dayOfWeek: string, 
    dayClasses: any[], 
    context: StudentContext
  ): StudyTimeSlot[] {
    // Esta función generaría slots de estudio basándose en el horario de clases
    // Por simplicidad, retornamos slots básicos
    const basicSlots: StudyTimeSlot[] = [
      {
        day: dayOfWeek,
        startTime: '08:00',
        endTime: '10:00',
        duration: 120,
        type: 'free',
        recommendedFor: ['review'],
        energy_level: 'high'
      },
      {
        day: dayOfWeek,
        startTime: '14:00',
        endTime: '16:00',
        duration: 120,
        type: 'free',
        recommendedFor: ['practice'],
        energy_level: 'high'
      },
      {
        day: dayOfWeek,
        startTime: '19:00',
        endTime: '21:00',
        duration: 120,
        type: 'free',
        recommendedFor: ['homework'],
        energy_level: 'medium'
      }
    ]

    return basicSlots
  }

  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  private static inferDifficulty(type: StudySession['type'], subject: string): StudySession['difficulty'] {
    if (type === 'exam_prep' || type === 'new_material') return 'hard'
    if (type === 'practice' || type === 'homework') return 'medium'
    return 'easy'
  }

  private static selectStudyTechniques(type: StudySession['type'], subject: string, duration: number): StudyTechnique[] {
    // Retornar técnicas apropiadas según el tipo de sesión
    const techniques: StudyTechnique[] = []
    
    if (duration >= 45) {
      techniques.push({
        name: 'Pomodoro Technique',
        description: '25 min estudio + 5 min descanso',
        duration: 30,
        effectiveness: 8,
        applicableSubjects: ['any'],
        requiredMaterials: ['timer']
      })
    }

    return techniques
  }

  private static selectStudyMaterials(subject: string, type: StudySession['type']): StudyMaterial[] {
    // Retornar materiales apropiados
    return [
      {
        type: 'textbook',
        name: `Libro de ${subject}`,
        estimatedTime: 30,
        difficulty: 'intermediate'
      }
    ]
  }

  private static estimateFocusLevel(energyLevel: StudyTimeSlot['energy_level'], type: StudySession['type']): number {
    const energyMap = { high: 9, medium: 7, low: 5 }
    const typeMap = { exam_prep: 9, new_material: 8, practice: 7, review: 6, homework: 5, project: 8 }
    
    return Math.min(10, (energyMap[energyLevel] + typeMap[type]) / 2)
  }

  private static mapEnergyLevel(level: StudyTimeSlot['energy_level']): StudySession['energyRequirement'] {
    return level as StudySession['energyRequirement']
  }

  private static priorityWeight(priority: StudySession['priority']): number {
    const weights = { urgent: 4, high: 3, medium: 2, low: 1 }
    return weights[priority]
  }

  private static balanceSessionDifficulty(sessions: StudySession[]): StudySession[] {
    // Ordenar para alternar dificultades cuando sea posible
    return sessions.sort((a, b) => {
      if (a.difficulty === 'hard' && b.difficulty === 'easy') return -1
      if (a.difficulty === 'easy' && b.difficulty === 'hard') return 1
      return 0
    })
  }

  private static generatePlanTitle(period: { startDate: Date, endDate: Date }, needs: any): string {
    const duration = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))
    return `Plan de Estudio - ${duration} días`
  }

  private static generatePlanDescription(needs: any, sessionCount: number): string {
    return `Plan personalizado con ${sessionCount} sesiones de estudio, enfocado en ${needs.urgentDeadlines.length} deadlines urgentes y ${needs.weakSubjects.length} materias por reforzar.`
  }

  private static createReviewSession(review: any, slot: StudyTimeSlot, preferences: PlanningPreferences): StudySession | null {
    if (!slot) return null

    return this.createStudySession({
      slot,
      subject: review.subject,
      type: 'review',
      priority: 'medium',
      topic: `Repaso de ${review.topics.slice(0, 2).join(', ')}`,
      preferences
    })
  }

  private static createGoalBasedSession(goal: StudyGoal, slot: StudyTimeSlot, preferences: PlanningPreferences): StudySession {
    return this.createStudySession({
      slot,
      subject: goal.subject || 'General',
      type: 'project',
      priority: goal.priority === 'urgent' ? 'urgent' : 'high',
      topic: goal.title,
      preferences
    })
  }
}