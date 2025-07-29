// API Endpoint para Búsqueda Académica Integrada con WebSearch
import { NextRequest, NextResponse } from 'next/server'
import { AcademicSearchEngine, AcademicSearchQuery } from '@/lib/academic-search-engine'
import { WebSearchIntegration } from '@/lib/web-search-integration'
import { NotificationService, NotificationTrigger } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topic, 
      subject, 
      searchType, 
      level, 
      language, 
      userId, 
      sessionId,
      generateNotification 
    } = body

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'topic es requerido'
      }, { status: 400 })
    }

    // Crear query académico
    const searchQuery: AcademicSearchQuery = {
      topic,
      subject,
      searchType: searchType || 'explanation',
      level: level || 'basic',
      language: language || 'es',
      userId,
      sessionId
    }

    // Realizar búsqueda académica con integración web
    const searchResults = await WebSearchIntegration.performAcademicWebSearch(searchQuery)

    // Generar notificación proactiva si se solicita
    let notification = null
    if (generateNotification && userId) {
      notification = await NotificationService.createAcademicNotification(
        userId,
        searchQuery,
        NotificationTrigger.KNOWLEDGE_GAP,
        '🔍 Búsqueda Académica Completada',
        `He encontrado recursos valiosos sobre ${topic} que pueden ayudarte.`
      )
    }

    return NextResponse.json({
      success: true,
      searchResults,
      notification,
      query: searchQuery,
      message: 'Búsqueda académica completada exitosamente'
    })

  } catch (error) {
    console.error('Error in academic search:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al realizar búsqueda académica'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'smart_search':
      return await handleSmartSearch(request)
    
    case 'stats':
      return await handleSearchStats(request)
    
    default:
      return NextResponse.json({
        success: false,
        error: 'Acción no reconocida',
        availableActions: ['smart_search', 'stats']
      }, { status: 400 })
  }
}

/**
 * Maneja búsqueda inteligente basada en contexto conversacional
 */
async function handleSmartSearch(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const message = searchParams.get('message')
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'message es requerido para búsqueda inteligente'
      }, { status: 400 })
    }

    // Realizar búsqueda inteligente
    const smartSearchResult = await AcademicSearchEngine.smartSearch(message, userId || undefined, sessionId || undefined)

    if (!smartSearchResult) {
      return NextResponse.json({
        success: true,
        searchResults: null,
        message: 'No se detectó una consulta de búsqueda en el mensaje'
      })
    }

    // Generar notificación automática para búsquedas inteligentes
    let notification = null
    if (userId) {
      notification = await NotificationService.createAcademicNotification(
        userId,
        smartSearchResult.query,
        NotificationTrigger.LEARNING_OPPORTUNITY,
        '🧠 Búsqueda Inteligente',
        `Sara detectó tu necesidad de información sobre ${smartSearchResult.query.topic} y encontró recursos útiles.`
      )
    }

    return NextResponse.json({
      success: true,
      searchResults: smartSearchResult,
      notification,
      detectedQuery: smartSearchResult.query,
      message: 'Búsqueda inteligente completada exitosamente'
    })

  } catch (error) {
    console.error('Error in smart search:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al realizar búsqueda inteligente'
    }, { status: 500 })
  }
}

/**
 * Maneja estadísticas del sistema de búsqueda
 */
async function handleSearchStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Obtener estadísticas de notificaciones relacionadas con búsquedas
    const notificationStats = NotificationService.getNotificationStats(userId || undefined)

    const searchStats = {
      notificationStats,
      webSearchIntegration: {
        enabled: true,
        fallbackMode: false // En producción, esto dependería de la disponibilidad del WebSearch tool
      },
      academicSearchEngine: {
        totalSearchTypes: 5, // explanation, examples, exercises, resources, research
        supportedLanguages: ['es', 'en'],
        supportedLevels: ['basic', 'intermediate', 'advanced']
      },
      systemStatus: {
        webSearchEnabled: true,
        notificationsEnabled: notificationStats.novuEnabled || true,
        academicAnalysisEnabled: true
      }
    }

    return NextResponse.json({
      success: true,
      stats: searchStats,
      timestamp: new Date().toISOString(),
      message: 'Estadísticas del sistema de búsqueda obtenidas exitosamente'
    })

  } catch (error) {
    console.error('Error getting search stats:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al obtener estadísticas de búsqueda'
    }, { status: 500 })
  }
}