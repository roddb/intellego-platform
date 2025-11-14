# SISTEMA DE CORRECCIÓN DE REPORTES SEMANALES CON IA

## 📋 Índice
1. [Visión General](#visión-general)
2. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Sistema de Prompts](#sistema-de-prompts)
5. [Sistema de Rúbricas](#sistema-de-rúbricas)
6. [Cálculo de Métricas](#cálculo-de-métricas)
7. [Optimización de Costos](#optimización-de-costos)
8. [API Endpoints](#api-endpoints)

---

## Visión General

El sistema de corrección automatizada de reportes semanales usa **Claude Haiku 4.5** para generar feedback educativo estructurado basado en un sistema de **rúbricas de 4 fases** del pensamiento crítico.

### Características Principales
- ✅ **Evaluación por niveles (1-4)** para cada una de las 5 preguntas del reporte
- ✅ **Rúbricas específicas por fase** metodológica (Fase 1-4)
- ✅ **Detección automática de casos especiales** (ausencias, sin clases, etc.)
- ✅ **Prompt Caching** para reducir costos en 90%
- ✅ **Procesamiento en batch** con rate limiting y reintentos
- ✅ **5 métricas de habilidades transversales** calculadas automáticamente

### Modelo de IA
- **Modelo**: `claude-haiku-4-5`
- **Temperature**: `0.1` (muy determinístico para evaluación justa)
- **Max tokens**: `2000` (análisis detallado)
- **Timeout**: `60s` por análisis
- **Reintentos**: `3` con backoff exponencial

---

## Flujo de Trabajo Completo

### 1. **Estudiante envía reporte semanal**
```
Usuario: Estudiante completa 5 preguntas sobre su trabajo semanal
└─> Se guarda en BD: ProgressReport + 5 Answer
```

### 2. **Instructor solicita generación de feedback**
```
Instructor → Dashboard → "Generar Feedback"
└─> POST /api/instructor/feedback/batch-generate
```

### 3. **Queue Manager organiza el procesamiento**
```
FeedbackQueueManager
├─> Obtiene reportes pendientes (sin feedback)
├─> Filtra por materia/semana si se especificó
├─> Procesa en chunks de 5 reportes concurrentes
└─> Rate limiting: 1s entre chunks
```

### 4. **Por cada reporte:**

#### A. **Obtener datos del reporte**
```typescript
const report = await getProgressReportWithStudent(reportId);
const answers = await getProgressReportAnswers(reportId);
```

#### B. **Detección de fase y casos especiales**
```typescript
const fase = 2; // TODO: Detectar automáticamente desde BD
const esCasoEspecial = detectarCasoEspecial(answers);
```

**Criterios de caso especial:**
- 4+ respuestas vacías (< 10 caracteres)
- Keywords: "ausente", "viaje", "enfermo", "sin clases", etc.
- Todas las respuestas idénticas y muy cortas

#### C. **Selección de rúbrica**
```typescript
if (esCasoEspecial) {
  rubrica = RUBRICA_CASO_ESPECIAL;
} else {
  rubrica = getRubricaByFase(fase); // RUBRICA_FASE_1/2/3/4
}
```

#### D. **Construcción de prompts**

**System Prompts (CACHEABLES):**
```typescript
[
  {
    type: 'text',
    text: `Eres un profesor de ${subject}...
           Evalúa según niveles 1-4...`,
    cache_control: { type: 'ephemeral' }
  },
  {
    type: 'text',
    text: `${rubricaOficial}
           INSTRUCCIONES DE EVALUACIÓN...`,
    cache_control: { type: 'ephemeral' }  // ← 90% ahorro
  }
]
```

**User Message (NO cacheable):**
```typescript
{
  role: 'user',
  content: `
    === PREGUNTA 1 ===
    ¿Qué temas trabajaste esta semana?

    RESPUESTA DEL ESTUDIANTE:
    [respuesta del estudiante]

    === PREGUNTA 2 ===
    ...
  `
}
```

#### E. **Llamada a Claude API**
```typescript
const response = await claudeClient.createMessage({
  system: systemMessages,  // ← Cacheado
  messages: [{ role: 'user', content: userMessage }],
  max_tokens: 2000,
  temperature: 0.1,
  stop_sequences: []
});
```

#### F. **Parsing de la respuesta de Claude**

Claude retorna en formato estructurado:
```
EVALUACIÓN POR PREGUNTA:
Q1_NIVEL: 3
Q1_JUSTIFICACIÓN: [2-3 líneas con ejemplo concreto]

Q2_NIVEL: 4
Q2_JUSTIFICACIÓN: [2-3 líneas]

...

FORTALEZAS:
- [Fortaleza 1]
- [Fortaleza 2]
- [Fortaleza 3]

MEJORAS:
- [Mejora 1]
- [Mejora 2]
- [Mejora 3]

COMENTARIOS_GENERALES:
[4-6 líneas de feedback general]

ANÁLISIS_AI:
[4-6 líneas de recomendaciones técnicas]
```

**Extracción de niveles:**
```typescript
const niveles = {
  q1: extractNivel('Q1'),  // → 3
  q2: extractNivel('Q2'),  // → 4
  q3: extractNivel('Q3'),  // → 2
  q4: extractNivel('Q4'),  // → 3
  q5: extractNivel('Q5')   // → 4
};
```

#### G. **Conversión de niveles a puntajes**
```typescript
const scores = {
  q1: nivelAPuntaje(3),  // → 77
  q2: nivelAPuntaje(4),  // → 92.5
  q3: nivelAPuntaje(2),  // → 62
  q4: nivelAPuntaje(3),  // → 77
  q5: nivelAPuntaje(4)   // → 92.5
};
```

**Tabla de conversión:**
| Nivel | Rango original | Puntaje asignado |
|-------|----------------|------------------|
| 4     | 85-100         | 92.5             |
| 3     | 70-84          | 77               |
| 2     | 55-69          | 62               |
| 1     | 0-54           | 27               |

#### H. **Cálculo de score final ponderado**
```typescript
const scoreFinal = calcularScoreFinal(scores);
```

**Fórmula:**
```
Score = (Q1 × 0.25) + (Q2 × 0.25) + (Q3 × 0.20) + (Q4 × 0.20) + (Q5 × 0.10)
```

**Ponderaciones:**
- Q1: 25% - Temas trabajados y dominio
- Q2: 25% - Evidencia de aprendizaje
- Q3: 20% - Dificultades y estrategias
- Q4: 20% - Conexiones y aplicación
- Q5: 10% - Comentarios adicionales

**Ejemplo:**
```
(77 × 0.25) + (92.5 × 0.25) + (62 × 0.20) + (77 × 0.20) + (92.5 × 0.10)
= 19.25 + 23.125 + 12.4 + 15.4 + 9.25
= 79.425 → 79/100
```

#### I. **Cálculo de 5 métricas de habilidades**
```typescript
const skillsMetrics = calcularSkillsMetrics(scores);
```

**Fórmulas oficiales:**

1. **Comprehension** (Capacidad de entender conceptos):
   ```
   (Q1 × 0.30) + (Q2 × 0.40) + (Q4 × 0.30)
   ```

2. **Critical Thinking** (Análisis sistemático):
   ```
   (Q1 × 0.25) + (Q3 × 0.35) + (Q4 × 0.40)
   ```

3. **Self-Regulation** (Gestión del aprendizaje):
   ```
   (Q2 × 0.40) + (Q3 × 0.60)
   ```

4. **Practical Application** (Uso efectivo de herramientas):
   ```
   (Q2 × 0.50) + (Q4 × 0.50)
   ```

5. **Metacognition** (Reflexión sobre el pensamiento):
   ```
   (Q3 × 0.40) + (Q5 × 0.60)
   ```

#### J. **Limpieza de texto**
```typescript
// Quitar markdown para mejor legibilidad del estudiante
const cleanText = text
  .replace(/\*\*/g, '')           // Quita **negritas**
  .replace(/###?\s*/g, '')        // Quita # encabezados
  .replace(/---+/g, '')           // Quita ---
  .replace(/^\s*[-•]\s*/gm, '• ') // Bullets simples
  .replace(/\n{3,}/g, '\n\n');    // Max 2 saltos de línea
```

```typescript
// Limitar fortalezas y mejoras a máximo 3 items
const strengths = extractBulletPoints(rawStrengths, 3);
const improvements = extractBulletPoints(rawImprovements, 3);
```

#### K. **Guardar en base de datos**
```typescript
await createAIFeedback({
  studentId: report.studentId,
  progressReportId: reportId,
  weekStart: report.weekStart,
  subject: report.subject,
  score: scoreFinal,                  // 79
  generalComments: cleanedComments,    // Texto limpio
  strengths: cleanedStrengths,         // Max 3 items
  improvements: cleanedImprovements,   // Max 3 items
  aiAnalysis: cleanedAnalysis,         // Texto limpio
  skillsMetrics: {                     // JSON
    comprehension: 82,
    criticalThinking: 75,
    selfRegulation: 73,
    practicalApplication: 84,
    metacognition: 71
  },
  createdBy: instructorId,
  apiCost: 0.0045  // Costo real del API call
});
```

**Tabla Feedback:**
```sql
CREATE TABLE Feedback (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  progressReportId TEXT UNIQUE,
  weekStart TEXT NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,           -- 0-100
  generalComments TEXT NOT NULL,
  strengths TEXT NOT NULL,
  improvements TEXT NOT NULL,
  aiAnalysis TEXT,
  skillsMetrics TEXT,               -- JSON con 5 métricas
  createdBy TEXT NOT NULL,
  apiCost REAL,                     -- Costo real en USD
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

### 5. **Cálculo de costos**
```typescript
const cost = calculateCost(response.usage);
```

**Precios Claude Haiku 4.5:**
- Input: $1.00 / 1M tokens
- Output: $5.00 / 1M tokens
- Cache write: $1.25 / 1M tokens
- Cache read: $0.10 / 1M tokens (90% ahorro)

**Ejemplo de costos:**
```
Primera evaluación (sin cache):
  - Input: 3500 tokens × $1/M = $0.0035
  - Cache write: 3000 tokens × $1.25/M = $0.00375
  - Output: 800 tokens × $5/M = $0.004
  Total: $0.01125

Evaluaciones subsiguientes (con cache hit):
  - Cache read: 3000 tokens × $0.10/M = $0.0003
  - Input nuevo: 500 tokens × $1/M = $0.0005
  - Output: 800 tokens × $5/M = $0.004
  Total: $0.0048 (57% de ahorro)
```

### 6. **Resultado final**
```typescript
{
  total: 47,
  successful: 45,
  failed: 2,
  errors: [
    { reportId: "abc", error: "No answers found" },
    { reportId: "def", error: "API timeout" }
  ],
  totalCost: 0.235,      // $0.235 USD
  latencyMs: 127340       // ~2 minutos
}
```

---

## Arquitectura del Sistema

### Estructura de archivos
```
src/
├── services/ai/
│   ├── claude/
│   │   ├── client.ts                      # Cliente Claude API
│   │   ├── analyzer.ts                    # Analizador educativo principal
│   │   └── prompts/
│   │       ├── feedback.ts                # Prompts legacy (6 variantes)
│   │       └── rubricas.ts                # Sistema de rúbricas 4 fases
│   └── feedback-queue-manager.ts          # Procesamiento en batch
│
├── app/api/instructor/feedback/
│   ├── batch-generate/route.ts            # Endpoint manual batch
│   ├── batch-generate-async/route.ts      # Endpoint async (cron)
│   ├── generate-single/route.ts           # Endpoint individual
│   └── upload/route.ts                    # Subida manual CSV
│
└── lib/
    └── db-operations.ts                   # CRUD de BD
```

### Componentes Principales

#### 1. **ClaudeClient** (`client.ts`)
- Singleton para comunicación con Anthropic API
- Configuración optimizada para educación
- Manejo robusto de errores con reintentos
- Soporte para streaming (Fase 2 futura)

**Configuración:**
```typescript
{
  model: 'claude-haiku-4-5',
  temperature: 0.1,
  max_tokens: 1500,
  stop_sequences: ['</feedback>', '\n\n---\n\n', '\nEn conclusión'],
  timeout: 60000,
  maxRetries: 3
}
```

#### 2. **EducationalAnalyzer** (`analyzer.ts`)
- Orquestador principal del análisis
- Selección de rúbrica (normal vs caso especial)
- Construcción de prompts con cache
- Parsing y limpieza de respuestas
- Cálculo de score y métricas

**Métodos principales:**
```typescript
class EducationalAnalyzer {
  async analyzeAnswers(
    answers: Answer[],
    subject: string,
    fase: 1 | 2 | 3 | 4,
    format: 'structured' | 'narrative'
  ): Promise<AnalysisResult>

  private _detectarCasoEspecial(answers: Answer[]): boolean
  private _seleccionarRubrica(fase, answers): string
  private _buildCacheableSystemPrompts(subject, fase, rubrica)
  private _buildUserMessage(answers, fase): string
  private _parseAnalysisResponseWithRubricas(text): AnalysisResult
  private _calculateCost(usage): number
}
```

#### 3. **FeedbackQueueManager** (`feedback-queue-manager.ts`)
- Procesamiento en batch con rate limiting
- 5 reportes concurrentes por chunk
- 3 reintentos con backoff exponencial (2s, 4s, 8s)
- 1s de espera entre chunks
- Tracking de progreso

**Métodos principales:**
```typescript
class FeedbackQueueManager {
  async processReports(
    reportIds: string[],
    options: {
      maxConcurrent?: number,
      retryAttempts?: number,
      instructorId?: string,
      onProgress?: (current, total) => void
    }
  ): Promise<BatchResult>

  private async processReport(reportId, retriesLeft): Promise<...>
  async validateReport(reportId): Promise<...>
}
```

---

## Sistema de Prompts

### Estructura del Prompt

**System Messages (Cacheables):**
1. **Rol e instrucciones generales** (~500 tokens)
   - Rol: Profesor de ${subject}
   - Sistema de niveles 1-4
   - Estilo de redacción (formal pero amigable)
   - Límites de longitud

2. **Rúbrica oficial + instrucciones de evaluación** (~3000 tokens)
   - Rúbrica completa de la fase
   - Descriptores de niveles para cada pregunta
   - Instrucciones de formato de salida
   - Reglas estrictas (max 3 fortalezas, 3 mejoras)

**User Message (NO cacheable):**
- Respuestas del estudiante (Q1-Q5)
- Fase actual
- Materia
- Formato de salida requerido

### Estilo de Redacción (MUY IMPORTANTE)

El prompt especifica:
- **Tono**: Formal pero amigable, como hablarías con un estudiante de 16 años
- **Lenguaje**: Claro, concreto, fácil de entender
- **Estructura**: Párrafos cortos (máximo 3-4 líneas)
- **Objetivo**: Que el estudiante entienda QUÉ, POR QUÉ y CÓMO
- **Longitud**: Conciso pero completo

**Reglas de formato estrictas:**
- FORTALEZAS: Usar bullets. NUNCA más de 3 items.
- MEJORAS: Usar bullets. NUNCA más de 3 items.
- Párrafos cortos (máximo 4 líneas)
- Lenguaje en 2da persona: "Tu respuesta muestra..." NO "El estudiante..."
- Separar ideas con punto y aparte

---

## Sistema de Rúbricas

### 4 Fases del Pensamiento Crítico

#### **Fase 1: Identificación y Comprensión del Problema**
**Foco metodológico:**
- Identificar problemas principales
- Distinguir información relevante/irrelevante
- Comprender el contexto
- Articular objetivos claramente

**Evaluación:**
- Q1: Identificación del problema y filtrado de información
- Q2: Evidencias de aplicación del Paso 1
- Q3: Dificultades y metacognición
- Q4: Conexiones con vida cotidiana
- Q5: Reflexiones y creatividad

#### **Fase 2: Identificación de Variables y Datos**
**Foco metodológico:**
- Identificar variables (conocidas/desconocidas)
- Clasificar variables (controlables/no controlables)
- Distinguir magnitudes físicas
- Comprender relaciones entre variables
- **Integración con Fase 1**

**Evaluación:**
- Q1: Completitud en identificación y clasificación de variables
- Q2: Integración de F1+F2, sistematicidad
- Q3: Dificultades en análisis de variables
- Q4: Transferencia a otros contextos
- Q5: Iniciativa y propuestas

#### **Fase 3: Hipótesis y Explicación** (TODO: Implementar)
**Foco metodológico:**
- Formular hipótesis fundamentadas
- Explicar fenómenos usando teoría
- Justificar razonamientos
- **Integración con F1+F2**

#### **Fase 4: Verificación y Conclusión** (TODO: Implementar)
**Foco metodológico:**
- Verificar resultados
- Analizar coherencia
- Sacar conclusiones
- **Integración con F1+F2+F3**

### Rúbrica de Caso Especial

**Cuándo se activa:**
- 4+ respuestas vacías (< 10 caracteres)
- Keywords: "ausente", "viaje", "enfermo", "sin clases"
- Respuestas idénticas muy cortas

**Comportamiento:**
- Evaluación más flexible y comprensiva
- Puntajes más bajos pero justos
- Comentarios orientados a recuperación
- No penaliza ausencias justificadas

**Ejemplo de detección:**
```typescript
// Caso 1: Respuestas vacías
const respuestasVacias = answers.filter(a =>
  !a.answer || a.answer.trim().length < 10
).length;

if (respuestasVacias >= 4) {
  return RUBRICA_CASO_ESPECIAL;
}

// Caso 2: Keywords de ausencia
const keywords = ['ausente', 'viaje', 'enfermo', 'sin clases', ...];
const totalText = answers.map(a => a.answer.toLowerCase()).join(' ');
if (keywords.some(k => totalText.includes(k))) {
  return RUBRICA_CASO_ESPECIAL;
}
```

---

## Cálculo de Métricas

### Score Final (0-100)

**Algoritmo oficial:**
```typescript
function calcularScoreFinal(scores: {
  q1: number, q2: number, q3: number, q4: number, q5: number
}): number {
  return Math.round(
    (scores.q1 * PONDERACIONES.Q1) +
    (scores.q2 * PONDERACIONES.Q2) +
    (scores.q3 * PONDERACIONES.Q3) +
    (scores.q4 * PONDERACIONES.Q4) +
    (scores.q5 * PONDERACIONES.Q5)
  );
}
```

**Ponderaciones:**
```typescript
const PONDERACIONES = {
  Q1: 0.25,  // 25% - Temas y dominio
  Q2: 0.25,  // 25% - Evidencia de aprendizaje
  Q3: 0.20,  // 20% - Dificultades
  Q4: 0.20,  // 20% - Conexiones
  Q5: 0.10   // 10% - Comentarios
};
```

### Skills Metrics (5 habilidades transversales)

**1. Comprehension (Capacidad de entender conceptos)**
```typescript
comprehension = (Q1 × 0.30) + (Q2 × 0.40) + (Q4 × 0.30)
```
Evalúa: Comprensión de temas, evidencia de aprendizaje, aplicación

**2. Critical Thinking (Análisis sistemático)**
```typescript
criticalThinking = (Q1 × 0.25) + (Q3 × 0.35) + (Q4 × 0.40)
```
Evalúa: Dominio, análisis de dificultades, conexiones

**3. Self-Regulation (Gestión del aprendizaje)**
```typescript
selfRegulation = (Q2 × 0.40) + (Q3 × 0.60)
```
Evalúa: Evidencias, identificación de dificultades y estrategias

**4. Practical Application (Uso efectivo de herramientas)**
```typescript
practicalApplication = (Q2 × 0.50) + (Q4 × 0.50)
```
Evalúa: Evidencias concretas, transferencia a otros contextos

**5. Metacognition (Reflexión sobre el pensamiento)**
```typescript
metacognition = (Q3 × 0.40) + (Q5 × 0.60)
```
Evalúa: Reflexión sobre dificultades, comentarios adicionales

**Implementación:**
```typescript
export function calcularSkillsMetrics(scores: {
  q1: number, q2: number, q3: number, q4: number, q5: number
}): SkillsMetrics {
  return {
    comprehension: Math.round(
      (scores.q1 * 0.30) + (scores.q2 * 0.40) + (scores.q4 * 0.30)
    ),
    criticalThinking: Math.round(
      (scores.q1 * 0.25) + (scores.q3 * 0.35) + (scores.q4 * 0.40)
    ),
    selfRegulation: Math.round(
      (scores.q2 * 0.40) + (scores.q3 * 0.60)
    ),
    practicalApplication: Math.round(
      (scores.q2 * 0.50) + (scores.q4 * 0.50)
    ),
    metacognition: Math.round(
      (scores.q3 * 0.40) + (scores.q5 * 0.60)
    )
  };
}
```

---

## Optimización de Costos

### Prompt Caching (90% ahorro)

**Qué se cachea:**
- System messages (rol + rúbrica = ~3500 tokens)
- Duración del cache: 5 minutos
- Se actualiza automáticamente si cambia el contenido

**Qué NO se cachea:**
- User messages (respuestas del estudiante)
- Varían en cada análisis

**Ahorro real:**
```
Sin cache: $0.0035 (input) + $0.004 (output) = $0.0075
Con cache: $0.0003 (cache read) + $0.004 (output) = $0.0043

Ahorro: 43% por análisis subsiguiente
```

### Rate Limiting

**Configuración actual:**
- 5 análisis concurrentes
- 1 segundo de espera entre chunks
- 3 reintentos con backoff exponencial

**Evita:**
- Rate limit errors (429)
- Sobrecarga del API
- Costos por reintentos innecesarios

### Batch Processing

**Ventajas:**
- Procesamiento eficiente de múltiples reportes
- Tracking de progreso en tiempo real
- Agregación de errores
- Cálculo de costo total

---

## API Endpoints

### 1. **Batch Generate (Manual)**
```
POST /api/instructor/feedback/batch-generate
```

**Request Body:**
```json
{
  "filters": {
    "subject": "Física",
    "weekStart": "2025-10-14",
    "limit": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "total": 47,
    "successful": 45,
    "failed": 2,
    "failedReports": [
      { "reportId": "abc", "error": "No answers found" }
    ],
    "totalCost": 0.235,
    "totalTimeMs": 127340
  }
}
```

**Límites:**
- Max duration: 300s (5 minutos)
- Max reportes por request: 100
- Solo instructores

### 2. **Get Pending Reports Info**
```
GET /api/instructor/feedback/batch-generate
```

**Response:**
```json
{
  "pendingReports": {
    "Física": 23,
    "Química": 24,
    "total": 47
  },
  "costEstimate": {
    "perReport": "$0.005",
    "example": "47 reports × $0.005 = $0.24"
  }
}
```

### 3. **Get Pending Reports Details**
```
GET /api/instructor/feedback/batch-generate?subject=Física
```

**Response:**
```json
{
  "pendingReports": { ... },
  "details": [
    {
      "id": "report-123",
      "studentName": "Juan Pérez",
      "division": "5to A",
      "weekStart": "2025-10-14",
      "submittedAt": "2025-10-18T10:30:00Z"
    }
  ]
}
```

### 4. **Generate Single Feedback**
```
POST /api/instructor/feedback/generate-single
```

**Request Body:**
```json
{
  "reportId": "report-123"
}
```

**Response:**
```json
{
  "success": true,
  "feedback": {
    "id": "feedback-456",
    "score": 79,
    "generalComments": "...",
    "strengths": "...",
    "improvements": "...",
    "skillsMetrics": {
      "comprehension": 82,
      "criticalThinking": 75,
      "selfRegulation": 73,
      "practicalApplication": 84,
      "metacognition": 71
    },
    "apiCost": 0.0045
  }
}
```

---

## Casos de Uso

### Caso 1: Instructor genera feedback para reportes de la semana

```bash
# 1. Ver cuántos reportes pendientes hay
GET /api/instructor/feedback/batch-generate

# 2. Ver detalles de Física
GET /api/instructor/feedback/batch-generate?subject=Física

# 3. Generar feedback para todos los de Física
POST /api/instructor/feedback/batch-generate
{
  "filters": { "subject": "Física" }
}

# Resultado: 23 reportes procesados en ~2 minutos
```

### Caso 2: Estudiante visualiza su feedback

```bash
# 1. Obtener feedbacks del estudiante
GET /api/student/feedback?userId=student-123

# Respuesta:
[
  {
    "id": "feedback-456",
    "subject": "Física",
    "weekStart": "2025-10-14",
    "score": 79,
    "generalComments": "...",
    "strengths": "...",
    "improvements": "...",
    "skillsMetrics": { ... },
    "createdAt": "2025-10-18T15:30:00Z"
  }
]
```

### Caso 3: Detección de caso especial

**Reporte con ausencia:**
```
Q1: Estuve ausente toda la semana por viaje familiar
Q2: No asistí a clases
Q3: -
Q4: -
Q5: -
```

**Resultado:**
- Se detecta keyword "ausente" + "viaje"
- Se usa RUBRICA_CASO_ESPECIAL
- Evaluación más comprensiva
- Comentarios: "Entiendo que estuviste ausente. Te recomiendo..."

---

## Estado Actual y TODOs

### ✅ Implementado
- [x] Sistema de rúbricas Fase 1 y Fase 2
- [x] Detección de casos especiales
- [x] Prompt caching para optimización
- [x] Batch processing con rate limiting
- [x] Cálculo de 5 métricas de habilidades
- [x] Limpieza de markdown en respuestas
- [x] Tracking de costos reales por análisis

### ⏳ En Desarrollo
- [ ] Rúbricas Fase 3 y Fase 4 (pendientes de creación)
- [ ] Detección automática de fase desde BD (hardcoded a Fase 2)
- [ ] Streaming de respuestas para feedback en tiempo real

### 🔮 Mejoras Futuras
- [ ] Dashboard de analytics de feedback
- [ ] Comparación de progreso semanal (usar prompts de comparación)
- [ ] Feedback adaptativo según historial del estudiante
- [ ] Integración con calendario para envío automático
- [ ] Export de reportes a PDF con feedback incluido

---

## Métricas de Performance

### Costos Promedio
- **Por reporte**: ~$0.005 USD
- **Batch de 50 reportes**: ~$0.25 USD
- **Mensual (200 reportes/semana × 4 semanas)**: ~$4 USD

### Tiempos
- **Análisis individual**: ~2-3 segundos
- **Batch de 50 reportes**: ~2 minutos
- **Con cache hit**: ~1.5 segundos por reporte

### Calidad
- **Tasa de éxito**: ~95%
- **Errores comunes**:
  - Reportes sin respuestas (3%)
  - Timeouts en API (1%)
  - Errores de parsing (1%)

---

## Contacto y Soporte

**Documentación relacionada:**
- `/evaluation_integration/RUBRICAS_DE_CORRECCION.md` - Rúbricas oficiales
- `/documentation/CLAUDE-WORKFLOW.md` - Workflow de desarrollo
- `/documentation/PROJECT-HISTORY.md` - Historia del proyecto

**Desarrollador:** Rodrigo Di Bernardo
**Modelo de IA:** Claude Haiku 4.5
**Versión del sistema:** 1.1
**Última actualización:** Octubre 2025
