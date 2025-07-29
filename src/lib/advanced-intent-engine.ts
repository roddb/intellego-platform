// Motor de Intenciones Avanzado para Asistente Personal Académico
// Detecta y clasifica las intenciones del usuario para proporcionar respuestas más precisas

import { StudentContext, StudentContextManager } from './student-context'
import { AcademicSubject } from './academic-analyzer'

export enum IntentType {
  // Intenciones Académicas Básicas
  SOLVE_EXERCISE = 'solve_exercise',
  REQUEST_ASSESSMENT = 'request_assessment',
  ASK_QUESTION = 'ask_question',
  REQUEST_HELP = 'request_help',
  
  // Intenciones de Gestión de Tiempo y Organización
  SCHEDULE_MANAGEMENT = 'schedule_management',
  STUDY_PLANNING = 'study_planning',
  CALENDAR_MANAGEMENT = 'calendar_management',
  TIME_OPTIMIZATION = 'time_optimization',
  
  // Intenciones de Gestión de Materiales
  MATERIAL_REQUEST = 'material_request',
  RESOURCE_RECOMMENDATION = 'resource_recommendation',
  CONTENT_ORGANIZATION = 'content_organization',
  
  // Intenciones de Seguimiento y Análisis
  PROGRESS_REVIEW = 'progress_review',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  GOAL_MANAGEMENT = 'goal_management',
  
  // Intenciones de Configuración y Personalización
  PREFERENCE_SETTING = 'preference_setting',
  LEARNING_STYLE_UPDATE = 'learning_style_update',
  SCHEDULE_PREFERENCE = 'schedule_preference',
  
  // Intenciones Conversacionales
  CASUAL_CHAT = 'casual_chat',
  MOTIVATIONAL_SUPPORT = 'motivational_support',
  CLARIFICATION = 'clarification',
  
  // General
  GENERAL = 'general'
}

export enum ConversationMode {
  PLANNING = 'planning',      // Planificación de estudio
  TUTORING = 'tutoring',      // Ayuda académica
  ORGANIZING = 'organizing',   // Organización de calendario
  REVIEWING = 'reviewing',     // Revisión de progreso
  CHATTING = 'chatting'       // Conversación general
}

export interface IntentAnalysis {
  intent: IntentType
  confidence: number
  subject?: AcademicSubject
  topics?: string[]
  entities: {
    dates?: Date[]
    times?: string[]
    subjects?: string[]
    durations?: string[]
    priorities?: string[]
    goals?: string[]
    materials?: string[]
  }
  context: {
    urgency: 'low' | 'medium' | 'high' | 'urgent'
    scope: 'immediate' | 'short_term' | 'long_term'
    complexity: 'simple' | 'moderate' | 'complex'
  }
  suggestedMode: ConversationMode
  followUpActions?: string[]
}

export class AdvancedIntentEngine {
  
