# Flujo de Corrección Simplificado - Sistema de Evaluación

**Fecha**: 21 de Octubre, 2025
**Versión**: 2.0 - SIMPLIFICADO

---

## 🎯 Filosofía del Sistema

**SIMPLE Y DIRECTO**:
1. Instructor sube archivo `.md` con examen transcrito
2. Claude Haiku evalúa según rúbrica genérica 5-FASE
3. Se guarda nota + feedback en tabla `Evaluation`

**NO HAY**:
- ❌ Análisis comparativo con historial
- ❌ Score_Base histórico
- ❌ Ajustes por desempeño esperado
- ❌ Dual grading (examScore vs finalScore)
- ❌ Factores de confiabilidad
- ❌ Categorización de datos (SIN_HISTORIAL, etc.)

**SOLO**:
- ✅ Evaluación absoluta según rúbrica
- ✅ Nota única 0-100 (promedio ponderado)
- ✅ Feedback detallado en Markdown
- ✅ Verificación matemática opcional

---

## 🔄 Flujo Principal: End-to-End

```
┌─────────────────────────────────────────────────────────────────┐
│                         INICIO                                  │
│              Instructor sube archivo(s) .md                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   API ENDPOINT: POST          │
         │   /api/instructor/            │
         │   evaluation/correct          │
         │                               │
         │   Body: {                     │
         │     files: File[],            │
         │     metadata: {               │
         │       subject: string,        │
         │       examTopic: string,      │
         │       examDate: string,       │
         │       instructorId: string    │
         │     }                         │
         │   }                           │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   VALIDACIÓN INICIAL          │
         │   - Auth check (instructor?)  │
         │   - Validar archivos .md      │
         │   - Validar metadata          │
         │   - Rate limiting check       │
         └───────────────┬───────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         [✅ VÁLIDO]      [❌ ERROR]
                │                 │
                │                 └──> Return 400 Bad Request
                │
                ▼
         ┌───────────────────────────────┐
         │   CREAR BATCH ID              │
         │   batchId = "batch_" + UUID   │
         │   Status: PROCESSING          │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   ITERAR POR CADA ARCHIVO     │
         │   for (file of files) { ... } │
         └───────────────┬───────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    COMPONENTE 1: PARSER                        │
│                                                                │
│  Input: file (Buffer), metadata                               │
│                                                                │
│  Proceso:                                                      │
│    1. Extraer apellido del filename                           │
│       - filename: "Gonzalez.md" → apellido: "Gonzalez"       │
│       - filename: "Di_Bernardo.md" → apellido: "Di Bernardo"│
│       - Normalizar: remover tildes, espacios, etc.           │
│                                                                │
│    2. Leer contenido del archivo                              │
│       - Parsear markdown                                       │
│       - Identificar ejercicios (## Ejercicio 1, 2, ...)      │
│       - Extraer desarrollo del alumno                         │
│                                                                │
│  Output: {                                                     │
│    apellido: string,                                          │
│    rawContent: string,                                        │
│    exercises: Exercise[]                                      │
│  }                                                             │
│                                                                │
│  Ejemplo Output:                                              │
│  {                                                             │
│    apellido: "Gonzalez",                                      │
│    rawContent: "# Examen Física...",                          │
│    exercises: [                                               │
│      {                                                         │
│        number: 1,                                             │
│        title: "Calcular alcance máximo",                     │
│        content: "Vox = 20 * cos(30°)..."                     │
│      },                                                        │
│      ...                                                       │
│    ]                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                  COMPONENTE 2: MATCHER                         │
│                                                                │
│  Input: apellido (string)                                      │
│                                                                │
│  Proceso:                                                      │
│    1. Query DB: User table                                     │
│       SELECT id, name, academicYear, division                  │
│       FROM User                                                │
│       WHERE role = 'STUDENT'                                   │
│         AND status = 'ACTIVE'                                  │
│         AND name LIKE '%[apellido]%'                          │
│                                                                │
│    2. Fuzzy matching si múltiples matches                      │
│       - Levenshtein distance                                   │
│       - Score de similitud                                     │
│       - Threshold: 90%                                         │
│                                                                │
│    3. Si no hay match → ERROR (skip file, log error)          │
│                                                                │
│  Output: {                                                     │
│    student: {                                                  │
│      id: string,                                              │
│      name: string,                                            │
│      academicYear: string,                                    │
│      division: string                                         │
│    },                                                          │
│    matchConfidence: number                                     │
│  }                                                             │
│                                                                │
│  Ejemplo Output:                                              │
│  {                                                             │
│    student: {                                                  │
│      id: "u_abc123",                                          │
│      name: "González, Juan",                                  │
│      academicYear: "5to Año",                                 │
│      division: "A"                                            │
│    },                                                          │
│    matchConfidence: 95.5                                       │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         [✅ MATCH]       [❌ NO MATCH]
                │                 │
                │                 └──> Log error, continue next file
                │
                ▼
┌────────────────────────────────────────────────────────────────┐
│            COMPONENTE 3: BASIC ANALYZER                        │
│            (Claude Haiku - Rúbrica 5-FASE)                     │
│                                                                │
│  Input:                                                        │
│    - parsedExam (apellido, rawContent, exercises)             │
│    - student (id, name)                                       │
│    - metadata (subject, examTopic, examDate)                  │
│                                                                │
│  Proceso:                                                      │
│    1. Construir System Prompt (CACHEABLE):                    │
│       ┌────────────────────────────────────────────┐          │
│       │ Eres un asistente experto en corrección   │          │
│       │ de exámenes de [SUBJECT].                 │          │
│       │                                            │          │
│       │ Evalúa usando rúbrica 5-FASE:             │          │
│       │                                            │          │
│       │ FASE 1: COMPRENSIÓN (15%)                 │          │
│       │   - Nivel 4: Excelente (92.5 pts)         │          │
│       │   - Nivel 3: Bueno (77 pts)               │          │
│       │   - Nivel 2: En desarrollo (62 pts)       │          │
│       │   - Nivel 1: Inicial (27 pts)             │          │
│       │                                            │          │
│       │ FASE 2: VARIABLES (20%)                   │          │
│       │   [descriptores por nivel]                │          │
│       │                                            │          │
│       │ FASE 3: HERRAMIENTAS (25%)                │          │
│       │   [descriptores por nivel]                │          │
│       │                                            │          │
│       │ FASE 4: EJECUCIÓN (30%)                   │          │
│       │   [descriptores por nivel]                │          │
│       │                                            │          │
│       │ FASE 5: VERIFICACIÓN (10%)                │          │
│       │   [descriptores por nivel]                │          │
│       │                                            │          │
│       │ [RÚBRICA COMPLETA ~5000 tokens]           │          │
│       └────────────────────────────────────────────┘          │
│                                                                │
│    2. Construir User Prompt:                                   │
│       ┌────────────────────────────────────────────┐          │
│       │ Estudiante: González, Juan                │          │
│       │ Examen: Física - Tiro Oblicuo             │          │
│       │ Fecha: 2025-10-15                         │          │
│       │                                            │          │
│       │ TRANSCRIPCIÓN:                            │          │
│       │ [rawContent completo del examen]          │          │
│       │                                            │          │
│       │ Evalúa ejercicio por ejercicio.           │          │
│       │ Devuelve JSON con:                        │          │
│       │ - scores por fase (nivel 1-4 + puntaje)  │          │
│       │ - análisis por ejercicio                  │          │
│       │ - recomendaciones                         │          │
│       └────────────────────────────────────────────┘          │
│                                                                │
│    3. Llamada a Claude Haiku API:                             │
│       POST https://api.anthropic.com/v1/messages              │
│       {                                                        │
│         model: "claude-haiku-4.5",                            │
│         max_tokens: 4000,                                      │
│         system: [                                             │
│           {                                                    │
│             type: "text",                                     │
│             text: systemPrompt,                               │
│             cache_control: { type: "ephemeral" }  ← CACHE    │
│           }                                                    │
│         ],                                                     │
│         messages: [                                           │
│           {                                                    │
│             role: "user",                                     │
│             content: userPrompt                               │
│           }                                                    │
│         ]                                                      │
│       }                                                        │
│                                                                │
│    4. Parsear respuesta JSON:                                  │
│       {                                                        │
│         scores: {                                             │
│           F1: { nivel: 3, puntaje: 77 },                     │
│           F2: { nivel: 2, puntaje: 62 },                     │
│           F3: { nivel: 3, puntaje: 77 },                     │
│           F4: { nivel: 4, puntaje: 92.5 },                   │
│           F5: { nivel: 2, puntaje: 62 }                      │
│         },                                                     │
│         exerciseAnalysis: [                                   │
│           {                                                    │
│             exerciseNumber: 1,                                │
│             strengths: ["Identificó correctamente..."],       │
│             weaknesses: ["No verificó el resultado"],         │
│             specificFeedback: "Tu desarrollo..."              │
│           },                                                   │
│           ...                                                  │
│         ],                                                     │
│         recommendations: [                                     │
│           {                                                    │
│             priority: "alta",                                 │
│             title: "Mejorar identificación de variables",     │
│             steps: ["Leer enunciado 2 veces", "..."]         │
│           },                                                   │
│           ...                                                  │
│         ]                                                      │
│       }                                                        │
│                                                                │
│  Output: {                                                     │
│    aiAnalysis: {                                              │
│      scores: PhaseScores,                                     │
│      exerciseAnalysis: ExerciseAnalysis[],                    │
│      recommendations: Recommendation[]                         │
│    }                                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│          COMPONENTE 4: GRADE CALCULATOR                        │
│                                                                │
│  Input: aiAnalysis.scores                                      │
│                                                                │
│  Proceso:                                                      │
│    1. Calcular nota como promedio ponderado:                  │
│       const weights = {                                        │
│         F1: 0.15,  // Comprensión                            │
│         F2: 0.20,  // Variables                              │
│         F3: 0.25,  // Herramientas                           │
│         F4: 0.30,  // Ejecución                              │
│         F5: 0.10   // Verificación                           │
│       };                                                       │
│                                                                │
│       score = Math.round(                                      │
│         scores.F1.puntaje * 0.15 +                            │
│         scores.F2.puntaje * 0.20 +                            │
│         scores.F3.puntaje * 0.25 +                            │
│         scores.F4.puntaje * 0.30 +                            │
│         scores.F5.puntaje * 0.10                              │
│       );                                                       │
│                                                                │
│    2. Limitar a rango [0, 100]                                │
│       score = Math.max(0, Math.min(100, score));             │
│                                                                │
│  Output: {                                                     │
│    score: number  // 0-100                                    │
│  }                                                             │
│                                                                │
│  Ejemplo:                                                      │
│  scores = { F1: 77, F2: 62, F3: 77, F4: 92.5, F5: 62 }       │
│  score = 77×0.15 + 62×0.20 + 77×0.25 + 92.5×0.30 + 62×0.10  │
│        = 11.55 + 12.4 + 19.25 + 27.75 + 6.2                   │
│        = 77.15 → 77/100                                        │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│       COMPONENTE 5: FEEDBACK GENERATOR                         │
│                                                                │
│  Input:                                                        │
│    - student (id, name, academicYear, division)               │
│    - metadata (subject, examTopic, examDate)                  │
│    - aiAnalysis (scores, exerciseAnalysis, recommendations)   │
│    - score (número 0-100)                                     │
│                                                                │
│  Proceso:                                                      │
│    1. Cargar template base:                                    │
│       ```markdown                                              │
│       # RETROALIMENTACIÓN - {{STUDENT_NAME}}                  │
│                                                                │
│       ## Examen: {{SUBJECT}} - {{EXAM_TOPIC}}                │
│       ### Fecha: {{EXAM_DATE}}                                │
│       ### Nota: {{SCORE}}/100                                 │
│                                                                │
│       ---                                                      │
│                                                                │
│       ## 📊 Resumen de tu Desempeño                           │
│                                                                │
│       Has obtenido **{{SCORE}}/100** en este examen.         │
│                                                                │
│       ### Distribución por Fases                              │
│                                                                │
│       | Fase | Descripción | Nivel | Puntaje | Peso |        │
│       |------|-------------|-------|---------|------|        │
│       | F1 | Comprensión | {{F1_LEVEL}} | {{F1_SCORE}} | 15% |│
│       | F2 | Variables | {{F2_LEVEL}} | {{F2_SCORE}} | 20% | │
│       | F3 | Herramientas | {{F3_LEVEL}} | {{F3_SCORE}} | 25%|│
│       | F4 | Ejecución | {{F4_LEVEL}} | {{F4_SCORE}} | 30% | │
│       | F5 | Verificación | {{F5_LEVEL}} | {{F5_SCORE}} | 10%|│
│                                                                │
│       ---                                                      │
│                                                                │
│       ## 🎯 Análisis Ejercicio por Ejercicio                  │
│                                                                │
│       {{#each EXERCISES}}                                      │
│       ### Ejercicio {{number}}: {{title}}                     │
│                                                                │
│       **Fortalezas:**                                         │
│       {{#each strengths}}                                      │
│       - {{this}}                                              │
│       {{/each}}                                                │
│                                                                │
│       **Áreas de Mejora:**                                    │
│       {{#each weaknesses}}                                     │
│       - {{this}}                                              │
│       {{/each}}                                                │
│                                                                │
│       **Retroalimentación:**                                  │
│       {{specificFeedback}}                                    │
│                                                                │
│       ---                                                      │
│       {{/each}}                                                │
│                                                                │
│       ## 💡 Recomendaciones para Mejorar                      │
│                                                                │
│       {{#each RECOMMENDATIONS}}                                │
│       ### {{priority_icon}} {{title}}                         │
│                                                                │
│       **Cómo implementarlo:**                                 │
│       {{#each steps}}                                          │
│       - {{this}}                                              │
│       {{/each}}                                                │
│       {{/each}}                                                │
│                                                                │
│       ---                                                      │
│                                                                │
│       ## 📌 Mensaje Final                                     │
│                                                                │
│       {{FINAL_MESSAGE}}                                       │
│                                                                │
│       ---                                                      │
│                                                                │
│       **Corrección realizada por:** {{INSTRUCTOR_NAME}}       │
│       **Sistema:** Intellego Platform v1.0                    │
│       **Fecha:** {{CORRECTION_DATE}}                          │
│       ```                                                      │
│                                                                │
│    2. Reemplazar todas las variables:                         │
│       - {{STUDENT_NAME}} = student.name                       │
│       - {{SUBJECT}} = metadata.subject                        │
│       - {{EXAM_TOPIC}} = metadata.examTopic                   │
│       - {{EXAM_DATE}} = metadata.examDate                     │
│       - {{SCORE}} = score                                     │
│       - {{FX_LEVEL}} = scores.FX.nivel                        │
│       - {{FX_SCORE}} = scores.FX.puntaje                      │
│       - {{EXERCISES}} = exerciseAnalysis (array)              │
│       - {{RECOMMENDATIONS}} = recommendations (array)          │
│       - {{FINAL_MESSAGE}} = mensaje según score:              │
│         - ≥85: "¡Excelente trabajo!"                          │
│         - ≥70: "Buen trabajo..."                              │
│         - ≥55: "Has demostrado esfuerzo..."                   │
│         - <55: "Este examen muestra que necesitas apoyo..."   │
│       - {{INSTRUCTOR_NAME}} = instructor.name (from DB)       │
│       - {{CORRECTION_DATE}} = now()                           │
│                                                                │
│    3. Generar Markdown final (2000-3000 palabras)             │
│                                                                │
│  Output: {                                                     │
│    feedbackMarkdown: string                                   │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                COMPONENTE 6: DATABASE UPLOADER                 │
│                                                                │
│  Input:                                                        │
│    - student.id                                               │
│    - metadata (subject, examTopic, examDate)                  │
│    - score (0-100)                                            │
│    - feedbackMarkdown                                         │
│    - instructorId                                             │
│                                                                │
│  Proceso:                                                      │
│    1. Generar evaluationId único:                             │
│       const hash = SHA256(                                     │
│         studentId +                                           │
│         examDate +                                            │
│         examTopic +                                           │
│         timestamp                                             │
│       );                                                       │
│       evaluationId = "eval_" + hash.substring(0, 16);        │
│                                                                │
│    2. Construir record:                                        │
│       const record = {                                         │
│         id: evaluationId,                                     │
│         studentId: student.id,                                │
│         subject: metadata.subject,                            │
│         examDate: metadata.examDate,                          │
│         examTopic: metadata.examTopic,                        │
│         score: score,                                         │
│         feedback: feedbackMarkdown,                           │
│         createdBy: instructorId,                              │
│         createdAt: new Date().toISOString(),                  │
│         updatedAt: new Date().toISOString()                   │
│       };                                                       │
│                                                                │
│    3. INSERT en DB:                                            │
│       INSERT INTO Evaluation (                                 │
│         id, studentId, subject, examDate,                     │
│         examTopic, score, feedback,                           │
│         createdBy, createdAt, updatedAt                       │
│       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);               │
│                                                                │
│    4. Logging:                                                 │
│       console.log({                                           │
│         action: "EVALUATION_CREATED",                         │
│         evaluationId,                                         │
│         studentId: student.id,                                │
│         score,                                                │
│         timestamp: new Date()                                 │
│       });                                                      │
│                                                                │
│  Output: {                                                     │
│    evaluationId: string,                                      │
│    success: boolean                                           │
│  }                                                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   RETURN RESULT                │
         │                               │
         │   Response: {                 │
         │     batchId: string,          │
         │     results: [                │
         │       {                       │
         │         fileName: string,     │
         │         studentName: string,  │
         │         evaluationId: string, │
         │         score: number,        │
         │         status: "success",    │
         │         duration: number      │
         │       },                      │
         │       ...                     │
         │     ],                        │
         │     summary: {                │
         │       total: number,          │
         │       successful: number,     │
         │       failed: number,         │
         │       avgScore: number        │
         │     }                         │
         │   }                           │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   FIN DEL PROCESO              │
         │   Status 200 OK                │
         └───────────────────────────────┘
```

---

## ⏱️ Tiempo Estimado por Componente

```
Componente 1 (Parser):           ~2 segundos
Componente 2 (Matcher):          ~1 segundo
Componente 3 (Analyzer):         ~6-8 segundos
Componente 4 (Calculator):       ~0.5 segundos
Componente 5 (Generator):        ~1-2 segundos
Componente 6 (Uploader):         ~1 segundo

TOTAL: ~11-14 segundos por examen
```

---

## 💰 Costo Estimado

### Por examen (con Prompt Caching):

```
System Prompt (rúbrica 5-FASE): ~5,000 tokens (CACHEABLE)
User Prompt (transcripción):     ~1,500 tokens
Output (análisis + feedback):    ~2,000 tokens

Primera corrección (cache miss):
  Input:  6,500 tokens × $0.30/MTok = $0.00195
  Output: 2,000 tokens × $1.50/MTok = $0.00300
  TOTAL: $0.00495

Siguientes (cache hit):
  Input:  1,500 tokens × $0.30/MTok = $0.00045
  Output: 2,000 tokens × $1.50/MTok = $0.00300
  TOTAL: $0.00345

Promedio: ~$0.0035 por examen
```

### Batch de 30 exámenes:
```
Primer examen:  $0.00495
29 siguientes:  29 × $0.00345 = $0.10005
TOTAL:          $0.10500

Costo unitario promedio: ~$0.0035/examen
```

### Proyección mensual:
```
120 exámenes/mes: 120 × $0.0035 = $0.42/mes
480 exámenes/mes: 480 × $0.0035 = $1.68/mes

Muy por debajo del presupuesto de $10/mes ✅
```

---

## ⚠️ Manejo de Errores

### Error Flow

```typescript
// Global error handling
try {
  const result = await processExam(file, metadata);
  return { status: "success", ...result };
} catch (error) {
  if (error.type === "STUDENT_NOT_FOUND") {
    return {
      status: "error",
      fileName: file.name,
      error: "STUDENT_NOT_FOUND",
      message: `No se encontró estudiante con apellido: ${apellido}`,
      suggestion: "Verifica el nombre del archivo"
    };
  }

  if (error.type === "AI_ANALYSIS_FAILED") {
    return {
      status: "error",
      fileName: file.name,
      error: "AI_ANALYSIS_FAILED",
      message: "No se pudo analizar el examen con IA",
      details: error.message
    };
  }

  if (error.type === "DB_INSERT_FAILED") {
    return {
      status: "error",
      fileName: file.name,
      error: "DB_INSERT_FAILED",
      message: "No se pudo guardar en base de datos",
      details: error.message,
      critical: true  // Requiere atención
    };
  }

  // Generic error
  return {
    status: "error",
    fileName: file.name,
    error: "UNKNOWN_ERROR",
    message: error.message
  };
}
```

---

## 📊 Resumen del Sistema Simplificado

### Componentes Totales: 6

1. **Parser** - Extrae apellido y contenido
2. **Matcher** - Busca estudiante en DB
3. **Analyzer** - Claude Haiku evalúa con rúbrica 5-FASE
4. **Calculator** - Calcula nota (promedio ponderado)
5. **Generator** - Genera feedback en Markdown
6. **Uploader** - Guarda en tabla Evaluation

### Características:

✅ **Rápido**: 11-14 segundos por examen
✅ **Económico**: ~$0.0035 por examen
✅ **Simple**: Sin análisis comparativo
✅ **Directo**: Upload → Análisis → Save
✅ **Escalable**: Puede procesar múltiples exámenes en paralelo

### Lo que NO tiene:

❌ Análisis comparativo con historial
❌ Score_Base histórico
❌ Ajustes por desempeño esperado
❌ Dual grading
❌ Factores de confiabilidad
❌ Categorización de datos
❌ Expectation calculator
❌ Predicciones vs realidad
❌ Validación de progreso

---

## 🚀 Próxima Fase: Implementación

### Orden de implementación sugerido:

1. **Fase 1**: Parser + Matcher (semana 1)
2. **Fase 2**: Analyzer (Claude Haiku integration) (semana 1-2)
3. **Fase 3**: Calculator + Generator (semana 2)
4. **Fase 4**: Uploader + API endpoint (semana 2-3)
5. **Fase 5**: UI (upload + results) (semana 3-4)
6. **Fase 6**: Testing & refinamiento (semana 4-5)

---

**Versión:** 2.0 - SIMPLIFICADO
**Fecha:** 21 de Octubre, 2025
**Basado en:** Requerimientos del usuario (solo W104, sin complejidad)
