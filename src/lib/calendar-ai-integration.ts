// Calendar AI Integration Service
// Integra el sistema de IA tutora con el calendario para crear eventos automáticamente

import { CalendarEvent, addCalendarEvent, getEventTypeColor, getUserCalendarData } from './calendar-data'
import { conversationEngine } from './conversation-engine'

export interface EventSuggestion {
  type: 'exam' | 'study_session' | 'personal' | 'extracurricular'
  title: string
  subject?: string
  date?: string
  startTime?: string
  duration?: number
  location?: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  confidence: number // 0-1 nivel de confianza en la sugerencia
}

export interface ConversationAnalysis {
  hasEventMention: boolean
  eventSuggestions: EventSuggestion[]
  questions: string[]
  missingInfo: string[]
}

/**
 * Analiza una conversación con la IA para detectar menciones de eventos
 */
export function analyzeConversationForEvents(
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): ConversationAnalysis {
  const userMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ')

  const analysis: ConversationAnalysis = {
    hasEventMention: false,
    eventSuggestions: [],
    questions: [],
    missingInfo: []
  }

  // Análisis más inteligente del último mensaje del usuario
  const lastUserMessage = conversationHistory.length > 0 
    ? conversationHistory[conversationHistory.length - 1]?.content || userMessages
    : userMessages

  const msgLower = lastUserMessage.toLowerCase()

  // Detectar intención de agendar/crear evento
  const agendarPatterns = /agendes?|agend[aá]|cre[ae]|programa|anot[ae]|agrega/i
  const isRequestingToSchedule = agendarPatterns.test(lastUserMessage)
  
  // Detectar intención de editar evento
  const editarPatterns = /edit[ae]|modific[ae]|cambi[ae]|actualiz[ae]|reprograma/i
  const isRequestingToEdit = editarPatterns.test(lastUserMessage)
  
  // Detectar intención de eliminar evento
  const eliminarPatterns = /elimin[ae]|borr[ae]|quit[ae]|cancel[ae]|suprimi/i
  const isRequestingToDelete = eliminarPatterns.test(lastUserMessage)

  // Detectar menciones de exámenes con mejor parsing
  if (/(examen|evaluaci[oó]n|parcial|final|prueba|test)/i.test(lastUserMessage)) {
    const eventData = extractEventDataFromMessage(lastUserMessage, 'exam')
    
    if (eventData.hasEvent) {
      // Normalizar subject con acentos correctos
      const normalizedSubject = normalizeSubjectName(eventData.subject)
      
      analysis.eventSuggestions.push({
        type: 'exam',
        title: normalizedSubject ? `Examen de ${normalizedSubject}` : 'Examen',
        subject: normalizedSubject,
        date: eventData.date,
        startTime: eventData.startTime,
        duration: eventData.duration || 120,
        location: eventData.location,
        description: eventData.description,
        priority: 'high',
        confidence: 0.9
      })
      analysis.hasEventMention = true
    }
  }

  // Detectar menciones de estudio
  else if (/(estudiar|repasar|preparar|practicar|sesi[oó]n.*estudio)/i.test(lastUserMessage)) {
    const eventData = extractEventDataFromMessage(lastUserMessage, 'study_session')
    
    if (eventData.hasEvent) {
      // Normalizar subject con acentos correctos
      const normalizedSubject = normalizeSubjectName(eventData.subject) || 'Revisión General'
      
      analysis.eventSuggestions.push({
        type: 'study_session',
        title: `Sesión de Estudio - ${normalizedSubject}`,
        subject: normalizedSubject,
        date: eventData.date,
        startTime: eventData.startTime,
        duration: eventData.duration || 90,
        location: eventData.location,
        description: eventData.description,
        priority: 'medium',
        confidence: 0.8
      })
      analysis.hasEventMention = true
    }
  }

  // Solo generar preguntas para información realmente faltante
  if (analysis.eventSuggestions.length > 0) {
    const suggestion = analysis.eventSuggestions[0]
    const questions: string[] = []
    const missingInfo: string[] = []

    if (!suggestion.date) {
      questions.push("📅 ¿Para qué fecha es?")
      missingInfo.push("fecha")
    }

    if (!suggestion.startTime) {
      questions.push("🕐 ¿A qué hora?")
      missingInfo.push("hora")
    }

    if (suggestion.type === 'exam' && !suggestion.subject) {
      questions.push("📚 ¿De qué materia es el examen?")
      missingInfo.push("materia")
    }

    if (suggestion.type === 'exam' && !suggestion.location) {
      questions.push("📍 ¿En qué aula será?")
      missingInfo.push("ubicación")
    }

    // Solo agregar preguntas si realmente falta información
    analysis.questions = questions
    analysis.missingInfo = missingInfo
  }

  return analysis
}

