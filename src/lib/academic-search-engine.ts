// Sistema de Búsqueda Académica Inteligente para Sara
// Integra búsqueda web con análisis contextual y notificaciones proactivas

import { WebSearchIntegration } from './web-search-integration'
import { ConversationMemoryManager } from './conversation-memory'
import { EmotionType } from './emotion-analyzer'

export interface AcademicSearchQuery {
  topic: string
  subject?: string
  level?: 'basic' | 'intermediate' | 'advanced'
  searchType: 'explanation' | 'examples' | 'exercises' | 'resources' | 'research'
  language?: 'es' | 'en'
  userId?: string
  sessionId?: string
}

export interface AcademicSearchResult {
  title: string
  content: string
  source: string
  relevanceScore: number
  difficulty: 'basic' | 'intermediate' | 'advanced'
  contentType: 'article' | 'video' | 'tutorial' | 'academic_paper' | 'exercise'
  summary: string
  keyPoints: string[]
  relatedTopics: string[]
  estimatedReadTime: number
}

export interface SearchAnalysis {
  query: AcademicSearchQuery
  results: AcademicSearchResult[]
  searchSuccess: boolean
  totalResults: number
  searchTime: number
  personalizedRecommendations: string[]
  followUpQuestions: string[]
  suggestedActions: string[]
}

export class AcademicSearchEngine {
  
  // Plantillas de búsqueda optimizadas para contenido académico
  private static readonly SEARCH_TEMPLATES = {
    explanation: {
      es: "{topic} explicación {subject} concepto básico tutorial",
      en: "{topic} explanation {subject} basic concept tutorial"
    },
    examples: {
      es: "{topic} ejemplos {subject} casos prácticos ejercicios",
      en: "{topic} examples {subject} practical cases exercises"
    },
    exercises: {
      es: "{topic} ejercicios {subject} problemas resueltos práctica",
      en: "{topic} exercises {subject} solved problems practice"
    },
    resources: {
      es: "{topic} recursos {subject} material estudio herramientas",
      en: "{topic} resources {subject} study materials tools"
    },
    research: {
      es: "{topic} investigación {subject} papers académicos estudios",
      en: "{topic} research {subject} academic papers studies"
    }
  }

  // Palabras clave para mejorar búsquedas académicas
  private static readonly ACADEMIC_ENHANCERS = {
    es: ["tutorial", "explicación", "concepto", "aprender", "estudiar", "académico", "educativo"],
    en: ["tutorial", "explanation", "concept", "learn", "study", "academic", "educational"]
  }

  // Filtros de calidad para contenido académico
  private static readonly QUALITY_INDICATORS = {
    high: ["edu", "academic", "university", "research", "scholar", "journal"],
    medium: ["tutorial", "guide", "course", "lesson", "explanation"],
    low: ["blog", "forum", "wiki", "opinion", "personal"]
  }

  /**
   * Realiza búsqueda académica inteligente
   */
  static async searchAcademicContent(query: AcademicSearchQuery): Promise<SearchAnalysis> {
    const startTime = Date.now()
    
    try {
      // Optimizar query para búsqueda académica
      const optimizedQuery = this.optimizeAcademicQuery(query)
      
      // Realizar búsqueda web
      const webSearchResults = await this.performWebSearch(optimizedQuery)
      
      // Procesar y analizar resultados
      const academicResults = await this.processSearchResults(webSearchResults, query)
      
      // Generar recomendaciones personalizadas
      const recommendations = await this.generatePersonalizedRecommendations(query, academicResults)
      
      const searchTime = Date.now() - startTime
      
      return {
        query,
        results: academicResults,
        searchSuccess: academicResults.length > 0,
        totalResults: academicResults.length,
        searchTime,
        personalizedRecommendations: recommendations.suggestions,
        followUpQuestions: recommendations.followUpQuestions,
        suggestedActions: recommendations.actions
      }
      
    } catch (error) {
      console.error('Error in academic search:', error)
      
      return {
        query,
        results: [],
        searchSuccess: false,
        totalResults: 0,
        searchTime: Date.now() - startTime,
        personalizedRecommendations: this.generateFallbackRecommendations(query),
        followUpQuestions: [],
        suggestedActions: ["Intentar con términos más específicos", "Verificar la conexión a internet"]
      }
    }
  }

