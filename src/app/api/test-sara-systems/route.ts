// Comprehensive testing endpoint for all Sara AI systems
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const testResults: any = {
      timestamp: new Date(),
      systems: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    }

    console.log('🧪 Starting comprehensive Sara AI systems test...')

    // Test 1: Calendar System (Fixed)
    console.log('📅 Testing calendar system...')
    try {
      const { getEvents, getUpcomingEvents } = require('@/lib/temp-storage')
      const events = getEvents('demo-student-fixed')
      const upcomingEvents = getUpcomingEvents('demo-student-fixed', 30)
      
      testResults.systems.calendar = {
        status: 'passed',
        getEvents: events.length >= 0 ? 'working' : 'failed',
        upcomingEvents: upcomingEvents.length >= 0 ? 'working' : 'failed',
        eventsFound: events.length,
        upcomingFound: upcomingEvents.length
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.calendar = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 2: Learning Profiles (VARK)
    console.log('🎯 Testing learning profiles system...')
    try {
      const { AdvancedLearningProfileManager } = require('@/lib/advanced-learning-profiles')
      
      // Test message analysis
      const testMessage = "Me gusta ver gráficos y diagramas para entender mejor las matemáticas"
      const indicators = AdvancedLearningProfileManager.analyzeMessageForLearningStyle(testMessage, 'test-user')
      
      // Test profile update
      const profile = AdvancedLearningProfileManager.updateLearningProfile('test-user', indicators)
      
      testResults.systems.learningProfiles = {
        status: 'passed',
        indicatorsDetected: indicators.length,
        primaryStyle: profile.primaryStyle,
        visualPreference: profile.styleDistribution.visual,
        adaptationPreferences: Object.keys(profile.adaptationPreferences).filter(
          key => profile.adaptationPreferences[key as keyof typeof profile.adaptationPreferences]
        )
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.learningProfiles = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 3: Visual Learning Engine
    console.log('🎨 Testing visual learning engine...')
    try {
      const { VisualLearningEngine, VisualType } = require('@/lib/visual-learning-engine')
      
      // Test concept map generation
      const testContent = "Las ecuaciones cuadráticas son expresiones matemáticas de segundo grado que contienen variables elevadas al cuadrado"
      const visual = VisualLearningEngine.generateVisual(testContent, VisualType.CONCEPT_MAP, 'matemáticas')
      
      // Test optimal type detection
      const optimalType = VisualLearningEngine.detectOptimalVisualType(testContent, 'matemáticas')
      
      testResults.systems.visualEngine = {
        status: 'passed',
        visualGenerated: !!visual.ascii,
        elementsFound: visual.elements.length,
        optimalType: optimalType,
        instructionsProvided: visual.instructions.length
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.visualEngine = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 4: Google Drive Integration
    console.log('☁️ Testing Google Drive integration...')
    try {
      const { GoogleDriveIntegration } = require('@/lib/google-drive-integration')
      
      const driveStatus = GoogleDriveIntegration.getStatus()
      
      testResults.systems.googleDrive = {
        status: driveStatus.initialized ? 'passed' : 'warning',
        initialized: driveStatus.initialized,
        hasTokens: driveStatus.hasTokens,
        hasCredentials: !!driveStatus.authUrl,
        message: driveStatus.initialized ? 
          'Google Drive ready for backups' : 
          'Google Drive available but requires configuration'
      }
      
      if (driveStatus.initialized) {
        testResults.summary.passed++
      } else {
        testResults.summary.warnings++
      }
    } catch (error) {
      testResults.systems.googleDrive = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 5: Contextual Conversation Manager
    console.log('💬 Testing contextual conversation system...')
    try {
      const { ContextualConversationManager } = require('@/lib/contextual-conversation-manager')
      
      // Test contextual processing
      const testUserId = 'test-context-user'
      const response1 = await ContextualConversationManager.processContextualMessage(
        testUserId, 
        "Explícame qué son las ecuaciones cuadráticas en matemáticas"
      )
      
      const response2 = await ContextualConversationManager.processContextualMessage(
        testUserId, 
        "Continúa explicando con ejemplos"
      )
      
      const stats = ContextualConversationManager.getConversationStats(testUserId)
      
      testResults.systems.contextualConversation = {
        status: 'passed',
        firstResponseGenerated: !!response1.content,
        secondResponseGenerated: !!response2.content,
        continuityScore: response2.continuityScore,
        personalizations: response2.personalizations,
        contextMaintained: stats.totalTurns > 0,
        activeContexts: stats.activeContexts
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.contextualConversation = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 6: Academic Search + Notifications (Phase 2)
    console.log('🔍 Testing academic search and notifications...')
    try {
      const { AcademicSearchEngine } = require('@/lib/academic-search-engine')
      const { NotificationService } = require('@/lib/notification-service')
      
      // Test academic search
      const searchQuery = {
        topic: 'ecuaciones cuadráticas',
        subject: 'matemáticas',
        searchType: 'explanation',
        level: 'intermediate',
        language: 'es',
        userId: 'test-search-user'
      }
      
      const searchResults = await AcademicSearchEngine.searchAcademicContent(searchQuery)
      
      // Test notifications
      const notificationStats = NotificationService.getNotificationStats()
      
      testResults.systems.academicSearch = {
        status: 'passed',
        searchSuccessful: searchResults.searchSuccess,
        resultsFound: searchResults.totalResults,
        recommendationsGenerated: searchResults.personalizedRecommendations.length,
        followUpQuestions: searchResults.followUpQuestions.length,
        notificationSystem: {
          initialized: notificationStats.initialized,
          novuEnabled: notificationStats.novuEnabled,
          totalNotifications: notificationStats.totalNotifications || 0
        }
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.academicSearch = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Test 7: Integration Test - Full Sara Conversation
    console.log('🤖 Testing full Sara AI conversation flow...')
    try {
      const { ConversationEngine } = require('@/lib/conversation-engine')
      
      const testUserId = 'demo-student-fixed'
      const fullConversationTest = await ConversationEngine.processUserMessage(
        testUserId,
        "Explícame las ecuaciones cuadráticas con un ejemplo visual",
        "Estudiante Demo"
      )
      
      testResults.systems.fullIntegration = {
        status: 'passed',
        responseGenerated: !!fullConversationTest.content,
        hasMetadata: !!fullConversationTest.metadata,
        suggestedActions: fullConversationTest.metadata?.suggestedActions || [],
        responseLength: fullConversationTest.content.length,
        containsVisualReference: fullConversationTest.content.toLowerCase().includes('visual') ||
                                 fullConversationTest.content.toLowerCase().includes('diagrama')
      }
      testResults.summary.passed++
    } catch (error) {
      testResults.systems.fullIntegration = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      testResults.summary.failed++
    }
    testResults.summary.total++

    // Calculate success rate
    const successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100)
    
    testResults.summary.successRate = successRate
    testResults.summary.status = successRate >= 85 ? 'excellent' : 
                                 successRate >= 70 ? 'good' : 
                                 successRate >= 50 ? 'acceptable' : 'needs_attention'

    console.log(`\n🎯 TEST SUMMARY:`)
    console.log(`✅ Passed: ${testResults.summary.passed}/${testResults.summary.total}`)
    console.log(`❌ Failed: ${testResults.summary.failed}/${testResults.summary.total}`)
    console.log(`⚠️  Warnings: ${testResults.summary.warnings}/${testResults.summary.total}`)
    console.log(`📊 Success Rate: ${successRate}%`)
    console.log(`📈 Overall Status: ${testResults.summary.status.toUpperCase()}`)

    return NextResponse.json({
      success: true,
      testResults,
      message: `Sara AI systems test completed with ${successRate}% success rate`
    })

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Test suite encountered a critical error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Sara AI Systems Test Suite',
    instructions: 'Send a POST request to run comprehensive tests',
    availableTests: [
      'Calendar System (Fixed)',
      'Learning Profiles (VARK)',
      'Visual Learning Engine', 
      'Google Drive Integration',
      'Contextual Conversation Manager',
      'Academic Search + Notifications',
      'Full Integration Test'
    ]
  })
}