/**
 * Extrae datos específicos del evento desde el mensaje
 */
function extractEventDataFromMessage(message: string, eventType: 'exam' | 'study_session' | 'personal' | 'extracurricular') {
  const msgLower = message.toLowerCase()
  
  // Extraer materia de manera más inteligente
  let subject = null
  const subjectPatterns = [
    /(?:examen|evaluaci[oó]n|parcial|final|prueba|test).*?(?:de|en)\s+([a-záéíóúñ]+)/i,
    /([a-záéíóúñ]+).*?(?:examen|evaluaci[oó]n|parcial|final|prueba|test)/i,
    /(?:estudiar|repasar|preparar|practicar)\s+([a-záéíóúñ]+)/i,
    /(?:sesi[oó]n.*?(?:de|en)\s+([a-záéíóúñ]+))/i
  ]
  
  for (const pattern of subjectPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      // Capitalizar primera letra
      subject = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
      break
    }
  }

  // Extraer fecha de manera más inteligente
  let date = null
  let startTime = null
  
  // Detectar fechas específicas (dd de mes, dd/mm, etc.)
  const specificDatePatterns = [
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
    /(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/,
    /el\s+(\d{1,2})/i
  ]
  
  for (const pattern of specificDatePatterns) {
    const match = message.match(pattern)
    if (match) {
      if (pattern.source.includes('de')) {
        // "10 de julio"
        const day = parseInt(match[1])
        const monthName = match[2].toLowerCase()
        const monthMap: Record<string, number> = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
          'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
          'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        }
        if (monthMap[monthName] !== undefined) {
          const now = new Date()
          const eventDate = new Date(now.getFullYear(), monthMap[monthName], day)
          date = eventDate.toISOString().split('T')[0]
        }
      } else if (match[1] && !isNaN(parseInt(match[1]))) {
        // Formato dd/mm o dd-mm o "el 10"
        const day = parseInt(match[1])
        const month = match[2] ? parseInt(match[2]) - 1 : new Date().getMonth()
        const year = match[3] ? parseInt(match[3]) : new Date().getFullYear()
        const eventDate = new Date(year, month, day)
        date = eventDate.toISOString().split('T')[0]
      }
      break
    }
  }

  // Si no se encontró fecha específica, buscar días relativos
  if (!date) {
    const relativeDatePatterns = [
      { pattern: /ma[ñn]ana/i, days: 1 },
      { pattern: /hoy/i, days: 0 },
      { pattern: /pasado.*ma[ñn]ana/i, days: 2 },
      { pattern: /lunes/i, targetDay: 1 },
      { pattern: /martes/i, targetDay: 2 },
      { pattern: /mi[eé]rcoles/i, targetDay: 3 },
      { pattern: /jueves/i, targetDay: 4 },
      { pattern: /viernes/i, targetDay: 5 },
      { pattern: /s[aá]bado/i, targetDay: 6 },
      { pattern: /domingo/i, targetDay: 0 }
    ]

    for (const { pattern, days, targetDay } of relativeDatePatterns) {
      if (pattern.test(message)) {
        const now = new Date()
        let eventDate: Date

        if (days !== undefined) {
          eventDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        } else if (targetDay !== undefined) {
          const currentDay = now.getDay()
          let daysToAdd = targetDay - currentDay
          if (daysToAdd <= 0) daysToAdd += 7 // Próxima semana
          eventDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        } else {
          continue
        }

        date = eventDate.toISOString().split('T')[0]
        break
      }
    }
  }

  // Extraer hora de manera más inteligente
  const timePatterns = [
    /(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)/i,
    /(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?\s*h(?:oras?)?/i,
    /(\d{1,2})(?::(\d{2}))?\s*(?:de\s+la\s+)?(ma[ñn]ana|tarde|noche)/i
  ]

  for (const pattern of timePatterns) {
    const match = message.match(pattern)
    if (match) {
      let hour = parseInt(match[1])
      const minute = match[2] ? parseInt(match[2]) : 0
      const period = match[3]?.toLowerCase()

      // Convertir a formato 24h
      if (period) {
        if ((period.includes('pm') || period.includes('p.m') || period === 'tarde' || period === 'noche') && hour < 12) {
          hour += 12
        } else if ((period.includes('am') || period.includes('a.m') || period === 'ma[ñn]ana') && hour === 12) {
          hour = 0
        } else if (period === 'noche' && hour < 6) {
          hour += 12 // Para casos como "3 de la noche" = 15:00
        }
      }

      startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      break
    }
  }

  // Extraer ubicación
  let location = null
  const locationPatterns = [
    /(?:en\s+el?\s+)?(aula|laboratorio|sala|auditorio)\s+([a-zA-Z0-9]+)/i,
    /(?:en\s+)([a-zA-Z\s]+(?:aula|laboratorio|sala|auditorio)[a-zA-Z0-9\s]*)/i
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match) {
      location = match[0].replace(/^en\s+/i, '').trim()
      break
    }
  }

  // Extraer duración
  let duration = null
  const durationMatch = message.match(/(?:durante\s+)?(\d+)\s*(horas?|minutos?|min)/i)
  if (durationMatch) {
    const value = parseInt(durationMatch[1])
    const unit = durationMatch[2].toLowerCase()
    duration = unit.includes('hora') ? value * 60 : value
  }

  // Extraer descripción/tema específico si se menciona
  let description = null
  const topicPatterns = [
    /(?:sobre|tema|temas?)\s+([a-záéíóúñ\s]+?)(?:\s+para|\s+el|\s+a|$)/i,
    /(?:sobre)\s+el\s+tema\s+([a-záéíóúñ\s]+?)(?:\s+para|\s+el|\s+a|$)/i
  ]
  
  for (const pattern of topicPatterns) {
    const match = message.match(pattern)
    if (match && match[1] && match[1].trim().length > 3) {
      description = match[1].trim()
      break
    }
  }

  return {
    hasEvent: true,
    subject,
    date,
    startTime,
    location,
    duration,
    description
  }
}

