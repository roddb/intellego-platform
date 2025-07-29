// Simulation Engine for Progressive Evaluation
// Creates adaptive testing and simulation experiences

import { aiStudyIntegration, AIStudyRecommendation } from './ai-study-integration'
import { 
  Exam, 
  StudyMaterial, 
  StudyProgress,
  getExamById,
  getStudyMaterialsByExam,
  getStudyProgressByUserAndExam,
  updateStudyProgress
} from './academic-data'

export interface SimulationQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  timeLimit?: number // seconds
}

export interface SimulationSession {
  id: string
  userId: string
  examId: string
  title: string
  questions: SimulationQuestion[]
  startTime: Date
  endTime?: Date
  timeLimit: number // minutes
  status: 'not_started' | 'in_progress' | 'completed' | 'timeout'
  settings: {
    adaptiveDifficulty: boolean
    showExplanations: boolean
    timePerQuestion: number
    randomizeOrder: boolean
  }
}

export interface SimulationResult {
  sessionId: string
  userId: string
  examId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number // minutes
  topicPerformance: {
    [topic: string]: {
      correct: number
      total: number
      accuracy: number
      averageTime: number
    }
  }
  difficultyPerformance: {
    easy: { correct: number; total: number }
    medium: { correct: number; total: number }
    hard: { correct: number; total: number }
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: AIStudyRecommendation[]
  readinessLevel: number // 0-100%
  completedAt: Date
}

export interface SimulationAnswer {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number // seconds
  timestamp: Date
}

export class SimulationEngine {
  private activeSessions: Map<string, SimulationSession> = new Map()
  private sessionResults: Map<string, SimulationResult> = new Map()
  
  /**
   * Crea una nueva sesión de simulacro
   */
  async createSimulation(
    userId: string,
    examId: string,
    settings: {
      questionCount?: number
      difficulty?: 'mixed' | 'easy' | 'medium' | 'hard'
      topics?: string[]
      adaptiveDifficulty?: boolean
      timeLimit?: number
    } = {}
  ): Promise<SimulationSession> {
    const exam = getExamById(examId)
    if (!exam) {
      throw new Error('Examen no encontrado')
    }
    
    console.log(`🎯 Creando simulacro para examen: ${exam.title}`)
    
    const sessionId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Configuración por defecto
    const defaultSettings = {
      questionCount: 10,
      difficulty: 'mixed' as const,
      topics: exam.topics,
      adaptiveDifficulty: true,
      timeLimit: 30, // 30 minutos
      showExplanations: true,
      timePerQuestion: 120, // 2 minutos por pregunta
      randomizeOrder: true
    }
    
    const finalSettings = { ...defaultSettings, ...settings }
    
    // Generar preguntas usando IA
    const questions = await this.generateQuestions(examId, finalSettings)
    
    const session: SimulationSession = {
      id: sessionId,
      userId,
      examId,
      title: `Simulacro - ${exam.title}`,
      questions,
      startTime: new Date(),
      timeLimit: finalSettings.timeLimit,
      status: 'not_started',
      settings: {
        adaptiveDifficulty: finalSettings.adaptiveDifficulty,
        showExplanations: finalSettings.showExplanations,
        timePerQuestion: finalSettings.timePerQuestion,
        randomizeOrder: finalSettings.randomizeOrder
      }
    }
    
    this.activeSessions.set(sessionId, session)
    return session
  }
  
  /**
   * Inicia una sesión de simulacro
   */
  startSimulation(sessionId: string): SimulationSession | null {
    const session = this.activeSessions.get(sessionId)
    if (!session) return null
    
    session.status = 'in_progress'
    session.startTime = new Date()
    
    // Randomizar orden si está habilitado
    if (session.settings.randomizeOrder) {
      session.questions = this.shuffleArray([...session.questions])
    }
    
    console.log(`▶️ Iniciando simulacro: ${session.title}`)
    return session
  }
  
