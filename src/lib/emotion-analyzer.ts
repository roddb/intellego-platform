// Sistema Avanzado de Análisis Emocional para Sara
// Detecta emociones complejas en los mensajes de estudiantes para respuestas más empáticas

export enum EmotionType {
  // Emociones Básicas
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  NEUTRAL = 'neutral',
  
  // Emociones Académicas Específicas
  FRUSTRATED = 'frustrated',
  MOTIVATED = 'motivated',
  CONFUSED = 'confused',
  CONFIDENT = 'confident',
  OVERWHELMED = 'overwhelmed',
  CURIOUS = 'curious',
  PROUD = 'proud',
  DISAPPOINTED = 'disappointed',
  ANXIOUS = 'anxious',
  EXCITED = 'excited',
  BORED = 'bored',
  HOPEFUL = 'hopeful',
  STRESSED = 'stressed',
  RELIEVED = 'relieved',
  GRATEFUL = 'grateful'
}

export interface EmotionAnalysis {
  primary: EmotionType
  secondary?: EmotionType
  confidence: number
  intensity: 'low' | 'medium' | 'high'
  indicators: string[]
  context: {
    academic?: boolean
    personal?: boolean
    temporal?: 'past' | 'present' | 'future'
    subject?: string
  }
  suggestedResponse: 'supportive' | 'motivational' | 'professional' | 'empathetic' | 'encouraging' | 'solution_focused'
}

export interface EmotionPattern {
  keywords: string[]
  phrases: RegExp[]
  context: string[]
  intensity_multipliers: { [key: string]: number }
  confidence_base: number
}

export class EmotionAnalyzer {
  