/**
 * Genera preguntas para completar la información de un evento
 */
export function generateEventQuestions(suggestion: EventSuggestion): string[] {
  const questions: string[] = []

  if (!suggestion.date) {
    questions.push("📅 ¿Para qué fecha es?")
  }

  if (!suggestion.startTime) {
    questions.push("🕐 ¿A qué hora?")
  }

  if (suggestion.type === 'exam') {
    if (!suggestion.subject) {
      questions.push("📚 ¿De qué materia es el examen?")
    }
    if (!suggestion.location) {
      questions.push("📍 ¿En qué aula o laboratorio será?")
    }
    if (!suggestion.duration) {
      questions.push("⏱️ ¿Cuánto tiempo durará?")
    }
  }

  if (suggestion.type === 'study_session') {
    if (!suggestion.subject) {
      questions.push("📖 ¿Qué tema vas a estudiar?")
    }
    if (!suggestion.duration) {
      questions.push("⏰ ¿Cuántas horas planeas estudiar?")
    }
  }

  if (suggestion.type === 'personal' || suggestion.type === 'extracurricular') {
    if (!suggestion.location) {
      questions.push("📍 ¿Dónde será?")
    }
  }

  return questions
}

/**
 * Convierte una sugerencia de evento en un evento de calendario
 */
