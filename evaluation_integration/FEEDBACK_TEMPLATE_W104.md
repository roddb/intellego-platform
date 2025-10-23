# Template de Feedback - Workflow 104 (Básico)

**Uso**: Para estudiantes SIN historial o diagnósticos iniciales
**Campo BD**: `Evaluation.feedback` (TEXT)
**Variables**: Se reemplazan en runtime

---

## 📋 Estructura del Feedback (6 Secciones)

```markdown
# RETROALIMENTACIÓN - {{STUDENT_NAME}}

## Examen: {{SUBJECT}} - {{EXAM_TOPIC}}
### Fecha: {{EXAM_DATE}}
### Nota: {{SCORE}}/100

---

## 📊 Resumen de tu Desempeño

Has obtenido **{{SCORE}}/100** en este examen.

### Distribución por Fases

| Fase | Descripción | Nivel | Puntaje | Peso |
|------|-------------|-------|---------|------|
| F1 | Comprensión del Problema | {{F1_LEVEL}} | {{F1_SCORE}}/100 | 15% |
| F2 | Identificación de Variables | {{F2_LEVEL}} | {{F2_SCORE}}/100 | 20% |
| F3 | Selección de Herramientas | {{F3_LEVEL}} | {{F3_SCORE}}/100 | 25% |
| F4 | Ejecución y Cálculos | {{F4_LEVEL}} | {{F4_SCORE}}/100 | 30% |
| F5 | Verificación de Resultados | {{F5_LEVEL}} | {{F5_SCORE}}/100 | 10% |

**Nota Final:** {{SCORE}}/100 (promedio ponderado)

### Niveles de Desempeño
- **Nivel 4 (85-100):** Excelente - Dominio completo de la fase
- **Nivel 3 (70-84):** Bueno - Comprensión sólida con detalles menores
- **Nivel 2 (55-69):** En Desarrollo - Comprensión básica, necesita práctica
- **Nivel 1 (0-54):** Inicial - Requiere apoyo significativo

---

## 🔍 Verificación Matemática del Sistema

{{#each EXERCISES}}
### Ejercicio {{number}}: {{title}}

**Datos del problema:** {{problem_data}}

**Resolución correcta del sistema:** {{system_solution}}

**Tu resultado:** {{student_result}}

**Análisis:**
- Error: {{error_percentage}}%
- Estado: {{verification_status}} (tolerancia ±5%)
- Comentario: {{verification_comment}}

{{/each}}

---

## 🎯 Análisis Ejercicio por Ejercicio

{{#each EXERCISES}}
### Ejercicio {{number}}: {{title}}

#### Tu Desarrollo:
{{student_development}}

#### Retroalimentación Específica:

**Fortalezas:**
{{#each strengths}}
- {{this}}
{{/each}}

**Áreas de Mejora:**
{{#each weaknesses}}
- {{this}}
{{/each}}

**Evaluación por Fase:**
- **F1 - Comprensión:** {{F1_level}} - {{F1_comment}}
- **F2 - Variables:** {{F2_level}} - {{F2_comment}}
- **F3 - Herramientas:** {{F3_level}} - {{F3_comment}}
- **F4 - Ejecución:** {{F4_level}} - {{F4_comment}}
- **F5 - Verificación:** {{F5_level}} - {{F5_comment}}

---

{{/each}}

## 💡 Recomendaciones para Mejorar

{{#each RECOMMENDATIONS}}
### {{priority_icon}} {{title}}

**Por qué es importante:**
{{reason}}

**Cómo implementarlo:**
{{#each steps}}
- {{this}}
{{/each}}

**Recursos sugeridos:** {{suggested_resources}}

---

{{/each}}

## 📈 Próximos Pasos

### Plan de Acción Inmediato:
{{#each IMMEDIATE_ACTIONS}}
- [ ] {{this}}
{{/each}}

### Enfócate en:
{{FOCUS_AREAS}}

### Seguimiento:
{{FOLLOW_UP_MESSAGE}}

---

## 📌 Mensaje Final

{{FINAL_MESSAGE}}

---

**Corrección realizada por:** {{INSTRUCTOR_NAME}}
**Sistema:** Intellego Platform - Corrección Automática v1.0
**Método:** Workflow 104 (Análisis Básico sin Historial)
**Fecha de corrección:** {{CORRECTION_DATE}}

**Nota:** Este es un análisis inicial. A medida que completes más actividades en la plataforma, podremos generar retroalimentación más personalizada comparando tu progreso histórico.
```

