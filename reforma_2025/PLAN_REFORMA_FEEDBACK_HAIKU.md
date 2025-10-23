# PLAN DE REFORMA: SISTEMA DE FEEDBACK DE CLAUDE HAIKU

**Fecha**: 2025-10-22
**Autor**: Claude Code
**Estado**: En Planificación
**Prioridad**: Alta

---

## 📋 RESUMEN EJECUTIVO

El sistema de feedback con Claude Haiku está generando análisis de alta calidad, pero hay problemas en el parseo y presentación de la información. Este plan aborda 4 mejoras críticas para optimizar la experiencia del estudiante.

### Problemas Identificados:
1. ❌ Regex de parseo no captura FORTALEZAS/MEJORAS/COMENTARIOS correctamente
2. ❌ Campos quedan con valores por defecto ("No se identificaron...")
3. ❌ Análisis detallado se muestra sin formato y es difícil de leer
4. ❌ No existe rúbrica para casos especiales (ausencias, viajes, sin clases)

### Objetivos de la Reforma:
1. ✅ Parseo robusto que capture correctamente las 3 secciones principales
2. ✅ Formato legible para "Análisis Detallado"
3. ✅ Límite de 3 items en Fortalezas y Áreas de Mejora
4. ✅ Rúbrica genérica para casos especiales con detección automática

---

## 🎯 TAREAS PRINCIPALES

### FASE 1: MEJORAR PARSEO DE RESPUESTAS
**Archivo**: `src/services/ai/claude/analyzer.ts`
**Función**: `_parseAnalysisResponseWithRubricas()`

#### Cambios requeridos:

**1.1. Actualizar regex de parseo**
```typescript
// ANTES (estricto, requiere ":")
const strengthsMatch = text.match(/FORTALEZAS:([\s\S]*?)(?=MEJORAS:|COMENTARIOS_GENERALES:|$)/i);

// DESPUÉS (flexible, acepta variaciones)
const strengthsMatch = text.match(/FORTALEZAS:?[\s\n]*([\s\S]*?)(?=MEJORAS:?|COMENTARIOS_GENERALES:?|ANÁLISIS_AI:?|$)/i);
```

**1.2. Parsear lista de items y limitar a 3**
```typescript
// Extraer lista de fortalezas y limitarla a 3 items
const extractBulletPoints = (text: string, maxItems: number = 3): string => {
  // Dividir por líneas que empiezan con - o •
  const items = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line))
    .slice(0, maxItems); // Limitar a maxItems

  return items.join('\n');
};
```

**1.3. Aplicar limpieza de markdown mejorada**
```typescript
// Ya existe _cleanMarkdown(), pero mejorarla para:
// - Preservar bullets (-, •, 1., 2., etc.)
// - Eliminar headers markdown (###, ##)
// - Mantener estructura de párrafos
```

**Resultado esperado**:
- `strengths`: Máximo 3 fortalezas en formato bullet
- `improvements`: Máximo 3 mejoras en formato bullet
- `generalComments`: Párrafo de devolución general (sin limitar)

---

### FASE 2: MODIFICAR PROMPTS DE EVALUACIÓN
**Archivo**: `src/services/ai/claude/analyzer.ts`
**Funciones**: `_buildCacheableSystemPrompts()`, `_buildUserMessage()`

#### Cambios en el system prompt:

**2.1. Especificar límites claros**
```typescript
FORTALEZAS (MÁXIMO 3):
- [Fortaleza 1: Aspecto positivo específico con ejemplo. Máximo 2 líneas.]
- [Fortaleza 2: Segundo aspecto positivo con ejemplo. Máximo 2 líneas.]
- [Fortaleza 3: Tercer aspecto positivo con ejemplo. Máximo 2 líneas.]

MEJORAS (MÁXIMO 3):
- [Mejora 1: Problema identificado + sugerencia práctica. Máximo 3 líneas.]
- [Mejora 2: Segundo problema + sugerencia práctica. Máximo 3 líneas.]
- [Mejora 3: Tercer problema + sugerencia práctica. Máximo 3 líneas.]

COMENTARIOS_GENERALES:
[Párrafo de devolución del reporte semanal. 4-6 líneas. Incluye:
- Reconocimiento del esfuerzo y progreso
- Observación sobre el desempeño general
- Orientación para la siguiente semana]
```