export function convertSuggestionToCalendarEvent(
  suggestion: EventSuggestion,
  userId: string,
  additionalInfo?: Partial<EventSuggestion>
): CalendarEvent {
  const merged = { ...suggestion, ...additionalInfo }
  
  // Procesar fecha
  let eventDate = new Date()
  if (merged.date) {
    eventDate = parseDateFromText(merged.date)
  }

  // Procesar hora
  let startTime = merged.startTime || '15:00'
  let endTime = merged.startTime || '16:00'
  
  if (merged.duration && merged.startTime) {
    const start = new Date(`2000-01-01T${merged.startTime}:00`)
    const end = new Date(start.getTime() + merged.duration * 60000)
    endTime = end.toTimeString().substring(0, 5)
  }

  const event: CalendarEvent = {
    id: `ai-event-${Date.now()}`,
    title: merged.title,
    date: eventDate,
    startTime: startTime,
    endTime: endTime,
    type: merged.type,
    color: getEventTypeColor(merged.type),
    subject: merged.subject,
    location: merged.location,
    description: merged.description || 'Creado automáticamente por IA Tutora',
    priority: merged.priority || 'medium',
    duration: merged.duration || 60
  }

  return event
}

/**
 * Crea un evento automáticamente desde la IA usando el API endpoint dedicado
 */
export async function createEventFromAI(
  suggestion: EventSuggestion,
  userId: string,
  additionalInfo?: Partial<EventSuggestion>
): Promise<{ success: boolean; event?: CalendarEvent; message?: string }> {
  try {
    const merged = { ...suggestion, ...additionalInfo }
    
    // Procesar fecha
    let eventDate = new Date()
    if (merged.date) {
      eventDate = parseDateFromText(merged.date)
    }
    
    // Calcular endTime basado en duration y startTime
    let endTime = merged.startTime || '16:00'
    if (merged.duration && merged.startTime) {
      const start = new Date(`2000-01-01T${merged.startTime}:00`)
      const end = new Date(start.getTime() + merged.duration * 60000)
      endTime = end.toTimeString().substring(0, 5)
    }

    const eventData = {
      title: merged.title,
      type: merged.type,
      subject: merged.subject,
      date: eventDate.toISOString(),
      startTime: merged.startTime || '15:00',
      endTime: endTime,
      duration: merged.duration || 60,
      location: merged.location,
      description: merged.description || `Creado automáticamente por IA Tutora`,
      priority: merged.priority || 'medium'
    }

    // For server-side execution, call the function directly instead of HTTP fetch
    try {
      const { createCalendarEvent } = require('../app/api/ai-calendar/create-event/route')
      const mockRequest = {
        json: async () => eventData
      }
      const response = await createCalendarEvent(mockRequest as any)
      const result = await response.json()
      
      return {
        success: result.success,
        event: result.event,
        message: result.message
      }
    } catch (directCallError) {
      console.log('Direct API call failed, trying alternative approach:', directCallError)
      
      // Alternative: Use calendar-data functions directly
      const { addCalendarEvent, getUserCalendarData, createUserCalendarData } = require('./calendar-data')
      
      // Ensure user has calendar data
      let userData = getUserCalendarData(userId)
      if (!userData) {
        console.log(`🆕 Creating calendar data for user ${userId}`)
        userData = createUserCalendarData(userId)
      }
      
      const calendarEvent = {
        id: `ai-event-${Date.now()}`,
        title: eventData.title,
        date: new Date(eventData.date),
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        type: eventData.type,
        color: '#3B82F6', // Default color
        subject: eventData.subject,
        location: eventData.location,
        description: eventData.description,
        priority: eventData.priority,
        duration: eventData.duration
      }
      
      console.log(`📅 Creating event: ${calendarEvent.title} for ${eventData.date} at ${eventData.startTime}`)
      const success = addCalendarEvent(userId, calendarEvent)
      
      return {
        success,
        event: success ? calendarEvent : undefined,
        message: success ? 'Evento creado exitosamente' : 'Error al crear evento'
      }
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`🤖 IA confirmó creación: ${result.event.title}`)
      
      // Disparar evento del lado del cliente para notificar componentes
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('calendarEventCreated', {
            detail: { event: result.event, userId }
          }))
        }, 200)
      }
      
      return {
        success: true,
        event: result.event,
        message: result.message
      }
    } else {
      console.error('❌ IA falló al crear evento:', result.error)
      return {
        success: false,
        message: result.error || 'Error desconocido'
      }
    }
  } catch (error) {
    console.error('❌ Error in AI event creation:', error)
    return {
      success: false,
      message: 'Error de conexión al crear evento'
    }
  }
}

