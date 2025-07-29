import { tempWeeklyReports } from './temp-storage'

// Definición de materias académicas
export enum AcademicSubject {
  MATHEMATICS = 'mathematics',
  PHYSICS = 'physics', 
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  SPANISH = 'spanish',
  ENGLISH = 'english',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  GENERAL = 'general'
}

// Nivel de dificultad detectado
export enum DifficultyLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced',
  REVIEW_NEEDED = 'review_needed'
}

// Temas específicos por materia
export const SUBJECT_TOPICS = {
  [AcademicSubject.MATHEMATICS]: [
    'algebra', 'geometria', 'trigonometria', 'calculo', 'estadistica', 'probabilidad',
    'ecuaciones', 'funciones', 'logaritmos', 'matrices', 'derivadas', 'integrales'
  ],
  [AcademicSubject.PHYSICS]: [
    'cinematica', 'dinamica', 'energia', 'ondas', 'termodinamica', 'electricidad',
    'magnetismo', 'optica', 'mecanica', 'fluidos', 'movimiento', 'fuerza', 'velocidad'
  ],
  [AcademicSubject.CHEMISTRY]: [
    'atomos', 'moleculas', 'enlaces', 'reacciones', 'estequiometria', 'acidos',
    'bases', 'oxidacion', 'reduccion', 'equilibrio', 'cinetica', 'termoquimica'
  ]
}

// Palabras clave que indican dificultades
const DIFFICULTY_INDICATORS = {
  high: ['muy difícil', 'no entiendo', 'confuso', 'complicado', 'imposible', 'no puedo'],
  medium: ['difícil', 'complicado', 'no comprendo', 'me cuesta', 'problema'],
  low: ['un poco difícil', 'necesito ayuda', 'no está claro', 'dudas']
}

// Palabras clave que indican progreso positivo
const PROGRESS_INDICATORS = {
  excellent: ['excelente', 'perfecto', 'domino', 'fácil', 'entiendo todo'],
  good: ['bien', 'entiendo', 'comprendo', 'logré', 'mejorando'],
  fair: ['más o menos', 'regular', 'algunas veces', 'avanzando']
}

export interface AcademicAnalysis {
  userId: string
  studentName?: string
  subjects: SubjectAnalysis[]
  overallPerformance: number
  strugglingAreas: string[]
  strengths: string[]
  recommendedTopics: string[]
  learningPattern: 'visual' | 'analytical' | 'practical' | 'mixed'
  lastReportDate: Date
}

export interface SubjectAnalysis {
  subject: AcademicSubject
  subjectName: string
  performance: number
  difficultyLevel: DifficultyLevel
  strugglingTopics: string[]
  masteredTopics: string[]
  recentMentions: number
  needsAttention: boolean
  specificChallenges: string[]
}

export class AcademicAnalyzer {
  
  /**
   * Analiza los reportes académicos de un estudiante
   */
  static async analyzeStudent(userId: string): Promise<AcademicAnalysis> {
    const reports = tempWeeklyReports.filter(report => report.userId === userId)
    
    if (reports.length === 0) {
      return this.createDefaultAnalysis(userId)
    }

    // Analizar reportes recientes (últimas 8 semanas)
    const recentReports = reports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    // Extraer todo el texto de las respuestas
    const allResponseText = recentReports
      .flatMap(report => Object.values(report.responses || {}))
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    // Analizar por materias
    const subjectAnalyses = this.analyzeSubjects(allResponseText, recentReports)
    
    // Análisis general
    const overallPerformance = this.calculateOverallPerformance(subjectAnalyses)
    const strugglingAreas = this.identifyStrugglingAreas(subjectAnalyses, allResponseText)
    const strengths = this.identifyStrengths(subjectAnalyses, allResponseText)
    const recommendedTopics = this.generateRecommendations(subjectAnalyses)
    const learningPattern = this.identifyLearningPattern(allResponseText)

    return {
      userId,
      subjects: subjectAnalyses,
      overallPerformance,
      strugglingAreas,
      strengths,
      recommendedTopics,
      learningPattern,
      lastReportDate: new Date(recentReports[0]?.createdAt || Date.now())
    }
  }

