# 📋 ANÁLISIS FASE 1 - Sistema Actual

**Fecha**: 22 de octubre de 2025
**Estado**: ✅ Completado
**Archivos analizados**: 5 archivos principales

---

## 📁 ARCHIVOS ANALIZADOS

### 1. **src/app/dashboard/student/page.tsx** (899 líneas)
**Propósito**: Dashboard principal del estudiante con navegación por tabs

**Componentes clave**:
- Manejo de 6 tabs: `reports`, `profile`, `history`, `progress`, `evaluations`, `feedbacks`
- Calendario mensual por materia mostrando estado de entregas
- Sistema de navegación con Sidebar

**Estados principales**:
```typescript
const [monthWeeksBySubject, setMonthWeeksBySubject] = useState<{
  [subject: string]: Array<{
    start: Date,
    end: Date,
    hasReport: boolean,
    hasFeedback: boolean,      // ← USADO PARA MOSTRAR "Devolución"
    isCurrentWeek: boolean,
    isPastWeek: boolean,
    isFutureWeek: boolean
  }>
}>({})

const [reportsBySubject, setReportsBySubject] = useState<{
  [subject: string]: any[]
}>({})

const [allFeedbacks, setAllFeedbacks] = useState<any[]>([])
const [isFeedbacksLoading, setIsFeedbacksLoading] = useState(false)
```

### 2. **src/components/student/MonthlyReportsHistory.tsx** (339 líneas)
**Propósito**: Componente que renderiza el historial mensual de entregas

**Estados y props**:
```typescript
interface Report {
  id: string;
  weekStart: string;
  weekEnd: string;
  subject: string;
  submittedAt: string;
  hasFeedback?: boolean;     // ← USADO PARA MOSTRAR "Devolución"
}

const [reports, setReports] = useState<Report[]>([]);
const [selectedReport, setSelectedReport] = useState<Report | null>(null);
const [showFeedback, setShowFeedback] = useState(false);
```

**Estados de reporte**:
- `completed-with-feedback`: Muestra botón "📝 Devolución"
- `completed-without-feedback`: Muestra "✅ Entregado"
- `pending`: Muestra "⏱️ Pendiente"

### 3. **src/components/student/FeedbackViewer.tsx** (347 líneas)
**Propósito**: Modal que muestra el feedback completo

**Datos mostrados**:
- Score con emoji y color
- Comentarios generales
- Fortalezas (lista)
- Mejoras (lista)
- Métricas de habilidades (5 barras de progreso)
- Análisis IA
- Información del instructor

### 4. **src/app/api/student/feedback/route.ts** (144 líneas)
**Propósito**: API endpoint para obtener feedbacks

**Endpoints**:
```typescript
GET /api/student/feedback
  → Sin params: devuelve TODOS los feedbacks del estudiante
  → Con weekStart + subject: devuelve feedback específico
```

**Query usada**:
- `getFeedbacksByStudent(studentId)` - Devuelve TODOS los feedbacks
- `getFeedbackByWeek(studentId, weekStart, subject)` - Devuelve uno específico

### 5. **src/app/api/weekly-reports/route.ts** (189 líneas)
**Propósito**: API para obtener y crear reportes semanales

**GET endpoint**:
```typescript
GET /api/weekly-reports
  → Devuelve: subjects, reportsBySubject, canSubmitBySubject, currentWeek
```

**Estructura de reportsBySubject**:
```typescript
{
  [subject: string]: Array<{
    id: string,
    weekStart: string,
    weekEnd: string,
    subject: string,
    submittedAt: string,
    hasFeedback: boolean,    // ← Campo clave que indica si hay feedback
    // ... otros campos de Answer, etc.
  }>
}
```

---

## 🔍 LUGARES DONDE APARECE "DEVOLUCIÓN"

### **Ubicación 1**: Dashboard Principal - Calendario
**Archivo**: `src/app/dashboard/student/page.tsx`
**Líneas**: 498-509

```tsx
{week.hasFeedback && (
  <button
    onClick={() => {
      const weekStartISO = week.start.toISOString().split('T')[0]
      handleViewFeedback(weekStartISO, subject)
    }}
    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800"
    title="Ver devolución"
  >
    📝 Devolución
  </button>
)}
```

**Contexto**: Dentro del calendario mensual, junto al indicador "✅ Enviado"
**Condición**: Solo aparece si `week.hasFeedback === true`
**Acción**: Abre modal de FeedbackViewer con el feedback específico