/**
 * Parsea fechas desde texto natural
 */
function parseDateFromText(dateText: string): Date {
  const text = dateText.toLowerCase()
  const today = new Date()
  
  if (text.includes('hoy')) {
    return today
  }
  
  if (text.includes('mañana') || text.includes('ma[ñn]ana')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return tomorrow
  }
  
  if (text.includes('pasado')) {
    const dayAfterTomorrow = new Date(today)
    dayAfterTomorrow.setDate(today.getDate() + 2)
    return dayAfterTomorrow
  }

  // Días de la semana
  const dayMap: Record<string, number> = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
  }

  for (const [dayName, dayNumber] of Object.entries(dayMap)) {
    if (text.includes(dayName)) {
      const targetDate = new Date(today)
      const currentDay = today.getDay()
      let daysToAdd = dayNumber - currentDay
      
      if (daysToAdd <= 0) {
        daysToAdd += 7 // Próxima semana
      }
      
      targetDate.setDate(today.getDate() + daysToAdd)
      return targetDate
    }
  }

  // Si incluye números (ej: "en 3 días")
  const daysMatch = text.match(/en\s+(\d+)\s+d[ií]as?/)
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + days)
    return futureDate
  }

  // Por defecto, devolver mañana
  const defaultDate = new Date(today)
  defaultDate.setDate(today.getDate() + 1)
  return defaultDate
}

/**
 * Genera respuesta de la IA para sugerir crear eventos
 */
export function generateEventSuggestionResponse(analysis: ConversationAnalysis): string {
  if (!analysis.hasEventMention || analysis.eventSuggestions.length === 0) {
    return ""
  }

  const suggestion = analysis.eventSuggestions[0] // Tomar la primera sugerencia
  
  let response = `📅 Perfecto! Veo que quieres agendar: **${suggestion.title}**\n\n`
  
  // Mostrar información detectada
  const detectedInfo: string[] = []
  if (suggestion.subject) detectedInfo.push(`📚 Materia: ${suggestion.subject}`)
  if (suggestion.date) {
    const dateObj = new Date(suggestion.date)
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    })
    detectedInfo.push(`📅 Fecha: ${formattedDate}`)
  }
  if (suggestion.startTime) detectedInfo.push(`🕐 Hora: ${suggestion.startTime}`)
  if (suggestion.location) detectedInfo.push(`📍 Ubicación: ${suggestion.location}`)
  
  if (detectedInfo.length > 0) {
    response += `**Información detectada:**\n${detectedInfo.join('\n')}\n\n`
  }
  
  if (analysis.questions.length > 0) {
    response += `Para completar el evento necesito:\n`
    analysis.questions.forEach((question, index) => {
      response += `${index + 1}. ${question}\n`
    })
    response += `\n¿Podrías darme estos detalles?`
  } else {
    response += `¡Tengo toda la información necesaria! ¿Confirmas que lo agregue a tu calendario?`
  }

  return response
}

/**
 * Interfaz para el workflow completo de creación de eventos por IA
 */
