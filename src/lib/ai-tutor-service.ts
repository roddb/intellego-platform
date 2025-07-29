import { tempWeeklyReports, findUserById } from './temp-storage'

// Exercise types based on difficulty levels
export enum ExerciseType {
  BASIC_CONCEPTS = 'basic_concepts',
  PROBLEM_SOLVING = 'problem_solving',
  CRITICAL_THINKING = 'critical_thinking',
  APPLICATION = 'application',
  REFLECTION = 'reflection'
}

export enum Subject {
  MATHEMATICS = 'mathematics',
  PROGRAMMING = 'programming',
  SCIENCE = 'science',
  LANGUAGE = 'language',
  GENERAL = 'general'
}

export enum Difficulty {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4
}

export interface Exercise {
  id: string
  title: string
  description: string
  type: ExerciseType
  subject: Subject
  difficulty: Difficulty
  question: string
  options?: string[] // For multiple choice
  correctAnswer?: string
  explanation: string
  hints: string[]
  estimatedTime: number // in minutes
  tags: string[]
  createdAt: Date
}

export interface StudentAnalysis {
  userId: string
  strengths: string[]
  weaknesses: string[]
  preferredDifficulty: Difficulty
  recentPerformance: number // 0-100
  recommendedSubjects: Subject[]
  learningPattern: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
  progressTrend: 'improving' | 'stable' | 'declining'
}

// Exercise templates are now imported from external file

export class AITutorService {
  // Analyze student progress and generate personalized insights
  static async analyzeStudent(userId: string): Promise<StudentAnalysis> {
    const reports = tempWeeklyReports.filter(report => report.userId === userId)
    
    if (reports.length === 0) {
      return {
        userId,
        strengths: ["Nuevo estudiante con potencial por descubrir"],
        weaknesses: ["Falta de datos históricos"],
        preferredDifficulty: Difficulty.BEGINNER,
        recentPerformance: 50,
        recommendedSubjects: [Subject.GENERAL],
        learningPattern: 'mixed',
        progressTrend: 'stable'
      }
    }

    // Analyze recent reports (last 4 weeks)
    const recentReports = reports.slice(-4)
    
    // Analyze content from responses
    const allResponseText = recentReports.flatMap(report => 
      Object.values(report.responses || {}).filter(Boolean)
    ).join(' ').toLowerCase()
    
    // Calculate performance based on content length and keywords
    const scores = recentReports.map(report => {
      const responseValues = Object.values(report.responses || {}).filter(Boolean)
      const totalLength = responseValues.join('').length
      const detailScore = Math.min(100, totalLength / 10) // More detailed responses = higher score
      
      // Look for positive indicators
      const positiveWords = ['logré', 'entendí', 'aprendí', 'mejoré', 'completé', 'éxito']
      const negativeWords = ['difícil', 'problema', 'confuso', 'error', 'fallo']
      
      const positiveCount = positiveWords.reduce((count, word) => 
        count + (allResponseText.includes(word) ? 1 : 0), 0)
      const negativeCount = negativeWords.reduce((count, word) => 
        count + (allResponseText.includes(word) ? 1 : 0), 0)
      
      return Math.max(0, Math.min(100, detailScore + positiveCount * 10 - negativeCount * 5))
    })
    
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50
    const trend = scores.length > 1 
      ? scores[scores.length - 1] > scores[0] ? 'improving' : 
        scores[scores.length - 1] < scores[0] ? 'declining' : 'stable'
      : 'stable'

    // Determine strengths and weaknesses from content analysis
    const commonStrengths = this.extractStrengthsFromText(allResponseText)
    const commonWeaknesses = this.extractWeaknessesFromText(allResponseText)
    
    // Determine difficulty level based on performance
    let difficulty: Difficulty
    if (avgScore >= 80) difficulty = Difficulty.ADVANCED
    else if (avgScore >= 60) difficulty = Difficulty.INTERMEDIATE
    else difficulty = Difficulty.BEGINNER

    return {
      userId,
      strengths: commonStrengths.length > 0 ? commonStrengths : ["Persistencia", "Dedicación al aprendizaje"],
      weaknesses: commonWeaknesses.length > 0 ? commonWeaknesses : ["Necesita más práctica"],
      preferredDifficulty: difficulty,
      recentPerformance: Math.round(avgScore),
      recommendedSubjects: this.determineRecommendedSubjects(reports),
      learningPattern: 'mixed', // Could be enhanced with more sophisticated analysis
      progressTrend: trend
    }
  }

