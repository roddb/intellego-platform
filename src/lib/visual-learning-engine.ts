// Visual Learning Engine for Sara AI
// Generates ASCII diagrams, conceptual maps, and visual representations for enhanced learning

export enum VisualType {
  CONCEPT_MAP = 'concept_map',
  FLOWCHART = 'flowchart',
  HIERARCHY = 'hierarchy',
  TIMELINE = 'timeline',
  DIAGRAM = 'diagram',
  FORMULA_VISUALIZATION = 'formula_visualization',
  CHEMICAL_STRUCTURE = 'chemical_structure',
  MATH_GRAPH = 'math_graph',
  PROCESS_FLOW = 'process_flow'
}

export interface VisualElement {
  id: string
  type: VisualType
  title: string
  content: string
  connections?: string[]
  metadata?: {
    subject?: string
    difficulty?: 'basic' | 'intermediate' | 'advanced'
    keywords?: string[]
  }
}

export interface VisualRepresentation {
  type: VisualType
  ascii: string
  description: string
  elements: VisualElement[]
  instructions: string[]
}

export class VisualLearningEngine {

  /**
   * Generates visual representation based on content and type
   */
  static generateVisual(content: string, type: VisualType, subject?: string): VisualRepresentation {
    switch (type) {
      case VisualType.CONCEPT_MAP:
        return this.generateConceptMap(content, subject)
      case VisualType.FLOWCHART:
        return this.generateFlowchart(content)
      case VisualType.HIERARCHY:
        return this.generateHierarchy(content)
      case VisualType.TIMELINE:
        return this.generateTimeline(content)
      case VisualType.FORMULA_VISUALIZATION:
        return this.generateFormulaVisualization(content)
      case VisualType.CHEMICAL_STRUCTURE:
        return this.generateChemicalStructure(content)
      case VisualType.PROCESS_FLOW:
        return this.generateProcessFlow(content)
      default:
        return this.generateGenericDiagram(content)
    }
  }

  /**
   * Auto-detects the best visual type for content
   */
  static detectOptimalVisualType(content: string, subject?: string): VisualType {
    const contentLower = content.toLowerCase()

    // Chemical formulas and structures
    if (subject === 'chemistry' || subject === 'química' || 
        /h2o|co2|nacl|ch4|formula|molecular|átomo|molécula/.test(contentLower)) {
      return VisualType.CHEMICAL_STRUCTURE
    }

    // Mathematical formulas
    if (subject === 'mathematics' || subject === 'matemáticas' || 
        /ecuación|formula|función|derivada|integral|gráfica/.test(contentLower)) {
      return VisualType.FORMULA_VISUALIZATION
    }

    // Process or step-by-step content
    if (/paso|step|proceso|luego|después|entonces|primero|segundo/.test(contentLower)) {
      return VisualType.PROCESS_FLOW
    }

    // Hierarchical content
    if (/clasificación|categoría|tipo|nivel|jerarquía|superior|inferior/.test(contentLower)) {
      return VisualType.HIERARCHY
    }

    // Timeline content
    if (/año|fecha|siglo|época|antes|después|historia|cronología/.test(contentLower)) {
      return VisualType.TIMELINE
    }

    // Conceptual relationships
    if (/relación|concepto|idea|conecta|vincula|asocia/.test(contentLower)) {
      return VisualType.CONCEPT_MAP
    }

    // Default to flowchart for general content
    return VisualType.FLOWCHART
  }

