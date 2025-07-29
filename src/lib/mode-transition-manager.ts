// Sistema de Gestión de Transiciones entre Modos Conversacionales
// Optimiza el cambio fluido entre modos según el contexto y necesidades del estudiante

import { ConversationMode } from './advanced-intent-engine'
import { EmotionType } from './emotion-analyzer'
import { ConversationMemoryManager } from './conversation-memory'

export interface ModeTransition {
  fromMode: ConversationMode
  toMode: ConversationMode
  confidence: number // 0-1, qué tan seguro está el sistema del cambio
  reason: string
  triggers: string[]
  transitionMessage: string
  suggestedDuration?: number // minutos recomendados en el nuevo modo
}

export interface TransitionContext {
  currentMode: ConversationMode
  message: string
  emotion: EmotionType
  userId?: string
  sessionId?: string
  timeInCurrentMode?: number // minutos en el modo actual
  previousModes?: ConversationMode[]
  urgency?: 'low' | 'medium' | 'high'
  subject?: string
}

export class ModeTransitionManager {
  
  // Patrones que indican necesidad de cambio de modo
  private static readonly MODE_TRIGGERS = {
    
    [ConversationMode.TUTORING]: {
      patterns: [
        /necesito\s+(ayuda|explicación|que\s+me\s+expliques)/i,
        /no\s+(entiendo|comprendo|sé\s+cómo)/i,
        /podrías\s+(explicar|enseñar|mostrar)/i,
        /cómo\s+(se\s+hace|funciona|resuelvo)/i,
        /ejercicio|problema|tarea|concepto/i,
        /paso\s+a\s+paso/i
      ],
      emotions: [EmotionType.CONFUSED, EmotionType.CURIOUS, EmotionType.FRUSTRATED],
      transitionMessage: "Perfecto, cambiemos al modo tutoría. Voy a explicarte esto paso a paso para que lo entiendas completamente."
    },

    [ConversationMode.PLANNING]: {
      patterns: [
        /necesito\s+(planificar|organizar|estructurar)/i,
        /cómo\s+organizo\s+mi\s+(tiempo|estudio|horario)/i,
        /plan\s+de\s+estudio/i,
        /cronograma|calendario|agenda/i,
        /estrategia\s+de\s+estudio/i,
        /objetivos|metas|propósitos/i,
        /deadlines?|fechas?\s+límite/i
      ],
      emotions: [EmotionType.OVERWHELMED, EmotionType.MOTIVATED, EmotionType.ANXIOUS],
      transitionMessage: "Excelente idea planificar. Vamos a crear una estrategia estructurada que te ayude a alcanzar tus objetivos de manera eficiente."
    },

    [ConversationMode.ORGANIZING]: {
      patterns: [
        /mis\s+(materiales|archivos|apuntes|recursos)/i,
        /dónde\s+(guardo|organizo|encuentro)/i,
        /gestionar\s+(documentos|tareas|información)/i,
        /sistema\s+de\s+organización/i,
        /orden|estructura|clasificar/i,
        /productividad|eficiencia/i
      ],
      emotions: [EmotionType.OVERWHELMED, EmotionType.CONFUSED, EmotionType.MOTIVATED],
      transitionMessage: "Perfecto, organicemos todo de manera sistemática. Un buen sistema de organización es clave para el éxito académico."
    },

    [ConversationMode.REVIEWING]: {
      patterns: [
        /mi\s+(progreso|rendimiento|avance)/i,
        /cómo\s+(voy|estoy\s+haciendo|me\s+va)/i,
        /analizar\s+(resultados|calificaciones|notas)/i,
        /feedback|retroalimentación/i,
        /qué\s+(puedo\s+mejorar|necesito\s+cambiar)/i,
        /evaluación|reflexión/i,
        /fortalezas\s+y\s+debilidades/i
      ],
      emotions: [EmotionType.DISAPPOINTED, EmotionType.PROUD, EmotionType.CURIOUS, EmotionType.MOTIVATED],
      transitionMessage: "Muy bien, analicemos tu progreso juntos. La reflexión sobre tu aprendizaje es fundamental para mejorar continuamente."
    },

    [ConversationMode.CHATTING]: {
      patterns: [
        /cómo\s+(estás|te\s+va|andas)/i,
        /hola|hi|buenos\s+días|buenas\s+tardes/i,
        /quería\s+platicar/i,
        /me\s+siento/i,
        /solo\s+quería\s+decir/i,
        /gracias\s+por/i,
        /charlemos|conversemos/i
      ],
      emotions: [EmotionType.HAPPY, EmotionType.GRATEFUL, EmotionType.SAD, EmotionType.EXCITED],
      transitionMessage: "Me da mucho gusto conversar contigo. Estoy aquí para escucharte y apoyarte en lo que necesites."
    }
  }

