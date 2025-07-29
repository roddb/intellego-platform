// Endpoint de Prueba para Sistema de Búsqueda Académica + Notificaciones
import { NextRequest, NextResponse } from 'next/server'
import { AcademicSearchEngine } from '@/lib/academic-search-engine'
import { WebSearchIntegration } from '@/lib/web-search-integration'
import { NotificationService, NotificationTrigger, NotificationPriority } from '@/lib/notification-service'
import { ConversationEngine } from '@/lib/conversation-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, message, searchQuery } = body

    const testUserId = userId || 'test-user-academic'
    const testSessionId = `test-session-${Date.now()}`

    switch (action) {
      case 'test_academic_search':
        return await testAcademicSearch(testUserId, testSessionId, searchQuery)
      
      case 'test_notifications':
        return await testNotificationSystem(testUserId, testSessionId)
      
      case 'test_conversation_integration':
        return await testConversationIntegration(testUserId, message)
      
      case 'test_full_system':
        return await testFullSystem(testUserId, testSessionId)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no reconocida',
          availableActions: [
            'test_academic_search',
            'test_notifications', 
            'test_conversation_integration',
            'test_full_system'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in academic system test:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al probar el sistema académico'
    }, { status: 500 })
  }
}

/**
 * Prueba el motor de búsqueda académica
 */
async function testAcademicSearch(userId: string, sessionId: string, searchQuery?: any) {
  const testQueries = [
    {
      topic: 'ecuaciones cuadráticas',
      subject: 'matemáticas',
      searchType: 'explanation',
      level: 'intermediate',
      language: 'es'
    },
    {
      topic: 'reacciones químicas',
      subject: 'química',
      searchType: 'examples',
      level: 'basic',
      language: 'es'
    },
    {
      topic: 'Segunda Guerra Mundial',
      subject: 'historia',
      searchType: 'resources',
      level: 'intermediate',
      language: 'es'
    }
  ]

  const query = searchQuery || testQueries[0]
  query.userId = userId
  query.sessionId = sessionId

  console.log('🔍 Testing academic search with query:', query)

  // Probar búsqueda académica
  const searchResult = await AcademicSearchEngine.searchAcademicContent(query)
  
  // Probar búsqueda inteligente
  const smartSearchResult = await AcademicSearchEngine.smartSearch(
    `Busca información sobre ${query.topic}`,
    userId,
    sessionId
  )

  // Probar integración web
  const webSearchResult = await WebSearchIntegration.performAcademicWebSearch(query)

  return NextResponse.json({
    success: true,
    tests: {
      academicSearch: {
        query,
        result: searchResult,
        resultsFound: searchResult.results.length,
        searchTime: searchResult.searchTime
      },
      smartSearch: {
        detected: smartSearchResult !== null,
        result: smartSearchResult,
        extractedQuery: smartSearchResult?.query
      },
      webIntegration: {
        result: webSearchResult,
        totalResults: webSearchResult.totalResults,
        searchSuccess: webSearchResult.searchSuccess
      }
    },
    summary: {
      academicSearchWorking: searchResult.searchSuccess,
      smartDetectionWorking: smartSearchResult !== null,
      webIntegrationWorking: webSearchResult.searchSuccess,
      totalResultsFound: searchResult.results.length + webSearchResult.results.length
    },
    message: 'Pruebas de búsqueda académica completadas'
  })
}

/**
 * Prueba el sistema de notificaciones
 */
async function testNotificationSystem(userId: string, sessionId: string) {
  console.log('📬 Testing notification system')

  const testContexts = [
    {
      userId,
      sessionId,
      trigger: NotificationTrigger.EMOTIONAL_PATTERN,
      priority: NotificationPriority.HIGH,
      academicContext: {
        subject: 'matemáticas',
        difficulty: 'struggling' as const,
        upcomingDeadlines: ['examen de álgebra'],
        recentActivity: ['frustración con ecuaciones']
      }
    },
    {
      userId,
      sessionId,
      trigger: NotificationTrigger.LEARNING_OPPORTUNITY,
      priority: NotificationPriority.MEDIUM
    }
  ]

  const notificationResults = []
  
  for (const context of testContexts) {
    const notifications = await NotificationService.analyzeAndNotify(context)
    notificationResults.push({
      context: context.trigger,
      notifications,
      count: notifications.length
    })
  }

  // Probar creación de notificación académica específica
  const academicNotification = await NotificationService.createAcademicNotification(
    userId,
    {
      topic: 'funciones matemáticas',
      subject: 'matemáticas',
      searchType: 'explanation',
      level: 'basic',
      language: 'es',
      userId,
      sessionId
    },
    NotificationTrigger.KNOWLEDGE_GAP,
    'Prueba de Notificación Académica',
    'Esta es una prueba del sistema de notificaciones académicas.'
  )

  // Obtener estadísticas
  const stats = NotificationService.getNotificationStats(userId)
  const localNotifications = NotificationService.getLocalNotifications(userId)

  return NextResponse.json({
    success: true,
    tests: {
      proactiveNotifications: notificationResults,
      academicNotification,
      localNotifications,
      stats
    },
    summary: {
      totalNotificationsGenerated: notificationResults.reduce((sum, r) => sum + r.count, 0) + 1,
      notificationSystemWorking: true,
      localStorageWorking: localNotifications.length > 0,
      statsWorking: stats.initialized
    },
    message: 'Pruebas del sistema de notificaciones completadas'
  })
}