  // Patrones para diferentes tipos de intenciones
  private static readonly INTENT_PATTERNS = {
    // Gestión de Horarios y Planificación
    [IntentType.SCHEDULE_MANAGEMENT]: [
      /organiza?\s*(mi|el)?\s*horario/i,
      /planifica?\s*(mi|la)?\s*semana/i,
      /agenda?\s*(una|la)?\s*sesión/i,
      /programa?\s*(una|mi)?\s*(clase|estudio)/i,
      /cuando\s*(debo|puedo)\s*estudiar/i,
      /horario.*estudio/i,
      /sesion.*estudio/i
    ],
    
    [IntentType.STUDY_PLANNING]: [
      /plan.*estudio/i,
      /como.*estudiar.*para/i,
      /planifica.*sesion/i,
      /organiza.*material/i,
      /estrategia.*estudio/i,
      /metodo.*estudio/i,
      /como.*prepararme/i
    ],
    
    [IntentType.CALENDAR_MANAGEMENT]: [
      /agrega.*calendario/i,
      /añade.*evento/i,
      /programa.*examen/i,
      /calendario.*eventos/i,
      /proxim.*evento/i,
      /eventos.*semana/i,
      /agenda.*tarea/i
    ],
    
    [IntentType.TIME_OPTIMIZATION]: [
      /optimiza.*tiempo/i,
      /mejor.*horario/i,
      /eficien.*estudio/i,
      /aprovechar.*tiempo/i,
      /productiv.*sesion/i,
      /maximiza.*rendimiento/i
    ],
    
    // Gestión de Materiales
    [IntentType.MATERIAL_REQUEST]: [
      /necesito.*material/i,
      /donde.*encuentro/i,
      /recomienda.*libro/i,
      /recursos.*para/i,
      /material.*estudio/i,
      /libros.*sobre/i,
      /videos.*de/i
    ],
    
    [IntentType.RESOURCE_RECOMMENDATION]: [
      /recomienda/i,
      /sugiere/i,
      /que.*materiales/i,
      /recursos.*utiles/i,
      /bibliografia/i,
      /fuentes.*informacion/i
    ],
    
    // Seguimiento y Análisis
    [IntentType.PROGRESS_REVIEW]: [
      /como.*voy/i,
      /mi.*progreso/i,
      /avance.*en/i,
      /revision.*progreso/i,
      /que.*tal.*estoy/i,
      /rendimiento.*en/i
    ],
    
    [IntentType.PERFORMANCE_ANALYSIS]: [
      /analiza.*rendimiento/i,
      /estadisticas.*estudio/i,
      /como.*mejoro/i,
      /debilidades.*en/i,
      /fortalezas.*en/i,
      /areas.*mejorar/i
    ],
    
    [IntentType.GOAL_MANAGEMENT]: [
      /objetivo.*para/i,
      /meta.*en/i,
      /quiero.*lograr/i,
      /establecer.*meta/i,
      /crear.*objetivo/i,
      /seguimiento.*objetivo/i
    ],
    
    // Configuración y Personalización
    [IntentType.PREFERENCE_SETTING]: [
      /prefiero.*estudiar/i,
      /me.*gusta.*estudiar/i,
      /configura/i,
      /establece.*preferencia/i,
      /cambiar.*configuracion/i
    ],
    
    [IntentType.LEARNING_STYLE_UPDATE]: [
      /estilo.*aprendizaje/i,
      /como.*aprendo/i,
      /mejor.*manera.*aprender/i,
      /tipo.*estudiante/i,
      /metodo.*aprendizaje/i
    ],
    
    // Motivacional y Conversacional
    [IntentType.MOTIVATIONAL_SUPPORT]: [
      /me.*siento.*desmotivado/i,
      /no.*puedo.*concentrarme/i,
      /ayuda.*motivacion/i,
      /estoy.*cansado/i,
      /no.*tengo.*ganas/i,
      /animo/i,
      /motiva/i
    ],
    
    [IntentType.CASUAL_CHAT]: [
      /hola/i,
      /buenos.*dias/i,
      /como.*estas/i,
      /que.*tal/i,
      /gracias/i,
      /de.*nada/i
    ]
  }
  
