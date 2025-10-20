# ROADMAP: Integración Claude Haiku 4.5 en Intellego Platform

**Versión:** 1.0
**Fecha de creación:** Octubre 20, 2025
**Proyecto:** Intellego Platform - AI Assessment System
**Responsable:** Rodrigo Di Bernardo

---

## 📋 Resumen Ejecutivo

Este roadmap detalla la integración de Claude Haiku 4.5 API en Intellego Platform para automatizar análisis de reportes semanales, evaluación de habilidades académicas y generación de feedback estructurado. La implementación se realiza en **4 fases incrementales** con enfoque en:

- **Zero-downtime** para 169+ usuarios activos
- **Optimización de costos** (objetivo: <$10/mes)
- **Testing exhaustivo** antes de cada deployment
- **Alineamiento con roadmap existente** de AI Assessment

---

## 🎯 Casos de Uso Prioritarios

### Caso de Uso 1: Análisis Automático de Reportes Semanales
**Descripción**: Analizar respuestas de estudiantes en tabla `Answer` y generar feedback constructivo en campo `Feedback.aiAnalysis`

**Valor de negocio**: Retroalimentación instantánea vs. espera de instructor manual

**Implementación**: Fase 1 + Fase 2

### Caso de Uso 2: Evaluación de Habilidades Académicas
**Descripción**: Calcular métricas de 5 habilidades académicas existentes y poblar `Feedback.skillsMetrics` (JSON)

**Valor de negocio**: Métricas objetivas para visualización en Progress Rings

**Implementación**: Fase 2 + Fase 3

### Caso de Uso 3: Sistema de Rúbricas Inteligente
**Descripción**: Comparar trabajos de estudiantes contra rúbricas por materia/sede

**Valor de negocio**: Alineado con roadmap aprobado de AI Assessment

**Implementación**: Fase 3 + Fase 4

---

## 📅 Timeline General

| Fase | Duración Estimada | Objetivo Principal | Costo Estimado |
|------|-------------------|-------------------|----------------|
| **Fase 1** | 2-3 horas | Configuración base y primer llamado exitoso | $0 (testing) |
| **Fase 2** | 6-8 horas | MVP funcional con endpoint de análisis | ~$5 (testing) |
| **Fase 3** | 4-6 horas | Optimización de costos (caching + batch) | ~$3 (testing) |
| **Fase 4** | 6-8 horas | Producción con monitoreo y rate limiting | ~$2 (testing) |
| **TOTAL** | **18-25 horas** | Sistema completo en producción | **<$10** |

---

## 🚀 FASE 1: Configuración Base y Validación

**Duración**: 2-3 horas
**Objetivo**: Establecer conexión con API de Anthropic y realizar primera llamada exitosa

### 1.1 Prerrequisitos

**Checklist inicial:**
- [ ] Obtener API Key de Anthropic (console.anthropic.com)
- [ ] Verificar Node.js 20 LTS o superior instalado
- [ ] Confirmar ambiente local funcional (`npm run dev`)
- [ ] Verificar acceso a Turso MCP para DB

### 1.2 Instalación de Dependencias

```bash
# En raíz del proyecto
npm install @anthropic-ai/sdk dotenv winston
```

**Validación:**
```bash
npm list @anthropic-ai/sdk
# Debe mostrar: @anthropic-ai/sdk@0.27.0 o superior
```

### 1.3 Configuración de Variables de Entorno

**Archivo: `.env` (ya existe en proyecto)**

Agregar:
```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Seguridad:**
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] NO commitear la API key al repositorio
- [ ] Agregar la key a Vercel Environment Variables (dashboard)

### 1.4 Crear Estructura de Archivos

**Nueva estructura en `/src/services/`:**

```
/src/services/
  /ai/
    /claude/
      client.ts              # Cliente Anthropic configurado
      analyzer.ts            # Servicio de análisis educativo
      batch-processor.ts     # Procesamiento por lotes (Fase 3)
      /prompts/
        feedback.ts          # Prompts para retroalimentación
        analysis.ts          # Prompts para análisis
        comparison.ts        # Prompts para comparación con rúbricas
    /monitoring/
      token-tracker.ts       # Monitoreo de tokens y costos
      cost-alerts.ts         # Alertas de presupuesto (Fase 4)
```

**Comandos:**
```bash
mkdir -p src/services/ai/claude/prompts
mkdir -p src/services/ai/monitoring
```

### 1.5 Implementar Cliente Base

**Archivo: `src/services/ai/claude/client.ts`**

**Características clave:**
- Model ID correcto: `claude-haiku-4-5` (NO `claude-haiku-4-5-20250929`)
- Timeout de 60 segundos
- Máximo 3 reintentos automáticos
- Manejo robusto de errores con backoff exponencial
- Logging completo para debugging

**Referencia**: Ver PRD sección 4.1 para implementación completa

### 1.6 Script de Validación

**Archivo: `test-claude-connection.ts` (raíz del proyecto, temporal)**

```typescript
import dotenv from 'dotenv';
import claudeClient from './src/services/ai/claude/client';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Claude API connection...');

  const response = await claudeClient.createMessage({
    messages: [{
      role: 'user',
      content: 'Responde con exactamente: "Conexión exitosa"'
    }],
    max_tokens: 50
  });

  if (response.success) {
    console.log('✅ SUCCESS:', response.content);
    console.log('📊 Tokens usados:', response.usage);
    console.log('⏱️ Latencia:', response.latency, 'ms');
  } else {
    console.error('❌ ERROR:', response.error);
  }
}

