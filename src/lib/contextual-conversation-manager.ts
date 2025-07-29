// Contextual Conversation Manager for Sara AI
// Provides intelligent context management and conversation coherence

import { ConversationMemoryManager } from './conversation-memory'
import { AdvancedLearningProfileManager } from './advanced-learning-profiles'
import { VisualLearningEngine } from './visual-learning-engine'
import { AcademicSearchEngine } from './academic-search-engine'
import { AICalendarIntegration, analyzeConversationForEvents } from './calendar-ai-integration'

export interface ConversationContext {
  userId: string
  sessionId: string
  currentTopic?: string
  currentSubject?: string
  conversationFlow: ConversationTurn[]
  contextSummary: string
  activeIntentions: string[]
  pendingQuestions: string[]
  referenceMemory: ContextReference[]
  lastUpdate: Date
}

export interface ConversationTurn {
  id: string
  timestamp: Date
  role: 'user' | 'assistant'
  content: string
  metadata: {
    subject?: string
    topic?: string
    intention?: string
    emotion?: string
    confidence?: number
    visualsGenerated?: boolean
    searchPerformed?: boolean
  }
}

export interface ContextReference {
  id: string
  type: 'topic_continuation' | 'subject_reference' | 'problem_solving' | 'explanation_followup'
  content: string
  relevanceScore: number
  turnIndex: number
  timestamp: Date
}

export interface ContextualResponse {
  content: string
  context: ConversationContext
  continuityScore: number
  personalizations: string[]
  suggestedFollowups: string[]
  visualRecommendation?: {
    type: string
    reason: string
  }
}

export class ContextualConversationManager {
  
  // Configuration for persistent conversation management
  private static readonly MAX_TURNS_RETAINED = 20
  private static readonly MAX_REFERENCES = 10
  private static readonly CONTEXT_DECAY_HOURS = 24

  /**
   * Processes user message with full contextual awareness
   */
  static async processContextualMessage(
    userId: string, 
    message: string, 
    sessionId?: string,
    userName?: string
  ): Promise<ContextualResponse> {
    
    console.log('🎯 [CONTEXTUAL-DEBUG] Procesando mensaje contextual:', {
      userId: userId?.substring(0, 10) + '...',
      sessionId: sessionId?.substring(0, 15) + '...',
      messageLength: message.length,
      userName: userName || 'Sin nombre'
    })
    
    const actualSessionId = sessionId || `session_${userId}_${Date.now()}`
    
    // Import persistent storage functions
    const { 
      getConversationSession, 
      createConversationSession, 
      addConversationTurn, 
      addPendingTask,
      getPendingTasks 
    } = require('./temp-storage')
    
    // Get or create persistent conversation session
    let session = getConversationSession(userId, actualSessionId)
    if (!session) {
      console.log('🆕 [CONTEXTUAL-DEBUG] Creando nueva sesión de conversación')
      session = createConversationSession(userId, actualSessionId)
    } else {
      console.log('🔄 [CONTEXTUAL-DEBUG] Usando sesión existente:', {
        turnsCount: session.turns.length,
        lastUpdate: session.lastUpdate,
        pendingTasks: session.pendingTasks.length
      })
    }
    
    console.log(`💬 Processing message for session ${actualSessionId}: "${message.substring(0, 50)}..."`)
    console.log(`📊 Session has ${session.turns.length} previous turns, ${session.pendingTasks.filter(t => !t.completed).length} pending tasks`)
    
    // Analyze message metadata
    const messageMetadata = this.analyzeMessageMetadata(message)
    
    // Add user turn to persistent storage
    session = addConversationTurn(userId, actualSessionId, 'user', message, messageMetadata)
    
    // Check for pending tasks that might relate to this message
    const pendingTasks = getPendingTasks(userId, actualSessionId)
    
    // Build context from persistent data
    const context: ConversationContext = {
      userId,
      sessionId: actualSessionId,
      currentTopic: session.currentTopic,
      currentSubject: session.currentSubject,
      conversationFlow: session.turns.map(turn => ({
        id: turn.id,
        timestamp: turn.timestamp,
        role: turn.role,
        content: turn.content,
        metadata: turn.metadata
      })),
      contextSummary: this.buildContextSummary(session),
      activeIntentions: this.extractActiveIntentions(session.turns.slice(-5)),
      pendingQuestions: [],
      referenceMemory: this.buildReferenceMemory(session.turns),
      lastUpdate: new Date()
    }
    
    // Generate contextually aware response
    const response = await this.generateContextualResponse(context, userName, pendingTasks)
    
    // Add assistant turn to persistent storage
    const assistantMetadata = {
      confidence: response.continuityScore,
      visualsGenerated: !!response.visualRecommendation,
      searchPerformed: response.personalizations.includes('academic_search'),
      taskCompleted: response.personalizations.includes('task_completed')
    }
    
    addConversationTurn(userId, actualSessionId, 'assistant', response.content, assistantMetadata)
    
    return response
  }