export class AICalendarIntegration {
  private userId: string
  private pendingSuggestion: EventSuggestion | null = null
  private collectedInfo: Partial<EventSuggestion> = {}

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Procesa un mensaje del usuario y detecta si necesita crear eventos
   */
  async processMessage(message: string, conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>): Promise<{
    needsEventCreation: boolean
    response?: string
    questions?: string[]
    event?: CalendarEvent
  }> {
    const analysis = analyzeConversationForEvents([...conversationHistory, { role: 'user', content: message }])

    if (analysis.hasEventMention && analysis.eventSuggestions.length > 0) {
      this.pendingSuggestion = analysis.eventSuggestions[0]
      
      if (analysis.questions.length > 0) {
        return {
          needsEventCreation: true,
          response: generateEventSuggestionResponse(analysis),
          questions: analysis.questions
        }
      } else {
        // Información completa, crear evento directamente
        const result = await this.createPendingEvent()
        return {
          needsEventCreation: true,
          response: result.success 
            ? this.generateSuccessMessage(result.event!)
            : `❌ ${result.message || 'Hubo un error al crear el evento. Por favor intenta nuevamente.'}`,
          event: result.event
        }
      }
    }

    return { needsEventCreation: false }
  }

  /**
   * Recopila información adicional del usuario
   */
  collectAdditionalInfo(infoType: string, value: string): boolean {
    if (!this.pendingSuggestion) return false

    switch (infoType.toLowerCase()) {
      case 'fecha':
        this.collectedInfo.date = value
        break
      case 'hora':
        this.collectedInfo.startTime = value
        break
      case 'materia':
      case 'tema':
        this.collectedInfo.subject = value
        break
      case 'ubicación':
      case 'ubicacion':
        this.collectedInfo.location = value
        break
      case 'duración':
      case 'duracion':
        this.collectedInfo.duration = parseInt(value)
        break
    }

    return true
  }

  /**
   * Crea el evento pendiente con la información recopilada
   */
  async createPendingEvent(): Promise<{ success: boolean; message?: string; event?: CalendarEvent }> {
    if (!this.pendingSuggestion) {
      return { success: false, message: 'No hay evento pendiente' }
    }

    const result = await createEventFromAI(this.pendingSuggestion, this.userId, this.collectedInfo)
    
    if (result.success) {
      this.pendingSuggestion = null
      this.collectedInfo = {}
    }

    return result
  }

  /**
   * Cancela la creación del evento pendiente
   */
  cancelPendingEvent(): void {
    this.pendingSuggestion = null
    this.collectedInfo = {}
  }

  /**
   * Obtiene la sugerencia pendiente
   */
  getPendingSuggestion(): EventSuggestion | null {
    return this.pendingSuggestion
  }
  
  /**
   * Genera mensaje de éxito con detalles del evento creado
   */
  private generateSuccessMessage(event: CalendarEvent): string {
    let message = `✅ ¡Perfecto! He creado "${event.title}" en tu calendario.`
    
    // Agregar detalles específicos
    const details: string[] = []
    
    if (event.date) {
      const dateStr = event.date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      details.push(`📅 **Fecha**: ${dateStr}`)
    }
    
    if (event.startTime) {
      details.push(`🕐 **Hora**: ${event.startTime}`)
    }
    
    if (event.location) {
      details.push(`📍 **Ubicación**: ${event.location}`)
    }
    
    if (event.subject && event.type === 'exam') {
      details.push(`📚 **Materia**: ${event.subject}`)
    }
    
    if (event.description && !event.description.includes('Creado automáticamente')) {
      details.push(`📝 **Tema**: ${event.description}`)
    }
    
    if (details.length > 0) {
      message += `\n\n**Detalles del evento:**\n${details.join('\n')}`
    }
    
    message += `\n\n🎯 Puedes ver todos tus eventos en la sección "Organizador Inteligente" de tu calendario.`
    
    return message
  }
}

/**
 * Busca eventos del usuario por texto de búsqueda
 */
export function findUserEvents(userId: string, searchText: string): CalendarEvent[] {
  const userData = getUserCalendarData(userId)
  if (!userData) return []
  
  const search = searchText.toLowerCase()
  return userData.events.filter(event => {
    return event.title.toLowerCase().includes(search) ||
           event.subject?.toLowerCase().includes(search) ||
           event.description?.toLowerCase().includes(search) ||
           event.location?.toLowerCase().includes(search)
  })
}