---

### **Ubicación 2**: Historial de Entregas - Tabla
**Archivo**: `src/components/student/MonthlyReportsHistory.tsx`
**Líneas**: 261-268

```tsx
{status === 'completed-with-feedback' && report ? (
  <button
    onClick={() => handleViewFeedback(report)}
    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
    title="Ver devolución"
  >
    📝 Devolución
  </button>
) : status === 'completed-without-feedback' ? (
  <span className="px-2 py-1 text-xs text-green-600 font-medium">
    ✅ Entregado
  </span>
) : (
  <span className="px-2 py-1 text-xs text-gray-400">
    ⏱️ Pendiente
  </span>
)}
```

**Contexto**: En la tabla del historial, celda por semana/materia
**Condición**: Solo si `status === 'completed-with-feedback'`
**Acción**: Abre modal de FeedbackViewer

---

### **Ubicación 3**: Historial - Leyenda
**Archivo**: `src/components/student/MonthlyReportsHistory.tsx`
**Líneas**: 289-292

```tsx
<div className="flex items-center gap-2">
  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">📝 Devolución</span>
  <span>Con devolución</span>
</div>
```

**Contexto**: Leyenda explicativa al pie de la tabla
**Propósito**: Explicar qué significa el badge azul

---

### **Ubicación 4**: Historial - Modal Header
**Archivo**: `src/components/student/MonthlyReportsHistory.tsx`
**Líneas**: 310-312

```tsx
<h3 className="text-lg font-semibold text-gray-800">
  Devolución - {selectedReport.subject}
</h3>
```

**Contexto**: Título del modal cuando se hace clic en "📝 Devolución"
**Propósito**: Indicar que se está viendo una devolución

---

### **Ubicación 5**: Dashboard - Stats Card
**Archivo**: `src/app/dashboard/student/page.tsx`
**Líneas**: 604-608

```tsx
<div className="text-center">
  <div className="text-2xl font-bold text-orange-600">
    {Object.values(reportsBySubject).flat().filter((r: any) => r.hasFeedback).length || 0}
  </div>
  <div className="text-sm text-slate-600">Con Devolución</div>
</div>
```

**Contexto**: Tarjeta de estadísticas en el tab "history"
**Propósito**: Mostrar total de reportes con devolución

---

## 📊 FLUJO DE DATOS - CALENDARIO

### 1. **Carga Inicial**
```
fetchStudentData()
  ↓
GET /api/weekly-reports
  ↓
Respuesta: { subjects, reportsBySubject, canSubmitBySubject }
  ↓
setReportsBySubject(data.reportsBySubject)
  ↓
updateMonthWeeksWithReportsBySubject(reportsBySubject, subjects)
  ↓
Calcula monthWeeksBySubject con hasFeedback por semana
```

### 2. **Cálculo de hasFeedback** (líneas 209-252)
```typescript
const matchingReport = reportsBySubjectData[subject]?.find(report => {
  // Busca si hay reporte para esta semana
  return (reportWeekStart <= weekEnd && reportWeekEnd >= weekStart)
})

const hasFeedback = matchingReport?.hasFeedback === true || matchingReport?.hasFeedback === 1
```

**Problema identificado**: `hasFeedback` se calcula desde `reportsBySubject` que viene del API, pero el valor es inconsistente.

---

## 📊 FLUJO DE DATOS - TAB RETROALIMENTACIONES

### Lógica de Carga (líneas 131-154)
```typescript
useEffect(() => {
  if (activeTab !== 'feedbacks') return       // Solo si tab activo
  if (allFeedbacks.length > 0) return        // ⚠️ PROBLEMA: No recarga si ya tiene datos

  setIsFeedbacksLoading(true)

  fetch('/api/student/feedback')              // Sin params = TODOS los feedbacks
    .then(res => res.json())
    .then(data => {
      setAllFeedbacks(data.feedbacks || [])
    })
    .finally(() => {
      setIsFeedbacksLoading(false)
    })
}, [activeTab, allFeedbacks.length])
```

**Problema potencial**:
- Si `allFeedbacks.length > 0`, nunca vuelve a cargar
- No hay refresh cuando se crea un nuevo feedback
- Depende del array `allFeedbacks.length` en las dependencias

---

## 📊 FLUJO DE DATOS - HISTORIAL

### 1. **Carga de reportes del mes**
```
fetchMonthReports()
  ↓
GET /api/student/reports-history?startDate=XXX&endDate=YYY
  ↓
setReports(data.reports)
```