  /**
   * Optimiza el query para búsqueda académica
   */
  private static optimizeAcademicQuery(query: AcademicSearchQuery): string {
    const { topic, subject, searchType, level, language = 'es' } = query
    
    // Obtener plantilla base
    const template = this.SEARCH_TEMPLATES[searchType][language]
    
    // Reemplazar variables
    let optimizedQuery = template
      .replace('{topic}', topic)
      .replace('{subject}', subject || '')
    
    // Agregar indicadores de nivel
    if (level) {
      const levelTerms = {
        es: { basic: 'básico principiante', intermediate: 'intermedio', advanced: 'avanzado experto' },
        en: { basic: 'basic beginner', intermediate: 'intermediate', advanced: 'advanced expert' }
      }
      optimizedQuery += ` ${levelTerms[language][level]}`
    }
    
    // Agregar términos académicos
    const enhancers = this.ACADEMIC_ENHANCERS[language]
    const selectedEnhancers = enhancers.slice(0, 2).join(' ')
    optimizedQuery += ` ${selectedEnhancers}`
    
    return optimizedQuery.trim()
  }

  /**
   * Realiza búsqueda web usando el sistema de integración web
   */
  private static async performWebSearch(query: string): Promise<any[]> {
    try {
      // Usar la integración web real
      const webResults = await WebSearchIntegration.performWebSearch(query)
      return webResults
      
    } catch (error) {
      console.error('Web search failed:', error)
      // Fallback a resultados simulados
      return this.generateSimulatedResults(query)
    }
  }

  /**
   * Genera resultados simulados para desarrollo
   */
  private static generateSimulatedResults(query: string): any[] {
    const simulatedResults = [
      {
        title: `Guía completa: ${query}`,
        content: `Explicación detallada sobre ${query} con ejemplos prácticos y ejercicios paso a paso.`,
        url: "https://ejemplo-academico.edu",
        source: "Universidad Académica"
      },
      {
        title: `Tutorial interactivo: ${query}`,
        content: `Aprende ${query} de manera visual e interactiva con herramientas modernas.`,
        url: "https://tutorial-educativo.com",
        source: "Portal Educativo"
      },
      {
        title: `Ejercicios resueltos: ${query}`,
        content: `Colección de problemas y ejercicios resueltos sobre ${query} con explicaciones.`,
        url: "https://ejercicios-academicos.org",
        source: "Recursos Académicos"
      }
    ]
    
    return simulatedResults
  }

  /**
   * Procesa y analiza resultados de búsqueda
   */
  private static async processSearchResults(rawResults: any[], query: AcademicSearchQuery): Promise<AcademicSearchResult[]> {
    const processedResults: AcademicSearchResult[] = []
    
    for (const result of rawResults.slice(0, 5)) { // Limitar a 5 resultados
      try {
        const academicResult: AcademicSearchResult = {
          title: result.title || 'Recurso Académico',
          content: result.content || result.snippet || '',
          source: result.source || this.extractDomain(result.url),
          relevanceScore: this.calculateRelevanceScore(result, query),
          difficulty: this.inferDifficulty(result.content || result.snippet || '', query.level),
          contentType: this.classifyContentType(result),
          summary: this.generateSummary(result.content || result.snippet || ''),
          keyPoints: this.extractKeyPoints(result.content || result.snippet || ''),
          relatedTopics: this.identifyRelatedTopics(result.content || result.snippet || '', query.topic),
          estimatedReadTime: this.estimateReadTime(result.content || result.snippet || '')
        }
        
        processedResults.push(academicResult)
      } catch (error) {
        console.error('Error processing result:', error)
      }
    }
    
    // Ordenar por relevancia
    processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    return processedResults
  }