---

## 🔧 Variables a Reemplazar en Runtime

### Información del Estudiante
- `{{STUDENT_NAME}}`: Nombre completo del estudiante (de User.name)
- `{{SUBJECT}}`: Materia del examen (Evaluation.subject)
- `{{EXAM_TOPIC}}`: Tema específico del examen (Evaluation.examTopic)
- `{{EXAM_DATE}}`: Fecha del examen (Evaluation.examDate)

### Score
- `{{SCORE}}`: Nota final del examen (Evaluation.score, 0-100)

### Scores por Fase
Para cada fase (F1-F5):
- `{{FX_LEVEL}}`: Nivel alcanzado (1, 2, 3, o 4)
- `{{FX_SCORE}}`: Puntaje en la fase (0-100)

Mapping Nivel → Puntaje:
- Nivel 4 → 92.5 puntos
- Nivel 3 → 77 puntos
- Nivel 2 → 62 puntos
- Nivel 1 → 27 puntos

### Verificación Matemática (array EXERCISES)
Cada ejercicio contiene:
- `number`: Número del ejercicio
- `title`: Título del ejercicio
- `problem_data`: Datos del problema
- `system_solution`: Solución correcta del sistema
- `student_result`: Resultado del alumno
- `error_percentage`: Porcentaje de error
- `verification_status`: CORRECTO / INCORRECTO
- `verification_comment`: Comentario sobre la verificación

### Análisis por Ejercicio (array EXERCISES)
Cada ejercicio contiene:
- `student_development`: Descripción del desarrollo del alumno
- `strengths`: Array de fortalezas identificadas
- `weaknesses`: Array de debilidades identificadas
- `FX_level`: Nivel 1-4 para cada fase
- `FX_comment`: Comentario específico para cada fase

### Recomendaciones (array RECOMMENDATIONS)
Cada recomendación contiene:
- `priority_icon`: 🔴 (Alta) / 🟡 (Media) / 🟢 (Baja)
- `title`: Título de la recomendación
- `reason`: Por qué es importante
- `steps`: Array de pasos para implementar
- `suggested_resources`: Recursos sugeridos (enlaces, videos, etc.)

### Plan de Acción
- `{{IMMEDIATE_ACTIONS}}`: Array de acciones inmediatas (3-5 items)
- `{{FOCUS_AREAS}}`: Áreas prioritarias de enfoque (texto)
- `{{FOLLOW_UP_MESSAGE}}`: Mensaje de seguimiento

### Mensajes
- `{{FINAL_MESSAGE}}`: Mensaje final motivacional personalizado

### Metadata
- `{{INSTRUCTOR_NAME}}`: Nombre del instructor (de User.name usando createdBy)
- `{{CORRECTION_DATE}}`: Fecha de corrección (Evaluation.createdAt)

---

## 📏 Reglas de Generación

### Cuándo Usar W104
```typescript
if (feedbackCount === 0) {
  // SIN_HISTORIAL → Usar W104
  useWorkflow = "W104";
} else if (feedbackCount < 3 && isDiagnostic) {
  // DIAGNÓSTICO → Usar W104 (más rápido)
  useWorkflow = "W104";
} else {
  // DATOS_COMPLETOS o INSUFICIENTES → Usar W103
  useWorkflow = "W103";
}
```

### Cálculo de Nota Final
```typescript
// W104: Promedio ponderado simple (sin ajustes comparativos)
const weights = {
  F1: 0.15,
  F2: 0.20,
  F3: 0.25,
  F4: 0.30,
  F5: 0.10
};

SCORE = Math.round(
  F1_SCORE * 0.15 +
  F2_SCORE * 0.20 +
  F3_SCORE * 0.25 +
  F4_SCORE * 0.30 +
  F5_SCORE * 0.10
);
```

### Mapping Nivel a Puntaje
```typescript
const levelToScore = {
  4: 92.5,  // Excelente
  3: 77,    // Bueno
  2: 62,    // En desarrollo
  1: 27     // Inicial
};
```

### Regla Crítica de Verificación
```
Si resultado del alumno es CORRECTO (error < 5%):
  → Nivel en F4 (Ejecución) debe ser ≥ Nivel 3
  → Ajustar evaluación si no cumple
```