### 2. **Cálculo de estado por celda**
```typescript
const getReportStatus = (weekStart: string, subject: string) => {
  const report = reports.find(r => {
    // Busca reporte que coincida con semana y materia
    return reportDateObj >= weekStartDate &&
           reportDateObj <= weekEndDate &&
           r.subject === subject;
  });

  if (!report) return 'pending';
  return report.hasFeedback === true ? 'completed-with-feedback' : 'completed-without-feedback';
}
```

### 3. **Click en "Devolución"**
```typescript
const handleViewFeedback = (report: Report) => {
  setSelectedReport(report);
  setShowFeedback(true);
  // Renderiza FeedbackViewer dentro de un modal custom
}
```

---

## 🎯 CAMBIOS NECESARIOS POR FASE

### **FASE 2: Eliminar "Devolución" del Dashboard**

**Cambios en page.tsx**:

1. **ELIMINAR líneas 498-509** (botón Devolución en calendario):
```tsx
// ELIMINAR TODO ESTE BLOQUE:
{week.hasFeedback && (
  <button onClick={...}>
    📝 Devolución
  </button>
)}
```

2. **ELIMINAR líneas 604-608** (stat card "Con Devolución"):
```tsx
// ELIMINAR TODO ESTE BLOQUE:
<div className="text-center">
  <div className="text-2xl font-bold text-orange-600">
    {Object.values(reportsBySubject).flat().filter((r: any) => r.hasFeedback).length || 0}
  </div>
  <div className="text-sm text-slate-600">Con Devolución</div>
</div>
```

3. **MANTENER** `hasFeedback` en la estructura de datos (se usa en historial)

---

### **FASE 3: Consolidar Retroalimentaciones**

**Cambios en page.tsx**:

1. **MODIFICAR useEffect líneas 131-154**:
```typescript
// Eliminar la condición que previene recargas
useEffect(() => {
  if (activeTab !== 'feedbacks') return
  // ELIMINAR: if (allFeedbacks.length > 0) return

  setIsFeedbacksLoading(true)
  fetch('/api/student/feedback')
    .then(res => res.json())
    .then(data => {
      setAllFeedbacks(data.feedbacks || [])
    })
    .finally(() => {
      setIsFeedbacksLoading(false)
    })
}, [activeTab])  // CAMBIAR dependencias
```

2. **VERIFICAR** que el API `/api/student/feedback` devuelve TODOS los feedbacks (✅ Ya lo hace)

3. **AGREGAR** ordenamiento por fecha:
```typescript
.then(data => {
  const sortedFeedbacks = (data.feedbacks || []).sort((a, b) =>
    new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );
  setAllFeedbacks(sortedFeedbacks);
})
```

---

### **FASE 4: Limpiar Historial de Entregas**

**Cambios en MonthlyReportsHistory.tsx**:

1. **ELIMINAR botón "Devolución" líneas 261-268**:
```tsx
// CAMBIAR de esto:
{status === 'completed-with-feedback' && report ? (
  <button onClick={() => handleViewFeedback(report)}>
    📝 Devolución
  </button>
) : status === 'completed-without-feedback' ? (
  <span>✅ Entregado</span>
) : (
  <span>⏱️ Pendiente</span>
)}

// A esto:
{status === 'completed-with-feedback' || status === 'completed-without-feedback' ? (
  <button onClick={() => handleViewReport(report)}>
    ✅ Entregado
  </button>
) : (
  <span>⏱️ Pendiente</span>
)}
```

2. **ELIMINAR líneas 289-292** (leyenda "Con devolución"):
```tsx
// ELIMINAR:
<div className="flex items-center gap-2">
  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">📝 Devolución</span>
  <span>Con devolución</span>
</div>
```

3. **MODIFICAR leyenda líneas 294-296**:
```tsx
// CAMBIAR de:
<span>Sin devolución</span>
// A:
<span>Entregado</span>
```

4. **CREAR nueva función** `handleViewReport` para mostrar modal con respuestas del estudiante:
```typescript
const handleViewReport = (report: Report) => {
  setSelectedReport(report);
  setShowReportModal(true);  // Nueva modal diferente
}
```

5. **CREAR nuevo componente modal** `ReportResponsesViewer`:
```tsx
// Nuevo componente que muestra las respuestas del ProgressReport
// NO muestra el feedback del instructor
// Título: "Tu Reporte - Semana del [fecha]"
// Contenido: respuestas a las 5 preguntas
```

