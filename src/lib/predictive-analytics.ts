import { getProgressReports, getAllUsers, UserRole } from './temp-storage'

export enum AlertType {
  SUBMISSION_DELAY = 'submission_delay',
  PERFORMANCE_DECLINE = 'performance_decline',
  GOAL_AT_RISK = 'goal_at_risk',
  EXCESSIVE_CHALLENGES = 'excessive_challenges',
  LOW_ENGAGEMENT = 'low_engagement',
  POSITIVE_TREND = 'positive_trend'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  studentId: string
  studentName: string
  title: string
  description: string
  recommendation: string
  createdAt: Date
  acknowledged: boolean
  data?: any // Additional context data
}

export interface PredictiveInsight {
  studentId: string
  studentName: string
  riskScore: number // 0-100, higher = more at risk
  trends: {
    submissionConsistency: number // 0-100
    challengeFrequency: number // average challenges per report
    achievementFrequency: number // average achievements per report
    goalCompletionRate: number // percentage of goals met
    engagementLevel: number // 0-100 based on activity
  }
  predictions: {
    likelyToMissNextDeadline: boolean
    likelyToNeedSupport: boolean
    likelyToExceed: boolean
  }
  recommendations: string[]
}

export class PredictiveAnalytics {
  // Generate alerts for all students
  static async generateAlerts(): Promise<Alert[]> {
    const users = await getAllUsers()
    const students = users.filter(user => user.role === UserRole.STUDENT)
    const alerts: Alert[] = []

    for (const student of students) {
      const studentAlerts = await this.analyzeStudent(student.id, student.name)
      alerts.push(...studentAlerts)
    }

    return alerts
  }

  // Analyze individual student and generate alerts
  static async analyzeStudent(studentId: string, studentName: string): Promise<Alert[]> {
    const reports = await getProgressReports(studentId)
    const alerts: Alert[] = []

    if (reports.length === 0) {
      alerts.push({
        id: `alert_${Date.now()}_${studentId}_no_reports`,
        type: AlertType.LOW_ENGAGEMENT,
        severity: AlertSeverity.WARNING,
        studentId,
        studentName,
        title: 'Sin reportes enviados',
        description: `${studentName} no ha enviado ningún reporte semanal aún.`,
        recommendation: 'Contactar al estudiante para ofrecer apoyo inicial y explicar la importancia de los reportes.',
        createdAt: new Date(),
        acknowledged: false
      })
      return alerts
    }

    // Check submission delay patterns
    const submissionDelayAlert = this.checkSubmissionPatterns(studentId, studentName, reports)
    if (submissionDelayAlert) alerts.push(submissionDelayAlert)

    // Check performance decline
    const performanceAlert = this.checkPerformanceDecline(studentId, studentName, reports)
    if (performanceAlert) alerts.push(performanceAlert)

    // Check excessive challenges
    const challengesAlert = this.checkExcessiveChallenges(studentId, studentName, reports)
    if (challengesAlert) alerts.push(challengesAlert)

    // Check for positive trends (encouraging alerts)
    const positiveAlert = this.checkPositiveTrends(studentId, studentName, reports)
    if (positiveAlert) alerts.push(positiveAlert)

    return alerts
  }