  // Reglas de transición específicas entre modos
  private static readonly TRANSITION_RULES = {
    
    // Desde CHATTING hacia otros modos
    [`${ConversationMode.CHATTING}_${ConversationMode.TUTORING}`]: {
      confidence: 0.8,
      reason: "El estudiante necesita ayuda académica específica",
      suggestedDuration: 25
    },
    [`${ConversationMode.CHATTING}_${ConversationMode.PLANNING}`]: {
      confidence: 0.85,
      reason: "El estudiante quiere organizar su tiempo de estudio",
      suggestedDuration: 15
    },
    [`${ConversationMode.CHATTING}_${ConversationMode.ORGANIZING}`]: {
      confidence: 0.8,
      reason: "El estudiante necesita organizar materiales o recursos",
      suggestedDuration: 20
    },
    [`${ConversationMode.CHATTING}_${ConversationMode.REVIEWING}`]: {
      confidence: 0.9,
      reason: "El estudiante quiere analizar su progreso académico",
      suggestedDuration: 15
    },

    // Desde TUTORING hacia otros modos
    [`${ConversationMode.TUTORING}_${ConversationMode.PLANNING}`]: {
      confidence: 0.75,
      reason: "Después de aprender, el estudiante quiere planificar práctica adicional",
      suggestedDuration: 10
    },
    [`${ConversationMode.TUTORING}_${ConversationMode.ORGANIZING}`]: {
      confidence: 0.7,
      reason: "El estudiante necesita organizar el material aprendido",
      suggestedDuration: 10
    },
    [`${ConversationMode.TUTORING}_${ConversationMode.REVIEWING}`]: {
      confidence: 0.8,
      reason: "Es momento de evaluar la comprensión del tema",
      suggestedDuration: 10
    },
    [`${ConversationMode.TUTORING}_${ConversationMode.CHATTING}`]: {
      confidence: 0.6,
      reason: "El estudiante quiere una pausa o expresar emociones",
      suggestedDuration: 5
    },

    // Desde PLANNING hacia otros modos
    [`${ConversationMode.PLANNING}_${ConversationMode.TUTORING}`]: {
      confidence: 0.9,
      reason: "Es hora de ejecutar el plan con estudio específico",
      suggestedDuration: 30
    },
    [`${ConversationMode.PLANNING}_${ConversationMode.ORGANIZING}`]: {
      confidence: 0.85,
      reason: "Necesita organizar recursos para ejecutar el plan",
      suggestedDuration: 15
    },
    [`${ConversationMode.PLANNING}_${ConversationMode.REVIEWING}`]: {
      confidence: 0.7,
      reason: "Quiere evaluar planes anteriores antes de crear nuevos",
      suggestedDuration: 10
    },

    // Desde ORGANIZING hacia otros modos
    [`${ConversationMode.ORGANIZING}_${ConversationMode.PLANNING}`]: {
      confidence: 0.8,
      reason: "Con recursos organizados, es momento de planificar su uso",
      suggestedDuration: 15
    },
    [`${ConversationMode.ORGANIZING}_${ConversationMode.TUTORING}`]: {
      confidence: 0.75,
      reason: "Con materiales listos, puede enfocarse en aprender",
      suggestedDuration: 25
    },
    [`${ConversationMode.ORGANIZING}_${ConversationMode.REVIEWING}`]: {
      confidence: 0.7,
      reason: "Quiere evaluar la efectividad de su organización",
      suggestedDuration: 10
    },

    // Desde REVIEWING hacia otros modos
    [`${ConversationMode.REVIEWING}_${ConversationMode.PLANNING}`]: {
      confidence: 0.9,
      reason: "Basado en la revisión, necesita crear nuevos planes",
      suggestedDuration: 20
    },
    [`${ConversationMode.REVIEWING}_${ConversationMode.TUTORING}`]: {
      confidence: 0.85,
      reason: "Identificó áreas que necesita reforzar",
      suggestedDuration: 30
    },
    [`${ConversationMode.REVIEWING}_${ConversationMode.ORGANIZING}`]: {
      confidence: 0.7,
      reason: "Necesita reorganizar materiales basado en la evaluación",
      suggestedDuration: 15
    },
    [`${ConversationMode.REVIEWING}_${ConversationMode.CHATTING}`]: {
      confidence: 0.8,
      reason: "Quiere procesar emocionalmente los resultados de la revisión",
      suggestedDuration: 10
    }
  }

