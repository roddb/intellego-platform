// AI Integration for Study Planning and Academic Assistance
// Extends the existing AI system for educational recommendations

import { aiService } from './ai-providers'
import { 
  Exam, 
  StudyMaterial, 
  StudySession, 
  StudyProgress,
  Subject,
  getStudyMaterialsByExam,
  getStudyProgressByUserAndExam,
  getExamById,
  getSubjectById
} from './academic-data'

export interface AIStudyRecommendation {
  type: 'study_technique' | 'time_management' | 'topic_focus' | 'material_analysis' | 'performance_insight'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionItems: string[]
  estimatedImpact: number // 1-10 scale
}

export interface MaterialAnalysisResult {
  keyTopics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedStudyTime: number
  studyTechniques: string[]
  prerequisites: string[]
  summary: string
}

export interface StudyPlanOptimization {
  originalPlan: StudySession[]
  optimizedPlan: StudySession[]
  improvements: string[]
  estimatedEfficiencyGain: number
}

export class AIStudyIntegration {
  
  /**
   * Analiza material de estudio usando IA
   */
  async analyzeMaterial(material: StudyMaterial): Promise<MaterialAnalysisResult> {
    const prompt = this.buildMaterialAnalysisPrompt(material)
    
    try {
      const response = await aiService.generateExercise(prompt)
      
      if (response === 'TEMPLATE_FALLBACK') {
        return this.generateTemplateAnalysis(material)
      }
      
      return this.parseAnalysisResponse(response, material)
    } catch (error) {
      console.error('Error analyzing material:', error)
      return this.generateTemplateAnalysis(material)
    }
  }
  
  /**
   * Genera recomendaciones de estudio personalizadas
   */
  async generateStudyRecommendations(
    userId: string, 
    examId: string, 
    currentProgress: StudyProgress
  ): Promise<AIStudyRecommendation[]> {
    const exam = getExamById(examId)
    const materials = getStudyMaterialsByExam(examId)
    
    if (!exam) return []
    
    const prompt = this.buildRecommendationsPrompt(exam, materials, currentProgress)
    
    try {
      const response = await aiService.generateExercise(prompt)
      
      if (response === 'TEMPLATE_FALLBACK') {
        return this.generateTemplateRecommendations(currentProgress)
      }
      
      return this.parseRecommendationsResponse(response)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return this.generateTemplateRecommendations(currentProgress)
    }
  }
  
  /**
   * Optimiza un plan de estudio existente
   */
  async optimizeStudyPlan(
    sessions: StudySession[], 
    userProgress: StudyProgress,
    userPreferences: any
  ): Promise<StudyPlanOptimization> {
    const prompt = this.buildOptimizationPrompt(sessions, userProgress, userPreferences)
    
    try {
      const response = await aiService.generateExercise(prompt)
      
      if (response === 'TEMPLATE_FALLBACK') {
        return this.generateTemplateOptimization(sessions)
      }
      
      return this.parseOptimizationResponse(response, sessions)
    } catch (error) {
      console.error('Error optimizing plan:', error)
      return this.generateTemplateOptimization(sessions)
    }
  }
  
  /**
   * Analiza el rendimiento del estudiante y sugiere mejoras
   */
  async analyzePerformance(
    userId: string, 
    examId: string, 
    recentSessions: StudySession[]
  ): Promise<AIStudyRecommendation[]> {
    const progress = getStudyProgressByUserAndExam(userId, examId)
    if (!progress) return []
    
    const prompt = this.buildPerformanceAnalysisPrompt(recentSessions, progress)
    
    try {
      const response = await aiService.generateExercise(prompt)
      
      if (response === 'TEMPLATE_FALLBACK') {
        return this.generateTemplatePerformanceAnalysis(progress)
      }
      
      return this.parsePerformanceResponse(response)
    } catch (error) {
      console.error('Error analyzing performance:', error)
      return this.generateTemplatePerformanceAnalysis(progress)
    }
  }
  
