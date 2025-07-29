// AI Exercise Generator with Multiple Provider Support
import { Exercise, ExerciseType, Subject, Difficulty } from './ai-tutor-service'
import { aiService } from './ai-providers'

// Singleton pattern for exercise generation
class AIExerciseGenerator {
  private static instance: AIExerciseGenerator
  private isInitialized = false

  private constructor() {}

  public static getInstance(): AIExerciseGenerator {
    if (!AIExerciseGenerator.instance) {
      AIExerciseGenerator.instance = new AIExerciseGenerator()
    }
    return AIExerciseGenerator.instance
  }

  // Initialize AI service (check available providers)
  async initialize() {
    if (this.isInitialized) return

    try {
      console.log('Checking available AI providers...')
      const availableProviders = await aiService.getAvailableProviders()
      console.log('Available AI providers:', availableProviders)
      
      this.isInitialized = true
      console.log('AI exercise generator initialized successfully')
    } catch (error) {
      console.error('Error initializing AI providers:', error)
      this.isInitialized = false
    }
  }

  // Generate exercise using AI or fallback to templates
  async generateExercise(
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType,
    studentContext?: any
  ): Promise<Exercise> {
    // Ensure AI service is initialized
    await this.initialize()
    
    try {
      const prompt = this.createPrompt(subject, difficulty, type, studentContext)
      const aiResponse = await aiService.generateExercise(prompt)
      
      // Check if AI service returned template fallback marker
      if (aiResponse === 'TEMPLATE_FALLBACK') {
        console.log('Using template fallback for exercise generation')
        return this.generateFromTemplate(subject, difficulty, type)
      }
      
      // Parse AI response into exercise
      return this.parseAIResponse(aiResponse, subject, difficulty, type)
    } catch (error) {
      console.error('AI generation failed, using templates:', error)
      return this.generateFromTemplate(subject, difficulty, type)
    }
  }

  // AI-powered exercise generation (now handled by AI service)
  private async generateWithAI(
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType,
    studentContext?: any
  ): Promise<Exercise> {
    const prompt = this.createPrompt(subject, difficulty, type, studentContext)
    const aiResponse = await aiService.generateExercise(prompt)
    
    if (aiResponse === 'TEMPLATE_FALLBACK') {
      throw new Error('AI providers not available')
    }
    
    return this.parseAIResponse(aiResponse, subject, difficulty, type)
  }

  // Create context-aware prompts
  private createPrompt(
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType,
    studentContext?: any
  ): string {
    const difficultyMap = {
      [Difficulty.BEGINNER]: 'principiante',
      [Difficulty.INTERMEDIATE]: 'intermedio',
      [Difficulty.ADVANCED]: 'avanzado',
      [Difficulty.EXPERT]: 'experto'
    }

    const typeMap = {
      [ExerciseType.BASIC_CONCEPTS]: 'conceptos básicos',
      [ExerciseType.PROBLEM_SOLVING]: 'resolución de problemas',
      [ExerciseType.CRITICAL_THINKING]: 'pensamiento crítico',
      [ExerciseType.APPLICATION]: 'aplicación práctica',
      [ExerciseType.REFLECTION]: 'reflexión'
    }

    const contextInfo = studentContext ? 
      `Considerando que el estudiante ha mostrado fortalezas en: ${studentContext.strengths?.join(', ')} y debilidades en: ${studentContext.weaknesses?.join(', ')}.` : 
      ''

    return `Crea un ejercicio educativo de ${subject} nivel ${difficultyMap[difficulty]} sobre ${typeMap[type]}. ${contextInfo}

Formato:
Título: [título conciso]
Pregunta: [pregunta clara y específica]
Opciones: A) [opción] B) [opción] C) [opción] D) [opción]
Respuesta: [letra correcta]
Explicación: [explicación detallada]
Pista: [pista útil]

Ejercicio:`
  }