testConnection();
```

**Ejecución:**
```bash
npx tsx test-claude-connection.ts
```

### 1.7 Criterios de Éxito - Fase 1

- [ ] ✅ Respuesta exitosa de Claude API
- [ ] ✅ Tokens reportados correctamente en logs
- [ ] ✅ Sin errores de autenticación
- [ ] ✅ Latencia < 3 segundos
- [ ] ✅ Manejo de errores funciona (probar con API key inválida)

**Si todos los checks pasan**: Proceder a Fase 2

---

## 🏗️ FASE 2: MVP Funcional con Análisis de Reportes

**Duración**: 6-8 horas
**Objetivo**: Endpoint funcional que analiza reportes semanales y genera feedback

### 2.1 Diseño de Schema Extensions

**NO se requieren nuevas tablas** - Usar campos existentes en `Feedback`:

```sql
-- Campos existentes que se utilizarán:
- aiAnalysis TEXT          -- Análisis completo generado por Claude
- generalComments TEXT     -- Comentarios generales (generados)
- strengths TEXT           -- Fortalezas identificadas
- improvements TEXT        -- Áreas de mejora sugeridas
- skillsMetrics TEXT       -- JSON con métricas de habilidades
```

**Validación de campos con Turso MCP:**
```bash
# Via MCP tool
mcp__turso-intellego__describe_table("Feedback")
```

### 2.2 Implementar Servicio de Análisis

**Archivo: `src/services/ai/claude/analyzer.ts`**

**Clase principal: `EducationalAnalyzer`**

**Métodos:**
1. `analyzeProgressReport(progressReportId: string, rubric?: string)` → Analiza un reporte completo
2. `evaluateSkills(answers: Answer[], rubric: string)` → Calcula skillsMetrics
3. `generateFeedback(analysis: object)` → Genera feedback estructurado

**Configuración crítica:**
- `temperature: 0.1` → Determinístico para evaluación justa
- `max_tokens: 1500` → Suficiente para feedback detallado
- `stop_sequences: ['</feedback>', '\n\n---']` → Control de costos

**Referencia**: Ver PRD sección 4.2 para implementación completa

### 2.3 Sistema de Prompts Optimizados

**Archivo: `src/services/ai/claude/prompts/feedback.ts`**

**Estructura de prompt educativo:**

```typescript
export function buildFeedbackPrompt(
  studentAnswers: Answer[],
  subject: string,
  format: 'structured' | 'narrative' = 'structured'
) {
  return `<instrucciones>
Eres un profesor experimentado de ${subject}. Analiza las respuestas del estudiante y proporciona:

1. EVALUACIÓN GENERAL (1-100)
2. FORTALEZAS (2-3 puntos específicos con ejemplos)
3. ÁREAS DE MEJORA (2-3 puntos con sugerencias accionables)
4. PRÓXIMOS PASOS (1-2 recomendaciones concretas)

Tono: constructivo, alentador pero honesto.
Límite: 200 palabras totales.
</instrucciones>

<respuestas_estudiante>
${formatAnswers(studentAnswers)}
</respuestas_estudiante>

<formato_salida>
Puntaje: [X]/100

Fortalezas:
- [Fortaleza 1 con ejemplo específico]
- [Fortaleza 2 con ejemplo específico]

Áreas de mejora:
- [Mejora 1: problema + sugerencia]
- [Mejora 2: problema + sugerencia]

Próximos pasos:
- [Acción concreta 1]
- [Acción concreta 2]
</formato_salida>`;
}
```

**Técnicas de optimización aplicadas:**
- Uso de etiquetas XML para claridad
- Límites de palabras explícitos
- Formato de salida estructurado
- Zero-shot approach (sin ejemplos, menos tokens)

**Referencia**: Ver PRD sección 4.3 para prompts completos

### 2.4 Crear API Endpoint

**Archivo: `src/app/api/ai/analyze-report/route.ts`**

**Especificaciones:**
```typescript
POST /api/ai/analyze-report

Request Body:
{
  "progressReportId": "string",
  "rubric": "string (optional)",
  "options": {
    "maxTokens": number,
    "temperature": number,
    "format": "structured" | "narrative"
  }
}

Response:
{
  "success": true,
  "feedbackId": "string",
  "analysis": {
    "score": number,
    "generalComments": string,
    "strengths": string,
    "improvements": string,
    "skillsMetrics": {
      "completeness": number,
      "clarity": number,
      "reflection": number,
      "progress": number,
      "engagement": number
    }
  },
  "metadata": {
    "tokensUsed": { input: number, output: number },
    "estimatedCost": number,
    "requestId": string,
    "latency": number
  }
}
```

**Flujo del endpoint:**
1. Validar autenticación (NextAuth)
2. Validar que el usuario tenga permiso para el reporte
3. Obtener respuestas del reporte desde DB (via Turso MCP)
4. Llamar a `analyzer.analyzeProgressReport()`
5. Guardar feedback en tabla `Feedback`
6. Retornar resultados + metadata

**Seguridad:**
```typescript
// Validación de autorización
const session = await auth();
if (!session || session.user.role !== 'INSTRUCTOR') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Referencia**: Ver PRD sección 5 para endpoints completos

