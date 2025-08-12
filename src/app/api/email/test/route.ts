/**
 * FASE 6: Email System Testing API Endpoint
 * 
 * This endpoint provides comprehensive testing capabilities for the email system.
 * Allows testing of templates, connectivity, sending, and delivery tracking.
 * 
 * IMPORTANT: This is for testing only. In production, this should be restricted
 * or removed entirely for security reasons.
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  initializeEmailTables,
  createEmailDeliveryRecord,
  getEmailDeliveryStats,
  upsertEmailTemplate,
  getEmailTemplate
} from "@/lib/db-operations"
import { initializeDefaultEmailTemplates } from "@/lib/email-templates"
import { 
  getGmailService, 
  createGmailService, 
  SendEmailRequest 
} from "@/lib/gmail-service"
import { 
  replaceTemplateVariables,
  formatEmailDate,
  STUDENT_FEEDBACK_TEMPLATE,
  EmailTemplateVariables
} from "@/lib/email-templates"

export interface EmailTestRequest {
  testType: 'connectivity' | 'template' | 'send' | 'database' | 'full-suite'
  testEmail?: string // Test recipient email
  reportId?: string // For testing with real report data
  templateData?: Partial<EmailTemplateVariables>
}

export interface EmailTestResponse {
  success: boolean
  testType: string
  results: {
    [key: string]: {
      passed: boolean
      message: string
      details?: any
      error?: string
    }
  }
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    overallSuccess: boolean
  }
  recommendations?: string[]
}

/**
 * POST: Run email system tests
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "No autorizado" 
      }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ 
        success: false, 
        error: "Solo instructores pueden ejecutar tests" 
      }, { status: 403 })
    }

    const testRequest: EmailTestRequest = await request.json()
    console.log(`🧪 Running email system test: ${testRequest.testType}`)

    const testResults: EmailTestResponse['results'] = {}
    const recommendations: string[] = []

    // Test database initialization
    if (testRequest.testType === 'database' || testRequest.testType === 'full-suite') {
      try {
        await initializeEmailTables()
        await initializeDefaultEmailTemplates()
        
        testResults.database_init = {
          passed: true,
          message: "Database tables and templates initialized successfully"
        }
      } catch (error: any) {
        testResults.database_init = {
          passed: false,
          message: "Failed to initialize database",
          error: error.message
        }
        recommendations.push("Check database connection and permissions")
      }
    }

    // Test Gmail connectivity
    if (testRequest.testType === 'connectivity' || testRequest.testType === 'full-suite') {
      try {
        const gmailService = getGmailService()
        const isConnected = await gmailService.testConnection()
        
        testResults.gmail_connectivity = {
          passed: isConnected,
          message: isConnected 
            ? "Gmail API connection successful" 
            : "Gmail API connection failed",
          details: {
            clientId: process.env.GOOGLE_CLIENT_ID ? "configured" : "missing",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "configured" : "missing",
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN ? "configured" : "missing"
          }
        }

        if (!isConnected) {
          recommendations.push("Verify Google OAuth credentials and refresh token")
          recommendations.push("Ensure Gmail API is enabled in Google Cloud Console")
        }
      } catch (error: any) {
        testResults.gmail_connectivity = {
          passed: false,
          message: "Gmail service initialization failed",
          error: error.message
        }
        recommendations.push("Check Gmail service configuration")
      }
    }

    // Test template rendering
    if (testRequest.testType === 'template' || testRequest.testType === 'full-suite') {
      try {
        const testTemplateVars: EmailTemplateVariables = {
          studentName: testRequest.templateData?.studentName || "Juan Pérez",
          studentId: testRequest.templateData?.studentId || "EST-2025-001",
          instructorName: session.user.name || "Instructor de Prueba",
          subject: testRequest.templateData?.subject || "Matemáticas",
          weekStart: formatEmailDate(testRequest.templateData?.weekStart || "2025-01-15"),
          weekEnd: formatEmailDate(testRequest.templateData?.weekEnd || "2025-01-21"),
          progressScore: testRequest.templateData?.progressScore || 3.5,
          feedbackContent: testRequest.templateData?.feedbackContent || "Feedback de prueba generado por el sistema.",
          achievements: testRequest.templateData?.achievements || "Excelente participación en clase y comprensión de conceptos básicos.",
          improvements: testRequest.templateData?.improvements || "Practicar más ejercicios de álgebra para fortalecer las bases.",
          recommendations: testRequest.templateData?.recommendations || "Revisar los apuntes de clase y realizar ejercicios adicionales.",
          nextSteps: testRequest.templateData?.nextSteps || "Preparar evaluación de la próxima semana y completar tareas pendientes.",
          platformUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
          unsubscribeUrl: "http://localhost:3000/unsubscribe"
        }

        // Test subject rendering
        const renderedSubject = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.subject, testTemplateVars)
        
        // Test HTML content rendering
        const renderedHtml = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.htmlContent, testTemplateVars)
        
        // Test text content rendering
        const renderedText = replaceTemplateVariables(STUDENT_FEEDBACK_TEMPLATE.textContent, testTemplateVars)

        // Validate that variables were replaced
        const hasUnreplacedVars = [renderedSubject, renderedHtml, renderedText].some(content => 
          content.includes('{{') && content.includes('}}')
        )

        testResults.template_rendering = {
          passed: !hasUnreplacedVars && renderedHtml.length > 1000 && renderedText.length > 500,
          message: hasUnreplacedVars 
            ? "Template rendering incomplete - some variables not replaced" 
            : "Template rendering successful",
          details: {
            subjectLength: renderedSubject.length,
            htmlLength: renderedHtml.length,
            textLength: renderedText.length,
            hasUnreplacedVars,
            sampleSubject: renderedSubject.substring(0, 100)
          }
        }

        if (hasUnreplacedVars) {
          recommendations.push("Check template variable definitions and replacement logic")
        }

      } catch (error: any) {
        testResults.template_rendering = {
          passed: false,
          message: "Template rendering failed",
          error: error.message
        }
        recommendations.push("Check template files and variable replacement logic")
      }
    }

    // Test email sending (if test email provided)
    if (testRequest.testType === 'send' || testRequest.testType === 'full-suite') {
      if (testRequest.testEmail) {
        try {
          // Create a test email request
          const testEmailRequest: SendEmailRequest = {
            reportId: testRequest.reportId || 'test-report-id',
            userId: 'test-user-id',
            recipientEmail: testRequest.testEmail,
            recipientName: "Usuario de Prueba",
            instructorId: session.user.id,
            instructorName: session.user.name || "Instructor de Prueba",
            feedbackData: {
              subject: "Prueba del Sistema",
              weekStart: "2025-01-15",
              weekEnd: "2025-01-21",
              progressScore: 3.5,
              feedbackContent: "Este es un email de prueba del sistema Intellego Platform.",
              achievements: "Sistema de prueba funcionando correctamente.",
              improvements: "No se requieren mejoras en este test.",
              recommendations: "El sistema está listo para uso en producción.",
              nextSteps: "Continuar con las pruebas o proceder con el uso normal."
            },
            priority: 'high'
          }

          const gmailService = getGmailService()
          const result = await gmailService.sendEmail(testEmailRequest)

          testResults.email_sending = {
            passed: result.success,
            message: result.success 
              ? `Test email sent successfully to ${testRequest.testEmail}`
              : `Failed to send test email: ${result.error}`,
            details: {
              deliveryId: result.deliveryId,
              gmailMessageId: result.gmailMessageId,
              retryable: result.retryable
            },
            error: result.error
          }

          if (!result.success && result.retryable) {
            recommendations.push("Email sending failed but is retryable - check network and API limits")
          } else if (!result.success) {
            recommendations.push("Email sending failed permanently - check credentials and configuration")
          }

        } catch (error: any) {
          testResults.email_sending = {
            passed: false,
            message: "Email sending test failed with exception",
            error: error.message
          }
          recommendations.push("Check Gmail service configuration and network connectivity")
        }
      } else {
        testResults.email_sending = {
          passed: false,
          message: "No test email provided - skipping send test",
          details: { note: "Provide testEmail parameter to run send test" }
        }
      }
    }

    // Test delivery tracking
    if (testRequest.testType === 'full-suite') {
      try {
        // Test creating a delivery record
        const testDeliveryId = await createEmailDeliveryRecord({
          reportId: 'test-report-' + Date.now(),
          userId: 'test-user-id',
          recipientEmail: 'test@example.com',
          subject: 'Test Delivery Record',
          content: JSON.stringify({ test: true }),
          instructorId: session.user.id
        })

        // Test getting delivery stats
        const stats = await getEmailDeliveryStats(session.user.id)

        testResults.delivery_tracking = {
          passed: !!testDeliveryId && typeof stats === 'object',
          message: "Delivery tracking system functional",
          details: {
            testDeliveryId,
            currentStats: stats
          }
        }

      } catch (error: any) {
        testResults.delivery_tracking = {
          passed: false,
          message: "Delivery tracking test failed",
          error: error.message
        }
        recommendations.push("Check database operations and delivery tracking functions")
      }
    }

    // Calculate summary
    const totalTests = Object.keys(testResults).length
    const passedTests = Object.values(testResults).filter(result => result.passed).length
    const failedTests = totalTests - passedTests
    const overallSuccess = failedTests === 0

    const response: EmailTestResponse = {
      success: overallSuccess,
      testType: testRequest.testType,
      results: testResults,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallSuccess
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined
    }

    console.log(`🧪 Email test completed: ${passedTests}/${totalTests} passed`)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`❌ Email test API error:`, error)
    
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor",
      message: "Error ejecutando tests del sistema de email"
    }, { status: 500 })
  }
}

/**
 * GET: Get test suite status and available tests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    return NextResponse.json({
      availableTests: [
        {
          type: 'connectivity',
          description: 'Test Gmail API connectivity and authentication',
          requiredParams: []
        },
        {
          type: 'template',
          description: 'Test email template rendering and variable replacement',
          requiredParams: [],
          optionalParams: ['templateData']
        },
        {
          type: 'send',
          description: 'Test sending actual email (requires test email address)',
          requiredParams: ['testEmail'],
          optionalParams: ['reportId', 'templateData']
        },
        {
          type: 'database',
          description: 'Test database initialization and operations',
          requiredParams: []
        },
        {
          type: 'full-suite',
          description: 'Run all tests comprehensively',
          requiredParams: [],
          optionalParams: ['testEmail', 'reportId', 'templateData']
        }
      ],
      systemStatus: {
        envVarsConfigured: {
          googleClientId: !!process.env.GOOGLE_CLIENT_ID,
          googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          googleRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
          nextAuthUrl: !!process.env.NEXTAUTH_URL
        },
        recommendations: [
          "Always test in a safe environment first",
          "Use a test email address for send tests",
          "Monitor Gmail API quotas and limits",
          "Review test results before production use"
        ]
      }
    })

  } catch (error: any) {
    console.error(`❌ Email test status API error:`, error)
    
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}