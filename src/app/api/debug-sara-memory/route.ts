// Debugging endpoint for Sara's memory and conversation system
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { action, userId, message, sessionId, testType } = await req.json()
    
    const results: any = {
      timestamp: new Date(),
      action,
      userId: userId || 'debug-test-user',
      sessionId: sessionId || 'debug-session-001',
      results: {}
    }

    console.log(`🧪 Debug Sara Memory - Action: ${action}`)

    switch (action) {
      case 'test_persistent_memory':
        results.results = await testPersistentMemory(results.userId, results.sessionId)
        break

      case 'test_calendar_execution':
        results.results = await testCalendarExecution(results.userId, message)
        break

      case 'test_conversation_coherence':
        results.results = await testConversationCoherence(results.userId, results.sessionId)
        break

      case 'full_integration_test':
        results.results = await fullIntegrationTest(results.userId)
        break

      case 'memory_inspection':
        results.results = await inspectMemoryState(results.userId, results.sessionId)
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available: test_persistent_memory, test_calendar_execution, test_conversation_coherence, full_integration_test, memory_inspection'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Debug action '${action}' completed successfully`
    })

  } catch (error) {
    console.error('❌ Debug Sara Memory error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Debug test failed'
    }, { status: 500 })
  }
}

/**
 * Test 1: Persistent Memory System
 */
async function testPersistentMemory(userId: string, sessionId: string) {
  console.log('🧠 Testing persistent memory system...')
  
  const { 
    getConversationSession, 
    createConversationSession, 
    addConversationTurn,
    addPendingTask,
    getPendingTasks
  } = require('@/lib/temp-storage')

  const { ContextualConversationManager } = require('@/lib/contextual-conversation-manager')

  // Step 1: Send first message
  const message1 = "Hola Sara, explícame qué son las ecuaciones cuadráticas en matemáticas"
  const response1 = await ContextualConversationManager.processContextualMessage(
    userId, message1, sessionId, "Estudiante Prueba"
  )

  // Step 2: Check if conversation was stored
  let session = getConversationSession(userId, sessionId)
  const turnsAfterFirst = session ? session.turns.length : 0

  // Step 3: Send follow-up message to test memory
  const message2 = "Continúa explicando con ejemplos prácticos"
  const response2 = await ContextualConversationManager.processContextualMessage(
    userId, message2, sessionId, "Estudiante Prueba"
  )

  // Step 4: Check memory persistence
  session = getConversationSession(userId, sessionId)
  const turnsAfterSecond = session ? session.turns.length : 0

  // Step 5: Add a calendar task and test persistence
  addPendingTask(userId, sessionId, 'calendar_event', 'Examen de matemáticas para el viernes', {
    title: 'Examen de matemáticas',
    date: '2025-07-25',
    startTime: '10:00'
  })

  const pendingTasks = getPendingTasks(userId, sessionId)

  return {
    memoryPersistence: {
      firstResponse: !!response1.content,
      secondResponse: !!response2.content,
      continuityScore: response2.continuityScore,
      turnsAfterFirst,
      turnsAfterSecond,
      memoryWorking: turnsAfterSecond > turnsAfterFirst,
      contextMaintained: response2.content.toLowerCase().includes('ecuaciones') || 
                       response2.content.toLowerCase().includes('matemáticas')
    },
    taskManagement: {
      taskAdded: true,
      pendingTasksCount: pendingTasks.length,
      hasCalendarTask: pendingTasks.some(t => t.type === 'calendar_event'),
      taskDetails: pendingTasks.length > 0 ? pendingTasks[0] : null
    },
    conversationData: {
      sessionExists: !!session,
      currentTopic: session?.currentTopic,
      currentSubject: session?.currentSubject,
      lastUpdate: session?.lastUpdate
    }
  }
}

/**
 * Test 2: Calendar Task Execution
 */
