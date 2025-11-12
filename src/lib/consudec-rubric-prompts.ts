/**
 * Prompts de IA para evaluación de trabajos prácticos CONSUDEC
 * Sistema de rúbricas para formación docente
 */

export interface ConsudecRubric {
  criterion: string
  description: string
  weight: number // Porcentaje del total (debe sumar 100)
  levels: {
    excellent: { score: number; description: string }
    good: { score: number; description: string }
    satisfactory: { score: number; description: string }
    needs_improvement: { score: number; description: string }
  }
}

/**
 * Rúbrica estándar para evaluación de trabajos prácticos CONSUDEC
 */
export const CONSUDEC_DEFAULT_RUBRIC: ConsudecRubric[] = [
  {
    criterion: 'Claridad y completitud de la descripción',
    description: 'Describe detalladamente el trabajo, objetivos, metodología y resultados',
    weight: 20,
    levels: {
      excellent: {
        score: 100,
        description: 'Descripción exhaustiva con todos los elementos presentes, claramente articulados'
      },
      good: {
        score: 80,
        description: 'Descripción completa pero con algunos aspectos que podrían desarrollarse más'
      },
      satisfactory: {
        score: 65,
        description: 'Descripción básica con elementos faltantes o poco desarrollados'
      },
      needs_improvement: {
        score: 40,
        description: 'Descripción incompleta o confusa'
      }
    }
  },
  {
    criterion: 'Estrategias didácticas',
    description: 'Fundamentación y aplicación de estrategias pedagógicas apropiadas',
    weight: 25,
    levels: {
      excellent: {
        score: 100,
        description: 'Estrategias fundamentadas teóricamente, bien implementadas y adaptadas al contexto'
      },
      good: {
        score: 80,
        description: 'Estrategias apropiadas con buena implementación pero con espacio para mayor fundamentación'
      },
      satisfactory: {
        score: 65,
        description: 'Estrategias básicas con implementación limitada o poca fundamentación'
      },
      needs_improvement: {
        score: 40,
        description: 'Estrategias poco apropiadas o sin fundamentación clara'
      }
    }
  },
  {
    criterion: 'Reflexión sobre la práctica',
    description: 'Capacidad de identificar dificultades y proponer soluciones fundamentadas',
    weight: 25,
    levels: {
      excellent: {
        score: 100,
        description: 'Reflexión profunda con análisis crítico de dificultades y soluciones bien fundamentadas'
      },
      good: {
        score: 80,
        description: 'Reflexión adecuada con identificación de dificultades y propuestas de mejora razonables'
      },
      satisfactory: {
        score: 65,
        description: 'Reflexión superficial con dificultades identificadas pero soluciones poco desarrolladas'
      },
      needs_improvement: {
        score: 40,
        description: 'Reflexión mínima o ausente, sin análisis crítico'
      }
    }
  },
  {
    criterion: 'Aprendizajes construidos',
    description: 'Metacognición sobre el propio proceso de aprendizaje docente',
    weight: 15,
    levels: {
      excellent: {
        score: 100,
        description: 'Identificación clara de aprendizajes significativos con conexiones teórico-prácticas'
      },
      good: {
        score: 80,
        description: 'Identificación de aprendizajes relevantes con algunas conexiones'
      },
      satisfactory: {
        score: 65,
        description: 'Identificación básica de aprendizajes sin profundización'
      },
      needs_improvement: {
        score: 40,
        description: 'Aprendizajes vagos o genéricos sin reflexión profunda'
      }
    }
  },
  {
    criterion: 'Proyección y transferencia',
    description: 'Capacidad de proyectar lo aprendido a la futura práctica docente',
    weight: 15,
    levels: {
      excellent: {
        score: 100,
        description: 'Propuestas concretas y viables de transferencia a la práctica futura, bien fundamentadas'
      },
      good: {
        score: 80,
        description: 'Propuestas claras de aplicación con fundamento razonable'
      },
      satisfactory: {
        score: 65,
        description: 'Propuestas genéricas con poca especificidad'
      },
      needs_improvement: {
        score: 40,
        description: 'Sin propuestas concretas de transferencia'
      }
    }
  }
]

/**
 * Genera el prompt para Claude AI basado en la rúbrica CONSUDEC
 */