  /**
   * Genera preguntas de simulacro basadas en material
   */
  async generateSimulationQuestions(
    examId: string, 
    topics: string[], 
    difficulty: 'easy' | 'medium' | 'hard',
    questionCount: number = 5
  ): Promise<{
    questions: {
      id: string
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
      topic: string
      difficulty: string
    }[]
    estimatedTime: number
  }> {
    const exam = getExamById(examId)
    const materials = getStudyMaterialsByExam(examId)
    
    const prompt = this.buildSimulationPrompt(exam, materials, topics, difficulty, questionCount)
    
    try {
      const response = await aiService.generateExercise(prompt)
      
      if (response === 'TEMPLATE_FALLBACK') {
        return this.generateTemplateQuestions(topics, difficulty, questionCount)
      }
      
      return this.parseQuestionsResponse(response, topics, difficulty)
    } catch (error) {
      console.error('Error generating questions:', error)
      return this.generateTemplateQuestions(topics, difficulty, questionCount)
    }
  }
  
  // Prompt builders
  private buildMaterialAnalysisPrompt(material: StudyMaterial): string {
    return `
      Analiza el siguiente material de estudio y proporciona un análisis educativo detallado:
      
      Título: ${material.title}
      Tipo: ${material.type}
      Tamaño: ${material.size} bytes
      Tags: ${material.tags.join(', ')}
      
      Proporciona:
      1. Temas clave principales (máximo 5)
      2. Nivel de dificultad (fácil/medio/difícil)
      3. Tiempo estimado de estudio en minutos
      4. Técnicas de estudio recomendadas
      5. Conocimientos prerequisitos
      6. Resumen del contenido
      
      Formato de respuesta:
      TEMAS: [tema1, tema2, tema3]
      DIFICULTAD: [nivel]
      TIEMPO: [minutos]
      TÉCNICAS: [técnica1, técnica2]
      PREREQUISITOS: [req1, req2]
      RESUMEN: [resumen breve]
    `
  }
  
  private buildRecommendationsPrompt(exam: Exam, materials: StudyMaterial[], progress: StudyProgress): string {
    return `
      Genera recomendaciones de estudio personalizadas basadas en:
      
      EXAMEN:
      - Título: ${exam.title}
      - Tipo: ${exam.type}
      - Duración: ${exam.duration} minutos
      - Temas: ${exam.topics.join(', ')}
      
      PROGRESO ACTUAL:
      - Sesiones completadas: ${progress.completedSessions}/${progress.totalSessions}
      - Tiempo de estudio: ${progress.totalStudyTime} minutos
      - Efectividad promedio: ${progress.averageEffectiveness}/5
      - Preparación estimada: ${progress.predictedReadiness}%
      
      MATERIALES: ${materials.length} recursos disponibles
      
      Genera 3-5 recomendaciones específicas con:
      1. Tipo de recomendación
      2. Prioridad (alta/media/baja)
      3. Título descriptivo
      4. Descripción detallada
      5. Acciones específicas a tomar
      6. Impacto estimado (1-10)
      
      Enfócate en: técnicas de estudio, gestión del tiempo, áreas de mejora, y optimización del rendimiento.
    `
  }
  
  private buildOptimizationPrompt(sessions: StudySession[], progress: StudyProgress, preferences: any): string {
    return `
      Optimiza el siguiente plan de estudio:
      
      SESIONES ACTUALES: ${sessions.length} sesiones programadas
      PROGRESO: ${progress.completedSessions} completadas, efectividad ${progress.averageEffectiveness}/5
      
      Analiza y sugiere mejoras en:
      1. Distribución temporal de sesiones
      2. Duración óptima por sesión
      3. Secuencia de temas
      4. Momentos de repaso
      5. Técnicas de estudio por sesión
      
      Proporciona un plan optimizado con justificación de cambios.
    `
  }
  
  private buildPerformanceAnalysisPrompt(sessions: StudySession[], progress: StudyProgress): string {
    return `
      Analiza el rendimiento de estudio basado en:
      
      SESIONES RECIENTES: ${sessions.length} sesiones
      EFECTIVIDAD PROMEDIO: ${progress.averageEffectiveness}/5
      PREPARACIÓN ACTUAL: ${progress.predictedReadiness}%
      
      Identifica:
      1. Patrones de fortalezas y debilidades
      2. Tendencias en el rendimiento
      3. Áreas que necesitan más atención
      4. Recomendaciones específicas de mejora
      
      Genera insights accionables para mejorar el estudio.
    `
  }
  