async function testCalendarExecution(userId: string, testMessage?: string) {
  console.log('📅 Testing calendar task execution...')
  
  const { ContextualConversationManager } = require('@/lib/contextual-conversation-manager')
  
  // Test message that should trigger calendar creation
  const calendarMessage = testMessage || "Agrega un examen de química sobre reacciones químicas para el 25 de julio a las 9 AM en aula 104"
  
  console.log(`Sending calendar test message: "${calendarMessage}"`)
  
  const response = await ContextualConversationManager.processContextualMessage(
    userId, calendarMessage, 'calendar-test-session', "Estudiante Prueba"
  )

  // Check if calendar task was handled
  const wasCalendarTaskHandled = response.personalizations.includes('calendar_task_executed') ||
                                response.personalizations.includes('task_aware')
  
  // Check response content for calendar confirmation
  const hasCalendarConfirmation = response.content.toLowerCase().includes('calendario') ||
                                 response.content.toLowerCase().includes('evento') ||
                                 response.content.toLowerCase().includes('creado') ||
                                 response.content.toLowerCase().includes('agregado')

  return {
    taskExecution: {
      messageProcessed: !!response.content,
      calendarTaskDetected: wasCalendarTaskHandled,
      hasCalendarConfirmation,
      responseLength: response.content.length,
      personalizations: response.personalizations,
      suggestedActions: response.suggestedFollowups
    },
    responseAnalysis: {
      containsCalendarKeywords: hasCalendarConfirmation,
      containsSuccessIndicators: response.content.toLowerCase().includes('✅') ||
                                response.content.toLowerCase().includes('perfecto') ||
                                response.content.toLowerCase().includes('creado'),
      mentionsSpecificDetails: response.content.toLowerCase().includes('química') &&
                              response.content.toLowerCase().includes('25') &&
                              response.content.toLowerCase().includes('9')
    },
    fullResponse: response.content.substring(0, 300) + (response.content.length > 300 ? '...' : '')
  }
}

/**
 * Test 3: Conversation Coherence Over Multiple Messages
 */