  /**
   * Build context summary from persistent conversation data
   */
  private static buildContextSummary(session: any): string {
    const recentTurns = session.turns.slice(-6)
    const keyTopics = [...new Set(recentTurns
      .map((turn: any) => turn.metadata.topic)
      .filter(Boolean))]
    
    const keySubjects = [...new Set(recentTurns
      .map((turn: any) => turn.metadata.subject)
      .filter(Boolean))]
    
    const summaryParts: string[] = []
    
    if (keySubjects.length > 0) {
      summaryParts.push(`Materias: ${keySubjects.join(', ')}`)
    }
    
    if (keyTopics.length > 0) {
      summaryParts.push(`Temas: ${keyTopics.join(', ')}`)
    }
    
    return summaryParts.join(' | ') || 'Conversación general'
  }

  /**
   * Extract active intentions from recent conversation turns
   */
  private static extractActiveIntentions(recentTurns: any[]): string[] {
    const intentions = recentTurns
      .map((turn: any) => turn.metadata.intention)
      .filter(Boolean)
      .slice(-3)
    
    return [...new Set(intentions)]
  }

  /**
   * Build reference memory from conversation turns
   */
  private static buildReferenceMemory(turns: any[]): ContextReference[] {
    const references: ContextReference[] = []
    const recentTurns = turns.slice(-10)
    
    recentTurns.forEach((turn, index) => {
      if (turn.metadata.confidence && turn.metadata.confidence > 0.7) {
        references.push({
          id: `ref_${turn.id}`,
          type: this.determineReferenceTypeFromMetadata(turn.metadata),
          content: turn.content.substring(0, 100) + '...',
          relevanceScore: turn.metadata.confidence,
          turnIndex: index,
          timestamp: turn.timestamp
        })
      }
    })
    
    return references.slice(-5) // Keep only last 5 references
  }

  /**
   * Helper to determine reference type from metadata
   */
  private static determineReferenceTypeFromMetadata(metadata: any): ContextReference['type'] {
    if (metadata.intention === 'continuation') return 'topic_continuation'
    if (metadata.intention === 'problem_solving') return 'problem_solving'
    if (metadata.intention === 'explanation') return 'explanation_followup'
    return 'subject_reference'
  }

