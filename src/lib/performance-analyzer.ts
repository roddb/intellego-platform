// Analizador de Rendimiento Académico por Materia
// Proporciona análisis detallado del progreso y rendimiento del estudiante

import { StudentContext, SubjectPerformance, StudyGoal } from './student-context'

export interface PerformanceMetrics {
  subject: string
  currentGrade: number
  gradeHistory: Array<{
    date: Date
    grade: number
    assessment: string
  }>
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable'
    rate: number // rate of change per week
    confidence: number // 0-1
  }
  timeInvestment: {
    hoursPerWeek: number
    efficiency: number // grade improvement per hour
    comparison: 'below_average' | 'average' | 'above_average'
  }
  difficultyAssessment: {
    perceivedDifficulty: number // 1-10
    actualPerformance: number // grade/effort ratio
    gap: number // difference between effort and results
  }
  learningVelocity: {
    conceptsPerWeek: number
    retentionRate: number // percentage retained after 1 week
    masteryTime: number // average time to master a concept
  }
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface ComprehensiveAnalysis {
  overview: {
    totalSubjects: number
    averageGrade: number
    gradeDistribution: { [grade: string]: number }
    totalStudyHours: number
    overallTrend: 'improving' | 'declining' | 'stable'
  }
  subjectMetrics: PerformanceMetrics[]
  comparativeAnalysis: {
    bestPerformingSubject: {
      subject: string
      grade: number
      reasons: string[]
    }
    mostChallengingSubject: {
      subject: string
      grade: number
      issues: string[]
    }
    mostEfficientSubject: {
      subject: string
      efficiency: number
      strategies: string[]
    }
    leastEfficientSubject: {
      subject: string
      efficiency: number
      improvements: string[]
    }
  }
  correlationAnalysis: {
    timeVsGrade: number // correlation coefficient
    difficultyVsGrade: number
    studyMethodEffectiveness: Array<{
      method: string
      effectiveness: number
      recommendedFor: string[]
    }>
  }
  predictions: {
    nextWeekGrades: { [subject: string]: number }
    semesterProjections: { [subject: string]: number }
    riskAssessment: Array<{
      subject: string
      riskLevel: 'low' | 'medium' | 'high' | 'critical'
      riskFactors: string[]
      interventions: string[]
    }>
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    strategic: string[]
  }
}

export interface LearningPattern {
  preferredTimeSlots: string[]
  optimalSessionDuration: number
  effectiveBreakFrequency: number
  bestPerformingEnvironments: string[]
  mostEffectiveTechniques: Array<{
    technique: string
    effectivenessScore: number
    applicableSubjects: string[]
  }>
  motivationalFactors: string[]
  distractionTriggers: string[]
}

export class PerformanceAnalyzer {

  /**
   * Genera un análisis completo del rendimiento académico
   */
  static async analyzeComprehensivePerformance(context: StudentContext): Promise<ComprehensiveAnalysis> {
    // Calcular métricas generales
    const overview = this.calculateOverview(context)
    
    // Analizar cada materia individualmente
    const subjectMetrics = await Promise.all(
      context.subjectPerformances.map(subject => this.analyzeSubjectPerformance(subject, context))
    )
    
    // Análisis comparativo
    const comparativeAnalysis = this.performComparativeAnalysis(subjectMetrics)
    
    // Análisis de correlación
    const correlationAnalysis = this.analyzeCorrelations(context, subjectMetrics)
    
    // Predicciones y proyecciones
    const predictions = this.generatePredictions(subjectMetrics, context)
    
    // Recomendaciones estratégicas
    const recommendations = this.generateStrategicRecommendations(subjectMetrics, context)

    return {
      overview,
      subjectMetrics,
      comparativeAnalysis,
      correlationAnalysis,
      predictions,
      recommendations
    }
  }

  /**
   * Analiza el rendimiento de una materia específica
   */
  static async analyzeSubjectPerformance(
    subject: SubjectPerformance, 
    context: StudentContext
  ): Promise<PerformanceMetrics> {
    
    // Análisis de tendencia
    const trendAnalysis = this.analyzeTrend(subject)
    
    // Análisis de inversión de tiempo
    const timeInvestment = this.analyzeTimeInvestment(subject, context)
    
    // Evaluación de dificultad
    const difficultyAssessment = this.assessDifficulty(subject)
    
    // Velocidad de aprendizaje
    const learningVelocity = this.calculateLearningVelocity(subject)
    
    // Análisis SWOT
    const swotAnalysis = this.performSWOTAnalysis(subject, context)

    return {
      subject: subject.subject,
      currentGrade: subject.averageGrade,
      gradeHistory: this.generateGradeHistory(subject),
      trendAnalysis,
      timeInvestment,
      difficultyAssessment,
      learningVelocity,
      strengths: swotAnalysis.strengths,
      weaknesses: swotAnalysis.weaknesses,
      opportunities: swotAnalysis.opportunities,
      threats: swotAnalysis.threats
    }
  }