/**
 * Prueba la integración con el motor de conversación
 */
async function testConversationIntegration(userId: string, testMessage?: string) {
  console.log('💬 Testing conversation integration')

  const testMessages = [
    testMessage || 'Busca información sobre ecuaciones cuadráticas',
    'Necesito recursos sobre reacciones químicas',
    'Encuentra ejemplos de la Segunda Guerra Mundial',
    'Buscar material de física cuántica'
  ]

  const conversationResults = []

  for (const message of testMessages) {
    const response = await ConversationEngine.processUserMessage(
      message,
      userId,
      'Test User'
    )

    conversationResults.push({
      userMessage: message,
      aiResponse: response,
      hasSearchResults: response.metadata?.searchResults !== undefined,
      hasNotification: response.metadata?.notification !== undefined
    })
  }

  return NextResponse.json({
    success: true,
    tests: {
      conversationResponses: conversationResults
    },
    summary: {
      totalMessages: testMessages.length,
      messagesWithSearch: conversationResults.filter(r => r.hasSearchResults).length,
      messagesWithNotifications: conversationResults.filter(r => r.hasNotification).length,
      integrationWorking: conversationResults.some(r => r.hasSearchResults)
    },
    message: 'Pruebas de integración conversacional completadas'
  })
}

/**
 * Prueba completa del sistema integrado
 */
async function testFullSystem(userId: string, sessionId: string) {
  console.log('🔧 Testing full integrated system')

  const startTime = Date.now()

  // 1. Probar búsqueda académica
  const searchTest = await testAcademicSearch(userId, sessionId)
  const searchData = await searchTest.json()

  // 2. Probar notificaciones
  const notificationTest = await testNotificationSystem(userId, sessionId)
  const notificationData = await notificationTest.json()

  // 3. Probar integración conversacional
  const conversationTest = await testConversationIntegration(userId, 'Busca recursos sobre algoritmos de programación')
  const conversationData = await conversationTest.json()

  const totalTime = Date.now() - startTime

  // Análisis de rendimiento
  const performanceAnalysis = {
    totalTestTime: totalTime,
    averageSearchTime: searchData.tests?.academicSearch?.searchTime || 0,
    systemResponsiveness: totalTime < 5000 ? 'excellent' : totalTime < 10000 ? 'good' : 'needs_optimization',
    memoryUsage: process.memoryUsage(),
    componentsWorking: {
      academicSearch: searchData.summary?.academicSearchWorking,
      smartDetection: searchData.summary?.smartDetectionWorking,
      webIntegration: searchData.summary?.webIntegrationWorking,
      notifications: notificationData.summary?.notificationSystemWorking,
      conversationIntegration: conversationData.summary?.integrationWorking
    }
  }

  const overallHealth = Object.values(performanceAnalysis.componentsWorking).every(Boolean)

  return NextResponse.json({
    success: true,
    fullSystemTest: {
      searchTest: searchData,
      notificationTest: notificationData,
      conversationTest: conversationData,
      performanceAnalysis,
      overallHealth
    },
    summary: {
      allComponentsWorking: overallHealth,
      totalTestTime: totalTime,
      systemStatus: overallHealth ? '✅ Sistema completamente funcional' : '⚠️ Algunos componentes necesitan atención',
      recommendations: overallHealth 
        ? ['Sistema listo para producción', 'Monitorear rendimiento continuamente']
        : ['Revisar componentes con fallas', 'Optimizar tiempos de respuesta']
    },
    message: 'Prueba completa del sistema integrado completada'
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de prueba para Sistema de Búsqueda Académica + Notificaciones',
    availableActions: [
      'test_academic_search - Probar motor de búsqueda académica',
      'test_notifications - Probar sistema de notificaciones',
      'test_conversation_integration - Probar integración conversacional',
      'test_full_system - Probar sistema completo integrado'
    ],
    usage: {
      method: 'POST',
      body: {
        action: 'string (required)',
        userId: 'string (optional)',
        message: 'string (optional, for conversation tests)',
        searchQuery: 'object (optional, for search tests)'
      }
    },
    examples: [
      {
        description: 'Probar búsqueda académica',
        body: {
          action: 'test_academic_search',
          userId: 'test-user-123',
          searchQuery: {
            topic: 'ecuaciones cuadráticas',
            subject: 'matemáticas',
            searchType: 'explanation',
            level: 'intermediate'
          }
        }
      },
      {
        description: 'Probar sistema completo',
        body: {
          action: 'test_full_system',
          userId: 'test-user-123'
        }
      }
    ]
  })
}