  // Factores que afectan las transiciones
  private static readonly TRANSITION_FACTORS = {
    
    // Tiempo en modo actual afecta la disposición al cambio
    timeFactors: {
      tooShort: 3, // minutos - muy poco tiempo en el modo actual
      optimal: 15, // minutos - tiempo ideal en un modo
      tooLong: 45  // minutos - demasiado tiempo, necesita cambio
    },

    // Emociones que favorecen ciertos modos
    emotionalBias: {
      [EmotionType.FRUSTRATED]: [ConversationMode.TUTORING, ConversationMode.CHATTING],
      [EmotionType.OVERWHELMED]: [ConversationMode.PLANNING, ConversationMode.ORGANIZING],
      [EmotionType.CONFUSED]: [ConversationMode.TUTORING],
      [EmotionType.MOTIVATED]: [ConversationMode.PLANNING, ConversationMode.TUTORING],
      [EmotionType.PROUD]: [ConversationMode.REVIEWING, ConversationMode.CHATTING],
      [EmotionType.CURIOUS]: [ConversationMode.TUTORING],
      [EmotionType.GRATEFUL]: [ConversationMode.CHATTING, ConversationMode.REVIEWING],
      [EmotionType.ANXIOUS]: [ConversationMode.PLANNING, ConversationMode.CHATTING],
      [EmotionType.EXCITED]: [ConversationMode.TUTORING, ConversationMode.PLANNING],
      [EmotionType.BORED]: [ConversationMode.CHATTING, ConversationMode.ORGANIZING]
    },

    // Urgencia afecta preferencia de modo
    urgencyBias: {
      high: [ConversationMode.TUTORING, ConversationMode.PLANNING],
      medium: [ConversationMode.TUTORING, ConversationMode.ORGANIZING, ConversationMode.PLANNING],
      low: [ConversationMode.CHATTING, ConversationMode.REVIEWING, ConversationMode.ORGANIZING]
    }
  }

  /**
   * Analiza si debería sugerir una transición de modo
   */
  static analyzeTransitionNeed(context: TransitionContext): ModeTransition | null {
    const { currentMode, message, emotion, timeInCurrentMode = 0, urgency = 'medium' } = context

    // 1. Buscar triggers explícitos en el mensaje
    const explicitTransition = this.findExplicitModeTransition(message, currentMode)
    if (explicitTransition) return explicitTransition

    // 2. Analizar basado en emoción y tiempo
    const emotionalTransition = this.analyzeEmotionalTransition(currentMode, emotion, timeInCurrentMode)
    if (emotionalTransition) return emotionalTransition

    // 3. Considerar tiempo excesivo en modo actual
    const timeBasedTransition = this.analyzeTimeBasedTransition(context)
    if (timeBasedTransition) return timeBasedTransition

    // 4. Analizar patrones de memoria si está disponible
    if (context.userId) {
      const memoryBasedTransition = this.analyzeMemoryPatterns(context)
      if (memoryBasedTransition) return memoryBasedTransition
    }

    return null
  }

  /**
   * Busca triggers explícitos de cambio de modo en el mensaje
   */
  private static findExplicitModeTransition(message: string, currentMode: ConversationMode): ModeTransition | null {
    for (const [targetMode, config] of Object.entries(this.MODE_TRIGGERS)) {
      if (targetMode === currentMode) continue // No cambiar al mismo modo

      const modeEnum = targetMode as ConversationMode
      
      // Verificar patrones textuales
      const hasTextTrigger = config.patterns.some(pattern => pattern.test(message))
      
      if (hasTextTrigger) {
        const transitionKey = `${currentMode}_${modeEnum}`
        const rule = this.TRANSITION_RULES[transitionKey]
        
        return {
          fromMode: currentMode,
          toMode: modeEnum,
          confidence: rule?.confidence || 0.7,
          reason: rule?.reason || `Trigger textual detectado para ${modeEnum}`,
          triggers: [`Patrón textual para ${modeEnum}`],
          transitionMessage: config.transitionMessage,
          suggestedDuration: rule?.suggestedDuration
        }
      }
    }

    return null
  }