**2.2. Redefinir propósito de COMENTARIOS_GENERALES**
```typescript
// ANTES: Genérico "próximos pasos"
// DESPUÉS: Devolución específica del reporte semanal
```

**2.3. Mover recomendaciones a ANÁLISIS_AI**
```typescript
ANÁLISIS_AI:
[Recomendaciones técnicas para la siguiente fase. 4-6 líneas.
- Conexión con Fase siguiente
- Sugerencias metodológicas
- Acciones concretas]
```

---

### FASE 3: CREAR RÚBRICA GENÉRICA PARA CASOS ESPECIALES
**Archivo**: `src/services/ai/claude/prompts/rubricas.ts`

#### 3.1. Nueva rúbrica: `RUBRICA_CASO_ESPECIAL`

```typescript
export const RUBRICA_CASO_ESPECIAL = `
# RÚBRICA PARA CASOS ESPECIALES

## Aplicación
Esta rúbrica se usa cuando:
- El estudiante estuvo ausente por enfermedad/viaje
- No hubo clases en la semana
- El reporte está incompleto por razones justificadas
- Hay circunstancias excepcionales documentadas

## Objetivo
NO penalizar al estudiante por circunstancias fuera de su control.
Proporcionar feedback constructivo sobre lo que SÍ completó (si aplica).

---

## Evaluación para Casos Especiales

### CRITERIOS:

**Si el estudiante estuvo ausente:**
- NO asignar puntaje numérico
- Marcar el reporte como "No aplica - Ausencia justificada"
- Sugerir recuperación del material perdido
- Ofrecer recursos de apoyo

**Si no hubo clases:**
- NO asignar puntaje numérico
- Marcar como "Semana sin contenido nuevo"
- Sugerir repaso de temas anteriores (si corresponde)

**Si el reporte está parcialmente completo:**
- Evaluar solo las secciones completadas
- Asignar puntaje proporcional
- Sugerir completar las secciones faltantes
- Reconocer el esfuerzo en lo presentado

---

## FORMATO DE RESPUESTA

Q1_NIVEL: N/A
Q1_JUSTIFICACIÓN: [Explicar la circunstancia especial]

Q2_NIVEL: N/A
Q2_JUSTIFICACIÓN: [Si aplica, evaluar lo que sí completó]

Q3_NIVEL: N/A
Q3_JUSTIFICACIÓN: [Contexto de la situación]

Q4_NIVEL: N/A
Q4_JUSTIFICACIÓN: [Orientación para la próxima semana]

Q5_NIVEL: N/A
Q5_JUSTIFICACIÓN: [Comentario de apoyo]

FORTALEZAS:
- [Si completó algo, reconocerlo aquí. Máximo 2 items.]

MEJORAS:
- [Sugerencias constructivas para la próxima semana. Máximo 2 items.]

COMENTARIOS_GENERALES:
[Mensaje de apoyo reconociendo la situación. Orientación para retomar el ritmo.
No incluir puntaje. Tono empático y constructivo.]

ANÁLISIS_AI:
[Recomendaciones para ponerse al día. Recursos sugeridos. Próximos pasos.]
`;
```

#### 3.2. Lógica de detección automática

**Archivo**: `src/services/ai/claude/analyzer.ts`

