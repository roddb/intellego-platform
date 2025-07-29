import { AcademicAnalyzer, AcademicSubject, type AcademicAnalysis } from './academic-analyzer'
import { aiService } from './ai-providers'
import { ExerciseSolver } from './exercise-solver'
import { 
  AICalendarIntegration, 
  analyzeConversationForEvents, 
  findUserEvents, 
  editEventFromAI, 
  deleteEventFromAI 
} from './calendar-ai-integration'
import { NotificationService, NotificationTrigger, NotificationPriority } from './notification-service'
import { AcademicSearchEngine } from './academic-search-engine'

export interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    subject?: AcademicSubject
    exerciseId?: string
    suggestedActions?: string[]
  }
}

export interface ConversationContext {
  userId: string
  userName?: string
  currentSubject?: AcademicSubject
  academicAnalysis?: AcademicAnalysis
  conversationHistory: ChatMessage[]
  lastInteraction: Date
  currentMode: 'chat' | 'assessment' | 'exercise' | 'explanation' | 'calendar_integration'
  calendarIntegration?: AICalendarIntegration
}

export interface AssessmentQuestion {
  id: string
  subject: AcademicSubject
  topic: string
  question: string
  type: 'multiple_choice' | 'open_ended' | 'problem_solving'
  options?: string[]
  correctAnswer?: string
  explanation: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

export class ConversationEngine {
  
  /**
   * Procesa un mensaje del usuario de forma stateless
   */
  static async processUserMessage(
    userId: string, 
    message: string, 
    userName?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  ): Promise<ChatMessage> {
    // Use contextual conversation manager for better coherence
    try {
      const { ContextualConversationManager } = require('./contextual-conversation-manager')
      const contextualResponse = await ContextualConversationManager.processContextualMessage(
        userId, message, undefined, userName
      )
      
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: contextualResponse.content,
        timestamp: new Date(),
        metadata: {
          subject: contextualResponse.context.currentSubject,
          suggestedActions: contextualResponse.suggestedFollowups.concat(
            contextualResponse.visualRecommendation ? 
            [`Generar ${contextualResponse.visualRecommendation.type}`] : []
          )
        }
      }
    } catch (error) {
      console.log('Fallback to basic conversation engine:', error)
      // Fallback to original stateless processing
    }

    // Cargar análisis académico en cada request (stateless)
    const academicAnalysis = await AcademicAnalyzer.analyzeStudent(userId)

    // Verificar comandos de calendario (editar, eliminar, listar)
    const calendarAdminResult = await this.handleCalendarAdminCommands(userId, message)
    if (calendarAdminResult) {
      return calendarAdminResult
    }

    // Verificar si hay un calendario de integración en curso
    const calendarIntegration = new AICalendarIntegration(userId)
    
    // Analizar si se mencionan eventos que requieren creación en calendario
    const conversationForCalendar = conversationHistory || []
    const calendarResult = await calendarIntegration.processMessage(message, conversationForCalendar)
    