### 2.5 Integración con Turso MCP

**Operaciones de DB requeridas:**

```typescript
// Obtener respuestas del reporte
export async function getProgressReportAnswers(reportId: string) {
  const result = await query(`
    SELECT
      a.id, a.questionId, a.answer,
      q.text as questionText, q.type
    FROM Answer a
    JOIN Question q ON a.questionId = q.id
    WHERE a.progressReportId = ?
    ORDER BY q.order ASC
  `, [reportId]);

  return result.rows;
}

// Crear feedback con análisis AI
export async function createAIFeedback(data: {
  studentId: string;
  progressReportId: string;
  weekStart: string;
  subject: string;
  score: number;
  generalComments: string;
  strengths: string;
  improvements: string;
  aiAnalysis: string;
  skillsMetrics: object;
  createdBy: string;
}) {
  const id = generateId();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO Feedback (
      id, studentId, progressReportId, weekStart, subject,
      score, generalComments, strengths, improvements,
      aiAnalysis, skillsMetrics, createdBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, data.studentId, data.progressReportId, data.weekStart, data.subject,
    data.score, data.generalComments, data.strengths, data.improvements,
    data.aiAnalysis, JSON.stringify(data.skillsMetrics),
    data.createdBy, now, now
  ]);

  return id;
}
```

**Agregar a: `src/lib/db-operations.ts`**

### 2.6 Testing MVP

**Archivo: `src/app/api/ai/analyze-report/test.http` (VS Code REST Client)**

```http
### Test 1: Análisis básico
POST http://localhost:3000/api/ai/analyze-report
Content-Type: application/json

{
  "progressReportId": "clx...",
  "options": {
    "format": "structured",
    "maxTokens": 1500,
    "temperature": 0.1
  }
}

### Test 2: Con rúbrica personalizada
POST http://localhost:3000/api/ai/analyze-report
Content-Type: application/json

{
  "progressReportId": "clx...",
  "rubric": "Evaluar: 1) Claridad en respuestas, 2) Reflexión profunda, 3) Evidencia de progreso",
  "options": {
    "format": "narrative"
  }
}
```

**Pruebas manuales:**
1. Seleccionar reporte real de Turso (usar MCP para query)
2. Ejecutar análisis vía endpoint
3. Verificar feedback generado tiene sentido
4. Confirmar que se guardó en tabla Feedback
5. Verificar costos (input + output tokens)

### 2.7 Validación con Instructores Piloto

**Protocolo de testing:**
1. Seleccionar 2-3 instructores early adopters
2. Proporcionar acceso a endpoint vía dashboard
3. Analizar 5-10 reportes por instructor
4. Comparar feedback AI vs. feedback manual
5. Recopilar feedback sobre:
   - Calidad del análisis
   - Precisión de las métricas
   - Utilidad de las sugerencias
   - Áreas de mejora

**Métricas objetivo:**
- Concordancia con evaluación humana: **>85%**
- Tiempo de análisis: **<5 segundos**
- Satisfacción del instructor: **>4/5**

### 2.8 Criterios de Éxito - Fase 2

- [ ] ✅ Endpoint `/api/ai/analyze-report` responde correctamente
- [ ] ✅ Feedback generado es coherente y útil
- [ ] ✅ skillsMetrics calculados correctamente (5 habilidades)
- [ ] ✅ Datos se guardan en tabla Feedback sin errores
- [ ] ✅ Manejo de errores robusto (probar con reportId inválido)
- [ ] ✅ Costos por análisis < $0.01
- [ ] ✅ Testing manual con 10+ reportes reales exitoso
- [ ] ✅ Feedback de instructores piloto positivo (>85% satisfacción)

**Si todos los checks pasan**: Proceder a Fase 3

---

## ⚡ FASE 3: Optimización de Costos y Batch Processing

**Duración**: 4-6 horas
**Objetivo**: Reducir costos operacionales 60-75% mediante caching y batch API

### 3.1 Implementar Prompt Caching

**Concepto**: Rúbricas y system prompts se cachean por 5-60 minutos, reduciendo costos de $1/MTok a $0.10/MTok (90% ahorro)

**Modificación en `analyzer.ts`:**