async function testConversationCoherence(userId: string, sessionId: string) {
  console.log('💬 Testing conversation coherence...')
  
  const { ContextualConversationManager } = require('@/lib/contextual-conversation-manager')
  
  // Simulate a 3-message conversation like the user's example
  const messages = [
    "Sara, necesito ayuda con física, específicamente con cinemática",
    "Explícame qué es el movimiento rectilíneo uniforme",
    "¿Puedes darme ejemplos de la vida real?"
  ]

  const responses = []
  let coherenceScores = []
  let contextMaintained = true

  for (let i = 0; i < messages.length; i++) {
    console.log(`Sending message ${i + 1}: "${messages[i]}"`)
    
    const response = await ContextualConversationManager.processContextualMessage(
      userId, messages[i], sessionId, "Estudiante Prueba"
    )
    
    responses.push({
      messageIndex: i + 1,
      response: response.content.substring(0, 200) + '...',
      continuityScore: response.continuityScore,
      personalizations: response.personalizations,
      contextSubject: response.context.currentSubject,
      contextTopic: response.context.currentTopic
    })
    
    coherenceScores.push(response.continuityScore)
    
    // Check if context is maintained
    if (i > 0) {
      const maintainsPhysics = response.content.toLowerCase().includes('física') ||
                              response.content.toLowerCase().includes('cinemática') ||
                              response.context.currentSubject === 'física'
      if (!maintainsPhysics) {
        contextMaintained = false
      }
    }
    
    // Small delay to simulate real conversation timing
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const averageContinuityScore = coherenceScores.reduce((a, b) => a + b, 0) / coherenceScores.length

  return {
    conversationFlow: {
      messagesProcessed: responses.length,
      averageContinuityScore,
      contextMaintained,
      allResponsesGenerated: responses.every(r => r.response.length > 0),
      subjectConsistency: responses.every(r => r.contextSubject === 'física' || 
                                         r.contextSubject === responses[0].contextSubject)
    },
    detailedResponses: responses,
    coherenceAnalysis: {
      firstMessageCoherent: coherenceScores[0] >= 0.5,
      secondMessageCoherent: coherenceScores[1] >= 0.6,
      thirdMessageCoherent: coherenceScores[2] >= 0.7,
      improvingCoherence: coherenceScores[2] > coherenceScores[0]
    }
  }
}

/**
 * Test 4: Full Integration Test
 */
async function fullIntegrationTest(userId: string) {
  console.log('🎯 Running full integration test...')
  
  // Test all systems together
  const memoryTest = await testPersistentMemory(userId, 'integration-session')
  const calendarTest = await testCalendarExecution(userId, "Agrega una sesión de estudio de matemáticas para mañana a las 3 PM")
  const coherenceTest = await testConversationCoherence(userId, 'coherence-session')

  const overallScore = (
    (memoryTest.memoryPersistence.memoryWorking ? 25 : 0) +
    (memoryTest.taskManagement.hasCalendarTask ? 15 : 0) +
    (calendarTest.taskExecution.calendarTaskDetected ? 25 : 0) +
    (calendarTest.responseAnalysis.hasCalendarConfirmation ? 15 : 0) +
    (coherenceTest.conversationFlow.contextMaintained ? 20 : 0)
  )

  return {
    overallScore: `${overallScore}/100`,
    status: overallScore >= 85 ? 'EXCELLENT' : 
            overallScore >= 70 ? 'GOOD' : 
            overallScore >= 50 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT',
    componentTests: {
      memorySystem: memoryTest.memoryPersistence.memoryWorking,
      taskManagement: memoryTest.taskManagement.hasCalendarTask,
      calendarExecution: calendarTest.taskExecution.calendarTaskDetected,
      calendarConfirmation: calendarTest.responseAnalysis.hasCalendarConfirmation,
      conversationCoherence: coherenceTest.conversationFlow.contextMaintained
    },
    recommendations: overallScore < 85 ? [
      overallScore < 50 ? 'Critical: Review persistent storage implementation' : null,
      !calendarTest.taskExecution.calendarTaskDetected ? 'Fix calendar task detection' : null,
      !coherenceTest.conversationFlow.contextMaintained ? 'Improve context management' : null,
      !memoryTest.memoryPersistence.memoryWorking ? 'Debug conversation storage' : null
    ].filter(Boolean) : ['System working optimally']
  }
}

/**
 * Test 5: Memory State Inspection
 */
async function inspectMemoryState(userId: string, sessionId: string) {
  console.log('🔍 Inspecting memory state...')
  
  const { 
    getConversationSession,
    getUserActiveSessions,
    tempConversations,
    getPendingTasks
  } = require('@/lib/temp-storage')

  const session = getConversationSession(userId, sessionId)
  const activeSessions = getUserActiveSessions(userId)
  const pendingTasks = getPendingTasks(userId, sessionId)

  return {
    sessionInspection: {
      sessionExists: !!session,
      turnsCount: session?.turns?.length || 0,
      currentTopic: session?.currentTopic,
      currentSubject: session?.currentSubject,
      lastUpdate: session?.lastUpdate,
      pendingTasksCount: session?.pendingTasks?.length || 0
    },
    userSessions: {
      activeSessionsCount: activeSessions.length,
      sessionIds: activeSessions.map(s => s.sessionId),
      totalTurnsAcrossSessions: activeSessions.reduce((sum, s) => sum + s.turns.length, 0)
    },
    globalState: {
      totalConversations: tempConversations.length,
      uniqueUsers: [...new Set(tempConversations.map(c => c.userId))].length
    },
    pendingTasks: {
      count: pendingTasks.length,
      types: [...new Set(pendingTasks.map(t => t.type))],
      details: pendingTasks.map(t => ({
        id: t.id,
        type: t.type,
        description: t.description,
        completed: t.completed
      }))
    }
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Sara Memory Debug Endpoint',
    availableActions: [
      'test_persistent_memory',
      'test_calendar_execution', 
      'test_conversation_coherence',
      'full_integration_test',
      'memory_inspection'
    ],
    instructions: 'Send a POST request with action, userId (optional), sessionId (optional), and message (for calendar tests)'
  })
}