  // Parse AI response into Exercise object
  private parseAIResponse(
    response: string, 
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType
  ): Exercise {
    try {
      const lines = response.split('\n').filter(line => line.trim())
      
      let title = 'Ejercicio Generado'
      let question = 'Pregunta no disponible'
      let options: string[] = []
      let correctAnswer = 'A'
      let explanation = 'Explicación no disponible'
      let hints: string[] = ['Revisa los conceptos básicos']

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('Título:')) {
          title = trimmed.replace('Título:', '').trim()
        } else if (trimmed.startsWith('Pregunta:')) {
          question = trimmed.replace('Pregunta:', '').trim()
        } else if (trimmed.match(/^[A-D]\)/)) {
          options.push(trimmed.substring(3).trim())
        } else if (trimmed.startsWith('Respuesta:')) {
          correctAnswer = trimmed.replace('Respuesta:', '').trim()
        } else if (trimmed.startsWith('Explicación:')) {
          explanation = trimmed.replace('Explicación:', '').trim()
        } else if (trimmed.startsWith('Pista:')) {
          hints = [trimmed.replace('Pista:', '').trim()]
        }
      }

      return {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description: `Ejercicio de ${subject} generado por IA`,
        type,
        subject,
        difficulty,
        question,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanation,
        hints,
        estimatedTime: this.getEstimatedTime(difficulty, type),
        tags: [subject, type, `nivel-${difficulty}`],
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return this.generateFromTemplate(subject, difficulty, type)
    }
  }

  // Template-based fallback generation
  private generateFromTemplate(
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType
  ): Exercise {
    const templates = this.getTemplatesByCategory(subject, difficulty, type)
    const template = templates[Math.floor(Math.random() * templates.length)]

    return {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      description: template.description,
      type,
      subject,
      difficulty,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: template.explanation,
      hints: template.hints,
      estimatedTime: this.getEstimatedTime(difficulty, type),
      tags: [subject, type, `nivel-${difficulty}`],
      createdAt: new Date()
    }
  }

  // Get exercise templates by category
  private getTemplatesByCategory(
    subject: Subject, 
    difficulty: Difficulty, 
    type: ExerciseType
  ) {
    // Mathematics templates
    const mathTemplates = {
      [Difficulty.BEGINNER]: [
        {
          title: 'Operaciones Básicas',
          description: 'Ejercicio de suma y resta',
          question: '¿Cuál es el resultado de 15 + 27?',
          options: ['42', '32', '52', '41'],
          correctAnswer: '42',
          explanation: '15 + 27 = 42. Se suman las unidades (5+7=12) y las decenas (1+2+1=4).',
          hints: ['Suma primero las unidades', 'No olvides llevar cuando sea necesario']
        },
        {
          title: 'Fracciones Simples',
          description: 'Identificación de fracciones',
          question: '¿Qué fracción representa la mitad de un entero?',
          options: ['1/2', '2/1', '1/4', '2/4'],
          correctAnswer: '1/2',
          explanation: 'Un entero dividido en 2 partes iguales da como resultado 1/2.',
          hints: ['Piensa en dividir algo en partes iguales', 'La mitad significa dividir entre 2']
        }
      ],
      [Difficulty.INTERMEDIATE]: [
        {
          title: 'Álgebra Básica',
          description: 'Resolución de ecuaciones lineales',
          question: 'Resuelve para x: 2x + 5 = 13',
          options: ['x = 4', 'x = 6', 'x = 3', 'x = 9'],
          correctAnswer: 'x = 4',
          explanation: '2x + 5 = 13, entonces 2x = 13 - 5 = 8, por lo tanto x = 8/2 = 4.',
          hints: ['Aísla la variable x', 'Resta 5 de ambos lados primero']
        }
      ]
    }

    // Programming templates
    const programmingTemplates = {
      [Difficulty.BEGINNER]: [
        {
          title: 'Variables en Programación',
          description: 'Concepto básico de variables',
          question: '¿Cuál es la función principal de una variable en programación?',
          options: [
            'Almacenar datos que pueden cambiar',
            'Ejecutar código automáticamente',
            'Crear interfaces gráficas',
            'Conectar a bases de datos'
          ],
          correctAnswer: 'Almacenar datos que pueden cambiar',
          explanation: 'Una variable es un contenedor que almacena datos que pueden ser modificados durante la ejecución del programa.',
          hints: ['Piensa en un contenedor', 'Los datos pueden cambiar de valor']
        }
      ]
    }

    // Science templates
    const scienceTemplates = {
      [Difficulty.BEGINNER]: [
        {
          title: 'Estados de la Materia',
          description: 'Conceptos básicos de física',
          question: '¿Cuáles son los tres estados principales de la materia?',
          options: [
            'Sólido, líquido, gaseoso',
            'Frío, tibio, caliente',
            'Pequeño, mediano, grande',
            'Duro, blando, flexible'
          ],
          correctAnswer: 'Sólido, líquido, gaseoso',
          explanation: 'Los tres estados principales de la materia son sólido, líquido y gaseoso, determinados por la energía y movimiento de las partículas.',
          hints: ['Piensa en el hielo, agua y vapor', 'Depende de la temperatura']
        }
      ]
    }

    // General templates
    const generalTemplates = {
      [Difficulty.BEGINNER]: [
        {
          title: 'Comprensión Lectora',
          description: 'Ejercicio de análisis de texto',
          question: 'La lectura comprensiva implica:',
          options: [
            'Entender y analizar el contenido',
            'Leer lo más rápido posible',
            'Memorizar todo el texto',
            'Solo leer las primeras líneas'
          ],
          correctAnswer: 'Entender y analizar el contenido',
          explanation: 'La lectura comprensiva requiere entendimiento profundo del texto, no solo velocidad o memorización.',
          hints: ['No se trata de velocidad', 'Implica entendimiento']
        }
      ]
    }

    const templateMap = {
      [Subject.MATHEMATICS]: mathTemplates,
      [Subject.PROGRAMMING]: programmingTemplates,
      [Subject.SCIENCE]: scienceTemplates,
      [Subject.GENERAL]: generalTemplates,
      [Subject.LANGUAGE]: generalTemplates // Usar plantillas generales para idiomas
    }

    return templateMap[subject]?.[difficulty] || generalTemplates[Difficulty.BEGINNER]
  }

  private getEstimatedTime(difficulty: Difficulty, type: ExerciseType): number {
    const baseTime = {
      [ExerciseType.BASIC_CONCEPTS]: 3,
      [ExerciseType.PROBLEM_SOLVING]: 8,
      [ExerciseType.CRITICAL_THINKING]: 12,
      [ExerciseType.APPLICATION]: 15,
      [ExerciseType.REFLECTION]: 10
    }

    const difficultyMultiplier = {
      [Difficulty.BEGINNER]: 1,
      [Difficulty.INTERMEDIATE]: 1.5,
      [Difficulty.ADVANCED]: 2,
      [Difficulty.EXPERT]: 2.5
    }

    return Math.round(baseTime[type] * difficultyMultiplier[difficulty])
  }

  // Generate multiple exercises for a practice session
  async generateExerciseSet(
    subjects: Subject[], 
    difficulty: Difficulty, 
    count: number = 5,
    studentContext?: any
  ): Promise<Exercise[]> {
    const exercises: Exercise[] = []
    const types = Object.values(ExerciseType)

    for (let i = 0; i < count; i++) {
      const subject = subjects[i % subjects.length]
      const type = types[i % types.length]
      
      try {
        const exercise = await this.generateExercise(subject, difficulty, type, studentContext)
        exercises.push(exercise)
      } catch (error) {
        console.error(`Error generating exercise ${i + 1}:`, error)
        // Continue with template fallback
        const fallbackExercise = this.generateFromTemplate(subject, difficulty, type)
        exercises.push(fallbackExercise)
      }
    }

    return exercises
  }
}

// Export singleton instance
export const aiExerciseGenerator = AIExerciseGenerator.getInstance()

// Helper function to initialize on first use
export async function initializeAI() {
  await aiExerciseGenerator.initialize()
}