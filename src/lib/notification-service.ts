// Sistema de Notificaciones Proactivas para Sara
// Integra búsqueda académica con notificaciones inteligentes usando Novu

import { Novu } from '@novu/node'
import { AcademicSearchEngine, AcademicSearchQuery, SearchAnalysis } from './academic-search-engine'
import { ConversationMemoryManager } from './conversation-memory'
import { EmotionType } from './emotion-analyzer'
import { ConversationMode } from './advanced-intent-engine'

export interface NotificationContext {
  userId: string
  sessionId?: string
  trigger: NotificationTrigger
  priority: NotificationPriority
  academicContext?: {
    subject?: string
    difficulty?: 'struggling' | 'progressing' | 'excelling'
    upcomingDeadlines?: string[]
    recentActivity?: string[]
  }
}

export interface ProactiveNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  actionButton?: {
    text: string
    action: string
    payload?: any
  }
  searchResults?: SearchAnalysis
  timestamp: Date
  priority: NotificationPriority
  category: NotificationCategory
}

export enum NotificationTrigger {
  EMOTIONAL_PATTERN = 'emotional_pattern',
  ACADEMIC_STRUGGLE = 'academic_struggle',
  LEARNING_OPPORTUNITY = 'learning_opportunity',
  DEADLINE_APPROACHING = 'deadline_approaching',
  PROGRESS_MILESTONE = 'progress_milestone',
  KNOWLEDGE_GAP = 'knowledge_gap',
  MOTIVATION_DROP = 'motivation_drop',
  STUDY_PATTERN = 'study_pattern'
}

export enum NotificationType {
  ACADEMIC_RESOURCE = 'academic_resource',
  STUDY_REMINDER = 'study_reminder',
  MOTIVATIONAL = 'motivational',
  PROGRESS_UPDATE = 'progress_update',
  LEARNING_TIP = 'learning_tip',
  DEADLINE_ALERT = 'deadline_alert',
  ACHIEVEMENT = 'achievement'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  ACADEMIC = 'academic',
  EMOTIONAL = 'emotional',
  ORGANIZATIONAL = 'organizational',
  MOTIVATIONAL = 'motivational'
}

export class NotificationService {
  private static novu: Novu | null = null
  private static initialized = false

  /**
   * Inicializa el servicio de notificaciones
   */
  static initialize() {
    try {
      const apiKey = process.env.NOVU_API_KEY
      
      if (apiKey && apiKey.length > 10 && apiKey !== 'tu-clave-secreta-de-novu') {
        this.novu = new Novu(apiKey)
        this.initialized = true
        console.log('✅ Novu notification service initialized successfully')
        console.log('📱 Push notifications, email, and SMS are now available')
      } else if (apiKey === 'tu-clave-secreta-de-novu') {
        console.log('⚠️  Placeholder API key detected. Please configure a real Novu API key.')
        console.log('📖 Follow the tutorial in CLAUDE.md to get your API key')
        this.initialized = true
      } else {
        console.log('⚠️  Novu API key not found, using local notification system')
        console.log('💡 To enable push notifications, configure NOVU_API_KEY in .env')
        console.log('📖 See CLAUDE.md for setup instructions')
        this.initialized = true
      }
    } catch (error) {
      console.error('❌ Failed to initialize Novu:', error)
      console.log('🔄 Falling back to local notification system')
      this.initialized = true
    }
  }