### Priorización de Recomendaciones
```typescript
// Ordenar por prioridad:
// 🔴 Alta: Fases con Nivel 1 (crítico)
// 🟡 Media: Fases con Nivel 2 (mejorable)
// 🟢 Baja: Fases con Nivel 3 (refinamiento)
// (Nivel 4 no necesita recomendaciones)

const recommendationPriority = {
  1: { icon: "🔴", priority: "Alta" },
  2: { icon: "🟡", priority: "Media" },
  3: { icon: "🟢", priority: "Baja" }
};
```

### Mensaje Final
```typescript
if (SCORE >= 85) {
  FINAL_MESSAGE = "¡Excelente trabajo! Tu desempeño demuestra un sólido dominio de los conceptos. Continúa con este nivel de dedicación.";
} else if (SCORE >= 70) {
  FINAL_MESSAGE = "Buen trabajo. Has mostrado comprensión de los conceptos. Enfócate en las áreas de mejora identificadas para alcanzar la excelencia.";
} else if (SCORE >= 55) {
  FINAL_MESSAGE = "Has demostrado esfuerzo y comprensión básica. Con práctica enfocada en las áreas identificadas, podrás mejorar significativamente.";
} else {
  FINAL_MESSAGE = "Este examen muestra que necesitas apoyo adicional. No te desanimes - identifica las áreas clave y busca ayuda de tu instructor.";
}
```

### Áreas de Enfoque
```typescript
// Identificar las 2-3 fases con menor puntaje
const lowestPhases = sortByScore([F1, F2, F3, F4, F5]).slice(0, 3);

FOCUS_AREAS = lowestPhases.map(phase =>
  `${phase.name}: ${phase.description}`
).join(", ");
```

---

## 🎯 Diferencias Clave con W103

| Aspecto | W104 (Básico) | W103 (Comparativo) |
|---------|---------------|-------------------|
| **Historial requerido** | No | Sí (≥3 feedbacks) |
| **Tipo de nota** | Nota única (pura del examen) | Dual (Examen + Final ajustada) |
| **Sección "Justificación"** | ❌ No presente | ✅ Obligatoria |
| **Progreso histórico** | ❌ No disponible | ✅ Con gráficos y tendencias |
| **Análisis comparativo** | ❌ Absoluto | ✅ Esperado vs Real |
| **Predicciones** | ❌ No aplica | ✅ Validación de predicciones |
| **Tiempo de procesamiento** | 15-20 min | 25-30 min |
| **Costo aproximado** | ~$0.0018/examen | ~$0.0025/examen |
| **Secciones totales** | 6 | 7 |
| **Mensaje final** | Nota sobre futura personalización | Contextualizado con historial |

---

## 📝 Ejemplo de Uso

### Caso: Estudiante Nuevo (Sin Historial)

**Input:**
- `studentId`: "u_nuevo123"
- `feedbackCount`: 0
- `subject`: "Física"
- `examTopic`: "Tiro Oblicuo"
- `examDate`: "2025-10-15"

**Evaluación AI:**
- F1: Nivel 3 (77 pts)
- F2: Nivel 2 (62 pts)
- F3: Nivel 3 (77 pts)
- F4: Nivel 4 (92.5 pts)
- F5: Nivel 2 (62 pts)

**Cálculo:**
```
SCORE = 77×0.15 + 62×0.20 + 77×0.25 + 92.5×0.30 + 62×0.10
      = 11.55 + 12.4 + 19.25 + 27.75 + 6.2
      = 77.15 → 77/100
```

**Output en Evaluation.feedback:**
- Nota: 77/100
- Distribución por fases (tabla)
- Verificación matemática por ejercicio
- Análisis detallado
- 3-4 recomendaciones (enfocadas en F2 y F5 que son Nivel 2)
- Plan de acción inmediato
- Mensaje final: "Buen trabajo..."

**Output en Evaluation.score:** `77`

---

## 🎯 Notas de Implementación

1. **Validación Pre-generación**: Confirmar que `feedbackCount < 3` o `isDiagnostic = true`
2. **Verificación Matemática Obligatoria**: Ejecutar ANTES de evaluar F4
3. **Tolerancia de Redondeo**: ±5% para considerar resultado correcto
4. **Simplificación**: No calcular factores de ajuste ni Score_Base
5. **Recomendaciones Focalizadas**: Máximo 4 recomendaciones (fases con nivel ≤2)
6. **Markdown Válido**: Asegurar formato correcto de tablas
7. **Handlebars Syntax**: Usar `{{#each}}` para arrays

---

**Versión:** 1.0
**Fecha:** 21 de Octubre, 2025
**Basado en:** PRD Sistema de Corrección + Plan Integral + Schema DB Real
