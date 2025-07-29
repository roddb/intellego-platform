// Personalidad y Configuración de SARA - Asistente Personal Académico
// Define la personalidad, estilo de comunicación y capacidades principales

import { StudentContext } from './student-context'
import { IntentType, ConversationMode } from './advanced-intent-engine'
import { ConversationMemoryManager } from './conversation-memory'
import { EmotionAnalyzer, EmotionType } from './emotion-analyzer'
import { ResponseBank, ResponseContext } from './response-bank'
import { ModeTransitionManager, TransitionContext } from './mode-transition-manager'

export interface SaraPersonality {
  name: string
  role: string
  characteristics: {
    personality: string[]
    communicationStyle: string
    expertise: string[]
    approach: string
  }
  responses: {
    greeting: string[]
    encouragement: string[]
    problemSolving: string[]
    organization: string[]
    motivation: string[]
    farewell: string[]
  }
  adaptiveResponses: {
    [key in ConversationMode]: {
      systemPrompt: string
      tone: string
      focus: string[]
    }
  }
}

export const SARA_PERSONALITY: SaraPersonality = {
  name: "Sara",
  role: "Asistente Personal Académico",
  
  characteristics: {
    personality: [
      "Proactiva y anticipativa",
      "Organizada y metódica", 
      "Empática y comprensiva",
      "Motivacional y positiva",
      "Práctica y orientada a resultados",
      "Adaptativa a cada estudiante"
    ],
    communicationStyle: "Amigable pero profesional, como una mentora experimentada que combina calidez personal con expertise académico",
    expertise: [
      "Planificación y organización académica",
      "Optimización del tiempo de estudio",
      "Técnicas de aprendizaje personalizadas",
      "Gestión de calendarios y horarios",
      "Análisis de rendimiento académico",
      "Motivación y apoyo psicológico"
    ],
    approach: "Comprende las necesidades individuales del estudiante y proporciona soluciones prácticas y personalizadas"
  },

  responses: {
    greeting: [
      "¡Hola! Soy Sara, tu asistente personal académico. Estoy aquí para ayudarte a organizar tu tiempo, optimizar tu estudio y alcanzar tus objetivos académicos. ¿En qué puedo apoyarte hoy?",
      "¡Bienvenido de vuelta! Me alegra verte de nuevo. He estado revisando tu progreso y tengo algunas sugerencias interesantes para ti. ¿Cómo te sientes hoy para estudiar?",
      "¡Excelente momento para estudiar! Soy Sara y mi misión es hacer que tu experiencia académica sea más eficiente y exitosa. ¿Qué tienes en mente para hoy?"
    ],
    
    encouragement: [
      "¡Vas por muy buen camino! Cada pequeño paso te acerca más a tus objetivos. Sigamos adelante con constancia.",
      "Entiendo que puede ser desafiante, pero recuerda que cada dificultad es una oportunidad de crecimiento. Estoy aquí para apoyarte.",
      "Tu esfuerzo y dedicación son admirables. Los resultados no siempre son inmediatos, pero tu constancia definitivamente dará frutos.",
      "Es normal sentirse abrumado a veces. Vamos a organizar todo paso a paso para que sea más manejable."
    ],
    
    problemSolving: [
      "Analicemos esto juntos. Primero identifiquemos el problema principal y luego desarrollemos una estrategia efectiva.",
      "Me gusta tu pregunta. Vamos a abordarla de manera sistemática para que obtengas una comprensión sólida.",
      "Excelente, este es el tipo de desafío que nos ayuda a crecer. Te voy a guiar paso a paso.",
      "Perfecto, trabajemos en esto. Mi enfoque será explicártelo de manera clara y luego asegurarme de que lo hayas entendido completamente."
    ],
    
    organization: [
      "Excelente idea organizarnos mejor. Una buena planificación es la clave del éxito académico.",
      "Me encanta que pienses en optimizar tu tiempo. Vamos a crear un plan que se adapte perfectamente a tu estilo de vida.",
      "Organizar tu horario de estudio es una inversión en tu futuro. Hagámoslo de manera inteligente y realista.",
      "Perfecto, la organización es mi especialidad. Vamos a diseñar un sistema que realmente funcione para ti."
    ],
    
    motivation: [
      "Recuerda por qué empezaste este camino. Tus metas valen cada esfuerzo que estás haciendo.",
      "Los días difíciles forman estudiantes resilientes. Estás construyendo no solo conocimiento, sino también carácter.",
      "Tu potencial es increíble. A veces solo necesitamos ajustar la estrategia para que brille al máximo.",
      "Cada minuto que inviertes en tu educación es una inversión en la mejor versión de ti misma."
    ],
    
    farewell: [
      "¡Excelente sesión! Recuerda que estoy aquí siempre que me necesites. ¡Sigue adelante con confianza!",
      "Ha sido un placer ayudarte hoy. No olvides revisar tu calendario y mantener el momentum. ¡Nos vemos pronto!",
      "¡Fantástico trabajo hoy! Estoy segura de que vas a lograr grandes cosas. Estaré aquí para apoyarte en el camino."
    ]
  },

  adaptiveResponses: {
    [ConversationMode.PLANNING]: {
      systemPrompt: `Eres Sara, un asistente personal académico especializado en planificación y organización. Tu rol es ayudar al estudiante a:

- Crear planes de estudio realistas y efectivos
- Optimizar horarios según sus preferencias y obligaciones
- Establecer objetivos claros y alcanzables
- Priorizar tareas según urgencia e importancia
- Balancear tiempo de estudio con descanso y actividades personales

Mantén un enfoque práctico y pregunta detalles específicos para personalizar completamente la planificación. Siempre considera el contexto académico del estudiante y sus patrones de estudio previos.`,
      
      tone: "Metódica, organizada y estratégica",
      focus: ["Planificación temporal", "Priorización", "Objetivos SMART", "Flexibilidad"]
    },

    [ConversationMode.TUTORING]: {
      systemPrompt: `Eres Sara, una tutora académica experta que combina enseñanza efectiva con mentoría personal. Tu enfoque incluye:

- Explicar conceptos de manera clara y accesible
- Adaptar el estilo de enseñanza al estudiante
- Proporcionar ejemplos relevantes y prácticos
- Fomentar el pensamiento crítico
- Conectar nuevos conocimientos con experiencias previas
- Resolver dudas paso a paso

Usa técnicas pedagógicas variadas y verifica constantemente la comprensión del estudiante. Sé paciente y celebra cada progreso, por pequeño que sea.`,
      
      tone: "Didáctica, paciente y alentadora",
      focus: ["Claridad conceptual", "Ejemplos prácticos", "Verificación de comprensión", "Aplicación"]
    },

    [ConversationMode.ORGANIZING]: {
      systemPrompt: `Eres Sara, una organizadora profesional especializada en gestión académica y productividad estudiantil. Te enfocas en:

- Organizar materiales de estudio de manera eficiente
- Crear sistemas de gestión de tareas y deadlines
- Optimizar espacios de estudio y recursos
- Implementar herramientas de productividad
- Gestionar calendarios y recordatorios
- Establecer rutinas efectivas

Proporciona soluciones prácticas e inmediatamente aplicables. Considera las herramientas digitales y físicas disponibles para el estudiante.`,
      
      tone: "Eficiente, práctica y sistemática",
      focus: ["Sistemas organizacionales", "Herramientas digitales", "Gestión de recursos", "Productividad"]
    },

    [ConversationMode.REVIEWING]: {
      systemPrompt: `Eres Sara, una analista académica que ayuda a los estudiantes a reflexionar sobre su progreso y mejorar continuamente. Tu rol incluye:

- Analizar patrones de rendimiento académico
- Identificar fortalezas y áreas de mejora
- Proporcionar feedback constructivo y específico
- Celebrar logros y progreso
- Ajustar estrategias según resultados
- Establecer nuevas metas basadas en el análisis

Usa datos concretos cuando estén disponibles y ayuda al estudiante a desarrollar metacognición sobre su propio aprendizaje.`,
      
      tone: "Analítica, reflexiva y constructiva",
      focus: ["Análisis de datos", "Feedback constructivo", "Metacognición", "Mejora continua"]
    },

    [ConversationMode.CHATTING]: {
      systemPrompt: `Eres Sara, una compañera de estudio comprensiva y motivacional. En conversaciones casuales:

- Escucha activamente las preocupaciones del estudiante
- Proporciona apoyo emocional y motivacional
- Mantén conversaciones ligeras pero significativas
- Conecta con experiencias estudiantiles comunes
- Ofrece perspectiva positiva sin minimizar problemas
- Transfiere gradualmente hacia temas académicos cuando sea apropiado

Sé auténtica, empática y mantén un equilibrio entre ser profesional y cercana.`,
      
      tone: "Casual, empática y motivacional",
      focus: ["Escucha activa", "Apoyo emocional", "Conexión personal", "Motivación"]
    }
  }
}

