import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PredictiveAnalytics } from '@/lib/predictive-analytics'
import { UserRole } from '@/lib/temp-storage'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'alerts':
        const alerts = await PredictiveAnalytics.generateAlerts()
        return NextResponse.json({
          success: true,
          alerts,
          count: alerts.length
        })

      case 'insights':
        const insights = await PredictiveAnalytics.generatePredictiveInsights()
        return NextResponse.json({
          success: true,
          insights,
          count: insights.length
        })

      case 'summary':
        const summary = await PredictiveAnalytics.getAlertsSummary()
        return NextResponse.json({
          success: true,
          summary
        })

      case 'risk_distribution':
        const riskDistribution = await PredictiveAnalytics.getRiskDistribution()
        return NextResponse.json({
          success: true,
          riskDistribution
        })

      case 'student_analysis':
        const studentId = searchParams.get('studentId')
        if (!studentId) {
          return NextResponse.json(
            { error: 'Student ID is required for individual analysis' },
            { status: 400 }
          )
        }

        const studentName = searchParams.get('studentName') || 'Unknown Student'
        const studentAlerts = await PredictiveAnalytics.analyzeStudent(studentId, studentName)
        
        return NextResponse.json({
          success: true,
          alerts: studentAlerts,
          studentId,
          studentName
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: alerts, insights, summary, risk_distribution, or student_analysis' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in predictive analytics:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.INSTRUCTOR) {
      return NextResponse.json(
        { error: 'Unauthorized - Instructor access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, alertId, studentId } = body

    switch (action) {
      case 'acknowledge_alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          )
        }

        // In a real implementation, you would update the alert in the database
        // For now, we'll just return success
        return NextResponse.json({
          success: true,
          message: 'Alert acknowledged successfully',
          alertId
        })

      case 'generate_intervention_plan':
        if (!studentId) {
          return NextResponse.json(
            { error: 'Student ID is required' },
            { status: 400 }
          )
        }

        // Generate a basic intervention plan based on alerts
        const studentAlerts = await PredictiveAnalytics.analyzeStudent(studentId, 'Student')
        const criticalAlerts = studentAlerts.filter(alert => alert.severity === 'critical')
        const warningAlerts = studentAlerts.filter(alert => alert.severity === 'warning')

        const interventionPlan = {
          studentId,
          priority: criticalAlerts.length > 0 ? 'immediate' : warningAlerts.length > 0 ? 'high' : 'normal',
          actions: [
            ...criticalAlerts.map(alert => ({ type: 'critical', action: alert.recommendation })),
            ...warningAlerts.map(alert => ({ type: 'preventive', action: alert.recommendation }))
          ],
          timeline: criticalAlerts.length > 0 ? '1-3 days' : '1-2 weeks',
          followUp: 'Schedule progress review in 2 weeks'
        }

        return NextResponse.json({
          success: true,
          interventionPlan
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: acknowledge_alert or generate_intervention_plan' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in predictive analytics POST:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}