  // Check submission timing patterns
  private static checkSubmissionPatterns(studentId: string, studentName: string, reports: any[]): Alert | null {
    if (reports.length < 3) return null // Need at least 3 reports to detect patterns

    const recentReports = reports.slice(-4) // Last 4 reports
    const now = new Date()
    
    // Check if student hasn't submitted in the last 10 days
    const lastSubmission = new Date(recentReports[recentReports.length - 1].submittedAt)
    const daysSinceLastSubmission = Math.floor((now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastSubmission > 10) {
      return {
        id: `alert_${Date.now()}_${studentId}_delay`,
        type: AlertType.SUBMISSION_DELAY,
        severity: daysSinceLastSubmission > 14 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        studentId,
        studentName,
        title: 'Retraso en reportes',
        description: `${studentName} no ha enviado un reporte en ${daysSinceLastSubmission} días.`,
        recommendation: 'Contactar al estudiante para verificar si necesita apoyo o recordatorio sobre la importancia de los reportes regulares.',
        createdAt: new Date(),
        acknowledged: false,
        data: { daysSinceLastSubmission }
      }
    }

    return null
  }

  // Check for performance decline trends
  private static checkPerformanceDecline(studentId: string, studentName: string, reports: any[]): Alert | null {
    if (reports.length < 4) return null

    const recentReports = reports.slice(-4) // Last 4 reports
    
    // Calculate challenge-to-achievement ratio for each report
    const ratios = recentReports.map(report => {
      const challenges = report.challenges?.length || 0
      const achievements = report.achievements?.length || 0
      return challenges > 0 ? challenges / Math.max(achievements, 1) : 0
    })

    // Check if there's an increasing trend in challenge-to-achievement ratio
    const firstHalf = ratios.slice(0, 2).reduce((a, b) => a + b, 0) / 2
    const secondHalf = ratios.slice(2, 4).reduce((a, b) => a + b, 0) / 2
    
    if (secondHalf > firstHalf && secondHalf > 1.5) {
      return {
        id: `alert_${Date.now()}_${studentId}_decline`,
        type: AlertType.PERFORMANCE_DECLINE,
        severity: secondHalf > 2.5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        studentId,
        studentName,
        title: 'Posible declive en rendimiento',
        description: `${studentName} muestra un aumento en desafíos y reducción en logros en reportes recientes.`,
        recommendation: 'Agendar una reunión individual para identificar obstáculos y desarrollar estrategias de apoyo específicas.',
        createdAt: new Date(),
        acknowledged: false,
        data: { challengeToAchievementRatio: secondHalf }
      }
    }

    return null
  }

  // Check for excessive challenges
  private static checkExcessiveChallenges(studentId: string, studentName: string, reports: any[]): Alert | null {
    if (reports.length < 2) return null

    const recentReports = reports.slice(-3) // Last 3 reports
    const avgChallenges = recentReports.reduce((sum, report) => sum + (report.challenges?.length || 0), 0) / recentReports.length

    if (avgChallenges > 5) {
      return {
        id: `alert_${Date.now()}_${studentId}_challenges`,
        type: AlertType.EXCESSIVE_CHALLENGES,
        severity: avgChallenges > 8 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        studentId,
        studentName,
        title: 'Alto número de desafíos reportados',
        description: `${studentName} ha reportado un promedio de ${avgChallenges.toFixed(1)} desafíos por reporte recientemente.`,
        recommendation: 'Intervenir proactivamente para proporcionar recursos adicionales, tutoría o ajustes en la carga de trabajo.',
        createdAt: new Date(),
        acknowledged: false,
        data: { averageChallenges: avgChallenges }
      }
    }

    return null
  }

  // Check for positive trends (encouraging)
  private static checkPositiveTrends(studentId: string, studentName: string, reports: any[]): Alert | null {
    if (reports.length < 3) return null

    const recentReports = reports.slice(-3) // Last 3 reports
    const avgAchievements = recentReports.reduce((sum, report) => sum + (report.achievements?.length || 0), 0) / recentReports.length
    const avgChallenges = recentReports.reduce((sum, report) => sum + (report.challenges?.length || 0), 0) / recentReports.length

    // Check for high achievement rate and low challenge rate
    if (avgAchievements >= 3 && avgChallenges <= 1) {
      return {
        id: `alert_${Date.now()}_${studentId}_positive`,
        type: AlertType.POSITIVE_TREND,
        severity: AlertSeverity.INFO,
        studentId,
        studentName,
        title: 'Progreso excelente',
        description: `${studentName} muestra un progreso consistente con ${avgAchievements.toFixed(1)} logros promedio y pocos desafíos.`,
        recommendation: 'Reconocer el buen trabajo y considerar desafíos adicionales o rol de mentoría para otros estudiantes.',
        createdAt: new Date(),
        acknowledged: false,
        data: { averageAchievements: avgAchievements, averageChallenges: avgChallenges }
      }
    }

    return null
  }

  // Generate predictive insights for instructor dashboard
  static async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    const users = await getAllUsers()
    const students = users.filter(user => user.role === UserRole.STUDENT)
    const insights: PredictiveInsight[] = []

    for (const student of students) {
      const insight = await this.generateStudentInsight(student.id, student.name)
      insights.push(insight)
    }

    return insights.sort((a, b) => b.riskScore - a.riskScore) // Sort by risk score descending
  }

