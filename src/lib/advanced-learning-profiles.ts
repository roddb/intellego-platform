// Advanced Learning Profiles System for Sara AI
// Implements VARK model (Visual, Auditory, Reading/Writing, Kinesthetic) with automatic detection

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING_WRITING = 'reading_writing', 
  KINESTHETIC = 'kinesthetic',
  MULTIMODAL = 'multimodal'
}

export interface LearningStyleIndicator {
  style: LearningStyle
  weight: number // 0.0 to 1.0
  evidence: string[]
  confidence: number // 0.0 to 1.0
}

export interface LearningProfile {
  userId: string
  primaryStyle: LearningStyle
  secondaryStyle?: LearningStyle
  styleDistribution: {
    visual: number
    auditory: number
    reading_writing: number
    kinesthetic: number
  }
  adaptationPreferences: {
    prefersDiagrams: boolean
    prefersStepByStep: boolean
    prefersExamples: boolean
    prefersInteraction: boolean
    prefersVisualAids: boolean
    prefersVerbalExplanation: boolean
  }
  detectedFrom: {
    messageAnalysis: number
    behaviorPatterns: number
    explicitPreferences: number
  }
  lastUpdated: Date
  interactions: number
}

export interface LearningBehaviorPattern {
  userId: string
  timestamp: Date
  action: string
  context: string
  styleIndicators: LearningStyle[]
}

export class AdvancedLearningProfileManager {
  
  // Storage for learning profiles
  private static profiles: Map<string, LearningProfile> = new Map()
  private static behaviors: LearningBehaviorPattern[] = []

  /**
   * Analyzes user message for learning style indicators
   */
  static analyzeMessageForLearningStyle(message: string, userId: string): LearningStyleIndicator[] {
    const msgLower = message.toLowerCase()
    const indicators: LearningStyleIndicator[] = []

    // VISUAL indicators
    const visualKeywords = [
      'ver', 'mirar', 'mostrar', 'imagen', 'gráfico', 'diagrama', 'visual', 'color',
      'mapa', 'esquema', 'dibujo', 'ilustración', 'tabla', 'gráfica', 'visualizar',
      'observar', 'demostrar', 'ejemplo visual', 'claramente'
    ]
    
    const visualPhrases = [
      'me gusta ver', 'muéstrame', 'qué aspecto tiene', 'cómo se ve',
      'necesito ver', 'puedes mostrar', 'ejemplo visual', 'de forma gráfica'
    ]
    
    let visualScore = this.calculateKeywordScore(msgLower, visualKeywords, visualPhrases)
    if (visualScore > 0) {
      indicators.push({
        style: LearningStyle.VISUAL,
        weight: visualScore,
        evidence: this.extractEvidence(msgLower, [...visualKeywords, ...visualPhrases]),
        confidence: Math.min(visualScore * 1.2, 1.0)
      })
    }

    // AUDITORY indicators
    const auditoryKeywords = [
      'escuchar', 'oír', 'sonido', 'explicar', 'decir', 'contar', 'discutir',
      'hablar', 'verbal', 'audio', 'pronunciar', 'repetir', 'preguntar'
    ]
    
    const auditoryPhrases = [
      'explícame', 'cuéntame', 'me puedes decir', 'necesito que me expliques',
      'repítelo', 'en palabras', 'de forma verbal', 'hablemos de'
    ]
    
    let auditoryScore = this.calculateKeywordScore(msgLower, auditoryKeywords, auditoryPhrases)
    if (auditoryScore > 0) {
      indicators.push({
        style: LearningStyle.AUDITORY,
        weight: auditoryScore,
        evidence: this.extractEvidence(msgLower, [...auditoryKeywords, ...auditoryPhrases]),
        confidence: Math.min(auditoryScore * 1.1, 1.0)
      })
    }

    // READING/WRITING indicators
    const readWriteKeywords = [
      'leer', 'escribir', 'texto', 'nota', 'lista', 'definición', 'resumen',
      'apuntes', 'documento', 'artículo', 'párrafo', 'descripción', 'detalles'
    ]
    
    const readWritePhrases = [
      'en texto', 'por escrito', 'dame detalles', 'necesito leer',
      'quiero estudiar', 'información detallada', 'paso a paso', 'lista de'
    ]
    
    let readWriteScore = this.calculateKeywordScore(msgLower, readWriteKeywords, readWritePhrases)
    if (readWriteScore > 0) {
      indicators.push({
        style: LearningStyle.READING_WRITING,
        weight: readWriteScore,
        evidence: this.extractEvidence(msgLower, [...readWriteKeywords, ...readWritePhrases]),
        confidence: Math.min(readWriteScore, 1.0)
      })
    }

    // KINESTHETIC indicators
    const kinestheticKeywords = [
      'hacer', 'practicar', 'ejercicio', 'actividad', 'mano', 'tocar', 'mover',
      'experimentar', 'probar', 'manipular', 'construir', 'crear', 'interactivo'
    ]
    
    const kinestheticPhrases = [
      'quiero hacer', 'necesito practicar', 'hands on', 'de forma práctica',
      'experimentando', 'probando', 'haciendo ejercicios', 'actividades'
    ]
    
    let kinestheticScore = this.calculateKeywordScore(msgLower, kinestheticKeywords, kinestheticPhrases)
    if (kinestheticScore > 0) {
      indicators.push({
        style: LearningStyle.KINESTHETIC,
        weight: kinestheticScore,
        evidence: this.extractEvidence(msgLower, [...kinestheticKeywords, ...kinestheticPhrases]),
        confidence: Math.min(kinestheticScore * 1.3, 1.0)
      })
    }

    // Record behavior pattern
    if (indicators.length > 0) {
      this.recordBehaviorPattern(userId, 'message_analysis', message, 
        indicators.map(i => i.style))
    }

    return indicators.sort((a, b) => b.weight - a.weight)
  }