  /**
   * Generates concept map visualization
   */
  static generateConceptMap(content: string, subject?: string): VisualRepresentation {
    const concepts = this.extractConcepts(content)
    const mainConcept = concepts[0] || 'Concepto Principal'
    const relatedConcepts = concepts.slice(1, 5)

    let ascii = `
┌─────────────────────┐
│   ${this.centerText(mainConcept, 17)}   │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │`

    relatedConcepts.forEach((concept, index) => {
      if (index < 2) {
        ascii += `
┌──────────────┐    ┌──────────────┐
│ ${this.centerText(concept, 12)} │    │              │
└──────────────┘    └──────────────┘`
      }
    })

    if (relatedConcepts.length > 2) {
      ascii += `
    │           │
┌───┴─────┐ ┌─────┴───┐`
      relatedConcepts.slice(2, 4).forEach(concept => {
        ascii += `
│ ${this.centerText(concept, 7)} │ │         │`
      })
      ascii += `
└─────────┘ └─────────┘`
    }

    return {
      type: VisualType.CONCEPT_MAP,
      ascii: ascii,
      description: `Mapa conceptual que muestra las relaciones entre ${mainConcept} y conceptos relacionados`,
      elements: concepts.map((concept, index) => ({
        id: `concept_${index}`,
        type: VisualType.CONCEPT_MAP,
        title: concept,
        content: `Concepto: ${concept}`,
        connections: index === 0 ? relatedConcepts : [mainConcept]
      })),
      instructions: [
        'El concepto central aparece en la parte superior',
        'Las líneas conectan conceptos relacionados',
        'Los conceptos secundarios se ramifican del principal'
      ]
    }
  }

  /**
   * Generates flowchart visualization
   */
  static generateFlowchart(content: string): VisualRepresentation {
    const steps = this.extractSteps(content)
    
    let ascii = `┌─────────────┐\n│   INICIO    │\n└──────┬──────┘\n       │\n       ▼`

    steps.forEach((step, index) => {
      const stepText = this.truncateText(step, 15)
      ascii += `
┌─────────────────┐
│ ${this.centerText(stepText, 15)} │
└─────────┬───────┘
          │
          ▼`
    })

    ascii += `
┌─────────────┐
│    FIN      │
└─────────────┘`

    return {
      type: VisualType.FLOWCHART,
      ascii: ascii,
      description: `Diagrama de flujo que muestra ${steps.length} pasos del proceso`,
      elements: steps.map((step, index) => ({
        id: `step_${index}`,
        type: VisualType.FLOWCHART,
        title: `Paso ${index + 1}`,
        content: step,
        connections: index < steps.length - 1 ? [`step_${index + 1}`] : []
      })),
      instructions: [
        'Sigue las flechas de arriba hacia abajo',
        'Cada caja representa un paso del proceso',
        'El flujo va desde INICIO hasta FIN'
      ]
    }
  }

  /**
   * Generates hierarchy visualization
   */
  static generateHierarchy(content: string): VisualRepresentation {
    const hierarchyItems = this.extractHierarchy(content)
    const root = hierarchyItems[0] || 'Elemento Principal'
    const children = hierarchyItems.slice(1, 4)
    const grandchildren = hierarchyItems.slice(4, 8)

    let ascii = `
                    ┌──────────────────┐
                    │ ${this.centerText(root, 16)} │
                    └─────────┬────────┘
                              │
                 ┌────────────┼────────────┐`

    children.forEach((child, index) => {
      const spacing = index === 0 ? '     ' : index === 1 ? '           ' : '                 '
      ascii += `
        ┌─────────────┐${spacing}┌─────────────┐
        │ ${this.centerText(child, 11)} │${spacing}│             │
        └─────────────┘${spacing}└─────────────┘`
    })

    if (grandchildren.length > 0) {
      ascii += `
              │                     │
        ┌─────┴─────┐         ┌─────┴─────┐`
      grandchildren.slice(0, 2).forEach(item => {
        ascii += `
        │ ${this.centerText(item, 9)} │         │           │`
      })
      ascii += `
        └───────────┘         └───────────┘`
    }

    return {
      type: VisualType.HIERARCHY,
      ascii: ascii,
      description: `Jerarquía que muestra la estructura de ${root} con ${children.length} niveles`,
      elements: hierarchyItems.map((item, index) => ({
        id: `hierarchy_${index}`,
        type: VisualType.HIERARCHY,
        title: item,
        content: `Elemento de jerarquía: ${item}`,
        connections: index === 0 ? children : []
      })),
      instructions: [
        'El elemento principal está en la parte superior',
        'Los elementos secundarios se conectan hacia abajo',
        'Cada nivel representa una subdivisión'
      ]
    }
  }

