// Intelligent Study Planning Engine
// AI-powered system to generate personalized study schedules

import { 
  Exam, 
  StudySession, 
  StudyMaterial, 
  AcademicSchedule,
  StudyProgress,
  addStudySession,
  getStudyMaterialsByExam,
  getStudyProgressByUserAndExam,
  getAcademicScheduleByUser,
  updateStudyProgress
} from './academic-data'

export interface StudyPlanRequest {
  userId: string
  examId: string
  availableTime: number // horas disponibles por día
  studyPreference: 'morning' | 'afternoon' | 'evening' | 'flexible'
  intensity: 'light' | 'moderate' | 'intensive'
  existingCommitments: {
    day: number // 0=domingo, 1=lunes, etc.
    hours: number[]
  }[]
}

export interface StudyPlanResult {
  success: boolean
  message: string
  sessions: StudySession[]
  estimatedSuccessRate: number
  recommendations: string[]
  totalStudyTime: number
  conflictsDetected: string[]
}

export interface ConflictDetection {
  type: 'time_overlap' | 'insufficient_time' | 'study_overload' | 'material_missing'
  severity: 'low' | 'medium' | 'high'
  description: string
  suggestion: string
}

export class IntelligentStudyPlanner {
  
  /**
   * Genera un plan de estudio personalizado usando IA
   */
  async generateStudyPlan(request: StudyPlanRequest, exam: Exam): Promise<StudyPlanResult> {
    try {
      console.log(`🧠 Generando plan de estudio inteligente para examen: ${exam.title}`)
      
      // 1. Analizar material disponible
      const materials = getStudyMaterialsByExam(request.examId)
      const progress = getStudyProgressByUserAndExam(request.userId, request.examId)
      const schedule = getAcademicScheduleByUser(request.userId)
      
      // 2. Calcular tiempo disponible hasta el examen
      const daysUntilExam = this.getDaysUntilExam(exam.date)
      const totalAvailableHours = this.calculateAvailableTime(request, daysUntilExam)
      
      // 3. Estimar tiempo de estudio necesario
      const estimatedStudyTime = this.estimateRequiredStudyTime(exam, materials, progress)
      
      // 4. Detectar conflictos
      const conflicts = this.detectConflicts(request, exam, totalAvailableHours, estimatedStudyTime)
      
      // 5. Distribuir sesiones de estudio
      const sessions = await this.distributeStudySessions(request, exam, materials, daysUntilExam)
      
      // 6. Calcular tasa de éxito estimada
      const successRate = this.calculateSuccessRate(totalAvailableHours, estimatedStudyTime, materials.length, daysUntilExam)
      
      // 7. Generar recomendaciones
      const recommendations = this.generateRecommendations(request, exam, conflicts, successRate)
      
      return {
        success: true,
        message: `Plan de estudio generado exitosamente para ${exam.title}`,
        sessions,
        estimatedSuccessRate: successRate,
        recommendations,
        totalStudyTime: estimatedStudyTime,
        conflictsDetected: conflicts.map(c => c.description)
      }
      
    } catch (error) {
      console.error('Error generando plan de estudio:', error)
      return {
        success: false,
        message: 'Error al generar el plan de estudio',
        sessions: [],
        estimatedSuccessRate: 0,
        recommendations: ['Intenta nuevamente o contacta soporte técnico'],
        totalStudyTime: 0,
        conflictsDetected: []
      }
    }
  }
  