```typescript
/**
 * Detectar si es un caso especial (ausencia, sin clases, etc.)
 */
private _detectarCasoEspecial(answers: Answer[]): boolean {
  // Caso 1: Respuestas muy cortas o vacías
  const respuestasVacias = answers.filter(a =>
    !a.answer || a.answer.trim().length < 10
  ).length;

  if (respuestasVacias >= 4) {
    return true; // 4 de 5 respuestas vacías = posible ausencia
  }

  // Caso 2: Palabras clave de ausencia
  const keywordsAusencia = [
    'ausente', 'viaje', 'enfermo', 'no asistí',
    'sin clases', 'feriado', 'no tuve clase'
  ];

  const contieneKeyword = answers.some(a =>
    keywordsAusencia.some(k =>
      a.answer.toLowerCase().includes(k.toLowerCase())
    )
  );

  return contieneKeyword;
}

/**
 * Seleccionar rúbrica apropiada
 */
private _seleccionarRubrica(
  fase: 1 | 2 | 3 | 4,
  answers: Answer[]
): string {
  const esCasoEspecial = this._detectarCasoEspecial(answers);

  if (esCasoEspecial) {
    console.log('🔍 Caso especial detectado - usando rúbrica genérica');
    return RUBRICA_CASO_ESPECIAL;
  }

  return getRubricaByFase(fase);
}
```

---

### FASE 4: FORMATEAR "ANÁLISIS DETALLADO"
**Objetivo**: Convertir el bloque de texto en párrafos legibles

#### Opción A: Script Python (Recomendada)
**Archivo nuevo**: `scripts/format_feedback_analysis.py`

```python
#!/usr/bin/env python3
"""
Formatear campo aiAnalysis para mejor legibilidad
Convierte bloques de texto sin formato en párrafos bien estructurados
"""

import re
from typing import List

def format_analysis(raw_text: str) -> str:
    """
    Formatea el análisis AI para hacerlo más legible
    """
    # 1. Separar por secciones principales
    sections = re.split(r'(Q\d+_NIVEL:|FORTALEZAS:|MEJORAS:|COMENTARIOS_GENERALES:|ANÁLISIS_AI:)', raw_text)

    formatted_parts = []

    for i in range(0, len(sections), 2):
        if i + 1 >= len(sections):
            break

        section_title = sections[i + 1].strip()
        section_content = sections[i + 2].strip() if i + 2 < len(sections) else ''

        # 2. Formatear el contenido
        formatted_content = format_section_content(section_content)

        # 3. Reconstruir con formato
        formatted_parts.append(f"\n**{section_title}**\n{formatted_content}\n")

    return '\n'.join(formatted_parts)

def format_section_content(content: str) -> str:
    """
    Formatea el contenido de una sección
    """
    # Separar en párrafos (doble salto de línea)
    paragraphs = re.split(r'\n\n+', content)

    formatted_paragraphs = []
    for para in paragraphs:
        # Limpiar espacios
        para = para.strip()

        # Detectar si es lista (-, •, 1., etc.)
        if re.match(r'^[-•\d]', para):
            formatted_paragraphs.append(para)
        else:
            # Es un párrafo normal - envolver en 80 caracteres
            formatted_paragraphs.append(wrap_text(para, 80))

    return '\n\n'.join(formatted_paragraphs)

def wrap_text(text: str, width: int = 80) -> str:
    """
    Envuelve texto en líneas de ancho máximo
    """
    words = text.split()
    lines = []
    current_line = []
    current_length = 0

    for word in words:
        if current_length + len(word) + 1 <= width:
            current_line.append(word)
            current_length += len(word) + 1
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
            current_length = len(word)

    if current_line:
        lines.append(' '.join(current_line))

    return '\n'.join(lines)
```

#### Opción B: Función TypeScript en Frontend
**Archivo**: `src/components/student/FeedbackModal.tsx`

```typescript
/**
 * Formatear análisis AI para mejor legibilidad
 */
function formatAnalysisForDisplay(rawAnalysis: string): string {
  // 1. Separar por secciones
  const sections = rawAnalysis.split(/(?=Q\d+_NIVEL:|FORTALEZAS:|MEJORAS:|COMENTARIOS_GENERALES:|ANÁLISIS_AI:)/);

  // 2. Formatear cada sección
  const formatted = sections.map(section => {
    // Detectar título de sección
    const titleMatch = section.match(/^(Q\d+_NIVEL:|FORTALEZAS:|MEJORAS:|COMENTARIOS_GENERALES:|ANÁLISIS_AI:)/);

    if (titleMatch) {
      const title = titleMatch[1];
      const content = section.replace(title, '').trim();

      // Dividir en párrafos
      const paragraphs = content.split(/\n\n+/).map(p => p.trim());

      return `<div class="section">
        <h4>${title.replace(':', '')}</h4>
        ${paragraphs.map(p => `<p>${p}</p>`).join('\n')}
      </div>`;
    }

    return section;
  });

  return formatted.join('\n');
}
```

