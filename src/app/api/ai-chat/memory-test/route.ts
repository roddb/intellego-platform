// Endpoint para probar el sistema de memoria conversacional de Sara
import { NextRequest, NextResponse } from 'next/server'
import { ConversationMemoryManager } from '@/lib/conversation-memory'
import { SaraPersonalityEngine } from '@/lib/sara-personality'
import { EmotionAnalyzer, EmotionType } from '@/lib/emotion-analyzer'
import { ResponseBank } from '@/lib/response-bank'
import { ConversationMode } from '@/lib/advanced-intent-engine'
import { ModeTransitionManager } from '@/lib/mode-transition-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, sessionId, message } = body

    switch (action) {
      case 'save_turn':
        // Guardar un intercambio conversacional de prueba
        const turn = ConversationMemoryManager.saveConversationTurn(
          userId || 'test-user',
          message || 'Hola Sara, necesito ayuda con química',
          'Hola! Soy Sara, tu asistente académico. Me alegra que me contactes para ayudarte con química. ¿En qué tema específico necesitas apoyo?',
          'chatting',
          'greeting',
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          turn,
          message: 'Intercambio conversacional guardado exitosamente'
        })

      case 'get_memory':
        // Obtener memoria completa
        const memory = ConversationMemoryManager.getMemory(
          userId || 'test-user', 
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          memory,
          message: 'Memoria conversacional obtenida exitosamente'
        })

      case 'get_summary':
        // Obtener resumen contextual
        const summary = ConversationMemoryManager.generateContextualSummary(
          userId || 'test-user',
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          summary,
          message: 'Resumen contextual generado exitosamente'
        })

      case 'get_suggestions':
        // Obtener sugerencias personalizadas
        const suggestions = ConversationMemoryManager.getPersonalizedSuggestions(
          userId || 'test-user',
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          suggestions,
          message: 'Sugerencias personalizadas obtenidas exitosamente'
        })

      case 'needs_followup':
        // Verificar si necesita seguimiento
        const needsFollowUp = ConversationMemoryManager.needsFollowUp(
          userId || 'test-user',
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          needsFollowUp,
          message: needsFollowUp ? 'El usuario necesita seguimiento' : 'No se requiere seguimiento'
        })

      case 'personalized_greeting':
        // Generar saludo personalizado
        const greeting = SaraPersonalityEngine.generatePersonalizedGreeting(
          userId || 'test-user',
          'Estudiante de Prueba',
          sessionId || 'test-session'
        )
        
        return NextResponse.json({
          success: true,
          greeting,
          message: 'Saludo personalizado generado exitosamente'
        })

      case 'test_conversation':
        // Simular una conversación completa con emociones complejas
        const testMessages = [
          { user: 'Hola Sara, necesito ayuda con química urgente porque tengo examen mañana', sara: 'Hola! Entiendo tu urgencia. Vamos a prepararte de manera eficiente para tu examen de química.' },
          { user: 'No puedo más, es súper difícil y me siento completamente abrumado', sara: 'Te comprendo perfectamente. Dividamos el material en partes pequeñas y manejables.' },
          { user: 'Gracias, lo logré entender! Estoy muy emocionado', sara: '¡Excelente! Me alegra ver tu progreso. Tu esfuerzo está dando frutos.' },
          { user: 'Sara, muchas gracias por toda tu ayuda, eres increíble', sara: 'Me alegra mucho haberte ayudado. Siempre estaré aquí para apoyarte en tu aprendizaje.' }
        ]

        const turns = []
        testMessages.forEach((msg, index) => {
          const turn = ConversationMemoryManager.saveConversationTurn(
            userId || 'test-user',
            msg.user,
            msg.sara,
            'tutoring',
            index === 0 ? 'greeting' : 'academic_help',
            sessionId || 'test-session'
          )
          turns.push(turn)
        })

        const finalMemory = ConversationMemoryManager.getMemory(
          userId || 'test-user',
          sessionId || 'test-session'
        )

        return NextResponse.json({
          success: true,
          turns,
          finalMemory,
          message: 'Conversación de prueba simulada exitosamente'
        })

      case 'test_emotions':
        // Probar análisis de emociones avanzado
        const emotionTestMessages = [
          'Estoy súper frustrado con matemáticas, no puedo más',
          'Me siento completamente abrumado con tantas tareas',
          'Qué emocionado estoy por este nuevo proyecto!',
          'Gracias Sara, realmente me ayudas mucho',
          'No entiendo nada de física, estoy confundido',
          'Logré terminar el examen! Estoy muy orgulloso',
          'Tengo miedo de fallar en el examen de mañana',
          'Me da mucha ansiedad hablar en público'
        ]

        const emotionAnalyses = emotionTestMessages.map(msg => ({
          message: msg,
          analysis: EmotionAnalyzer.analyzeEmotions(msg),
          summary: EmotionAnalyzer.generateEmotionSummary(EmotionAnalyzer.analyzeEmotions(msg))
        }))

        return NextResponse.json({
          success: true,
          emotionAnalyses,
          message: 'Análisis de emociones completado exitosamente'
        })

      case 'test_responses':
        // Probar el banco de respuestas personalizadas
        const responseTestCases = [
          {
            message: 'Estoy súper frustrado con matemáticas, necesito ayuda urgente',
            emotion: EmotionType.FRUSTRATED,
            mode: ConversationMode.TUTORING,
            context: { subject: 'matemáticas', urgency: 'high' as const, timeOfDay: 'evening' as const }
          },
          {
            message: 'Qué emocionado estoy por aprender programación!',
            emotion: EmotionType.EXCITED,
            mode: ConversationMode.CHATTING,
            context: { subject: 'programación', timeOfDay: 'morning' as const }
          },
          {
            message: 'Me siento completamente abrumado con todas estas tareas',
            emotion: EmotionType.OVERWHELMED,
            mode: ConversationMode.ORGANIZING,
            context: { urgency: 'high' as const, sessionLength: 'long' as const }
          },
          {
            message: 'Gracias Sara, realmente me ayudas mucho con química',
            emotion: EmotionType.GRATEFUL,
            mode: ConversationMode.TUTORING,
            context: { subject: 'química', timeOfDay: 'afternoon' as const }
          },
          {
            message: 'No entiendo nada de física, estoy muy confundido',
            emotion: EmotionType.CONFUSED,
            mode: ConversationMode.TUTORING,
            context: { subject: 'física', sessionLength: 'medium' as const }
          }
        ]

        const responseTests = responseTestCases.map(testCase => {
          const personalizedResponse = SaraPersonalityEngine.generatePersonalizedResponse(
            testCase.message,
            testCase.emotion,
            testCase.mode,
            testCase.context
          )

          return {
            input: {
              message: testCase.message,
              emotion: testCase.emotion,
              mode: testCase.mode,
              context: testCase.context
            },
            output: personalizedResponse
          }
        })

        return NextResponse.json({
          success: true,
          responseTests,
          stats: ResponseBank.getResponseStats(),
          message: 'Pruebas de respuestas personalizadas completadas exitosamente'
        })

      case 'test_conversation_flow':
        // Probar flujo de conversación con respuestas personalizadas
        const flowTestUserId = 'flow-test-user'
        const flowTestSessionId = 'flow-test-session'
        
        const conversationFlow = [
          {
            userMsg: 'Hola Sara, tengo examen de química mañana y estoy muy nervioso',
            emotion: EmotionType.ANXIOUS,
            mode: ConversationMode.TUTORING
          },
          {
            userMsg: 'No puedo más, esto es súper difícil y me siento frustrado',
            emotion: EmotionType.FRUSTRATED,
            mode: ConversationMode.TUTORING
          },
          {
            userMsg: 'Gracias por explicármelo, ahora lo entiendo mejor!',
            emotion: EmotionType.RELIEVED,
            mode: ConversationMode.TUTORING
          },
          {
            userMsg: 'Logré terminar todos los ejercicios! Estoy muy orgulloso',
            emotion: EmotionType.PROUD,
            mode: ConversationMode.TUTORING
          }
        ]

        const flowResults = []
        conversationFlow.forEach((step, index) => {
          // Generar respuesta personalizada
          const personalizedResponse = SaraPersonalityEngine.generatePersonalizedResponse(
            step.userMsg,
            step.emotion,
            step.mode,
            {
              subject: 'química',
              urgency: index === 0 ? 'high' : 'medium',
              timeOfDay: 'evening',
              userId: flowTestUserId,
              sessionId: flowTestSessionId
            }
          )

          // Simular guardado en memoria
          ConversationMemoryManager.saveConversationTurn(
            flowTestUserId,
            step.userMsg,
            personalizedResponse.response,
            step.mode.toString(),
            'academic_help',
            flowTestSessionId
          )

          flowResults.push({
            step: index + 1,
            userMessage: step.userMsg,
            detectedEmotion: step.emotion,
            saraResponse: personalizedResponse.response,
            tone: personalizedResponse.tone,
            emoji: personalizedResponse.emoji,
            suggestedActions: personalizedResponse.suggestedActions,
            followUpQuestions: personalizedResponse.followUpQuestions
          })
        })

        const finalFlowMemory = ConversationMemoryManager.getMemory(flowTestUserId, flowTestSessionId)

        return NextResponse.json({
          success: true,
          conversationFlow: flowResults,
          finalMemory: finalFlowMemory.emotionalProfile,
          message: 'Flujo de conversación con respuestas personalizadas completado exitosamente'
        })

      case 'test_mode_transitions':
        // Probar sistema de transiciones entre modos
        const transitionTestCases = [
          {
            message: 'No entiendo nada de matemáticas, podrías explicarme?',
            currentMode: ConversationMode.CHATTING,
            emotion: EmotionType.CONFUSED,
            context: { subject: 'matemáticas', timeInCurrentMode: 10 }
          },
          {
            message: 'Necesito organizar mi tiempo de estudio mejor',
            currentMode: ConversationMode.TUTORING,
            emotion: EmotionType.OVERWHELMED,
            context: { timeInCurrentMode: 20, urgency: 'medium' as const }
          },
          {
            message: 'Cómo voy en mi progreso académico?',
            currentMode: ConversationMode.PLANNING,
            emotion: EmotionType.CURIOUS,
            context: { timeInCurrentMode: 15 }
          },
          {
            message: 'Estoy súper motivado para estudiar química!',
            currentMode: ConversationMode.REVIEWING,
            emotion: EmotionType.MOTIVATED,
            context: { subject: 'química', timeInCurrentMode: 25 }
          },
          {
            message: 'Me siento muy frustrado con esta materia',
            currentMode: ConversationMode.ORGANIZING,
            emotion: EmotionType.FRUSTRATED,
            context: { timeInCurrentMode: 35, previousModes: [ConversationMode.TUTORING] }
          }
        ]

        const transitionTests = transitionTestCases.map(testCase => {
          const transitionSuggestion = SaraPersonalityEngine.suggestModeTransition(
            testCase.message,
            testCase.currentMode,
            testCase.emotion,
            testCase.context
          )

          return {
            input: testCase,
            transitionSuggestion,
            modeChanged: transitionSuggestion.shouldTransition
          }
        })

        return NextResponse.json({
          success: true,
          transitionTests,
          stats: ModeTransitionManager.getTransitionStats(),
          message: 'Pruebas de transiciones de modo completadas exitosamente'
        })

      case 'test_smart_conversation':
        // Probar conversación inteligente con transiciones automáticas
        const smartTestUserId = 'smart-conversation-user'
        const smartTestSessionId = 'smart-session-001'
        
        const intelligentFlow = [
          {
            userMsg: 'Hola Sara! Cómo estás?',
            currentMode: ConversationMode.CHATTING,
            timeInMode: 0
          },
          {
            userMsg: 'Necesito ayuda urgente con química, no entiendo las reacciones',
            currentMode: ConversationMode.CHATTING,
            timeInMode: 5
          },
          {
            userMsg: 'Gracias por la explicación! Ahora necesito organizar mi horario de estudio',
            currentMode: ConversationMode.TUTORING,
            timeInMode: 20
          },
          {
            userMsg: 'Perfecto! Cómo puedo evaluar si estoy progresando bien?',
            currentMode: ConversationMode.PLANNING,
            timeInMode: 15
          },
          {
            userMsg: 'Me siento muy orgulloso de mi progreso, muchas gracias!',
            currentMode: ConversationMode.REVIEWING,
            timeInMode: 10
          }
        ]

        const smartResults = []
        let previousModes: ConversationMode[] = []

        intelligentFlow.forEach((step, index) => {
          // Analizar emoción del mensaje
          const emotionAnalysis = EmotionAnalyzer.analyzeEmotions(step.userMsg)
          
          // Generar respuesta con transiciones automáticas
          const smartResponse = SaraPersonalityEngine.generateResponseWithModeTransition(
            step.userMsg,
            step.currentMode,
            emotionAnalysis.primary,
            {
              subject: step.userMsg.includes('química') ? 'química' : undefined,
              urgency: step.userMsg.includes('urgente') ? 'high' : 'medium',
              timeInCurrentMode: step.timeInMode,
              previousModes: [...previousModes],
              userId: smartTestUserId,
              sessionId: smartTestSessionId
            }
          )

          // Actualizar historial de modos
          previousModes.push(step.currentMode)
          if (previousModes.length > 3) {
            previousModes = previousModes.slice(-3)
          }

          // Simular guardado en memoria
          ConversationMemoryManager.saveConversationTurn(
            smartTestUserId,
            step.userMsg,
            smartResponse.response,
            smartResponse.finalMode.toString(),
            'smart_conversation',
            smartTestSessionId
          )

          smartResults.push({
            step: index + 1,
            userMessage: step.userMsg,
            initialMode: step.currentMode,
            finalMode: smartResponse.finalMode,
            transitionOccurred: smartResponse.transitionOccurred,
            transitionMessage: smartResponse.transitionMessage,
            detectedEmotion: emotionAnalysis.primary,
            saraResponse: smartResponse.response,
            suggestedActions: smartResponse.suggestedActions,
            followUpQuestions: smartResponse.followUpQuestions,
            timeInPreviousMode: step.timeInMode
          })
        })

        const finalSmartMemory = ConversationMemoryManager.getMemory(smartTestUserId, smartTestSessionId)

        return NextResponse.json({
          success: true,
          smartConversation: smartResults,
          finalMemory: finalSmartMemory.emotionalProfile,
          transitionSummary: {
            totalTransitions: smartResults.filter(r => r.transitionOccurred).length,
            modeSequence: smartResults.map(r => ({ initial: r.initialMode, final: r.finalMode }))
          },
          message: 'Conversación inteligente con transiciones automáticas completada exitosamente'
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Acción no reconocida. Acciones disponibles: save_turn, get_memory, get_summary, get_suggestions, needs_followup, personalized_greeting, test_conversation, test_emotions, test_responses, test_conversation_flow, test_mode_transitions, test_smart_conversation'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in memory test endpoint:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al procesar la solicitud de memoria'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de prueba para el sistema de memoria conversacional de Sara',
    availableActions: [
      'save_turn - Guardar un intercambio conversacional',
      'get_memory - Obtener memoria completa del usuario',
      'get_summary - Generar resumen contextual',
      'get_suggestions - Obtener sugerencias personalizadas', 
      'needs_followup - Verificar si necesita seguimiento',
      'personalized_greeting - Generar saludo personalizado',
      'test_conversation - Simular conversación completa',
      'test_emotions - Probar análisis avanzado de emociones',
      'test_responses - Probar banco de respuestas personalizadas',
      'test_conversation_flow - Probar flujo completo con respuestas personalizadas',
      'test_mode_transitions - Probar sistema de transiciones entre modos',
      'test_smart_conversation - Probar conversación inteligente con transiciones automáticas'
    ],
    usage: 'POST con { "action": "accion_deseada", "userId": "opcional", "sessionId": "opcional", "message": "opcional" }'
  })
}