  private static readonly EMOTION_PATTERNS: { [key in EmotionType]: EmotionPattern } = {
    [EmotionType.FRUSTRATED]: {
      keywords: ['frustrado', 'enojado', 'molesto', 'hartado', 'furioso', 'irritado'],
      phrases: [
        /no\s+puedo\s+(más|hacer|lograr)/i,
        /es\s+(muy\s+|súper\s+)?difícil/i,
        /me\s+(frustra|molesta|enoja)/i,
        /por\s+qué\s+no\s+(puedo|logro|entiendo)/i,
        /esto\s+(no\s+sirve|es\s+imposible)/i,
        /ya\s+(intenté|probé)\s+todo/i
      ],
      context: ['difícil', 'problema', 'falla', 'error', 'imposible'],
      intensity_multipliers: { 'muy': 1.3, 'súper': 1.5, 'demasiado': 1.4, 'completamente': 1.6 },
      confidence_base: 0.85
    },

    [EmotionType.MOTIVATED]: {
      keywords: ['motivado', 'emocionado', 'entusiasmado', 'inspirado', 'determinado'],
      phrases: [
        /quiero\s+(lograr|conseguir|aprender)/i,
        /estoy\s+(listo|preparado|emocionado)/i,
        /me\s+(gusta|encanta|motiva)/i,
        /vamos\s+(a\s+)?hacerlo/i,
        /estoy\s+decidido/i,
        /tengo\s+ganas\s+de/i
      ],
      context: ['objetivo', 'meta', 'plan', 'futuro', 'logro'],
      intensity_multipliers: { 'muy': 1.2, 'súper': 1.4, 'realmente': 1.3 },
      confidence_base: 0.8
    },

    [EmotionType.CONFUSED]: {
      keywords: ['confundido', 'perdido', 'desorientado', 'enredado'],
      phrases: [
        /no\s+(entiendo|comprendo|capto)/i,
        /estoy\s+(confundido|perdido)/i,
        /no\s+sé\s+(cómo|qué|por\s+qué)/i,
        /me\s+(confunde|desorienta)/i,
        /no\s+me\s+queda\s+claro/i,
        /podrías\s+explicar/i
      ],
      context: ['explicación', 'ayuda', 'clarificar', 'concepto', 'dudas'],
      intensity_multipliers: { 'completamente': 1.5, 'totalmente': 1.4, 'muy': 1.2 },
      confidence_base: 0.9
    },

    [EmotionType.OVERWHELMED]: {
      keywords: ['abrumado', 'sobrecargado', 'saturado', 'agobiado'],
      phrases: [
        /es\s+demasiado/i,
        /no\s+puedo\s+con\s+todo/i,
        /me\s+(abruma|agobia|satura)/i,
        /son\s+muchas\s+cosas/i,
        /no\s+tengo\s+tiempo/i,
        /me\s+siento\s+(perdido|desbordado)/i
      ],
      context: ['tiempo', 'tareas', 'exámenes', 'muchos', 'presión'],
      intensity_multipliers: { 'completamente': 1.6, 'totalmente': 1.5, 'muy': 1.3 },
      confidence_base: 0.88
    },

    [EmotionType.ANXIOUS]: {
      keywords: ['ansioso', 'nervioso', 'preocupado', 'estresado', 'tenso', 'ansiedad'],
      phrases: [
        /me\s+(preocupa|da\s+ansiedad|pone\s+nervioso)/i,
        /tengo\s+(miedo|temor)\s+de/i,
        /y\s+si\s+(no\s+puedo|fallo|salgo\s+mal)/i,
        /me\s+da\s+(estrés|pánico|ansiedad)/i,
        /estoy\s+(nervioso|ansioso)/i,
        /no\s+sé\s+si\s+podré/i,
        /(mucha|bastante)\s+ansiedad/i,
        /ansiedad\s+(por|de|al)/i
      ],
      context: ['examen', 'evaluación', 'futuro', 'resultado', 'fallo', 'público', 'hablar'],
      intensity_multipliers: { 'muy': 1.3, 'mucha': 1.4, 'súper': 1.5, 'demasiado': 1.4, 'bastante': 1.2 },
      confidence_base: 0.88
    },

    [EmotionType.PROUD]: {
      keywords: ['orgulloso', 'satisfecho', 'contento', 'feliz'],
      phrases: [
        /lo\s+(logré|conseguí|hice)/i,
        /estoy\s+(orgulloso|satisfecho|contento)/i,
        /me\s+siento\s+(bien|genial|increíble)/i,
        /pude\s+hacerlo/i,
        /lo\s+entendí/i,
        /funcionó/i,
        /logré\s+(terminar|completar|hacer)/i,
        /(terminé|completé)\s+(el|la|mi)/i,
        /pude\s+(terminar|completar)/i
      ],
      context: ['logro', 'éxito', 'resultado', 'completé', 'terminé', 'examen', 'proyecto', 'tarea'],
      intensity_multipliers: { 'muy': 1.2, 'súper': 1.4, 'realmente': 1.3, 'finalmente': 1.3 },
      confidence_base: 0.85
    },

    [EmotionType.DISAPPOINTED]: {
      keywords: ['decepcionado', 'triste', 'desilusionado', 'desanimado'],
      phrases: [
        /no\s+salió\s+como\s+esperaba/i,
        /me\s+(decepciona|entristece|desanima)/i,
        /esperaba\s+(más|mejor)/i,
        /no\s+fue\s+suficiente/i,
        /qué\s+mal/i,
        /no\s+funcionó/i
      ],
      context: ['resultado', 'calificación', 'expectativa', 'fallo', 'error'],
      intensity_multipliers: { 'muy': 1.3, 'realmente': 1.4, 'bastante': 1.2 },
      confidence_base: 0.8
    },

    [EmotionType.EXCITED]: {
      keywords: ['emocionado', 'entusiasmado', 'ilusionado', 'alegre'],
      phrases: [
        /qué\s+(genial|increíble|fantástico)/i,
        /me\s+(emociona|ilusiona|alegra)/i,
        /estoy\s+(emocionado|entusiasmado)/i,
        /no\s+puedo\s+esperar/i,
        /será\s+(genial|fantástico)/i,
        /me\s+encanta/i
      ],
      context: ['proyecto', 'nuevo', 'oportunidad', 'futuro', 'experiencia'],
      intensity_multipliers: { 'muy': 1.2, 'súper': 1.4, 'realmente': 1.3 },
      confidence_base: 0.83
    },

    [EmotionType.BORED]: {
      keywords: ['aburrido', 'hastiado', 'cansado', 'tedioso'],
      phrases: [
        /me\s+(aburre|hastía|cansa)/i,
        /es\s+(aburrido|tedioso|repetitivo)/i,
        /no\s+me\s+interesa/i,
        /qué\s+(aburrido|tedioso)/i,
        /siempre\s+lo\s+mismo/i,
        /no\s+es\s+divertido/i
      ],
      context: ['materia', 'tema', 'repetitivo', 'siempre', 'mismo'],
      intensity_multipliers: { 'muy': 1.2, 'súper': 1.4, 'demasiado': 1.3 },
      confidence_base: 0.78
    },

    [EmotionType.HOPEFUL]: {
      keywords: ['esperanzado', 'optimista', 'confiado', 'positivo'],
      phrases: [
        /espero\s+(que|poder)/i,
        /tengo\s+(esperanza|fe|confianza)/i,
        /creo\s+que\s+(puedo|podré)/i,
        /será\s+posible/i,
        /confío\s+en\s+que/i,
        /estoy\s+optimista/i
      ],
      context: ['futuro', 'posibilidad', 'mejora', 'cambio', 'oportunidad'],
      intensity_multipliers: { 'muy': 1.2, 'realmente': 1.3, 'bastante': 1.1 },
      confidence_base: 0.75
    },

    [EmotionType.STRESSED]: {
      keywords: ['estresado', 'presionado', 'agobiado', 'tensionado'],
      phrases: [
        /me\s+(estresa|presiona|agobia)/i,
        /siento\s+(presión|tensión|estrés)/i,
        /no\s+doy\s+abasto/i,
        /es\s+mucha\s+presión/i,
        /me\s+siento\s+presionado/i,
        /no\s+puedo\s+relajarme/i
      ],
      context: ['tiempo', 'presión', 'deadlines', 'exámenes', 'múltiple'],
      intensity_multipliers: { 'muy': 1.3, 'demasiado': 1.4, 'extremadamente': 1.6 },
      confidence_base: 0.86
    },

    [EmotionType.GRATEFUL]: {
      keywords: ['agradecido', 'gracias', 'reconocido', 'apreciado'],
      phrases: [
        /muchas\s+gracias/i,
        /(te\s+)?agradezco/i,
        /me\s+(ayudas|ayudaste)\s+mucho/i,
        /eres\s+(genial|increíble|muy\s+útil)/i,
        /gracias\s+por/i,
        /lo\s+aprecio/i
      ],
      context: ['ayuda', 'apoyo', 'explicación', 'tiempo', 'paciencia'],
      intensity_multipliers: { 'muchísimas': 1.4, 'realmente': 1.3, 'muy': 1.2 },
      confidence_base: 0.9
    },

    // Emociones básicas con patrones simples
    [EmotionType.HAPPY]: {
      keywords: ['feliz', 'alegre', 'contento', 'bien'],
      phrases: [/me\s+siento\s+(feliz|alegre|bien)/i, /estoy\s+(feliz|contento)/i],
      context: ['logro', 'éxito', 'bueno'],
      intensity_multipliers: { 'muy': 1.2 },
      confidence_base: 0.7
    },

    [EmotionType.SAD]: {
      keywords: ['triste', 'melancólico', 'deprimido'],
      phrases: [/me\s+siento\s+triste/i, /estoy\s+triste/i],
      context: ['mal', 'fallo', 'pérdida'],
      intensity_multipliers: { 'muy': 1.3 },
      confidence_base: 0.75
    },

    [EmotionType.ANGRY]: {
      keywords: ['enojado', 'furioso', 'molesto'],
      phrases: [/me\s+enoja/i, /estoy\s+furioso/i],
      context: ['problema', 'injusto', 'mal'],
      intensity_multipliers: { 'muy': 1.4 },
      confidence_base: 0.8
    },

    [EmotionType.FEAR]: {
      keywords: ['miedo', 'temor', 'asustado'],
      phrases: [/tengo\s+miedo/i, /me\s+asusta/i],
      context: ['peligro', 'amenaza', 'futuro'],
      intensity_multipliers: { 'mucho': 1.3 },
      confidence_base: 0.8
    },

    [EmotionType.SURPRISE]: {
      keywords: ['sorprendido', 'asombrado', 'impresionado'],
      phrases: [/qué\s+sorpresa/i, /me\s+sorprende/i],
      context: ['inesperado', 'nuevo', 'diferente'],
      intensity_multipliers: { 'muy': 1.2 },
      confidence_base: 0.7
    },

    [EmotionType.CONFIDENT]: {
      keywords: ['seguro', 'confiado', 'capaz'],
      phrases: [/estoy\s+seguro/i, /puedo\s+hacerlo/i],
      context: ['capacidad', 'habilidad', 'logro'],
      intensity_multipliers: { 'muy': 1.2 },
      confidence_base: 0.8
    },

    [EmotionType.CURIOUS]: {
      keywords: ['curioso', 'interesado', 'intrigado'],
      phrases: [/me\s+da\s+curiosidad/i, /quiero\s+saber/i],
      context: ['pregunta', 'explorar', 'descubrir'],
      intensity_multipliers: { 'muy': 1.2 },
      confidence_base: 0.75
    },

    [EmotionType.RELIEVED]: {
      keywords: ['aliviado', 'tranquilo', 'relajado'],
      phrases: [/qué\s+alivio/i, /me\s+tranquiliza/i],
      context: ['problema resuelto', 'éxito', 'terminado'],
      intensity_multipliers: { 'muy': 1.2 },
      confidence_base: 0.8
    },

    [EmotionType.NEUTRAL]: {
      keywords: ['normal', 'regular', 'común'],
      phrases: [/está\s+bien/i, /normal/i],
      context: [],
      intensity_multipliers: {},
      confidence_base: 0.5
    }
  }