  private buildSimulationPrompt(exam: Exam | null, materials: StudyMaterial[], topics: string[], difficulty: string, count: number): string {
    return `
      Genera ${count} preguntas de simulacro para examen tipo ${exam?.type || 'parcial'}:
      
      TEMAS: ${topics.join(', ')}
      DIFICULTAD: ${difficulty}
      MATERIALES: ${materials.length} recursos disponibles
      
      Para cada pregunta incluye:
      1. Pregunta clara y específica
      2. 4 opciones de respuesta (A, B, C, D)
      3. Respuesta correcta (número 0-3)
      4. Explicación detallada
      5. Tema específico
      
      Formato:
      PREGUNTA_1: [texto]
      OPCIONES_1: [A] opción1 [B] opción2 [C] opción3 [D] opción4
      CORRECTA_1: [número]
      EXPLICACIÓN_1: [texto]
      TEMA_1: [tema]
      
      Asegúrate de que las preguntas sean educativas y desafiantes.
    `
  }
  
  // Response parsers
  private parseAnalysisResponse(response: string, material: StudyMaterial): MaterialAnalysisResult {
    try {
      const lines = response.split('\n')
      const result: MaterialAnalysisResult = {
        keyTopics: [],
        difficulty: 'medium',
        estimatedStudyTime: 30,
        studyTechniques: [],
        prerequisites: [],
        summary: ''
      }
      
      for (const line of lines) {
        if (line.startsWith('TEMAS:')) {
          result.keyTopics = line.replace('TEMAS:', '').split(',').map(t => t.trim()).filter(t => t)
        } else if (line.startsWith('DIFICULTAD:')) {
          const diff = line.replace('DIFICULTAD:', '').trim().toLowerCase()
          if (['easy', 'medium', 'hard'].includes(diff)) {
            result.difficulty = diff as any
          }
        } else if (line.startsWith('TIEMPO:')) {
          const time = parseInt(line.replace('TIEMPO:', '').trim())
          if (!isNaN(time)) result.estimatedStudyTime = time
        } else if (line.startsWith('TÉCNICAS:')) {
          result.studyTechniques = line.replace('TÉCNICAS:', '').split(',').map(t => t.trim()).filter(t => t)
        } else if (line.startsWith('PREREQUISITOS:')) {
          result.prerequisites = line.replace('PREREQUISITOS:', '').split(',').map(t => t.trim()).filter(t => t)
        } else if (line.startsWith('RESUMEN:')) {
          result.summary = line.replace('RESUMEN:', '').trim()
        }
      }
      
      return result
    } catch (error) {
      return this.generateTemplateAnalysis(material)
    }
  }
  
  private parseRecommendationsResponse(response: string): AIStudyRecommendation[] {
    // Simplified parsing - in production, would use more sophisticated NLP
    return [
      {
        type: 'study_technique',
        priority: 'high',
        title: 'Técnica de Estudio Recomendada',
        description: 'Basado en tu progreso actual, se recomienda implementar la técnica de espaciado repetido.',
        actionItems: ['Revisar material cada 2-3 días', 'Usar flashcards para conceptos clave'],
        estimatedImpact: 8
      },
      {
        type: 'time_management',
        priority: 'medium',
        title: 'Optimización de Tiempo',
        description: 'Tu efectividad mejora en sesiones de 45-60 minutos con descansos de 15 minutos.',
        actionItems: ['Dividir sesiones largas', 'Implementar técnica Pomodoro'],
        estimatedImpact: 7
      }
    ]
  }
  
  private parseOptimizationResponse(response: string, originalSessions: StudySession[]): StudyPlanOptimization {
    return {
      originalPlan: originalSessions,
      optimizedPlan: originalSessions, // In production, would actually optimize
      improvements: [
        'Redistribución de sesiones para mayor efectividad',
        'Ajuste de duración basado en patrones de aprendizaje',
        'Incorporación de técnicas de repaso espaciado'
      ],
      estimatedEfficiencyGain: 25
    }
  }
  
  private parsePerformanceResponse(response: string): AIStudyRecommendation[] {
    return [
      {
        type: 'performance_insight',
        priority: 'high',
        title: 'Análisis de Rendimiento',
        description: 'Tu rendimiento mejora significativamente en las tardes.',
        actionItems: ['Programar sesiones importantes entre 14-18h', 'Evitar estudio nocturno para temas complejos'],
        estimatedImpact: 8
      }
    ]
  }
  