  /**
   * Handles calendar task execution with real event creation
   */
  private static async handleCalendarTasks(
    userId: string,
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
    pendingTasks: any[]
  ): Promise<{ type: string; content: string; metadata?: any } | null> {
    
    console.log(`🔍 [CALENDAR-DEBUG] Checking for calendar tasks in message: "${message.substring(0, 50)}..."`)
    console.log(`📊 [CALENDAR-DEBUG] Conversation history length: ${conversationHistory.length}`)
    console.log(`📋 [CALENDAR-DEBUG] Pending tasks count: ${pendingTasks.length}`)
    
    try {
      // Initialize calendar integration
      const calendarIntegration = new AICalendarIntegration(userId)
      console.log(`✅ [CALENDAR-DEBUG] Calendar integration initialized for user: ${userId.substring(0, 10)}...`)
      
      // Analyze message for calendar events
      const calendarResult = await calendarIntegration.processMessage(message, conversationHistory)
      
      console.log(`📅 [CALENDAR-DEBUG] Calendar processing result:`, {
        needsEventCreation: calendarResult.needsEventCreation,
        hasEvent: !!calendarResult.event,
        eventTitle: calendarResult.event?.title,
        responseLength: calendarResult.response?.length
      })
      
      if (calendarResult.needsEventCreation) {
        console.log(`🎯 [CALENDAR-DEBUG] Calendar task detected and executed!`)
        console.log(`✅ [CALENDAR-DEBUG] Event created:`, {
          title: calendarResult.event?.title,
          date: calendarResult.event?.date,
          time: calendarResult.event?.time,
          location: calendarResult.event?.location
        })
      
      // Mark any related pending task as completed
      if (pendingTasks.length > 0) {
        const calendarTask = pendingTasks.find(t => t.type === 'calendar_event')
        if (calendarTask) {
          const { markTaskCompleted } = require('./temp-storage')
          markTaskCompleted(userId, 'current-session', calendarTask.id, calendarResult)
        }
      }
      
      return {
        type: 'calendar_event_creation',
        content: calendarResult.response || 'Evento creado exitosamente',
        metadata: {
          suggestedActions: calendarResult.event 
            ? ['Ver en calendario', 'Editar evento', 'Eliminar evento']
            : ['Reintentar', 'Proporcionar más detalles'],
          eventCreated: !!calendarResult.event
        }
      } else {
        console.log(`ℹ️ [CALENDAR-DEBUG] No calendar task needed for this message`)
      }
      
      return null
      
    } catch (error) {
      console.error('❌ [CALENDAR-DEBUG] Error in calendar task handling:', error)
      return null
    }
  }

  /**
   * Builds educational prompt based on conversation context
   */
  private static buildEducationalPrompt(
    context: ConversationContext,
    message: string,
    userName?: string
  ): string {
    const recentTurns = context.conversationFlow.slice(-3)
    const conversationContext = recentTurns
      .map(turn => `${turn.role === 'user' ? 'Estudiante' : 'Tutor'}: ${turn.content}`)
      .join('\n')
    
    let prompt = `Eres Sara, una tutora de IA especializada en educación secundaria. `
    
    if (userName) {
      prompt += `El estudiante se llama ${userName}. `
    }
    
    if (context.currentSubject) {
      prompt += `Actualmente estás ayudando con ${context.currentSubject}. `
    }
    
    if (context.contextSummary && context.contextSummary !== 'Conversación general') {
      prompt += `Contexto de la conversación: ${context.contextSummary}. `
    }
    
    prompt += `\n\nConversación reciente:\n${conversationContext}`
    prompt += `\n\nNuevo mensaje del estudiante: "${message}"`
    
    prompt += `\n\nInstrucciones:\n`
    prompt += `- Responde como Sara, la tutora de IA amigable y experta\n`
    prompt += `- Mantén coherencia con la conversación anterior\n`
    prompt += `- Si detectas que el estudiante quiere agendar algo (examen, sesión de estudio), menciona que puedes ayudar con eso\n`
    prompt += `- Usa ejemplos concretos y un lenguaje claro para estudiantes de secundaria\n`
    prompt += `- Si es una pregunta académica, proporciona explicaciones paso a paso\n`
    prompt += `- Mantén un tono motivador y positivo\n\n`
    prompt += `Respuesta de Sara:`
    
    return prompt
  }

  /**
   * Generates contextual fallback response when AI services fail
   */
  private static generateContextualFallback(
    context: ConversationContext,
    message: string,
    userName?: string
  ): string {
    const msgLower = message.toLowerCase()
    
    // Calendar-related fallback
    if (/agendes?|agend[aá]|cre[ae]|programa|anot[ae]|agrega.*(?:examen|evento|sesión)/i.test(message)) {
      return `¡Hola${userName ? ' ' + userName : ''}! Veo que quieres agendar algo en tu calendario.\n\n` +
        `Por favor proporciona estos detalles:\n` +
        `📅 **Fecha**: ¿Para cuándo es?\n` +
        `🕐 **Hora**: ¿A qué hora?\n` +
        `📚 **Tema**: ¿De qué se trata?\n\n` +
        `Una vez que me des estos datos, podré agregarlo a tu calendario automáticamente.`
    }
    
    // Academic question fallback
    if (/¿|qué.*es|cómo|explica|no.*entiendo/i.test(message)) {
      let response = `Entiendo tu pregunta${userName ? ', ' + userName : ''}.\n\n`
      
      if (context.currentSubject) {
        response += `Para ayudarte mejor con ${context.currentSubject}, `
      }
      
      response += `¿podrías ser más específico sobre qué parte necesitas que te explique?\n\n`
      response += `Mientras tanto, puedo:\n`
      response += `• Explicarte conceptos paso a paso\n`
      response += `• Ayudarte a resolver ejercicios\n`
      response += `• Crear recordatorios de estudio\n`
      response += `• Agendar sesiones de repaso`
      
      return response
    }
    
    // General fallback with context
    let response = `¡Hola${userName ? ' ' + userName : ''}! 👋\n\n`
    
    if (context.currentSubject) {
      response += `Veo que hemos estado trabajando con ${context.currentSubject}. `
    }
    
    response += `¿En qué más puedo ayudarte hoy?\n\n`
    response += `Puedo ayudarte con:\n`
    response += `📚 **Explicar conceptos** de tus materias\n`
    response += `📝 **Resolver ejercicios** paso a paso\n`
    response += `📅 **Agendar eventos** en tu calendario\n`
    response += `🎯 **Hacer evaluaciones** adaptativas\n`
    response += `🔍 **Buscar información** académica`
    
    return response
  }

  /**
   * Analyzes message metadata for context
   */
  private static analyzeMessageMetadata(message: string): ConversationTurn['metadata'] {
    const msgLower = message.toLowerCase()
    
    // Subject detection
    let subject: string | undefined
    if (/matemáticas?|álgebra|geometría|cálculo/.test(msgLower)) {
      subject = 'matemáticas'
    } else if (/física|mecánica|cinemática|energía/.test(msgLower)) {
      subject = 'física'
    } else if (/química|reacción|átomo|molécula/.test(msgLower)) {
      subject = 'química'
    }
    
    // Topic detection
    let topic: string | undefined
    const topicMatches = msgLower.match(/(ecuación|función|derivada|integral|fórmula|problema)/gi)
    if (topicMatches) {
      topic = topicMatches[0]
    }
    
    // Intention detection
    let intention: string | undefined
    if (/explica|qué es|cómo funciona/.test(msgLower)) {
      intention = 'explanation'
    } else if (/resuelve|calcula|encuentra/.test(msgLower)) {
      intention = 'problem_solving'
    } else if (/ayuda|no entiendo|estoy confundido/.test(msgLower)) {
      intention = 'help_request'
    } else if (/continúa|sigue|y después/.test(msgLower)) {
      intention = 'continuation'
    }
    
    // Confidence based on clarity and specificity
    let confidence = 0.5
    if (subject) confidence += 0.2
    if (topic) confidence += 0.2
    if (intention) confidence += 0.1
    
    return { subject, topic, intention, confidence: Math.min(confidence, 1.0) }
  }

  /**
   * Updates contextual information based on new message
   */
  private static async updateContextualInformation(context: ConversationContext, message: string): Promise<void> {
    const recentTurns = context.conversationFlow.slice(-5)
    const metadata = recentTurns[recentTurns.length - 1]?.metadata
    
    // Update current topic/subject if detected
    if (metadata?.subject) {
      context.currentSubject = metadata.subject
    }
    if (metadata?.topic) {
      context.currentTopic = metadata.topic
    }
    
    // Detect conversation continuity patterns
    if (metadata?.intention === 'continuation') {
      const lastAssistantTurn = recentTurns
        .slice()
        .reverse()
        .find(turn => turn.role === 'assistant')
      
      if (lastAssistantTurn?.metadata?.subject) {
        context.currentSubject = lastAssistantTurn.metadata.subject
      }
    }
    
    // Update active intentions
    if (metadata?.intention && !context.activeIntentions.includes(metadata.intention)) {
      context.activeIntentions.push(metadata.intention)
      
      // Keep only recent intentions
      if (context.activeIntentions.length > 3) {
        context.activeIntentions.shift()
      }
    }
    
    // Create context references for important information
    if (metadata?.confidence && metadata.confidence > 0.7) {
      const reference: ContextReference = {
        id: `ref_${Date.now()}`,
        type: this.determineReferenceType(metadata),
        content: message,
        relevanceScore: metadata.confidence,
        turnIndex: context.conversationFlow.length - 1,
        timestamp: new Date()
      }
      
      context.referenceMemory.push(reference)
      
      // Keep only most relevant references
      if (context.referenceMemory.length > this.MAX_REFERENCES) {
        context.referenceMemory.sort((a, b) => b.relevanceScore - a.relevanceScore)
        context.referenceMemory = context.referenceMemory.slice(0, this.MAX_REFERENCES)
      }
    }
    
    // Update context summary
    await this.updateContextSummary(context)
  }

  /**
   * Determines reference type based on metadata
   */
  private static determineReferenceType(metadata: ConversationTurn['metadata']): ContextReference['type'] {
    if (metadata.intention === 'continuation') return 'topic_continuation'
    if (metadata.intention === 'problem_solving') return 'problem_solving'
    if (metadata.intention === 'explanation') return 'explanation_followup'
    return 'subject_reference'
  }

  /**
   * Updates context summary with key conversation points
   */
  private static async updateContextSummary(context: ConversationContext): Promise<void> {
    const recentTurns = context.conversationFlow.slice(-6)
    const keyTopics = [...new Set(recentTurns
      .map(turn => turn.metadata.topic)
      .filter(Boolean))]
    
    const keySubjects = [...new Set(recentTurns
      .map(turn => turn.metadata.subject)
      .filter(Boolean))]
    
    const summaryParts: string[] = []
    
    if (keySubjects.length > 0) {
      summaryParts.push(`Materias: ${keySubjects.join(', ')}`)
    }
    
    if (keyTopics.length > 0) {
      summaryParts.push(`Temas: ${keyTopics.join(', ')}`)
    }
    
    if (context.activeIntentions.length > 0) {
      summaryParts.push(`Intenciones: ${context.activeIntentions.join(', ')}`)
    }
    
    context.contextSummary = summaryParts.join(' | ') || 'Conversación general'
  }

  /**
   * Generates contextually aware response using persistent storage
   */
  private static async generateContextualResponse(
    context: ConversationContext, 
    userName?: string,
    pendingTasks: any[] = []
  ): Promise<ContextualResponse> {
    
    // Get learning profile for personalization
    const learningProfile = AdvancedLearningProfileManager.getLearningProfile(context.userId)
    
    // Update learning profile based on current message
    const latestMessage = context.conversationFlow[context.conversationFlow.length - 1]?.content || ''
    AdvancedLearningProfileManager.processUserMessage(context.userId, latestMessage)
    
    // Analyze conversation for continuity
    const continuityAnalysis = this.analyzeContinuity(context)
    
    // 🎯 FIRST PRIORITY: Check for calendar task execution
    const calendarResult = await this.handleCalendarTasks(
      context.userId,
      latestMessage,
      this.formatConversationHistory(context),
      pendingTasks
    )
    
    if (calendarResult) {
      console.log(`📅 Calendar task executed: ${calendarResult.type}`)
      return {
        content: calendarResult.content,
        context,
        continuityScore: 0.9,
        personalizations: ['calendar_task_executed'],
        suggestedFollowups: calendarResult.metadata?.suggestedActions || []
      }
    }

    // Generate base response using AI providers directly
    const { aiService } = require('./ai-providers')
    let baseContent = ''
    
    try {
      // Create educational prompt based on context
      const educationalPrompt = this.buildEducationalPrompt(context, latestMessage, userName)
      baseContent = await aiService.generateExercise(educationalPrompt)
      
      // If AI service returns fallback template, use contextual fallback
      if (baseContent === 'TEMPLATE_FALLBACK') {
        baseContent = this.generateContextualFallback(context, latestMessage, userName)
      }
    } catch (error) {
      console.error('AI service error, using contextual fallback:', error)
      baseContent = this.generateContextualFallback(context, latestMessage, userName)
    }
    
    // Enhance response with contextual information
    let enhancedContent = baseContent
    
    // Add continuity references if relevant
    if (continuityAnalysis.shouldReference) {
      enhancedContent = this.addContinuityReferences(enhancedContent, context)
    }
    
    // Apply learning style adaptations
    enhancedContent = AdvancedLearningProfileManager.adaptResponseToLearningStyle(
      enhancedContent, 
      learningProfile
    )
    
    // Determine personalizations applied
    const personalizations: string[] = []
    if (continuityAnalysis.shouldReference) personalizations.push('context_reference')
    if (learningProfile.primaryStyle !== 'multimodal') personalizations.push('learning_style_adaptation')
    if (pendingTasks.length > 0) personalizations.push('task_aware')
    
    // Generate visual recommendations
    let visualRecommendation: ContextualResponse['visualRecommendation']
    if (learningProfile.adaptationPreferences.prefersVisualAids && 
        (context.currentSubject || context.currentTopic)) {
      
      visualRecommendation = {
        type: VisualLearningEngine.detectOptimalVisualType(enhancedContent, context.currentSubject),
        reason: `Recomendado para tu perfil de aprendizaje ${learningProfile.primaryStyle}`
      }
    }
    
    // Generate follow-up suggestions
    const followups = this.generateContextualFollowups(context, learningProfile)
    
    return {
      content: enhancedContent,
      context,
      continuityScore: continuityAnalysis.score,
      personalizations,
      suggestedFollowups: followups,
      visualRecommendation
    }
  }

  /**
   * Analyzes conversation continuity
   */
  private static analyzeContinuity(context: ConversationContext): { 
    score: number, 
    shouldReference: boolean, 
    referenceType?: string 
  } {
    const recentTurns = context.conversationFlow.slice(-4)
    let score = 0.5 // Base score
    let shouldReference = false
    let referenceType: string | undefined
    
    // Check for topic continuity
    const topics = recentTurns.map(turn => turn.metadata.topic).filter(Boolean)
    if (topics.length > 1 && topics[topics.length - 1] === topics[topics.length - 2]) {
      score += 0.2
      shouldReference = true
      referenceType = 'topic_continuity'
    }
    
    // Check for subject continuity
    const subjects = recentTurns.map(turn => turn.metadata.subject).filter(Boolean)
    if (subjects.length > 1 && subjects[subjects.length - 1] === subjects[subjects.length - 2]) {
      score += 0.15
      shouldReference = true
      referenceType = 'subject_continuity'
    }
    
    // Check for continuation indicators
    const latestMessage = recentTurns[recentTurns.length - 1]?.content?.toLowerCase() || ''
    if (/continúa|sigue|y después|también|además/.test(latestMessage)) {
      score += 0.25
      shouldReference = true
      referenceType = 'explicit_continuation'
    }
    
    // Check for question follow-up patterns
    const hasQuestionFollowup = recentTurns.some((turn, index) => 
      index > 0 && 
      turn.role === 'user' && 
      /por qué|cómo|cuándo|dónde|explica/.test(turn.content.toLowerCase()) &&
      recentTurns[index - 1]?.role === 'assistant'
    )
    
    if (hasQuestionFollowup) {
      score += 0.1
      shouldReference = true
      referenceType = 'followup_question'
    }
    
    return { 
      score: Math.min(score, 1.0), 
      shouldReference, 
      referenceType 
    }
  }

  /**
   * Adds continuity references to response
   */
  private static addContinuityReferences(content: string, context: ConversationContext): string {
    const recentAssistantTurns = context.conversationFlow
      .filter(turn => turn.role === 'assistant')
      .slice(-2)
    
    if (recentAssistantTurns.length === 0) return content
    
    const lastTopic = context.currentTopic
    const lastSubject = context.currentSubject
    
    let referencePrefix = ''
    
    if (lastTopic && lastSubject) {
      referencePrefix = `Continuando con ${lastTopic} en ${lastSubject}: `
    } else if (lastTopic) {
      referencePrefix = `Siguiendo con el tema de ${lastTopic}: `
    } else if (lastSubject) {
      referencePrefix = `Continuando con ${lastSubject}: `
    } else {
      referencePrefix = `Como mencioné anteriormente: `
    }
    
    return referencePrefix + content
  }

  /**
   * Generates contextual follow-up suggestions
   */
  private static generateContextualFollowups(
    context: ConversationContext, 
    learningProfile: any
  ): string[] {
    const followups: string[] = []
    
    // Based on current topic/subject
    if (context.currentTopic) {
      followups.push(`¿Tienes más preguntas sobre ${context.currentTopic}?`)
    }
    
    if (context.currentSubject) {
      followups.push(`¿Te gustaría ver ejercicios de ${context.currentSubject}?`)
    }
    
    // Based on learning style
    if (learningProfile.adaptationPreferences.prefersVisualAids) {
      followups.push('¿Te ayudaría ver un diagrama de esto?')
    }
    
    if (learningProfile.adaptationPreferences.prefersInteraction) {
      followups.push('¿Quieres practicar con un ejercicio?')
    }
    
    // Based on active intentions
    if (context.activeIntentions.includes('explanation')) {
      followups.push('¿Necesitas que profundice en algún aspecto específico?')
    }
    
    if (context.activeIntentions.includes('problem_solving')) {
      followups.push('¿Quieres que resolvamos otro problema similar?')
    }
    
    // Generic contextual followups
    if (context.conversationFlow.length > 3) {
      followups.push('¿Hay algo que no quedó claro?')
    }
    
    return followups.slice(0, 3) // Limit to 3 suggestions
  }

  /**
   * Formats conversation history for external engines
   */
  private static formatConversationHistory(context: ConversationContext): Array<{ role: 'user' | 'assistant', content: string }> {
    return context.conversationFlow
      .slice(-10) // Last 10 turns
      .map(turn => ({
        role: turn.role,
        content: turn.content
      }))
  }

  /**
   * Maintains context memory by cleaning old data
   */
  private static maintainContextMemory(context: ConversationContext): void {
    // Keep only recent turns
    if (context.conversationFlow.length > this.MAX_TURNS_RETAINED) {
      context.conversationFlow = context.conversationFlow.slice(-this.MAX_TURNS_RETAINED)
    }
    
    // Clean old references
    const cutoffTime = new Date(Date.now() - (12 * 60 * 60 * 1000)) // 12 hours
    context.referenceMemory = context.referenceMemory.filter(
      ref => ref.timestamp > cutoffTime
    )
    
    // Clean old intentions
    if (context.activeIntentions.length > 3) {
      context.activeIntentions = context.activeIntentions.slice(-3)
    }
  }

  /**
   * Gets conversation statistics using persistent storage
   */
  static getConversationStats(userId?: string): any {
    const { getUserActiveSessions } = require('./temp-storage')
    
    if (userId) {
      const userSessions = getUserActiveSessions(userId)
      
      return {
        activeContexts: userSessions.length,
        totalTurns: userSessions.reduce((sum: number, session: any) => sum + session.turns.length, 0),
        currentTopics: [...new Set(userSessions.map((session: any) => session.currentTopic).filter(Boolean))],
        currentSubjects: [...new Set(userSessions.map((session: any) => session.currentSubject).filter(Boolean))]
      }
    }
    
    // For global stats, we need to import the conversations array
    const { tempConversations } = require('./temp-storage')
    const activeConversations = tempConversations.filter((session: any) => {
      const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000))
      return session.lastUpdate > oneHourAgo
    })
    