  // Patrones para detectar entidades
  private static readonly ENTITY_PATTERNS = {
    dates: [
      /(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
      /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/i,
      /(hoy|mañana|pasado\s*mañana|esta\s*semana|proxima\s*semana)/i,
      /\d{1,2}\/\d{1,2}/,
      /\d{4}-\d{2}-\d{2}/
    ],
    times: [
      /\d{1,2}:\d{2}/,
      /\d{1,2}\s*(am|pm)/i,
      /(mañana|tarde|noche)/i,
      /a\s*las\s*\d{1,2}/i
    ],
    subjects: [
      /(matematicas?|algebra|calculo|geometria)/i,
      /(fisica|mecanica|termodinamica|electromagnetismo)/i,
      /(quimica|organica|inorganica|bioquimica)/i,
      /(biologia|anatomia|botanica|zoologia)/i,
      /(historia|geografia|filosofia|literatura)/i,
      /(ingles|frances|aleman|portugues)/i
    ],
    durations: [
      /\d+\s*(minutos?|horas?|dias?|semanas?)/i,
      /(media\s*hora|una\s*hora|dos\s*horas)/i,
      /(corto|mediano|largo)\s*plazo/i
    ],
    priorities: [
      /(urgente|importante|prioritario|critico)/i,
      /(bajo|medio|alto)\s*(prioridad|importancia)/i,
      /(muy\s*)?(importante|urgente)/i
    ]
  }

  static async analyzeIntent(
    message: string, 
    userId: string, 
    context?: StudentContext
  ): Promise<IntentAnalysis> {
    
    // Obtener contexto del estudiante si no se proporciona
    if (!context) {
      context = await StudentContextManager.getContext(userId) || 
                await StudentContextManager.createDefaultContext(userId)
    }

    const msgLower = message.toLowerCase()
    let bestMatch: { intent: IntentType, confidence: number } = { 
      intent: IntentType.GENERAL, 
      confidence: 0 
    }

    // Analizar patrones de intención
    for (const [intentType, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      const intent = intentType as IntentType
      let maxConfidence = 0

      for (const pattern of patterns) {
        if (pattern.test(message)) {
          const confidence = this.calculatePatternConfidence(message, pattern)
          maxConfidence = Math.max(maxConfidence, confidence)
        }
      }

      if (maxConfidence > bestMatch.confidence) {
        bestMatch = { intent, confidence: maxConfidence }
      }
    }

    // Detectar entidades
    const entities = this.extractEntities(message)

    // Detectar sujeto académico
    const subject = this.detectAcademicSubject(message)

    // Detectar temas específicos
    const topics = this.extractTopics(message, subject)

    // Analizar contexto (urgencia, scope, complejidad)
    const contextAnalysis = this.analyzeMessageContext(message, context)

    // Determinar modo conversacional sugerido
    const suggestedMode = this.determineSuggestedMode(bestMatch.intent, contextAnalysis)

    // Generar acciones de seguimiento
    const followUpActions = this.generateFollowUpActions(bestMatch.intent, entities, context)

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      subject,
      topics,
      entities,
      context: contextAnalysis,
      suggestedMode,
      followUpActions
    }
  }

  private static calculatePatternConfidence(message: string, pattern: RegExp): number {
    const match = message.match(pattern)
    if (!match) return 0

    // Base confidence por match
    let confidence = 0.7

    // Bonus por longitud del match
    const matchLength = match[0].length
    const messageLength = message.length
    const lengthRatio = matchLength / messageLength
    confidence += lengthRatio * 0.2

    // Bonus por palabras clave adicionales
    const keywordBonus = this.countRelatedKeywords(message, pattern)
    confidence += keywordBonus * 0.1

    return Math.min(confidence, 1.0)
  }

  private static countRelatedKeywords(message: string, pattern: RegExp): number {
    const relatedKeywords = {
      'study': ['estudiar', 'aprender', 'repasar', 'practicar'],
      'time': ['tiempo', 'horario', 'cuando', 'programar'],
      'help': ['ayuda', 'ayudar', 'explicar', 'entender'],
      'schedule': ['agenda', 'calendario', 'planificar', 'organizar']
    }

    let count = 0
    for (const keywords of Object.values(relatedKeywords)) {
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          count++
        }
      }
    }
    return Math.min(count, 3) // Max 3 bonus points
  }

  private static extractEntities(message: string): IntentAnalysis['entities'] {
    const entities: IntentAnalysis['entities'] = {}

    // Extraer fechas
    entities.dates = this.extractDates(message)
    
    // Extraer horas
    entities.times = this.extractTimes(message)
    
    // Extraer materias
    entities.subjects = this.extractSubjects(message)
    
    // Extraer duraciones
    entities.durations = this.extractDurations(message)
    
    // Extraer prioridades
    entities.priorities = this.extractPriorities(message)

    return entities
  }

  private static extractDates(message: string): Date[] {
    const dates: Date[] = []
    const now = new Date()

    // Fechas relativas
    if (/\bhoy\b/i.test(message)) {
      dates.push(new Date())
    }
    if (/\bmañana\b/i.test(message)) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dates.push(tomorrow)
    }

    // Días de la semana
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    daysOfWeek.forEach((day, index) => {
      if (message.toLowerCase().includes(day)) {
        const targetDate = new Date()
        const currentDay = targetDate.getDay()
        const daysToAdd = (index - currentDay + 7) % 7
        targetDate.setDate(targetDate.getDate() + daysToAdd)
        dates.push(targetDate)
      }
    })

    return dates
  }

  private static extractTimes(message: string): string[] {
    const times: string[] = []
    
    // Patrones de hora
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\b/g,
      /\b(\d{1,2})\s*(am|pm)\b/gi,
      /\ba\s*las\s*(\d{1,2})/gi
    ]

    timePatterns.forEach(pattern => {
      const matches = message.match(pattern)
      if (matches) {
        times.push(...matches)
      }
    })

    return times
  }

  private static extractSubjects(message: string): string[] {
    const subjects: string[] = []
    const subjectPatterns = this.ENTITY_PATTERNS.subjects
    
    subjectPatterns.forEach(pattern => {
      const match = message.match(pattern)
      if (match) {
        subjects.push(match[0])
      }
    })

    return subjects
  }

  private static extractDurations(message: string): string[] {
    const durations: string[] = []
    const durationPatterns = this.ENTITY_PATTERNS.durations
    
    durationPatterns.forEach(pattern => {
      const match = message.match(pattern)
      if (match) {
        durations.push(match[0])
      }
    })

    return durations
  }

  private static extractPriorities(message: string): string[] {
    const priorities: string[] = []
    const priorityPatterns = this.ENTITY_PATTERNS.priorities
    
    priorityPatterns.forEach(pattern => {
      const match = message.match(pattern)
      if (match) {
        priorities.push(match[0])
      }
    })

    return priorities
  }

  private static detectAcademicSubject(message: string): AcademicSubject | undefined {
    const msgLower = message.toLowerCase()
    
    if (/matemáticas?|álgebra|cálculo|geometría/i.test(msgLower)) {
      return AcademicSubject.MATHEMATICS
    }
    if (/física|mecánica|termodinámica/i.test(msgLower)) {
      return AcademicSubject.PHYSICS
    }
    if (/química|orgánica|inorgánica/i.test(msgLower)) {
      return AcademicSubject.CHEMISTRY
    }
    if (/biología|anatomía|botánica/i.test(msgLower)) {
      return AcademicSubject.BIOLOGY
    }
    if (/historia|geografía|filosofía/i.test(msgLower)) {
      return AcademicSubject.SOCIAL_STUDIES
    }
    if (/inglés|francés|alemán|literatura/i.test(msgLower)) {
      return AcademicSubject.LANGUAGE_ARTS
    }

    return undefined
  }

  private static extractTopics(message: string, subject?: AcademicSubject): string[] {
    const topics: string[] = []
    
    // Extraer temas basados en palabras clave después de "sobre", "de", "para"
    const topicPatterns = [
      /sobre\s+([^,.!?]+)/gi,
      /de\s+([^,.!?]+)/gi,
      /para\s+([^,.!?]+)/gi,
      /tema\s*:?\s*([^,.!?]+)/gi
    ]

    topicPatterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)]
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 3) {
          topics.push(match[1].trim())
        }
      })
    })

    return topics
  }

  private static analyzeMessageContext(message: string, context: StudentContext): {
    urgency: 'low' | 'medium' | 'high' | 'urgent'
    scope: 'immediate' | 'short_term' | 'long_term'
    complexity: 'simple' | 'moderate' | 'complex'
  } {
    const msgLower = message.toLowerCase()
    
    // Analizar urgencia
    let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
    if (/urgente|ya|ahora|inmediato|pronto/i.test(msgLower)) {
      urgency = 'urgent'
    } else if (/importante|necesito|debo/i.test(msgLower)) {
      urgency = 'high'
    } else if (/cuando\s*pueda|algun\s*momento|mas\s*tarde/i.test(msgLower)) {
      urgency = 'low'
    }

    // Analizar scope temporal
    let scope: 'immediate' | 'short_term' | 'long_term' = 'short_term'
    if (/hoy|ahora|ya|inmediato/i.test(msgLower)) {
      scope = 'immediate'
    } else if (/semana|mes|semestre|año/i.test(msgLower)) {
      scope = 'long_term'
    }

    // Analizar complejidad
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
    const questionWords = (msgLower.match(/\b(qué|cómo|cuándo|dónde|por qué|para qué)\b/g) || []).length
    const subjectMentions = (msgLower.match(/(matemáticas?|física|química|biología|historia)/g) || []).length
    
    if (questionWords <= 1 && subjectMentions <= 1) {
      complexity = 'simple'
    } else if (questionWords > 2 || subjectMentions > 2 || message.length > 200) {
      complexity = 'complex'
    }

    return { urgency, scope, complexity }
  }

  private static determineSuggestedMode(intent: IntentType, context: any): ConversationMode {
    switch (intent) {
      case IntentType.SCHEDULE_MANAGEMENT:
      case IntentType.STUDY_PLANNING:
      case IntentType.TIME_OPTIMIZATION:
        return ConversationMode.PLANNING

      case IntentType.SOLVE_EXERCISE:
      case IntentType.REQUEST_ASSESSMENT:
      case IntentType.ASK_QUESTION:
      case IntentType.REQUEST_HELP:
        return ConversationMode.TUTORING

      case IntentType.CALENDAR_MANAGEMENT:
      case IntentType.MATERIAL_REQUEST:
      case IntentType.CONTENT_ORGANIZATION:
        return ConversationMode.ORGANIZING

      case IntentType.PROGRESS_REVIEW:
      case IntentType.PERFORMANCE_ANALYSIS:
      case IntentType.GOAL_MANAGEMENT:
        return ConversationMode.REVIEWING

      default:
        return ConversationMode.CHATTING
    }
  }

  private static generateFollowUpActions(
    intent: IntentType, 
    entities: IntentAnalysis['entities'], 
    context: StudentContext
  ): string[] {
    const actions: string[] = []

    switch (intent) {
      case IntentType.SCHEDULE_MANAGEMENT:
        actions.push('Ver calendario completo', 'Optimizar horario', 'Configurar recordatorios')
        break
      
      case IntentType.STUDY_PLANNING:
        actions.push('Crear plan semanal', 'Configurar sesiones', 'Ver materiales')
        break
      
      case IntentType.CALENDAR_MANAGEMENT:
        actions.push('Agregar evento', 'Ver próximos eventos', 'Editar calendario')
        break
      
      case IntentType.MATERIAL_REQUEST:
        actions.push('Buscar recursos', 'Organizar materiales', 'Crear lista de estudio')
        break
      
      case IntentType.PROGRESS_REVIEW:
        actions.push('Ver estadísticas', 'Analizar rendimiento', 'Establecer metas')
        break
      
      default:
        actions.push('Continuar conversación', 'Cambiar tema', 'Ver opciones')
    }

    return actions
  }
}