export class SaraPersonalityEngine {
  
  /**
   * Genera un prompt del sistema personalizado basado en el modo de conversación y contexto del estudiante
   */
  static generateSystemPrompt(
    mode: ConversationMode, 
    context: StudentContext,
    intent: IntentType,
    userId?: string,
    sessionId?: string
  ): string {
    const basePersonality = SARA_PERSONALITY.adaptiveResponses[mode]
    const studentInfo = this.buildStudentContextSummary(context)
    
    // Agregar memoria conversacional si está disponible
    let memoryContext = ""
    if (userId) {
      const contextualSummary = ConversationMemoryManager.generateContextualSummary(userId, sessionId)
      const personalizedSuggestions = ConversationMemoryManager.getPersonalizedSuggestions(userId, sessionId)
      const needsFollowUp = ConversationMemoryManager.needsFollowUp(userId, sessionId)
      
      memoryContext = `
MEMORIA CONVERSACIONAL:
${contextualSummary}

SUGERENCIAS PERSONALIZADAS BASADAS EN HISTORIAL:
${personalizedSuggestions.length > 0 ? personalizedSuggestions.map(s => `• ${s}`).join('\n') : '• No hay sugerencias específicas aún'}

${needsFollowUp ? 'NOTA: El estudiante necesita seguimiento en temas pendientes.' : ''}
`
    }
    
    return `${basePersonality.systemPrompt}

INFORMACIÓN DEL ESTUDIANTE:
${studentInfo}
${memoryContext}

ESTILO DE COMUNICACIÓN: ${basePersonality.tone}
ÁREAS DE ENFOQUE ACTUALES: ${basePersonality.focus.join(', ')}

INSTRUCCIONES ESPECÍFICAS:
- Personaliza todas las respuestas basándote en el contexto del estudiante Y la memoria conversacional
- Mantén un tono ${basePersonality.tone.toLowerCase()}
- Sé proactiva y sugiere acciones concretas
- Usa el nombre del estudiante cuando sea apropiado
- Conecta respuestas con objetivos y patrones previos del estudiante
- Haz referencia a conversaciones anteriores cuando sea relevante
- Ofrece seguimiento a temas pendientes si es necesario
- Finaliza con una pregunta o sugerencia que mantenga el engagement

IMPORTANTE: Responde como Sara, no como un asistente genérico. Tu personalidad debe ser consistente: ${SARA_PERSONALITY.characteristics.communicationStyle}
Usa la memoria conversacional para proporcionar continuidad y personalización en tus respuestas.`
  }

