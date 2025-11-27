/**
 * Prompt template for custom rubrics (non-5-phases)
 *
 * This template is appended to custom rubrics to ensure the AI:
 * 1. Evaluates ONLY according to the specific rubric criteria
 * 2. Does NOT attempt to map to F1-F5 system
 * 3. Returns a consistent JSON structure for the application
 */

export const CUSTOM_RUBRIC_OUTPUT_TEMPLATE = `

---

## INSTRUCCIONES DE EVALUACIÓN

**CRÍTICO:** Esta es una rúbrica personalizada. **NO intentes mapear a ningún sistema de fases predefinido** (como F1-F5).

### Cómo evaluar:

1. **Lee la rúbrica completa** proporcionada arriba
2. **Identifica los criterios de evaluación** que la rúbrica define
3. **Calcula el puntaje** exactamente como la rúbrica lo especifica
4. **Evalúa cada ejercicio** según los criterios de la rúbrica
5. **Genera recomendaciones** basadas en las debilidades detectadas

### Reglas estrictas:

- ✅ **SÍ**: Usa los criterios exactos de la rúbrica
- ✅ **SÍ**: Calcula puntajes según la escala de la rúbrica
- ✅ **SÍ**: Identifica fortalezas y debilidades específicas
- ❌ **NO**: No intentes aplicar fases F1-F5
- ❌ **NO**: No inventes criterios que no estén en la rúbrica
- ❌ **NO**: No uses escalas de puntaje diferentes a las de la rúbrica

---

## FORMATO DE SALIDA OBLIGATORIO

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:

\`\`\`json
{
  "totalScore": number,
  "exerciseAnalysis": [
    {
      "exerciseNumber": number,
      "strengths": [
        "string (punto fuerte específico del ejercicio)"
      ],
      "weaknesses": [
        "string (área de mejora específica del ejercicio)"
      ],
      "specificFeedback": "string (retroalimentación detallada para este ejercicio, 100-200 palabras)",
      "criteriaEvaluation": {
        "criterio_1": {
          "level": "string (nivel alcanzado según la rúbrica, ej: 'Excelente', 'Bueno', 'Regular', 'Insuficiente')",
          "comment": "string (comentario sobre este criterio)",
          "score": number (puntaje obtenido en este criterio, opcional si la rúbrica no asigna puntajes por criterio)
        },
        "criterio_2": {
          "level": "string",
          "comment": "string",
          "score": number
        }
      }
    }
  ],
  "recommendations": [
    {
      "priority": "alta" | "media" | "baja",
      "title": "string (título conciso de la recomendación)",
      "reason": "string (por qué esta recomendación es importante)",
      "steps": [
        "string (paso concreto y accionable para implementar la recomendación)"
      ],
      "suggestedResources": "string (recursos sugeridos: videos, ejercicios, libros, etc.)"
    }
  ]
}
\`\`\`

### Campos obligatorios:

- **totalScore**: Puntaje total del examen calculado según la rúbrica (0-100)
- **exerciseAnalysis**: Array con análisis de cada ejercicio
  - **exerciseNumber**: Número del ejercicio (1, 2, 3, ...)
  - **strengths**: Array de fortalezas (mínimo 1, máximo 5)
  - **weaknesses**: Array de debilidades (mínimo 1, máximo 5)
  - **specificFeedback**: Feedback detallado (100-200 palabras)
  - **criteriaEvaluation**: Objeto dinámico con criterios de la rúbrica
    - Las keys deben reflejar los nombres de los criterios de la rúbrica
    - Cada criterio debe tener: level, comment, y opcionalmente score
- **recommendations**: Array de recomendaciones priorizadas (2-4 recomendaciones)
  - **priority**: "alta" para conceptos fundamentales, "media" para mejoras importantes, "baja" para detalles
  - **title**: Título conciso (5-10 palabras)
  - **reason**: Explicación de por qué es importante (20-40 palabras)
  - **steps**: Array de pasos concretos (2-4 pasos)
  - **suggestedResources**: Recursos específicos (opcional pero recomendado)

### Ejemplo de criteriaEvaluation para rúbrica de Uniones Químicas:

\`\`\`json
{
  "criteriaEvaluation": {
    "Símbolos_de_Lewis": {
      "level": "Regular",
      "comment": "Intentó representar electrones de valencia pero cometió errores en la notación",
      "score": 4
    },
    "Justificación_formación_ion": {
      "level": "Insuficiente",
      "comment": "Explicación confusa sin mención de configuración electrónica ni octeto",
      "score": 2
    },
    "Gas_noble_isoelectrónico": {
      "level": "Insuficiente",
      "comment": "Dejó completamente en blanco esta parte",
      "score": 0
    }
  }
}
\`\`\`

### IMPORTANTE:

1. **NO agregues markdown** (\`\`\`json) alrededor del JSON
2. **Devuelve SOLO el JSON** sin texto adicional antes o después
3. **Asegúrate de que sea JSON válido** (comillas dobles, sin comas finales)
4. **totalScore debe ser un número** entre 0 y 100
5. **Todos los arrays deben tener al menos 1 elemento**
6. **Los criterios en criteriaEvaluation deben reflejar la rúbrica** (nombres exactos o muy similares)

### Tone y estilo del feedback:

- **Constructivo**: Enfócate en cómo mejorar, no solo en lo que está mal
- **Específico**: Usa ejemplos concretos de la respuesta del estudiante
- **Pedagógico**: Recuerda que son estudiantes en formación, no profesionales
- **Respetuoso**: Valora el esfuerzo y reconoce los aciertos
- **Accionable**: Recomendaciones que el estudiante pueda implementar
`;