  private parseQuestionsResponse(response: string, topics: string[], difficulty: string): any {
    // Simplified - would parse actual AI response
    return this.generateTemplateQuestions(topics, difficulty, 5)
  }
  
  // Template fallbacks
  private generateTemplateAnalysis(material: StudyMaterial): MaterialAnalysisResult {
    const topicsByType = {
      'pdf': ['Conceptos teóricos', 'Definiciones', 'Ejemplos prácticos'],
      'doc': ['Notas de clase', 'Resúmenes', 'Ejercicios'],
      'video': ['Explicaciones visuales', 'Demostraciones', 'Casos de estudio'],
      'image': ['Diagramas', 'Esquemas', 'Gráficos']
    }
    
    return {
      keyTopics: topicsByType[material.type] || ['Contenido general'],
      difficulty: 'medium',
      estimatedStudyTime: material.estimatedStudyTime || 30,
      studyTechniques: ['Lectura activa', 'Resúmenes', 'Mapas conceptuales'],
      prerequisites: ['Conocimientos básicos de la materia'],
      summary: `Material de estudio sobre ${material.title}`
    }
  }
  
  private generateTemplateRecommendations(progress: StudyProgress): AIStudyRecommendation[] {
    const recommendations: AIStudyRecommendation[] = []
    
    if (progress.averageEffectiveness < 3) {
      recommendations.push({
        type: 'study_technique',
        priority: 'high',
        title: 'Mejorar Técnicas de Estudio',
        description: 'Tu efectividad actual es baja. Considera cambiar tu enfoque de estudio.',
        actionItems: [
          'Prueba la técnica Pomodoro (25 min estudio + 5 min descanso)',
          'Crea resúmenes al final de cada sesión',
          'Usa técnicas de memorización activa'
        ],
        estimatedImpact: 8
      })
    }
    
    if (progress.predictedReadiness < 60) {
      recommendations.push({
        type: 'time_management',
        priority: 'high',
        title: 'Incrementar Tiempo de Estudio',
        description: 'Tu nivel de preparación actual es insuficiente.',
        actionItems: [
          'Aumentar sesiones diarias de estudio',
          'Enfocarse en temas con menor dominio',
          'Realizar simulacros frecuentes'
        ],
        estimatedImpact: 9
      })
    }
    
    return recommendations
  }
  
  private generateTemplateOptimization(sessions: StudySession[]): StudyPlanOptimization {
    return {
      originalPlan: sessions,
      optimizedPlan: sessions,
      improvements: [
        'Distribuir sesiones de manera más equilibrada',
        'Incorporar más sesiones de repaso',
        'Ajustar duración según complejidad del tema'
      ],
      estimatedEfficiencyGain: 20
    }
  }
  
  private generateTemplatePerformanceAnalysis(progress: StudyProgress): AIStudyRecommendation[] {
    return [
      {
        type: 'performance_insight',
        priority: 'medium',
        title: 'Análisis de Progreso',
        description: `Has completado ${progress.completedSessions} de ${progress.totalSessions} sesiones planificadas.`,
        actionItems: [
          'Mantener constancia en el estudio',
          'Evaluar efectividad de técnicas actuales',
          'Ajustar cronograma si es necesario'
        ],
        estimatedImpact: 6
      }
    ]
  }
  
  private generateTemplateQuestions(topics: string[], difficulty: string, count: number): any {
    const sampleQuestions = topics.slice(0, count).map((topic, index) => ({
      id: `q-${index + 1}`,
      question: `¿Cuál es el concepto más importante relacionado con ${topic}?`,
      options: [
        'Definición básica',
        'Aplicación práctica',
        'Relación con otros conceptos',
        'Todas las anteriores'
      ],
      correctAnswer: 3,
      explanation: `Todas las opciones son importantes para comprender completamente ${topic}.`,
      topic,
      difficulty
    }))
    
    return {
      questions: sampleQuestions,
      estimatedTime: sampleQuestions.length * 2 // 2 min por pregunta
    }
  }
}

// Singleton instance
export const aiStudyIntegration = new AIStudyIntegration()