    if (calendarResult.needsEventCreation) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: calendarResult.response || '',
        timestamp: new Date(),
        metadata: {
          suggestedActions: calendarResult.event 
            ? ['Ver en calendario', 'Editar evento', 'Eliminar evento']
            : ['Reintentar', 'Proporcionar más detalles']
        }
      }
    }

    // Analizar intención del usuario (stateless)
    const intent = this.analyzeUserIntent(message, academicAnalysis)
    
    // Generar respuesta basada en la intención
    let aiResponse: ChatMessage
    
    switch (intent.type) {
      case 'solve_exercise':
        aiResponse = await this.handleExerciseSolution(message, intent.subject!, academicAnalysis, userName)
        break
      case 'request_assessment':
        aiResponse = await this.handleAssessmentRequest(intent.subject!, academicAnalysis, userName)
        break
      case 'ask_question':
        aiResponse = await this.handleEducationalQuestion(message, intent.subject, academicAnalysis, userName)
        break
      case 'academic_search':
        aiResponse = await this.handleAcademicSearch(message, intent.subject, intent.topic, userId, userName)
        break
      case 'request_help':
        aiResponse = await this.handleHelpRequest(intent.topic!, academicAnalysis, userName)
        break
      case 'casual_chat':
        aiResponse = await this.handleCasualChat(message, userName)
        break
      default:
        aiResponse = await this.handleGeneralResponse(message)
    }
    
    // This fallback should never be reached due to the try/catch above
    console.error('❌ CRITICAL: Reached unreachable fallback code in conversation engine')
    throw new Error('Fallback code should not be reachable')
  }

  /**
   * Legacy method for backward compatibility - redirects to contextual manager
   */
  static async processUserMessageLegacy(
    userId: string, 
    message: string, 
    userName?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
  ): Promise<ChatMessage> {
    console.log('⚠️ Using legacy method - redirecting to main processUserMessage')
    return this.processUserMessage(userId, message, userName, conversationHistory)
  }

  /**
   * Analiza la intención del usuario (stateless)
   */
  private static analyzeUserIntent(message: string, academicAnalysis: AcademicAnalysis): {
    type: 'solve_exercise' | 'request_assessment' | 'ask_question' | 'request_help' | 'academic_search' | 'casual_chat' | 'general'
    subject?: AcademicSubject
    topic?: string
    confidence: number
  } {
    const msgLower = message.toLowerCase()

    // PRIMERA PRIORIDAD: Detectar si es un ejercicio para resolver
    const exerciseDetection = ExerciseSolver.detectExercise(message)
    if (exerciseDetection.hasExercise && exerciseDetection.confidence > 0.6) {
      // Mapear subjects del ExerciseSolver a AcademicSubject
      const subjectMap = {
        'physics': AcademicSubject.PHYSICS,
        'chemistry': AcademicSubject.CHEMISTRY, 
        'mathematics': AcademicSubject.MATHEMATICS,
        'general': AcademicSubject.GENERAL
      }
      return { 
        type: 'solve_exercise', 
        subject: subjectMap[exerciseDetection.subject], 
        confidence: exerciseDetection.confidence 
      }
    }

    // Detectar solicitud de evaluación
    if (msgLower.includes('evaluación') || msgLower.includes('evaluar') || 
        msgLower.includes('examen') || msgLower.includes('prueba') ||
        msgLower.includes('ejercicio') || msgLower.includes('practicar')) {
      const subject = this.detectSubject(message)
      return { type: 'request_assessment', subject, confidence: 0.8 }
    }

    // Detectar pregunta educativa
    if (msgLower.includes('¿') || msgLower.includes('cómo') || 
        msgLower.includes('qué es') || msgLower.includes('explica') ||
        msgLower.includes('no entiendo')) {
      const subject = this.detectSubject(message)
      return { type: 'ask_question', subject, confidence: 0.7 }
    }

    // Detectar búsqueda académica
    if (msgLower.includes('busca') || msgLower.includes('buscar') || 
        msgLower.includes('encuentra') || msgLower.includes('encontrar') ||
        msgLower.includes('necesito información') || msgLower.includes('recursos sobre') ||
        msgLower.includes('material de') || msgLower.includes('ejemplos de')) {
      const subject = this.detectSubject(message)
      const topic = this.extractTopic(message)
      return { type: 'academic_search', subject, topic, confidence: 0.8 }
    }

    // Detectar solicitud de ayuda
    if (msgLower.includes('ayuda') || msgLower.includes('difícil') ||
        msgLower.includes('no puedo') || msgLower.includes('me cuesta')) {
      const topic = this.extractTopic(message)
      return { type: 'request_help', topic, confidence: 0.6 }
    }

    // Detectar charla casual
    if (msgLower.includes('hola') || msgLower.includes('gracias') ||
        msgLower.includes('bien') || msgLower.includes('mal')) {
      return { type: 'casual_chat', confidence: 0.5 }
    }

    return { type: 'general', confidence: 0.3 }
  }

  /**
   * Detecta la materia mencionada en el mensaje
   */
  private static detectSubject(message: string): AcademicSubject | undefined {
    const msgLower = message.toLowerCase()
    
    if (msgLower.includes('matemática') || msgLower.includes('álgebra') || 
        msgLower.includes('geometría') || msgLower.includes('cálculo')) {
      return AcademicSubject.MATHEMATICS
    }
    if (msgLower.includes('física') || msgLower.includes('mecánica') || 
        msgLower.includes('energía') || msgLower.includes('fuerza')) {
      return AcademicSubject.PHYSICS
    }
    if (msgLower.includes('química') || msgLower.includes('átomo') || 
        msgLower.includes('reacción') || msgLower.includes('elemento')) {
      return AcademicSubject.CHEMISTRY
    }
    
    return undefined
  }

  /**
   * Extrae el tema específico del mensaje
   */
  private static extractTopic(message: string): string {
    // Extraer palabras clave que podrían ser temas
    const words = message.toLowerCase().split(' ')
    const topics = ['ecuaciones', 'funciones', 'derivadas', 'integrales', 'geometría',
                   'cinemática', 'dinámica', 'termodinámica', 'electricidad',
                   'átomos', 'moléculas', 'enlaces', 'reacciones']
    
    const foundTopic = topics.find(topic => words.includes(topic))
    return foundTopic || 'tema general'
  }

  /**
   * Maneja la resolución de ejercicios paso a paso (stateless)
   */
  private static async handleExerciseSolution(message: string, subject: AcademicSubject, academicAnalysis: AcademicAnalysis, userName?: string): Promise<ChatMessage> {
    // Mapear AcademicSubject a los subjects del ExerciseSolver
    const subjectMap = {
      [AcademicSubject.PHYSICS]: 'physics' as const,
      [AcademicSubject.CHEMISTRY]: 'chemistry' as const,
      [AcademicSubject.MATHEMATICS]: 'mathematics' as const,
      [AcademicSubject.GENERAL]: 'general' as const
    }

    const solverSubject = subjectMap[subject] || 'general'
    
    // Obtener contexto del estudiante
    const studentContext = AcademicAnalyzer.getExerciseContext(academicAnalysis, subject)

    try {
      const solution = await ExerciseSolver.solveExercise(message, solverSubject, studentContext)
      
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: solution.solution,
        timestamp: new Date(),
        metadata: {
          subject: this.getSubjectName(subject),
          suggestedActions: [
            'Explicar un paso específico',
            'Resolver otro ejercicio similar', 
            'Verificar mi solución',
            'Practicar más ejercicios'
          ]
        }
      }
    } catch (error) {
      console.error('Error solving exercise:', error)
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `He detectado que quieres resolver un ejercicio de ${this.getSubjectName(subject)}.\n\n` +
          `Estoy teniendo dificultades técnicas para resolverlo ahora mismo, pero puedo ayudarte de otras maneras:\n\n` +
          `• Te puedo guiar paso a paso en la metodología\n` +
          `• Puedo explicarte los conceptos que necesitas\n` +
          `• Te ayudo a organizar los datos del problema\n\n` +
          `¿Te gustaría que empecemos con alguno de estos enfoques?`,
        timestamp: new Date(),
        metadata: {
          subject: this.getSubjectName(subject),
          suggestedActions: ['Guiar metodología', 'Explicar conceptos', 'Organizar datos']
        }
      }
    }
  }

  /**
   * Maneja solicitudes de evaluación (stateless)
   */
  private static async handleAssessmentRequest(subject: AcademicSubject, academicAnalysis: AcademicAnalysis, userName?: string): Promise<ChatMessage> {
    const subjectAnalysis = academicAnalysis.subjects.find(s => s.subject === subject)
    
    let content = `¡Perfecto! Vamos a hacer una evaluación adaptativa de ${this.getSubjectName(subject)}.\n\n`
    
    if (subjectAnalysis) {
      content += `Basándome en tu progreso actual (${subjectAnalysis.performance}%), `
      
      if (subjectAnalysis.needsAttention) {
        content += `veo que has tenido algunas dificultades con: ${subjectAnalysis.specificChallenges.join(', ')}.\n\n`
        content += `Empezaremos con ejercicios de refuerzo para fortalecer estos conceptos.`
      } else {
        content += `tienes un buen dominio. Te propongo ejercicios que te desafíen un poco más.`
      }
    } else {
      content += `Como no tengo datos previos sobre tu desempeño en esta materia, empezaremos con una evaluación diagnóstica.`
    }

    content += `\n\n¿Estás listo para comenzar? Puedes decirme si prefieres:\n`
    content += `• Ejercicios paso a paso\n`
    content += `• Preguntas de opción múltiple\n`
    content += `• Problemas para resolver`

    return {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata: {
        subject,
        suggestedActions: ['Comenzar ejercicios paso a paso', 'Preguntas opción múltiple', 'Problemas para resolver']
      }
    }
  }

  /**
   * Maneja preguntas educativas (stateless)
   */
  private static async handleEducationalQuestion(question: string, subject: AcademicSubject | undefined, academicAnalysis: AcademicAnalysis, userName?: string): Promise<ChatMessage> {
    // Crear prompt contextualizado para la IA
    const analysisContext = AcademicAnalyzer.getExerciseContext(academicAnalysis, subject)

    const prompt = `Eres un tutor educativo experto. Responde esta pregunta de un estudiante de secundaria:

Pregunta: "${question}"

Contexto del estudiante: ${analysisContext}

Instrucciones:
- Responde de manera clara y didáctica
- Usa ejemplos concretos y relevantes
- Adapta el lenguaje al nivel del estudiante
- Si es un concepto complejo, divídelo en pasos simples
- Ofrece al final preguntarle si quiere practicar con ejercicios

Respuesta:`

    try {
      const aiResponse = await aiService.generateExercise(prompt)
      
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiResponse === 'TEMPLATE_FALLBACK' ? 
          this.getFallbackEducationalResponse(question, subject) : 
          aiResponse,
        timestamp: new Date(),
        metadata: {
          subject,
          suggestedActions: ['Practicar con ejercicios', 'Hacer más preguntas', 'Explicación más detallada']
        }
      }
    } catch (error) {
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: this.getFallbackEducationalResponse(question, subject),
        timestamp: new Date(),
        metadata: { subject }
      }
    }
  }

  /**
   * Maneja solicitudes de ayuda (stateless)
   */
  private static async handleHelpRequest(topic: string, academicAnalysis: AcademicAnalysis, userName?: string): Promise<ChatMessage> {
    let content = `Entiendo que necesitas ayuda con ${topic}. `
    
    const strugglingAreas = academicAnalysis.strugglingAreas
    if (strugglingAreas.some(area => area.toLowerCase().includes(topic.toLowerCase()))) {
      content += `Veo que has mencionado dificultades similares en tus reportes anteriores.\n\n`
    }

    content += `Vamos a abordar esto paso a paso:\n\n`
    content += `1. **Primero**: ¿Podrías contarme específicamente qué parte de ${topic} te resulta más confusa?\n`
    content += `2. **Segundo**: Te ayudaré con explicaciones simples y ejemplos\n`
    content += `3. **Tercero**: Practicaremos con ejercicios graduales\n\n`
    content += `¿Por dónde te gustaría empezar?`

    return {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata: {
        suggestedActions: ['Explicar mi dificultad específica', 'Ver ejemplos simples', 'Empezar con lo básico']
      }
    }
  }

  /**
   * Maneja charla casual (stateless)
   */
  private static async handleCasualChat(message: string, userName?: string): Promise<ChatMessage> {
    const msgLower = message.toLowerCase()
    
    let content = ''
    
    if (msgLower.includes('hola')) {
      content = `¡Hola${userName ? ' ' + userName : ''}! 😊 `
      content += `¿En qué puedo ayudarte hoy? Puedo ayudarte con tus materias, resolver dudas o hacer ejercicios juntos.`
    } else if (msgLower.includes('gracias')) {
      content = `¡De nada! Es un placer ayudarte. 😊 `
      content += `¿Hay algo más en lo que pueda apoyarte? Estoy aquí para que aprendas y te diviertas haciéndolo.`
    } else if (msgLower.includes('bien') || msgLower.includes('genial')) {
      content = `¡Qué bueno escuchar eso! 🎉 `
      content += `¿Te gustaría aprovechar este buen momento para practicar algún tema o resolver alguna duda?`
    } else if (msgLower.includes('mal') || msgLower.includes('difícil')) {
      content = `Entiendo que te sientes así. Es normal tener días más desafiantes. 💪 `
      content += `¿Quieres contarme qué está siendo difícil? Juntos podemos encontrar la manera de hacerlo más fácil.`
    } else {
      content = `Gracias por compartir eso conmigo. ¿Cómo puedo ayudarte mejor hoy?`
    }

    return {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata: {
        suggestedActions: ['Ver mis materias', 'Hacer una evaluación', 'Resolver una duda']
      }
    }
  }

  /**
   * Maneja búsquedas académicas (stateless)
   */
  private static async handleAcademicSearch(
    message: string, 
    subject: AcademicSubject | undefined, 
    topic: string | undefined, 
    userId: string,
    userName?: string
  ): Promise<ChatMessage> {
    try {
      // Realizar búsqueda inteligente usando el motor académico
      const searchResult = await AcademicSearchEngine.smartSearch(message, userId)
      
      if (!searchResult) {
        // Si no se detectó una búsqueda válida, responder con sugerencias
        return {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: `No pude identificar exactamente qué estás buscando. ¿Podrías ser más específico?\n\n` +
            `Por ejemplo:\n` +
            `• "Busca información sobre ecuaciones cuadráticas"\n` +
            `• "Necesito ejemplos de reacciones químicas"\n` +
            `• "Encuentra recursos sobre la Segunda Guerra Mundial"`,
          timestamp: new Date(),
          metadata: {
            suggestedActions: ['Reformular búsqueda', 'Especificar tema', 'Elegir materia']
          }
        }
      }

      // Generar notificación proactiva
      const notification = await NotificationService.createAcademicNotification(
        userId,
        searchResult.query,
        NotificationTrigger.KNOWLEDGE_GAP,
        '🔍 Búsqueda Académica Completada',
        `Encontré recursos valiosos sobre ${searchResult.query.topic} que pueden ayudarte.`
      )

      // Construir respuesta con resultados
      let content = `🔍 **Búsqueda Académica Completada**\n\n`
      content += `He encontrado **${searchResult.totalResults}** recursos sobre **${searchResult.query.topic}**:\n\n`

      // Mostrar los mejores resultados
      const topResults = searchResult.results.slice(0, 3)
      topResults.forEach((result, index) => {
        content += `**${index + 1}. ${result.title}**\n`
        content += `📖 ${result.summary}\n`
        content += `⭐ Relevancia: ${(result.relevanceScore * 100).toFixed(0)}% | `
        content += `📚 Nivel: ${result.difficulty} | `
        content += `⏱️ Lectura: ${result.estimatedReadTime} min\n\n`
      })

      // Agregar recomendaciones personalizadas
      if (searchResult.personalizedRecommendations.length > 0) {
        content += `💡 **Recomendaciones Personalizadas:**\n`
        searchResult.personalizedRecommendations.forEach(rec => {
          content += `• ${rec}\n`
        })
        content += `\n`
      }

      // Agregar preguntas de seguimiento
      if (searchResult.followUpQuestions.length > 0) {
        content += `❓ **¿Te interesa saber más sobre:**\n`
        searchResult.followUpQuestions.slice(0, 2).forEach(question => {
          content += `• ${question}\n`
        })
      }

      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content,
        timestamp: new Date(),
        metadata: {
          subject,
          suggestedActions: [
            'Ver detalles de resultados',
            'Buscar tema relacionado',
            'Generar ejercicios',
            'Crear recordatorio'
          ],
          searchResults: searchResult,
          notification
        }
      }

    } catch (error) {
      console.error('Error in academic search:', error)
      
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `Hubo un problema al buscar información sobre "${topic || 'tu consulta'}". ` +
          `Esto puede deberse a problemas de conectividad.\n\n` +
          `Mientras tanto, puedo ayudarte con:\n` +
          `• Explicaciones sobre conceptos específicos\n` +
          `• Ejercicios sobre temas que ya domino\n` +
          `• Repaso de material previo`,
        timestamp: new Date(),
        metadata: {
          subject,
          suggestedActions: ['Reintentar búsqueda', 'Explicar conceptos', 'Hacer ejercicios']
        }
      }
    }
  }

  /**
   * Maneja respuestas generales (stateless)
   */
  private static async handleGeneralResponse(message: string): Promise<ChatMessage> {
    const content = `Entiendo tu mensaje. ¿Podrías ser más específico sobre cómo puedo ayudarte?\n\n` +
      `Puedo ayudarte con:\n` +
      `• Resolver dudas sobre tus materias\n` +
      `• Hacer ejercicios y evaluaciones\n` +
      `• Explicar conceptos difíciles\n` +
      `• Buscar información académica\n` +
      `• Revisar tu progreso académico\n\n` +
      `¿Qué te interesa más?`

    return {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata: {
        suggestedActions: ['Resolver dudas', 'Hacer ejercicios', 'Buscar información', 'Ver mi progreso']
      }
    }
  }

  /**
   * Crea mensaje de bienvenida personalizado (stateless)
   */
  static async createWelcomeMessage(userId: string, userName?: string): Promise<ChatMessage> {
    const analysis = await AcademicAnalyzer.analyzeStudent(userId)
    
    let content = `¡Hola${userName ? ' ' + userName : ''}! 👋 Soy tu tutor personal de IA.\n\n`
    
    if (analysis.subjects.length > 0) {
      content += `He revisado tu progreso académico y veo que tienes:\n`
      
      const strongSubjects = analysis.subjects.filter(s => s.performance > 75)
      const strugglingSubjects = analysis.subjects.filter(s => s.needsAttention)
      
      if (strongSubjects.length > 0) {
        content += `✅ **Fortalezas**: ${strongSubjects.map(s => s.subjectName).join(', ')}\n`
      }
      
      if (strugglingSubjects.length > 0) {
        content += `🎯 **Áreas de mejora**: ${strugglingSubjects.map(s => s.subjectName).join(', ')}\n`
      }
      
      content += `\n`
    }
    
    content += `¿En qué puedo ayudarte hoy?\n`
    content += `• **Resolver ejercicios**: Paso a paso con explicaciones detalladas\n`
    content += `• **Evaluación**: Hacer ejercicios adaptativos\n`
    content += `• **Dudas**: Resolver preguntas específicas\n`
    content += `• **Repaso**: Revisar conceptos importantes`

    // Obtener acciones sugeridas
    const actions: string[] = []
    const strugglingSubjects = analysis.subjects.filter(s => s.needsAttention)
    if (strugglingSubjects.length > 0) {
      actions.push(`Practicar ${strugglingSubjects[0].subjectName}`)
    }
    actions.push('Hacer una evaluación')
    actions.push('Resolver una duda')
    actions.push('Ver mi progreso')

    return {
      id: `welcome_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      metadata: {
        suggestedActions: actions
      }
    }
  }

  /**
   * Obtiene el nombre legible de una materia
   */
  private static getSubjectName(subject: AcademicSubject): string {
    const names = {
      [AcademicSubject.MATHEMATICS]: 'Matemáticas',
      [AcademicSubject.PHYSICS]: 'Física',
      [AcademicSubject.CHEMISTRY]: 'Química',
      [AcademicSubject.BIOLOGY]: 'Biología',
      [AcademicSubject.SPANISH]: 'Lengua y Literatura',
      [AcademicSubject.ENGLISH]: 'Inglés',
      [AcademicSubject.HISTORY]: 'Historia',
      [AcademicSubject.GEOGRAPHY]: 'Geografía',
      [AcademicSubject.GENERAL]: 'General'
    }
    return names[subject]
  }

  /**
   * Respuesta de fallback para preguntas educativas
   */
  private static getFallbackEducationalResponse(question: string, subject?: AcademicSubject): string {
    return `Esa es una excelente pregunta sobre ${subject ? this.getSubjectName(subject) : 'el tema'}.\n\n` +
      `Te ayudo a pensar sobre esto paso a paso:\n\n` +
      `1. **Identifica los conceptos clave** en tu pregunta\n` +
      `2. **Piensa en ejemplos concretos** que conozcas\n` +
      `3. **Conecta con lo que ya sabes** de temas anteriores\n\n` +
      `¿Te gustaría que te ayude con ejercicios prácticos sobre este tema?`
  }

  /**
   * Maneja comandos administrativos del calendario (editar, eliminar, listar)
   */
  private static async handleCalendarAdminCommands(
    userId: string, 
    message: string
  ): Promise<ChatMessage | null> {
    const msgLower = message.toLowerCase()
    
    // Comando: Listar eventos
    if (/(?:muestra|lista|ver).*(?:eventos?|calendario)/i.test(message) ||
        /(?:eventos?|calendario).*(?:de\s+)?(?:esta\s+semana|hoy|mañana)/i.test(message)) {
      
      const events = findUserEvents(userId, '')
      const today = new Date()
      const oneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today && eventDate <= oneWeek
      })
      
      if (upcomingEvents.length === 0) {
        return {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: `📅 No tienes eventos programados para esta semana.\n\n¿Te gustaría que te ayude a agendar alguno?`,
          timestamp: new Date(),
          metadata: {
            suggestedActions: ['Agendar examen', 'Agendar sesión de estudio', 'Ver calendario completo']
          }
        }
      }
      
      const eventList = upcomingEvents.map(event => {
        const dateStr = event.date.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
        return `• **${event.title}** - ${dateStr} a las ${event.startTime}${event.location ? ` (${event.location})` : ''}`
      }).join('\n')
      
      return {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `📅 **Tus próximos eventos:**\n\n${eventList}\n\n¿Necesitas editar o eliminar alguno?`,
        timestamp: new Date(),
        metadata: {
          suggestedActions: ['Editar evento', 'Eliminar evento', 'Agendar nuevo evento']
        }
      }
    }
    
    // Comando: Eliminar evento
    if (/(?:elimin[ae]|borr[ae]|quit[ae]|cancel[ae])/i.test(message)) {
      const searchTerms = message.match(/(?:examen|evento|sesión).*?(?:de\s+)?([a-záéíóúñ]+)/i)
      
      if (searchTerms) {
        const searchTerm = searchTerms[1] || searchTerms[0]
        const foundEvents = findUserEvents(userId, searchTerm)
        
        if (foundEvents.length === 0) {
          return {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `❌ No encontré eventos relacionados con "${searchTerm}".\n\n¿Podrías ser más específico sobre qué evento quieres eliminar?`,
            timestamp: new Date(),
            metadata: {
              suggestedActions: ['Ver todos mis eventos', 'Ser más específico']
            }
          }
        }
        
        if (foundEvents.length === 1) {
          const event = foundEvents[0]
          const deleteResult = await deleteEventFromAI(event.id)
          
          return {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: deleteResult.success 
              ? `✅ ${deleteResult.message}`
              : `❌ ${deleteResult.message}`,
            timestamp: new Date(),
            metadata: {
              suggestedActions: deleteResult.success 
                ? ['Ver calendario', 'Agendar nuevo evento']
                : ['Reintentar', 'Ver eventos']
            }
          }
        } else {
          const eventList = foundEvents.slice(0, 3).map(e => `• ${e.title}`).join('\n')
          return {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `🔍 Encontré varios eventos relacionados:\n\n${eventList}\n\n¿Cuál quieres eliminar específicamente?`,
            timestamp: new Date(),
            metadata: {
              suggestedActions: foundEvents.slice(0, 3).map(e => `Eliminar: ${e.title}`)
            }
          }
        }
      }
    }
    
    return null
  }

}