  /**
   * Procesa una respuesta del usuario
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedAnswer: number,
    timeSpent: number
  ): Promise<{
    isCorrect: boolean
    explanation?: string
    nextQuestion?: SimulationQuestion
    sessionComplete?: boolean
  }> {
    const session = this.activeSessions.get(sessionId)
    if (!session || session.status !== 'in_progress') {
      throw new Error('Sesión no válida o no iniciada')
    }
    
    const question = session.questions.find(q => q.id === questionId)
    if (!question) {
      throw new Error('Pregunta no encontrada')
    }
    
    const isCorrect = selectedAnswer === question.correctAnswer
    const answer: SimulationAnswer = {
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date()
    }
    
    // Almacenar respuesta (en producción iría a base de datos)
    this.storeAnswer(sessionId, answer)
    
    // Verificar si es la última pregunta
    const answeredQuestions = this.getAnsweredQuestions(sessionId)
    const sessionComplete = answeredQuestions.length >= session.questions.length
    
    let nextQuestion: SimulationQuestion | undefined
    
    if (!sessionComplete) {
      // Obtener siguiente pregunta
      const nextIndex = answeredQuestions.length
      nextQuestion = session.questions[nextIndex]
      
      // Adaptar dificultad si está habilitado
      if (session.settings.adaptiveDifficulty) {
        nextQuestion = await this.adaptQuestionDifficulty(session, answeredQuestions, nextIndex)
      }
    } else {
      // Completar sesión
      await this.completeSimulation(sessionId)
    }
    
    return {
      isCorrect,
      explanation: session.settings.showExplanations ? question.explanation : undefined,
      nextQuestion,
      sessionComplete
    }
  }
  
  /**
   * Completa una sesión de simulacro y genera resultados
   */
  async completeSimulation(sessionId: string): Promise<SimulationResult> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Sesión no encontrada')
    }
    
    session.status = 'completed'
    session.endTime = new Date()
    
    console.log(`✅ Completando simulacro: ${session.title}`)
    
    const answers = this.getAnsweredQuestions(sessionId)
    const result = await this.calculateResults(session, answers)
    
    // Almacenar resultado
    this.sessionResults.set(sessionId, result)
    
    // Actualizar progreso del usuario
    await this.updateUserProgress(session.userId, session.examId, result)
    
