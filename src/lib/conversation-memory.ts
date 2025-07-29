// Sistema de Memoria Conversacional para Sara
// Permite recordar conversaciones, preferencias y contexto del estudiante

import { EmotionAnalyzer, EmotionType, EmotionAnalysis } from './emotion-analyzer'

export interface ConversationTurn {
  id: string
  timestamp: Date
  userMessage: string
  saraResponse: string
  mode: string
  intent?: string
  topics: string[]
  emotions?: EmotionAnalysis
  context?: {
    subject?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    achievement?: boolean
    needsFollowUp?: boolean
  }
}

export interface ConversationMemory {
  userId: string
  sessionId: string
  startedAt: Date
  lastActivity: Date
  totalTurns: number
  conversationHistory: ConversationTurn[]
  
  // Información extraída del contexto
  preferences: {
    preferredMode: string
    favoriteSubjects: string[]
    difficultSubjects: string[]
    studyTimePreference: string
    communicationStyle: 'formal' | 'casual' | 'motivational'
  }
  
  // Estado emocional y motivacional
  emotionalProfile: {
    currentMood: EmotionType
    motivationLevel: number // 1-10
    recentEmotions: EmotionType[] // Últimas 5 emociones detectadas
    emotionalTrends: {
      dominant: EmotionType
      frequency: number
      lastWeek: EmotionType[]
    }
    frustrationAreas: string[]
    achievementAreas: string[]
    lastEncouragement: Date
    emotionalInsights: string[]
  }
  
  // Temas y objetivos recurrentes
  recurringTopics: Array<{
    topic: string
    frequency: number
    lastMentioned: Date
    resolved: boolean
  }>
  
  // Seguimiento de progreso
  progressTracking: {
    goalsDiscussed: string[]
    plansMade: string[]
    completedTasks: string[]
    pendingFollowUps: Array<{
      task: string
      dueDate: Date
      reminder: boolean
    }>
  }
}

export class ConversationMemoryManager {
  private static memories: Map<string, ConversationMemory> = new Map()
  
  /**
   * Obtiene o crea la memoria conversacional para un usuario
   */
  static getMemory(userId: string, sessionId?: string): ConversationMemory {
    const memoryKey = `${userId}_${sessionId || 'default'}`
    
    if (!this.memories.has(memoryKey)) {
      this.memories.set(memoryKey, this.createNewMemory(userId, sessionId))
    }
    
    return this.memories.get(memoryKey)!
  }
  
  /**
   * Guarda un nuevo intercambio conversacional
   */
  static saveConversationTurn(
    userId: string,
    userMessage: string,
    saraResponse: string,
    mode: string,
    intent?: string,
    sessionId?: string
  ): ConversationTurn {
    const memory = this.getMemory(userId, sessionId)
    
    const turn: ConversationTurn = {
      id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      timestamp: new Date(),
      userMessage,
      saraResponse,
      mode,
      intent,
      topics: this.extractTopics(userMessage),
      emotions: this.detectEmotions(userMessage, { 
        subject: this.extractSubjectFromMessage(userMessage),
        previousEmotion: memory.emotionalProfile?.currentMood 
      }),
      context: this.analyzeContext(userMessage, saraResponse)
    }
    
    // Agregar al historial
    memory.conversationHistory.push(turn)
    memory.totalTurns++
    memory.lastActivity = new Date()
    
    // Mantener solo los últimos 50 intercambios para eficiencia
    if (memory.conversationHistory.length > 50) {
      memory.conversationHistory = memory.conversationHistory.slice(-50)
    }
    
    // Actualizar perfiles basándose en la nueva conversación
    this.updatePreferences(memory, turn)
    this.updateEmotionalProfile(memory, turn)
    this.updateRecurringTopics(memory, turn)
    this.updateProgressTracking(memory, turn)
    
    return turn
  }
  
