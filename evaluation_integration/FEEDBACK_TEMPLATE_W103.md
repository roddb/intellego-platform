# Template de Feedback - Workflow 103 (Comparativo)

**Uso**: Para estudiantes con historial (≥3 feedbacks previos)
**Campo BD**: `Evaluation.feedback` (TEXT)
**Variables**: Se reemplazan en runtime

---

## 📋 Estructura del Feedback (7 Secciones)

```markdown
# RETROALIMENTACIÓN - {{STUDENT_NAME}}

## Examen: {{SUBJECT}} - {{EXAM_TOPIC}}
### Fecha: {{EXAM_DATE}}
### Nota Final: {{FINAL_SCORE}}/100

---

## 📊 Justificación de tu Nota

### Desempeño en el Examen
**Puntos obtenidos en el examen:** {{EXAM_SCORE}}/100

### Tu Punto de Partida Histórico
**Score Base** (promedio de tus competencias históricas): {{BASE_SCORE}}/100

### Ajustes por Desempeño Comparativo

| Fase | Esperado | Real | Diferencia | Factor | Peso | Impacto |
|------|----------|------|------------|--------|------|---------|
| F1: Comprensión | {{F1_EXPECTED}}% | {{F1_ACTUAL}}% | {{F1_DIFF}}% | {{F1_FACTOR}} | ×0.15 | {{F1_IMPACT}} |
| F2: Variables | {{F2_EXPECTED}}% | {{F2_ACTUAL}}% | {{F2_DIFF}}% | {{F2_FACTOR}} | ×0.20 | {{F2_IMPACT}} |
| F3: Herramientas | {{F3_EXPECTED}}% | {{F3_ACTUAL}}% | {{F3_DIFF}}% | {{F3_FACTOR}} | ×0.25 | {{F3_IMPACT}} |
| F4: Ejecución | {{F4_EXPECTED}}% | {{F4_ACTUAL}}% | {{F4_DIFF}}% | {{F4_FACTOR}} | ×0.30 | {{F4_IMPACT}} |
| F5: Verificación | {{F5_EXPECTED}}% | {{F5_ACTUAL}}% | {{F5_DIFF}}% | {{F5_FACTOR}} | ×0.10 | {{F5_IMPACT}} |

**Factor de Confiabilidad:** {{CONFIDENCE_FACTOR}} (basado en {{CONFIDENCE_PERCENTAGE}}% de aciertos históricos)

**Cálculo de Nota Final:**
```
Nota_Final = Score_Base × (1 + Σ(Factor_Ajuste × Peso_Fase × Factor_Confiabilidad))
Nota_Final = {{BASE_SCORE}} × (1 + {{TOTAL_ADJUSTMENT}} × {{CONFIDENCE_FACTOR}})
Nota_Final = {{FINAL_SCORE}}/100
```

**Interpretación:** {{INTERPRETATION_MESSAGE}}

---

## 📊 Tu Progreso Histórico

### Evolución de Competencias
{{HISTORICAL_COMPETENCIES_CHART}}

### Tendencias Identificadas
{{HISTORICAL_TRENDS}}

### Comparación con Reportes Semanales
{{WEEKLY_REPORTS_COMPARISON}}

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

#### Lo que esperábamos de ti (según tu historial):
{{expected_performance}}

#### Lo que demostraste:
{{actual_performance}}

#### Análisis Comparativo:
{{comparative_analysis}}

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

## 🎯 Validación de tu Progreso

### Predicciones vs Realidad

Basándonos en tu historial, generamos predicciones sobre tu desempeño esperado:

| Aspecto | Predicción | Realidad | Estado |
|---------|-----------|----------|--------|
{{#each PREDICTIONS}}
| {{aspect}} | {{predicted}} | {{actual}} | {{status_icon}} {{status}} |
{{/each}}

**Índice de Confiabilidad de Predicciones:** {{PREDICTION_ACCURACY}}%

**Análisis:** {{PREDICTION_ANALYSIS}}

---

## 💡 Recomendaciones Personalizadas

Basadas en las discrepancias entre tu desempeño esperado y real:

{{#each RECOMMENDATIONS}}
### {{priority_icon}} {{title}}

**Por qué es importante para ti:**
{{reason}}

**Cómo implementarlo:**
{{#each steps}}
- {{this}}
{{/each}}

**Impacto esperado:** {{expected_impact}}

---

{{/each}}

## 📈 Próximos Pasos

### Plan de Mejora Inmediato (próxima semana):
{{#each IMMEDIATE_ACTIONS}}
- [ ] {{this}}
{{/each}}

### Objetivos de Mediano Plazo (próximo mes):
{{#each MEDIUM_TERM_GOALS}}
- [ ] {{this}}
{{/each}}

### Seguimiento:
- **Próxima evaluación:** {{NEXT_EVALUATION_DATE}}
- **Competencias a monitorear:** {{COMPETENCIES_TO_MONITOR}}

---

## 📌 Mensaje Final

{{FINAL_MESSAGE}}

---

**Corrección realizada por:** {{INSTRUCTOR_NAME}}
**Sistema:** Intellego Platform - Corrección Automática v1.0
**Método:** Workflow 103 (Análisis Comparativo con Historial)
**Fecha de corrección:** {{CORRECTION_DATE}}
```

