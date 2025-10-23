# 📚 Sistema de Corrección Automática de Exámenes

**Estado**: 🚧 En Implementación
**Tecnología**: Claude Haiku 4.5 + Turso libSQL
**Versión**: 2.0-simple

---

## 🎯 ¿Qué es esto?

Sistema **simple y directo** para corregir exámenes transcritos automáticamente usando IA (Claude Haiku):
- ✅ Rúbrica genérica 5-FASE adaptable a cualquier tema
- ✅ Feedback detallado y personalizado
- ✅ Evaluación absoluta (sin análisis comparativo)
- ✅ Integración completa con tabla `Evaluation` de Intellego Platform

---

## 📁 Documentación

### 🚀 Empezar Aquí

1. **[FLUJO_CORRECCION_SIMPLE.md](./FLUJO_CORRECCION_SIMPLE.md)** ← **LEER PRIMERO**
   - Flujo simplificado de corrección
   - 6 componentes básicos
   - Workflow end-to-end
   - Sin análisis comparativo (solo evaluación absoluta)
   - Estimación de costos (~$0.0035 por examen)
   - Tiempo estimado: 11-14 segundos por examen

### 📐 Rúbrica de Evaluación

2. **[RUBRICA_GENERICA.md](./RUBRICA_GENERICA.md)**
   - 5 FASES de evaluación (Comprensión, Variables, Herramientas, Ejecución, Verificación)
   - 4 Niveles de desempeño por fase (1-4)
   - Descriptores detallados con ejemplos
   - Pesos: F1=15%, F2=20%, F3=25%, F4=30%, F5=10%
   - Cálculo de score final ponderado (0-100)

### 📝 Templates y Ejemplos

3. **[FEEDBACK_TEMPLATE_W104.md](./FEEDBACK_TEMPLATE_W104.md)**
   - Template de feedback simplificado
   - Variables a reemplazar en runtime
   - Estructura de 6 secciones
   - Reglas de generación

4. **[EJEMPLOS/examen_input_ejemplo.md](./EJEMPLOS/examen_input_ejemplo.md)**
   - Ejemplo completo de examen transcrito (Física - Tiro Oblicuo)
   - Formato esperado de entrada
   - 3 ejercicios con desarrollo del alumno
   - Casos de estudio para testing

---

## 🏗️ Arquitectura del Sistema Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UPLOAD                                                   │
│    Instructor sube archivos .md con formato: Apellido.md   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PARSER                                                   │
│    - Extrae apellido del filename                           │
│    - Lee contenido del examen                               │
│    → Output: { apellido, rawContent, exercises }            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MATCHER                                                  │
│    - Busca estudiante en DB por apellido (fuzzy matching)   │
│    - Query tabla User (role=STUDENT, status=ACTIVE)        │
│    → Output: { student, matchConfidence }                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ANALYZER (Claude Haiku 4.5)                              │
│    - System Prompt: Rúbrica 5-FASE (CACHEABLE)             │
│    - User Prompt: Transcripción del examen                  │
│    - Evaluación absoluta por 5 fases                        │
│    - Análisis por ejercicio                                 │
│    → Output: { scores, exerciseAnalysis, recommendations }  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CALCULATOR                                               │
│    - Promedio ponderado: F1×15% + F2×20% + F3×25% +       │
│                          F4×30% + F5×10%                    │
│    → Output: { score }  (0-100)                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. GENERATOR                                                │
│    - Carga template de feedback                             │
│    - Reemplaza variables                                    │
│    - Construye feedback en Markdown (2000-3000 palabras)   │
│    → Output: { feedbackMarkdown }                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. UPLOADER                                                 │
│    - Genera evaluationId único                              │
│    - INSERT INTO Evaluation                                 │
│    - Logging                                                │
│    → Output: { evaluationId, success }                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Ejemplo de Flujo

### Input (Archivo subido):

```
Filename: Gonzalez.md

Contenido:
# Examen de Física - Tiro Oblicuo
**Alumno**: González, Juan

## Ejercicio 1: Calcular alcance...
[Desarrollo del alumno con cálculos]
```

### Processing:

1. **Parser** identifica apellido "Gonzalez" → extrae contenido
2. **Matcher** busca en DB → encuentra `userId = "u_abc123"` para "González, Juan"
3. **Analyzer** (Claude Haiku) evalúa usando rúbrica 5-FASE:
   - F1 Comprensión: Nivel 3 (77 pts)
   - F2 Variables: Nivel 2 (62 pts)
   - F3 Herramientas: Nivel 3 (77 pts)
   - F4 Ejecución: Nivel 4 (92.5 pts)
   - F5 Verificación: Nivel 2 (62 pts)
4. **Calculator** calcula nota ponderada:
   - 77×0.15 + 62×0.20 + 77×0.25 + 92.5×0.30 + 62×0.10 = **77/100**
5. **Generator** construye feedback en Markdown
6. **Uploader** guarda en tabla `Evaluation`

### Output (Guardado en DB):

```sql
INSERT INTO Evaluation VALUES (
  'eval_a1b2c3d4',        -- id
  'u_abc123',             -- studentId
  'Física',               -- subject
  '2025-10-15',           -- examDate
  'Tiro Oblicuo',         -- examTopic
  77,                     -- score
  '# RETROALIMENTACIÓN - GONZÁLEZ, JUAN\n\n...',  -- feedback (Markdown completo)
  'instructor_xyz',       -- createdBy
  '2025-10-21T10:30:00Z', -- createdAt
  '2025-10-21T10:30:00Z'  -- updatedAt
);
```

---

## 💰 Costos Estimados