export function generateConsudecEvaluationPrompt(
  projectTitle: string,
  subject: string,
  responses: {
    descripcionProyecto: string
    estrategiasDidacticas: string
    dificultadesAbordaje: string
    aprendizajesClave: string
    aplicacionPractica: string
  },
  rubric: ConsudecRubric[] = CONSUDEC_DEFAULT_RUBRIC
): string {
  return `Sos un evaluador experto en formación docente del CONSUDEC. Debes evaluar el siguiente trabajo práctico de un estudiante del profesorado utilizando la rúbrica provista.

**INFORMACIÓN DEL TRABAJO:**
- Título: ${projectTitle}
- Materia: ${subject}

**RESPUESTAS DEL ESTUDIANTE:**

1. Descripción del trabajo realizado:
${responses.descripcionProyecto}

2. Estrategias didácticas implementadas:
${responses.estrategiasDidacticas}

3. Dificultades encontradas y cómo las abordó:
${responses.dificultadesAbordaje}

4. Aprendizajes clave de esta experiencia:
${responses.aprendizajesClave}

5. Aplicación en su futura práctica docente:
${responses.aplicacionPractica}

**RÚBRICA DE EVALUACIÓN:**

${rubric.map((criterion, index) => `
${index + 1}. **${criterion.criterion}** (Peso: ${criterion.weight}%)
   ${criterion.description}

   Niveles de desempeño:
   - Excelente (${criterion.levels.excellent.score}): ${criterion.levels.excellent.description}
   - Bueno (${criterion.levels.good.score}): ${criterion.levels.good.description}
   - Satisfactorio (${criterion.levels.satisfactory.score}): ${criterion.levels.satisfactory.description}
   - Necesita mejorar (${criterion.levels.needs_improvement.score}): ${criterion.levels.needs_improvement.description}
`).join('\n')}

**INSTRUCCIONES:**

1. Analiza cada respuesta del estudiante en función de los criterios de la rúbrica.
2. Asigna un puntaje a cada criterio basado en los niveles de desempeño.
3. Calcula el puntaje total ponderado (sobre 100 puntos).
4. Proporciona retroalimentación constructiva y específica.

**FORMATO DE RESPUESTA (JSON):**

Debes responder ÚNICAMENTE con un objeto JSON válido con esta estructura:

{
  "score": <número entre 0 y 100>,
  "criteriaScores": {
    "claridad_descripcion": <número>,
    "estrategias_didacticas": <número>,
    "reflexion_practica": <número>,
    "aprendizajes_construidos": <número>,
    "proyeccion_transferencia": <número>
  },
  "strengths": "<2-3 fortalezas específicas del trabajo, máximo 200 palabras>",
  "improvements": "<2-3 áreas de mejora concretas con sugerencias, máximo 200 palabras>",
  "generalComments": "<comentario general constructivo sobre el trabajo, máximo 150 palabras>",
  "detailedFeedback": "<análisis detallado por criterio, máximo 300 palabras>"
}

**IMPORTANTE:**
- Sé constructivo y específico en tus comentarios
- Destaca fortalezas antes de señalar áreas de mejora
- Proporciona ejemplos concretos cuando sea posible
- Usa lenguaje profesional pero cercano
- NO incluyas explicaciones fuera del JSON, SOLO devuelve el objeto JSON válido`
}

/**
 * Parsea la respuesta de Claude AI y extrae el feedback estructurado
 */
export function parseConsudecAIResponse(aiResponse: string): {
  score: number
  criteriaScores: Record<string, number>
  strengths: string
  improvements: string
  generalComments: string
  detailedFeedback: string
} {
  try {
    // Intentar parsear directamente
    const parsed = JSON.parse(aiResponse)
    return parsed
  } catch (error) {
    // Si falla, intentar extraer JSON del texto
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('Error parsing AI response:', e)
        throw new Error('Invalid AI response format')
      }
    }
    throw new Error('Could not extract JSON from AI response')
  }
}

/**
 * Valida que el puntaje calculado sea consistente con los puntajes por criterio
 */
export function validateConsudecScore(
  totalScore: number,
  criteriaScores: Record<string, number>,
  rubric: ConsudecRubric[] = CONSUDEC_DEFAULT_RUBRIC
): boolean {
  const calculatedScore = rubric.reduce((acc, criterion, index) => {
    const scoreKey = Object.keys(criteriaScores)[index]
    const criterionScore = criteriaScores[scoreKey] || 0
    return acc + (criterionScore * criterion.weight / 100)
  }, 0)

  // Tolerancia de ±2 puntos por redondeos
  return Math.abs(calculatedScore - totalScore) <= 2
}