  /**
   * Identifica patrones de aprendizaje del estudiante
   */
  static analyzeLearningPatterns(context: StudentContext): LearningPattern {
    const studyPatterns = context.studyPatterns
    
    return {
      preferredTimeSlots: studyPatterns.patterns.mostProductiveHours,
      optimalSessionDuration: studyPatterns.patterns.averageSessionDuration,
      effectiveBreakFrequency: studyPatterns.patterns.preferredBreakDuration,
      bestPerformingEnvironments: this.identifyBestEnvironments(context),
      mostEffectiveTechniques: this.identifyEffectiveTechniques(context),
      motivationalFactors: studyPatterns.patterns.motivationalFactors,
      distractionTriggers: studyPatterns.patterns.procrastinationTriggers
    }
  }

  /**
   * Genera recomendaciones personalizadas para mejorar el rendimiento
   */
  static generatePersonalizedRecommendations(
    analysis: ComprehensiveAnalysis,
    context: StudentContext
  ): {
    priority: 'high' | 'medium' | 'low'
    category: 'study_technique' | 'time_management' | 'subject_focus' | 'motivation' | 'resources'
    recommendation: string
    expectedImpact: string
    timeToImplement: string
    difficultyLevel: 'easy' | 'medium' | 'hard'
  }[] {
    
    const recommendations: any[] = []
    
    // Recomendaciones basadas en materias con bajo rendimiento
    const strugglingSubjects = analysis.subjectMetrics.filter(m => m.currentGrade < 70)
    strugglingSubjects.forEach(subject => {
      recommendations.push({
        priority: 'high',
        category: 'subject_focus',
        recommendation: `Incrementar tiempo de estudio en ${subject.subject} de ${subject.timeInvestment.hoursPerWeek}h a ${Math.ceil(subject.timeInvestment.hoursPerWeek * 1.5)}h por semana`,
        expectedImpact: `Mejora estimada de 10-15 puntos en ${subject.subject}`,
        timeToImplement: '2-3 semanas',
        difficultyLevel: 'medium'
      })
    })

    // Recomendaciones basadas en eficiencia
    const inefficientSubjects = analysis.subjectMetrics
      .filter(m => m.timeInvestment.efficiency < 2)
      .sort((a, b) => a.timeInvestment.efficiency - b.timeInvestment.efficiency)
    
    inefficientSubjects.slice(0, 2).forEach(subject => {
      recommendations.push({
        priority: 'high',
        category: 'study_technique',
        recommendation: `Cambiar técnica de estudio para ${subject.subject}. Probar método de casos prácticos en lugar de memorización`,
        expectedImpact: 'Mejorar eficiencia en 30-50%',
        timeToImplement: '1-2 semanas',
        difficultyLevel: 'easy'
      })
    })

    // Recomendaciones de gestión del tiempo
    if (context.studyPatterns.weeklyStats.totalStudyHours < 15) {
      recommendations.push({
        priority: 'medium',
        category: 'time_management',
        recommendation: 'Incrementar tiempo de estudio gradualmente: +30 minutos por día durante 2 semanas',
        expectedImpact: 'Mejora general del rendimiento en 5-10%',
        timeToImplement: '2-4 semanas',
        difficultyLevel: 'easy'
      })
    }

    // Recomendaciones motivacionales
    if (analysis.overview.overallTrend === 'declining') {
      recommendations.push({
        priority: 'high',
        category: 'motivation',
        recommendation: 'Establecer objetivos pequeños y alcanzables para recuperar motivación',
        expectedImpact: 'Mejora en consistencia y motivación',
        timeToImplement: '1 semana',
        difficultyLevel: 'easy'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Detecta alertas y riesgos académicos
   */
  static detectAcademicRisks(analysis: ComprehensiveAnalysis): Array<{
    type: 'grade_decline' | 'time_deficit' | 'deadline_risk' | 'burnout_risk' | 'motivation_drop'
    severity: 'low' | 'medium' | 'high' | 'critical'
    subject?: string
    description: string
    immediateActions: string[]
    deadline?: Date
  }> {
    
    const risks: any[] = []

    // Riesgo de calificaciones bajas
    analysis.subjectMetrics.forEach(subject => {
      if (subject.currentGrade < 60) {
        risks.push({
          type: 'grade_decline',
          severity: 'critical',
          subject: subject.subject,
          description: `Calificación crítica en ${subject.subject}: ${subject.currentGrade}%`,
          immediateActions: [
            'Reunión urgente con profesor',
            'Plan de recuperación intensivo',
            'Tutoría adicional'
          ]
        })
      } else if (subject.trendAnalysis.direction === 'declining' && subject.trendAnalysis.rate < -5) {
        risks.push({
          type: 'grade_decline',
          severity: 'high',
          subject: subject.subject,
          description: `Tendencia declinante en ${subject.subject}: -${Math.abs(subject.trendAnalysis.rate)} puntos por semana`,
          immediateActions: [
            'Revisar método de estudio',
            'Aumentar tiempo de práctica',
            'Identificar conceptos problemáticos'
          ]
        })
      }
    })

    // Riesgo de deadlines
    analysis.subjectMetrics.forEach(subject => {
      // Simular próximos deadlines basándose en el contexto
      if (subject.currentGrade < 75) {
        risks.push({
          type: 'deadline_risk',
          severity: 'medium',
          subject: subject.subject,
          description: `Riesgo de no cumplir objetivos académicos en ${subject.subject}`,
          immediateActions: [
            'Planificar sesiones de recuperación',
            'Priorizar esta materia',
            'Buscar recursos adicionales'
          ],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 semanas
        })
      }
    })

    // Riesgo de burnout
    const totalHours = analysis.overview.totalStudyHours
    if (totalHours > 40) {
      risks.push({
        type: 'burnout_risk',
        severity: 'high',
        description: `Posible sobrecarga de estudio: ${totalHours} horas semanales`,
        immediateActions: [
          'Reducir carga de estudio',
          'Programar descansos regulares',
          'Evaluar eficiencia de métodos'
        ]
      })
    }

    return risks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  // Métodos auxiliares privados

  private static calculateOverview(context: StudentContext) {
    const subjects = context.subjectPerformances
    const totalSubjects = subjects.length
    const averageGrade = subjects.length > 0 
      ? subjects.reduce((sum, s) => sum + s.averageGrade, 0) / subjects.length 
      : 0

    // Distribución de calificaciones
    const gradeDistribution = subjects.reduce((acc, subject) => {
      const gradeRange = this.getGradeRange(subject.averageGrade)
      acc[gradeRange] = (acc[gradeRange] || 0) + 1
      return acc
    }, {} as { [grade: string]: number })

    // Tendencia general
    const overallTrend = this.calculateOverallTrend(subjects)

    return {
      totalSubjects,
      averageGrade: Math.round(averageGrade * 100) / 100,
      gradeDistribution,
      totalStudyHours: context.studyPatterns.weeklyStats.totalStudyHours,
      overallTrend
    }
  }

  private static analyzeTrend(subject: SubjectPerformance) {
    // Simular análisis de tendencia (en implementación real usaría historial de calificaciones)
    const baseGrade = subject.averageGrade
    const direction = baseGrade > 75 ? 'improving' : baseGrade < 65 ? 'declining' : 'stable'
    const rate = direction === 'improving' ? 2 : direction === 'declining' ? -3 : 0
    const confidence = 0.7

    return { direction, rate, confidence }
  }

  private static analyzeTimeInvestment(subject: SubjectPerformance, context: StudentContext) {
    const hoursPerWeek = subject.timeSpentWeekly
    const efficiency = hoursPerWeek > 0 ? subject.averageGrade / hoursPerWeek : 0
    
    // Comparar con promedio (simulado)
    const averageEfficiency = 12 // Promedio simulado
    const comparison = efficiency > averageEfficiency * 1.2 ? 'above_average' :
                      efficiency < averageEfficiency * 0.8 ? 'below_average' : 'average'

    return { hoursPerWeek, efficiency, comparison }
  }

  private static assessDifficulty(subject: SubjectPerformance) {
    const perceivedDifficulty = subject.difficultyLevel
    const actualPerformance = subject.averageGrade / 10 // Normalize to 1-10 scale
    const gap = perceivedDifficulty - actualPerformance

    return { perceivedDifficulty, actualPerformance, gap }
  }

  private static calculateLearningVelocity(subject: SubjectPerformance) {
    // Simulación de métricas de velocidad de aprendizaje
    const conceptsPerWeek = Math.max(1, 10 - subject.difficultyLevel)
    const retentionRate = Math.min(95, subject.averageGrade + 10)
    const masteryTime = subject.difficultyLevel * 2 // días promedio

    return { conceptsPerWeek, retentionRate, masteryTime }
  }

  private static performSWOTAnalysis(subject: SubjectPerformance, context: StudentContext) {
    const strengths = subject.strongTopics.length > 0 ? subject.strongTopics : ['Dedicación consistente']
    const weaknesses = subject.weakTopics.length > 0 ? subject.weakTopics : ['Necesita más práctica']
    
    const opportunities = [
      'Aplicar técnicas de estudio más efectivas',
      'Usar recursos digitales adicionales',
      'Formar grupos de estudio'
    ]
    
    const threats = subject.upcomingDeadlines.map(d => `${d.type} el ${d.date.toLocaleDateString()}`)

    return { strengths, weaknesses, opportunities, threats }
  }

  private static performComparativeAnalysis(metrics: PerformanceMetrics[]) {
    const sortedByGrade = [...metrics].sort((a, b) => b.currentGrade - a.currentGrade)
    const sortedByEfficiency = [...metrics].sort((a, b) => b.timeInvestment.efficiency - a.timeInvestment.efficiency)

    return {
      bestPerformingSubject: {
        subject: sortedByGrade[0]?.subject || 'N/A',
        grade: sortedByGrade[0]?.currentGrade || 0,
        reasons: sortedByGrade[0]?.strengths || []
      },
      mostChallengingSubject: {
        subject: sortedByGrade[sortedByGrade.length - 1]?.subject || 'N/A',
        grade: sortedByGrade[sortedByGrade.length - 1]?.currentGrade || 0,
        issues: sortedByGrade[sortedByGrade.length - 1]?.weaknesses || []
      },
      mostEfficientSubject: {
        subject: sortedByEfficiency[0]?.subject || 'N/A',
        efficiency: sortedByEfficiency[0]?.timeInvestment.efficiency || 0,
        strategies: ['Tiempo bien distribuido', 'Técnicas efectivas']
      },
      leastEfficientSubject: {
        subject: sortedByEfficiency[sortedByEfficiency.length - 1]?.subject || 'N/A',
        efficiency: sortedByEfficiency[sortedByEfficiency.length - 1]?.timeInvestment.efficiency || 0,
        improvements: ['Revisar métodos de estudio', 'Optimizar tiempo']
      }
    }
  }

  private static analyzeCorrelations(context: StudentContext, metrics: PerformanceMetrics[]) {
    // Simulación de análisis de correlación
    return {
      timeVsGrade: 0.65, // Correlación positiva moderada
      difficultyVsGrade: -0.45, // Correlación negativa moderada
      studyMethodEffectiveness: [
        {
          method: 'Práctica regular',
          effectiveness: 8.5,
          recommendedFor: ['Matemáticas', 'Física', 'Química']
        },
        {
          method: 'Resúmenes y mapas conceptuales',
          effectiveness: 7.8,
          recommendedFor: ['Historia', 'Biología', 'Literatura']
        },
        {
          method: 'Grupos de estudio',
          effectiveness: 6.9,
          recommendedFor: ['Idiomas', 'Filosofía']
        }
      ]
    }
  }

  private static generatePredictions(metrics: PerformanceMetrics[], context: StudentContext) {
    const nextWeekGrades: { [subject: string]: number } = {}
    const semesterProjections: { [subject: string]: number } = {}
    const riskAssessment: any[] = []

    metrics.forEach(metric => {
      // Predicción simple basada en tendencia
      const nextWeekChange = metric.trendAnalysis.rate * metric.trendAnalysis.confidence
      nextWeekGrades[metric.subject] = Math.max(0, Math.min(100, metric.currentGrade + nextWeekChange))
      
      // Proyección semestral (12 semanas)
      const semesterChange = nextWeekChange * 12
      semesterProjections[metric.subject] = Math.max(0, Math.min(100, metric.currentGrade + semesterChange))
      
      // Evaluación de riesgo
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const riskFactors: string[] = []
      const interventions: string[] = []

      if (semesterProjections[metric.subject] < 60) {
        riskLevel = 'critical'
        riskFactors.push('Proyección de calificación reprobatoria')
        interventions.push('Intervención académica inmediata')
      } else if (metric.trendAnalysis.direction === 'declining') {
        riskLevel = 'high'
        riskFactors.push('Tendencia declinante sostenida')
        interventions.push('Cambio de estrategia de estudio')
      }

      if (riskLevel !== 'low') {
        riskAssessment.push({
          subject: metric.subject,
          riskLevel,
          riskFactors,
          interventions
        })
      }
    })

    return { nextWeekGrades, semesterProjections, riskAssessment }
  }

  private static generateStrategicRecommendations(metrics: PerformanceMetrics[], context: StudentContext) {
    return {
      immediate: [
        'Revisar materias con calificación inferior a 70%',
        'Implementar técnica Pomodoro para mejor concentración',
        'Crear calendario de estudio semanal'
      ],
      shortTerm: [
        'Establecer objetivos SMART para cada materia',
        'Formar grupos de estudio para materias desafiantes',
        'Buscar recursos adicionales online'
      ],
      longTerm: [
        'Desarrollar hábitos de estudio sostenibles',
        'Crear sistema de repaso espaciado',
        'Evaluar y ajustar métodos de estudio semestralmente'
      ],
      strategic: [
        'Alinear tiempo de estudio con objetivos académicos',
        'Desarrollar especialización en áreas de fortaleza',
        'Planificar carrera académica basada en rendimiento'
      ]
    }
  }

  private static generateGradeHistory(subject: SubjectPerformance) {
    // Simulación de historial de calificaciones
    const history: Array<{ date: Date, grade: number, assessment: string }> = []
    const baseDate = new Date()
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setWeek(date.getWeek() - i)
      
      const variation = (Math.random() - 0.5) * 10
      const grade = Math.max(0, Math.min(100, subject.averageGrade + variation))
      
      history.push({
        date,
        grade: Math.round(grade),
        assessment: i === 0 ? 'Actual' : `Semana ${i}`
      })
    }
    
    return history
  }

  private static identifyBestEnvironments(context: StudentContext): string[] {
    // Basado en preferencias del estudiante
    const env = context.schedulePreferences.studyEnvironment
    const environments = [env.location]
    
    if (env.requiresQuiet) environments.push('biblioteca')
    if (env.allowsDigitalDevices) environments.push('casa con tecnología')
    
    return environments
  }

  private static identifyEffectiveTechniques(context: StudentContext) {
    // Simular identificación de técnicas efectivas
    return [
      {
        technique: 'Pomodoro',
        effectivenessScore: 8.5,
        applicableSubjects: ['Matemáticas', 'Programación']
      },
      {
        technique: 'Mapas mentales',
        effectivenessScore: 7.8,
        applicableSubjects: ['Historia', 'Biología']
      },
      {
        technique: 'Flashcards',
        effectivenessScore: 7.2,
        applicableSubjects: ['Idiomas', 'Vocabulario']
      }
    ]
  }

  private static getGradeRange(grade: number): string {
    if (grade >= 90) return 'A (90-100)'
    if (grade >= 80) return 'B (80-89)'
    if (grade >= 70) return 'C (70-79)'
    if (grade >= 60) return 'D (60-69)'
    return 'F (<60)'
  }

  private static calculateOverallTrend(subjects: SubjectPerformance[]): 'improving' | 'declining' | 'stable' {
    if (subjects.length === 0) return 'stable'
    
    const avgGrade = subjects.reduce((sum, s) => sum + s.averageGrade, 0) / subjects.length
    
    // Simulación simple de tendencia
    if (avgGrade > 80) return 'improving'
    if (avgGrade < 65) return 'declining'
    return 'stable'
  }
}

// Extensión de Date para funcionalidad de semanas
declare global {
  interface Date {
    getWeek(): number
    setWeek(week: number): void
  }
}

Date.prototype.getWeek = function() {
  const firstDayOfYear = new Date(this.getFullYear(), 0, 1)
  const pastDaysOfYear = (this.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

Date.prototype.setWeek = function(week: number) {
  const firstDayOfYear = new Date(this.getFullYear(), 0, 1)
  const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay()
  this.setTime(firstDayOfYear.getTime() + daysToAdd * 86400000)
}