```typescript
async analyzeProgressReport(reportId: string, rubric: string) {
  const config = {
    max_tokens: 1500,
    temperature: 0.1,
    system: [
      {
        type: 'text',
        text: 'Eres un profesor experimentado especializado en feedback educativo.',
        cache_control: { type: 'ephemeral' }  // ← Cachea este bloque
      },
      {
        type: 'text',
        text: `<rubrica>\n${rubric}\n</rubrica>\n\nUtiliza esta rúbrica para evaluar.`,
        cache_control: { type: 'ephemeral' }  // ← Cachea la rúbrica
      }
    ],
    messages: [{
      role: 'user',
      content: buildFeedbackPrompt(answers, subject)
    }]
  };

  const response = await claudeClient.createMessage(config);

  // Log cache performance
  if (response.usage.cache_read_input_tokens > 0) {
    logger.info('Cache hit!', {
      cacheTokens: response.usage.cache_read_input_tokens,
      savings: calculateCacheSavings(response.usage)
    });
  }

  return response;
}
```

**Validación de caching:**
```typescript
// Test: Ejecutar 10 análisis consecutivos con misma rúbrica
// Primera llamada: cache_creation_input_tokens > 0
// Llamadas 2-10: cache_read_input_tokens > 0
// Ahorro esperado: ~40% en costo total
```

### 3.2 Implementar Batch API para Procesamiento Nocturno

**Caso de uso**: Calificar 20-50 reportes de la semana en batch durante la noche con 50% descuento automático

**Archivo: `src/services/ai/claude/batch-processor.ts`**

**Clase: `BatchProcessor`**

**Métodos principales:**
1. `processBatch(reportIds: string[], rubric: string)` → Crea batch job
2. `checkBatchStatus(batchId: string)` → Monitorea progreso
3. `getBatchResults(batchId: string)` → Obtiene resultados completados
4. `cancelBatch(batchId: string)` → Cancela batch en progreso

**Referencia**: Ver PRD sección 4.4 para implementación completa

### 3.3 API Endpoints para Batch

**Archivo: `src/app/api/ai/batch/route.ts`**

```typescript
// POST /api/ai/batch/create
// Crear batch de análisis (múltiples reportes)
export async function POST(request: Request) {
  const { reportIds, rubric, options } = await request.json();

  const result = await batchProcessor.processBatch(reportIds, rubric, options);

  return NextResponse.json({
    success: true,
    batchId: result.batchId,
    totalReports: reportIds.length,
    estimatedCompletion: '< 1 hora',
    estimatedCost: calculateBatchCost(reportIds.length)
  });
}

// GET /api/ai/batch/[batchId]/status
// Verificar estado del batch

// GET /api/ai/batch/[batchId]/results
// Obtener resultados cuando complete
```

**Flujo de uso:**
1. Instructor selecciona 20 reportes para calificar
2. Frontend llama a `/api/ai/batch/create`
3. Backend crea batch job en Anthropic
4. Sistema monitorea progreso cada 30 segundos
5. Cuando completa, guarda todos los feedbacks en DB
6. Notifica al instructor (email o dashboard)

### 3.4 Sistema de Monitoreo de Tokens

**Archivo: `src/services/ai/monitoring/token-tracker.ts`**

**Clase: `TokenTracker`**

**Funcionalidades:**
- Rastrear tokens de entrada/salida por operación
- Calcular costos en tiempo real
- Generar estadísticas diarias/semanales/mensuales
- Cache hit rate tracking
- Alertas cuando se excede umbral de presupuesto

**Persistencia:**
```typescript
// Guardar stats en archivo JSON
/data/stats/token-stats-2025-10.json

// Estructura:
{
  "totalRequests": 150,
  "totalInputTokens": 120000,
  "totalOutputTokens": 75000,
  "totalCacheReadTokens": 80000,
  "totalCost": 0.89,
  "operationBreakdown": {
    "essay_analysis": {
      "count": 100,
      "avgCost": 0.006,
      "avgLatency": 2400
    },
    "rubric_comparison": {
      "count": 50,
      "avgCost": 0.008,
      "avgLatency": 3100
    }
  },
  "dailyStats": { ... }
}
```

**API Endpoint para stats:**
```typescript
// GET /api/ai/stats?period=month
// Retorna estadísticas de uso

Response:
{
  "period": "month",
  "totalCost": 0.89,
  "totalRequests": 150,
  "avgCostPerRequest": 0.0059,
  "cacheHitRate": "82%",
  "projectedMonthlyCost": 3.50
}
```

### 3.5 Testing de Optimizaciones

**Test 1: Validar Prompt Caching**

```typescript
// Script: test-caching.ts
async function testCaching() {
  const rubricaLarga = generateLongRubric(); // ~2000 tokens
  const reportIds = await getRandomReports(10);

  console.log('Ejecutando 10 análisis con rúbrica cacheada...\n');

  for (let i = 0; i < reportIds.length; i++) {
    const result = await analyzer.analyzeProgressReport(reportIds[i], rubricaLarga);

    console.log(`Análisis ${i+1}:`, {
      cacheRead: result.metadata.tokensUsed.cache_read_input_tokens || 0,
      cacheWrite: result.metadata.tokensUsed.cache_creation_input_tokens || 0,
      cost: result.metadata.estimatedCost.total.toFixed(6)
    });
  }
}
```

**Resultados esperados:**
- Análisis 1: `cache_creation_input_tokens: ~2000`, cost: ~$0.008
- Análisis 2-10: `cache_read_input_tokens: ~2000`, cost: ~$0.006 (25% ahorro)

**Test 2: Validar Batch API**