  /**
   * Generates timeline visualization
   */
  static generateTimeline(content: string): VisualRepresentation {
    const timeEvents = this.extractTimelineEvents(content)
    
    let ascii = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    
    timeEvents.forEach((event, index) => {
      const eventText = this.truncateText(event.event, 20)
      const timeText = event.time || `T${index + 1}`
      
      if (index % 2 === 0) {
        // Event above timeline
        ascii += `┌─────────────────────┐\n│ ${this.centerText(eventText, 19)} │\n└──────────┬──────────┘\n           │\n`
        ascii += `━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        ascii += `           ${timeText}\n\n`
      } else {
        // Event below timeline
        ascii += `           │\n           ┼\n┌──────────┴──────────┐\n│ ${this.centerText(eventText, 19)} │\n└─────────────────────┘\n`
      }
    })

    return {
      type: VisualType.TIMELINE,
      ascii: ascii,
      description: `Línea de tiempo con ${timeEvents.length} eventos cronológicos`,
      elements: timeEvents.map((event, index) => ({
        id: `event_${index}`,
        type: VisualType.TIMELINE,
        title: event.time || `Evento ${index + 1}`,
        content: event.event,
        connections: []
      })),
      instructions: [
        'Los eventos se muestran en orden cronológico',
        'La línea horizontal representa el tiempo',
        'Los eventos alternos aparecen arriba y abajo de la línea'
      ]
    }
  }

  /**
   * Generates formula visualization
   */
  static generateFormulaVisualization(content: string): VisualRepresentation {
    const formula = this.extractFormula(content)
    const variables = this.extractVariables(content)
    
    let ascii = `
╔═══════════════════════════════════╗
║         FÓRMULA MATEMÁTICA        ║
╠═══════════════════════════════════╣
║                                   ║
║         ${this.centerText(formula, 19)}         ║
║                                   ║
╠═══════════════════════════════════╣
║           VARIABLES:              ║`

    variables.forEach(variable => {
      ascii += `
║  ${variable.symbol} = ${this.truncateText(variable.description, 20)}    ║`
    })

    ascii += `
║                                   ║
╚═══════════════════════════════════╝

    Representación visual:
    
         ${formula}
         ↙     ↘
    Variable   Resultado
      ${variables[0]?.symbol || 'x'}         y`

    return {
      type: VisualType.FORMULA_VISUALIZATION,
      ascii: ascii,
      description: `Visualización de la fórmula ${formula} con ${variables.length} variables`,
      elements: [{
        id: 'formula_main',
        type: VisualType.FORMULA_VISUALIZATION,
        title: 'Fórmula Principal',
        content: formula,
        connections: variables.map((_, index) => `var_${index}`)
      }].concat(variables.map((variable, index) => ({
        id: `var_${index}`,
        type: VisualType.FORMULA_VISUALIZATION,
        title: variable.symbol,
        content: variable.description,
        connections: []
      }))),
      instructions: [
        'La fórmula principal se muestra en el centro',
        'Las variables se definen en la tabla inferior',
        'Sustituye los valores para resolver'
      ]
    }
  }

  /**
   * Generates chemical structure visualization
   */
  static generateChemicalStructure(content: string): VisualRepresentation {
    const molecule = this.extractMolecule(content)
    const atoms = this.extractAtoms(content)
    
    let ascii = ''

    // Simple molecular representations
    if (molecule.toLowerCase().includes('h2o') || molecule.toLowerCase().includes('agua')) {
      ascii = `
        Estructura del Agua (H₂O)
        
            H
            │
        H─O─H    o    H─O─H
            
        Representación angular:
        
            H
             \\
              O
             /
            H
              
        Ángulo H-O-H: 104.5°`
    } else if (molecule.toLowerCase().includes('co2')) {
      ascii = `
        Estructura del CO₂
        
        O═C═O
        
        Lineal, 180°
        
        Enlaces dobles:
        O ══ C ══ O`
    } else if (molecule.toLowerCase().includes('ch4') || molecule.toLowerCase().includes('metano')) {
      ascii = `
        Estructura del Metano (CH₄)
        
           H
           │
        H─C─H
           │
           H
           
        Tetraédrica
        Ángulo H-C-H: 109.5°`
    } else {
      ascii = `
        Estructura Molecular
        
        ${molecule}
        
        Átomos identificados:
        ${atoms.map(atom => `• ${atom}`).join('\n        ')}
        
        Representación esquemática:
        
        [Átomo1]─[Átomo2]─[Átomo3]`
    }

    return {
      type: VisualType.CHEMICAL_STRUCTURE,
      ascii: ascii,
      description: `Estructura química de ${molecule} mostrando ${atoms.length} tipos de átomos`,
      elements: [{
        id: 'molecule_main',
        type: VisualType.CHEMICAL_STRUCTURE,
        title: molecule,
        content: `Molécula: ${molecule}`,
        connections: atoms.map((_, index) => `atom_${index}`)
      }].concat(atoms.map((atom, index) => ({
        id: `atom_${index}`,
        type: VisualType.CHEMICAL_STRUCTURE,
        title: atom,
        content: `Átomo: ${atom}`,
        connections: []
      }))),
      instructions: [
        'Los átomos se representan con sus símbolos',
        'Las líneas representan enlaces químicos',
        'Los ángulos muestran la geometría molecular'
      ]
    }
  }

  /**
   * Generates process flow visualization
   */
  static generateProcessFlow(content: string): VisualRepresentation {
    const processes = this.extractProcesses(content)
    
    let ascii = `
    FLUJO DEL PROCESO
    
    ┌─────────────┐`

    processes.forEach((process, index) => {
      const processText = this.truncateText(process, 15)
      if (index === 0) {
        ascii += `
    │   ${this.centerText(processText, 9)}   │
    └─────┬───────┘
          │
          ▼`
      } else {
        ascii += `
    ┌─────────────┐
    │   ${this.centerText(processText, 9)}   │
    └─────┬───────┘
          │
          ▼`
      }
    })

    ascii += `
    ┌─────────────┐
    │   FINAL     │
    └─────────────┘`

    return {
      type: VisualType.PROCESS_FLOW,
      ascii: ascii,
      description: `Flujo de proceso con ${processes.length} etapas secuenciales`,
      elements: processes.map((process, index) => ({
        id: `process_${index}`,
        type: VisualType.PROCESS_FLOW,
        title: `Proceso ${index + 1}`,
        content: process,
        connections: index < processes.length - 1 ? [`process_${index + 1}`] : []
      })),
      instructions: [
        'Sigue el flujo de arriba hacia abajo',
        'Cada caja representa una etapa del proceso',
        'Las flechas indican la secuencia'
      ]
    }
  }

  /**
   * Generates generic diagram
   */
  static generateGenericDiagram(content: string): VisualRepresentation {
    const keyPoints = this.extractKeyPoints(content, 4)
    
    let ascii = `
    ╭─────────────────────────────────╮
    │        DIAGRAMA GENERAL         │
    ╰─────────────┬───────────────────╯
                  │`

    keyPoints.forEach((point, index) => {
      const pointText = this.truncateText(point, 20)
      ascii += `
                  ▼
    ┌─────────────────────────────┐
    │ ${index + 1}. ${this.leftAlign(pointText, 23)} │
    └─────────────────────────────┘`
    })

    return {
      type: VisualType.DIAGRAM,
      ascii: ascii,
      description: `Diagrama general con ${keyPoints.length} elementos principales`,
      elements: keyPoints.map((point, index) => ({
        id: `point_${index}`,
        type: VisualType.DIAGRAM,
        title: `Punto ${index + 1}`,
        content: point,
        connections: []
      })),
      instructions: [
        'Cada elemento se presenta de forma secuencial',
        'Los números indican el orden de importancia',
        'Revisa cada punto para comprensión completa'
      ]
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Extracts main concepts from content
   */
  private static extractConcepts(content: string): string[] {
    const sentences = content.split(/[.!?]+/)
    const concepts: string[] = []
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(' ')
      const importantWords = words.filter(word => 
        word.length > 4 && 
        !['este', 'esta', 'estos', 'estas', 'cuando', 'donde', 'porque'].includes(word.toLowerCase())
      )
      
      if (importantWords.length > 0) {
        concepts.push(importantWords[0])
      }
      
      if (concepts.length >= 5) break
    }
    
    return concepts.length > 0 ? concepts : ['Concepto Principal']
  }

  /**
   * Extracts steps from content
   */
  private static extractSteps(content: string): string[] {
    // Look for numbered steps or sequential indicators
    const stepPatterns = [
      /\d+[.)]\s*([^.!?]+)/g,
      /paso \d+:?\s*([^.!?]+)/gi,
      /(primero|segundo|tercero|luego|después|finalmente)[,:]?\s*([^.!?]+)/gi
    ]
    
    const steps: string[] = []
    
    for (const pattern of stepPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null && steps.length < 6) {
        const step = match[1] || match[2]
        if (step && step.trim().length > 5) {
          steps.push(step.trim())
        }
      }
    }
    
    if (steps.length === 0) {
      // Fallback: split by sentences
      const sentences = content.split(/[.!?]+/)
      steps.push(...sentences.slice(0, 4).filter(s => s.trim().length > 10))
    }
    
    return steps.slice(0, 5)
  }

  /**
   * Extracts hierarchy items
   */
  private static extractHierarchy(content: string): string[] {
    const hierarchyWords = ['principal', 'secundario', 'tipo', 'categoría', 'clase', 'grupo']
    const items: string[] = []
    const sentences = content.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      for (const word of hierarchyWords) {
        if (sentence.toLowerCase().includes(word)) {
          const cleanSentence = sentence.replace(/^\s*\d+[.)]\s*/, '').trim()
          if (cleanSentence.length > 5) {
            items.push(cleanSentence)
            break
          }
        }
      }
      if (items.length >= 6) break
    }
    
    return items.length > 0 ? items : ['Elemento Principal', 'Subelemento 1', 'Subelemento 2']
  }

  /**
   * Extracts timeline events
   */
  private static extractTimelineEvents(content: string): Array<{time: string, event: string}> {
    const timePattern = /(\d{4}|\d{1,2}:\d{2}|siglo \w+|era \w+)/gi
    const events: Array<{time: string, event: string}> = []
    const sentences = content.split(/[.!?]+/)
    
    for (const sentence of sentences) {
      const timeMatch = sentence.match(timePattern)
      if (timeMatch) {
        events.push({
          time: timeMatch[0],
          event: sentence.replace(timePattern, '').trim()
        })
      }
    }
    
    if (events.length === 0) {
      // Fallback timeline
      const keyEvents = sentences.slice(0, 3).filter(s => s.trim().length > 10)
      keyEvents.forEach((event, index) => {
        events.push({
          time: `T${index + 1}`,
          event: event.trim()
        })
      })
    }
    
    return events.slice(0, 5)
  }

  /**
   * Extracts formula from content
   */
  private static extractFormula(content: string): string {
    // Look for mathematical expressions
    const formulaPatterns = [
      /([a-zA-Z]\s*[=]\s*[^.!?]+)/,
      /([a-zA-Z]+\s*\(\s*[a-zA-Z,\s]+\s*\))/,
      /(f\([x-z]\)\s*=\s*[^.!?]+)/i,
      /([xy]\s*=\s*[^.!?]+)/
    ]
    
    for (const pattern of formulaPatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    // Fallback
    if (content.includes('=')) {
      const parts = content.split('=')
      if (parts.length >= 2) {
        return `${parts[0].trim()} = ${parts[1].split(/[.!?]/)[0].trim()}`
      }
    }
    
    return 'y = f(x)'
  }

  /**
   * Extracts variables from content
   */
  private static extractVariables(content: string): Array<{symbol: string, description: string}> {
    const variables: Array<{symbol: string, description: string}> = []
    
    // Look for variable definitions like "donde x es..."
    const varPattern = /([a-zA-Z])\s+es\s+([^.!?]+)/gi
    let match
    
    while ((match = varPattern.exec(content)) !== null && variables.length < 4) {
      variables.push({
        symbol: match[1],
        description: match[2].trim()
      })
    }
    
    if (variables.length === 0) {
      variables.push(
        { symbol: 'x', description: 'variable independiente' },
        { symbol: 'y', description: 'variable dependiente' }
      )
    }
    
    return variables
  }

  /**
   * Extracts molecule information
   */
  private static extractMolecule(content: string): string {
    const moleculePatterns = [
      /([A-Z][a-z]?\d*)+/g,  // Chemical formula pattern
      /(agua|metano|dióxido|carbono|oxígeno|hidrógeno)/i
    ]
    
    for (const pattern of moleculePatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[0]
      }
    }
    
    return 'Molécula'
  }

  /**
   * Extracts atoms from content
   */
  private static extractAtoms(content: string): string[] {
    const atomSymbols = content.match(/[A-Z][a-z]?/g) || []
    const uniqueAtoms = [...new Set(atomSymbols)]
    
    if (uniqueAtoms.length === 0) {
      return ['C', 'H', 'O']
    }
    
    return uniqueAtoms.slice(0, 5)
  }

  /**
   * Extracts processes from content
   */
  private static extractProcesses(content: string): string[] {
    const processes = this.extractSteps(content)
    return processes.length > 0 ? processes : ['Proceso 1', 'Proceso 2', 'Proceso 3']
  }

  /**
   * Extracts key points from content
   */
  private static extractKeyPoints(content: string, limit: number = 4): string[] {
    const sentences = content.split(/[.!?]+/)
    return sentences
      .filter(s => s.trim().length > 10)
      .slice(0, limit)
      .map(s => s.trim())
  }

  // ===== TEXT FORMATTING UTILITIES =====

  /**
   * Centers text in a fixed width
   */
  private static centerText(text: string, width: number): string {
    const truncated = this.truncateText(text, width)
    const padding = Math.max(0, width - truncated.length)
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    return ' '.repeat(leftPad) + truncated + ' '.repeat(rightPad)
  }

  /**
   * Left aligns text in a fixed width
   */
  private static leftAlign(text: string, width: number): string {
    const truncated = this.truncateText(text, width)
    const padding = Math.max(0, width - truncated.length)
    return truncated + ' '.repeat(padding)
  }

  /**
   * Truncates text to fit width
   */
  private static truncateText(text: string, maxWidth: number): string {
    if (text.length <= maxWidth) {
      return text
    }
    return text.substring(0, maxWidth - 3) + '...'
  }

  /**
   * Main entry point - analyzes content and generates appropriate visual
   */
  static generateOptimalVisual(content: string, subject?: string): VisualRepresentation {
    const optimalType = this.detectOptimalVisualType(content, subject)
    return this.generateVisual(content, optimalType, subject)
  }

  /**
   * Generates multiple visual options for user to choose from
   */
  static generateVisualOptions(content: string, subject?: string): VisualRepresentation[] {
    const primaryType = this.detectOptimalVisualType(content, subject)
    const options: VisualRepresentation[] = [
      this.generateVisual(content, primaryType, subject)
    ]

    // Add alternative visualizations
    const alternativeTypes = [VisualType.CONCEPT_MAP, VisualType.FLOWCHART, VisualType.DIAGRAM]
    
    for (const type of alternativeTypes) {
      if (type !== primaryType && options.length < 3) {
        options.push(this.generateVisual(content, type, subject))
      }
    }

    return options
  }
}