---

## 🔧 Variables a Reemplazar en Runtime

### Información del Estudiante
- `{{STUDENT_NAME}}`: Nombre completo del estudiante (de User.name)
- `{{SUBJECT}}`: Materia del examen (Evaluation.subject)
- `{{EXAM_TOPIC}}`: Tema específico del examen (Evaluation.examTopic)
- `{{EXAM_DATE}}`: Fecha del examen (Evaluation.examDate)

### Scores
- `{{FINAL_SCORE}}`: Nota final calculada (Evaluation.score)
- `{{EXAM_SCORE}}`: Puntaje puro del examen (0-100)
- `{{BASE_SCORE}}`: Score base histórico (0-100)

### Ajustes por Fase
Para cada fase (F1-F5):
- `{{FX_EXPECTED}}`: Desempeño esperado según historial (%)
- `{{FX_ACTUAL}}`: Desempeño real en el examen (%)
- `{{FX_DIFF}}`: Diferencia entre real y esperado (%)
- `{{FX_FACTOR}}`: Factor de ajuste (-0.20 a +0.20)
- `{{FX_IMPACT}}`: Impacto en la nota final (puntos)

### Confiabilidad
- `{{CONFIDENCE_FACTOR}}`: Factor de confiabilidad (0.3 / 0.7 / 1.0)
- `{{CONFIDENCE_PERCENTAGE}}`: Porcentaje de aciertos históricos
- `{{TOTAL_ADJUSTMENT}}`: Suma total de ajustes

### Interpretación
- `{{INTERPRETATION_MESSAGE}}`: Mensaje explicativo (ej: "Tu nota final es MAYOR que tu score base porque superaste expectativas en 3 de 5 fases. ¡Felicitaciones!")

### Datos Históricos
- `{{HISTORICAL_COMPETENCIES_CHART}}`: Gráfico o tabla de evolución
- `{{HISTORICAL_TRENDS}}`: Lista de tendencias identificadas
- `{{WEEKLY_REPORTS_COMPARISON}}`: Comparación con reportes semanales

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
- `expected_performance`: Qué esperábamos según historial
- `actual_performance`: Qué demostró el alumno
- `comparative_analysis`: Análisis comparativo
- `strengths`: Array de fortalezas
- `weaknesses`: Array de debilidades
- `FX_level`: Nivel 1-4 para cada fase
- `FX_comment`: Comentario para cada fase

### Predicciones (array PREDICTIONS)
Cada predicción contiene:
- `aspect`: Aspecto evaluado
- `predicted`: Valor predicho
- `actual`: Valor real
- `status_icon`: ✓ / ✗ / ≈
- `status`: CONFIRMADA / REFUTADA / PARCIAL