  /**
   * Genera un resumen contextual para Sara basado en la memoria
   */
  static generateContextualSummary(userId: string, sessionId?: string): string {
    const memory = this.getMemory(userId, sessionId)
    
    if (memory.conversationHistory.length === 0) {
      return "Esta es nuestra primera conversación. Estoy aquí para conocerte y ayudarte con tus objetivos académicos."
    }
    
    const recentTurns = memory.conversationHistory.slice(-5)
    const summary: string[] = []
    
    // Información sobre sesión actual
    const daysSinceLastChat = Math.floor(
      (Date.now() - memory.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastChat > 7) {
      summary.push(`Han pasado ${daysSinceLastChat} días desde nuestra última conversación.`)
    } else if (daysSinceLastChat > 1) {
      summary.push(`Nos vimos hace ${daysSinceLastChat} días.`)
    }
    
    // Temas recurrentes importantes
    const importantTopics = memory.recurringTopics
      .filter(t => t.frequency > 2 && !t.resolved)
      .slice(0, 3)
    
    if (importantTopics.length > 0) {
      summary.push(`Hemos estado trabajando en: ${importantTopics.map(t => t.topic).join(', ')}.`)
    }
    
    // Estado emocional
    if (memory.emotionalProfile.motivationLevel < 5) {
      summary.push("He notado que podrías necesitar un poco más de motivación.")
    } else if (memory.emotionalProfile.motivationLevel > 8) {
      summary.push("Me alegra ver tu motivación y energía positiva.")
    }
    
    // Seguimientos pendientes
    const pendingFollowUps = memory.progressTracking.pendingFollowUps
      .filter(f => f.dueDate <= new Date())
    
    if (pendingFollowUps.length > 0) {
      summary.push(`Tenemos ${pendingFollowUps.length} seguimiento(s) pendiente(s).`)
    }
    
    // Preferencias del estudiante
    if (memory.preferences.difficultSubjects.length > 0) {
      summary.push(`Sé que ${memory.preferences.difficultSubjects[0]} te presenta algunos desafíos.`)
    }
    
    return summary.length > 0 
      ? summary.join(' ')
      : "Continuemos donde lo dejamos la última vez."
  }
  
  /**
   * Obtiene sugerencias personalizadas basadas en la memoria
   */
  static getPersonalizedSuggestions(userId: string, sessionId?: string): string[] {
    const memory = this.getMemory(userId, sessionId)
    const suggestions: string[] = []
    
    // Basado en temas recurrentes sin resolver
    const unresolvedTopics = memory.recurringTopics.filter(t => !t.resolved)
    unresolvedTopics.slice(0, 2).forEach(topic => {
      suggestions.push(`Retomar el trabajo en ${topic.topic}`)
    })
    
    // Basado en seguimientos pendientes
    memory.progressTracking.pendingFollowUps.slice(0, 2).forEach(followUp => {
      suggestions.push(`Revisar progreso: ${followUp.task}`)
    })
    
    // Basado en materias difíciles
    if (memory.preferences.difficultSubjects.length > 0) {
      suggestions.push(`Planificar sesión de estudio para ${memory.preferences.difficultSubjects[0]}`)
    }
    
    // Basado en estado emocional
    if (memory.emotionalProfile.motivationLevel < 5) {
      suggestions.push("Trabajar en motivación y objetivos pequeños")
    }
    
    // Basado en preferencias de modo
    if (memory.preferences.preferredMode) {
      suggestions.push(`Continuar en modo ${memory.preferences.preferredMode}`)
    }
    
    return suggestions.slice(0, 4) // Máximo 4 sugerencias
  }
  
  /**
   * Detecta si el usuario necesita seguimiento en temas específicos
   */
  static needsFollowUp(userId: string, sessionId?: string): boolean {
    const memory = this.getMemory(userId, sessionId)
    
    // Verificar seguimientos vencidos
    const overdueFollowUps = memory.progressTracking.pendingFollowUps
      .filter(f => f.dueDate < new Date())
    
    // Verificar temas sin resolver por mucho tiempo
    const staleTops = memory.recurringTopics
      .filter(t => !t.resolved && 
        (Date.now() - t.lastMentioned.getTime()) > (7 * 24 * 60 * 60 * 1000))
    
    // Verificar bajo nivel de motivación
    const lowMotivation = memory.emotionalProfile.motivationLevel < 4
    
    return overdueFollowUps.length > 0 || staleTops.length > 0 || lowMotivation
  }
  
  // Métodos auxiliares privados
  
  private static createNewMemory(userId: string, sessionId?: string): ConversationMemory {
    return {
      userId,
      sessionId: sessionId || 'default',
      startedAt: new Date(),
      lastActivity: new Date(),
      totalTurns: 0,
      conversationHistory: [],
      
      preferences: {
        preferredMode: 'chatting',
        favoriteSubjects: [],
        difficultSubjects: [],
        studyTimePreference: 'evening',
        communicationStyle: 'casual'
      },
      
      emotionalProfile: {
        currentMood: EmotionType.NEUTRAL,
        motivationLevel: 7,
        recentEmotions: [],
        emotionalTrends: {
          dominant: EmotionType.NEUTRAL,
          frequency: 0,
          lastWeek: []
        },
        frustrationAreas: [],
        achievementAreas: [],
        lastEncouragement: new Date(),
        emotionalInsights: []
      },
      
      recurringTopics: [],
      
      progressTracking: {
        goalsDiscussed: [],
        plansMade: [],
        completedTasks: [],
        pendingFollowUps: []
      }
    }
  }
  
  private static extractTopics(message: string): string[] {
    const topics: string[] = []
    const lowerMessage = message.toLowerCase()
    
    // Lista de temas académicos comunes
    const academicTopics = [
      'matemáticas', 'física', 'química', 'biología', 'historia', 'literatura',
      'inglés', 'programación', 'cálculo', 'álgebra', 'geometría', 'estadística',
      'examen', 'tarea', 'proyecto', 'presentación', 'ensayo', 'estudio',
      'horario', 'planificación', 'calendario', 'tiempo', 'organización'
    ]
    
    academicTopics.forEach(topic => {
      if (lowerMessage.includes(topic)) {
        topics.push(topic)
      }
    })
    
    return topics
  }
  
  private static extractSubjectFromMessage(message: string): string | undefined {
    const lowerMessage = message.toLowerCase()
    const subjects = ['matemáticas', 'física', 'química', 'biología', 'historia', 'literatura', 'inglés', 'programación']
    return subjects.find(subject => lowerMessage.includes(subject))
  }
  
  private static detectEmotions(message: string, context?: { subject?: string, previousEmotion?: EmotionType }): ConversationTurn['emotions'] {
    return EmotionAnalyzer.analyzeEmotions(message, context)
  }
  
  private static analyzeContext(userMessage: string, saraResponse: string): ConversationTurn['context'] {
    const lowerMessage = userMessage.toLowerCase()
    const context: ConversationTurn['context'] = {}
    
    // Detectar materias
    const subjects = ['matemáticas', 'física', 'química', 'biología', 'historia', 'literatura', 'inglés']
    const detectedSubject = subjects.find(subject => lowerMessage.includes(subject))
    if (detectedSubject) {
      context.subject = detectedSubject
    }
    
    // Detectar dificultad
    if (lowerMessage.includes('fácil') || lowerMessage.includes('simple')) {
      context.difficulty = 'easy'
    } else if (lowerMessage.includes('difícil') || lowerMessage.includes('complejo')) {
      context.difficulty = 'hard'
    } else {
      context.difficulty = 'medium'
    }
    
    // Detectar logros
    if (lowerMessage.includes('logré') || lowerMessage.includes('terminé') || lowerMessage.includes('completé')) {
      context.achievement = true
    }
    
    // Detectar necesidad de seguimiento
    if (lowerMessage.includes('planificar') || lowerMessage.includes('revisar') || lowerMessage.includes('próxima vez')) {
      context.needsFollowUp = true
    }
    
    return context
  }
  
  private static updatePreferences(memory: ConversationMemory, turn: ConversationTurn): void {
    // Actualizar modo preferido
    memory.preferences.preferredMode = turn.mode
    
    // Actualizar materias favoritas/difíciles basándose en emociones
    if (turn.context?.subject) {
      if (turn.emotions?.detected === 'positive' || turn.emotions?.detected === 'motivated') {
        if (!memory.preferences.favoriteSubjects.includes(turn.context.subject)) {
          memory.preferences.favoriteSubjects.push(turn.context.subject)
        }
      } else if (turn.emotions?.detected === 'frustrated' || turn.emotions?.detected === 'negative') {
        if (!memory.preferences.difficultSubjects.includes(turn.context.subject)) {
          memory.preferences.difficultSubjects.push(turn.context.subject)
        }
      }
    }
  }
  
  private static updateEmotionalProfile(memory: ConversationMemory, turn: ConversationTurn): void {
    if (turn.emotions) {
      const emotion = turn.emotions.primary
      
      // Actualizar humor actual
      memory.emotionalProfile.currentMood = emotion
      
      // Agregar a emociones recientes (mantener últimas 5)
      memory.emotionalProfile.recentEmotions.unshift(emotion)
      if (memory.emotionalProfile.recentEmotions.length > 5) {
        memory.emotionalProfile.recentEmotions = memory.emotionalProfile.recentEmotions.slice(0, 5)
      }
      
      // Actualizar tendencias emocionales semanales
      memory.emotionalProfile.emotionalTrends.lastWeek.unshift(emotion)
      if (memory.emotionalProfile.emotionalTrends.lastWeek.length > 20) { // ~1 semana de interacciones
        memory.emotionalProfile.emotionalTrends.lastWeek = memory.emotionalProfile.emotionalTrends.lastWeek.slice(0, 20)
      }
      
      // Calcular emoción dominante
      const emotionCounts = memory.emotionalProfile.emotionalTrends.lastWeek.reduce((acc, em) => {
        acc[em] = (acc[em] || 0) + 1
        return acc
      }, {} as Record<EmotionType, number>)
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as EmotionType
      
      if (dominantEmotion) {
        memory.emotionalProfile.emotionalTrends.dominant = dominantEmotion
        memory.emotionalProfile.emotionalTrends.frequency = emotionCounts[dominantEmotion]
      }
      
      // Ajustar nivel de motivación basado en emociones
      const motivationAdjustment = this.getMotivationAdjustment(emotion, turn.emotions.intensity)
      memory.emotionalProfile.motivationLevel = Math.max(1, Math.min(10, 
        memory.emotionalProfile.motivationLevel + motivationAdjustment
      ))
      
      // Actualizar áreas de frustración/logro
      if (turn.context?.subject) {
        if ([EmotionType.FRUSTRATED, EmotionType.OVERWHELMED, EmotionType.STRESSED].includes(emotion)) {
          if (!memory.emotionalProfile.frustrationAreas.includes(turn.context.subject)) {
            memory.emotionalProfile.frustrationAreas.push(turn.context.subject)
          }
        }
        
        if ([EmotionType.PROUD, EmotionType.CONFIDENT, EmotionType.EXCITED].includes(emotion) || turn.context?.achievement) {
          if (!memory.emotionalProfile.achievementAreas.includes(turn.context.subject)) {
            memory.emotionalProfile.achievementAreas.push(turn.context.subject)
          }
        }
      }
      
      // Generar insights emocionales
      const insight = this.generateEmotionalInsight(emotion, turn.emotions, turn.context?.subject)
      if (insight) {
        memory.emotionalProfile.emotionalInsights.unshift(insight)
        if (memory.emotionalProfile.emotionalInsights.length > 10) {
          memory.emotionalProfile.emotionalInsights = memory.emotionalProfile.emotionalInsights.slice(0, 10)
        }
      }
    }
  }
  
  /**
   * Calcula el ajuste de motivación basado en la emoción
   */
  private static getMotivationAdjustment(emotion: EmotionType, intensity: 'low' | 'medium' | 'high'): number {
    const baseAdjustments: Record<EmotionType, number> = {
      [EmotionType.MOTIVATED]: 2,
      [EmotionType.EXCITED]: 2,
      [EmotionType.PROUD]: 1.5,
      [EmotionType.CONFIDENT]: 1.5,
      [EmotionType.HOPEFUL]: 1,
      [EmotionType.HAPPY]: 1,
      [EmotionType.GRATEFUL]: 0.5,
      [EmotionType.RELIEVED]: 0.5,
      [EmotionType.CURIOUS]: 0.5,
      [EmotionType.NEUTRAL]: 0,
      [EmotionType.CONFUSED]: -0.5,
      [EmotionType.BORED]: -1,
      [EmotionType.DISAPPOINTED]: -1,
      [EmotionType.SAD]: -1,
      [EmotionType.FRUSTRATED]: -1.5,
      [EmotionType.OVERWHELMED]: -2,
      [EmotionType.STRESSED]: -2,
      [EmotionType.ANXIOUS]: -1.5,
      [EmotionType.ANGRY]: -1,
      [EmotionType.FEAR]: -1,
      [EmotionType.SURPRISE]: 0
    }
    
    const baseAdjustment = baseAdjustments[emotion] || 0
    
    // Aplicar multiplicador de intensidad
    const intensityMultiplier = intensity === 'high' ? 1.5 : intensity === 'medium' ? 1.2 : 0.8
    
    return baseAdjustment * intensityMultiplier
  }
  
  /**
   * Genera un insight emocional basado en la emoción detectada
   */
  private static generateEmotionalInsight(emotion: EmotionType, analysis: EmotionAnalysis, subject?: string): string | null {
    const timestamp = new Date().toLocaleDateString()
    
    switch (emotion) {
      case EmotionType.FRUSTRATED:
        return `${timestamp}: Frustración detectada${subject ? ` en ${subject}` : ''}. Considerar estrategias de apoyo adicional.`
      
      case EmotionType.OVERWHELMED:
        return `${timestamp}: Estudiante se siente abrumado. Recomendar descansos y división de tareas.`
      
      case EmotionType.MOTIVATED:
        return `${timestamp}: Alta motivación detectada${subject ? ` hacia ${subject}` : ''}. Momento ideal para objetivos ambiciosos.`
      
      case EmotionType.CONFUSED:
        return `${timestamp}: Confusión identificada${subject ? ` en ${subject}` : ''}. Necesita explicaciones más claras.`
      
      case EmotionType.PROUD:
        return `${timestamp}: Orgullo por logro${subject ? ` en ${subject}` : ''}. Reforzar autoconfianza.`
      
      case EmotionType.ANXIOUS:
        return `${timestamp}: Ansiedad detectada. Implementar técnicas de relajación y apoyo.`
      
      default:
        if (analysis.intensity === 'high') {
          return `${timestamp}: Emoción intensa (${emotion}) detectada. Monitorear estado emocional.`
        }
        return null
    }
  }
  
  private static updateRecurringTopics(memory: ConversationMemory, turn: ConversationTurn): void {
    turn.topics.forEach(topic => {
      const existing = memory.recurringTopics.find(rt => rt.topic === topic)
      
      if (existing) {
        existing.frequency++
        existing.lastMentioned = new Date()
        
        // Marcar como resuelto si hay indicadores de logro
        if (turn.context?.achievement) {
          existing.resolved = true
        }
      } else {
        memory.recurringTopics.push({
          topic,
          frequency: 1,
          lastMentioned: new Date(),
          resolved: false
        })
      }
    })
  }
  
  private static updateProgressTracking(memory: ConversationMemory, turn: ConversationTurn): void {
    // Detectar objetivos/planes mencionados
    const lowerMessage = turn.userMessage.toLowerCase()
    
    if (lowerMessage.includes('objetivo') || lowerMessage.includes('meta')) {
      memory.progressTracking.goalsDiscussed.push(turn.userMessage)
    }
    
    if (lowerMessage.includes('plan') || lowerMessage.includes('planificar')) {
      memory.progressTracking.plansMade.push(turn.userMessage)
    }
    
    if (turn.context?.achievement) {
      memory.progressTracking.completedTasks.push(turn.userMessage)
    }
    
    // Agregar seguimientos si es necesario
    if (turn.context?.needsFollowUp) {
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 3) // Seguimiento en 3 días
      
      memory.progressTracking.pendingFollowUps.push({
        task: turn.userMessage,
        dueDate: followUpDate,
        reminder: true
      })
    }
  }
}