    return {
      totalActiveContexts: activeConversations.length,
      totalUsers: new Set(activeConversations.map((session: any) => session.userId)).size,
      averageContextAge: this.calculateAverageContextAgeFromSessions(activeConversations)
    }
  }

  /**
   * Calculates average context age from persistent sessions
   */
  private static calculateAverageContextAgeFromSessions(sessions: any[]): number {
    if (sessions.length === 0) return 0
    
    const now = Date.now()
    const totalAge = sessions.reduce((sum: number, session: any) => 
      sum + (now - new Date(session.lastUpdate).getTime()), 0)
    
    return Math.round(totalAge / sessions.length / (60 * 1000)) // Average age in minutes
  }

  /**
   * Forces cleanup of all contexts (useful for testing)
   */
  static clearAllContexts(): void {
    const { cleanupOldConversations } = require('./temp-storage')
    cleanupOldConversations()
    console.log('🧹 All conversation contexts cleared using persistent storage')
  }

  /**
   * Gets active context for user (useful for debugging)
   */
  static getActiveContext(userId: string, sessionId?: string): ConversationContext | null {
    const { getConversationSession, getUserActiveSessions } = require('./temp-storage')
    
    if (sessionId) {
      const session = getConversationSession(userId, sessionId)
      if (session) {
        return {
          userId: session.userId,
          sessionId: session.sessionId,
          currentTopic: session.currentTopic,
          currentSubject: session.currentSubject,
          conversationFlow: session.turns,
          contextSummary: this.buildContextSummary(session),
          activeIntentions: this.extractActiveIntentions(session.turns.slice(-5)),
          pendingQuestions: [],
          referenceMemory: this.buildReferenceMemory(session.turns),
          lastUpdate: session.lastUpdate
        }
      }
    }
    
    // Find any active session for user
    const activeSessions = getUserActiveSessions(userId)
    if (activeSessions.length > 0) {
      const session = activeSessions[0]
      return {
        userId: session.userId,
        sessionId: session.sessionId,
        currentTopic: session.currentTopic,
        currentSubject: session.currentSubject,
        conversationFlow: session.turns,
        contextSummary: this.buildContextSummary(session),
        activeIntentions: this.extractActiveIntentions(session.turns.slice(-5)),
        pendingQuestions: [],
        referenceMemory: this.buildReferenceMemory(session.turns),
        lastUpdate: session.lastUpdate
      }
    }
    
    return null
  }
}

// Persistent storage cleanup is handled by temp-storage.ts
// No need for additional cleanup intervals