    return result
  }
  
  /**
   * Obtiene el resultado de una sesión
   */
  getSimulationResult(sessionId: string): SimulationResult | null {
    return this.sessionResults.get(sessionId) || null
  }
  
  /**
   * Obtiene sesión activa
   */
  getActiveSession(sessionId: string): SimulationSession | null {
    return this.activeSessions.get(sessionId) || null
  }
  
  /**
   * Genera preguntas usando IA
   */
  private async generateQuestions(
    examId: string,
    settings: any
  ): Promise<SimulationQuestion[]> {
    try {
      const difficultyDistribution = this.getDifficultyDistribution(settings.difficulty, settings.questionCount)
      const allQuestions: SimulationQuestion[] = []
      
      // Generar preguntas por nivel de dificultad
      for (const [difficulty, count] of Object.entries(difficultyDistribution)) {
        if (count > 0) {
          const questionSet = await aiStudyIntegration.generateSimulationQuestions(
            examId,
            settings.topics,
            difficulty as any,
            count as number
          )
          
          const formattedQuestions = questionSet.questions.map((q, index) => ({
            ...q,
            points: this.getPointsByDifficulty(difficulty as any),
            timeLimit: settings.timePerQuestion
          }))
          
          allQuestions.push(...formattedQuestions)
        }
      }
      
      return allQuestions
    } catch (error) {
      console.error('Error generando preguntas:', error)
      return this.generateFallbackQuestions(examId, settings)
    }
  }
  
  /**
   * Calcula la distribución de dificultad
   */
  private getDifficultyDistribution(difficulty: string, totalQuestions: number): Record<string, number> {
    switch (difficulty) {
      case 'easy':
        return { easy: totalQuestions, medium: 0, hard: 0 }
      case 'medium':
        return { easy: 0, medium: totalQuestions, hard: 0 }
      case 'hard':
        return { easy: 0, medium: 0, hard: totalQuestions }
      case 'mixed':
      default:
        const easy = Math.floor(totalQuestions * 0.4)
        const medium = Math.floor(totalQuestions * 0.4)
        const hard = totalQuestions - easy - medium
        return { easy, medium, hard }
    }
  }
  
  /**
   * Obtiene puntos por dificultad
   */
  private getPointsByDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 1
      case 'medium': return 2
      case 'hard': return 3
      default: return 1
    }
  }
  
  /**
   * Adapta la dificultad de la siguiente pregunta
   */
  private async adaptQuestionDifficulty(
    session: SimulationSession,
    answers: SimulationAnswer[],
    nextIndex: number
  ): Promise<SimulationQuestion> {
    const recentCorrect = answers.slice(-3).filter(a => a.isCorrect).length
    const totalRecent = Math.min(answers.length, 3)
    const recentAccuracy = totalRecent > 0 ? recentCorrect / totalRecent : 0.5
    
    let targetDifficulty: 'easy' | 'medium' | 'hard'
    
    if (recentAccuracy >= 0.8) {
      targetDifficulty = 'hard'
    } else if (recentAccuracy >= 0.5) {
      targetDifficulty = 'medium'
    } else {
      targetDifficulty = 'easy'
    }
    
    // Buscar pregunta de dificultad objetivo
    const availableQuestions = session.questions.slice(nextIndex)
    const targetQuestion = availableQuestions.find(q => q.difficulty === targetDifficulty)
    
    return targetQuestion || session.questions[nextIndex]
  }
  
  /**
   * Calcula los resultados del simulacro
   */
  private async calculateResults(
    session: SimulationSession,
    answers: SimulationAnswer[]
  ): Promise<SimulationResult> {
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const totalQuestions = session.questions.length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    
    const timeSpent = session.endTime && session.startTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
      : 0
    
    // Análisis por tema
    const topicPerformance: any = {}
    const difficultyPerformance = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } }
    
    for (const answer of answers) {
      const question = session.questions.find(q => q.id === answer.questionId)
      if (!question) continue
      
      // Performance por tema
      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = { correct: 0, total: 0, timeSpent: 0 }
      }
      topicPerformance[question.topic].total++
      topicPerformance[question.topic].timeSpent += answer.timeSpent
      if (answer.isCorrect) {
        topicPerformance[question.topic].correct++
      }
      
      // Performance por dificultad
      difficultyPerformance[question.difficulty].total++
      if (answer.isCorrect) {
        difficultyPerformance[question.difficulty].correct++
      }
    }
    
    // Calcular accuracy y tiempo promedio por tema
    for (const topic in topicPerformance) {
      const perf = topicPerformance[topic]
      perf.accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0
      perf.averageTime = perf.total > 0 ? perf.timeSpent / perf.total : 0
    }
    
    // Identificar fortalezas y debilidades
    const strengths = Object.entries(topicPerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy >= 70)
      .map(([topic, _]) => topic)
    
    const weaknesses = Object.entries(topicPerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy < 50)
      .map(([topic, _]) => topic)
    
    // Generar recomendaciones usando IA
    const recommendations = await this.generateRecommendations(session, answers, topicPerformance)
    
    // Calcular nivel de preparación
    const readinessLevel = this.calculateReadinessLevel(score, topicPerformance, difficultyPerformance)
    
    return {
      sessionId: session.id,
      userId: session.userId,
      examId: session.examId,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      topicPerformance,
      difficultyPerformance,
      strengths,
      weaknesses,
      recommendations,
      readinessLevel,
      completedAt: new Date()
    }
  }
  
  /**
   * Genera recomendaciones basadas en el resultado
   */
  private async generateRecommendations(
    session: SimulationSession,
    answers: SimulationAnswer[],
    topicPerformance: any
  ): Promise<AIStudyRecommendation[]> {
    const recommendations: AIStudyRecommendation[] = []
    
    // Recomendaciones basadas en temas débiles
    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy < 50)
      .map(([topic, _]) => topic)
    
    if (weakTopics.length > 0) {
      recommendations.push({
        type: 'topic_focus',
        priority: 'high',
        title: 'Reforzar Temas Débiles',
        description: `Necesitas mejorar en: ${weakTopics.join(', ')}`,
        actionItems: [
          'Dedicar sesiones de estudio adicionales a estos temas',
          'Buscar material complementario',
          'Practicar con ejercicios específicos'
        ],
        estimatedImpact: 9
      })
    }
    
    // Recomendaciones basadas en tiempo
    const avgTimePerQuestion = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length
    if (avgTimePerQuestion > session.settings.timePerQuestion * 0.8) {
      recommendations.push({
        type: 'time_management',
        priority: 'medium',
        title: 'Mejorar Velocidad de Respuesta',
        description: 'Estás tomando demasiado tiempo por pregunta',
        actionItems: [
          'Practicar con límites de tiempo más estrictos',
          'Revisar técnicas de lectura rápida',
          'Familiarizarte más con el formato de preguntas'
        ],
        estimatedImpact: 7
      })
    }
    
    return recommendations
  }
  
  /**
   * Calcula el nivel de preparación general
   */
  private calculateReadinessLevel(
    score: number,
    topicPerformance: any,
    difficultyPerformance: any
  ): number {
    let readiness = score // Base score
    
    // Bonus por consistencia en temas
    const topicAccuracies = Object.values(topicPerformance).map((p: any) => p.accuracy)
    const minAccuracy = Math.min(...topicAccuracies)
    const maxAccuracy = Math.max(...topicAccuracies)
    const consistency = 100 - (maxAccuracy - minAccuracy)
    readiness = (readiness + consistency) / 2
    
    // Bonus por performance en preguntas difíciles
    const hardAccuracy = difficultyPerformance.hard.total > 0 
      ? (difficultyPerformance.hard.correct / difficultyPerformance.hard.total) * 100 
      : 0
    
    if (hardAccuracy >= 50) {
      readiness += 10
    }
    
    return Math.min(100, Math.max(0, Math.round(readiness)))
  }
  
  /**
   * Actualiza el progreso del usuario
   */
  private async updateUserProgress(userId: string, examId: string, result: SimulationResult) {
    const currentProgress = getStudyProgressByUserAndExam(userId, examId)
    
    if (currentProgress) {
      const newSimulationResult = {
        date: result.completedAt,
        score: result.score,
        topics: Object.keys(result.topicPerformance),
        strengths: result.strengths,
        weaknesses: result.weaknesses
      }
      
      const updatedProgress = {
        ...currentProgress,
        simulationResults: [...(currentProgress.simulationResults || []), newSimulationResult],
        predictedReadiness: result.readinessLevel,
        lastUpdated: new Date()
      }
      
      updateStudyProgress(userId, examId, updatedProgress)
    }
  }
  
  // Utility methods
  private storeAnswer(sessionId: string, answer: SimulationAnswer) {
    // En producción, esto iría a una base de datos
    const session = this.activeSessions.get(sessionId)
    if (session) {
      if (!(session as any).answers) {
        (session as any).answers = []
      }
      (session as any).answers.push(answer)
    }
  }
  
  private getAnsweredQuestions(sessionId: string): SimulationAnswer[] {
    const session = this.activeSessions.get(sessionId) as any
    return session?.answers || []
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  private generateFallbackQuestions(examId: string, settings: any): SimulationQuestion[] {
    const exam = getExamById(examId)
    const topics = exam?.topics || ['Tema General']
    
    return topics.slice(0, settings.questionCount).map((topic, index) => ({
      id: `fallback-${index + 1}`,
      question: `¿Cuál es el concepto más importante sobre ${topic}?`,
      options: [
        'Concepto A',
        'Concepto B', 
        'Concepto C',
        'Todas las anteriores'
      ],
      correctAnswer: 3,
      explanation: `Para dominar ${topic}, es importante comprender todos los conceptos fundamentales.`,
      topic,
      difficulty: 'medium' as const,
      points: 2,
      timeLimit: settings.timePerQuestion
    }))
  }
}

// Singleton instance
export const simulationEngine = new SimulationEngine()