6. **ELIMINAR modal de FeedbackViewer** del historial (líneas 305-336)

---

## 📝 DOCUMENTACIÓN DE ESTRUCTURAS DE DATOS

### **monthWeeksBySubject**
```typescript
{
  [subject: string]: Array<{
    start: Date,                 // Lunes de la semana
    end: Date,                   // Domingo de la semana
    hasReport: boolean,          // Si hay ProgressReport para esta semana
    hasFeedback: boolean,        // Si ese ProgressReport tiene Feedback asociado
    isCurrentWeek: boolean,      // Si es la semana actual (ART timezone)
    isPastWeek: boolean,         // Si la semana ya pasó
    isFutureWeek: boolean        // Si es semana futura
  }>
}
```

**Origen**: Calculado en frontend desde `reportsBySubject`
**Uso**: Renderizar calendario mensual en dashboard
**CAMBIO REQUERIDO**: Ya no usar `hasFeedback` para mostrar badge

---

### **reportsBySubject**
```typescript
{
  [subject: string]: Array<{
    id: string,                  // ID del ProgressReport
    weekStart: string,           // ISO date YYYY-MM-DD
    weekEnd: string,             // ISO date YYYY-MM-DD
    subject: string,             // "Física" o "Química"
    submittedAt: string,         // ISO timestamp
    hasFeedback: boolean,        // ⚠️ CAMPO CLAVE - si tiene Feedback asociado
    answers: Array<{             // Respuestas del estudiante
      questionId: string,
      questionText: string,
      answer: string
    }>
  }>
}
```

**Origen**: API `/api/weekly-reports`
**Uso**: Poblar calendario y calcular stats
**MANTENER**: Se sigue usando en historial

---

### **allFeedbacks**
```typescript
Array<{
  id: string,                    // ID del Feedback
  weekStart: string,             // ISO date YYYY-MM-DD
  subject: string,               // "Física" o "Química"
  score: number,                 // 0-100
  generalComments: string,
  strengths: string[],           // Array de fortalezas
  improvements: string[],        // Array de mejoras
  aiAnalysis: string,
  skillsMetrics: {               // JSON con métricas
    comprehension: number,
    criticalThinking: number,
    selfRegulation: number,
    practicalApplication: number,
    metacognition: number
  },
  createdAt: string,            // ISO timestamp
  instructor: {
    name: string,
    email: string
  }
}>
```

**Origen**: API `/api/student/feedback` (sin params)
**Uso**: Renderizar tab "Retroalimentaciones"
**CAMBIO REQUERIDO**: Ordenar por fecha descendente

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Inconsistencia de `hasFeedback`**
- El campo existe en `reportsBySubject` pero a veces es `undefined`
- Causa que "Devolución" aparezca inconsistentemente

**Solución**: Ya no depender de este campo para mostrar badges en calendario

---

### 2. **No recarga feedbacks**
- El `useEffect` tiene condición `if (allFeedbacks.length > 0) return`
- Si el estudiante ya vio feedbacks y luego el instructor crea uno nuevo, no se actualiza

**Solución**: Eliminar esa condición y recargar cada vez que se abre el tab

---

### 3. **Historial muestra "Devolución" y "Entregado"**
- Confunde al estudiante: ¿dónde busco mis retroalimentaciones?
- Duplica información que ya está en tab dedicado

**Solución**: Historial solo muestra si entregó o no, click abre modal con SUS respuestas

---

### 4. **Modal de FeedbackViewer usado en 2 lugares**
- Se abre desde dashboard calendario (OK)
- Se abre desde historial (NO - debería abrir modal diferente)

**Solución**:
- Dashboard: eliminar botón devolución
- Historial: crear nuevo modal para ver respuestas del estudiante

---

## 📋 TAREAS PENDIENTES

- [x] Leer todos los archivos clave
- [x] Documentar estructuras de datos
- [x] Identificar ubicaciones de "Devolución"
- [x] Analizar flujo de carga de feedbacks
- [ ] Comenzar Fase 2: Modificar dashboard
- [ ] Comenzar Fase 3: Mejorar tab retroalimentaciones
- [ ] Comenzar Fase 4: Limpiar historial
- [ ] Fase 5: Pruebas integrales
- [ ] Fase 6: Documentación final

---

**Última actualización**: 22 de octubre de 2025
**Tiempo invertido**: ~30 minutos
**Estado**: ✅ Análisis completo