  /**
   * Analiza las emociones en un mensaje de texto
   */
  static analyzeEmotions(message: string, context?: { subject?: string, previousEmotion?: EmotionType }): EmotionAnalysis {
    const lowerMessage = message.toLowerCase()
    const emotionScores: Array<{ emotion: EmotionType, score: number, indicators: string[] }> = []

    // Analizar cada patrón emocional
    for (const [emotion, pattern] of Object.entries(this.EMOTION_PATTERNS)) {
      const score = this.calculateEmotionScore(lowerMessage, pattern, message)
      if (score > 0.3) { // Umbral mínimo de confianza
        emotionScores.push({
          emotion: emotion as EmotionType,
          score,
          indicators: this.getMatchedIndicators(lowerMessage, pattern, message)
        })
      }
    }

    // Ordenar por puntuación
    emotionScores.sort((a, b) => b.score - a.score)

    // Determinar emoción principal y secundaria
    const primary = emotionScores[0]?.emotion || EmotionType.NEUTRAL
    const secondary = emotionScores.length > 1 && emotionScores[1].score > 0.5 
      ? emotionScores[1].emotion 
      : undefined

    const confidence = emotionScores[0]?.score || 0.5
    const indicators = emotionScores[0]?.indicators || []

    return {
      primary,
      secondary,
      confidence: Math.min(confidence, 0.95), // Cap máximo de confianza
      intensity: this.calculateIntensity(lowerMessage, confidence),
      indicators,
      context: this.analyzeEmotionalContext(lowerMessage, context),
      suggestedResponse: this.getSuggestedResponseType(primary, confidence)
    }
  }