### Recomendaciones (array RECOMMENDATIONS)
Cada recomendación contiene:
- `priority_icon`: 🔴 / 🟡 / 🟢
- `title`: Título de la recomendación
- `reason`: Por qué es importante
- `steps`: Array de pasos para implementar
- `expected_impact`: Impacto esperado

### Plan de Acción
- `{{IMMEDIATE_ACTIONS}}`: Array de acciones inmediatas
- `{{MEDIUM_TERM_GOALS}}`: Array de objetivos a mediano plazo
- `{{NEXT_EVALUATION_DATE}}`: Fecha de próxima evaluación
- `{{COMPETENCIES_TO_MONITOR}}`: Competencias a seguir

### Metadata
- `{{INSTRUCTOR_NAME}}`: Nombre del instructor (de User.name usando createdBy)
- `{{CORRECTION_DATE}}`: Fecha de corrección (Evaluation.createdAt)
- `{{FINAL_MESSAGE}}`: Mensaje final personalizado

---

## 📏 Reglas de Generación

### Categorización de Datos Históricos
```typescript
if (feedbackCount === 0) {
  // SIN_HISTORIAL → No usar W103, usar W104
  throw new Error("W103 requiere historial. Usar W104.");
} else if (feedbackCount < 3) {
  // DATOS_INSUFICIENTES
  CONFIDENCE_FACTOR = 0.7;
  // Mensaje: "Tu historial es limitado, por lo que los ajustes son conservadores."
} else {
  // DATOS_COMPLETOS
  CONFIDENCE_FACTOR = calculateConfidenceFactor(historicalAccuracy);
  // Factor = 1.0 (≥80%), 0.7 (60-79%), 0.3 (<60%)
}
```

### Cálculo de Factor de Ajuste por Fase
```typescript
for each fase in [F1, F2, F3, F4, F5] {
  diferencia = (actual - esperado) / 100;

  if (diferencia > 0.20) {
    factor = 0.20; // Cap superior
  } else if (diferencia < -0.20) {
    factor = -0.20; // Cap inferior
  } else {
    factor = diferencia;
  }

  impacto = BASE_SCORE * factor * peso_fase * CONFIDENCE_FACTOR;
}
```

### Regla Crítica de Verificación
```
Si resultado del alumno es CORRECTO (error < 5%):
  → Nota en F4 (Ejecución) debe ser ≥ 75/100
  → Ajustar evaluación si no cumple
```

### Mensaje de Interpretación
```typescript
const totalImpact = sum(impactos);

if (FINAL_SCORE > BASE_SCORE) {
  const fasesPositivas = count(fases where factor > 0);
  INTERPRETATION_MESSAGE = `Tu nota final es MAYOR que tu score base porque superaste expectativas en ${fasesPositivas} de 5 fases. ¡Felicitaciones!`;
} else if (FINAL_SCORE < BASE_SCORE) {
  const fasesNegativas = count(fases where factor < 0);
  INTERPRETATION_MESSAGE = `Tu nota final es MENOR que tu score base debido a dificultades en ${fasesNegativas} de 5 fases. Revisa las recomendaciones para mejorar.`;
} else {
  INTERPRETATION_MESSAGE = `Tu nota final coincide con tu score base, mostrando un desempeño consistente con tu historial.`;
}
```

---

## 🎯 Notas de Implementación

1. **Validación Pre-generación**: Verificar que `feedbackCount ≥ 3` antes de usar W103
2. **Verificación Matemática Obligatoria**: Ejecutar ANTES de evaluar F4 (Ejecución)
3. **Tolerancia de Redondeo**: ±5% para considerar resultado correcto
4. **Caps en Factores**: Limitar factores de ajuste a rango [-0.20, +0.20]
5. **Markdown Válido**: Asegurar que todas las tablas tengan headers y alignment
6. **Handlebars Syntax**: Usar `{{#each}}` para arrays, `{{variable}}` para strings/numbers

---

**Versión:** 1.0
**Fecha:** 21 de Octubre, 2025
**Basado en:** PRD Sistema de Corrección + Plan Integral + Schema DB Real
