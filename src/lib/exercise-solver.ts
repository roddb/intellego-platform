import { aiService } from './ai-providers'

export interface ExerciseSolution {
  subject: 'physics' | 'chemistry' | 'mathematics' | 'general'
  type: 'problem_solving' | 'conceptual' | 'calculation'
  solution: string
  confidence: number
}

export class ExerciseSolver {
  
  /**
   * Detecta si un mensaje contiene un ejercicio para resolver
   */
  static detectExercise(message: string): {
    hasExercise: boolean
    subject: 'physics' | 'chemistry' | 'mathematics' | 'general'
    type: 'problem_solving' | 'conceptual' | 'calculation'
    confidence: number
  } {
    const msgLower = message.toLowerCase()
    
    // Palabras clave que indican ejercicio a resolver
    const exerciseKeywords = [
      'resuelve', 'resuelva', 'resolver', 'resolución',
      'calcula', 'calcule', 'calcular', 'cálculo', 'calculen',
      'encuentra', 'encuentre', 'encontrar', 'hallar', 'halle',
      'determina', 'determine', 'determinar', 'determinación',
      'ejercicio', 'problema', 'pregunta'
    ]
    
    const hasExerciseKeyword = exerciseKeywords.some(keyword => msgLower.includes(keyword))
    
    if (!hasExerciseKeyword) {
      return { hasExercise: false, subject: 'general', type: 'conceptual', confidence: 0 }
    }
    
    // Detectar materia
    let subject: 'physics' | 'chemistry' | 'mathematics' | 'general' = 'general'
    let confidence = 0.5
    
    // Palabras clave específicas por materia
    const physicsKeywords = [
      'presión', 'volumen', 'temperatura', 'gas', 'gases',
      'velocidad', 'aceleración', 'fuerza', 'masa', 'energía',
      'trabajo', 'potencia', 'momento', 'impulso', 'fricción',
      'ley de', 'newton', 'boyle', 'charles', 'gay-lussac',
      'cinemática', 'dinámica', 'termodinámica', 'mecánica',
      'atm', 'mmhg', 'pascal', 'joule', 'watt', 'newton',
      'm/s', 'km/h', 'cm³', 'dm³', 'moles', 'mol'
    ]
    
    const chemistryKeywords = [
      'reacción', 'reactivo', 'producto', 'estequiometría',
      'molar', 'molaridad', 'concentración', 'dilución',
      'ácido', 'base', 'ph', 'neutralización', 'sal',
      'oxidación', 'reducción', 'redox', 'electrólisis',
      'enlace', 'iónico', 'covalente', 'molecular',
      'átomo', 'molécula', 'elemento', 'compuesto',
      'masa atómica', 'masa molecular', 'número de avogadro'
    ]
    
    const mathKeywords = [
      'ecuación', 'función', 'derivada', 'integral',
      'límite', 'matriz', 'determinante', 'sistema',
      'trigonometría', 'logaritmo', 'exponencial',
      'probabilidad', 'estadística', 'geometría',
      'álgebra', 'polinomio', 'factorización'
    ]
    
    const physicsCount = physicsKeywords.reduce((count, word) => count + (msgLower.includes(word) ? 1 : 0), 0)
    const chemistryCount = chemistryKeywords.reduce((count, word) => count + (msgLower.includes(word) ? 1 : 0), 0)
    const mathCount = mathKeywords.reduce((count, word) => count + (msgLower.includes(word) ? 1 : 0), 0)
    
    if (physicsCount > 0) {
      subject = 'physics'
      confidence = Math.min(0.9, 0.6 + physicsCount * 0.1)
    } else if (chemistryCount > 0) {
      subject = 'chemistry'
      confidence = Math.min(0.9, 0.6 + chemistryCount * 0.1)
    } else if (mathCount > 0) {
      subject = 'mathematics'
      confidence = Math.min(0.9, 0.6 + mathCount * 0.1)
    }
    
    // Detectar tipo de ejercicio
    let type: 'problem_solving' | 'conceptual' | 'calculation' = 'conceptual'
    
    const calculationIndicators = [
      'calcula', 'calcule', 'calcular', 'cálculo', 'calculen',
      'encuentra', 'encuentre', 'hallar', 'halle',
      'determina', 'determine', 'valor', 'resultado'
    ]
    
    const problemSolvingIndicators = [
      'resuelve', 'resuelva', 'resolver', 'problema',
      'ejercicio', 'situación', 'caso', 'escenario'
    ]
    
    if (calculationIndicators.some(indicator => msgLower.includes(indicator))) {
      type = 'calculation'
    } else if (problemSolvingIndicators.some(indicator => msgLower.includes(indicator))) {
      type = 'problem_solving'
    }
    
    return {
      hasExercise: true,
      subject,
      type,
      confidence
    }
  }
  
  /**
   * Resuelve un ejercicio paso a paso
   */
  static async solveExercise(
    exerciseText: string, 
    subject: 'physics' | 'chemistry' | 'mathematics' | 'general',
    studentContext?: string
  ): Promise<ExerciseSolution> {
    
    const prompt = this.createSolutionPrompt(exerciseText, subject, studentContext)
    
    try {
      const solution = await aiService.generateExercise(prompt)
      
      return {
        subject,
        type: 'problem_solving',
        solution: solution === 'TEMPLATE_FALLBACK' ? 
          this.getFallbackSolution(exerciseText, subject) : 
          solution,
        confidence: solution === 'TEMPLATE_FALLBACK' ? 0.3 : 0.8
      }
    } catch (error) {
      console.error('Error solving exercise:', error)
      return {
        subject,
        type: 'problem_solving',
        solution: this.getFallbackSolution(exerciseText, subject),
        confidence: 0.2
      }
    }
  }
  