  /**
   * Calcula puntuación de relevancia
   */
  private static calculateRelevanceScore(result: any, query: AcademicSearchQuery): number {
    let score = 0.5 // Base score
    
    const content = (result.content || result.snippet || '').toLowerCase()
    const title = (result.title || '').toLowerCase()
    const topic = query.topic.toLowerCase()
    
    // Coincidencia en título (mayor peso)
    if (title.includes(topic)) score += 0.3
    
    // Coincidencia en contenido
    if (content.includes(topic)) score += 0.2
    
    // Calidad de la fuente
    const domain = this.extractDomain(result.url || '')
    if (this.QUALITY_INDICATORS.high.some(indicator => domain.includes(indicator))) {
      score += 0.3
    } else if (this.QUALITY_INDICATORS.medium.some(indicator => content.includes(indicator))) {
      score += 0.1
    }
    
    // Longitud del contenido (más contenido = potencialmente más útil)
    if (content.length > 200) score += 0.1
    
    return Math.min(1.0, score)
  }

  /**
   * Infiere dificultad del contenido
   */
  private static inferDifficulty(content: string, queryLevel?: 'basic' | 'intermediate' | 'advanced'): 'basic' | 'intermediate' | 'advanced' {
    if (queryLevel) return queryLevel // Usar nivel especificado si está disponible
    
    const lowerContent = content.toLowerCase()
    
    // Indicadores de nivel básico
    const basicIndicators = ['básico', 'principiante', 'introducción', 'simple', 'fácil']
    const basicCount = basicIndicators.filter(indicator => lowerContent.includes(indicator)).length
    
    // Indicadores de nivel avanzado
    const advancedIndicators = ['avanzado', 'complejo', 'profundo', 'investigación', 'análisis']
    const advancedCount = advancedIndicators.filter(indicator => lowerContent.includes(indicator)).length
    
    if (advancedCount > basicCount) return 'advanced'
    if (basicCount > 0) return 'basic'
    return 'intermediate'
  }

  /**
   * Clasifica tipo de contenido
   */
  private static classifyContentType(result: any): AcademicSearchResult['contentType'] {
    const content = (result.content || result.snippet || '').toLowerCase()
    const title = (result.title || '').toLowerCase()
    const url = (result.url || '').toLowerCase()
    
    if (content.includes('video') || content.includes('youtube') || url.includes('youtube')) {
      return 'video'
    }
    if (content.includes('ejercicio') || content.includes('problema') || title.includes('ejercicio')) {
      return 'exercise'
    }
    if (content.includes('paper') || content.includes('investigación') || url.includes('scholar')) {
      return 'academic_paper'
    }
    if (content.includes('tutorial') || content.includes('guía') || title.includes('tutorial')) {
      return 'tutorial'
    }
    return 'article'
  }

  /**
   * Genera resumen del contenido
   */
  private static generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const firstTwoSentences = sentences.slice(0, 2).join('. ')
    
    if (firstTwoSentences.length > 150) {
      return firstTwoSentences.substring(0, 147) + '...'
    }
    