**Recomendación**: Usar **Opción B (TypeScript)** porque:
- ✅ No requiere ejecutar scripts externos
- ✅ Procesamiento en tiempo real al mostrar el modal
- ✅ Más fácil de mantener y modificar
- ✅ No requiere acceso a la base de datos

---

## 📁 ARCHIVOS A MODIFICAR

### Archivos principales:
1. `src/services/ai/claude/analyzer.ts` (parseo y detección)
2. `src/services/ai/claude/prompts/rubricas.ts` (nueva rúbrica)
3. `src/components/student/FeedbackModal.tsx` (formateo visual)

### Archivos de documentación:
4. `reforma_2025/PLAN_REFORMA_FEEDBACK_HAIKU.md` (este archivo)
5. `reforma_2025/CHECKLIST_REFORMA_FEEDBACK.md` (checklist de validación)

---

## 🧪 PLAN DE TESTING

### Test 1: Parseo robusto
- ✅ Feedback con formato correcto (con `:`)
- ✅ Feedback sin `:` después de FORTALEZAS/MEJORAS
- ✅ Feedback con saltos de línea extras
- ✅ Límite de 3 items en fortalezas/mejoras

### Test 2: Rúbrica genérica
- ✅ Estudiante ausente (keyword "ausente" en respuestas)
- ✅ Sin clases (keyword "sin clases")
- ✅ Respuestas muy cortas (< 10 caracteres en 4 de 5 preguntas)
- ✅ Feedback apropiado sin puntaje numérico

### Test 3: Formateo de análisis detallado
- ✅ Texto sin formato se convierte en párrafos legibles
- ✅ Secciones se separan correctamente
- ✅ Bullets se preservan
- ✅ Headers se formatean como títulos

### Test 4: Regresión
- ✅ Feedbacks normales (Fase 1-4) siguen funcionando
- ✅ Cálculo de score no se rompe
- ✅ Skills metrics se calculan correctamente
- ✅ Prompt caching sigue funcionando

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Antes | Después |
|---------|-------|---------|
| Campos con valores por defecto | ~80% | < 5% |
| Fortalezas identificadas correctamente | ~20% | > 95% |
| Mejoras identificadas correctamente | ~20% | > 95% |
| Casos especiales manejados | 0% | 100% |
| Legibilidad del análisis detallado | 3/10 | 8/10 |

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Romper feedbacks existentes
**Mitigación**: Testing exhaustivo con datos reales de DB antes de deploy

### Riesgo 2: Prompt caching se invalida
**Mitigación**: Cambios en prompts deben mantener estructura cacheable

### Riesgo 3: Costos de API aumentan
**Mitigación**: Monitorear costos antes/después. Rollback si aumenta > 10%

### Riesgo 4: Detección de casos especiales con falsos positivos
**Mitigación**: Ajustar keywords basándose en datos reales. Logging extensivo.

---

## 🚀 IMPLEMENTACIÓN

### Orden de ejecución:
1. **Fase 1** (Parseo) - Impacto inmediato en UX
2. **Fase 2** (Prompts) - Mejora calidad de respuestas
3. **Fase 4** (Formateo) - Mejora visual
4. **Fase 3** (Rúbrica genérica) - Funcionalidad nueva
5. Testing completo
6. Deploy a producción

### Tiempo estimado:
- Fase 1: 2 horas
- Fase 2: 1.5 horas
- Fase 3: 2 horas
- Fase 4: 1 hora
- Testing: 2 horas
- **Total**: ~8-9 horas

---

## 📝 NOTAS FINALES

- Todos los cambios deben ser backwards-compatible
- Crear backup de DB antes de deploy
- Monitorear logs de Claude API por 48h post-deploy
- Recolectar feedback de estudiantes en primera semana

---

**Última actualización**: 2025-10-22 19:05
**Próxima revisión**: Al completar Fase 1