  /**
   * Crea el prompt especializado para resolución de ejercicios
   */
  private static createSolutionPrompt(
    exerciseText: string, 
    subject: 'physics' | 'chemistry' | 'mathematics' | 'general',
    studentContext?: string
  ): string {
    
    const subjectInstructions = {
      physics: `
**INSTRUCCIONES ESPECÍFICAS PARA FÍSICA:**
- Identifica TODAS las variables dadas y las que debes encontrar
- Convierte TODAS las unidades al Sistema Internacional (SI) si es necesario
- Aplica las leyes y fórmulas de física apropiadas (Boyle, Charles, Gay-Lussac, Newton, etc.)
- Realiza los cálculos paso a paso con todas las operaciones matemáticas
- Incluye las unidades en cada paso del cálculo
- Verifica que el resultado tenga sentido físico`,
      
      chemistry: `
**INSTRUCCIONES ESPECÍFICAS PARA QUÍMICA:**
- Identifica los reactivos, productos y datos dados
- Escribe la ecuación química balanceada si es necesario
- Convierte las unidades (gramos, moles, litros, etc.) según se requiera
- Aplica los conceptos de estequiometría, concentraciones, o leyes de gases
- Muestra todos los factores de conversión utilizados
- Calcula paso a paso con todas las operaciones matemáticas`,
      
      mathematics: `
**INSTRUCCIONES ESPECÍFICAS PARA MATEMÁTICAS:**
- Identifica el tipo de problema (ecuación, función, geometría, etc.)
- Organiza los datos dados y lo que se debe encontrar
- Aplica las fórmulas y teoremas apropiados
- Realiza cada operación matemática paso por paso
- Verifica la solución sustituyendo en la ecuación original`,
      
      general: `
**INSTRUCCIONES GENERALES:**
- Identifica el tipo de problema y la materia
- Organiza los datos dados y lo que se debe encontrar
- Aplica el método de resolución apropiado paso a paso`
    }
    
    return `Eres un tutor experto en ciencias exactas para estudiantes de secundaria. DEBES resolver este ejercicio COMPLETAMENTE paso a paso sin omitir ningún cálculo.

${subjectInstructions[subject]}

**INSTRUCCIONES CRÍTICAS:**
- COMPLETA todos los pasos de la resolución hasta el resultado final
- NO te detengas en el medio de los cálculos
- INCLUYE todas las operaciones matemáticas con números
- PRESENTA el resultado final con unidades correctas

**FORMATO OBLIGATORIO DE RESPUESTA:**

## 📋 **DATOS:**
[Lista TODOS los datos dados en el ejercicio con sus unidades]

## 🎯 **SE PIDE:**
[Especifica claramente qué se debe calcular o encontrar]

## 📐 **FÓRMULAS A UTILIZAR:**
[Lista las fórmulas o leyes que aplicarás]

## 🔄 **CONVERSIÓN DE UNIDADES:**
[Si es necesario, convierte todas las unidades al sistema apropiado]

## ⚡ **RESOLUCIÓN PASO A PASO:**

**Paso 1:** [Explica y realiza el primer cálculo completo]
**Paso 2:** [Explica y realiza el segundo cálculo completo]
**Paso 3:** [Continúa con todos los cálculos necesarios]
**Paso Final:** [Completa la resolución con el resultado numérico]

## ✅ **RESULTADO FINAL:**
[Presenta la respuesta final con unidades y explica qué significa físicamente]

## 🔍 **VERIFICACIÓN:**
[Verifica que el resultado tenga sentido y sea correcto]

---

**EJERCICIO A RESOLVER:**
${exerciseText}

${studentContext ? `\n**CONTEXTO DEL ESTUDIANTE:** ${studentContext}` : ''}

**IMPORTANTE: Resuelve COMPLETAMENTE hasta obtener el resultado final numérico con unidades.**`
  }
  
  /**
   * Solución de fallback cuando la IA no está disponible
   */
  private static getFallbackSolution(
    exerciseText: string, 
    subject: 'physics' | 'chemistry' | 'mathematics' | 'general'
  ): string {
    
    const subjectName = {
      physics: 'Física',
      chemistry: 'Química', 
      mathematics: 'Matemáticas',
      general: 'Ciencias Exactas'
    }[subject]
    
    return `## 📋 **EJERCICIO IDENTIFICADO**

He detectado que necesitas resolver un ejercicio de **${subjectName}**.

## 🔧 **METODOLOGÍA DE RESOLUCIÓN**

Para resolver este tipo de ejercicios de ${subjectName.toLowerCase()}, sigue estos pasos:

**1. ORGANIZAR DATOS:**
- Lista todos los valores dados
- Identifica las unidades
- Determina qué se debe calcular

**2. IDENTIFICAR FÓRMULAS:**
- Selecciona las leyes o fórmulas apropiadas
- Verifica que las unidades sean consistentes

**3. RESOLVER PASO A PASO:**
- Sustituye los valores en las fórmulas
- Realiza los cálculos ordenadamente
- Incluye unidades en cada paso

**4. VERIFICAR RESULTADO:**
- Comprueba que tenga sentido
- Revisa las unidades finales

## 💡 **RECOMENDACIÓN**

Te sugiero que intentes resolver el ejercicio siguiendo estos pasos y luego me muestres tu trabajo para que pueda verificarlo y ayudarte con cualquier duda específica.

¿Te gustaría que te ayude con algún paso en particular o tienes alguna duda sobre el procedimiento?`
  }
}