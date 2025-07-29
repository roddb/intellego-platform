// Sistema de Contexto Persistente del Estudiante
// Permite a la IA Tutora mantener información contextual y personalizada

export interface LearningStyle {
  primary: 'visual' | 'auditory' | 'kinesthetic' | 'analytical'
  secondary?: 'visual' | 'auditory' | 'kinesthetic' | 'analytical'
  preferences: {
    studyTimePreference: 'morning' | 'afternoon' | 'evening' | 'night'
    sessionDuration: 'short' | 'medium' | 'long' // 25min, 45min, 90min
    breakFrequency: 'frequent' | 'moderate' | 'minimal'
    difficultyProgression: 'gradual' | 'moderate' | 'steep'
  }
}

export interface SubjectPerformance {
  subject: string
  averageGrade: number // 0-100
  difficultyLevel: number // 1-10
  timeSpentWeekly: number // hours
  lastStudied: Date
  strongTopics: string[]
  weakTopics: string[]
  preferredStudyMethods: string[]
  upcomingDeadlines: {
    type: 'exam' | 'assignment' | 'project'
    date: Date
    description: string
    preparationStatus: 'not_started' | 'in_progress' | 'almost_ready' | 'ready'
  }[]
}

export interface StudyGoal {
  id: string
  title: string
  subject?: string
  targetDate: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number // 0-100
  milestones: {
    description: string
    completed: boolean
    dueDate?: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface SchedulePreference {
  preferredStudyTimes: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    timeSlots: {
      start: string // "14:00"
      end: string   // "16:00"
      priority: 'high' | 'medium' | 'low'
    }[]
  }[]
  unavailableTimes: {
    recurring: {
      day: string
      start: string
      end: string
      reason: string
    }[]
    specific: {
      date: Date
      start: string
      end: string
      reason: string
    }[]
  }
  studyEnvironment: {
    location: 'home' | 'library' | 'cafe' | 'school' | 'other'
    requiresQuiet: boolean
    allowsDigitalDevices: boolean
    preferredLighting: 'bright' | 'moderate' | 'dim'
  }
}

export interface AcademicCalendar {
  schoolSchedule: {
    subject: string
    day: string
    startTime: string
    endTime: string
    classroom?: string
    teacher?: string
  }[]
  examPeriods: {
    subject: string
    date: Date
    startTime: string
    endTime: string
    type: 'parcial' | 'final' | 'quiz' | 'oral'
    syllabus?: string[]
  }[]
  assignments: {
    id: string
    subject: string
    title: string
    dueDate: Date
    type: 'homework' | 'project' | 'essay' | 'presentation'
    estimatedHours: number
    status: 'pending' | 'in_progress' | 'submitted'
  }[]
  holidays: {
    name: string
    startDate: Date
    endDate: Date
  }[]
}

export interface StudyPattern {
  userId: string
  patterns: {
    mostProductiveHours: string[] // ["14:00", "15:00", "16:00"]
    averageSessionDuration: number // minutes
    preferredBreakDuration: number // minutes
    bestPerformingSubjects: string[]
    strugglingSubjects: string[]
    procrastinationTriggers: string[]
    motivationalFactors: string[]
  }
  weeklyStats: {
    totalStudyHours: number
    subjectDistribution: { [subject: string]: number }
    goalCompletionRate: number
    averageFocusScore: number // 1-10
  }
  lastUpdated: Date
}

export interface StudentContext {
  userId: string
  academicInfo: {
    grade: string
    school: string
    academicYear: string
    specialization?: string
  }
  learningStyle: LearningStyle
  subjectPerformances: SubjectPerformance[]
  currentGoals: StudyGoal[]
  schedulePreferences: SchedulePreference
  academicCalendar: AcademicCalendar
  studyPatterns: StudyPattern
  preferences: {
    communicationStyle: 'formal' | 'casual' | 'friendly'
    motivationLevel: 'low' | 'medium' | 'high'
    feedbackPreference: 'direct' | 'gentle' | 'encouraging'
    reminderFrequency: 'minimal' | 'moderate' | 'frequent'
  }
  lastInteraction: Date
  createdAt: Date
  updatedAt: Date
}

// Clase para gestionar el contexto del estudiante
export class StudentContextManager {
  private static contexts: Map<string, StudentContext> = new Map()