/**
 * Edita un evento usando el API endpoint
 */
export async function editEventFromAI(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<{ success: boolean; event?: CalendarEvent; message?: string }> {
  try {
    // For server-side execution, call the function directly
    try {
      const { updateCalendarEvent } = require('./calendar-data')
      const success = updateCalendarEvent(eventId, updates)
      
      return {
        success,
        event: success ? { id: eventId, ...updates } : undefined,
        message: success ? 'Evento actualizado exitosamente' : 'Error al actualizar evento'
      }
    } catch (error) {
      console.error('Error updating event:', error)
      return {
        success: false,
        message: 'Error al actualizar evento'
      }
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`🤖 IA editó evento: ${result.event.title}`)
      
      // Disparar evento del lado del cliente
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('calendarEventUpdated', {
            detail: { event: result.event, eventId }
          }))
        }, 200)
      }
      
      return {
        success: true,
        event: result.event,
        message: result.message
      }
    } else {
      return {
        success: false,
        message: result.error || 'Error desconocido al editar'
      }
    }
  } catch (error) {
    console.error('❌ Error editing event from AI:', error)
    return {
      success: false,
      message: 'Error de conexión al editar evento'
    }
  }
}

/**
 * Elimina un evento usando el API endpoint
 */
export async function deleteEventFromAI(
  eventId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // For server-side execution, call the function directly
    try {
      const { deleteCalendarEvent } = require('./calendar-data')
      const deletedEvent = deleteCalendarEvent(eventId)
      
      return {
        success: !!deletedEvent,
        message: deletedEvent ? 
          `Evento "${deletedEvent.title}" eliminado exitosamente` : 
          'Evento no encontrado'
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      return {
        success: false,
        message: 'Error al eliminar evento'
      }
    }

    const result = await response.json()
    
    if (result.success) {
      console.log(`🤖 IA eliminó evento: ${result.deletedEvent.title}`)
      
      // Disparar evento del lado del cliente
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('calendarEventDeleted', {
            detail: { eventId, title: result.deletedEvent.title }
          }))
        }, 200)
      }
      
      return {
        success: true,
        message: result.message
      }
    } else {
      return {
        success: false,
        message: result.error || 'Error desconocido al eliminar'
      }
    }
  } catch (error) {
    console.error('❌ Error deleting event from AI:', error)
    return {
      success: false,
      message: 'Error de conexión al eliminar evento'
    }
  }
}

/**
 * Normaliza nombres de materias con acentos y mayúsculas correctas
 */
function normalizeSubjectName(subject?: string | null): string | null {
  if (!subject) return null
  
  const normalized = subject.toLowerCase().trim()
  
  const subjectMap: Record<string, string> = {
    'quimica': 'Química',
    'química': 'Química',
    'fisica': 'Física',
    'física': 'Física',
    'matematica': 'Matemática',
    'matemáticas': 'Matemáticas',
    'matematicas': 'Matemáticas',
    'biologia': 'Biología',
    'biología': 'Biología',
    'historia': 'Historia',
    'geografia': 'Geografía',
    'geografía': 'Geografía',
    'ingles': 'Inglés',
    'inglés': 'Inglés',
    'lengua': 'Lengua y Literatura',
    'literatura': 'Lengua y Literatura',
    'filosofia': 'Filosofía',
    'filosofía': 'Filosofía',
    'economia': 'Economía',
    'economía': 'Economía',
    'educacion fisica': 'Educación Física',
    'educación física': 'Educación Física',
    'ed fisica': 'Educación Física',
    'arte': 'Arte',
    'musica': 'Música',
    'música': 'Música'
  }
  
  // Buscar coincidencia exacta primero
  if (subjectMap[normalized]) {
    return subjectMap[normalized]
  }
  
  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(subjectMap)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value
    }
  }
  
  // Si no se encuentra, capitalizar primera letra
  return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase()
}