```typescript
// Script: test-batch.ts
async function testBatch() {
  const reportIds = await getReportsFromLastWeek(20);
  const rubric = await getRubricForSubject('Matemática');

  console.log(`Creando batch de ${reportIds.length} análisis...\n`);

  const batch = await batchProcessor.processBatch(reportIds, rubric);
  console.log('Batch ID:', batch.batchId);

  // Monitorear progreso
  while (true) {
    const status = await batchProcessor.checkBatchStatus(batch.batchId);
    console.log(`Progreso: ${status.progress.succeeded}/${reportIds.length}`);

    if (status.status === 'ended') break;
    await sleep(30000); // Esperar 30 segundos
  }

  // Obtener resultados
  const results = await batchProcessor.getBatchResults(batch.batchId);
  console.log(`\n✅ Batch completado: ${results.summary.successful}/${reportIds.length}`);
  console.log(`💰 Costo total: $${results.summary.estimatedCost.toFixed(4)}`);
}
```

### 3.6 Criterios de Éxito - Fase 3

- [ ] ✅ Primera solicitud escribe caché (`cache_creation_input_tokens > 0`)
- [ ] ✅ Solicitudes subsecuentes leen caché (`cache_read_input_tokens > 0`)
- [ ] ✅ Cache hit rate > 80% después de 20 análisis
- [ ] ✅ Reducción de costo por análisis de ~40% con caching
- [ ] ✅ Batch API crea jobs exitosamente
- [ ] ✅ Batch completa en < 1 hora para 50 reportes
- [ ] ✅ Resultados de batch se guardan correctamente en DB
- [ ] ✅ Batch cost = 50% vs. procesamiento individual
- [ ] ✅ Token tracker reporta métricas correctamente
- [ ] ✅ Endpoint `/api/ai/stats` retorna datos precisos
- [ ] ✅ Costo mensual proyectado < $10 (basado en 300 análisis/semana)

**Si todos los checks pasan**: Proceder a Fase 4

---

## 🔐 FASE 4: Producción, Seguridad y Monitoreo

**Duración**: 6-8 horas
**Objetivo**: Deployment seguro a producción con monitoreo, rate limiting y alertas

### 4.1 Rate Limiting

**Objetivo**: Prevenir abuso y controlar costos

**Archivo: `src/middleware/ai-rate-limiter.ts`**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuración de rate limits
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 requests por hora
  analytics: true,
});