  // Extract common patterns from text arrays
  private static extractPatterns(texts: string[]): string[] {
    if (!texts || texts.length === 0) return []
    
    const keywords = [
      'matemáticas', 'programación', 'ciencias', 'lectura', 'escritura',
      'análisis', 'creatividad', 'organización', 'tiempo', 'concentración',
      'memoria', 'comprensión', 'práctica', 'teoría', 'aplicación'
    ]
    
    const patterns: { [key: string]: number } = {}
    
    texts.forEach(text => {
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          patterns[keyword] = (patterns[keyword] || 0) + 1
        }
      })
    })
    
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([keyword]) => keyword)
  }

  // Determine recommended subjects based on reports
  private static determineRecommendedSubjects(reports: any[]): Subject[] {
    const subjectKeywords = {
      [Subject.MATHEMATICS]: ['matemáticas', 'números', 'cálculo', 'álgebra'],
      [Subject.PROGRAMMING]: ['programación', 'código', 'algoritmo', 'software'],
      [Subject.SCIENCE]: ['ciencias', 'experimento', 'investigación', 'laboratorio'],
      [Subject.LANGUAGE]: ['lenguaje', 'escritura', 'lectura', 'comunicación']
    }

    // Extract text from report responses instead of non-existent fields
    const allText = reports.flatMap(r => 
      Object.values(r.responses || {})
    ).filter(Boolean).join(' ').toLowerCase()

    const subjectScores = Object.entries(subjectKeywords).map(([subject, keywords]) => ({
      subject: subject as Subject,
      score: keywords.reduce((score, keyword) => 
        score + (allText.includes(keyword) ? 1 : 0), 0)
    }))

    const topSubjects = subjectScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(s => s.subject)

    return topSubjects.length > 0 ? topSubjects : [Subject.GENERAL]
  }

  // Generate personalized exercise using AI
  static async generateExercise(userId: string, subject?: Subject): Promise<Exercise> {
    const analysis = await this.analyzeStudent(userId)
    const targetSubject = subject || analysis.recommendedSubjects[0] || Subject.GENERAL
    const difficulty = analysis.preferredDifficulty

    // Import AI generator dynamically to avoid initial loading issues
    const { aiExerciseGenerator, initializeAI } = await import('./ai-exercise-generator')
    
    try {
      // Initialize AI if not already done
      await initializeAI()
      
      // Determine exercise type based on student analysis
      const exerciseType = this.determineExerciseType(analysis)
      
      // Generate exercise with AI, including student context
      const exercise = await aiExerciseGenerator.generateExercise(
        targetSubject, 
        difficulty, 
        exerciseType,
        {
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recentPerformance: analysis.recentPerformance,
          learningPattern: analysis.learningPattern
        }
      )
      
      return exercise
    } catch (error) {
      console.error('Error generating AI exercise, falling back to templates:', error)
      return this.generateTemplateExercise(userId, targetSubject, difficulty)
    }
  }

  // Determine appropriate exercise type based on analysis
  static determineExerciseType(analysis: StudentAnalysis): ExerciseType {
    // Logic to determine exercise type based on student performance and patterns
    if (analysis.recentPerformance < 60) {
      return ExerciseType.BASIC_CONCEPTS
    } else if (analysis.recentPerformance < 75) {
      return ExerciseType.PROBLEM_SOLVING
    } else if (analysis.recentPerformance < 85) {
      return ExerciseType.CRITICAL_THINKING
    } else {
      return ExerciseType.APPLICATION
    }
  }

  // Fallback template-based exercise generation
  static generateTemplateExercise(userId: string, subject: Subject, difficulty: Difficulty): Exercise {
    // Simple template exercise for fallback
    const templates = {
      mathematics: {
        question: "¿Cuál es el resultado de 15 + 27?",
        options: ["42", "32", "52", "41"],
        correctAnswer: "42",
        explanation: "15 + 27 = 42. Se suman las unidades (5+7=12) y las decenas (1+2+1=4)."
      },
      general: {
        question: "¿Cuál es la capital de Francia?",
        options: ["Londres", "Madrid", "París", "Roma"],
        correctAnswer: "París",
        explanation: "París es la capital de Francia desde el siglo XII."
      }
    }
    
    const template = templates[subject === Subject.MATHEMATICS ? 'mathematics' : 'general']
    
    return {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Ejercicio de Práctica',
      description: `Ejercicio de ${subject}`,
      type: ExerciseType.BASIC_CONCEPTS,
      subject,
      difficulty,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: template.explanation,
      hints: ['Lee cuidadosamente la pregunta', 'Piensa antes de responder'],
      estimatedTime: 5,
      tags: [subject, 'template'],
      createdAt: new Date()
    }
  }

  // Generate multiple exercises for practice session using AI
  static async generateExerciseSet(userId: string, count: number = 5): Promise<Exercise[]> {
    const analysis = await this.analyzeStudent(userId)
    
    try {
      const { aiExerciseGenerator, initializeAI } = await import('./ai-exercise-generator')
      await initializeAI()
      
      // Generate diverse exercise set
      const exercises = await aiExerciseGenerator.generateExerciseSet(
        analysis.recommendedSubjects,
        analysis.preferredDifficulty,
        count,
        {
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          recentPerformance: analysis.recentPerformance,
          learningPattern: analysis.learningPattern
        }
      )
      
      return exercises
    } catch (error) {
      console.error('Error generating AI exercise set, falling back to templates:', error)
      
      // Fallback to template generation
      const exercises: Exercise[] = []
      for (let i = 0; i < count; i++) {
        const subject = analysis.recommendedSubjects[i % analysis.recommendedSubjects.length]
        const exercise = this.generateTemplateExercise(userId, subject, analysis.preferredDifficulty)
        exercises.push(exercise)
      }
      return exercises
    }
  }


  // Generate random number based on difficulty
  private static generateRandomNumber(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return Math.floor(Math.random() * 20) + 1 // 1-20
      case Difficulty.INTERMEDIATE:
        return Math.floor(Math.random() * 100) + 1 // 1-100
      case Difficulty.ADVANCED:
        return Math.floor(Math.random() * 1000) + 1 // 1-1000
      default:
        return Math.floor(Math.random() * 10) + 1 // 1-10
    }
  }

  // Generate answer and explanation
  private static generateAnswer(question: string, variables: any, type: ExerciseType): { answer: string, explanation: string } {
    // Simple pattern matching for basic math operations
    if (question.includes(' + ')) {
      const numbers = Object.values(variables) as number[]
      if (numbers.length >= 2) {
        const result = numbers[0] + numbers[1]
        return {
          answer: result.toString(),
          explanation: `Para sumar ${numbers[0]} + ${numbers[1]}, simplemente agregamos los números: ${result}`
        }
      }
    }
    
    if (question.includes(' × ') || question.includes(' * ')) {
      const numbers = Object.values(variables) as number[]
      if (numbers.length >= 2) {
        const result = numbers[0] * numbers[1]
        return {
          answer: result.toString(),
          explanation: `Para multiplicar ${numbers[0]} × ${numbers[1]}, repetimos ${numbers[0]} un total de ${numbers[1]} veces: ${result}`
        }
      }
    }

    // Default for reflection and conceptual questions
    return {
      answer: "Esta es una pregunta abierta. Reflexiona sobre tu experiencia personal.",
      explanation: "Las preguntas de reflexión no tienen una respuesta única correcta. Se valora la honestidad y profundidad de tu respuesta."
    }
  }

  // Generate helpful hints
  private static generateHints(question: string, type: ExerciseType, difficulty: Difficulty): string[] {
    const generalHints = [
      "Lee la pregunta cuidadosamente",
      "Identifica qué información tienes y qué necesitas encontrar",
      "Piensa en problemas similares que hayas resuelto antes"
    ]

    const mathHints = [
      "Recuerda el orden de las operaciones (PEMDAS)",
      "Dibuja un diagrama si te ayuda a visualizar el problema",
      "Verifica tu respuesta sustituyendo los valores"
    ]

    const reflectionHints = [
      "Sé honesto contigo mismo",
      "Piensa en ejemplos específicos",
      "Considera tanto los aspectos positivos como los desafíos"
    ]

    if (type === ExerciseType.REFLECTION) return reflectionHints.slice(0, 2)
    if (question.includes('matemáticas') || question.includes('+') || question.includes('×')) {
      return mathHints.slice(0, difficulty)
    }
    
    return generalHints.slice(0, difficulty)
  }

  // Get personalized study recommendations
  static async getStudyRecommendations(userId: string): Promise<{
    recommendations: string[]
    nextSteps: string[]
    motivation: string
  }> {
    const analysis = await this.analyzeStudent(userId)
    
    const recommendations = [
      `Enfócate en ${analysis.recommendedSubjects.join(' y ')} basado en tus intereses actuales`,
      `Tu nivel de dificultad recomendado es ${this.getDifficultyName(analysis.preferredDifficulty)}`,
      `Aprovecha tus fortalezas en: ${analysis.strengths.join(', ')}`,
      `Trabaja en mejorar: ${analysis.weaknesses.join(', ')}`
    ]

    const nextSteps = [
      "Completa 2-3 ejercicios de práctica esta semana",
      "Reflexiona sobre tu progreso en el reporte semanal",
      "Establece metas específicas y medibles",
      "Busca feedback de tu instructor sobre áreas de mejora"
    ]

    const motivations = [
      "Tu dedicación al aprendizaje es admirable. ¡Sigue así!",
      "Cada ejercicio que completas te acerca más a tus objetivos.",
      "El progreso constante es más valioso que la perfección.",
      "Tus esfuerzos de hoy determinarán tu éxito de mañana."
    ]

    return {
      recommendations,
      nextSteps,
      motivation: motivations[Math.floor(Math.random() * motivations.length)]
    }
  }

  private static getDifficultyName(difficulty: Difficulty): string {
    switch (difficulty) {
      case Difficulty.BEGINNER: return "Principiante"
      case Difficulty.INTERMEDIATE: return "Intermedio"
      case Difficulty.ADVANCED: return "Avanzado"
      case Difficulty.EXPERT: return "Experto"
      default: return "Principiante"
    }
  }

  // Extract strengths from text analysis
  private static extractStrengthsFromText(text: string): string[] {
    const strengthKeywords = {
      'Comprensión conceptual': ['entendí', 'claro', 'comprendo', 'concepto'],
      'Resolución de problemas': ['resolví', 'solucioné', 'estrategia', 'método'],
      'Persistencia': ['perseveré', 'intenté', 'practiqué', 'continué'],
      'Creatividad': ['creativo', 'innovador', 'original', 'diferente'],
      'Análisis crítico': ['analicé', 'evalué', 'comparé', 'reflexioné']
    }

    const foundStrengths: string[] = []
    for (const [strength, keywords] of Object.entries(strengthKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundStrengths.push(strength)
      }
    }

    return foundStrengths.length > 0 ? foundStrengths : ['Motivación para aprender', 'Dedicación']
  }

  // Extract weaknesses from text analysis
  private static extractWeaknessesFromText(text: string): string[] {
    const weaknessKeywords = {
      'Conceptos fundamentales': ['confuso', 'no entiendo', 'difícil de entender'],
      'Gestión del tiempo': ['tiempo', 'rápido', 'lento', 'prisa'],
      'Práctica adicional': ['necesito practicar', 'más ejercicios', 'repetir'],
      'Concentración': ['distracción', 'concentrar', 'atención'],
      'Confianza': ['inseguro', 'dudas', 'no estoy seguro']
    }

    const foundWeaknesses: string[] = []
    for (const [weakness, keywords] of Object.entries(weaknessKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundWeaknesses.push(weakness)
      }
    }

    return foundWeaknesses.length > 0 ? foundWeaknesses : ['Necesita más práctica']
  }
}