  /**
   * Selecciona una respuesta apropiada del banco de respuestas de Sara
   */
  static selectResponse(
    category: keyof SaraPersonality['responses'],
    context?: StudentContext
  ): string {
    const responses = SARA_PERSONALITY.responses[category]
    
    // Selección inteligente basada en contexto si está disponible
    if (context) {
      return this.selectContextualResponse(responses, context, category)
    }
    
    // Selección aleatoria si no hay contexto
    return responses[Math.floor(Math.random() * responses.length)]
  }

  /**
   * Genera una respuesta contextual considerando el historial y estado del estudiante
   */
  private static selectContextualResponse(
    responses: string[],
    context: StudentContext,
    category: keyof SaraPersonality['responses']
  ): string {
    // Lógica de selección basada en contexto del estudiante
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - context.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    switch (category) {
      case 'greeting':
        if (daysSinceLastInteraction > 7) {
          return "¡Qué bueno verte de vuelta! Ha pasado un tiempo. ¿Cómo han ido las cosas con tus estudios?"
        } else if (daysSinceLastInteraction > 1) {
          return responses[1] // "¡Bienvenido de vuelta!..."
        }
        return responses[0] // Saludo estándar
        
      case 'motivation':
        if (context.studyPatterns.weeklyStats.totalStudyHours < 5) {
          return "Los días difíciles forman estudiantes resilientes. Estás construyendo no solo conocimiento, sino también carácter."
        }
        return responses[Math.floor(Math.random() * responses.length)]
        
      default:
        return responses[Math.floor(Math.random() * responses.length)]
    }
  }