  /**
   * Calculates score based on keyword and phrase matches
   */
  private static calculateKeywordScore(text: string, keywords: string[], phrases: string[]): number {
    let score = 0
    
    // Keyword matches (lower weight)
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 0.1
      }
    }
    
    // Phrase matches (higher weight)
    for (const phrase of phrases) {
      if (text.includes(phrase)) {
        score += 0.3
      }
    }
    
    return Math.min(score, 1.0)
  }

  /**
   * Extracts evidence from text
   */
  private static extractEvidence(text: string, patterns: string[]): string[] {
    const evidence: string[] = []
    
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        // Extract sentence containing the pattern
        const sentences = text.split(/[.!?]+/)
        const matchingSentence = sentences.find(sentence => 
          sentence.toLowerCase().includes(pattern))
        if (matchingSentence) {
          evidence.push(matchingSentence.trim())
        }
      }
    }
    
    return evidence.slice(0, 3) // Limit to 3 pieces of evidence
  }

  /**
   * Records a learning behavior pattern
   */
  static recordBehaviorPattern(userId: string, action: string, context: string, 
                               styleIndicators: LearningStyle[]) {
    this.behaviors.push({
      userId,
      timestamp: new Date(),
      action,
      context,
      styleIndicators
    })

    // Keep only recent behaviors (last 100 per user)
    const userBehaviors = this.behaviors.filter(b => b.userId === userId)
    if (userBehaviors.length > 100) {
      this.behaviors = this.behaviors.filter(b => b.userId !== userId)
        .concat(userBehaviors.slice(-100))
    }
  }

  /**
   * Updates or creates learning profile for user
   */
  static updateLearningProfile(userId: string, indicators: LearningStyleIndicator[], 
                               context?: string): LearningProfile {
    let profile = this.profiles.get(userId) || this.createInitialProfile(userId)

    // Update style distribution based on new indicators
    for (const indicator of indicators) {
      const weight = indicator.weight * indicator.confidence
      
      switch (indicator.style) {
        case LearningStyle.VISUAL:
          profile.styleDistribution.visual = Math.min(
            profile.styleDistribution.visual + weight * 0.1, 1.0)
          break
        case LearningStyle.AUDITORY:
          profile.styleDistribution.auditory = Math.min(
            profile.styleDistribution.auditory + weight * 0.1, 1.0)
          break
        case LearningStyle.READING_WRITING:
          profile.styleDistribution.reading_writing = Math.min(
            profile.styleDistribution.reading_writing + weight * 0.1, 1.0)
          break
        case LearningStyle.KINESTHETIC:
          profile.styleDistribution.kinesthetic = Math.min(
            profile.styleDistribution.kinesthetic + weight * 0.1, 1.0)
          break
      }
    }

    // Normalize distribution
    const total = profile.styleDistribution.visual + 
                  profile.styleDistribution.auditory +
                  profile.styleDistribution.reading_writing + 
                  profile.styleDistribution.kinesthetic

    if (total > 0) {
      profile.styleDistribution.visual /= total
      profile.styleDistribution.auditory /= total
      profile.styleDistribution.reading_writing /= total
      profile.styleDistribution.kinesthetic /= total
    }

    // Determine primary and secondary styles
    const styles = [
      { style: LearningStyle.VISUAL, score: profile.styleDistribution.visual },
      { style: LearningStyle.AUDITORY, score: profile.styleDistribution.auditory },
      { style: LearningStyle.READING_WRITING, score: profile.styleDistribution.reading_writing },
      { style: LearningStyle.KINESTHETIC, score: profile.styleDistribution.kinesthetic }
    ].sort((a, b) => b.score - a.score)

    profile.primaryStyle = styles[0].score > 0.35 ? styles[0].style : LearningStyle.MULTIMODAL
    profile.secondaryStyle = styles[1].score > 0.25 ? styles[1].style : undefined

    // Update adaptation preferences
    profile.adaptationPreferences = {
      prefersDiagrams: profile.styleDistribution.visual > 0.3,
      prefersStepByStep: profile.styleDistribution.reading_writing > 0.3,
      prefersExamples: profile.styleDistribution.visual > 0.25 || 
                       profile.styleDistribution.kinesthetic > 0.25,
      prefersInteraction: profile.styleDistribution.kinesthetic > 0.3,
      prefersVisualAids: profile.styleDistribution.visual > 0.25,
      prefersVerbalExplanation: profile.styleDistribution.auditory > 0.3
    }

    profile.lastUpdated = new Date()
    profile.interactions++
    
    this.profiles.set(userId, profile)
    
    console.log(`📊 Learning profile updated for ${userId}: Primary=${profile.primaryStyle}, Secondary=${profile.secondaryStyle || 'none'}`)
    
    return profile
  }

  /**
   * Creates initial learning profile
   */
  private static createInitialProfile(userId: string): LearningProfile {
    return {
      userId,
      primaryStyle: LearningStyle.MULTIMODAL,
      secondaryStyle: undefined,
      styleDistribution: {
        visual: 0.25,
        auditory: 0.25,
        reading_writing: 0.25,
        kinesthetic: 0.25
      },
      adaptationPreferences: {
        prefersDiagrams: false,
        prefersStepByStep: true,
        prefersExamples: true,
        prefersInteraction: false,
        prefersVisualAids: false,
        prefersVerbalExplanation: false
      },
      detectedFrom: {
        messageAnalysis: 0,
        behaviorPatterns: 0,
        explicitPreferences: 0
      },
      lastUpdated: new Date(),
      interactions: 0
    }
  }

  /**
   * Gets learning profile for user
   */
  static getLearningProfile(userId: string): LearningProfile {
    return this.profiles.get(userId) || this.createInitialProfile(userId)
  }

  /**
   * Adapts response content based on learning profile
   */
  static adaptResponseToLearningStyle(content: string, profile: LearningProfile): string {
    let adaptedContent = content

    // Visual learner adaptations
    if (profile.adaptationPreferences.prefersVisualAids) {
      adaptedContent = this.addVisualElements(adaptedContent, profile)
    }

    // Auditory learner adaptations
    if (profile.adaptationPreferences.prefersVerbalExplanation) {
      adaptedContent = this.addAuditoryElements(adaptedContent, profile)
    }

    // Reading/Writing learner adaptations
    if (profile.adaptationPreferences.prefersStepByStep) {
      adaptedContent = this.addStructuredElements(adaptedContent, profile)
    }

    // Kinesthetic learner adaptations
    if (profile.adaptationPreferences.prefersInteraction) {
      adaptedContent = this.addInteractiveElements(adaptedContent, profile)
    }

    return adaptedContent
  }

  /**
   * Adds visual elements for visual learners
   */
  private static addVisualElements(content: string, profile: LearningProfile): string {
    let enhanced = content

    // Add visual cues and formatting
    enhanced = enhanced.replace(/importante:/gi, '🔍 **IMPORTANTE:**')
    enhanced = enhanced.replace(/nota:/gi, '📝 **NOTA:**')
    enhanced = enhanced.replace(/ejemplo:/gi, '💡 **EJEMPLO:**')
    enhanced = enhanced.replace(/resultado:/gi, '✅ **RESULTADO:**')

    // Add visual separators
    if (enhanced.includes('paso') || enhanced.includes('step')) {
      enhanced = enhanced.replace(/paso (\d+)/gi, '\n📍 **PASO $1**\n')
    }

    return enhanced
  }

  /**
   * Adds auditory elements for auditory learners  
   */
  private static addAuditoryElements(content: string, profile: LearningProfile): string {
    let enhanced = content

    // Add conversational phrases
    enhanced = "🗣️ Te voy a explicar esto paso a paso:\n\n" + enhanced
    
    // Add verbal transition phrases
    enhanced = enhanced.replace(/\. ([A-Z])/g, '. Ahora, $1')
    enhanced = enhanced.replace(/:\n/g, '. Escucha bien:\n')

    return enhanced
  }

  /**
   * Adds structured elements for reading/writing learners
   */
  private static addStructuredElements(content: string, profile: LearningProfile): string {
    let enhanced = content

    // Add clear structure and bullet points
    if (!enhanced.includes('**') && enhanced.length > 200) {
      const sentences = enhanced.split('.')
      if (sentences.length > 3) {
        enhanced = sentences
          .filter(s => s.trim().length > 10)
          .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
          .join('\n')
      }
    }

    return enhanced
  }

  /**
   * Adds interactive elements for kinesthetic learners
   */
  private static addInteractiveElements(content: string, profile: LearningProfile): string {
    let enhanced = content

    // Add action-oriented language
    enhanced += "\n\n🎯 **Prueba esto:**"
    enhanced += "\n• Aplica este concepto a un problema real"
    enhanced += "\n• Experimenta cambiando los valores"
    enhanced += "\n• Practica con ejercicios similares"

    return enhanced
  }

  /**
   * Analyzes behavior patterns to enhance profile
   */
  static analyzeBehaviorPatterns(userId: string): LearningProfile {
    const userBehaviors = this.behaviors.filter(b => b.userId === userId)
    const profile = this.getLearningProfile(userId)

    if (userBehaviors.length < 5) return profile

    // Analyze patterns in recent behaviors
    const recentBehaviors = userBehaviors.slice(-20)
    const styleFrequency = new Map<LearningStyle, number>()

    for (const behavior of recentBehaviors) {
      for (const style of behavior.styleIndicators) {
        styleFrequency.set(style, (styleFrequency.get(style) || 0) + 1)
      }
    }

    // Update profile based on behavioral patterns
    const indicators: LearningStyleIndicator[] = []
    for (const [style, frequency] of styleFrequency.entries()) {
      const weight = frequency / recentBehaviors.length
      if (weight > 0.1) {
        indicators.push({
          style,
          weight,
          evidence: [`Detectado en ${frequency} de ${recentBehaviors.length} interacciones recientes`],
          confidence: Math.min(weight * 2, 1.0)
        })
      }
    }

    return this.updateLearningProfile(userId, indicators, 'behavior_analysis')
  }

  /**
   * Gets profile statistics
   */
  static getProfileStatistics(userId?: string): any {
    if (userId) {
      const profile = this.profiles.get(userId)
      const behaviors = this.behaviors.filter(b => b.userId === userId)
      
      return {
        profile: profile || null,
        behaviorCount: behaviors.length,
        recentInteractions: behaviors.filter(b => 
          b.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      }
    }

    return {
      totalProfiles: this.profiles.size,
      totalBehaviors: this.behaviors.length,
      styleDistribution: this.getGlobalStyleDistribution()
    }
  }

  /**
   * Gets global style distribution
   */
  private static getGlobalStyleDistribution(): any {
    const distribution = {
      visual: 0,
      auditory: 0,
      reading_writing: 0,
      kinesthetic: 0,
      multimodal: 0
    }

    for (const profile of this.profiles.values()) {
      switch (profile.primaryStyle) {
        case LearningStyle.VISUAL:
          distribution.visual++
          break
        case LearningStyle.AUDITORY:
          distribution.auditory++
          break
        case LearningStyle.READING_WRITING:
          distribution.reading_writing++
          break
        case LearningStyle.KINESTHETIC:
          distribution.kinesthetic++
          break
        case LearningStyle.MULTIMODAL:
          distribution.multimodal++
          break
      }
    }

    return distribution
  }

  /**
   * Process user message and update learning profile
   */
  static processUserMessage(userId: string, message: string): LearningProfile {
    // Analyze message for learning style indicators
    const indicators = this.analyzeMessageForLearningStyle(message, userId)
    
    // Update learning profile if indicators found
    if (indicators.length > 0) {
      return this.updateLearningProfile(userId, indicators, 'message_processing')
    }
    
    // Analyze behavior patterns periodically
    const profile = this.getLearningProfile(userId)
    if (profile.interactions % 10 === 0) {
      return this.analyzeBehaviorPatterns(userId)
    }
    
    return profile
  }

  /**
   * Generates learning style recommendations for Sara
   */
  static generateStyleRecommendations(profile: LearningProfile): string[] {
    const recommendations: string[] = []
    
    switch (profile.primaryStyle) {
      case LearningStyle.VISUAL:
        recommendations.push("Usar diagramas y esquemas cuando explico conceptos")
        recommendations.push("Incluir ejemplos visuales y gráficos")
        recommendations.push("Estructurar información con viñetas y colores")
        break
        
      case LearningStyle.AUDITORY:
        recommendations.push("Explicar conceptos con lenguaje conversacional")
        recommendations.push("Usar analogías y metáforas verbales")
        recommendations.push("Incluir discusiones y preguntas abiertas")
        break
        
      case LearningStyle.READING_WRITING:
        recommendations.push("Proporcionar información detallada por escrito")
        recommendations.push("Crear listas y resúmenes estructurados")
        recommendations.push("Incluir definiciones y descripciones precisas")
        break
        
      case LearningStyle.KINESTHETIC:
        recommendations.push("Incluir ejercicios prácticos y actividades")
        recommendations.push("Sugerir experimentos y aplicaciones reales")
        recommendations.push("Usar ejemplos concretos y manipulables")
        break
        
      case LearningStyle.MULTIMODAL:
        recommendations.push("Combinar múltiples enfoques de enseñanza")
        recommendations.push("Adaptar explicaciones según el contexto")
        recommendations.push("Ofrecer opciones de aprendizaje variadas")
        break
    }
    
    return recommendations
  }
}