    return firstTwoSentences || 'Recurso académico sobre el tema solicitado.'
  }

  /**
   * Extrae puntos clave del contenido
   */
  private static extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = []
    
    // Buscar listas numeradas o con viñetas
    const listMatches = content.match(/(?:^\s*[\d\-\*\•]\s*.+$)/gm)
    if (listMatches) {
      keyPoints.push(...listMatches.slice(0, 3).map(item => item.replace(/^\s*[\d\-\*\•]\s*/, '').trim()))
    }
    
    // Si no hay listas, extraer oraciones importantes
    if (keyPoints.length === 0) {
      const sentences = content.split(/[.!?]+/)
      const importantSentences = sentences
        .filter(s => s.length > 30 && s.length < 100)
        .slice(0, 3)
      
      keyPoints.push(...importantSentences.map(s => s.trim()))
    }
    
    return keyPoints.filter(point => point.length > 10)
  }

  /**
   * Identifica temas relacionados
   */
  private static identifyRelatedTopics(content: string, mainTopic: string): string[] {
    const relatedTopics: string[] = []
    
    // Diccionario de temas relacionados por materia
    const topicRelations: { [key: string]: string[] } = {
      'matemáticas': ['álgebra', 'geometría', 'cálculo', 'estadística', 'trigonometría'],
      'física': ['mecánica', 'termodinámica', 'electromagnetismo', 'óptica', 'cuántica'],
      'química': ['orgánica', 'inorgánica', 'analítica', 'física química', 'bioquímica'],
      'programación': ['algoritmos', 'estructuras de datos', 'bases de datos', 'desarrollo web', 'inteligencia artificial']
    }
    
    const lowerContent = content.toLowerCase()
    const lowerTopic = mainTopic.toLowerCase()
    
    // Buscar relaciones directas
    for (const [subject, relations] of Object.entries(topicRelations)) {
      if (lowerTopic.includes(subject) || lowerContent.includes(subject)) {
        const foundRelations = relations.filter(relation => 
          lowerContent.includes(relation) && !lowerTopic.includes(relation)
        )
        relatedTopics.push(...foundRelations)
      }
    }
    
    return Array.from(new Set(relatedTopics)).slice(0, 3)
  }

  /**
   * Estima tiempo de lectura
   */
  private static estimateReadTime(content: string): number {
    const wordsPerMinute = 200 // Promedio de lectura en español
    const wordCount = content.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  /**
   * Extrae dominio de URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return 'fuente desconocida'
    }
  }

  /**
   * Genera recomendaciones personalizadas
   */
  private static async generatePersonalizedRecommendations(
    query: AcademicSearchQuery, 
    results: AcademicSearchResult[]
  ): Promise<{
    suggestions: string[]
    followUpQuestions: string[]
    actions: string[]
  }> {
    const suggestions: string[] = []
    const followUpQuestions: string[] = []
    const actions: string[] = []
    
    // Analizar resultados para generar sugerencias
    if (results.length > 0) {
      const hasBasicContent = results.some(r => r.difficulty === 'basic')
      const hasAdvancedContent = results.some(r => r.difficulty === 'advanced')
      
      if (hasBasicContent && query.level !== 'basic') {
        suggestions.push(`Encontré contenido básico sobre ${query.topic} que puede ayudarte a reforzar fundamentos`)
      }
      
      if (hasAdvancedContent && query.level !== 'advanced') {
        suggestions.push(`Hay material avanzado disponible cuando te sientas listo para profundizar`)
      }
      
      // Generar preguntas de seguimiento
      followUpQuestions.push(`¿Te gustaría que busque ejercicios prácticos sobre ${query.topic}?`)
      followUpQuestions.push(`¿Necesitas que encuentre videos explicativos sobre este tema?`)
      
      // Generar acciones sugeridas
      actions.push("Revisar los recursos encontrados por orden de relevancia")
      actions.push("Tomar notas de los puntos clave identificados")
      
      if (results.some(r => r.contentType === 'exercise')) {
        actions.push("Practicar con los ejercicios encontrados")
      }
    }
    
    // Agregar recomendaciones basadas en memoria si está disponible
    if (query.userId) {
      const memoryBasedSuggestions = await this.getMemoryBasedRecommendations(query)
      suggestions.push(...memoryBasedSuggestions)
    }
    
    return { suggestions, followUpQuestions, actions }
  }

  /**
   * Obtiene recomendaciones basadas en memoria del usuario
   */
  private static async getMemoryBasedRecommendations(query: AcademicSearchQuery): Promise<string[]> {
    if (!query.userId) return []
    
    try {
      const memory = ConversationMemoryManager.getMemory(query.userId, query.sessionId)
      const suggestions: string[] = []
      
      // Basado en materias difíciles
      if (memory.preferences.difficultSubjects.includes(query.subject || '')) {
        suggestions.push(`He notado que ${query.subject} te presenta desafíos. Te busqué recursos especialmente claros`)
      }
      
      // Basado en emociones recientes
      if (memory.emotionalProfile.recentEmotions.includes(EmotionType.CONFUSED)) {
        suggestions.push("Seleccioné explicaciones paso a paso considerando tu confusión reciente")
      }
      
      if (memory.emotionalProfile.recentEmotions.includes(EmotionType.MOTIVATED)) {
        suggestions.push("Vi que estás muy motivado, así que incluí material desafiante para aprovechar tu energía")
      }
      
      return suggestions
    } catch (error) {
      console.error('Error getting memory-based recommendations:', error)
      return []
    }
  }

  /**
   * Genera recomendaciones de respaldo cuando la búsqueda falla
   */
  private static generateFallbackRecommendations(query: AcademicSearchQuery): string[] {
    return [
      `Intenta buscar "${query.topic}" en recursos académicos locales`,
      `Consulta tu libro de texto sobre ${query.subject || 'la materia'}`,
      `Pregunta a tu profesor sobre ${query.topic} en la próxima clase`,
      "Revisa tus apuntes previos sobre temas relacionados"
    ]
  }

  /**
   * Realiza búsqueda inteligente basada en contexto conversacional
   */
  static async smartSearch(
    message: string,
    userId?: string,
    sessionId?: string
  ): Promise<SearchAnalysis | null> {
    // Extraer información de búsqueda del mensaje
    const searchQuery = this.extractSearchQuery(message)
    
    if (!searchQuery) return null
    
    // Enriquecer query con información del usuario
    if (userId) {
      const memory = ConversationMemoryManager.getMemory(userId, sessionId)
      
      // Inferir materia basándose en el contexto
      if (!searchQuery.subject && memory.preferences.difficultSubjects.length > 0) {
        searchQuery.subject = memory.preferences.difficultSubjects[0]
      }
      
      // Ajustar nivel basándose en el progreso
      if (!searchQuery.level) {
        searchQuery.level = memory.emotionalProfile.motivationLevel > 7 ? 'intermediate' : 'basic'
      }
      
      searchQuery.userId = userId
      searchQuery.sessionId = sessionId
    }
    
    return await this.searchAcademicContent(searchQuery)
  }

  /**
   * Extrae query de búsqueda del mensaje del usuario
   */
  private static extractSearchQuery(message: string): AcademicSearchQuery | null {
    const lowerMessage = message.toLowerCase()
    
    // Patrones para detectar solicitudes de búsqueda
    const searchPatterns = [
      /busca(?:me)?\s+(?:información|sobre|acerca\s+de)\s+(.+)/i,
      /(?:qué\s+es|explica(?:me)?)\s+(.+)/i,
      /(?:cómo|como)\s+(?:se\s+)?(.+)/i,
      /necesito\s+(?:información|ayuda|saber)\s+(?:sobre|de|con)\s+(.+)/i,
      /(?:ejemplos|ejercicios)\s+(?:de|sobre)\s+(.+)/i
    ]
    
    for (const pattern of searchPatterns) {
      const match = message.match(pattern)
      if (match) {
        const topic = match[1].trim()
        
        return {
          topic,
          searchType: this.inferSearchType(lowerMessage),
          language: 'es'
        }
      }
    }
    
    return null
  }

  /**
   * Infiere tipo de búsqueda basándose en el mensaje
   */
  private static inferSearchType(message: string): AcademicSearchQuery['searchType'] {
    if (/ejercicio|problema|práctica/.test(message)) return 'exercises'
    if (/ejemplo|caso|muestra/.test(message)) return 'examples'
    if (/recurso|material|herramienta/.test(message)) return 'resources'
    if (/investigación|paper|estudio/.test(message)) return 'research'
    return 'explanation'
  }
}