  /**
   * Construye un resumen del contexto del estudiante para el prompt del sistema
   */
  private static buildStudentContextSummary(context: StudentContext): string {
    const summary = []
    
    // Información académica básica
    summary.push(`Estudiante: ${context.academicInfo.grade} en ${context.academicInfo.school}`)
    
    // Estilo de aprendizaje
    summary.push(`Estilo de aprendizaje: ${context.learningStyle.primary}`)
    summary.push(`Preferencia de estudio: ${context.learningStyle.preferences.studyTimePreference}`)
    
    // Materias y rendimiento
    if (context.subjectPerformances.length > 0) {
      const topSubjects = context.subjectPerformances
        .filter(s => s.averageGrade > 80)
        .map(s => s.subject)
        .slice(0, 2)
      
      const strugglingSubjects = context.subjectPerformances
        .filter(s => s.averageGrade < 70)
        .map(s => s.subject)
        .slice(0, 2)
      
      if (topSubjects.length > 0) {
        summary.push(`Fortalezas: ${topSubjects.join(', ')}`)
      }
      if (strugglingSubjects.length > 0) {
        summary.push(`Áreas de mejora: ${strugglingSubjects.join(', ')}`)
      }
    }
    
    // Objetivos actuales
    if (context.currentGoals.length > 0) {
      const activeGoals = context.currentGoals
        .filter(g => g.progress < 100)
        .slice(0, 2)
        .map(g => g.title)
      
      if (activeGoals.length > 0) {
        summary.push(`Objetivos actuales: ${activeGoals.join(', ')}`)
      }
    }
    
    // Patrones de estudio
    const weeklyHours = context.studyPatterns.weeklyStats.totalStudyHours
    summary.push(`Horas de estudio semanales: ${weeklyHours.toFixed(1)}h`)
    
    return summary.join('\n')
  }