  /**
   * Calcula la puntuación de una emoción específica
   */
  private static calculateEmotionScore(lowerMessage: string, pattern: EmotionPattern, originalMessage: string): number {
    let score = 0
    let matches = 0

    // Buscar palabras clave
    for (const keyword of pattern.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 0.3
        matches++
      }
    }

    // Buscar frases específicas (mayor peso)
    for (const phrase of pattern.phrases) {
      if (phrase.test(originalMessage)) {
        score += 0.5
        matches++
      }
    }

    // Buscar contexto de apoyo
    for (const contextWord of pattern.context) {
      if (lowerMessage.includes(contextWord)) {
        score += 0.1
      }
    }

    // Aplicar multiplicadores de intensidad
    for (const [intensifier, multiplier] of Object.entries(pattern.intensity_multipliers)) {
      if (lowerMessage.includes(intensifier)) {
        score *= multiplier
        break
      }
    }

    // Ajustar por confianza base del patrón
    score *= pattern.confidence_base

    // Bonificación por múltiples coincidencias
    if (matches > 1) {
      score *= 1.2
    }

    return Math.min(score, 1.0) // Cap en 1.0
  }

  /**
   * Obtiene los indicadores que coincidieron
   */
  private static getMatchedIndicators(lowerMessage: string, pattern: EmotionPattern, originalMessage: string): string[] {
    const indicators: string[] = []

    // Palabras clave encontradas
    pattern.keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        indicators.push(`keyword: ${keyword}`)
      }
    })

    // Frases encontradas
    pattern.phrases.forEach((phrase, index) => {
      if (phrase.test(originalMessage)) {
        indicators.push(`phrase_pattern_${index}`)
      }
    })

    return indicators
  }

  /**
   * Calcula la intensidad emocional
   */
  private static calculateIntensity(message: string, confidence: number): 'low' | 'medium' | 'high' {
    const intensifiers = ['muy', 'súper', 'extremadamente', 'completamente', 'totalmente', 'demasiado']
    const hasIntensifier = intensifiers.some(word => message.includes(word))

    if (confidence > 0.8 || hasIntensifier) return 'high'
    if (confidence > 0.6) return 'medium'
    return 'low'
  }

  /**
   * Analiza el contexto emocional
   */
  private static analyzeEmotionalContext(message: string, providedContext?: { subject?: string, previousEmotion?: EmotionType }) {
    const context: EmotionAnalysis['context'] = {}

    // Detectar si es académico
    const academicKeywords = ['examen', 'tarea', 'estudio', 'clase', 'profesor', 'materia', 'universidad', 'colegio']
    context.academic = academicKeywords.some(word => message.includes(word))

    // Detectar si es personal
    const personalKeywords = ['familia', 'amigos', 'casa', 'personal', 'vida', 'sentimientos']
    context.personal = personalKeywords.some(word => message.includes(word))

    // Detectar temporalidad
    if (/ayer|antes|pasado|era|fue/.test(message)) context.temporal = 'past'
    else if (/mañana|próximo|futuro|después|seré/.test(message)) context.temporal = 'future'
    else context.temporal = 'present'

    // Usar contexto proporcionado
    if (providedContext?.subject) {
      context.subject = providedContext.subject
    }

    return context
  }

  /**
   * Sugiere el tipo de respuesta más apropiado
   */
  private static getSuggestedResponseType(emotion: EmotionType, confidence: number): EmotionAnalysis['suggestedResponse'] {
    const responseMap: { [key in EmotionType]: EmotionAnalysis['suggestedResponse'] } = {
      [EmotionType.FRUSTRATED]: 'supportive',
      [EmotionType.OVERWHELMED]: 'supportive',
      [EmotionType.ANXIOUS]: 'empathetic',
      [EmotionType.STRESSED]: 'solution_focused',
      [EmotionType.CONFUSED]: 'professional',
      [EmotionType.DISAPPOINTED]: 'empathetic',
      [EmotionType.SAD]: 'empathetic',
      [EmotionType.ANGRY]: 'supportive',
      [EmotionType.FEAR]: 'supportive',
      [EmotionType.MOTIVATED]: 'encouraging',
      [EmotionType.EXCITED]: 'encouraging',
      [EmotionType.PROUD]: 'encouraging',
      [EmotionType.CONFIDENT]: 'motivational',
      [EmotionType.HOPEFUL]: 'motivational',
      [EmotionType.CURIOUS]: 'professional',
      [EmotionType.GRATEFUL]: 'encouraging',
      [EmotionType.RELIEVED]: 'encouraging',
      [EmotionType.BORED]: 'motivational',
      [EmotionType.HAPPY]: 'encouraging',
      [EmotionType.SURPRISE]: 'professional',
      [EmotionType.NEUTRAL]: 'professional'
    }

    return responseMap[emotion] || 'professional'
  }

  /**
   * Genera un resumen textual del análisis emocional
   */
  static generateEmotionSummary(analysis: EmotionAnalysis): string {
    const emotionNames = {
      [EmotionType.FRUSTRATED]: 'frustrado',
      [EmotionType.MOTIVATED]: 'motivado',
      [EmotionType.CONFUSED]: 'confundido',
      [EmotionType.CONFIDENT]: 'confiado',
      [EmotionType.OVERWHELMED]: 'abrumado',
      [EmotionType.CURIOUS]: 'curioso',
      [EmotionType.PROUD]: 'orgulloso',
      [EmotionType.DISAPPOINTED]: 'decepcionado',
      [EmotionType.ANXIOUS]: 'ansioso',
      [EmotionType.EXCITED]: 'emocionado',
      [EmotionType.BORED]: 'aburrido',
      [EmotionType.HOPEFUL]: 'esperanzado',
      [EmotionType.STRESSED]: 'estresado',
      [EmotionType.RELIEVED]: 'aliviado',
      [EmotionType.GRATEFUL]: 'agradecido',
      [EmotionType.HAPPY]: 'feliz',
      [EmotionType.SAD]: 'triste',
      [EmotionType.ANGRY]: 'enojado',
      [EmotionType.FEAR]: 'temeroso',
      [EmotionType.SURPRISE]: 'sorprendido',
      [EmotionType.NEUTRAL]: 'neutral'
    }

    let summary = `El estudiante se siente ${emotionNames[analysis.primary]} (confianza: ${(analysis.confidence * 100).toFixed(0)}%, intensidad: ${analysis.intensity})`

    if (analysis.secondary) {
      summary += ` con matices de ${emotionNames[analysis.secondary]}`
    }

    if (analysis.context.subject) {
      summary += ` en relación a ${analysis.context.subject}`
    }

    return summary
  }
}