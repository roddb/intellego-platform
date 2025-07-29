// API Endpoint para Mensajes Avanzados con Sara
// Integra todos los sistemas avanzados para procesamiento inteligente

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdvancedCommandProcessor } from '@/lib/advanced-command-processor'
import { AdvancedIntentEngine, ConversationMode } from '@/lib/advanced-intent-engine'
import { SaraPersonalityEngine } from '@/lib/sara-personality'
import { aiService } from '@/lib/ai-providers'
import { ConversationMemoryManager } from '@/lib/conversation-memory'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      message, 
      userId, 
      userName, 
      sessionId,
      currentMode, 
      conversationHistory = [] 
    } = body

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Mensaje y userId son requeridos' },
        { status: 400 }
      )
    }

    // Use provided sessionId or generate a stable one
    const actualSessionId = sessionId || `session_${userId}_${Date.now().toString(36)}`
    console.log('🎯 Processing message with stable sessionId:', actualSessionId)

    // Procesar comando con el sistema avanzado
    const commandContext = {
      userId,
      userName,
      conversationHistory,
      currentMode: currentMode || ConversationMode.CHATTING,
      lastCommands: []
    }

    const commandResult = await AdvancedCommandProcessor.processCommand(
      message,
      commandContext
    )

    // 🎯 PRIORIDAD: Usar mi sistema de conversación contextual mejorado
    console.log('🤖 [ENHANCED-ENDPOINT] Using enhanced contextual conversation manager')
    console.log('📊 [ENHANCED-ENDPOINT] Request details:', {
      userId: userId?.substring(0, 10) + '...',
      sessionId: actualSessionId?.substring(0, 15) + '...',
      messageLength: message.length,
      historyLength: conversationHistory.length,
      currentMode
    })
    
    try {
      const { ContextualConversationManager } = require('@/lib/contextual-conversation-manager')
      console.log('⏳ [ENHANCED-ENDPOINT] Processing contextual message...')
      
      const contextualResponse = await ContextualConversationManager.processContextualMessage(
        userId, 
        message, 
        actualSessionId, 
        userName
      )
      
      console.log('✅ [ENHANCED-ENDPOINT] Contextual response generated:', {
        contentLength: contextualResponse.content.length,
        personalizations: contextualResponse.personalizations,
        continuityScore: contextualResponse.continuityScore,
        hasVisualRecommendation: !!contextualResponse.visualRecommendation,
        calendarTaskExecuted: contextualResponse.personalizations?.includes('calendar_task_executed'),
        suggestedFollowupsCount: contextualResponse.suggestedFollowups?.length
      })
      
      return NextResponse.json({
        response: contextualResponse.content,
        detectedIntent: contextualResponse.personalizations.includes('calendar_task_executed') ? 'calendar_management' : 'contextual_conversation',
        suggestedActions: contextualResponse.suggestedFollowups,
        followUpQuestions: [],
        visualizations: contextualResponse.visualRecommendation ? [{ 
          type: contextualResponse.visualRecommendation.type, 
          data: contextualResponse.visualRecommendation.reason 
        }] : [],
        priority: contextualResponse.personalizations.includes('calendar_task_executed') ? 'high' : 'medium',
        resources: [],
        continuityScore: contextualResponse.continuityScore,
        personalizations: contextualResponse.personalizations
      })
    } catch (contextualError) {
      console.error('⚠️ Contextual conversation manager failed, using command processor fallback:', contextualError)
      
      // Fallback to original command processing
      if (commandResult.success && commandResult.type !== 'error') {
        const saraResponse = await SaraPersonalityEngine.generateContextualResponse(
          message,
          commandResult,
          userId,
          currentMode,
          actualSessionId
        )

        const suggestedMode = currentMode // Temporal: mantener el modo actual

        return NextResponse.json({
          response: saraResponse || commandResult.message,
          detectedIntent: commandResult.type,
          suggestedMode: suggestedMode !== currentMode ? suggestedMode : undefined,
          suggestedActions: commandResult.suggestedActions || [],
          followUpQuestions: commandResult.followUpQuestions || [],
          visualizations: commandResult.visualizations || [],
          priority: commandResult.data?.priority || 'medium',
          resources: commandResult.data?.resources || [],
          commandResult: commandResult
        })
      }
    }

    // Fallback: usar AI providers para respuesta general con memoria
    const fallbackResponse = await generateFallbackResponse(
      message,
      conversationHistory,
      currentMode,
      userName,
      userId,
      actualSessionId
    )

    return NextResponse.json({
      response: fallbackResponse.content,
      detectedIntent: 'general_conversation',
      suggestedActions: generateModeSuggestions(currentMode),
      followUpQuestions: generateFollowUpQuestions(currentMode),
      priority: 'low'
    })

  } catch (error) {
    console.error('Error in enhanced-message endpoint:', error)
    
    return NextResponse.json({
      response: 'Lo siento, hubo un problema procesando tu mensaje. ¿Podrías intentar reformularlo?',
      detectedIntent: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

async function generateFallbackResponse(
  message: string,
  conversationHistory: any[],
  currentMode: ConversationMode,
  userName?: string,
  userId?: string,
  sessionId?: string
): Promise<{ content: string }> {
  
  // Construir prompt contextual basado en el modo y memoria
  const modeContext = getModeContext(currentMode)
  
  // Integrar memoria conversacional si está disponible
  let memoryContext = ""
  if (userId) {
    const contextualSummary = ConversationMemoryManager.generateContextualSummary(userId, sessionId)
    const personalizedSuggestions = ConversationMemoryManager.getPersonalizedSuggestions(userId, sessionId)
    
    memoryContext = `
CONTEXTO DE MEMORIA CONVERSACIONAL:
${contextualSummary}

SUGERENCIAS PERSONALIZADAS DISPONIBLES:
${personalizedSuggestions.length > 0 ? personalizedSuggestions.map(s => `• ${s}`).join('\n') : '• Esta es una nueva conversación'}
`
  }
  
  const prompt = `${modeContext}
${memoryContext}

Usuario: ${userName || 'Estudiante'}
Mensaje: ${message}

Responde como Sara, un asistente personal académico amigable y proactivo. 
Mantén el foco en el modo actual: ${currentMode}.
Usa la memoria conversacional para personalizar tu respuesta y dar continuidad.
Proporciona una respuesta útil y sugiere acciones específicas.`

  try {
    // Intentar con proveedores AI
    const response = await aiService.generateExercise(prompt)
    
    // Verificar si necesitamos usar template fallback
    if (response === 'TEMPLATE_FALLBACK') {
      const templateResponse = getTemplateResponse(currentMode, message)
      
      // Guardar respuesta template en memoria
      if (userId) {
        ConversationMemoryManager.saveConversationTurn(
          userId,
          message,
          templateResponse,
          currentMode.toString(),
          'template_fallback',
          sessionId
        )
      }
      
      return { content: templateResponse }
    }
    
    // Guardar en memoria conversacional si está disponible
    if (userId) {
      ConversationMemoryManager.saveConversationTurn(
        userId,
        message,
        response,
        currentMode.toString(),
        'ai_conversation',
        sessionId
      )
    }
    
    return { content: response }
  } catch (error) {
    console.error('Error with AI providers:', error)
    
    // Respuesta template por modo
    const templateResponse = getTemplateResponse(currentMode, message)
    
    // Guardar respuesta template en memoria también
    if (userId) {
      ConversationMemoryManager.saveConversationTurn(
        userId,
        message,
        templateResponse,
        currentMode.toString(),
        'template_fallback',
        sessionId
      )
    }
    
    return { content: templateResponse }
  }
}

function getModeContext(mode: ConversationMode): string {
  const contexts = {
    [ConversationMode.PLANNING]: 'Estás ayudando con planificación y organización de estudios. Enfócate en horarios, calendarios y planes de estudio.',
    [ConversationMode.TUTORING]: 'Estás en modo tutoría. Ayuda con conceptos académicos, ejercicios y explicaciones detalladas.',
    [ConversationMode.ORGANIZING]: 'Estás ayudando con organización de materiales y recursos de estudio.',
    [ConversationMode.REVIEWING]: 'Estás analizando progreso y rendimiento académico del estudiante.',
    [ConversationMode.CHATTING]: 'Estás en conversación casual, proporcionando apoyo motivacional y respuestas generales.'
  }
  
  return contexts[mode] || contexts[ConversationMode.CHATTING]
}

function getTemplateResponse(mode: ConversationMode, message: string): string {
  const templates = {
    [ConversationMode.PLANNING]: `Entiendo que necesitas ayuda con planificación. Como Sara, puedo ayudarte a:

• Organizar tu horario de estudio
• Crear planes personalizados
• Optimizar tu tiempo
• Programar sesiones efectivas

¿Qué aspecto específico de la planificación te gustaría abordar?`,

    [ConversationMode.TUTORING]: `Como tu tutor personal, estoy aquí para ayudarte con:

• Explicaciones de conceptos
• Resolución de ejercicios paso a paso
• Práctica dirigida
• Aclaración de dudas

¿En qué materia o tema específico necesitas ayuda?`,

    [ConversationMode.ORGANIZING]: `Te ayudo a organizar tus recursos de estudio:

• Gestión de materiales
• Organización de apuntes
• Búsqueda de recursos
• Estructuración de contenido

¿Qué necesitas organizar específicamente?`,

    [ConversationMode.REVIEWING]: `Analicemos tu progreso académico:

• Revisión de calificaciones
• Análisis de tendencias
• Identificación de áreas de mejora
• Recomendaciones personalizadas

¿Qué aspecto de tu rendimiento quieres revisar?`,

    [ConversationMode.CHATTING]: `¡Hola! Soy Sara, tu asistente académico personal. 

Estoy aquí para apoyarte en tu camino educativo. Puedo ayudarte con organización, planificación, tutoría y mucho más.

¿En qué puedo ayudarte hoy?`
  }

  return templates[mode] || templates[ConversationMode.CHATTING]
}

function generateModeSuggestions(mode: ConversationMode): string[] {
  const suggestions = {
    [ConversationMode.PLANNING]: [
      'Crear plan de estudio semanal',
      'Optimizar mi horario',
      'Programar sesiones de repaso',
      'Analizar tiempo disponible'
    ],
    [ConversationMode.TUTORING]: [
      'Explicar concepto de matemáticas',
      'Resolver ejercicio paso a paso',
      'Practicar problemas',
      'Aclarar dudas'
    ],
    [ConversationMode.ORGANIZING]: [
      'Organizar mis materiales',
      'Buscar recursos de estudio',
      'Estructurar mis apuntes',
      'Gestionar archivos'
    ],
    [ConversationMode.REVIEWING]: [
      'Analizar mi progreso',
      'Ver tendencias de calificaciones',
      'Revisar objetivos',
      'Identificar áreas de mejora'
    ],
    [ConversationMode.CHATTING]: [
      'Planificar mi semana',
      'Necesito motivación',
      'Ayuda con organización',
      'Analizar mi rendimiento'
    ]
  }

  return suggestions[mode] || suggestions[ConversationMode.CHATTING]
}

function generateFollowUpQuestions(mode: ConversationMode): string[] {
  const questions = {
    [ConversationMode.PLANNING]: [
      '¿Para qué período quieres planificar?',
      '¿Hay alguna materia que requiere atención especial?'
    ],
    [ConversationMode.TUTORING]: [
      '¿En qué materia tienes más dificultades?',
      '¿Prefieres explicaciones teóricas o ejercicios prácticos?'
    ],
    [ConversationMode.ORGANIZING]: [
      '¿Qué tipo de materiales necesitas organizar?',
      '¿Para qué materias buscas recursos adicionales?'
    ],
    [ConversationMode.REVIEWING]: [
      '¿Qué período quieres analizar?',
      '¿Hay alguna materia específica que te preocupa?'
    ],
    [ConversationMode.CHATTING]: [
      '¿Cómo te sientes con tus estudios actualmente?',
      '¿En qué área académica puedo apoyarte más?'
    ]
  }

  return questions[mode] || questions[ConversationMode.CHATTING]
}