  static async getContext(userId: string): Promise<StudentContext | null> {
    // Primero intentar obtener de memoria
    if (this.contexts.has(userId)) {
      return this.contexts.get(userId)!
    }

    // Intentar cargar desde almacenamiento persistente
    try {
      const stored = await this.loadFromStorage(userId)
      if (stored) {
        this.contexts.set(userId, stored)
        return stored
      }
    } catch (error) {
      console.error('Error loading student context:', error)
    }

    return null
  }

  static async createDefaultContext(userId: string, basicInfo?: Partial<StudentContext>): Promise<StudentContext> {
    const defaultContext: StudentContext = {
      userId,
      academicInfo: {
        grade: basicInfo?.academicInfo?.grade || '10th Grade',
        school: basicInfo?.academicInfo?.school || 'Unknown School',
        academicYear: new Date().getFullYear().toString(),
        specialization: basicInfo?.academicInfo?.specialization
      },
      learningStyle: {
        primary: 'analytical',
        preferences: {
          studyTimePreference: 'afternoon',
          sessionDuration: 'medium',
          breakFrequency: 'moderate',
          difficultyProgression: 'gradual'
        }
      },
      subjectPerformances: [],
      currentGoals: [],
      schedulePreferences: {
        preferredStudyTimes: [],
        unavailableTimes: { recurring: [], specific: [] },
        studyEnvironment: {
          location: 'home',
          requiresQuiet: true,
          allowsDigitalDevices: true,
          preferredLighting: 'moderate'
        }
      },
      academicCalendar: {
        schoolSchedule: [],
        examPeriods: [],
        assignments: [],
        holidays: []
      },
      studyPatterns: {
        userId,
        patterns: {
          mostProductiveHours: ['14:00', '15:00', '16:00'],
          averageSessionDuration: 45,
          preferredBreakDuration: 10,
          bestPerformingSubjects: [],
          strugglingSubjects: [],
          procrastinationTriggers: [],
          motivationalFactors: []
        },
        weeklyStats: {
          totalStudyHours: 0,
          subjectDistribution: {},
          goalCompletionRate: 0,
          averageFocusScore: 5
        },
        lastUpdated: new Date()
      },
      preferences: {
        communicationStyle: 'friendly',
        motivationLevel: 'medium',
        feedbackPreference: 'encouraging',
        reminderFrequency: 'moderate'
      },
      lastInteraction: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.contexts.set(userId, defaultContext)
    await this.saveToStorage(userId, defaultContext)
    return defaultContext
  }

  static async updateContext(userId: string, updates: Partial<StudentContext>): Promise<StudentContext> {
    let context = await this.getContext(userId)
    
    if (!context) {
      context = await this.createDefaultContext(userId)
    }

    const updatedContext: StudentContext = {
      ...context,
      ...updates,
      userId, // Ensure userId is preserved
      updatedAt: new Date(),
      lastInteraction: new Date()
    }

    this.contexts.set(userId, updatedContext)
    await this.saveToStorage(userId, updatedContext)
    return updatedContext
  }

  static async updateSubjectPerformance(userId: string, subject: string, performance: Partial<SubjectPerformance>): Promise<void> {
    const context = await this.getContext(userId)
    if (!context) return

    const existingIndex = context.subjectPerformances.findIndex(p => p.subject === subject)
    
    if (existingIndex >= 0) {
      context.subjectPerformances[existingIndex] = {
        ...context.subjectPerformances[existingIndex],
        ...performance,
        subject
      }
    } else {
      context.subjectPerformances.push({
        subject,
        averageGrade: 0,
        difficultyLevel: 5,
        timeSpentWeekly: 0,
        lastStudied: new Date(),
        strongTopics: [],
        weakTopics: [],
        preferredStudyMethods: [],
        upcomingDeadlines: [],
        ...performance
      })
    }

    await this.updateContext(userId, { subjectPerformances: context.subjectPerformances })
  }

  static async addGoal(userId: string, goal: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyGoal> {
    const context = await this.getContext(userId)
    if (!context) throw new Error('User context not found')

    const newGoal: StudyGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    context.currentGoals.push(newGoal)
    await this.updateContext(userId, { currentGoals: context.currentGoals })
    return newGoal
  }

  static async updateStudyPattern(userId: string, sessionData: {
    subject: string
    duration: number
    focusScore: number
    startTime: string
  }): Promise<void> {
    const context = await this.getContext(userId)
    if (!context) return

    // Update patterns based on session data
    const patterns = context.studyPatterns.patterns
    const hour = sessionData.startTime.split(':')[0] + ':00'
    
    if (!patterns.mostProductiveHours.includes(hour)) {
      patterns.mostProductiveHours.push(hour)
    }

    // Update weekly stats
    const stats = context.studyPatterns.weeklyStats
    stats.totalStudyHours += sessionData.duration / 60
    stats.subjectDistribution[sessionData.subject] = 
      (stats.subjectDistribution[sessionData.subject] || 0) + sessionData.duration / 60
    
    stats.averageFocusScore = 
      (stats.averageFocusScore + sessionData.focusScore) / 2

    context.studyPatterns.lastUpdated = new Date()
    await this.updateContext(userId, { studyPatterns: context.studyPatterns })
  }

  // Storage methods (simplified for demo - in production would use database)
  private static async loadFromStorage(userId: string): Promise<StudentContext | null> {
    try {
      // In a real implementation, this would load from database
      // For now, we'll use localStorage as a simple persistence layer
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`student_context_${userId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Convert date strings back to Date objects
          parsed.lastInteraction = new Date(parsed.lastInteraction)
          parsed.createdAt = new Date(parsed.createdAt)
          parsed.updatedAt = new Date(parsed.updatedAt)
          return parsed
        }
      }
    } catch (error) {
      console.error('Error loading context from storage:', error)
    }
    return null
  }

  private static async saveToStorage(userId: string, context: StudentContext): Promise<void> {
    try {
      // In a real implementation, this would save to database
      // For now, we'll use localStorage as a simple persistence layer
      if (typeof window !== 'undefined') {
        localStorage.setItem(`student_context_${userId}`, JSON.stringify(context))
      }
    } catch (error) {
      console.error('Error saving context to storage:', error)
    }
  }

  // Utility methods for analysis
  static analyzeStudentNeeds(context: StudentContext): {
    urgentTasks: string[]
    recommendations: string[]
    riskAreas: string[]
    strengths: string[]
  } {
    const urgentTasks: string[] = []
    const recommendations: string[] = []
    const riskAreas: string[] = []
    const strengths: string[] = []

    // Analyze upcoming deadlines
    context.subjectPerformances.forEach(subject => {
      subject.upcomingDeadlines.forEach(deadline => {
        const daysUntil = Math.ceil((deadline.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 3 && deadline.preparationStatus !== 'ready') {
          urgentTasks.push(`${deadline.type} de ${subject.subject} en ${daysUntil} días`)
        }
      })

      // Identify struggling subjects
      if (subject.averageGrade < 70) {
        riskAreas.push(`Rendimiento bajo en ${subject.subject} (${subject.averageGrade}%)`)
        recommendations.push(`Programar sesiones adicionales de ${subject.subject}`)
      }

      // Identify strengths
      if (subject.averageGrade > 85) {
        strengths.push(`Excelente rendimiento en ${subject.subject}`)
      }
    })

    // Analyze study patterns
    if (context.studyPatterns.weeklyStats.totalStudyHours < 10) {
      riskAreas.push('Pocas horas de estudio semanal')
      recommendations.push('Incrementar tiempo de estudio gradualmente')
    }

    return { urgentTasks, recommendations, riskAreas, strengths }
  }
}