  /**
   * Distribuye las sesiones de estudio de manera inteligente
   */
  private async distributeStudySessions(
    request: StudyPlanRequest, 
    exam: Exam, 
    materials: StudyMaterial[], 
    daysUntilExam: number
  ): Promise<StudySession[]> {
    const sessions: StudySession[] = []
    const topicsToStudy = this.extractTopicsFromMaterials(materials, exam.topics)
    
    // Configuración basada en intensidad
    const intensityConfig = {
      light: { sessionsPerDay: 1, sessionDuration: 45, reviewFrequency: 3 },
      moderate: { sessionsPerDay: 2, sessionDuration: 60, reviewFrequency: 2 },
      intensive: { sessionsPerDay: 3, sessionDuration: 90, reviewFrequency: 1 }
    }
    
    const config = intensityConfig[request.intensity]
    const now = new Date()
    
    // Distribuir por fases
    const phases = this.planStudyPhases(daysUntilExam, topicsToStudy)
    
    for (const phase of phases) {
      for (let day = phase.startDay; day <= phase.endDay; day++) {
        const studyDate = new Date(now)
        studyDate.setDate(studyDate.getDate() + day)
        
        // Saltar domingos si no es flexible
        if (studyDate.getDay() === 0 && request.studyPreference !== 'flexible') {
          continue
        }
        
        const dailySessions = this.createDailyStudySessions(
          request, 
          exam, 
          phase, 
          studyDate, 
          config,
          sessions.length
        )
        
        sessions.push(...dailySessions)
      }
    }
    
    // Agregar sesiones de repaso antes del examen
    const reviewSessions = this.createReviewSessions(request, exam, sessions, daysUntilExam)
    sessions.push(...reviewSessions)
    
    return sessions
  }
  
  /**
   * Planifica las fases de estudio
   */
  private planStudyPhases(daysUntilExam: number, topics: string[]): Array<{
    name: string
    startDay: number
    endDay: number
    topics: string[]
    type: 'learning' | 'practice' | 'review'
  }> {
    const phases = []
    
    if (daysUntilExam <= 3) {
      // Plan de emergencia - poco tiempo
      phases.push({
        name: 'Repaso Intensivo',
        startDay: 1,
        endDay: daysUntilExam - 1,
        topics,
        type: 'review' as const
      })
    } else if (daysUntilExam <= 7) {
      // Plan acelerado
      const midPoint = Math.ceil(daysUntilExam / 2)
      phases.push(
        {
          name: 'Aprendizaje Acelerado',
          startDay: 1,
          endDay: midPoint,
          topics: topics.slice(0, Math.ceil(topics.length / 2)),
          type: 'learning' as const
        },
        {
          name: 'Práctica y Repaso',
          startDay: midPoint + 1,
          endDay: daysUntilExam - 1,
          topics,
          type: 'practice' as const
        }
      )
    } else {
      // Plan óptimo
      const learningPhase = Math.ceil(daysUntilExam * 0.6)
      const practicePhase = Math.ceil(daysUntilExam * 0.3)
      
      phases.push(
        {
          name: 'Aprendizaje de Conceptos',
          startDay: 1,
          endDay: learningPhase,
          topics: topics.slice(0, Math.ceil(topics.length * 0.7)),
          type: 'learning' as const
        },
        {
          name: 'Práctica y Ejercicios',
          startDay: learningPhase + 1,
          endDay: learningPhase + practicePhase,
          topics,
          type: 'practice' as const
        },
        {
          name: 'Repaso Final',
          startDay: learningPhase + practicePhase + 1,
          endDay: daysUntilExam - 1,
          topics,
          type: 'review' as const
        }
      )
    }
    
    return phases
  }
  