  /**
   * Analiza transición basada en estado emocional
   */
  private static analyzeEmotionalTransition(
    currentMode: ConversationMode, 
    emotion: EmotionType, 
    timeInCurrentMode: number
  ): ModeTransition | null {
    
    const emotionalPreferences = this.TRANSITION_FACTORS.emotionalBias[emotion] || []
    
    for (const preferredMode of emotionalPreferences) {
      if (preferredMode === currentMode) continue
      
      // Si lleva suficiente tiempo en el modo actual y la emoción sugiere cambio
      if (timeInCurrentMode >= this.TRANSITION_FACTORS.timeFactors.tooShort) {
        const transitionKey = `${currentMode}_${preferredMode}`
        const rule = this.TRANSITION_RULES[transitionKey]
        
        if (rule) {
          return {
            fromMode: currentMode,
            toMode: preferredMode,
            confidence: rule.confidence * 0.8, // Reducir confianza para transiciones emocionales
            reason: `Estado emocional (${emotion}) sugiere cambio hacia ${preferredMode}`,
            triggers: [`Emoción: ${emotion}`],
            transitionMessage: this.generateEmotionalTransitionMessage(emotion, preferredMode),
            suggestedDuration: rule.suggestedDuration
          }
        }
      }
    }

    return null
  }

  /**
   * Analiza transiciones basadas en tiempo excesivo en modo actual
   */
  private static analyzeTimeBasedTransition(context: TransitionContext): ModeTransition | null {
    const { currentMode, timeInCurrentMode = 0, emotion, previousModes = [] } = context
    
    // Si ha estado demasiado tiempo en el modo actual
    if (timeInCurrentMode >= this.TRANSITION_FACTORS.timeFactors.tooLong) {
      
      // Sugerir un modo complementario que no haya usado recientemente
      const complementaryModes = this.getComplementaryModes(currentMode)
      const freshMode = complementaryModes.find(mode => !previousModes.slice(-2).includes(mode))
      
      if (freshMode) {
        const transitionKey = `${currentMode}_${freshMode}`
        const rule = this.TRANSITION_RULES[transitionKey]
        
        return {
          fromMode: currentMode,
          toMode: freshMode,
          confidence: 0.6,
          reason: `Tiempo excesivo en ${currentMode} (${timeInCurrentMode} min)`,
          triggers: [`Tiempo: ${timeInCurrentMode} minutos`],
          transitionMessage: `Has estado enfocado en ${currentMode} por un buen tiempo. ¿Te parece si cambiamos hacia ${freshMode} para variar un poco?`,
          suggestedDuration: rule?.suggestedDuration || 15
        }
      }
    }

    return null
  }

  /**
   * Analiza patrones en la memoria conversacional para sugerir transiciones
   */
  private static analyzeMemoryPatterns(context: TransitionContext): ModeTransition | null {
    if (!context.userId) return null

    const memory = ConversationMemoryManager.getMemory(context.userId, context.sessionId)
    
    // Si el estudiante frecuentemente necesita ayuda con planificación
    const planningTopics = memory.recurringTopics.filter(t => 
      ['planificar', 'organizar', 'tiempo', 'horario'].some(keyword => t.topic.includes(keyword))
    )
    
    if (planningTopics.length > 0 && context.currentMode !== ConversationMode.PLANNING) {
      return {
        fromMode: context.currentMode,
        toMode: ConversationMode.PLANNING,
        confidence: 0.65,
        reason: "Patrón histórico muestra necesidad recurrente de planificación",
        triggers: ["Memoria: Temas de planificación recurrentes"],
        transitionMessage: "He notado que frecuentemente trabajamos en planificación. ¿Te gustaría que organicemos tu estrategia de estudio?",
        suggestedDuration: 20
      }
    }

    // Si el nivel de motivación está bajo, sugerir revisión para identificar problemas
    if (memory.emotionalProfile.motivationLevel < 4 && context.currentMode !== ConversationMode.REVIEWING) {
      return {
        fromMode: context.currentMode,
        toMode: ConversationMode.REVIEWING,
        confidence: 0.7,
        reason: "Bajo nivel de motivación sugiere necesidad de revisión y análisis",
        triggers: ["Memoria: Motivación baja"],
        transitionMessage: "He notado que tu motivación ha estado un poco baja últimamente. ¿Te parece si analizamos juntos cómo van las cosas para identificar qué podemos mejorar?",
        suggestedDuration: 15
      }
    }

    return null
  }