  /**
   * Analiza el contexto del estudiante y genera notificaciones proactivas relevantes
   */
  static async analyzeAndNotify(context: NotificationContext): Promise<ProactiveNotification[]> {
    if (!this.initialized) this.initialize()

    const notifications: ProactiveNotification[] = []
    const memory = ConversationMemoryManager.getMemory(context.userId, context.sessionId)

    // 1. Analizar patrones emocionales para notificaciones
    const emotionalNotifications = await this.analyzeEmotionalPatterns(context, memory)
    notifications.push(...emotionalNotifications)

    // 2. Detectar oportunidades de aprendizaje
    const learningNotifications = await this.detectLearningOpportunities(context, memory)
    notifications.push(...learningNotifications)

    // 3. Verificar deadlines y tareas pendientes
    const deadlineNotifications = await this.checkDeadlinesAndTasks(context, memory)
    notifications.push(...deadlineNotifications)

    // 4. Analizar patrones de estudio
    const studyPatternNotifications = await this.analyzeStudyPatterns(context, memory)
    notifications.push(...studyPatternNotifications)

    // Ordenar por prioridad y enviar
    const prioritizedNotifications = this.prioritizeNotifications(notifications)
    
    // Enviar las notificaciones más importantes
    for (const notification of prioritizedNotifications.slice(0, 3)) {
      await this.sendNotification(notification, context.userId)
    }

    return prioritizedNotifications
  }