export async function checkRateLimit(userId: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ai_analysis_${userId}`
  );

  return {
    allowed: success,
    limit,
    remaining,
    resetAt: new Date(reset)
  };
}
```

**Integración en endpoints:**
```typescript
// En /api/ai/analyze-report/route.ts
export async function POST(request: Request) {
  const session = await auth();

  // Check rate limit
  const rateLimitCheck = await checkRateLimit(session.user.id);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      resetAt: rateLimitCheck.resetAt
    }, { status: 429 });
  }

  // Continue with analysis...
}
```

**Configuración por rol:**
- Instructores: 50 análisis/hora
- Estudiantes: 10 análisis/hora (si tienen acceso directo)
- Admin: Sin límite

### 4.2 Data Protection y Anonimización

**Objetivo**: Cumplir con FERPA/GDPR sin enviar PII innecesaria a API externa

**Archivo: `src/middleware/data-protection.ts`**

```typescript
import crypto from 'crypto';

export function anonymizeStudentData(answers: Answer[], studentId: string) {
  // Reemplazar nombres propios con placeholders
  const anonymized = answers.map(answer => ({
    ...answer,
    answer: answer.answer
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NOMBRE]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
  }));

  // Hash del student ID para tracking sin PII
  const trackingId = crypto
    .createHash('sha256')
    .update(studentId + process.env.API_SECRET_KEY)
    .digest('hex')
    .slice(0, 16);

  return { anonymized, trackingId };
}
```

**Uso en analyzer:**
```typescript
async analyzeProgressReport(reportId: string, rubric: string) {
  const report = await getProgressReport(reportId);
  const answers = await getProgressReportAnswers(reportId);

  // Anonimizar antes de enviar a Claude
  const { anonymized, trackingId } = anonymizeStudentData(answers, report.userId);

  // Usar anonymized en lugar de answers originales
  const analysis = await this.analyzeWithClaude(anonymized, rubric);

  // Guardar con trackingId en lugar de studentId en logs
  logger.info('Analysis completed', { trackingId, reportId });

  return analysis;
}
```

### 4.3 Logging Seguro

**Principio**: NUNCA logear contenido sensible (respuestas completas, feedback)

**Configuración de Winston (ya existe en proyecto):**

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-integration' },
  transports: [
    new winston.transports.File({
      filename: 'logs/ai-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/ai-combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// En desarrollo, también log a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

**Ejemplo de logging seguro:**

```typescript
// ❌ MAL - Loguea contenido sensible
logger.info('Analysis completed', {
  studentAnswers: answers,  // ← NO!
  feedbackGenerated: feedback  // ← NO!
});

// ✅ BIEN - Solo metadata
logger.info('Analysis completed', {
  reportId,
  trackingId: hashedStudentId,
  tokensUsed: response.usage,
  latency: response.latency,
  costEstimated: cost,
  answersCount: answers.length,
  subject
});
```

### 4.4 Sistema de Alertas

**Archivo: `src/services/ai/monitoring/cost-alerts.ts`**

```typescript
import tokenTracker from './token-tracker';
import logger from '@/utils/logger';

const COST_THRESHOLDS = {
  WARNING: 10,   // $10/mes
  CRITICAL: 20,  // $20/mes
  EMERGENCY: 50  // $50/mes
};

export async function checkCostThresholds() {
  const stats = tokenTracker.getStats('month');

  if (stats.totalCost > COST_THRESHOLDS.EMERGENCY) {
    logger.error('🚨 EMERGENCY: Cost threshold exceeded', {
      currentCost: stats.totalCost.toFixed(2),
      threshold: COST_THRESHOLDS.EMERGENCY,
      action: 'DISABLE_AI_ENDPOINTS'
    });

    // Enviar notificación urgente (email, Slack, etc.)
    await sendEmergencyAlert({
      message: `AI costs exceeded $${COST_THRESHOLDS.EMERGENCY}`,
      currentCost: stats.totalCost,
      recommendations: [
        'Verificar uso anormal',
        'Revisar rate limiting',
        'Considerar deshabilitar temporalmente'
      ]
    });

    // Auto-disable endpoints (opcional, requiere feature flag)
    // await disableAIEndpoints();

  } else if (stats.totalCost > COST_THRESHOLDS.CRITICAL) {
    logger.warn('⚠️ CRITICAL: Cost approaching limit', {
      currentCost: stats.totalCost.toFixed(2),
      threshold: COST_THRESHOLDS.CRITICAL
    });

    await sendCriticalAlert({
      message: `AI costs exceeded $${COST_THRESHOLDS.CRITICAL}`,
      currentCost: stats.totalCost
    });

  } else if (stats.totalCost > COST_THRESHOLDS.WARNING) {
    logger.warn('⚠️ WARNING: Cost threshold exceeded', {
      currentCost: stats.totalCost.toFixed(2),
      threshold: COST_THRESHOLDS.WARNING
    });

    await sendWarningAlert({
      message: `AI costs exceeded $${COST_THRESHOLDS.WARNING}`,
      currentCost: stats.totalCost,
      projectedMonthlyCost: (stats.totalCost / new Date().getDate()) * 30
    });
  }
}

// Ejecutar verificación cada hora
setInterval(checkCostThresholds, 3600000);
```

**Configuración de notificaciones:**

```typescript
// Usando Resend (email) o Slack webhook
async function sendWarningAlert(data: AlertData) {
  // Email al admin
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'alerts@intellego-platform.com',
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ AI Cost Alert: $${data.currentCost.toFixed(2)}`,
      html: `
        <h2>AI Integration Cost Alert</h2>
        <p>Current monthly cost: <strong>$${data.currentCost.toFixed(2)}</strong></p>
        <p>Projected end-of-month: <strong>$${data.projectedMonthlyCost.toFixed(2)}</strong></p>
        <p>Threshold: $${COST_THRESHOLDS.WARNING}</p>
      `
    })
  });
}
```

### 4.5 Testing Automatizado

**Archivo: `tests/integration/ai/claude-integration.test.ts`**

```typescript
import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '@/app';
import { db, query } from '@/lib/db';