  // Generate insight for individual student
  private static async generateStudentInsight(studentId: string, studentName: string): Promise<PredictiveInsight> {
    const reports = await getProgressReports(studentId)

    if (reports.length === 0) {
      return {
        studentId,
        studentName,
        riskScore: 80, // High risk for students with no reports
        trends: {
          submissionConsistency: 0,
          challengeFrequency: 0,
          achievementFrequency: 0,
          goalCompletionRate: 0,
          engagementLevel: 0
        },
        predictions: {
          likelyToMissNextDeadline: true,
          likelyToNeedSupport: true,
          likelyToExceed: false
        },
        recommendations: [
          'Contactar inmediatamente para verificar participación',
          'Proporcionar orientación sobre el sistema de reportes',
          'Evaluar posibles barreras de acceso o comprensión'
        ]
      }
    }

    // Calculate trends
    const recentReports = reports.slice(-4) // Last 4 reports
    const challengeFreq = recentReports.reduce((sum, r) => sum + (r.challenges?.length || 0), 0) / recentReports.length
    const achievementFreq = recentReports.reduce((sum, r) => sum + (r.achievements?.length || 0), 0) / recentReports.length
    
    // Calculate submission consistency (percentage of expected reports submitted)
    const weeksInPeriod = 4
    const submissionConsistency = Math.min(100, (recentReports.length / weeksInPeriod) * 100)
    
    // Calculate engagement level based on content quality
    const engagementLevel = Math.min(100, ((achievementFreq * 20) + (Math.max(0, 3 - challengeFreq) * 15) + (submissionConsistency * 0.65)))
    
    // Calculate risk score
    const riskScore = Math.max(0, Math.min(100, 
      (100 - submissionConsistency) * 0.4 + 
      challengeFreq * 8 + 
      Math.max(0, 3 - achievementFreq) * 15 +
      (100 - engagementLevel) * 0.3
    ))

    // Generate predictions
    const predictions = {
      likelyToMissNextDeadline: riskScore > 60 || submissionConsistency < 75,
      likelyToNeedSupport: challengeFreq > 3 || riskScore > 50,
      likelyToExceed: achievementFreq > 4 && challengeFreq < 2 && submissionConsistency > 90
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskScore, {
      submissionConsistency,
      challengeFrequency: challengeFreq,
      achievementFrequency: achievementFreq,
      goalCompletionRate: 0, // Would need goals data
      engagementLevel
    }, predictions)

    return {
      studentId,
      studentName,
      riskScore: Math.round(riskScore),
      trends: {
        submissionConsistency: Math.round(submissionConsistency),
        challengeFrequency: Math.round(challengeFreq * 10) / 10,
        achievementFrequency: Math.round(achievementFreq * 10) / 10,
        goalCompletionRate: 0, // Would calculate from goals data
        engagementLevel: Math.round(engagementLevel)
      },
      predictions,
      recommendations
    }
  }

  // Generate recommendations based on trends and predictions
  private static generateRecommendations(riskScore: number, trends: any, predictions: any): string[] {
    const recommendations: string[] = []

    if (riskScore > 70) {
      recommendations.push('Intervención inmediata requerida')
      recommendations.push('Agendar reunión individual urgente')
    } else if (riskScore > 50) {
      recommendations.push('Monitoreo cercano recomendado')
      recommendations.push('Ofrecer recursos de apoyo adicionales')
    }

    if (trends.submissionConsistency < 75) {
      recommendations.push('Implementar recordatorios personalizados')
      recommendations.push('Verificar barreras para la presentación de reportes')
    }

    if (trends.challengeFrequency > 3) {
      recommendations.push('Evaluar carga de trabajo actual')
      recommendations.push('Proporcionar estrategias de manejo de desafíos')
    }

    if (trends.achievementFrequency < 2) {
      recommendations.push('Ayudar a establecer metas más alcanzables')
      recommendations.push('Celebrar pequeños logros para motivar')
    }

    if (predictions.likelyToExceed) {
      recommendations.push('Considerar desafíos adicionales')
      recommendations.push('Oportunidades de mentoría o liderazgo')
    }

    if (recommendations.length === 0) {
      recommendations.push('Mantener monitoreo regular')
      recommendations.push('Continuar con el apoyo actual')
    }

    return recommendations
  }

  // Get alerts summary for dashboard
  static async getAlertsSummary(): Promise<{
    total: number
    critical: number
    warning: number
    info: number
    unacknowledged: number
  }> {
    const alerts = await this.generateAlerts()
    
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      warning: alerts.filter(a => a.severity === AlertSeverity.WARNING).length,
      info: alerts.filter(a => a.severity === AlertSeverity.INFO).length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length
    }
  }

  // Get risk distribution for visualization
  static async getRiskDistribution(): Promise<{
    low: number    // 0-30
    medium: number // 31-60
    high: number   // 61-80
    critical: number // 81-100
  }> {
    const insights = await this.generatePredictiveInsights()
    
    return {
      low: insights.filter(i => i.riskScore <= 30).length,
      medium: insights.filter(i => i.riskScore > 30 && i.riskScore <= 60).length,
      high: insights.filter(i => i.riskScore > 60 && i.riskScore <= 80).length,
      critical: insights.filter(i => i.riskScore > 80).length
    }
  }
}