  /**
   * Analiza patrones emocionales y genera notificaciones apropiadas
   */
  private static async analyzeEmotionalPatterns(
    context: NotificationContext, 
    memory: any
  ): Promise<ProactiveNotification[]> {
    const notifications: ProactiveNotification[] = []
    const recentEmotions = memory.emotionalProfile.recentEmotions || []
    const currentMood = memory.emotionalProfile.currentMood
    const motivationLevel = memory.emotionalProfile.motivationLevel || 5

    // Patrón: Frustración recurrente
    if (recentEmotions.filter(e => e === EmotionType.FRUSTRATED).length >= 2) {
      const searchQuery: AcademicSearchQuery = {
        topic: 'técnicas de manejo de la frustración en el estudio',
        searchType: 'resources',
        level: 'basic',
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const searchResults = await AcademicSearchEngine.searchAcademicContent(searchQuery)

      notifications.push({
        id: `frustration_${Date.now()}`,
        type: NotificationType.LEARNING_TIP,
        title: '💡 Gestiona la Frustración Académica',
        message: 'He notado que has estado experimentando frustración últimamente. Te encontré recursos específicos para convertir esa frustración en motivación.',
        actionButton: {
          text: 'Ver Técnicas',
          action: 'show_search_results',
          payload: searchResults
        },
        searchResults,
        timestamp: new Date(),
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.EMOTIONAL
      })
    }

    // Patrón: Motivación baja
    if (motivationLevel < 4) {
      const motivationalSearch: AcademicSearchQuery = {
        topic: 'técnicas de motivación para estudiantes estrategias de estudio',
        searchType: 'resources',
        level: 'basic',
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const motivationResults = await AcademicSearchEngine.searchAcademicContent(motivationalSearch)

      notifications.push({
        id: `motivation_${Date.now()}`,
        type: NotificationType.MOTIVATIONAL,
        title: '🌟 Impulsa tu Motivación',
        message: 'Tu nivel de motivación ha bajado un poco. He encontrado estrategias probadas para recuperar tu energía académica.',
        actionButton: {
          text: 'Motivarme',
          action: 'show_search_results',
          payload: motivationResults
        },
        searchResults: motivationResults,
        timestamp: new Date(),
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.MOTIVATIONAL
      })
    }

    // Patrón: Confusión persistente
    if (currentMood === EmotionType.CONFUSED && 
        recentEmotions.filter(e => e === EmotionType.CONFUSED).length >= 2) {
      
      const difficultSubjects = memory.preferences?.difficultSubjects || []
      const primarySubject = difficultSubjects[0] || 'matemáticas'

      const clarificationSearch: AcademicSearchQuery = {
        topic: `${primarySubject} explicación simple conceptos básicos`,
        searchType: 'explanation',
        level: 'basic',
        subject: primarySubject,
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const clarificationResults = await AcademicSearchEngine.searchAcademicContent(clarificationSearch)

      notifications.push({
        id: `confusion_${Date.now()}`,
        type: NotificationType.ACADEMIC_RESOURCE,
        title: '🎯 Aclaremos las Dudas',
        message: `He detectado confusión recurrente en ${primarySubject}. Te busqué explicaciones especialmente claras para resolver tus dudas.`,
        actionButton: {
          text: 'Aclarar Conceptos',
          action: 'show_search_results',
          payload: clarificationResults
        },
        searchResults: clarificationResults,
        timestamp: new Date(),
        priority: NotificationPriority.HIGH,
        category: NotificationCategory.ACADEMIC
      })
    }

    return notifications
  }

  /**
   * Detecta oportunidades de aprendizaje basadas en el progreso
   */
  private static async detectLearningOpportunities(
    context: NotificationContext,
    memory: any
  ): Promise<ProactiveNotification[]> {
    const notifications: ProactiveNotification[] = []
    const achievementAreas = memory.emotionalProfile.achievementAreas || []
    const difficultSubjects = memory.preferences?.difficultSubjects || []

    // Oportunidad: Expandir áreas de fortaleza
    if (achievementAreas.length > 0) {
      const strongSubject = achievementAreas[0]
      const advancedSearch: AcademicSearchQuery = {
        topic: `${strongSubject} avanzado proyectos desafíos`,
        searchType: 'resources',
        level: 'advanced',
        subject: strongSubject,
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const advancedResults = await AcademicSearchEngine.searchAcademicContent(advancedSearch)

      notifications.push({
        id: `opportunity_${Date.now()}`,
        type: NotificationType.LEARNING_TIP,
        title: '🚀 Amplía tus Fortalezas',
        message: `Dominas bien ${strongSubject}. ¿Te interesa explorar aspectos más avanzados y desafiantes?`,
        actionButton: {
          text: 'Explorar Nivel Avanzado',
          action: 'show_search_results',
          payload: advancedResults
        },
        searchResults: advancedResults,
        timestamp: new Date(),
        priority: NotificationPriority.LOW,
        category: NotificationCategory.ACADEMIC
      })
    }

    // Oportunidad: Recursos para materias difíciles
    if (difficultSubjects.length > 0) {
      const challengingSubject = difficultSubjects[0]
      const supportSearch: AcademicSearchQuery = {
        topic: `${challengingSubject} tutorial básico paso a paso`,
        searchType: 'explanation',
        level: 'basic',
        subject: challengingSubject,
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const supportResults = await AcademicSearchEngine.searchAcademicContent(supportSearch)

      notifications.push({
        id: `support_${Date.now()}`,
        type: NotificationType.ACADEMIC_RESOURCE,
        title: '📚 Recursos para Superar Desafíos',
        message: `Encontré nuevos recursos para ${challengingSubject} que podrían ayudarte a superar las dificultades.`,
        actionButton: {
          text: 'Ver Recursos',
          action: 'show_search_results',
          payload: supportResults
        },
        searchResults: supportResults,
        timestamp: new Date(),
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.ACADEMIC
      })
    }

    return notifications
  }

  /**
   * Verifica deadlines y tareas pendientes
   */
  private static async checkDeadlinesAndTasks(
    context: NotificationContext,
    memory: any
  ): Promise<ProactiveNotification[]> {
    const notifications: ProactiveNotification[] = []

    // Simulación de deadlines próximos (en una implementación real, vendría de calendario)
    const upcomingDeadlines = context.academicContext?.upcomingDeadlines || []

    if (upcomingDeadlines.length > 0) {
      const deadline = upcomingDeadlines[0]
      const preparationSearch: AcademicSearchQuery = {
        topic: `${deadline} preparación examen guía estudio`,
        searchType: 'resources',
        level: 'intermediate',
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const prepResults = await AcademicSearchEngine.searchAcademicContent(preparationSearch)

      notifications.push({
        id: `deadline_${Date.now()}`,
        type: NotificationType.DEADLINE_ALERT,
        title: '⏰ Deadline Próximo',
        message: `Se acerca tu ${deadline}. Te busqué recursos específicos para una preparación efectiva.`,
        actionButton: {
          text: 'Preparar Examen',
          action: 'show_search_results',
          payload: prepResults
        },
        searchResults: prepResults,
        timestamp: new Date(),
        priority: NotificationPriority.URGENT,
        category: NotificationCategory.ORGANIZATIONAL
      })
    }

    return notifications
  }

  /**
   * Analiza patrones de estudio para optimizaciones
   */
  private static async analyzeStudyPatterns(
    context: NotificationContext,
    memory: any
  ): Promise<ProactiveNotification[]> {
    const notifications: ProactiveNotification[] = []
    const totalTurns = memory.totalTurns || 0

    // Patrón: Usuario nuevo - ofrecer orientación
    if (totalTurns < 5) {
      const orientationSearch: AcademicSearchQuery = {
        topic: 'técnicas de estudio efectivas guía para estudiantes',
        searchType: 'resources',
        level: 'basic',
        language: 'es',
        userId: context.userId,
        sessionId: context.sessionId
      }

      const orientationResults = await AcademicSearchEngine.searchAcademicContent(orientationSearch)

      notifications.push({
        id: `orientation_${Date.now()}`,
        type: NotificationType.LEARNING_TIP,
        title: '👋 Optimiza tu Estudio',
        message: 'Como eres nuevo, te encontré las mejores técnicas de estudio para maximizar tu aprendizaje desde el inicio.',
        actionButton: {
          text: 'Conocer Técnicas',
          action: 'show_search_results',
          payload: orientationResults
        },
        searchResults: orientationResults,
        timestamp: new Date(),
        priority: NotificationPriority.MEDIUM,
        category: NotificationCategory.ACADEMIC
      })
    }

    return notifications
  }

  /**
   * Prioriza notificaciones según urgencia y relevancia
   */
  private static prioritizeNotifications(notifications: ProactiveNotification[]): ProactiveNotification[] {
    const priorityOrder = {
      [NotificationPriority.URGENT]: 4,
      [NotificationPriority.HIGH]: 3,
      [NotificationPriority.MEDIUM]: 2,
      [NotificationPriority.LOW]: 1
    }

    return notifications.sort((a, b) => {
      const priorityA = priorityOrder[a.priority]
      const priorityB = priorityOrder[b.priority]
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA
      }
      
      // Si tienen la misma prioridad, ordenar por timestamp (más reciente primero)
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  /**
   * Envía notificación usando Novu o sistema local
   */
  private static async sendNotification(notification: ProactiveNotification, userId: string): Promise<boolean> {
    try {
      if (this.novu) {
        // Enviar con Novu
        await this.novu.trigger('academic-notification', {
          to: {
            subscriberId: userId,
          },
          payload: {
            title: notification.title,
            message: notification.message,
            actionText: notification.actionButton?.text,
            actionPayload: notification.actionButton?.payload,
            priority: notification.priority,
            category: notification.category,
            timestamp: notification.timestamp.toISOString()
          },
        })
        
        console.log(`📬 Novu notification sent: ${notification.title}`)
        return true
      } else {
        // Sistema local de notificaciones
        console.log(`📱 Local notification: ${notification.title} - ${notification.message}`)
        this.storeLocalNotification(notification, userId)
        return true
      }
    } catch (error) {
      console.error('❌ Failed to send notification:', error)
      // Fallback: guardar localmente
      this.storeLocalNotification(notification, userId)
      return false
    }
  }

  /**
   * Almacena notificación localmente cuando Novu no está disponible
   */
  private static storeLocalNotification(notification: ProactiveNotification, userId: string) {
    // En un sistema real, esto se guardaría en base de datos
    // Por ahora, usamos almacenamiento en memoria
    if (!globalThis.localNotifications) {
      globalThis.localNotifications = new Map()
    }
    
    if (!globalThis.localNotifications.has(userId)) {
      globalThis.localNotifications.set(userId, [])
    }
    
    const userNotifications = globalThis.localNotifications.get(userId)
    userNotifications.unshift(notification) // Agregar al inicio
    
    // Mantener solo las últimas 10 notificaciones
    if (userNotifications.length > 10) {
      userNotifications.splice(10)
    }
    
    console.log(`💾 Stored local notification for user ${userId}: ${notification.title}`)
  }

  /**
   * Obtiene notificaciones locales para un usuario
   */
  static getLocalNotifications(userId: string): ProactiveNotification[] {
    if (!globalThis.localNotifications) {
      return []
    }
    
    return globalThis.localNotifications.get(userId) || []
  }

  /**
   * Limpia notificaciones antiguas
   */
  static clearOldNotifications(userId: string, olderThanHours: number = 24) {
    if (!globalThis.localNotifications) return
    
    const userNotifications = globalThis.localNotifications.get(userId) || []
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))
    
    const recentNotifications = userNotifications.filter(
      notification => notification.timestamp > cutoffTime
    )
    
    globalThis.localNotifications.set(userId, recentNotifications)
  }

  /**
   * Genera notificación basada en búsqueda académica directa
   */
  static async createAcademicNotification(
    userId: string,
    searchQuery: AcademicSearchQuery,
    trigger: NotificationTrigger,
    customTitle?: string,
    customMessage?: string
  ): Promise<ProactiveNotification> {
    const searchResults = await AcademicSearchEngine.searchAcademicContent(searchQuery)
    
    const defaultTitles = {
      [NotificationTrigger.KNOWLEDGE_GAP]: '🎯 Recursos para tu Consulta',
      [NotificationTrigger.LEARNING_OPPORTUNITY]: '📚 Nueva Oportunidad de Aprendizaje',
      [NotificationTrigger.ACADEMIC_STRUGGLE]: '💡 Ayuda Específica Encontrada',
    }

    const defaultMessages = {
      [NotificationTrigger.KNOWLEDGE_GAP]: `Encontré recursos específicos sobre ${searchQuery.topic} que pueden resolver tus dudas.`,
      [NotificationTrigger.LEARNING_OPPORTUNITY]: `He descubierto material interesante sobre ${searchQuery.topic} que podría expandir tu conocimiento.`,
      [NotificationTrigger.ACADEMIC_STRUGGLE]: `Te busqué recursos especializados para superar las dificultades con ${searchQuery.topic}.`,
    }

    const notification: ProactiveNotification = {
      id: `academic_${Date.now()}`,
      type: NotificationType.ACADEMIC_RESOURCE,
      title: customTitle || defaultTitles[trigger] || '📖 Recursos Académicos',
      message: customMessage || defaultMessages[trigger] || `Recursos encontrados sobre ${searchQuery.topic}`,
      actionButton: {
        text: 'Ver Recursos',
        action: 'show_search_results',
        payload: searchResults
      },
      searchResults,
      timestamp: new Date(),
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.ACADEMIC
    }

    // Enviar la notificación
    await this.sendNotification(notification, userId)
    
    return notification
  }

  /**
   * Obtiene estadísticas del sistema de notificaciones
   */
  static getNotificationStats(userId?: string) {
    const allNotifications = globalThis.localNotifications || new Map()
    
    if (userId) {
      const userNotifications = allNotifications.get(userId) || []
      return {
        total: userNotifications.length,
        byType: this.groupByProperty(userNotifications, 'type'),
        byPriority: this.groupByProperty(userNotifications, 'priority'),
        byCategory: this.groupByProperty(userNotifications, 'category'),
        recent: userNotifications.filter(n => 
          n.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      }
    }

    // Estadísticas globales
    let totalNotifications = 0
    const globalStats = { byType: {}, byPriority: {}, byCategory: {} }
    
    for (const userNotifications of allNotifications.values()) {
      totalNotifications += userNotifications.length
    }

    return {
      totalUsers: allNotifications.size,
      totalNotifications,
      novuEnabled: this.novu !== null,
      initialized: this.initialized
    }
  }

  /**
   * Utilitario para agrupar por propiedad
   */
  private static groupByProperty(notifications: ProactiveNotification[], property: keyof ProactiveNotification) {
    return notifications.reduce((acc, notification) => {
      const key = notification[property] as string
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

// Inicializar el servicio automáticamente
NotificationService.initialize()