# Roadmap: Sistema de Automatización de Feedback AI

**Fecha**: 2025-10-20
**Versión**: 1.0
**Estado**: Planificación
**Owner**: Equipo Intellego Platform

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Objetivos de Negocio](#objetivos-de-negocio)
3. [Estado Actual](#estado-actual)
4. [Arquitectura del Sistema Dual](#arquitectura-del-sistema-dual)
5. [Fases de Implementación](#fases-de-implementación)
6. [Elementos Técnicos Necesarios](#elementos-técnicos-necesarios)
7. [Flujos de Trabajo Detallados](#flujos-de-trabajo-detallados)
8. [Consideraciones de Costos](#consideraciones-de-costos)
9. [Manejo de Errores y Resiliencia](#manejo-de-errores-y-resiliencia)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Plan](#deployment-plan)
12. [Monitoreo y Alertas](#monitoreo-y-alertas)
13. [Timeline y Estimaciones](#timeline-y-estimaciones)

---

## 🎯 Visión General

### Problema Actual
- **299 reportes semanales (18.6%)** sin feedback en producción
- Instructores deben procesar reportes uno por uno manualmente
- No existe sistema automático de generación de feedback
- Gap entre entrega de reporte y feedback recibido

### Solución Propuesta
Implementar un **sistema dual de automatización**:

1. **Sistema Automático Nocturno** (Prioridad 1)
   - Cron job que se ejecuta cada noche (ej: 2 AM ART)
   - Procesa todos los reportes pendientes mientras duermes
   - Genera feedback usando rúbricas oficiales (Fase 1-4)
   - Envía notificación de resumen al finalizar

2. **Sistema Manual de Backup** (Prioridad 2)
   - UI en dashboard de instructor
   - Botón "Generar Feedback AI" para procesamiento inmediato
   - Usado cuando el cron falla o para procesamiento urgente
   - Muestra progreso en tiempo real

### Beneficios Esperados
- ✅ **Reducción de 95% en trabajo manual** del instructor
- ✅ **Feedback en menos de 24 horas** desde envío del reporte
- ✅ **Consistencia en evaluación** usando rúbricas oficiales
- ✅ **Escalabilidad**: Puede manejar 200+ reportes/semana
- ✅ **Backup confiable**: Manual si automático falla

---

## 🎯 Objetivos de Negocio

### Objetivos Primarios
1. **Automatizar 100% del proceso de generación de feedback**
   - Métrica: 0 reportes > 48h sin feedback
   - Target: <5% tasa de error

2. **Reducir carga de trabajo del instructor**
   - De: 47 llamadas manuales a API (1-2 horas)
   - A: 1 revisión de notificación diaria (5 minutos)

3. **Mejorar experiencia del estudiante**
   - Feedback consistente y de calidad
   - Entrega predecible (máximo 24h después de enviar)

### Objetivos Secundarios
1. **Control de costos AI**
   - Presupuesto: <$30/mes para 600 reportes
   - Costo target: $0.005/reporte con caching

2. **Observabilidad completa**
   - Dashboard de métricas (reportes procesados, costos, errores)
   - Alertas automáticas si falla el cron

3. **Resiliencia operacional**
   - Sistema manual de backup siempre disponible
   - Auto-retry en errores transitorios

---

## 📊 Estado Actual

### ✅ Componentes Construidos (Fase 1-3 completadas)

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| **Claude Haiku 4.5 Client** | ✅ Funcional | `src/services/ai/claude/client.ts` |
| **Educational Analyzer** | ✅ Funcional | `src/services/ai/claude/analyzer.ts` |
| **Rúbricas Oficiales (Fase 1-4)** | ✅ Implementadas | `src/services/ai/claude/prompts/rubricas.ts` |
| **API Endpoint `/api/ai/analyze-report`** | ✅ Funcional | `src/app/api/ai/analyze-report/route.ts` |
| **Prompt Caching** | ✅ Funcional | Ahorro 70-80% en costos |
| **DB Operations** | ✅ Funcional | `getProgressReportAnswers()`, `createAIFeedback()` |

**Testing realizado**:
- ✅ Test end-to-end con datos reales (`test-rubricas.ts`)
- ✅ Validación de rúbricas y cálculos
- ✅ Cost: $0.003-0.004 por análisis (con caching)

### ❌ Componentes Faltantes (A construir en Fase 4-6)

| Componente | Necesario Para | Prioridad |
|------------|----------------|-----------|
| **Batch Processing API** | Procesar múltiples reportes | 🔴 ALTA |
| **Query Reportes Pendientes** | Identificar reportes sin feedback | 🔴 ALTA |
| **Cron Job Nocturno** | Automatización diaria | 🔴 ALTA |
| **Rate Limiting** | Evitar sobrecarga API Claude | 🟡 MEDIA |
| **UI Batch Manual** | Backup manual | 🟡 MEDIA |
| **Progress Tracking** | Mostrar progreso en UI | 🟢 BAJA |
| **Notificaciones Email** | Alertas de éxito/fallo | 🟢 BAJA |

---

## 🏗️ Arquitectura del Sistema Dual

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                  SISTEMA DUAL DE FEEDBACK                │
└─────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                 CAMINO 1: AUTOMÁTICO NOCTURNO                 │
└───────────────────────────────────────────────────────────────┘

    2:00 AM ART (Vercel Cron)
           ↓
   [/api/cron/auto-feedback]
           ↓
   getPendingReportsForFeedback()
           ↓
    ┌─────────────────┐
    │ Queue Manager   │
    │ - Rate limiting │
    │ - 5 concurrent  │
    │ - Retry logic   │
    └─────────────────┘
           ↓
    ┌──────────────────────────────────┐
    │  Batch Processor                 │
    │  for each report:                │
    │    1. Get answers                │
    │    2. Detect fase                │
    │    3. Call analyzer              │
    │    4. Save feedback              │
    │    5. Log result                 │
    └──────────────────────────────────┘
           ↓
    ┌─────────────────┐
    │ Results Logger  │
    │ - Success count │
    │ - Failed list   │
    │ - Total cost    │
    └─────────────────┘
           ↓
   Send notification email
   to instructor@intellego.com


┌───────────────────────────────────────────────────────────────┐
│                  CAMINO 2: MANUAL BACKUP                      │
└───────────────────────────────────────────────────────────────┘

    Instructor Dashboard
           ↓
   "47 reportes pendientes"
           ↓
   [Generar Feedback AI] Button
           ↓
   POST /api/instructor/feedback/batch-generate
           ↓
    ┌─────────────────┐
    │ Queue Manager   │
    │ (mismo que cron)│
    └─────────────────┘
           ↓
   Real-time progress updates
   via polling/WebSocket
           ↓
   "Procesando 15/47... 32%"
           ↓
   Resultados mostrados en UI:
   "✅ 45 exitosos, ❌ 2 fallidos"
```

### Componentes Clave

#### 1. Queue Manager (Shared Component)
**Responsabilidad**: Procesar reportes de forma controlada
```typescript
class FeedbackQueueManager {
  async processReports(reportIds: string[], options: {
    maxConcurrent: number;
    retryAttempts: number;
    onProgress?: (current: number, total: number) => void;
  }): Promise<BatchResult>
}
```

#### 2. Cron Job Controller
**Responsabilidad**: Orquestar procesamiento nocturno
```typescript
// /api/cron/auto-feedback/route.ts
export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  // 2. Get pending reports
  // 3. Process with queue manager
  // 4. Send email notification
  // 5. Log metrics
}
```

#### 3. Manual Batch API
**Responsabilidad**: Procesar bajo demanda del instructor
```typescript
// /api/instructor/feedback/batch-generate/route.ts
export async function POST(request: NextRequest) {
  // 1. Authenticate instructor
  // 2. Get pending reports (optional: filter by subject/week)
  // 3. Process with queue manager
  // 4. Return real-time progress
}
```

#### 4. Database Queries
**Responsabilidad**: Identificar reportes pendientes
```typescript
// src/lib/db-operations.ts

// Reportes sin feedback
async function getPendingReportsForFeedback(filters?: {
  subject?: string;
  weekStart?: string;
  limit?: number;
}): Promise<PendingReport[]>

// Marcar reporte como procesado
async function markReportAsProcessed(reportId: string): Promise<void>
```

---

## 📅 Fases de Implementación

### **FASE 4: Batch Processing Core** (Prioridad ALTA)
**Tiempo estimado**: 6-8 horas

#### Objetivos
- Construir sistema de procesamiento en batch reutilizable
- Implementar rate limiting y manejo de errores
- Crear API para batch processing

#### Entregables
1. ✅ `FeedbackQueueManager` class
   - Rate limiting (5 concurrent requests)
   - Retry logic (3 intentos con backoff exponencial)
   - Progress tracking
   - Error aggregation

2. ✅ Database query `getPendingReportsForFeedback()`
   - Encuentra reportes sin feedback
   - Soporta filtros (subject, weekStart, limit)
   - Optimizado con índices

3. ✅ API route `/api/instructor/feedback/batch-generate`
   - Autenticación INSTRUCTOR
   - Validación de parámetros
   - Llamada a queue manager
   - Retorno de resultados

#### Criterios de Aceptación
- ✅ Procesa 50 reportes en <5 minutos
- ✅ Tasa de error <5%
- ✅ Costo por reporte <$0.015
- ✅ Logs completos de cada procesamiento

---

### **FASE 5: Cron Job Automático** (Prioridad ALTA)
**Tiempo estimado**: 3-4 horas

#### Objetivos
- Implementar cron job nocturno
- Configurar notificaciones de resultado
- Logging y monitoring

#### Entregables
1. ✅ API route `/api/cron/auto-feedback`
   - Verificación de secret key (seguridad)
   - Llamada a queue manager
   - Logging de métricas
   - Email notification

2. ✅ Configuración en `vercel.json`
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/auto-feedback",
         "schedule": "0 2 * * *"  // 2 AM ART diariamente
       }
     ]
   }
   ```

3. ✅ Email template para notificación
   - Resumen de reportes procesados
   - Lista de errores (si los hay)
   - Métricas de costo
   - Link a dashboard

#### Criterios de Aceptación
- ✅ Cron se ejecuta diariamente a las 2 AM
- ✅ Procesa todos los reportes pendientes
- ✅ Envía email de resumen
- ✅ No bloquea otros procesos
- ✅ Timeout adecuado (max 10 min para Vercel Hobby)

---

### **FASE 6: UI Manual + Monitoreo** (Prioridad MEDIA)
**Tiempo estimado**: 4-6 horas

#### Objetivos
- Crear UI para batch manual
- Dashboard de métricas
- Sistema de alertas

#### Entregables
1. ✅ Componente `BatchFeedbackGenerator.tsx`
   - Botón "Generar Feedback AI"
   - Contador de reportes pendientes
   - Progress bar durante procesamiento
   - Resultados finales (exitosos/fallidos)

2. ✅ Dashboard de métricas (opcional)
   - Total reportes procesados hoy/semana
   - Costo acumulado
   - Tasa de éxito
   - Últimas ejecuciones del cron

3. ✅ Sistema de alertas
   - Email si cron falla
   - Alert si costo excede presupuesto
   - Notificación si tasa de error >10%

#### Criterios de Aceptación
- ✅ UI intuitiva y clara
- ✅ Progress updates en tiempo real
- ✅ Botón deshabilitado durante procesamiento
- ✅ Mensajes de error claros

---

## 🛠️ Elementos Técnicos Necesarios

### 1. FeedbackQueueManager (Core)
**Archivo**: `src/services/ai/feedback-queue-manager.ts`

```typescript
import { type ProgressReport } from '@/types';
import analyzer from '@/services/ai/claude/analyzer';
import {
  getProgressReportAnswers,
  createAIFeedback,
  getProgressReportWithStudent
} from '@/lib/db-operations';

export type BatchResult = {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ reportId: string; error: string }>;
  totalCost: number;
  latencyMs: number;
};

export type ProcessOptions = {
  maxConcurrent?: number;      // Default: 5
  retryAttempts?: number;       // Default: 3
  onProgress?: (current: number, total: number) => void;
};

export class FeedbackQueueManager {
  private maxConcurrent: number = 5;
  private retryAttempts: number = 3;

  /**
   * Procesa múltiples reportes en batch con rate limiting
   */
  async processReports(
    reportIds: string[],
    options: ProcessOptions = {}
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const { maxConcurrent = 5, retryAttempts = 3, onProgress } = options;

    this.maxConcurrent = maxConcurrent;
    this.retryAttempts = retryAttempts;

    const result: BatchResult = {
      total: reportIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      totalCost: 0,
      latencyMs: 0
    };

    // Process in chunks of maxConcurrent
    for (let i = 0; i < reportIds.length; i += this.maxConcurrent) {
      const chunk = reportIds.slice(i, i + this.maxConcurrent);
      const promises = chunk.map(reportId =>
        this.processReport(reportId, retryAttempts)
      );

      const chunkResults = await Promise.allSettled(promises);

      chunkResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value.success) {
          result.successful++;
          result.totalCost += res.value.cost;
        } else {
          result.failed++;
          result.errors.push({
            reportId: chunk[idx],
            error: res.status === 'rejected'
              ? res.reason.message
              : res.value.error
          });
        }

        // Report progress
        const current = i + idx + 1;
        onProgress?.(current, reportIds.length);
      });

      // Rate limiting: wait 1s between chunks
      if (i + this.maxConcurrent < reportIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    result.latencyMs = Date.now() - startTime;
    return result;
  }

  /**
   * Procesa un reporte individual con reintentos
   */
  private async processReport(
    reportId: string,
    retriesLeft: number
  ): Promise<{ success: boolean; cost: number; error?: string }> {
    try {
      // 1. Get report details
      const report = await getProgressReportWithStudent(reportId);
      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      // 2. Get answers
      const answers = await getProgressReportAnswers(reportId);
      if (answers.length === 0) {
        throw new Error(`No answers found for report ${reportId}`);
      }

      // 3. Detect fase (TODO: implement automatic detection)
      // Por ahora usamos Fase 2 como default
      const fase = 2 as 1 | 2 | 3 | 4;

      // 4. Analyze with Claude
      const analysisResult = await analyzer.analyzeAnswers(
        answers,
        report.subject,
        fase,
        'structured'
      );

      // 5. Save feedback to DB
      await createAIFeedback({
        studentId: report.studentId,
        progressReportId: reportId,
        weekStart: report.weekStart,
        subject: report.subject,
        score: analysisResult.score,
        generalComments: analysisResult.generalComments,
        strengths: analysisResult.strengths,
        improvements: analysisResult.improvements,
        aiAnalysis: analysisResult.rawAnalysis,
        skillsMetrics: analysisResult.skillsMetrics,
        createdBy: 'system' // Cron job
      });

      // Estimate cost (assuming ~$0.005 per analysis)
      const estimatedCost = 0.005;

      console.log(`✅ Report ${reportId} processed successfully`);
      return { success: true, cost: estimatedCost };

    } catch (error: any) {
      console.error(`❌ Error processing report ${reportId}:`, error.message);

      // Retry logic
      if (retriesLeft > 0) {
        console.log(`⏳ Retrying report ${reportId}... (${retriesLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        return this.processReport(reportId, retriesLeft - 1);
      }

      return { success: false, cost: 0, error: error.message };
    }
  }
}

// Export singleton
export default new FeedbackQueueManager();
```

---

### 2. Database Query: getPendingReportsForFeedback()
**Archivo**: `src/lib/db-operations.ts` (agregar función)

```typescript
import { tursoClient } from '@/lib/turso';

export type PendingReport = {
  id: string;
  userId: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
};

/**
 * Obtiene reportes semanales que no tienen feedback generado
 */
export async function getPendingReportsForFeedback(filters?: {
  subject?: string;
  weekStart?: string;
  limit?: number;
}): Promise<PendingReport[]> {
  try {
    let query = `
      SELECT
        pr.id,
        pr.userId,
        pr.subject,
        pr.weekStart,
        pr.weekEnd,
        pr.submittedAt
      FROM ProgressReport pr
      WHERE NOT EXISTS (
        SELECT 1
        FROM Feedback f
        WHERE f.progressReportId = pr.id
      )
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.subject) {
      conditions.push('pr.subject = ?');
      params.push(filters.subject);
    }

    if (filters?.weekStart) {
      conditions.push('pr.weekStart = ?');
      params.push(filters.weekStart);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY pr.submittedAt ASC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const result = await tursoClient.execute({
      sql: query,
      args: params
    });

    return result.rows.map(row => ({
      id: row.id as string,
      userId: row.userId as string,
      subject: row.subject as string,
      weekStart: row.weekStart as string,
      weekEnd: row.weekEnd as string,
      submittedAt: row.submittedAt as string
    }));

  } catch (error: any) {
    console.error('Error getting pending reports:', error);
    throw new Error(`Failed to get pending reports: ${error.message}`);
  }
}

/**
 * Cuenta reportes pendientes por materia
 */
export async function countPendingReportsBySubject(): Promise<{
  Física: number;
  Química: number;
  total: number;
}> {
  try {
    const query = `
      SELECT
        pr.subject,
        COUNT(*) as count
      FROM ProgressReport pr
      WHERE NOT EXISTS (
        SELECT 1
        FROM Feedback f
        WHERE f.progressReportId = pr.id
      )
      GROUP BY pr.subject
    `;

    const result = await tursoClient.execute(query);

    const counts = {
      Física: 0,
      Química: 0,
      total: 0
    };

    result.rows.forEach(row => {
      const subject = row.subject as 'Física' | 'Química';
      const count = parseInt(row.count as string);
      counts[subject] = count;
      counts.total += count;
    });

    return counts;

  } catch (error: any) {
    console.error('Error counting pending reports:', error);
    throw new Error(`Failed to count pending reports: ${error.message}`);
  }
}
```

---

### 3. Cron Job API Route
**Archivo**: `src/app/api/cron/auto-feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import queueManager from '@/services/ai/feedback-queue-manager';
import { getPendingReportsForFeedback } from '@/lib/db-operations';
import { sendBatchResultEmail } from '@/lib/email-notifications';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes (Vercel limit)

/**
 * GET /api/cron/auto-feedback
 *
 * Cron job que se ejecuta automáticamente cada noche
 * para generar feedback de todos los reportes pendientes
 *
 * Configurado en vercel.json:
 * "crons": [{ "path": "/api/cron/auto-feedback", "schedule": "0 2 * * *" }]
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('⚠️ Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 Auto-feedback cron job started');

    // 2. Get all pending reports
    const pendingReports = await getPendingReportsForFeedback();

    if (pendingReports.length === 0) {
      console.log('✅ No pending reports to process');
      return NextResponse.json({
        success: true,
        message: 'No pending reports',
        processed: 0
      });
    }

    console.log(`📊 Found ${pendingReports.length} pending reports`);

    // 3. Process reports with queue manager
    const result = await queueManager.processReports(
      pendingReports.map(r => r.id),
      {
        maxConcurrent: 5,
        retryAttempts: 3,
        onProgress: (current, total) => {
          console.log(`⏳ Processing ${current}/${total}...`);
        }
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ Auto-feedback cron job completed', {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      totalCost: `$${result.totalCost.toFixed(4)}`,
      totalTime: `${totalTime}ms`
    });

    // 4. Send email notification
    await sendBatchResultEmail({
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors,
      totalCost: result.totalCost,
      latencyMs: result.latencyMs,
      triggeredBy: 'cron'
    });

    // 5. Return results
    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        failedReports: result.errors.map(e => e.reportId),
        totalCost: result.totalCost,
        totalTimeMs: totalTime
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ Error in auto-feedback cron:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    // Send error notification
    await sendBatchResultEmail({
      total: 0,
      successful: 0,
      failed: 0,
      errors: [{ reportId: 'N/A', error: error.message }],
      totalCost: 0,
      latencyMs: totalTime,
      triggeredBy: 'cron',
      criticalError: true
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
```

---

### 4. Manual Batch API Route
**Archivo**: `src/app/api/instructor/feedback/batch-generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logDataAccess, logUnauthorizedAccess, logRoleViolation } from '@/lib/security-logger';
import queueManager from '@/services/ai/feedback-queue-manager';
import { getPendingReportsForFeedback } from '@/lib/db-operations';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes

/**
 * POST /api/instructor/feedback/batch-generate
 *
 * Genera feedback AI para múltiples reportes de forma manual
 * Usado como backup cuando el cron falla o para procesamiento urgente
 *
 * Request Body:
 * {
 *   "filters": {
 *     "subject"?: "Física" | "Química",
 *     "weekStart"?: "2025-10-14",
 *     "limit"?: 50
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess('/api/instructor/feedback/batch-generate');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check instructor role
    if (session.user.role !== 'INSTRUCTOR') {
      logRoleViolation(
        'INSTRUCTOR',
        session.user.role || 'unknown',
        '/api/instructor/feedback/batch-generate',
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: 'Forbidden. Instructor access required.' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    let body: {
      filters?: {
        subject?: 'Física' | 'Química';
        weekStart?: string;
        limit?: number;
      };
    } = {};

    try {
      body = await request.json();
    } catch {
      // Empty body is OK
    }

    // 4. Log access
    logDataAccess(
      'batch-feedback-generate',
      '/api/instructor/feedback/batch-generate',
      session.user.id,
      session.user.email || 'unknown',
      session.user.role || 'unknown',
      { filters: body.filters }
    );

    console.log('🤖 Manual batch feedback generation requested', {
      instructor: session.user.email,
      filters: body.filters
    });

    // 5. Get pending reports
    const pendingReports = await getPendingReportsForFeedback(body.filters);

    if (pendingReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reports to process',
        result: {
          total: 0,
          successful: 0,
          failed: 0
        }
      });
    }

    console.log(`📊 Found ${pendingReports.length} pending reports to process`);

    // 6. Process reports with queue manager
    const result = await queueManager.processReports(
      pendingReports.map(r => r.id),
      {
        maxConcurrent: 5,
        retryAttempts: 3,
        onProgress: (current, total) => {
          console.log(`⏳ Processing ${current}/${total}...`);
        }
      }
    );

    const totalTime = Date.now() - startTime;

    console.log('✅ Batch feedback generation completed', {
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      totalCost: `$${result.totalCost.toFixed(4)}`,
      totalTime: `${totalTime}ms`,
      instructor: session.user.email
    });

    // 7. Return results
    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        failedReports: result.errors.map(e => ({
          reportId: e.reportId,
          error: e.error
        })),
        totalCost: result.totalCost,
        totalTimeMs: totalTime
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;

    console.error('❌ Error in batch feedback generation:', {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instructor/feedback/batch-generate
 *
 * Obtiene información sobre reportes pendientes sin generar feedback
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Get pending reports count
    const { countPendingReportsBySubject } = await import('@/lib/db-operations');
    const counts = await countPendingReportsBySubject();

    // 3. Return info
    return NextResponse.json({
      pendingReports: counts,
      endpoint: '/api/instructor/feedback/batch-generate',
      method: 'POST',
      description: 'Generate AI feedback for pending reports'
    });

  } catch (error: any) {
    console.error('Error getting pending reports info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### 5. Email Notification Function
**Archivo**: `src/lib/email-notifications.ts` (crear nuevo)

```typescript
/**
 * Envía notificación de resultados de batch processing
 * (Implementación simplificada - puede usar Resend, SendGrid, etc.)
 */

type BatchResultEmailData = {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ reportId: string; error: string }>;
  totalCost: number;
  latencyMs: number;
  triggeredBy: 'cron' | 'manual';
  criticalError?: boolean;
};

export async function sendBatchResultEmail(data: BatchResultEmailData): Promise<void> {
  try {
    // TODO: Implementar con servicio de email real (Resend, SendGrid, etc.)

    const subject = data.criticalError
      ? '🚨 ERROR en Auto-Feedback AI'
      : `✅ Auto-Feedback AI: ${data.successful}/${data.total} exitosos`;

    const body = `
Reporte de Batch Processing de Feedback AI
===========================================

Triggered by: ${data.triggeredBy === 'cron' ? 'Cron Job Nocturno' : 'Manual'}
Fecha: ${new Date().toLocaleString('es-AR')}

RESULTADOS:
-----------
Total reportes: ${data.total}
✅ Exitosos: ${data.successful}
❌ Fallidos: ${data.failed}

MÉTRICAS:
---------
Costo total: $${data.totalCost.toFixed(4)}
Tiempo total: ${(data.latencyMs / 1000).toFixed(1)}s
Costo promedio: $${(data.totalCost / data.total).toFixed(6)}/reporte

${data.failed > 0 ? `
ERRORES:
--------
${data.errors.map(e => `- ${e.reportId}: ${e.error}`).join('\n')}
` : ''}

${data.criticalError ? `
⚠️ ERROR CRÍTICO:
----------------
El sistema de auto-feedback falló completamente.
Por favor revisa los logs inmediatamente.
` : ''}

---
Intellego Platform - AI Feedback System
    `.trim();

    console.log('📧 Email notification (simulated):', { subject, body });

    // Cuando se implemente con servicio real:
    // await emailService.send({
    //   to: 'instructor@intellego.com',
    //   subject,
    //   text: body
    // });

  } catch (error: any) {
    console.error('❌ Failed to send email notification:', error.message);
    // No throw - email failures shouldn't break the batch process
  }
}
```

---

### 6. UI Component: BatchFeedbackGenerator
**Archivo**: `src/components/instructor/BatchFeedbackGenerator.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type BatchResult = {
  total: number;
  successful: number;
  failed: number;
  failedReports: Array<{ reportId: string; error: string }>;
  totalCost: number;
  totalTimeMs: number;
};

export function BatchFeedbackGenerator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Fetch pending reports count on mount
  useState(() => {
    fetchPendingCount();
  });

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/instructor/feedback/batch-generate');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pendingReports.total);
      }
    } catch (err) {
      console.error('Failed to fetch pending count:', err);
    }
  };

  const handleGenerateBatch = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/instructor/feedback/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate feedback');
      }

      const data = await response.json();
      setResult(data.result);

      // Refresh pending count
      await fetchPendingCount();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generación de Feedback AI - Batch</CardTitle>
        <CardDescription>
          Genera feedback automático para todos los reportes semanales pendientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Reports Counter */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Reportes pendientes</p>
            <p className="text-2xl font-bold">
              {pendingCount !== null ? pendingCount : '...'}
            </p>
          </div>
          <Button
            onClick={handleGenerateBatch}
            disabled={isProcessing || pendingCount === 0}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Generar Feedback AI'
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Procesamiento completado</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    {result.total}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Exitosos:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {result.successful}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fallidos:</span>{' '}
                    <span className="text-red-600 font-semibold">
                      {result.failed}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Costo:</span>{' '}
                    ${result.totalCost.toFixed(4)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tiempo:</span>{' '}
                    {(result.totalTimeMs / 1000).toFixed(1)}s
                  </div>
                </div>

                {result.failed > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Reportes fallidos:</p>
                    <ul className="text-xs space-y-1">
                      {result.failedReports.map(fr => (
                        <li key={fr.reportId} className="text-red-600">
                          {fr.reportId}: {fr.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>ℹ️ El procesamiento puede tardar varios minutos</p>
          <p>💰 Costo estimado: ~$0.005 por reporte</p>
          <p>🤖 Usa rúbricas oficiales según fase del reporte</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 7. Vercel Configuration
**Archivo**: `vercel.json` (modificar)

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reminders",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/auto-feedback",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Variables de entorno** (`.env` y Vercel Dashboard):
```bash
# Existing
ANTHROPIC_API_KEY=sk-ant-...
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# NEW for cron security
CRON_SECRET=your-super-secret-cron-key-here

# NEW for email notifications (optional)
RESEND_API_KEY=re_...
ADMIN_EMAIL=instructor@intellego.com
```

---

## 📊 Flujos de Trabajo Detallados

### Flujo 1: Cron Job Nocturno (Automático)

```
┌────────────────────────────────────────────────────────────────┐
│           FLUJO AUTOMÁTICO - CRON JOB NOCTURNO                 │
└────────────────────────────────────────────────────────────────┘

  TRIGGER: Vercel Cron (2:00 AM ART)
     ↓
  [Vercel Scheduler]
     ↓
  GET /api/cron/auto-feedback
     ↓
  ┌─────────────────────────────────────────────┐
  │ 1. Verificar CRON_SECRET                    │
  │    - Si falla → Return 401 Unauthorized     │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ 2. getPendingReportsForFeedback()           │
  │    Query: SELECT reportes sin feedback      │
  │    Resultado: [id1, id2, ..., idN]          │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ 3. Si NO hay reportes pendientes:           │
  │    - Log: "No pending reports"              │
  │    - Return 200 OK                          │
  │    - FIN ✅                                  │
  └─────────────────────────────────────────────┘
     ↓ (Si HAY reportes)
  ┌─────────────────────────────────────────────┐
  │ 4. queueManager.processReports()            │
  │    - maxConcurrent: 5                       │
  │    - retryAttempts: 3                       │
  │    - onProgress: log cada 5 reportes        │
  └─────────────────────────────────────────────┘
     ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 5. Para cada reporte (chunks de 5):                      │
  │    ┌────────────────────────────────────────────┐        │
  │    │ a. getProgressReportWithStudent()          │        │
  │    │ b. getProgressReportAnswers()              │        │
  │    │ c. Detect fase (por ahora: default 2)      │        │
  │    │ d. analyzer.analyzeAnswers()               │        │
  │    │    - Usa rúbrica según fase                │        │
  │    │    - Genera feedback estructurado          │        │
  │    │    - Calcula score + skills metrics        │        │
  │    │ e. createAIFeedback()                      │        │
  │    │    - Guarda en DB                          │        │
  │    │    - progressReportId vinculado            │        │
  │    └────────────────────────────────────────────┘        │
  │    ↓                                                      │
  │    Si falla → Retry (max 3 veces)                        │
  │    Si falla 3 veces → Agregar a errors[]                 │
  │    ↓                                                      │
  │    Wait 1s entre chunks (rate limiting)                  │
  └──────────────────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ 6. Resultados agregados:                    │
  │    - total: N                               │
  │    - successful: M                          │
  │    - failed: N - M                          │
  │    - errors: [{ reportId, error }, ...]     │
  │    - totalCost: $X.XX                       │
  │    - latencyMs: T ms                        │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ 7. sendBatchResultEmail()                   │
  │    Envía email a instructor con resumen:    │
  │    - "47 reportes procesados"               │
  │    - "45 exitosos, 2 fallidos"              │
  │    - "Costo: $0.23"                         │
  │    - Lista de errores (si los hay)          │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ 8. Log final + Return 200 OK                │
  │    console.log("Auto-feedback completed")   │
  └─────────────────────────────────────────────┘
     ↓
  FIN ✅
```

**Ejemplo de salida exitosa**:
```json
{
  "success": true,
  "result": {
    "total": 47,
    "successful": 45,
    "failed": 2,
    "failedReports": ["cm4abc123", "cm4xyz789"],
    "totalCost": 0.235,
    "totalTimeMs": 127340
  }
}
```

---

### Flujo 2: Batch Manual desde UI

```
┌────────────────────────────────────────────────────────────────┐
│           FLUJO MANUAL - INSTRUCTOR DASHBOARD                  │
└────────────────────────────────────────────────────────────────┘

  Instructor abre dashboard
     ↓
  [BatchFeedbackGenerator Component]
     ↓
  ┌─────────────────────────────────────────────┐
  │ useEffect() on mount:                       │
  │ GET /api/instructor/feedback/batch-generate │
  │ → Obtiene pending count                     │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ UI muestra:                                 │
  │ "Reportes pendientes: 47"                   │
  │ [Generar Feedback AI] Button                │
  └─────────────────────────────────────────────┘
     ↓
  Usuario hace click en botón
     ↓
  ┌─────────────────────────────────────────────┐
  │ handleGenerateBatch()                       │
  │ - setIsProcessing(true)                     │
  │ - UI: Button disabled + spinner             │
  │ - POST /api/instructor/feedback/batch-generate │
  └─────────────────────────────────────────────┘
     ↓
  [Backend - Mismo que cron pero con auth]
     ↓
  ┌─────────────────────────────────────────────┐
  │ 1. auth() - Verificar sesión                │
  │ 2. Check role === 'INSTRUCTOR'              │
  │ 3. getPendingReportsForFeedback()           │
  │ 4. queueManager.processReports()            │
  │    - Mismo proceso que cron                 │
  │ 5. Return resultados                        │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ Frontend recibe response:                   │
  │ {                                           │
  │   success: true,                            │
  │   result: { ... }                           │
  │ }                                           │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ UI actualiza:                               │
  │ - setResult(data.result)                    │
  │ - Muestra Alert con resumen:                │
  │   ✅ "45 exitosos, ❌ 2 fallidos"            │
  │   💰 "Costo: $0.23"                         │
  │   ⏱️ "Tiempo: 127s"                         │
  │ - fetchPendingCount() para actualizar       │
  └─────────────────────────────────────────────┘
     ↓
  FIN ✅
```

---

### Flujo 3: Manejo de Errores y Reintentos

```
┌────────────────────────────────────────────────────────────────┐
│              ESTRATEGIA DE MANEJO DE ERRORES                   │
└────────────────────────────────────────────────────────────────┘

  Procesando reporte individual
     ↓
  ┌─────────────────────────────────────────────┐
  │ Try:                                        │
  │   1. getProgressReportWithStudent()         │
  │   2. getProgressReportAnswers()             │
  │   3. analyzer.analyzeAnswers()              │
  │   4. createAIFeedback()                     │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ Catch error:                                │
  │   - Log: "Error processing report X"        │
  │   - Check: retriesLeft > 0?                 │
  └─────────────────────────────────────────────┘
     ↓
  ┌────────── SI ──────────┐    ┌────── NO ──────────┐
  │ Retry con backoff      │    │ Marcar como failed │
  │ - Wait 2s              │    │ - Agregar a errors │
  │ - retriesLeft - 1      │    │ - Continue batch   │
  │ - Volver a intentar    │    │ - No bloquear otros│
  └────────────────────────┘    └────────────────────┘
     ↓                                ↓
  ┌─────────────────────────────────────────────┐
  │ Tipos de errores:                           │
  │                                             │
  │ 1. Report not found                         │
  │    → No retry, marcar failed               │
  │                                             │
  │ 2. No answers found                         │
  │    → No retry, marcar failed               │
  │                                             │
  │ 3. Claude API error (429 rate limit)        │
  │    → Retry con backoff exponencial         │
  │                                             │
  │ 4. Claude API error (500 server error)      │
  │    → Retry (transitorio)                   │
  │                                             │
  │ 5. Database error                           │
  │    → Retry (puede ser transitorio)         │
  │                                             │
  │ 6. Timeout                                  │
  │    → Retry                                 │
  └─────────────────────────────────────────────┘
     ↓
  ┌─────────────────────────────────────────────┐
  │ Después de 3 intentos fallidos:             │
  │ - Log error detallado                       │
  │ - Agregar a result.errors[]                 │
  │ - Continuar con siguiente reporte           │
  │ - NO detener batch completo                 │
  └─────────────────────────────────────────────┘
```

---

## 💰 Consideraciones de Costos

### Modelo de Costos Claude Haiku 4.5

| Componente | Precio | Con Prompt Caching |
|------------|--------|-------------------|
| **Input tokens** | $1.00/MTok | $1.00/MTok |
| **Cache write** | - | $1.25/MTok |
| **Cache read** | - | $0.10/MTok |
| **Output tokens** | $5.00/MTok | $5.00/MTok |

### Estimación de Costos por Análisis

**Reporte promedio**:
- Input tokens: 800 (respuestas estudiante + rúbrica)
- Cache read: 2500 tokens (rúbrica cached)
- Output tokens: 500 (feedback estructurado)

**Cálculo**:
```
Primera llamada (cache write):
  Input: 800 × $1.00/M = $0.0008
  Cache write: 2500 × $1.25/M = $0.0031
  Output: 500 × $5.00/M = $0.0025
  Total: $0.0064

Llamadas subsiguientes (cache hit):
  Input: 800 × $1.00/M = $0.0008
  Cache read: 2500 × $0.10/M = $0.00025
  Output: 500 × $5.00/M = $0.0025
  Total: $0.0036

Promedio: ~$0.005/reporte
```

### Proyecciones Mensuales

| Escenario | Reportes/Mes | Costo Mensual |
|-----------|--------------|---------------|
| **Conservador** | 200 | $1.00 |
| **Promedio** | 400 | $2.00 |
| **Alto** | 600 | $3.00 |
| **Muy Alto** | 1000 | $5.00 |

**Presupuesto recomendado**: $10/mes (buffer 100%)

### Monitoreo de Costos

**Alertas sugeridas**:
1. **Alerta Amarilla**: >$5/día → Email al admin
2. **Alerta Roja**: >$10/día → Deshabilitar auto-processing
3. **Alerta Mensual**: >$30/mes → Revisión urgente

**Dashboard de métricas**:
- Costo acumulado hoy/semana/mes
- Costo promedio por reporte
- Reportes procesados vs. presupuesto
- Cache hit rate (target: >80%)

---

## 🛡️ Manejo de Errores y Resiliencia

### Estrategias de Resiliencia

#### 1. Rate Limiting
```typescript
// Max 5 concurrent requests a Claude API
const MAX_CONCURRENT = 5;

// Wait 1s entre chunks de 5 reportes
await new Promise(resolve => setTimeout(resolve, 1000));
```

#### 2. Retry Logic con Backoff Exponencial
```typescript
async function processWithRetry(reportId: string, retriesLeft: number) {
  try {
    return await processReport(reportId);
  } catch (error) {
    if (retriesLeft > 0) {
      const waitTime = 2000 * Math.pow(2, 3 - retriesLeft); // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return processWithRetry(reportId, retriesLeft - 1);
    }
    throw error;
  }
}
```

#### 3. Graceful Degradation
- Si 1 reporte falla → Continuar con los demás
- Si cron falla → UI manual está disponible
- Si email falla → Logging en consola continúa

#### 4. Timeout Protection
```typescript
// Vercel function timeout: 10 min (600s)
export const maxDuration = 600;

// Estimación: 50 reportes × 5s/reporte = 250s < 600s ✅
```

### Clasificación de Errores

| Error Type | Severity | Action |
|------------|----------|--------|
| **Report not found** | 🟡 Medium | Skip, log warning |
| **No answers** | 🟡 Medium | Skip, log warning |
| **Claude API 429** | 🟠 High | Retry with backoff |
| **Claude API 500** | 🟠 High | Retry 3 times |
| **DB connection** | 🔴 Critical | Retry, alert admin |
| **Timeout** | 🟠 High | Retry once |
| **Auth failure** | 🔴 Critical | Stop, alert immediately |

---

## 🧪 Testing Strategy

### Fases de Testing

#### Phase 1: Unit Testing
**Objetivo**: Validar componentes individuales

```bash
# Test FeedbackQueueManager
npm run test src/services/ai/feedback-queue-manager.test.ts

# Test Database queries
npm run test src/lib/db-operations.test.ts
```

**Test cases**:
- ✅ processReports() con 0 reportes
- ✅ processReports() con 1 reporte
- ✅ processReports() con 50 reportes
- ✅ Retry logic en errores transitorios
- ✅ Error handling con reportes inválidos

---

#### Phase 2: Integration Testing
**Objetivo**: Validar flujo completo end-to-end

**Test script**: `test-batch-feedback.ts`
```typescript
import dotenv from 'dotenv';
dotenv.config();

import { getPendingReportsForFeedback } from '@/lib/db-operations';
import queueManager from '@/services/ai/feedback-queue-manager';

async function testBatchProcessing() {
  console.log('🧪 Testing Batch Feedback Processing\n');

  // 1. Get 5 pending reports
  const pendingReports = await getPendingReportsForFeedback({ limit: 5 });
  console.log(`Found ${pendingReports.length} pending reports`);

  if (pendingReports.length === 0) {
    console.log('⚠️ No pending reports to test');
    return;
  }

  // 2. Process with queue manager
  const result = await queueManager.processReports(
    pendingReports.map(r => r.id),
    {
      maxConcurrent: 2,
      retryAttempts: 3,
      onProgress: (current, total) => {
        console.log(`⏳ Processing ${current}/${total}...`);
      }
    }
  );

  // 3. Validate results
  console.log('\n✅ RESULTS:');
  console.log(`Total: ${result.total}`);
  console.log(`Successful: ${result.successful}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Total cost: $${result.totalCost.toFixed(4)}`);
  console.log(`Latency: ${(result.latencyMs / 1000).toFixed(1)}s`);

  if (result.failed > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(e => {
      console.log(`  - ${e.reportId}: ${e.error}`);
    });
  }

  // Validations
  const validations = [];
  if (result.successful + result.failed === result.total) {
    validations.push('✅ Total count matches');
  } else {
    validations.push('❌ Total count mismatch');
  }

  if (result.totalCost > 0 && result.totalCost < 0.1) {
    validations.push('✅ Cost in expected range');
  } else {
    validations.push('⚠️ Cost outside expected range');
  }

  if (result.latencyMs < 300000) { // < 5 min
    validations.push('✅ Latency acceptable');
  } else {
    validations.push('⚠️ Latency too high');
  }

  console.log('\n🔍 VALIDATIONS:');
  validations.forEach(v => console.log(v));
}

testBatchProcessing()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
```

**Run**:
```bash
npx tsx test-batch-feedback.ts
```

---

#### Phase 3: Load Testing
**Objetivo**: Validar rendimiento con volumen real

**Test scenarios**:
1. **Small batch**: 10 reportes → Latencia esperada <1 min
2. **Medium batch**: 50 reportes → Latencia esperada <5 min
3. **Large batch**: 100 reportes → Latencia esperada <10 min

**Métricas a medir**:
- Latencia total
- Costo total
- Tasa de éxito (target: >95%)
- Cache hit rate (target: >80%)
- Memory usage
- CPU usage

---

#### Phase 4: Staging Testing
**Objetivo**: Validar en entorno de staging antes de producción

**Staging checklist**:
- ✅ Cron job se ejecuta correctamente
- ✅ Email notifications funcionan
- ✅ UI manual responde correctamente
- ✅ Database queries optimizadas
- ✅ No memory leaks
- ✅ Logging completo

---

### Testing Checklist Completo

| Test | Status | Notes |
|------|--------|-------|
| Unit tests - Queue Manager | ⏳ Pending | - |
| Unit tests - DB queries | ⏳ Pending | - |
| Integration test - 5 reports | ⏳ Pending | - |
| Integration test - 50 reports | ⏳ Pending | - |
| Cron job test (manual trigger) | ⏳ Pending | - |
| UI test - Manual batch | ⏳ Pending | - |
| Email notification test | ⏳ Pending | - |
| Error handling test | ⏳ Pending | - |
| Retry logic test | ⏳ Pending | - |
| Load test - 100 reports | ⏳ Pending | - |
| Staging deployment | ⏳ Pending | - |
| Production smoke test | ⏳ Pending | - |

---

## 🚀 Deployment Plan

### Pre-Deployment Checklist

#### 1. Environment Variables
```bash
# .env.local (development)
ANTHROPIC_API_KEY=sk-ant-...
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
CRON_SECRET=dev-secret-key
ADMIN_EMAIL=your@email.com

# Vercel Dashboard (production)
# Settings → Environment Variables
# Agregar todas las variables anteriores
```

#### 2. Database Indices (Optimization)
```sql
-- Optimizar query de reportes pendientes
CREATE INDEX IF NOT EXISTS idx_feedback_progressReportId
ON Feedback(progressReportId);

CREATE INDEX IF NOT EXISTS idx_progressreport_submittedAt
ON ProgressReport(submittedAt);

CREATE INDEX IF NOT EXISTS idx_progressreport_subject
ON ProgressReport(subject);
```

#### 3. Vercel Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reminders",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/auto-feedback",
      "schedule": "0 2 * * *"
    }
  ],
  "functions": {
    "src/app/api/cron/auto-feedback/route.ts": {
      "maxDuration": 600
    },
    "src/app/api/instructor/feedback/batch-generate/route.ts": {
      "maxDuration": 600
    }
  }
}
```

---

### Deployment Phases

#### Phase 1: Development (Local)
**Objetivo**: Validar funcionalidad básica

```bash
# 1. Crear branch de feature
git checkout -b feature/batch-feedback-automation

# 2. Implementar componentes según roadmap
# (Fase 4, 5, 6)

# 3. Testing local
npx tsx test-batch-feedback.ts

# 4. Commit
git add .
git commit -m "FEAT: Batch feedback automation system"
```

---

#### Phase 2: Staging (Vercel Preview)
**Objetivo**: Validar en entorno cloud

```bash
# 1. Push a branch
git push origin feature/batch-feedback-automation

# 2. Vercel crea preview deployment automáticamente
# URL: https://intellego-platform-git-feature-batch-...-vercel.app

# 3. Testing en preview:
# - Configurar CRON_SECRET en preview environment
# - Trigger manual del cron:
curl -X GET \
  'https://intellego-platform-preview.vercel.app/api/cron/auto-feedback' \
  -H 'Authorization: Bearer YOUR_CRON_SECRET'

# 4. Validar UI manual en preview
# - Login como instructor
# - Navegar a dashboard
# - Click "Generar Feedback AI"
# - Verificar resultados
```

**Staging Checklist**:
- ✅ Cron executes successfully
- ✅ Email notification received
- ✅ Manual UI functional
- ✅ Database updated correctly
- ✅ No errors in logs
- ✅ Cost tracking working

---

#### Phase 3: Production (Gradual Rollout)
**Objetivo**: Deploy seguro a producción

**Step 1: Deploy Code (Sin activar cron)**
```bash
# 1. Merge to main
git checkout main
git merge feature/batch-feedback-automation
git push origin main

# 2. Vercel auto-deploys to production
# URL: https://intellego-platform.vercel.app

# 3. IMPORTANTE: Cron NO se activa automáticamente
# (Configurado en vercel.json pero necesita activation manual)
```

**Step 2: Smoke Test Manual**
```bash
# Test manual batch desde UI
# - Login como instructor
# - Usar BatchFeedbackGenerator component
# - Procesar 5-10 reportes
# - Verificar resultados
```

**Step 3: Activar Cron (Gradual)**
```bash
# Opción A: Activar cron manualmente via Vercel Dashboard
# Settings → Crons → Enable "/api/cron/auto-feedback"

# Opción B: Trigger manual primero (testing)
curl -X GET \
  'https://intellego-platform.vercel.app/api/cron/auto-feedback' \
  -H 'Authorization: Bearer PRODUCTION_CRON_SECRET'

# Verificar:
# - Email recibido
# - Reportes procesados
# - DB actualizada
# - Logs sin errores
```

**Step 4: Monitoreo Intensivo (Primera Semana)**
- Revisar logs diarios
- Verificar costos en Anthropic dashboard
- Validar tasa de éxito >95%
- Confirmar feedbacks de calidad

---

### Rollback Plan

**Si algo sale mal**:

**Escenario 1: Cron falla constantemente**
```bash
# 1. Deshabilitar cron en Vercel Dashboard
# Settings → Crons → Disable "/api/cron/auto-feedback"

# 2. Usar UI manual como backup
# Instructores pueden seguir procesando manualmente

# 3. Revisar logs y corregir
# 4. Re-activar cron cuando esté arreglado
```

**Escenario 2: Costos excesivos**
```bash
# 1. Deshabilitar cron inmediatamente

# 2. Analizar causas:
# - ¿Cache hit rate bajo?
# - ¿Reportes con respuestas muy largas?
# - ¿Errores causando reintentos excesivos?

# 3. Ajustar configuración:
# - Reducir max_tokens
# - Optimizar prompts
# - Mejorar cache hit rate

# 4. Re-activar con límites más conservadores
```

**Escenario 3: Feedback de mala calidad**
```bash
# 1. NO rollback de código
# (Feedback ya generado permanece)

# 2. Deshabilitar auto-processing

# 3. Revisar prompts y rúbricas

# 4. Regenerar feedback manualmente para reportes afectados
```

---

## 📊 Monitoreo y Alertas

### Métricas Clave a Monitorear

#### 1. Métricas de Procesamiento
- **Reportes procesados/día**
  - Target: 100% de reportes <24h sin feedback
  - Alert si: >20% reportes >48h sin feedback

- **Tasa de éxito**
  - Target: >95%
  - Alert si: <90%

- **Latencia promedio**
  - Target: <5s por reporte
  - Alert si: >10s por reporte

#### 2. Métricas de Costos
- **Costo diario**
  - Target: <$0.50/día
  - Alert si: >$5/día

- **Costo por reporte**
  - Target: $0.005
  - Alert si: >$0.015

- **Cache hit rate**
  - Target: >80%
  - Alert si: <60%

#### 3. Métricas de Calidad
- **Feedback score promedio**
  - Monitor: 0-100 range
  - Alert si: Todos reportes con score similar (posible bug)

- **Longitud de feedback**
  - Monitor: Tokens de output
  - Alert si: <100 tokens (incompleto) o >3000 tokens (excesivo)

---

### Sistema de Alertas

#### Email Alerts
```typescript
// src/lib/alerts.ts

type AlertLevel = 'info' | 'warning' | 'critical';

type Alert = {
  level: AlertLevel;
  title: string;
  message: string;
  data?: any;
};

export async function sendAlert(alert: Alert): Promise<void> {
  const emoji = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨'
  };

  const subject = `${emoji[alert.level]} ${alert.title}`;
  const body = `
${alert.title}
${'='.repeat(50)}

${alert.message}

${alert.data ? `
Datos adicionales:
${JSON.stringify(alert.data, null, 2)}
` : ''}

---
Timestamp: ${new Date().toLocaleString('es-AR')}
Sistema: Intellego Platform - Auto Feedback
  `.trim();

  // TODO: Implementar con servicio real
  console.log('📧 ALERT:', { subject, body });
}

// Ejemplo de uso:
export async function checkCostThreshold(dailyCost: number): Promise<void> {
  if (dailyCost > 5) {
    await sendAlert({
      level: 'critical',
      title: 'Costo diario excede límite',
      message: `El costo de AI hoy es $${dailyCost.toFixed(2)}, excediendo el límite de $5/día`,
      data: { dailyCost, threshold: 5 }
    });
  } else if (dailyCost > 2) {
    await sendAlert({
      level: 'warning',
      title: 'Costo diario elevado',
      message: `El costo de AI hoy es $${dailyCost.toFixed(2)}, acercándose al límite`,
      data: { dailyCost, threshold: 5 }
    });
  }
}
```

---

### Dashboard de Monitoreo (Opcional - Fase 7)

**Componente**: `src/components/instructor/FeedbackMetricsDashboard.tsx`

**Métricas a mostrar**:
1. **Hoy**:
   - Reportes procesados
   - Tasa de éxito
   - Costo acumulado

2. **Esta semana**:
   - Total reportes procesados
   - Promedio por día
   - Costo total

3. **Este mes**:
   - Total reportes
   - Costo total
   - Comparación con mes anterior

4. **Histórico**:
   - Gráfico de reportes/día (últimos 30 días)
   - Gráfico de costos/día
   - Tendencia de tasa de éxito

---

## ⏱️ Timeline y Estimaciones

### Breakdown Detallado

| Fase | Componente | Tiempo Estimado | Prioridad |
|------|-----------|-----------------|-----------|
| **FASE 4** | **Batch Processing Core** | **6-8h** | 🔴 ALTA |
| 4.1 | FeedbackQueueManager class | 2-3h | 🔴 ALTA |
| 4.2 | Database queries (pending reports) | 1h | 🔴 ALTA |
| 4.3 | API route batch-generate | 1-2h | 🔴 ALTA |
| 4.4 | Unit testing | 2h | 🟡 MEDIA |
| | | | |
| **FASE 5** | **Cron Job Automático** | **3-4h** | 🔴 ALTA |
| 5.1 | Cron API route | 1-2h | 🔴 ALTA |
| 5.2 | Email notification function | 1h | 🟡 MEDIA |
| 5.3 | Vercel.json configuration | 0.5h | 🔴 ALTA |
| 5.4 | Testing cron trigger | 0.5-1h | 🔴 ALTA |
| | | | |
| **FASE 6** | **UI Manual + Monitoreo** | **4-6h** | 🟡 MEDIA |
| 6.1 | BatchFeedbackGenerator UI | 2-3h | 🟡 MEDIA |
| 6.2 | Integration con dashboard | 1h | 🟡 MEDIA |
| 6.3 | Alert system | 1-2h | 🟢 BAJA |
| | | | |
| **TESTING** | **Testing Completo** | **4-6h** | 🔴 ALTA |
| T.1 | Integration tests | 2h | 🔴 ALTA |
| T.2 | Load testing (50-100 reports) | 1-2h | 🟡 MEDIA |
| T.3 | Staging deployment & validation | 1-2h | 🔴 ALTA |
| | | | |
| **DEPLOYMENT** | **Producción** | **2-3h** | 🔴 ALTA |
| D.1 | Production deployment | 1h | 🔴 ALTA |
| D.2 | Smoke testing | 1h | 🔴 ALTA |
| D.3 | Monitoreo inicial | 1h | 🔴 ALTA |
| | | | |
| **TOTAL** | | **19-27 horas** | |

---

### Plan de Trabajo Sugerido

#### Sprint 1: Core Functionality (Semana 1)
**Objetivo**: Tener batch processing funcionando

**Día 1-2** (8h):
- ✅ FeedbackQueueManager
- ✅ Database queries
- ✅ Manual batch API
- ✅ Unit tests básicos

**Día 3** (4h):
- ✅ Integration testing local
- ✅ Correcciones de bugs

**Entregable**: Sistema de batch manual funcional localmente

---

#### Sprint 2: Automatización (Semana 2)
**Objetivo**: Cron job automático funcionando

**Día 4-5** (6h):
- ✅ Cron API route
- ✅ Email notifications
- ✅ Vercel configuration
- ✅ Testing manual del cron

**Día 6** (3h):
- ✅ UI component (BatchFeedbackGenerator)
- ✅ Integration con instructor dashboard

**Entregable**: Sistema completo (auto + manual) funcionando en staging

---

#### Sprint 3: Testing & Production (Semana 3)
**Objetivo**: Deploy a producción con confianza

**Día 7-8** (6h):
- ✅ Load testing (50-100 reportes)
- ✅ Staging validation completa
- ✅ Correcciones finales

**Día 9** (3h):
- ✅ Production deployment
- ✅ Smoke testing
- ✅ Activación del cron

**Día 10** (2h):
- ✅ Monitoreo intensivo
- ✅ Documentación final

**Entregable**: Sistema en producción, monitoreado y documentado

---

### Timeline Visual

```
Semana 1: Core Functionality
├─ Día 1-2: [████████] FeedbackQueueManager + DB queries + API
├─ Día 3:   [████] Testing & bug fixes
└─ ✅ Batch manual funcional

Semana 2: Automatización
├─ Día 4-5: [██████] Cron job + Email + Config
├─ Día 6:   [███] UI component
└─ ✅ Sistema completo en staging

Semana 3: Production
├─ Día 7-8: [██████] Load testing + Fixes
├─ Día 9:   [███] Deployment + Smoke tests
├─ Día 10:  [██] Monitoreo + Docs
└─ 🚀 LIVE EN PRODUCCIÓN

Total: 19-27 horas → 3 semanas part-time
```

---

## 📚 Referencias y Recursos

### Documentación Relacionada
- `AI_integrations_haiku/ROADMAP.md` - Roadmap original (Fase 1-3)
- `AI_integrations_haiku/PROGRESS.md` - Progreso de Fase 1-3
- `AI_integrations_haiku/RUBRICAS_DE_CORRECCION.md` - Rúbricas oficiales
- `AI_integrations_haiku/prd-claude-haiku-integration.md` - PRD completo

### APIs y Servicios
- **Claude Haiku 4.5**: https://docs.anthropic.com/en/docs/about-claude/models
- **Prompt Caching**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- **Vercel Cron Jobs**: https://vercel.com/docs/cron-jobs
- **Turso Database**: https://docs.turso.tech/

### Testing Tools
- **tsx**: Para ejecutar TypeScript directamente
- **Vercel CLI**: Para testing local de cron jobs

### Monitoreo
- **Anthropic Dashboard**: https://console.anthropic.com/ (Usage & Costs)
- **Vercel Analytics**: https://vercel.com/analytics (Function logs)

---

## ✅ Criterios de Éxito

### Objetivos Técnicos
- ✅ Sistema procesa 100% de reportes pendientes automáticamente
- ✅ Tasa de éxito >95%
- ✅ Costo por reporte <$0.015
- ✅ Latencia promedio <5s por reporte
- ✅ Cron se ejecuta diariamente sin fallos

### Objetivos de Negocio
- ✅ Feedback entregado en <24h desde envío de reporte
- ✅ Reducción de 95% en trabajo manual del instructor
- ✅ Consistencia en evaluación (rúbricas oficiales)
- ✅ Escalabilidad validada (200+ reportes/semana)

### Objetivos de Calidad
- ✅ Feedback estructurado y detallado
- ✅ Scores alineados con rúbricas oficiales
- ✅ Skills metrics calculadas correctamente
- ✅ Sin feedback genérico o de baja calidad

---

## 🎯 Próximos Pasos Inmediatos

### Checklist para Empezar

1. ✅ Leer este roadmap completo
2. ⏳ Decidir timeline (3 semanas part-time vs 1 semana full-time)
3. ⏳ Configurar entorno de desarrollo:
   - Variables de entorno (.env.local)
   - Rama de feature (git checkout -b feature/batch-feedback)
4. ⏳ Comenzar con Fase 4: FeedbackQueueManager
5. ⏳ Testing incremental (no esperar al final)

### Comandos Iniciales

```bash
# 1. Crear rama de feature
git checkout -b feature/batch-feedback-automation

# 2. Copiar este roadmap a proyecto
# (Ya está en AI_integrations_haiku/ROADMAP-AUTOMATIZACION-FEEDBACK.md)

# 3. Verificar variables de entorno
cat .env | grep ANTHROPIC_API_KEY
cat .env | grep TURSO

# 4. Comenzar implementación
mkdir -p src/services/ai
touch src/services/ai/feedback-queue-manager.ts

# 5. Primera iteración: FeedbackQueueManager skeleton
```

---

## 📝 Notas Finales

### Dependencias Externas
- Claude API (Anthropic) - Debe estar disponible
- Turso Database - Debe estar accesible
- Vercel Cron - Requiere plan Pro o superior (verificar)

### Riesgos Identificados
1. **Vercel timeout**: Cron jobs tienen límite de 10 min en Hobby plan
   - Mitigación: Procesar máximo 100 reportes por ejecución
2. **Claude API rate limits**: Posible throttling con alto volumen
   - Mitigación: Rate limiting de 5 concurrent + retry logic
3. **Costos inesperados**: Spike en uso podría exceder presupuesto
   - Mitigación: Alertas automáticas + feature flag para deshabilitar

### Preguntas Abiertas
- [ ] ¿Vercel plan actual soporta cron jobs? (Verificar)
- [ ] ¿Servicio de email preferido? (Resend, SendGrid, otro)
- [ ] ¿Preferencia de horario para cron? (2 AM ART sugerido)
- [ ] ¿Necesidad de dashboard de métricas? (Opcional en Fase 6)

---

**Documento creado**: 2025-10-20
**Última actualización**: 2025-10-20
**Versión**: 1.0
**Estado**: 📝 Planificación completa - Listo para implementación