**Por examen** (con Prompt Caching):
- Primera corrección (cache miss): ~$0.00495
- Siguientes (cache hit): ~$0.00345
- **Promedio: ~$0.0035 por examen**

**Batch de 30 exámenes**: ~$0.11

**Proyección mensual**:
- 120 exámenes/mes → **$0.42/mes**
- 480 exámenes/mes → **$1.68/mes**

**Muy por debajo del presupuesto de $10/mes** ✅

**Tiempo de procesamiento**: ~11-14 segundos por examen

---

## 🚀 Estado de Implementación

### ✅ Completado (Planificación):
- [x] Análisis de infraestructura existente
- [x] Diseño de rúbrica 5-FASE
- [x] Diseño de arquitectura simplificada (6 componentes)
- [x] Flujo de corrección detallado
- [x] Template de feedback (W104)
- [x] Ejemplos y casos de prueba

### 🚧 En Progreso:

#### Fase 1: Parser + Matcher (Semana 1) - **ACTUAL**
- [ ] Implementar parser de archivos `.md`
- [ ] Extracción de apellido del filename
- [ ] Lógica de fuzzy matching de apellidos
- [ ] Testing del parser y matcher

#### Fase 2: Analyzer + Calculator (Semana 1-2)
- [ ] Integración con Claude Haiku 4.5
- [ ] Implementar rúbrica 5-FASE en system prompt
- [ ] Prompt caching configuration
- [ ] Parseo de respuesta JSON
- [ ] Cálculo de nota ponderada

#### Fase 3: Generator + Uploader (Semana 2)
- [ ] Template engine para feedback Markdown
- [ ] Reemplazo de variables dinámicas
- [ ] INSERT en tabla Evaluation
- [ ] Generación de evaluationId único

#### Fase 4: API + UI (Semana 2-3)
- [ ] API endpoint POST /api/instructor/evaluation/correct
- [ ] Validación y autenticación
- [ ] UI de upload de archivos
- [ ] Vista de resultados

#### Fase 5: Testing & Refinamiento (Semana 3-4)
- [ ] Testing con exámenes reales
- [ ] Ajustes de rúbrica
- [ ] Optimización de performance
- [ ] Documentación completa

---

## 🔑 Decisiones Clave de Diseño

### 1. Sistema Simplificado (Sin Análisis Comparativo)
**Decisión**: Evaluación absoluta, sin comparación con historial
**Razón**:
- Simplifica implementación drásticamente
- Reduce tiempo de procesamiento (11-14s vs 27-33s)
- Reduce costo por examen (~$0.0035 vs ~$0.0026)
- Más fácil de mantener y debuggear
- Funciona desde el primer examen (no requiere historial)

### 2. Rúbrica 5-FASE Universal
**Decisión**: Rúbrica genérica de 5 fases (F1-F5)
**Razón**:
- Permite corregir exámenes de cualquier tema (Física, Química, Matemática, etc.)
- Evalúa proceso de pensamiento científico (universal)
- Estructura clara: Comprensión → Variables → Herramientas → Ejecución → Verificación
- No requiere conocimiento específico del dominio

### 3. Matching por Apellido
**Decisión**: Usar apellido en filename como identificador principal
**Razón**:
- Convención simple: instructor nombra archivo = apellido del estudiante
- Fuzzy matching tolera variaciones (tildes, espacios, guiones)
- Threshold de similitud: 90% (evita matches incorrectos)
- Si no hay match → log error y continuar con siguiente archivo

### 4. Prompt Caching
**Decisión**: Cachear rúbrica 5-FASE en system prompt
**Razón**:
- Rúbrica es constante (~5,000 tokens) → no cambia entre exámenes
- Ahorro de 70-90% en input tokens (cache hit)
- Cache duration: 5 minutos (suficiente para batch de 30 exámenes)
- Impacto: Reduce costo de ~$0.00495 → ~$0.00345 por examen

---

## 📞 Contacto y Siguiente Paso

**Owner**: Rodrigo Di Bernardo
**Assistant**: Claude Code (Sonnet 4.5)

### 🎯 Próximo Paso Inmediato:

**FASE 1 - EN PROGRESO**:
1. ✅ Arquitectura simplificada definida
2. ✅ Flujo de corrección documentado
3. 🚧 Implementar Parser + Matcher
4. ⏳ Testing con archivos de ejemplo

---

## 📚 Referencias y Documentación

### Planificación y Diseño:
- **[FLUJO_CORRECCION_SIMPLE.md](./FLUJO_CORRECCION_SIMPLE.md)** - Flujo detallado de corrección (6 componentes)
- **[RUBRICA_GENERICA.md](./RUBRICA_GENERICA.md)** - Rúbrica 5-FASE completa
- **[FEEDBACK_TEMPLATE_W104.md](./FEEDBACK_TEMPLATE_W104.md)** - Template de feedback

### Archivos Históricos (Referencia):
- **[PLAN_INTEGRAL.md](./PLAN_INTEGRAL.md)** - Plan original (con W103 comparativo)
- **[INTEGRACION_PRD_vs_NUEVO_PLAN.md](./INTEGRACION_PRD_vs_NUEVO_PLAN.md)** - Análisis comparativo
- **[FLUJO_CORRECCION.md](./FLUJO_CORRECCION.md)** - Flujo complejo (descartado)

### Código Base:
- **Sistema de Feedback Actual**: `src/services/ai/claude/analyzer.ts`
- **Tabla Evaluation**: Schema en DB Turso (`Evaluation` table)

---

**Creado**: 21 de Octubre, 2025
**Última actualización**: 21 de Octubre, 2025
**Versión**: 2.0-simple