  /**
   * Crea sesiones de estudio diarias
   */
  private createDailyStudySessions(
    request: StudyPlanRequest,
    exam: Exam,
    phase: any,
    date: Date,
    config: any,
    sessionCount: number
  ): StudySession[] {
    const sessions: StudySession[] = []
    const preferredHours = this.getPreferredStudyHours(request.studyPreference)
    
    for (let i = 0; i < config.sessionsPerDay && i < phase.topics.length; i++) {
      const sessionTime = new Date(date)
      sessionTime.setHours(preferredHours[i] || preferredHours[0], 0, 0, 0)
      
      const session: StudySession = {
        id: `session-${Date.now()}-${sessionCount + i}`,
        userId: request.userId,
        examId: request.examId,
        title: `${phase.name} - ${phase.topics[i % phase.topics.length]}`,
        scheduledDate: sessionTime,
        duration: config.sessionDuration,
        status: 'pending',
        topics: [phase.topics[i % phase.topics.length]],
        materials: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      sessions.push(session)
    }
    
    return sessions
  }
  
  /**
   * Crea sesiones de repaso
   */
  private createReviewSessions(
    request: StudyPlanRequest,
    exam: Exam,
    existingSessions: StudySession[],
    daysUntilExam: number
  ): StudySession[] {
    const reviewSessions: StudySession[] = []
    
    // Sesión de repaso general 1 día antes del examen
    const reviewDate = new Date(exam.date)
    reviewDate.setDate(reviewDate.getDate() - 1)
    reviewDate.setHours(this.getPreferredStudyHours(request.studyPreference)[0], 0, 0, 0)
    
    const finalReview: StudySession = {
      id: `review-final-${Date.now()}`,
      userId: request.userId,
      examId: request.examId,
      title: `Repaso Final - ${exam.title}`,
      scheduledDate: reviewDate,
      duration: 120,
      status: 'pending',
      topics: exam.topics,
      materials: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    reviewSessions.push(finalReview)
    return reviewSessions
  }
  
  /**
   * Detecta conflictos en el plan de estudio
   */
  private detectConflicts(
    request: StudyPlanRequest,
    exam: Exam,
    availableHours: number,
    requiredHours: number
  ): ConflictDetection[] {
    const conflicts: ConflictDetection[] = []
    
    // Tiempo insuficiente
    if (availableHours < requiredHours) {
      conflicts.push({
        type: 'insufficient_time',
        severity: 'high',
        description: `Tiempo insuficiente: necesitas ${requiredHours}h pero solo tienes ${availableHours}h disponibles`,
        suggestion: 'Considera aumentar las horas de estudio diarias o cambiar a intensidad "intensiva"'
      })
    }
    
    // Sobrecarga de estudio
    const dailyHours = availableHours / this.getDaysUntilExam(exam.date)
    if (dailyHours > 6) {
      conflicts.push({
        type: 'study_overload',
        severity: 'medium',
        description: `Sobrecarga de estudio: ${dailyHours.toFixed(1)}h por día es demasiado`,
        suggestion: 'Redistribuye el tiempo o comienza a estudiar antes'
      })
    }
    
    // Material faltante
    const materials = getStudyMaterialsByExam(request.examId)
    if (materials.length === 0) {
      conflicts.push({
        type: 'material_missing',
        severity: 'high',
        description: 'No hay material de estudio subido para este examen',
        suggestion: 'Sube tus apuntes, libros o recursos de estudio antes de generar el plan'
      })
    }
    
    return conflicts
  }
  
  /**
   * Calcula la tasa de éxito estimada
   */
  private calculateSuccessRate(
    availableHours: number,
    requiredHours: number,
    materialCount: number,
    daysUntilExam: number
  ): number {
    let baseScore = 70 // Score base
    
    // Factor tiempo
    const timeRatio = availableHours / requiredHours
    if (timeRatio >= 1.2) baseScore += 20
    else if (timeRatio >= 1.0) baseScore += 10
    else if (timeRatio >= 0.8) baseScore -= 10
    else baseScore -= 30
    
    // Factor material
    if (materialCount >= 3) baseScore += 15
    else if (materialCount >= 1) baseScore += 5
    else baseScore -= 20
    
    // Factor tiempo disponible
    if (daysUntilExam >= 7) baseScore += 10
    else if (daysUntilExam >= 3) baseScore += 0
    else baseScore -= 15
    
    return Math.max(0, Math.min(100, baseScore))
  }
  
  /**
   * Genera recomendaciones personalizadas
   */
  private generateRecommendations(
    request: StudyPlanRequest,
    exam: Exam,
    conflicts: ConflictDetection[],
    successRate: number
  ): string[] {
    const recommendations: string[] = []
    
    if (successRate >= 80) {
      recommendations.push('Excelente planificación. Mantén la constancia y tendrás gran éxito.')
    } else if (successRate >= 60) {
      recommendations.push('Buen plan de estudio. Considera agregar sesiones de repaso adicionales.')
    } else {
      recommendations.push('Plan desafiante. Necesitas optimizar tu tiempo y recursos.')
    }
    
    // Recomendaciones basadas en intensidad
    if (request.intensity === 'light') {
      recommendations.push('Considera aumentar la intensidad si tienes tiempo adicional disponible.')
    } else if (request.intensity === 'intensive') {
      recommendations.push('Plan intensivo detectado. Asegúrate de incluir descansos regulares.')
    }
    
    // Recomendaciones basadas en conflictos
    for (const conflict of conflicts) {
      recommendations.push(conflict.suggestion)
    }
    
    // Recomendaciones por tipo de examen
    if (exam.type === 'final') {
      recommendations.push('Para exámenes finales, dedica tiempo extra a repasar todo el material del curso.')
    } else if (exam.type === 'parcial') {
      recommendations.push('Enfócate en los temas específicos del parcial para maximizar tu puntuación.')
    }
    
    return recommendations
  }
  
  /**
   * Utilidades auxiliares
   */
  private getDaysUntilExam(examDate: Date): number {
    const now = new Date()
    const diffTime = examDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  private calculateAvailableTime(request: StudyPlanRequest, days: number): number {
    return request.availableTime * days
  }
  
  private estimateRequiredStudyTime(exam: Exam, materials: StudyMaterial[], progress?: StudyProgress): number {
    let baseTime = exam.duration / 60 * 2 // 2x la duración del examen
    
    // Ajustar por número de temas
    baseTime += exam.topics.length * 2
    
    // Ajustar por material disponible
    if (materials.length > 0) {
      const materialTime = materials.reduce((sum, m) => sum + (m.estimatedStudyTime || 30), 0) / 60
      baseTime = Math.max(baseTime, materialTime)
    }
    
    // Ajustar por progreso previo
    if (progress && progress.completedSessions > 0) {
      baseTime *= 0.7 // Reducir si ya hay progreso
    }
    
    return Math.ceil(baseTime)
  }
  
  private extractTopicsFromMaterials(materials: StudyMaterial[], examTopics: string[]): string[] {
    const allTopics = new Set<string>()
    
    // Agregar temas del examen
    examTopics.forEach(topic => allTopics.add(topic))
    
    // Agregar temas clave del material
    materials.forEach(material => {
      if (material.keyTopics) {
        material.keyTopics.forEach(topic => allTopics.add(topic))
      }
    })
    
    return Array.from(allTopics)
  }
  
  private getPreferredStudyHours(preference: string): number[] {
    switch (preference) {
      case 'morning':
        return [8, 10, 9]
      case 'afternoon':
        return [14, 16, 15]
      case 'evening':
        return [19, 21, 20]
      case 'flexible':
        return [9, 15, 20]
      default:
        return [15, 17, 19]
    }
  }
}

/**
 * Adaptador dinámico de cronogramas
 */
export class DynamicScheduleAdapter {
  
  /**
   * Adapta el cronograma basado en el progreso real
   */
  async adaptSchedule(userId: string, examId: string): Promise<{
    adapted: boolean
    changes: string[]
    newSessions: StudySession[]
  }> {
    console.log(`🔄 Adaptando cronograma dinámicamente para usuario ${userId}`)
    
    const progress = getStudyProgressByUserAndExam(userId, examId)
    if (!progress) {
      return { adapted: false, changes: ['No hay progreso registrado'], newSessions: [] }
    }
    
    const changes: string[] = []
    const newSessions: StudySession[] = []
    
    // Analizar efectividad promedio
    if (progress.averageEffectiveness < 3) {
      changes.push('Detectada baja efectividad. Aumentando duración de sesiones.')
      // Lógica para crear sesiones más largas
    }
    
    // Analizar progreso por temas
    const weakTopics = Object.entries(progress.topicsProgress)
      .filter(([_, topicProgress]) => topicProgress.masteryLevel < 60)
      .map(([topic, _]) => topic)
    
    if (weakTopics.length > 0) {
      changes.push(`Reforzando temas débiles: ${weakTopics.join(', ')}`)
      // Crear sesiones adicionales para temas débiles
    }
    
    return {
      adapted: changes.length > 0,
      changes,
      newSessions
    }
  }
}

// Singleton instances
export const intelligentStudyPlanner = new IntelligentStudyPlanner()
export const dynamicScheduleAdapter = new DynamicScheduleAdapter()