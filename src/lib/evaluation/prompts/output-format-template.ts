/**
 * Template de formato de salida obligatorio
 *
 * Este template se agrega DESPUÉS de cualquier rúbrica personalizada
 * para garantizar que el output JSON sea siempre consistente,
 * independientemente de la rúbrica usada.
 */

export const OUTPUT_FORMAT_TEMPLATE = `

---

## FORMATO DE SALIDA OBLIGATORIO

**IMPORTANTE:** Independientemente de la rúbrica utilizada, tu respuesta DEBE seguir EXACTAMENTE este formato JSON.

### Estructura Requerida:

\`\`\`json
{
  "scores": {
    "F1": { "nivel": 1|2|3|4, "puntaje": number },
    "F2": { "nivel": 1|2|3|4, "puntaje": number },
    "F3": { "nivel": 1|2|3|4, "puntaje": number },
    "F4": { "nivel": 1|2|3|4, "puntaje": number },
    "F5": { "nivel": 1|2|3|4, "puntaje": number }
  },
  "exerciseAnalysis": [
    {
      "exerciseNumber": number,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "specificFeedback": "string",
      "phaseEvaluations": {
        "F1": { "nivel": 1|2|3|4, "comment": "string" },
        "F2": { "nivel": 1|2|3|4, "comment": "string" },
        "F3": { "nivel": 1|2|3|4, "comment": "string" },
        "F4": { "nivel": 1|2|3|4, "comment": "string" },
        "F5": { "nivel": 1|2|3|4, "comment": "string" }
      }
    }
  ],
  "recommendations": [
    {
      "priority": "alta"|"media"|"baja",
      "title": "string",
      "reason": "string",
      "steps": ["string"],
      "suggestedResources": "string"
    }
  ]
}
\`\`\`

### Mapeo de Conceptos (Rúbrica → Sistema 5 Fases):

Debes interpretar la rúbrica proporcionada y mapearla a estas 5 fases:

- **F1 (Comprensión del Problema)**: ¿El estudiante entiende qué se le pide? Identifica datos relevantes, reconoce incógnitas, interpreta el contexto.

- **F2 (Identificación de Variables)**: ¿El estudiante identifica y define correctamente las variables? Símbolos apropiados, unidades correctas.

- **F3 (Selección de Herramientas)**: ¿El estudiante elige las fórmulas/métodos correctos? Justifica el uso de cada herramienta, adapta correctamente.

- **F4 (Ejecución y Cálculos)**: ¿El estudiante ejecuta correctamente los procedimientos? Desarrollo lógico, cálculos correctos, presentación ordenada.

- **F5 (Verificación y Análisis Crítico)**: ¿El estudiante verifica y analiza su resultado? Razonabilidad, análisis dimensional, interpretación.

### Conversión de Puntajes:

- **Nivel 4 (Excelente)**: 92.5 puntos
- **Nivel 3 (Bueno)**: 77 puntos
- **Nivel 2 (En Desarrollo)**: 62 puntos
- **Nivel 1 (Inicial)**: 27 puntos

### Instrucciones Finales:

1. Lee la rúbrica proporcionada cuidadosamente
2. Evalúa el examen del estudiante según esos criterios
3. **MAPEA** los resultados de la rúbrica a las 5 fases (F1-F5)
4. Genera el JSON con la estructura exacta especificada arriba
5. Devuelve SOLO el JSON, sin texto adicional antes o después

**Ejemplo de mapeo:**

Si la rúbrica evalúa "Símbolos de Lewis" y el estudiante los dibuja correctamente, eso corresponde a:
- F2 (Identificación de Variables): Nivel 4
- F3 (Selección de Herramientas): Nivel 3-4

Si la rúbrica evalúa "Cálculo de ΔEN" y el estudiante lo hace correctamente, eso corresponde a:
- F4 (Ejecución y Cálculos): Nivel 3-4

Si la rúbrica evalúa "Justificación" y el estudiante explica bien, eso corresponde a:
- F1 (Comprensión): Nivel 3-4
- F5 (Verificación/Análisis): Nivel 3-4

**CRÍTICO:** La respuesta DEBE ser JSON válido con EXACTAMENTE las keys: scores, exerciseAnalysis, recommendations.
`;