  /**
   * Analiza materias específicas mencionadas en los reportes
   */
  private static analyzeSubjects(text: string, reports: any[]): SubjectAnalysis[] {
    const analyses: SubjectAnalysis[] = []

    // Palabras clave para identificar materias
    const subjectKeywords = {
      [AcademicSubject.MATHEMATICS]: ['matemática', 'matemáticas', 'mate', 'álgebra', 'geometría', 'cálculo', 'números'],
      [AcademicSubject.PHYSICS]: ['física', 'mecánica', 'energía', 'fuerza', 'movimiento', 'velocidad'],
      [AcademicSubject.CHEMISTRY]: ['química', 'átomos', 'moléculas', 'reacciones', 'elementos', 'laboratorio'],
      [AcademicSubject.BIOLOGY]: ['biología', 'células', 'organismos', 'evolución', 'ecosistema'],
      [AcademicSubject.SPANISH]: ['lengua', 'español', 'literatura', 'redacción', 'gramática'],
      [AcademicSubject.ENGLISH]: ['inglés', 'english', 'grammar', 'vocabulary'],
      [AcademicSubject.HISTORY]: ['historia', 'civilización', 'época', 'guerra', 'revolución'],
      [AcademicSubject.GEOGRAPHY]: ['geografía', 'países', 'continentes', 'clima', 'población']
    }

    Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
      const mentions = keywords.filter(keyword => text.includes(keyword)).length
      
      if (mentions > 0) {
        const analysis = this.analyzeSpecificSubject(subject as AcademicSubject, text, reports, mentions)
        analyses.push(analysis)
      }
    })

    // Si no se encontraron materias específicas, agregar análisis general
    if (analyses.length === 0) {
      analyses.push(this.createGeneralSubjectAnalysis(text, reports))
    }

    return analyses
  }

  /**
   * Analiza una materia específica
   */
  private static analyzeSpecificSubject(
    subject: AcademicSubject, 
    text: string, 
    reports: any[], 
    mentions: number
  ): SubjectAnalysis {
    
    const subjectName = this.getSubjectDisplayName(subject)
    const topics = SUBJECT_TOPICS[subject] || []
    
    // Detectar temas mencionados
    const mentionedTopics = topics.filter(topic => text.includes(topic))
    
    // Analizar dificultades específicas
    const specificChallenges = this.extractSpecificChallenges(text, subject)
    
    // Calcular rendimiento basado en indicadores
    const performance = this.calculateSubjectPerformance(text, specificChallenges.length)
    
    // Determinar nivel de dificultad
    const difficultyLevel = this.determineDifficultyLevel(performance, specificChallenges.length)
    
    // Determinar si necesita atención
    const needsAttention = performance < 60 || specificChallenges.length > 2

    return {
      subject,
      subjectName,
      performance,
      difficultyLevel,
      strugglingTopics: mentionedTopics.slice(0, 3), // Primeros 3 temas mencionados
      masteredTopics: performance > 75 ? mentionedTopics.slice(0, 2) : [],
      recentMentions: mentions,
      needsAttention,
      specificChallenges
    }
  }

  /**
   * Extrae desafíos específicos mencionados por el estudiante
   */
  private static extractSpecificChallenges(text: string, subject: AcademicSubject): string[] {
    const challenges: string[] = []
    
    // Buscar patrones de dificultad
    const difficultyPatterns = [
      /no entiendo (.*?)(?:\.|,|$)/g,
      /me cuesta (.*?)(?:\.|,|$)/g,
      /difícil (.*?)(?:\.|,|$)/g,
      /problema con (.*?)(?:\.|,|$)/g,
      /confuso (.*?)(?:\.|,|$)/g
    ]

    difficultyPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].length < 50) {
          challenges.push(match[1].trim())
        }
      }
    })

    return challenges.slice(0, 3) // Máximo 3 desafíos específicos
  }

  /**
   * Calcula el rendimiento de una materia
   */
  private static calculateSubjectPerformance(text: string, challengesCount: number): number {
    let score = 70 // Base score

    // Indicadores positivos
    Object.entries(PROGRESS_INDICATORS).forEach(([level, indicators]) => {
      const multiplier = level === 'excellent' ? 10 : level === 'good' ? 5 : 2
      indicators.forEach(indicator => {
        if (text.includes(indicator)) {
          score += multiplier
        }
      })
    })

    // Indicadores negativos
    Object.entries(DIFFICULTY_INDICATORS).forEach(([level, indicators]) => {
      const penalty = level === 'high' ? 15 : level === 'medium' ? 10 : 5
      indicators.forEach(indicator => {
        if (text.includes(indicator)) {
          score -= penalty
        }
      })
    })

    // Penalizar por número de desafíos específicos
    score -= challengesCount * 8

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Determina el nivel de dificultad basado en el rendimiento
   */
  private static determineDifficultyLevel(performance: number, challengesCount: number): DifficultyLevel {
    if (performance < 40 || challengesCount > 3) return DifficultyLevel.REVIEW_NEEDED
    if (performance < 60) return DifficultyLevel.BASIC
    if (performance < 80) return DifficultyLevel.INTERMEDIATE
    return DifficultyLevel.ADVANCED
  }

  /**
   * Crea análisis por defecto para estudiantes sin reportes
   */
  private static createDefaultAnalysis(userId: string): AcademicAnalysis {
    return {
      userId,
      subjects: [this.createGeneralSubjectAnalysis('', [])],
      overallPerformance: 50,
      strugglingAreas: ['Falta de datos históricos'],
      strengths: ['Nuevo estudiante con potencial'],
      recommendedTopics: ['Evaluación inicial', 'Fundamentos'],
      learningPattern: 'mixed',
      lastReportDate: new Date()
    }
  }

  /**
   * Crea análisis general cuando no se detectan materias específicas
   */
  private static createGeneralSubjectAnalysis(text: string, reports: any[]): SubjectAnalysis {
    const performance = text.length > 0 ? this.calculateSubjectPerformance(text, 0) : 50
    
    return {
      subject: AcademicSubject.GENERAL,
      subjectName: 'Análisis General',
      performance,
      difficultyLevel: this.determineDifficultyLevel(performance, 0),
      strugglingTopics: [],
      masteredTopics: [],
      recentMentions: reports.length,
      needsAttention: performance < 60,
      specificChallenges: this.extractSpecificChallenges(text, AcademicSubject.GENERAL)
    }
  }

  /**
   * Calcula el rendimiento general
   */
  private static calculateOverallPerformance(subjects: SubjectAnalysis[]): number {
    if (subjects.length === 0) return 50
    
    const average = subjects.reduce((sum, subject) => sum + subject.performance, 0) / subjects.length
    return Math.round(average)
  }

  /**
   * Identifica áreas con dificultades
   */
  private static identifyStrugglingAreas(subjects: SubjectAnalysis[], text: string): string[] {
    const areas: string[] = []
    
    // Agregar materias con bajo rendimiento
    subjects
      .filter(subject => subject.needsAttention)
      .forEach(subject => {
        areas.push(`${subject.subjectName}: ${subject.specificChallenges.join(', ')}`)
      })

    // Si no hay áreas específicas, buscar patrones generales
    if (areas.length === 0 && text.length > 0) {
      if (text.includes('tiempo')) areas.push('Gestión del tiempo')
      if (text.includes('concentr')) areas.push('Concentración')
      if (text.includes('motiv')) areas.push('Motivación')
    }

    return areas.slice(0, 3)
  }

  /**
   * Identifica fortalezas del estudiante
   */
  private static identifyStrengths(subjects: SubjectAnalysis[], text: string): string[] {
    const strengths: string[] = []
    
    // Agregar materias con buen rendimiento
    subjects
      .filter(subject => subject.performance > 75)
      .forEach(subject => {
        strengths.push(`Dominio en ${subject.subjectName}`)
      })

    // Patrones de fortaleza general
    if (text.includes('organiz')) strengths.push('Capacidad de organización')
    if (text.includes('persever') || text.includes('persist')) strengths.push('Perseverancia')
    if (text.includes('creativ')) strengths.push('Pensamiento creativo')

    return strengths.length > 0 ? strengths.slice(0, 3) : ['Dedicación al aprendizaje']
  }

  /**
   * Genera recomendaciones de temas
   */
  private static generateRecommendations(subjects: SubjectAnalysis[]): string[] {
    const recommendations: string[] = []
    
    subjects.forEach(subject => {
      if (subject.needsAttention) {
        recommendations.push(`Reforzar conceptos básicos de ${subject.subjectName}`)
        
        if (subject.strugglingTopics.length > 0) {
          recommendations.push(`Practicar: ${subject.strugglingTopics.join(', ')}`)
        }
      }
    })

    return recommendations.slice(0, 4)
  }

  /**
   * Identifica el patrón de aprendizaje
   */
  private static identifyLearningPattern(text: string): 'visual' | 'analytical' | 'practical' | 'mixed' {
    const visualKeywords = ['gráfico', 'diagrama', 'imagen', 'visual', 'dibujo']
    const analyticalKeywords = ['análisis', 'lógica', 'razonamiento', 'teoría']
    const practicalKeywords = ['práctica', 'ejercicio', 'aplicar', 'hacer']

    const visualCount = visualKeywords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)
    const analyticalCount = analyticalKeywords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)
    const practicalCount = practicalKeywords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)

    if (visualCount > analyticalCount && visualCount > practicalCount) return 'visual'
    if (analyticalCount > practicalCount) return 'analytical'
    if (practicalCount > 0) return 'practical'
    return 'mixed'
  }

  /**
   * Obtiene el nombre de visualización de una materia
   */
  private static getSubjectDisplayName(subject: AcademicSubject): string {
    const names = {
      [AcademicSubject.MATHEMATICS]: 'Matemáticas',
      [AcademicSubject.PHYSICS]: 'Física', 
      [AcademicSubject.CHEMISTRY]: 'Química',
      [AcademicSubject.BIOLOGY]: 'Biología',
      [AcademicSubject.SPANISH]: 'Lengua y Literatura',
      [AcademicSubject.ENGLISH]: 'Inglés',
      [AcademicSubject.HISTORY]: 'Historia',
      [AcademicSubject.GEOGRAPHY]: 'Geografía',
      [AcademicSubject.GENERAL]: 'General'
    }
    return names[subject] || 'Materia'
  }

  /**
   * Obtiene un resumen contextual para generar ejercicios
   */
  static getExerciseContext(analysis: AcademicAnalysis, subject?: AcademicSubject): string {
    const targetSubject = subject || analysis.subjects[0]?.subject || AcademicSubject.GENERAL
    const subjectAnalysis = analysis.subjects.find(s => s.subject === targetSubject)
    
    if (!subjectAnalysis) {
      return `Estudiante: nivel intermedio, necesita evaluación inicial en ${targetSubject}`
    }

    const context = [
      `Materia: ${subjectAnalysis.subjectName}`,
      `Nivel: ${subjectAnalysis.difficultyLevel}`,
      `Rendimiento actual: ${subjectAnalysis.performance}%`,
      subjectAnalysis.specificChallenges.length > 0 
        ? `Dificultades específicas: ${subjectAnalysis.specificChallenges.join(', ')}`
        : null,
      subjectAnalysis.strugglingTopics.length > 0
        ? `Temas a reforzar: ${subjectAnalysis.strugglingTopics.join(', ')}`
        : null,
      `Patrón de aprendizaje: ${analysis.learningPattern}`
    ].filter(Boolean).join('. ')

    return context
  }
}