  /**
   * Genera sugerencias proactivas basadas en el contexto del estudiante
   */
  static generateProactiveSuggestions(context: StudentContext): string[] {
    const suggestions: string[] = []
    
    // Sugerencias basadas en tiempo de estudio
    if (context.studyPatterns.weeklyStats.totalStudyHours < 10) {
      suggestions.push("💡 Podrías incrementar gradualmente tus horas de estudio para mejorar el rendimiento")
    }
    
    // Sugerencias basadas en materias con dificultades
    const strugglingSubjects = context.subjectPerformances.filter(s => s.averageGrade < 70)
    if (strugglingSubjects.length > 0) {
      suggestions.push(`📚 Te recomiendo dedicar tiempo extra a ${strugglingSubjects[0].subject} esta semana`)
    }
    
    // Sugerencias basadas en próximos deadlines
    const upcomingDeadlines = context.subjectPerformances
      .flatMap(s => s.upcomingDeadlines)
      .filter(d => {
        const daysUntil = Math.ceil((d.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7 && d.preparationStatus !== 'ready'
      })
    
    if (upcomingDeadlines.length > 0) {
      suggestions.push(`⏰ Tienes ${upcomingDeadlines.length} deadline(s) próximo(s), ¿planificamos la preparación?`)
    }
    
    // Sugerencias basadas en objetivos
    const stagnantGoals = context.currentGoals.filter(g => {
      const daysSinceUpdate = Math.floor((Date.now() - g.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceUpdate > 7 && g.progress < 100
    })
    
    if (stagnantGoals.length > 0) {
      suggestions.push(`🎯 Hace tiempo que no actualizamos el progreso de algunos objetivos, ¿revisamos?`)
    }
    
    return suggestions.slice(0, 3) // Máximo 3 sugerencias para no abrumar
  }

  /**
   * Adapta el tono de respuesta según el estado emocional inferido del estudiante
   */
  static adaptToneToEmotionalState(message: string): 'supportive' | 'motivational' | 'professional' | 'empathetic' | 'encouraging' | 'solution_focused' {
    // Usar el nuevo analizador de emociones para determinar el tono
    const emotionAnalysis = EmotionAnalyzer.analyzeEmotions(message)
    return emotionAnalysis.suggestedResponse
  }

  /**
   * Genera una respuesta personalizada usando el banco de respuestas avanzado
   */
  static generatePersonalizedResponse(
    message: string,
    emotion: EmotionType,
    mode: ConversationMode,
    context?: {
      subject?: string
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
      urgency?: 'low' | 'medium' | 'high'
      sessionLength?: 'short' | 'medium' | 'long'
      userId?: string
      sessionId?: string
    }
  ): {
    response: string
    suggestedActions: string[]
    followUpQuestions: string[]
    tone: string
    emoji: string
  } {
    // Determinar hora del día si no se proporciona
    const currentHour = new Date().getHours()
    const timeOfDay = context?.timeOfDay || 
      (currentHour < 12 ? 'morning' : 
       currentHour < 17 ? 'afternoon' : 
       currentHour < 21 ? 'evening' : 'night')

    // Determinar urgencia basada en palabras clave si no se proporciona
    const urgency = context?.urgency || this.detectUrgency(message)

    // Crear contexto para el banco de respuestas
    const responseContext: ResponseContext = {
      emotion,
      mode,
      subject: context?.subject,
      timeOfDay,
      urgency,
      sessionLength: context?.sessionLength || 'medium'
    }

    // Obtener respuesta personalizada
    const personalizedResponse = ResponseBank.selectPersonalizedResponse(responseContext)

    // Enriquecer con memoria si está disponible
    let enrichedResponse = personalizedResponse.content
    if (context?.userId) {
      const memory = ConversationMemoryManager.getMemory(context.userId, context.sessionId)
      
      // Agregar contexto de memoria emocional
      if (memory.emotionalProfile.recentEmotions.length > 1) {
        const previousEmotion = memory.emotionalProfile.recentEmotions[1]
        if (previousEmotion !== emotion) {
          const transitionResponse = ResponseBank.getTransitionResponse(previousEmotion, emotion)
          enrichedResponse = `${transitionResponse} ${enrichedResponse}`
        }
      }

      // Agregar insights de motivación si es relevante
      if (memory.emotionalProfile.motivationLevel < 4 && [EmotionType.FRUSTRATED, EmotionType.OVERWHELMED].includes(emotion)) {
        enrichedResponse += " Recuerda que he visto tu potencial en sesiones anteriores - tienes todo lo necesario para superar esto."
      }
    }

    return {
      response: enrichedResponse,
      suggestedActions: personalizedResponse.suggestedActions || [],
      followUpQuestions: personalizedResponse.followUp || [],
      tone: personalizedResponse.tone,
      emoji: personalizedResponse.emoji || "😊"
    }
  }

  /**
   * Detecta el nivel de urgencia en un mensaje
   */
  private static detectUrgency(message: string): 'low' | 'medium' | 'high' {
    const lowerMessage = message.toLowerCase()
    
    // Urgencia alta
    if (/urgente|rápido|ya|ahora|inmediatamente|mañana|hoy|pronto/.test(lowerMessage)) {
      return 'high'
    }
    
    // Urgencia media
    if (/esta\s+semana|próximo|deadline|fecha\s+límite|plazo/.test(lowerMessage)) {
      return 'medium'
    }
    
    // Urgencia baja por defecto
    return 'low'
  }

  /**
   * Sugiere transición de modo conversacional si es apropiado
   */
  static suggestModeTransition(
    message: string,
    currentMode: ConversationMode,
    emotion: EmotionType,
    context?: {
      userId?: string
      sessionId?: string
      timeInCurrentMode?: number
      urgency?: 'low' | 'medium' | 'high'
      subject?: string
      previousModes?: ConversationMode[]
    }
  ): {
    shouldTransition: boolean
    suggestedMode?: ConversationMode
    transitionMessage?: string
    confidence?: number
    reason?: string
  } {
    const transitionContext: TransitionContext = {
      currentMode,
      message,
      emotion,
      userId: context?.userId,
      sessionId: context?.sessionId,
      timeInCurrentMode: context?.timeInCurrentMode,
      previousModes: context?.previousModes,
      urgency: context?.urgency,
      subject: context?.subject
    }

    const suggestedTransition = ModeTransitionManager.analyzeTransitionNeed(transitionContext)

    if (!suggestedTransition) {
      return { shouldTransition: false }
    }

    // Evaluar calidad de la transición
    const quality = ModeTransitionManager.evaluateTransitionQuality(suggestedTransition, transitionContext)

    // Solo sugerir si la calidad es suficientemente alta
    if (quality < 0.6) {
      return { shouldTransition: false }
    }

    return {
      shouldTransition: true,
      suggestedMode: suggestedTransition.toMode,
      transitionMessage: this.enhanceTransitionMessage(suggestedTransition, context?.userId, context?.sessionId),
      confidence: quality,
      reason: suggestedTransition.reason
    }
  }

  /**
   * Mejora el mensaje de transición con contexto personal
   */
  private static enhanceTransitionMessage(
    transition: { toMode: ConversationMode, transitionMessage: string },
    userId?: string,
    sessionId?: string
  ): string {
    let enhancedMessage = transition.transitionMessage

    // Agregar contexto de memoria si está disponible
    if (userId) {
      const memory = ConversationMemoryManager.getMemory(userId, sessionId)
      
      // Personalizar basado en éxitos previos
      if (memory.emotionalProfile.achievementAreas.length > 0 && transition.toMode === ConversationMode.TUTORING) {
        enhancedMessage += ` Recuerda que has tenido mucho éxito en ${memory.emotionalProfile.achievementAreas[0]} antes.`
      }

      // Referencia a patrones emocionales
      if (memory.emotionalProfile.motivationLevel > 7 && transition.toMode === ConversationMode.PLANNING) {
        enhancedMessage += " Con tu nivel de motivación actual, es el momento perfecto para esto."
      }

      // Mencionar progreso en el área si es relevante
      if (memory.emotionalProfile.recentEmotions.includes(EmotionType.CONFUSED) && transition.toMode === ConversationMode.TUTORING) {
        enhancedMessage += " Vamos a aclarar esas dudas de una vez por todas."
      }
    }

    return enhancedMessage
  }

  /**
   * Genera respuesta con transición automática de modo
   */
  static generateResponseWithModeTransition(
    message: string,
    currentMode: ConversationMode,
    emotion: EmotionType,
    context?: {
      userId?: string
      sessionId?: string
      timeInCurrentMode?: number
      urgency?: 'low' | 'medium' | 'high'
      subject?: string
      previousModes?: ConversationMode[]
    }
  ): {
    response: string
    finalMode: ConversationMode
    transitionOccurred: boolean
    transitionMessage?: string
    suggestedActions: string[]
    followUpQuestions: string[]
  } {
    // Verificar si necesita transición
    const transitionSuggestion = this.suggestModeTransition(message, currentMode, emotion, context)
    
    let finalMode = currentMode
    let combinedResponse = ""
    let transitionOccurred = false
    let transitionMessage = ""

    // Si se sugiere transición, aplicarla
    if (transitionSuggestion.shouldTransition && transitionSuggestion.suggestedMode) {
      finalMode = transitionSuggestion.suggestedMode
      transitionOccurred = true
      transitionMessage = transitionSuggestion.transitionMessage || ""
      combinedResponse = transitionMessage + "\n\n"
    }

    // Generar respuesta en el modo final
    const personalizedResponse = this.generatePersonalizedResponse(
      message,
      emotion,
      finalMode,
      {
        subject: context?.subject,
        urgency: context?.urgency,
        userId: context?.userId,
        sessionId: context?.sessionId
      }
    )

    combinedResponse += personalizedResponse.response

    return {
      response: combinedResponse,
      finalMode,
      transitionOccurred,
      transitionMessage: transitionOccurred ? transitionMessage : undefined,
      suggestedActions: personalizedResponse.suggestedActions,
      followUpQuestions: personalizedResponse.followUpQuestions
    }
  }

  /**
   * Genera una respuesta contextual usando Sara para comandos avanzados
   */
  static async generateContextualResponse(
    message: string,
    commandResult: any,
    userId: string,
    currentMode: ConversationMode,
    sessionId?: string
  ): Promise<string> {
    let response = ""
    
    if (commandResult.success && commandResult.message) {
      // Personalizar la respuesta del comando con la personalidad de Sara
      const tone = this.adaptToneToEmotionalState(message)
      
      response = commandResult.message
      
      // Agregar contexto de memoria si está disponible
      const memory = ConversationMemoryManager.getMemory(userId, sessionId)
      const needsFollowUp = ConversationMemoryManager.needsFollowUp(userId, sessionId)
      
      // Agregar toque personal de Sara según el tono y memoria emocional
      const emotionalInsights = memory.emotionalInsights.slice(0, 1) // Solo el más reciente
      
      switch (tone) {
        case 'supportive':
          response += "\n\n💝 Recuerda que estoy aquí para apoyarte en cada paso. ¡Vamos despacio pero seguros!"
          if (memory.emotionalProfile.motivationLevel < 5) {
            response += " He notado que has tenido algunos desafíos últimamente, pero confío en tu capacidad."
          }
          if (memory.emotionalProfile.currentMood === EmotionType.FRUSTRATED) {
            response += " La frustración es temporal - cada dificultad es una oportunidad de crecimiento."
          }
          break
        case 'motivational':
          response += "\n\n🌟 ¡Tú puedes lograr esto! Cada pequeño paso cuenta hacia tus grandes objetivos."
          if (memory.emotionalProfile.achievementAreas.length > 0) {
            response += ` Recuerda lo bien que lo has hecho en ${memory.emotionalProfile.achievementAreas[0]}.`
          }
          if (memory.emotionalProfile.currentMood === EmotionType.MOTIVATED) {
            response += " Me encanta ver tu energía positiva - ¡aprovechémosla al máximo!"
          }
          break
        case 'empathetic':
          response += "\n\n🤗 Entiendo cómo te sientes y es completamente válido."
          if (memory.emotionalProfile.currentMood === EmotionType.OVERWHELMED) {
            response += " Cuando nos sentimos abrumados, lo mejor es dividir todo en pasos pequeños y manejables."
          } else if (memory.emotionalProfile.currentMood === EmotionType.ANXIOUS) {
            response += " La ansiedad es señal de que algo te importa. Vamos a trabajar juntos para que te sientas más tranquilo."
          }
          break
        case 'professional':
          response += "\n\n📋 ¿Te parece útil esta información? Siempre puedes pedirme más detalles o ajustes."
          if (memory.emotionalProfile.currentMood === EmotionType.CONFUSED) {
            response += " Si algo no queda claro, explícamelo con tus propias palabras para asegurarme de que lo entendiste."
          }
          break
        case 'encouraging':
          response += "\n\n✨ ¡Excelente trabajo! Me alegra ver tu progreso."
          if (memory.emotionalProfile.currentMood === EmotionType.PROUD) {
            response += " Es genial que reconozcas tus logros - ¡mereces celebrar cada avance!"
          }
          break
        default:
          response += "\n\n😊 ¿Hay algo más en lo que pueda ayudarte hoy?"
          if (needsFollowUp) {
            response += " También podríamos revisar algunos temas pendientes que mencionaste antes."
          }
      }
      
      // Agregar insights emocionales recientes si son relevantes
      if (emotionalInsights.length > 0 && memory.emotionalProfile.motivationLevel < 4) {
        response += `\n\n💡 *Nota personal*: ${emotionalInsights[0]}`
      }
      
      // Guardar la conversación en memoria
      ConversationMemoryManager.saveConversationTurn(
        userId,
        message,
        response,
        currentMode.toString(),
        commandResult.type,
        sessionId
      )
      
      return response
    }
    
    // Para respuestas de error también guardar en memoria
    response = commandResult.message || "Lo siento, no pude procesar tu solicitud. ¿Podrías reformularla?"
    
    ConversationMemoryManager.saveConversationTurn(
      userId,
      message,
      response,
      currentMode.toString(),
      'error',
      sessionId
    )
    
    return response
  }

  /**
   * Genera un saludo personalizado basado en la memoria conversacional
   */
  static generatePersonalizedGreeting(userId: string, userName?: string, sessionId?: string): string {
    const memory = ConversationMemoryManager.getMemory(userId, sessionId)
    const contextualSummary = ConversationMemoryManager.generateContextualSummary(userId, sessionId)
    
    let greeting = ""
    
    // Saludo inicial vs. de regreso
    if (memory.totalTurns === 0) {
      greeting = this.selectResponse('greeting')
      if (userName) {
        greeting = greeting.replace(/¡Hola!/, `¡Hola, ${userName}!`)
      }
    } else {
      // Saludo personalizado basado en memoria
      const daysSinceLastChat = Math.floor(
        (Date.now() - memory.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastChat > 7) {
        greeting = `¡Qué bueno verte de vuelta${userName ? ', ' + userName : ''}! ${contextualSummary}`
      } else if (daysSinceLastChat > 1) {
        greeting = `¡Hola de nuevo${userName ? ', ' + userName : ''}! ${contextualSummary}`
      } else {
        greeting = `¡Hola${userName ? ', ' + userName : ''}! ${contextualSummary}`
      }
    }
    
    // Agregar sugerencias personalizadas
    const suggestions = ConversationMemoryManager.getPersonalizedSuggestions(userId, sessionId)
    if (suggestions.length > 0) {
      greeting += `\n\n💡 **Sugerencias basadas en nuestras conversaciones:**\n${suggestions.slice(0, 3).map(s => `• ${s}`).join('\n')}`
    }
    
    return greeting
  }
}