  /**
   * Obtiene modos complementarios para el modo actual
   */
  private static getComplementaryModes(currentMode: ConversationMode): ConversationMode[] {
    const complementaryMap = {
      [ConversationMode.TUTORING]: [ConversationMode.PLANNING, ConversationMode.REVIEWING, ConversationMode.ORGANIZING],
      [ConversationMode.PLANNING]: [ConversationMode.TUTORING, ConversationMode.ORGANIZING, ConversationMode.REVIEWING],
      [ConversationMode.ORGANIZING]: [ConversationMode.PLANNING, ConversationMode.TUTORING, ConversationMode.REVIEWING],
      [ConversationMode.REVIEWING]: [ConversationMode.PLANNING, ConversationMode.TUTORING, ConversationMode.CHATTING],
      [ConversationMode.CHATTING]: [ConversationMode.TUTORING, ConversationMode.PLANNING, ConversationMode.REVIEWING]
    }

    return complementaryMap[currentMode] || []
  }

  /**
   * Genera mensaje de transición basado en emoción
   */
  private static generateEmotionalTransitionMessage(emotion: EmotionType, targetMode: ConversationMode): string {
    const emotionalTransitions = {
      [`${EmotionType.FRUSTRATED}_${ConversationMode.TUTORING}`]: "Veo que te sientes frustrado. Cambiemos al modo tutoría para abordar esto paso a paso y aclarar las dudas.",
      [`${EmotionType.OVERWHELMED}_${ConversationMode.PLANNING}`]: "Cuando nos sentimos abrumados, la planificación puede ayudar mucho. Organicemos todo de manera manejable.",
      [`${EmotionType.CONFUSED}_${ConversationMode.TUTORING}`]: "La confusión es normal cuando aprendemos. Pasemos al modo tutoría para aclarar todo punto por punto.",
      [`${EmotionType.MOTIVATED}_${ConversationMode.PLANNING}`]: "¡Me encanta ver tu motivación! Aprovechemos esta energía para crear un plan efectivo.",
      [`${EmotionType.PROUD}_${ConversationMode.REVIEWING}`]: "Es genial que te sientas orgulloso. Analicemos juntos lo que has logrado para seguir construyendo sobre estos éxitos.",
      [`${EmotionType.ANXIOUS}_${ConversationMode.CHATTING}`]: "Cuando sentimos ansiedad, a veces es útil hablar de ello. Tomemos un momento para procesar estas emociones."
    }

    const key = `${emotion}_${targetMode}`
    return emotionalTransitions[key] || `Basándome en cómo te sientes, creo que sería útil cambiar hacia ${targetMode}.`
  }

  /**
   * Evalúa la calidad de una transición propuesta
   */
  static evaluateTransitionQuality(transition: ModeTransition, context: TransitionContext): number {
    let quality = transition.confidence

    // Bonificar si hay múltiples triggers
    if (transition.triggers.length > 1) {
      quality += 0.1
    }

    // Penalizar cambios muy frecuentes
    if (context.timeInCurrentMode && context.timeInCurrentMode < this.TRANSITION_FACTORS.timeFactors.tooShort) {
      quality -= 0.2
    }

    // Bonificar si la urgencia coincide
    if (context.urgency === 'high' && [ConversationMode.TUTORING, ConversationMode.PLANNING].includes(transition.toMode)) {
      quality += 0.1
    }

    return Math.max(0, Math.min(1, quality))
  }

  /**
   * Genera estadísticas del sistema de transiciones
   */
  static getTransitionStats() {
    const totalRules = Object.keys(this.TRANSITION_RULES).length
    const modeConnections = Object.values(ConversationMode).map(mode => {
      const outgoing = Object.keys(this.TRANSITION_RULES).filter(key => key.startsWith(mode)).length
      const incoming = Object.keys(this.TRANSITION_RULES).filter(key => key.endsWith(mode)).length
      return { mode, outgoing, incoming, total: outgoing + incoming }
    })

    return {
      totalTransitionRules: totalRules,
      modeConnections,
      averageConnectionsPerMode: totalRules / Object.values(ConversationMode).length,
      emotionalTriggers: Object.keys(this.TRANSITION_FACTORS.emotionalBias).length,
      patternTriggers: Object.values(this.MODE_TRIGGERS).reduce((sum, config) => sum + config.patterns.length, 0)
    }
  }
}