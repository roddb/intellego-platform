// Procesador de Comandos Naturales Avanzados para Sara
// Integra todos los sistemas para procesamiento inteligente de comandos complejos

import { StudentContext, StudentContextManager } from './student-context'
import { AdvancedIntentEngine, IntentType, ConversationMode } from './advanced-intent-engine'
import { SchoolScheduleManager } from './school-schedule-manager'
import { StudySessionPlanner, StudyPlan } from './study-session-planner'
import { SaraPersonalityEngine } from './sara-personality'
import { AICalendarIntegration } from './calendar-ai-integration'

export interface CommandResult {
  success: boolean
  type: 'information' | 'action' | 'planning' | 'analysis' | 'error'
  title: string
  message: string
  data?: any
  suggestedActions?: string[]
  followUpQuestions?: string[]
  visualizations?: {
    type: 'chart' | 'calendar' | 'timeline' | 'table'
    data: any
  }[]
}

export interface CommandContext {
  userId: string
  userName?: string
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
  currentMode: ConversationMode
  lastCommands: string[]
}

export class AdvancedCommandProcessor {

  /**
   * Procesa un comando natural del usuario integrando todos los sistemas
   */
  static async processCommand(
    command: string, 
    context: CommandContext
  ): Promise<CommandResult> {
    
    try {
      // Obtener contexto del estudiante
      const studentContext = await StudentContextManager.getContext(context.userId)
      if (!studentContext) {
        return this.createErrorResult('No se pudo cargar el contexto del estudiante')
      }

      // Analizar intención del comando
      const intentAnalysis = await AdvancedIntentEngine.analyzeIntent(
        command, 
        context.userId, 
        studentContext
      )

      // Procesar según la intención detectada
      switch (intentAnalysis.intent) {
        case IntentType.SCHEDULE_MANAGEMENT:
          return await this.processScheduleManagement(command, intentAnalysis, studentContext)
        
        case IntentType.STUDY_PLANNING:
          return await this.processStudyPlanning(command, intentAnalysis, studentContext)
        
        case IntentType.CALENDAR_MANAGEMENT:
          return await this.processCalendarManagement(command, intentAnalysis, studentContext)
        
        case IntentType.TIME_OPTIMIZATION:
          return await this.processTimeOptimization(command, intentAnalysis, studentContext)
        
        case IntentType.MATERIAL_REQUEST:
          return await this.processMaterialRequest(command, intentAnalysis, studentContext)
        
        case IntentType.PROGRESS_REVIEW:
          return await this.processProgressReview(command, intentAnalysis, studentContext)
        
        case IntentType.PERFORMANCE_ANALYSIS:
          return await this.processPerformanceAnalysis(command, intentAnalysis, studentContext)
        
        case IntentType.GOAL_MANAGEMENT:
          return await this.processGoalManagement(command, intentAnalysis, studentContext)
        
        case IntentType.PREFERENCE_SETTING:
          return await this.processPreferenceSetting(command, intentAnalysis, studentContext)
        
        case IntentType.MOTIVATIONAL_SUPPORT:
          return await this.processMotivationalSupport(command, intentAnalysis, studentContext)
        
        default:
          return await this.processGeneralQuery(command, intentAnalysis, studentContext)
      }
      
    } catch (error) {
      console.error('Error processing command:', error)
      return this.createErrorResult(`Error procesando comando: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Procesa comandos de gestión de horarios
   */
  private static async processScheduleManagement(
    command: string,
    analysis: any,
    context: StudentContext
  ): Promise<CommandResult> {
    
    const commandLower = command.toLowerCase()

    // Importar horario
    if (commandLower.includes('importa') || commandLower.includes('agrega') && commandLower.includes('horario')) {
      return await this.handleScheduleImport(command, context)
    }

    // Analizar horario existente
    if (commandLower.includes('analiza') && commandLower.includes('horario')) {
      return await this.handleScheduleAnalysis(context)
    }

    // Optimizar horario
    if (commandLower.includes('optimiza') || commandLower.includes('mejora')) {
      return await this.handleScheduleOptimization(context)
    }

    // Mostrar horario
    if (commandLower.includes('muestra') || commandLower.includes('ver') && commandLower.includes('horario')) {
      return await this.handleShowSchedule(context)
    }

    return this.createInfoResult(
      'Gestión de Horarios',
      'No pude identificar la acción específica. ¿Quieres importar, analizar, optimizar o ver tu horario?',
      {
        availableActions: [
          'Importar horario escolar',
          'Analizar horario actual',
          'Optimizar distribución de tiempo',
          'Ver horario completo'
        ]
      }
    )
  }

  /**
   * Procesa comandos de planificación de estudio
   */
  private static async processStudyPlanning(
    command: string,
    analysis: any,
    context: StudentContext
  ): Promise<CommandResult> {
    
    const commandLower = command.toLowerCase()

    // Crear plan de estudio
    if (commandLower.includes('crea') || commandLower.includes('planifica') || commandLower.includes('genera')) {
      return await this.handleCreateStudyPlan(command, analysis, context)
    }

    // Modificar plan existente
    if (commandLower.includes('modifica') || commandLower.includes('ajusta') || commandLower.includes('cambia')) {
      return await this.handleModifyStudyPlan(command, context)
    }

    // Sugerir sesiones
    if (commandLower.includes('sugiere') || commandLower.includes('recomienda')) {
      return await this.handleSuggestStudySessions(command, analysis, context)
    }

    return this.createInfoResult(
      'Planificación de Estudio',
      'Puedo ayudarte a crear planes de estudio personalizados. ¿Qué período quieres planificar?',
      {
        suggestions: [
          'Esta semana',
          'Próximos 15 días',
          'Hasta el próximo examen',
          'Todo el mes'
        ]
      }
    )
  }

  /**
   * Maneja la importación de horarios
   */
  private static async handleScheduleImport(command: string, context: StudentContext): Promise<CommandResult> {
    try {
      // Extraer texto del horario del comando
      const scheduleText = this.extractScheduleText(command)
      
      if (!scheduleText) {
        return this.createInfoResult(
          'Importar Horario',
          'Por favor, proporciona los detalles de tu horario. Ejemplo: "Lunes 8:00-9:30 Matemáticas Aula 101, Martes 10:00-11:30 Física Lab 205"',
          {},
          ['Proporcionar horario detallado', 'Ver ejemplo de formato']
        )
      }

      // Procesar horario
      const parsedClasses = SchoolScheduleManager.parseNaturalLanguageSchedule(scheduleText)
      
      if (parsedClasses.length === 0) {
        return this.createErrorResult('No pude extraer clases del texto proporcionado. Verifica el formato.')
      }

      // Importar horario
      const importResult = await SchoolScheduleManager.importSchedule(
        context.userId,
        { classes: parsedClasses },
        'manual'
      )

      // Detectar conflictos
      const conflicts = SchoolScheduleManager.detectScheduleConflicts(parsedClasses)
      const studySlots = SchoolScheduleManager.analyzeStudyTimeSlots(parsedClasses)

      return this.createActionResult(
        'Horario Importado Exitosamente',
        `✅ He importado ${parsedClasses.length} clases a tu horario.\n\n📊 **Análisis:**\n- ${conflicts.length} conflicto(s) detectado(s)\n- ${studySlots.length} slot(s) de tiempo libre encontrado(s)\n- ${Math.round(parsedClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60)} horas semanales de clase`,
        {
          importedClasses: parsedClasses.length,
          conflicts: conflicts,
          studySlots: studySlots,
          totalHours: parsedClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60
        },
        conflicts.length > 0 ? ['Resolver conflictos', 'Ver análisis completo'] : ['Planificar sesiones de estudio', 'Ver calendario optimizado'],
        ['¿Quieres que planifique sesiones de estudio en los tiempos libres?', '¿Te ayudo a resolver los conflictos detectados?']
      )

    } catch (error) {
      return this.createErrorResult(`Error importando horario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Maneja el análisis de horarios
   */
  private static async handleScheduleAnalysis(context: StudentContext): Promise<CommandResult> {
    if (!context.academicCalendar.schoolSchedule.length) {
      return this.createInfoResult(
        'Análisis de Horario',
        'No tienes un horario escolar configurado. Primero importa tu horario para poder analizarlo.',
        {},
        ['Importar horario escolar', 'Ver formato de importación']
      )
    }

    // Convertir a formato SchoolClass para análisis
    const classes = context.academicCalendar.schoolSchedule.map(schedule => ({
      id: `class_${schedule.subject}_${schedule.day}`,
      subject: schedule.subject,
      teacher: schedule.teacher,
      classroom: schedule.classroom,
      day: schedule.day as any,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: this.calculateDuration(schedule.startTime, schedule.endTime),
      type: 'lecture' as const,
      recurring: true
    }))

    const conflicts = SchoolScheduleManager.detectScheduleConflicts(classes)
    const studySlots = SchoolScheduleManager.analyzeStudyTimeSlots(classes)
    
    // Calcular estadísticas
    const totalHours = classes.reduce((sum, cls) => sum + cls.duration, 0) / 60
    const dailyDistribution = this.calculateDailyDistribution(classes)
    const subjectDistribution = this.calculateSubjectDistribution(classes)

    const analysis = {
      totalClasses: classes.length,
      totalHours,
      averageHoursPerDay: totalHours / 5,
      conflicts: conflicts.length,
      availableStudySlots: studySlots.length,
      freeHours: studySlots.reduce((sum, slot) => sum + slot.duration, 0) / 60,
      dailyDistribution,
      subjectDistribution
    }

    let message = `📊 **Análisis de tu Horario Académico:**\n\n`
    message += `📚 **Resumen General:**\n`
    message += `• ${analysis.totalClasses} clases semanales\n`
    message += `• ${analysis.totalHours.toFixed(1)} horas académicas por semana\n`
    message += `• ${analysis.averageHoursPerDay.toFixed(1)} horas promedio por día\n\n`

    if (conflicts.length > 0) {
      message += `⚠️ **Conflictos Detectados:** ${conflicts.length}\n`
      conflicts.slice(0, 3).forEach(conflict => {
        message += `• ${conflict.description}\n`
      })
      message += `\n`
    }

    message += `⏰ **Tiempo Libre para Estudio:**\n`
    message += `• ${analysis.availableStudySlots} slots disponibles\n`
    message += `• ${analysis.freeHours.toFixed(1)} horas libres por semana\n\n`

    const recommendations = this.generateScheduleRecommendations(analysis, conflicts)
    if (recommendations.length > 0) {
      message += `💡 **Recomendaciones:**\n`
      recommendations.forEach(rec => message += `• ${rec}\n`)
    }

    return this.createAnalysisResult(
      'Análisis de Horario Completo',
      message,
      analysis,
      ['Planificar sesiones de estudio', 'Optimizar horario', 'Resolver conflictos'],
      ['¿Quieres que cree un plan de estudio basado en tu tiempo libre?']
    )
  }

  /**
   * Maneja la creación de planes de estudio
   */
  private static async handleCreateStudyPlan(
    command: string,
    analysis: any,
    context: StudentContext
  ): Promise<CommandResult> {
    
    // Extraer período de planificación del comando
    const period = this.extractPlanningPeriod(command)
    
    // Extraer materias específicas si se mencionan
    const subjects = analysis.entities.subjects || []
    
    try {
      // Generar plan de estudio
      const studyPlan = await StudySessionPlanner.generateStudyPlan(
        context,
        period,
        {
          prioritizeWeakSubjects: true,
          includeReviewSessions: true,
          respectEnergyLevels: true
        }
      )

      let message = `📋 **Plan de Estudio Creado: "${studyPlan.title}"**\n\n`
      message += `📅 **Período:** ${period.startDate.toLocaleDateString('es-ES')} - ${period.endDate.toLocaleDateString('es-ES')}\n`
      message += `🎯 **Sesiones Planificadas:** ${studyPlan.totalSessions}\n`
      message += `⏱️ **Horas Totales:** ${studyPlan.metrics.totalPlannedHours.toFixed(1)}h\n`
      message += `📚 **Materias:** ${studyPlan.subjects.join(', ')}\n\n`

      // Mostrar próximas sesiones
      const upcomingSessions = studyPlan.sessions
        .filter(session => session.date >= new Date())
        .slice(0, 5)
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      if (upcomingSessions.length > 0) {
        message += `📝 **Próximas Sesiones:**\n`
        upcomingSessions.forEach(session => {
          message += `• ${session.date.toLocaleDateString('es-ES')} ${session.startTime} - ${session.subject}: ${session.topic} (${session.duration}min)\n`
        })
        message += `\n`
      }

      // Distribución por materia
      message += `📊 **Distribución por Materia:**\n`
      Object.entries(studyPlan.metrics.subjectBalance).forEach(([subject, hours]) => {
        message += `• ${subject}: ${(hours as number).toFixed(1)}h\n`
      })

      return this.createPlanningResult(
        'Plan de Estudio Generado',
        message,
        studyPlan,
        ['Ver calendario completo', 'Ajustar plan', 'Comenzar primera sesión'],
        ['¿Quieres que ajuste alguna sesión específica?', '¿Te parece bien la distribución de materias?']
      )

    } catch (error) {
      return this.createErrorResult(`Error creando plan de estudio: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Maneja la revisión de progreso
   */
  private static async processProgressReview(
    command: string,
    analysis: any,
    context: StudentContext
  ): Promise<CommandResult> {
    
    const progressData = this.calculateProgressMetrics(context)
    const insights = this.generateProgressInsights(progressData, context)
    
    let message = `📈 **Revisión de tu Progreso Académico:**\n\n`
    
    // Progreso general
    message += `🎯 **Objetivos Activos:**\n`
    if (context.currentGoals.length > 0) {
      context.currentGoals.slice(0, 5).forEach(goal => {
        message += `• ${goal.title}: ${goal.progress}% completado\n`
      })
    } else {
      message += `• No tienes objetivos definidos actualmente\n`
    }
    message += `\n`

    // Rendimiento por materia
    if (context.subjectPerformances.length > 0) {
      message += `📚 **Rendimiento por Materia:**\n`
      const sortedSubjects = context.subjectPerformances
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, 5)
      
      sortedSubjects.forEach(subject => {
        const emoji = subject.averageGrade >= 85 ? '🟢' : subject.averageGrade >= 70 ? '🟡' : '🔴'
        message += `${emoji} ${subject.subject}: ${subject.averageGrade}% promedio\n`
      })
      message += `\n`
    }

    // Patrones de estudio
    message += `⏱️ **Patrones de Estudio:**\n`
    message += `• Horas semanales: ${context.studyPatterns.weeklyStats.totalStudyHours.toFixed(1)}h\n`
    message += `• Nivel de enfoque promedio: ${context.studyPatterns.weeklyStats.averageFocusScore}/10\n`
    message += `• Momentos más productivos: ${context.studyPatterns.patterns.mostProductiveHours.slice(0, 3).join(', ')}\n\n`

    // Insights y recomendaciones
    if (insights.recommendations.length > 0) {
      message += `💡 **Recomendaciones:**\n`
      insights.recommendations.slice(0, 4).forEach(rec => {
        message += `• ${rec}\n`
      })
    }

    return this.createAnalysisResult(
      'Análisis de Progreso',
      message,
      progressData,
      ['Establecer nuevos objetivos', 'Ajustar plan de estudio', 'Ver análisis detallado'],
      ['¿En qué área específica te gustaría mejorar?', '¿Quieres que ajuste tu plan de estudio actual?']
    )
  }

  // Funciones auxiliares

  private static extractScheduleText(command: string): string {
    // Extraer texto después de palabras clave como "importa", "horario:", etc.
    const patterns = [
      /horario[:\s]+(.+)/i,
      /importa[:\s]+(.+)/i,
      /clases[:\s]+(.+)/i
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    // Si no hay patrones específicos, asumir que todo el comando es el horario
    const keywords = ['importa', 'agrega', 'horario', 'clases']
    const hasKeyword = keywords.some(keyword => command.toLowerCase().includes(keyword))
    
    if (hasKeyword) {
      // Remover palabras clave y retornar el resto
      let cleanCommand = command
      keywords.forEach(keyword => {
        cleanCommand = cleanCommand.replace(new RegExp(keyword, 'gi'), '')
      })
      return cleanCommand.trim()
    }

    return command
  }

  private static extractPlanningPeriod(command: string): { startDate: Date, endDate: Date } {
    const today = new Date()
    const commandLower = command.toLowerCase()

    if (commandLower.includes('semana')) {
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 7)
      return { startDate: today, endDate }
    }

    if (commandLower.includes('mes')) {
      const endDate = new Date(today)
      endDate.setMonth(today.getMonth() + 1)
      return { startDate: today, endDate }
    }

    if (commandLower.includes('15') || commandLower.includes('quince')) {
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 15)
      return { startDate: today, endDate }
    }

    // Por defecto: una semana
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 7)
    return { startDate: today, endDate }
  }

  private static calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime)
    const end = this.timeToMinutes(endTime)
    return end - start
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private static calculateDailyDistribution(classes: any[]): { [day: string]: number } {
    return classes.reduce((acc, cls) => {
      acc[cls.day] = (acc[cls.day] || 0) + cls.duration / 60
      return acc
    }, {} as { [day: string]: number })
  }

  private static calculateSubjectDistribution(classes: any[]): { [subject: string]: number } {
    return classes.reduce((acc, cls) => {
      acc[cls.subject] = (acc[cls.subject] || 0) + cls.duration / 60
      return acc
    }, {} as { [subject: string]: number })
  }

  private static generateScheduleRecommendations(analysis: any, conflicts: any[]): string[] {
    const recommendations: string[] = []

    if (conflicts.length > 0) {
      recommendations.push('Resolver conflictos de horario detectados')
    }

    if (analysis.averageHoursPerDay > 7) {
      recommendations.push('Considerar reducir la carga académica diaria')
    }

    if (analysis.freeHours < 10) {
      recommendations.push('Buscar más tiempo libre para estudio personal')
    }

    if (analysis.freeHours > 25) {
      recommendations.push('Aprovechar el tiempo libre abundante para actividades extracurriculares')
    }

    return recommendations
  }

  private static calculateProgressMetrics(context: StudentContext): any {
    const totalGoals = context.currentGoals.length
    const completedGoals = context.currentGoals.filter(g => g.progress >= 100).length
    const avgGoalProgress = totalGoals > 0 
      ? context.currentGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals 
      : 0

    const avgGrade = context.subjectPerformances.length > 0
      ? context.subjectPerformances.reduce((sum, s) => sum + s.averageGrade, 0) / context.subjectPerformances.length
      : 0

    return {
      goalCompletionRate: completedGoals / Math.max(totalGoals, 1) * 100,
      averageGoalProgress: avgGoalProgress,
      averageGrade: avgGrade,
      totalStudyHours: context.studyPatterns.weeklyStats.totalStudyHours,
      focusScore: context.studyPatterns.weeklyStats.averageFocusScore
    }
  }

  private static generateProgressInsights(progressData: any, context: StudentContext): { recommendations: string[] } {
    const recommendations: string[] = []

    if (progressData.goalCompletionRate < 50) {
      recommendations.push('Revisar y ajustar objetivos para que sean más alcanzables')
    }

    if (progressData.averageGrade < 75) {
      recommendations.push('Incrementar tiempo de estudio en materias con menor rendimiento')
    }

    if (progressData.totalStudyHours < 10) {
      recommendations.push('Aumentar gradualmente las horas de estudio semanales')
    }

    if (progressData.focusScore < 6) {
      recommendations.push('Implementar técnicas de mejora de concentración')
    }

    return { recommendations }
  }

  // Métodos auxiliares para crear resultados

  private static createInfoResult(
    title: string, 
    message: string, 
    data?: any, 
    actions?: string[], 
    questions?: string[]
  ): CommandResult {
    return {
      success: true,
      type: 'information',
      title,
      message,
      data,
      suggestedActions: actions,
      followUpQuestions: questions
    }
  }

  private static createActionResult(
    title: string, 
    message: string, 
    data?: any, 
    actions?: string[], 
    questions?: string[]
  ): CommandResult {
    return {
      success: true,
      type: 'action',
      title,
      message,
      data,
      suggestedActions: actions,
      followUpQuestions: questions
    }
  }

  private static createPlanningResult(
    title: string, 
    message: string, 
    data?: any, 
    actions?: string[], 
    questions?: string[]
  ): CommandResult {
    return {
      success: true,
      type: 'planning',
      title,
      message,
      data,
      suggestedActions: actions,
      followUpQuestions: questions
    }
  }

  private static createAnalysisResult(
    title: string, 
    message: string, 
    data?: any, 
    actions?: string[], 
    questions?: string[]
  ): CommandResult {
    return {
      success: true,
      type: 'analysis',
      title,
      message,
      data,
      suggestedActions: actions,
      followUpQuestions: questions
    }
  }

  private static createErrorResult(message: string): CommandResult {
    return {
      success: false,
      type: 'error',
      title: 'Error',
      message
    }
  }

  // Métodos de procesamiento adicionales (implementación básica)

  private static async processCalendarManagement(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    console.log('📅 Processing calendar management command:', command)
    
    // Integrar con AICalendarIntegration existente
    const calendarIntegration = new AICalendarIntegration(context.userId)
    const result = await calendarIntegration.processMessage(command, [])
    
    console.log('📅 Calendar integration result:', { 
      needsEventCreation: result.needsEventCreation, 
      eventCreated: !!result.event,
      response: result.response?.substring(0, 100) 
    })
    
    if (result.needsEventCreation || result.event) {
      // Si se creó un evento o se necesita crear uno, considerarlo éxito
      return this.createActionResult(
        'Gestión de Calendario',
        result.response || 'Evento de calendario procesado exitosamente',
        result.event,
        result.event ? ['Ver en calendario', 'Editar evento', 'Eliminar evento'] : ['Ver calendario', 'Agregar más eventos'],
        result.event ? ['¿Necesitas modificar algún detalle del evento?'] : ['¿Necesitas programar algún evento adicional?']
      )
    }
    
    // Si no se detectó una acción de calendario, devolver el resultado tal como está
    return this.createInfoResult(
      'Información de Calendario',
      result.response || 'No se detectó una acción específica de calendario',
      {},
      ['Ver próximos eventos', 'Agregar evento'],
      ['¿Qué evento te gustaría agendar?', '¿Necesitas ver tu calendario?']
    )
  }

  private static async processTimeOptimization(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createInfoResult(
      'Optimización de Tiempo',
      'Analizando tu horario para encontrar las mejores oportunidades de optimización...',
      {},
      ['Analizar horario actual', 'Sugerir mejoras'],
      ['¿En qué área específica quieres optimizar tu tiempo?']
    )
  }

  private static async processMaterialRequest(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createInfoResult(
      'Gestión de Materiales',
      'Te ayudo a organizar y encontrar materiales de estudio.',
      {},
      ['Buscar recursos', 'Organizar materiales'],
      ['¿Para qué materia necesitas materiales?']
    )
  }

  private static async processPerformanceAnalysis(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createAnalysisResult(
      'Análisis de Rendimiento',
      'Analizando tu rendimiento académico...',
      {},
      ['Ver detalles por materia', 'Generar reporte'],
      ['¿Quieres enfocarnos en alguna materia específica?']
    )
  }

  private static async processGoalManagement(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createPlanningResult(
      'Gestión de Objetivos',
      'Te ayudo a establecer y seguir tus objetivos académicos.',
      {},
      ['Crear nuevo objetivo', 'Revisar progreso'],
      ['¿Qué objetivo académico quieres establecer?']
    )
  }

  private static async processPreferenceSetting(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createInfoResult(
      'Configuración de Preferencias',
      'Configurando tus preferencias de estudio y aprendizaje.',
      {},
      ['Actualizar preferencias', 'Ver configuración actual'],
      ['¿Qué aspecto de tus preferencias quieres modificar?']
    )
  }

  private static async processMotivationalSupport(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    const supportMessage = SaraPersonalityEngine.selectResponse('motivation', context)
    
    return this.createInfoResult(
      'Apoyo Motivacional',
      supportMessage,
      {},
      ['Planificar sesión de estudio', 'Establecer objetivos pequeños'],
      ['¿Hay algo específico que te está preocupando?', '¿Quieres que planifiquemos juntos tu próxima sesión de estudio?']
    )
  }

  private static async processGeneralQuery(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createInfoResult(
      'Consulta General',
      'Entiendo tu consulta. ¿Podrías ser más específico sobre cómo puedo ayudarte?',
      {},
      ['Gestionar horario', 'Planificar estudio', 'Analizar progreso'],
      ['¿Necesitas ayuda con organización, planificación o análisis académico?']
    )
  }

  private static async handleScheduleOptimization(context: StudentContext): Promise<CommandResult> {
    return this.createPlanningResult(
      'Optimización de Horario',
      'Analizando tu horario para sugerir optimizaciones...',
      {},
      ['Aplicar optimizaciones', 'Ver análisis detallado'],
      ['¿Prefieres optimizar para más tiempo libre o mejor distribución de materias?']
    )
  }

  private static async handleShowSchedule(context: StudentContext): Promise<CommandResult> {
    return this.createInfoResult(
      'Tu Horario Académico',
      'Mostrando tu horario completo...',
      { schedule: context.academicCalendar.schoolSchedule },
      ['Analizar horario', 'Optimizar tiempo'],
      ['¿Quieres que analice tu horario o que planifique sesiones de estudio?']
    )
  }

  private static async handleModifyStudyPlan(command: string, context: StudentContext): Promise<CommandResult> {
    return this.createPlanningResult(
      'Modificar Plan de Estudio',
      'Te ayudo a ajustar tu plan de estudio actual.',
      {},
      ['Ver plan actual', 'Hacer cambios específicos'],
      ['¿Qué aspecto del plan quieres modificar?']
    )
  }

  private static async handleSuggestStudySessions(command: string, analysis: any, context: StudentContext): Promise<CommandResult> {
    return this.createPlanningResult(
      'Sugerencias de Sesiones',
      'Basándome en tu contexto, te sugiero estas sesiones de estudio...',
      {},
      ['Programar sesiones', 'Ajustar sugerencias'],
      ['¿Quieres que programe estas sesiones en tu calendario?']
    )
  }
}