describe('Claude AI Integration', () => {
  let testReportId: string;
  let authToken: string;

  beforeAll(async () => {
    // Crear reporte de prueba
    testReportId = await createTestProgressReport();

    // Autenticar como instructor
    const loginResponse = await request(app)
      .post('/api/auth/callback/credentials')
      .send({ email: 'test@instructor.com', password: 'test123' });

    authToken = loginResponse.body.token;
  });

  test('POST /api/ai/analyze-report should return feedback', async () => {
    const response = await request(app)
      .post('/api/ai/analyze-report')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        progressReportId: testReportId,
        options: { format: 'structured' }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toBeDefined();
    expect(response.body.analysis.score).toBeGreaterThan(0);
    expect(response.body.metadata.tokensUsed).toBeDefined();
    expect(response.body.metadata.estimatedCost).toBeLessThan(0.02); // < 2 centavos
  });

  test('POST /api/ai/analyze-report should reject invalid reportId', async () => {
    const response = await request(app)
      .post('/api/ai/analyze-report')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        progressReportId: 'invalid-id-123'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/not found/i);
  });

  test('POST /api/ai/analyze-report should respect rate limits', async () => {
    // Ejecutar 51 requests (límite es 50/hora)
    const requests = Array(51).fill(null).map(() =>
      request(app)
        .post('/api/ai/analyze-report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progressReportId: testReportId })
    );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('GET /api/ai/stats should return usage statistics', async () => {
    const response = await request(app)
      .get('/api/ai/stats?period=month')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.stats.totalRequests).toBeGreaterThan(0);
    expect(response.body.stats.totalCost).toBeGreaterThan(0);
    expect(response.body.stats.cacheHitRate).toBeDefined();
  });
});
```

**Ejecutar tests:**
```bash
npm run test -- tests/integration/ai/
```

### 4.6 Deployment a Producción

**Pre-deployment Checklist:**

- [ ] ✅ Todos los tests pasan localmente
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Rate limiting validado
- [ ] ✅ Logging seguro implementado
- [ ] ✅ Alertas de costo configuradas
- [ ] ✅ Data protection activa
- [ ] ✅ Documentación actualizada

**Variables de entorno en Vercel:**

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
LOG_LEVEL=info
COST_ALERT_THRESHOLD=10
RATE_LIMIT_MAX_REQUESTS=50
ADMIN_EMAIL=rodrigo@intellego-platform.com
```

**Deployment steps:**

```bash
# 1. Commit cambios
git add .
git commit -m "FEAT: Claude Haiku 4.5 AI integration - Production ready"

# 2. Push a main (auto-deploy a Vercel)
git push origin main

# 3. Monitorear deployment vía Vercel MCP
# (verificar en próxima sección)

# 4. Verificar endpoints en producción
curl -X POST https://intellego-platform.vercel.app/api/ai/analyze-report \
  -H "Content-Type: application/json" \
  -d '{"progressReportId": "test-id"}'
```

**Rollback plan (si algo falla):**

```bash
# Opción 1: Revert último commit
git log --oneline -5
git revert [COMMIT_HASH]
git push

# Opción 2: Rollback en Vercel dashboard
# Vercel → Deployments → Rollback to previous

# Opción 3: Feature flag (deshabilitar AI temporalmente)
# Vercel → Environment Variables → AI_ENABLED=false
```

### 4.7 Post-Deployment Validation

**Usar Vercel MCP para verificar:**

```typescript
// 1. Verificar deployment exitoso
await vercel.getDeployment({
  idOrUrl: 'intellego-platform.vercel.app',
  teamId: process.env.VERCEL_TEAM_ID
});

// 2. Revisar build logs
await vercel.getDeploymentBuildLogs({
  idOrUrl: 'latest-deployment-id',
  teamId: process.env.VERCEL_TEAM_ID,
  limit: 100
});

// 3. Verificar que no hay errores en runtime
// (Vercel → Logs → Filter por "error")
```

**Testing en producción:**

```bash
# Health check
curl https://intellego-platform.vercel.app/api/health-check

# Test AI endpoint (con auth real)
curl -X POST https://intellego-platform.vercel.app/api/ai/analyze-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [INSTRUCTOR_TOKEN]" \
  -d '{
    "progressReportId": "[REAL_REPORT_ID]",
    "options": { "format": "structured" }
  }'

# Verificar stats
curl https://intellego-platform.vercel.app/api/ai/stats?period=today \
  -H "Authorization: Bearer [ADMIN_TOKEN]"
```

**Monitoreo primeras 24 horas:**

- [ ] Verificar cada hora: `/api/ai/stats` → totalCost < $1
- [ ] Revisar logs de errores (Vercel dashboard)
- [ ] Confirmar cache hit rate > 70%
- [ ] Validar que no hay rate limit abuse
- [ ] Verificar latencia p95 < 5 segundos
- [ ] Confirmar feedback de usuarios positivo

### 4.8 Documentación Final

**Actualizar archivos:**

1. **`/AI_integrations_haiku/API-DOCUMENTATION.md`**
   - Documentar todos los endpoints
   - Ejemplos de request/response
   - Códigos de error
   - Rate limits

2. **`/documentation/PROJECT-HISTORY.md`**
   - Agregar sección de AI integration
   - Documentar decisiones técnicas
   - Lecciones aprendidas

3. **`/README.md`** (raíz del proyecto)
   - Actualizar features list
   - Agregar sección de AI capabilities

4. **`/AI_integrations_haiku/MAINTENANCE.md`**
   - Procedimientos de monitoreo
   - Troubleshooting común
   - Escalation procedures

### 4.9 Criterios de Éxito - Fase 4

- [ ] ✅ Rate limiting funciona correctamente (429 después de límite)
- [ ] ✅ Data protection anonimiza PII
- [ ] ✅ Logs NO contienen información sensible
- [ ] ✅ Alertas de costo enviadas cuando se excede umbral
- [ ] ✅ Tests automatizados pasan (>95% coverage en endpoints AI)
- [ ] ✅ Deployment a producción exitoso
- [ ] ✅ No errores en primeras 24 horas de producción
- [ ] ✅ Costo real < $10 en primera semana
- [ ] ✅ Latencia promedio < 3 segundos
- [ ] ✅ Cache hit rate > 80%
- [ ] ✅ Satisfacción de usuarios > 4/5
- [ ] ✅ Documentación completa y actualizada

**Si todos los checks pasan**: 🎉 **Integración completa y exitosa**

---

## 📊 Métricas de Éxito del Proyecto

### KPIs Técnicos

| Métrica | Target | Medición |
|---------|--------|----------|
| **Uptime** | >99.5% | Vercel analytics |
| **Latencia p95** | <5 segundos | Logging de requests |
| **Tasa de error** | <1% | Error logs |
| **Costo mensual** | <$10 USD | Token tracker |
| **Cache hit rate** | >80% | Token tracker |
| **Cost per analysis** | <$0.01 | Token tracker |

### KPIs de Negocio

| Métrica | Target | Medición |
|---------|--------|----------|
| **Tiempo de feedback** | <5 minutos | Time desde submit hasta feedback |
| **Satisfacción instructor** | >4/5 | Encuestas post-uso |
| **Concordancia con humano** | >85% | Comparación manual vs. AI |
| **Adopción por instructores** | >50% | % de instructores usando AI |
| **Reportes analizados/mes** | >200 | DB queries |

### Dashboard de Monitoreo

**Endpoint: `/api/ai/dashboard`**

```json
{
  "today": {
    "requests": 45,
    "cost": 0.27,
    "avgLatency": 2400,
    "errors": 0
  },
  "week": {
    "requests": 280,
    "cost": 1.65,
    "cacheHitRate": "83%",
    "topOperations": [
      { "type": "essay_analysis", "count": 200 },
      { "type": "skills_evaluation", "count": 80 }
    ]
  },
  "month": {
    "totalCost": 6.89,
    "projectedCost": 9.50,
    "totalRequests": 1150,
    "avgCostPerRequest": 0.006,
    "efficiency": {
      "cacheHitRate": "82%",
      "batchUsage": "35%"
    }
  }
}
```

---

## 🚨 Troubleshooting y Rollback

### Problemas Comunes

#### Error: Invalid API Key
```
Solución:
1. Verificar ANTHROPIC_API_KEY en .env
2. Regenerar key en console.anthropic.com
3. Actualizar en Vercel Environment Variables
4. Redeploy
```

#### Error: Rate Limit Exceeded
```
Solución:
1. Verificar tier actual en Anthropic Console
2. Revisar logs para uso anormal
3. Ajustar rate limiting en código si necesario
4. Considerar upgrade de tier si es uso legítimo
```

#### Caching no funciona
```
Diagnóstico:
1. Verificar cache_control en system prompt
2. Contenido debe ser >1024 tokens
3. TTL mínimo 5 minutos - esperar entre pruebas
4. Revisar logs: cache_read_input_tokens > 0

Solución:
- Aumentar tamaño de rúbrica si es muy corta
- Verificar que el content es idéntico entre llamadas
- Limpiar y reintentar después de 5 minutos
```

#### Costos más altos de lo esperado
```
Diagnóstico:
1. Revisar /api/ai/stats
2. Verificar cache hit rate (objetivo: >80%)
3. Analizar operationBreakdown para operaciones costosas
4. Revisar max_tokens - reducir si es posible

Solución:
- Activar batch API para más solicitudes
- Optimizar prompts (eliminar verbosidad)
- Reducir max_tokens conservadoramente
- Implementar stop_sequences más agresivos
```

### Procedimiento de Rollback

**Paso 1: Identificar el problema**
```bash
# Revisar logs recientes
vercel logs --since 1h

# Verificar métricas
curl https://intellego-platform.vercel.app/api/ai/stats
```

**Paso 2: Decisión de rollback**

Si se cumple alguno:
- Tasa de error > 5%
- Latencia > 10 segundos
- Costo inesperado > $5/día
- Bug crítico afectando usuarios

→ **Proceder con rollback**

**Paso 3: Ejecutar rollback**

```bash
# Opción A: Revert de código
git log --oneline -10
git revert [COMMIT_SHA]
git push origin main

# Opción B: Vercel dashboard
# 1. Ir a Vercel → Deployments
# 2. Encontrar deployment anterior estable
# 3. Click "Promote to Production"

# Opción C: Feature flag (más rápido)
# Vercel → Settings → Environment Variables
# AI_ENABLED=false → Save → Redeploy
```

**Paso 4: Comunicación**
```
1. Notificar a instructores vía email
2. Actualizar status page si existe
3. Documentar el incidente
4. Planear fix y re-deployment
```

---

## 📅 Post-Implementation

### Semana 1: Monitoreo intensivo
- [ ] Revisar métricas diariamente
- [ ] Recopilar feedback de usuarios
- [ ] Ajustar prompts según resultados
- [ ] Optimizar max_tokens basado en uso real

### Semana 2-4: Optimización
- [ ] Analizar patrones de uso
- [ ] Implementar mejoras identificadas
- [ ] Expandir a más materias/sedes
- [ ] Documentar lecciones aprendidas

### Mes 2+: Expansión
- [ ] Nuevas features (comparación histórica, etc.)
- [ ] Integración con dashboard de instructores
- [ ] Notificaciones automáticas
- [ ] Análisis predictivo

---

## 🔗 Referencias

- **PRD Completo**: `/AI_integrations_haiku/prd-claude-haiku-integration.md`
- **Guía de Integración**: `/AI_integrations_haiku/haiku-integration-guide.md`
- **Anthropic Docs**: https://docs.anthropic.com
- **Claude SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **Console**: https://console.anthropic.com
- **Pricing**: https://anthropic.com/pricing

---

**Última actualización**: Octubre 20, 2025
**Mantenido por**: Rodrigo Di Bernardo
**Revisión**: Pendiente de implementación
