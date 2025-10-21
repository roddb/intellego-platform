# Plan Integral: Sistema de Corrección Automática de Exámenes

**Fecha**: 21 de Octubre, 2025
**Objetivo**: Implementar sistema completo de corrección de exámenes usando Claude Haiku
**Estado**: 📋 Planificación

---

## 🎯 Objetivo del Sistema

Permitir la corrección automática de exámenes transcritos en archivos `.md`, donde:
- El **apellido del alumno** está en el nombre del archivo (ej: `Gonzalez.md`, `Di_Bernardo.md`)
- El **contenido** es la transcripción del examen (puede ser de cualquier tema)
- La **corrección** usa una rúbrica genérica adaptable
- El **resultado** se guarda en la tabla `Evaluation` con feedback detallado

---

## 📊 Análisis del Estado Actual

### ✅ Infraestructura Existente

#### 1. Base de Datos (Turso libSQL)

**Tabla `Evaluation`** - Estructura perfecta:
```sql
- id (TEXT, PRIMARY KEY)
- studentId (TEXT, NOT NULL)         ← Buscar por apellido
- subject (TEXT, NOT NULL)            ← Asignatura del examen
- examDate (TEXT, NOT NULL)           ← Fecha del examen
- examTopic (TEXT, NOT NULL)          ← Tema específico
- score (INTEGER, NOT NULL)           ← Nota 0-100
- feedback (TEXT, NOT NULL)           ← Feedback en Markdown
- createdBy (TEXT, NOT NULL)          ← ID del instructor
- createdAt (TEXT, DEFAULT now())
- updatedAt (TEXT, DEFAULT now())
```

**Tabla `User`** - Para buscar estudiantes:
```sql
- id (TEXT, PRIMARY KEY)
- name (TEXT)                         ← Formato: "Apellido, Nombre"
- role (TEXT)                         ← STUDENT
- status (TEXT)                       ← ACTIVE
- academicYear (TEXT)                 ← "4to Año", "5to Año"
- division (TEXT)                     ← "A", "B", "C"
- subjects (TEXT)                     ← "Física, Química"
```

#### 2. Sistema AI Existente

**Claude Haiku 4.5 Integrado** (`src/services/ai/claude/`):
- ✅ Cliente configurado con lazy initialization
- ✅ Prompt Caching (ahorro 70-90%)
- ✅ Sistema de rúbricas por fases (1-4)
- ✅ Evaluación por preguntas con niveles 1-4
- ✅ Cálculo de métricas de habilidades
- ✅ Analyzer con formato estructurado

**Formato de Feedback Existente** (ejemplo real):
```markdown
# RETROALIMENTACIÓN - [NOMBRE ESTUDIANTE]
## Examen: [Materia] - [Tema]
### Fecha: [Fecha]
### Nota: [Score]/100

---

## 📊 Tu Progreso Histórico
[Métricas de semanas anteriores si existen]

## 🔍 Análisis de tu Examen
### Ejercicio 1: [Título]
- Lo que esperábamos de ti
- Lo que demostraste
- Comparación vs expectativa
- Retroalimentación específica

### Ejercicio 2: [Título]
[Mismo formato]

## 🎯 Validación de tu Progreso
[Predicciones vs realidad]

## 💡 Recomendaciones Personalizadas
[3-4 recomendaciones específicas]

## 📈 Próximos Pasos
[Plan de mejora]

## 📌 Mensaje Final
[Motivación personalizada]
```

#### 3. Sistema de Rúbricas

**Actual** (Reportes Semanales):
- 4 Fases metodológicas (Identificación → Evaluación → Planificación → Implementación)
- 5 Preguntas (Q1-Q5) con ponderaciones (25%, 25%, 20%, 20%, 10%)
- 4 Niveles de desempeño (1-4) con descriptores detallados
- 5 Métricas de habilidades transversales

**Necesidad para Exámenes**:
- ⚠️ Rúbrica genérica (no específica de fase)
- ⚠️ Adaptable a cualquier tema/asignatura
- ⚠️ Enfocada en resolución de problemas/ejercicios
- ✅ Mantener métricas de habilidades
- ✅ Mantener niveles 1-4

---

## 🏗️ Arquitectura Propuesta

### Componente 1: Rúbrica Genérica de Exámenes

**Estructura**: 5 Dimensiones de Evaluación

```typescript
// Dimensiones de evaluación (reemplaza Q1-Q5)
export const DIMENSIONES_EXAMEN = {
  D1_COMPRENSION: 0.25,      // 25% - Comprensión del problema
  D2_METODOLOGIA: 0.25,      // 25% - Metodología y estrategia
  D3_EJECUCION: 0.25,        // 25% - Ejecución y cálculos
  D4_JUSTIFICACION: 0.15,    // 15% - Justificación y razonamiento
  D5_VERIFICACION: 0.10      // 10% - Verificación y análisis crítico
} as const;
```

**Niveles de Desempeño** (mantener sistema actual):
- Nivel 4 (85-100): Excelente → 92.5 puntos
- Nivel 3 (70-84): Bueno → 77 puntos
- Nivel 2 (55-69): En desarrollo → 62 puntos
- Nivel 1 (0-54): Inicial → 27 puntos

### Componente 2: Parser de Archivos

**Input**: Archivo `.md` con nombre `[Apellido].md`

**Proceso**:
1. Extraer apellido del nombre de archivo
2. Buscar estudiante en DB por coincidencia de apellido
3. Leer contenido completo del archivo
4. Identificar estructura del examen (ejercicios, respuestas)

**Output**:
```typescript
interface ParsedExam {
  studentInfo: {
    id: string;
    name: string;
    apellido: string;
    academicYear: string;
    division: string;
  };
  examContent: {
    rawText: string;
    exercises: Exercise[];
  };
  metadata: {
    fileName: string;
    fileSize: number;
    parseDate: Date;
  };
}

interface Exercise {
  number: number;
  title?: string;
  content: string;
  hasAnswer: boolean;
}
```

### Componente 3: Corrector AI (Claude Haiku)

**Input**: `ParsedExam` + metadatos del examen

**Proceso** (usando prompt caching):
```typescript
interface CorrectionRequest {
  parsedExam: ParsedExam;
  examMetadata: {
    subject: string;       // "Física", "Química", etc.
    topic: string;         // "Tiro Oblicuo", "Termodinámica", etc.
    examDate: string;      // "2025-10-15"
    maxScore: number;      // 100 (default)
  };
  instructorId: string;
  options?: {
    includeHistoricalComparison: boolean;  // Comparar con reportes previos
    detailLevel: 'basic' | 'detailed';    // Nivel de detalle
  };
}
```

**System Prompt** (cacheable):
```
Eres un asistente experto en corrección de exámenes de [MATERIA].

Tu tarea es evaluar exámenes usando una rúbrica genérica de 5 dimensiones:

1. COMPRENSIÓN (25%): Entendimiento del problema
2. METODOLOGÍA (25%): Selección de estrategia
3. EJECUCIÓN (25%): Desarrollo y cálculos
4. JUSTIFICACIÓN (15%): Razonamiento lógico
5. VERIFICACIÓN (10%): Análisis crítico

Para cada dimensión, asigna un nivel 1-4:
- Nivel 4 (85-100): Excelente
- Nivel 3 (70-84): Bueno
- Nivel 2 (55-69): En desarrollo
- Nivel 1 (0-54): Inicial

[RÚBRICA GENÉRICA COMPLETA - CACHEABLE]
```

**User Prompt** (NO cacheable):
```
Estudiante: [Nombre]
Examen: [Materia] - [Tema]
Fecha: [Fecha]

[TRANSCRIPCIÓN DEL EXAMEN]

Evalúa ejercicio por ejercicio usando la rúbrica.
```

**Output**: Estructura JSON
```typescript
interface AIAnalysis {
  scores: {
    D1_COMPRENSION: { nivel: 1 | 2 | 3 | 4; puntaje: number; };
    D2_METODOLOGIA: { nivel: 1 | 2 | 3 | 4; puntaje: number; };
    D3_EJECUCION: { nivel: 1 | 2 | 3 | 4; puntaje: number; };
    D4_JUSTIFICACION: { nivel: 1 | 2 | 3 | 4; puntaje: number; };
    D5_VERIFICACION: { nivel: 1 | 2 | 3 | 4; puntaje: number; };
  };
  totalScore: number;  // 0-100 (promedio ponderado)
  exerciseAnalysis: ExerciseAnalysis[];
  generalFeedback: string;
  recommendations: string[];
}

interface ExerciseAnalysis {
  exerciseNumber: number;
  strengths: string[];
  weaknesses: string[];
  specificFeedback: string;
}
```

### Componente 4: Enriquecedor de Feedback

**Función**: Agregar contexto histórico del estudiante

**Proceso**:
1. Buscar reportes semanales previos del estudiante en `Feedback`
2. Buscar evaluaciones previas del estudiante en `Evaluation`
3. Calcular tendencias y comparar con desempeño actual
4. Generar predicciones vs realidad (como en feedbacks actuales)

**Output**: Feedback enriquecido en formato Markdown

### Componente 5: Gestor de Base de Datos

**Función**: Guardar resultado en tabla `Evaluation`

```typescript
interface EvaluationRecord {
  id: string;               // "eval_[hash]"
  studentId: string;        // Del parsing
  subject: string;          // Del metadata
  examDate: string;         // Del metadata
  examTopic: string;        // Del metadata
  score: number;            // Del AI analysis
  feedback: string;         // Markdown enriquecido
  createdBy: string;        // Instructor ID
  createdAt: string;        // now()
  updatedAt: string;        // now()
}
```

### Componente 6: UI para Instructores

**Páginas**:
1. **Upload de Exámenes** (`/dashboard/instructor/exams/upload`)
   - Drag & drop de archivos `.md`
   - Selector de materia
   - Input de tema del examen
   - Date picker para fecha del examen
   - Preview de archivos antes de procesar

2. **Configuración de Corrección** (mismo formulario)
   - Selección de rúbrica (futura: personalizada vs genérica)
   - Toggle: incluir análisis histórico
   - Nivel de detalle (básico vs detallado)

3. **Vista de Progreso** (durante corrección)
   - Lista de archivos con status (pending, processing, completed, error)
   - Progress bar global
   - Logs en tiempo real

4. **Resultados** (`/dashboard/instructor/exams/results`)
   - Tabla de exámenes corregidos
   - Preview de feedback
   - Exportar a PDF
   - Re-procesar si hay error

---

## 🔄 Workflow Completo

### Fase 1: Upload & Parsing

```
Usuario → Upload .md files
    ↓
Parser extrae apellido del filename
    ↓
Buscar estudiante en User table
    ↓
[MATCH FOUND] → ParsedExam
    ↓
[NO MATCH] → Error: "No se encontró estudiante con apellido X"
```

### Fase 2: Corrección AI

```
ParsedExam + Metadata
    ↓
Build cacheable system prompt (rúbrica genérica)
    ↓
Build user prompt (transcripción)
    ↓
Claude Haiku API call
    ↓
Parse JSON response
    ↓
Calculate weighted scores
    ↓
AIAnalysis object
```

### Fase 3: Enriquecimiento

```
AIAnalysis + studentId
    ↓
Query Feedback table (últimos 5 reportes)
    ↓
Query Evaluation table (últimos 3 exámenes)
    ↓
Calculate historical trends
    ↓
Generate comparative analysis
    ↓
Build enriched Markdown feedback
```

### Fase 4: Persistencia

```
Enriched Feedback + Metadata
    ↓
Generate evaluation ID
    ↓
Insert into Evaluation table
    ↓
Return evaluation record
```

---

## 📁 Estructura de Archivos Propuesta

```
evaluation_integration/
├── PLAN_INTEGRAL.md              ← Este archivo
├── RUBRICA_GENERICA.md            ← Rúbrica detallada para exámenes
├── ARCHITECTURE.md                ← Diagrams y decisiones técnicas
├── API_SPEC.md                    ← Especificación de API endpoints
├── EJEMPLOS/
│   ├── examen_input_ejemplo.md   ← Ejemplo de archivo de entrada
│   ├── parsed_exam_ejemplo.json  ← Output del parser
│   ├── ai_analysis_ejemplo.json  ← Output de Claude
│   └── feedback_final_ejemplo.md ← Feedback enriquecido
└── TESTING/
    ├── test_cases.md             ← Casos de prueba
    └── validation_criteria.md    ← Criterios de validación
```

---

## 🛠️ Implementación por Fases

### Fase 1: Fundamentos (Semana 1)
**Objetivo**: Rúbrica + Parser funcionando

**Tasks**:
- [ ] Diseñar rúbrica genérica completa (5 dimensiones × 4 niveles)
- [ ] Implementar parser de archivos `.md`
- [ ] Lógica de búsqueda de estudiantes por apellido
- [ ] Unit tests del parser
- [ ] Documentar casos edge (apellidos compuestos, tildes, etc.)

**Entregables**:
- `evaluation_integration/RUBRICA_GENERICA.md`
- `src/lib/exam-parser.ts`
- `src/lib/student-matcher.ts`
- Tests: `__tests__/exam-parser.test.ts`

---

### Fase 2: Corrección AI (Semana 2)
**Objetivo**: Integración con Claude Haiku

**Tasks**:
- [ ] Adaptar `EducationalAnalyzer` para exámenes
- [ ] Crear `ExamAnalyzer` class
- [ ] Implementar prompt caching con rúbrica genérica
- [ ] Parser de respuesta JSON de Claude
- [ ] Cálculo de scores ponderados
- [ ] Testing con exámenes reales

**Entregables**:
- `src/services/ai/exam/analyzer.ts`
- `src/services/ai/exam/prompts/rubrica-generica.ts`
- Tests con mock de Claude API

---

### Fase 3: Enriquecimiento (Semana 2-3)
**Objetivo**: Feedback contextualizado

**Tasks**:
- [ ] Query de datos históricos (Feedback + Evaluation)
- [ ] Cálculo de tendencias y promedios
- [ ] Comparación predicción vs realidad
- [ ] Template de Markdown enriquecido
- [ ] Integración con formato actual

**Entregables**:
- `src/lib/feedback-enricher.ts`
- `src/lib/templates/exam-feedback.ts`
- Tests de enriquecimiento

---

### Fase 4: Persistencia (Semana 3)
**Objetivo**: Guardar en BD

**Tasks**:
- [ ] DB operations para Evaluation table
- [ ] Generación de IDs únicos
- [ ] Transaction handling
- [ ] Error recovery
- [ ] Logging completo

**Entregables**:
- `src/lib/db-operations-exam.ts`
- Tests de DB operations

---

### Fase 5: API Backend (Semana 3-4)
**Objetivo**: Endpoints para UI

**Tasks**:
- [ ] POST `/api/instructor/exams/upload` - Upload files
- [ ] POST `/api/instructor/exams/correct` - Start correction
- [ ] GET `/api/instructor/exams/status/:batchId` - Check progress
- [ ] GET `/api/instructor/exams/results/:evaluationId` - Get feedback
- [ ] Authentication & authorization
- [ ] Rate limiting

**Entregables**:
- `src/app/api/instructor/exams/upload/route.ts`
- `src/app/api/instructor/exams/correct/route.ts`
- `src/app/api/instructor/exams/status/[batchId]/route.ts`
- `src/app/api/instructor/exams/results/[evaluationId]/route.ts`

---

### Fase 6: UI Frontend (Semana 4-5)
**Objetivo**: Interface completa para instructores

**Tasks**:
- [ ] Página de upload con drag & drop
- [ ] Formulario de configuración
- [ ] Vista de progreso en tiempo real
- [ ] Tabla de resultados
- [ ] Preview de feedback
- [ ] Export a PDF

**Entregables**:
- `src/app/dashboard/instructor/exams/page.tsx`
- `src/components/instructor/ExamUploader.tsx`
- `src/components/instructor/ExamResults.tsx`
- `src/components/instructor/FeedbackPreview.tsx`

---

### Fase 7: Testing & Refinamiento (Semana 5-6)
**Objetivo**: Sistema production-ready

**Tasks**:
- [ ] Testing end-to-end con exámenes reales
- [ ] Validación con instructores
- [ ] Ajustes de rúbrica basados en feedback
- [ ] Performance optimization
- [ ] Error handling completo
- [ ] Documentation completa

**Entregables**:
- Test suite completo
- Documentación de usuario
- Guía de troubleshooting

---

## 💰 Estimación de Costos

### Costo por Examen

**Asumiendo**:
- 1 examen = 2-3 ejercicios
- Transcripción promedio: 1,000 tokens
- Rúbrica genérica (cacheable): 5,000 tokens
- Response esperado: 1,500 tokens

**Con Prompt Caching**:
```
Input (primera corrección):  6,000 tokens × $0.30/MTok = $0.0018
Output:                       1,500 tokens × $1.50/MTok = $0.00225
TOTAL PRIMERA:                                            $0.00405

Input (siguientes, cache hit): 1,000 tokens × $0.30/MTok = $0.0003
Output:                        1,500 tokens × $1.50/MTok = $0.00225
TOTAL CON CACHE:                                          $0.00255
```

**Batch de 30 exámenes**:
```
Primer examen:     $0.00405
29 exámenes:       29 × $0.00255 = $0.07395
TOTAL BATCH:                       $0.07800 ≈ $0.08

Costo unitario promedio: $0.0026 por examen
```

### Proyección Mensual

**Escenario conservador**:
- 4 cursos × 30 alumnos = 120 exámenes/mes
- Costo: 120 × $0.0026 = **$0.31/mes**

**Escenario alto**:
- 8 cursos × 30 alumnos × 2 exámenes/mes = 480 exámenes/mes
- Costo: 480 × $0.0026 = **$1.25/mes**

**Muy por debajo del presupuesto de $10/mes** ✅

---

## 🎯 Criterios de Éxito

### Métricas Técnicas

- **Accuracy de matching**: >95% de apellidos correctamente identificados
- **Parse success rate**: >98% de archivos parseados sin error
- **AI consistency**: Score variance <5 puntos en re-correcciones
- **Processing time**: <30s por examen (incluyendo enrichment)
- **API response time**: <3s para upload, <5s para status check

### Métricas de Calidad

- **Feedback relevance**: >90% de instructores aprueban el feedback
- **Error detection**: Sistema detecta >80% de errores conceptuales
- **Recommendation quality**: >75% de recomendaciones consideradas útiles
- **Student understanding**: >70% de estudiantes entienden el feedback

### Métricas de Negocio

- **Adoption rate**: >50% de instructores usan el sistema
- **Time saved**: Reducción de 80% en tiempo de corrección manual
- **Cost effectiveness**: <$0.01 por examen corregido
- **Scalability**: Soporta hasta 500 exámenes/mes sin degradación

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Apellidos Mal Identificados

**Probabilidad**: Media
**Impacto**: Alto (corrección asignada al estudiante equivocado)

**Mitigación**:
- Algoritmo fuzzy matching con threshold de 90%
- Lista de apellidos ambiguos (manual override)
- Preview UI antes de procesar
- Confirmación del instructor obligatoria

### Riesgo 2: Transcripciones Ambiguas

**Probabilidad**: Alta
**Impacto**: Medio (feedback de menor calidad)

**Mitigación**:
- Guidelines claras para transcripción
- Template de transcripción sugerido
- Parser robusto que tolera variaciones
- Feedback a instructor si parse es ambiguo

### Riesgo 3: Rúbrica Genérica Poco Específica

**Probabilidad**: Media
**Impacto**: Medio (feedback menos preciso)

**Mitigación**:
- Iteración continua de la rúbrica basada en feedback
- Opción futura de rúbricas específicas por materia
- Validación con instructores expertos
- A/B testing de diferentes versiones

### Riesgo 4: Costos Inesperadamente Altos

**Probabilidad**: Baja
**Impacto**: Medio

**Mitigación**:
- Prompt caching agresivo (rúbrica, contexto histórico)
- Monitoreo continuo de costos
- Alertas si costo >$0.01 por examen
- Optimización de prompts si es necesario

---

## 📚 Casos de Uso

### Caso 1: Examen de Física - Tiro Oblicuo

**Input**: `Gonzalez.md`
```markdown
# Examen de Física - Tiro Oblicuo

**Alumno**: González

## Ejercicio 1
Una pelota es lanzada con velocidad inicial de 20 m/s y ángulo de 30°.
Calcular alcance máximo.

**Desarrollo**:
Vox = 20 * cos(30°) = 17.32 m/s
Voy = 20 * sen(30°) = 10 m/s
t = 2 * Voy / g = 2 * 10 / 10 = 2s
Alcance = Vox * t = 17.32 * 2 = 34.64 m

## Ejercicio 2
[...]
```

**Output**: Feedback detallado con:
- Análisis de cada ejercicio
- Scores en 5 dimensiones
- Nota final: 85/100
- Comparación con reportes semanales previos
- Recomendaciones personalizadas

### Caso 2: Examen de Química - Estequiometría

**Input**: `DiBernardo.md` (apellido compuesto)
```markdown
# Examen de Química

**Alumno**: Di Bernardo

## Ejercicio 1
Balancear: H2 + O2 → H2O

**Respuesta**:
2 H2 + O2 → 2 H2O

[...]
```

**Output**: Sistema reconoce apellido compuesto, busca match en DB, genera feedback adaptado a química

---

## 🔄 Integraciones Futuras

### Fase 8 (Futura): Mejoras Avanzadas

1. **OCR Integration**
   - Permitir upload de PDFs/imágenes de exámenes escritos a mano
   - OCR automático → transcripción → corrección

2. **Rúbricas Personalizadas**
   - Instructores crean sus propias rúbricas
   - Sistema aprende de correcciones manuales
   - Ajuste automático de pesos

3. **Análisis Predictivo**
   - Predicción de rendimiento en próximo examen
   - Identificación temprana de estudiantes en riesgo
   - Recomendaciones de intervención

4. **Dashboard de Métricas**
   - Análisis de tendencias por curso
   - Comparación entre divisiones
   - Identificación de temas difíciles

5. **Export & Sharing**
   - Export a PDF con formato profesional
   - Compartir feedback directamente con estudiantes
   - Notificaciones automáticas

---

## 📞 Próximos Pasos Inmediatos

### Esta Semana:

1. **Revisar y aprobar este plan** ✅
2. **Crear rúbrica genérica detallada** (RUBRICA_GENERICA.md)
3. **Diseñar arquitectura técnica** (ARCHITECTURE.md)
4. **Preparar ejemplos de entrada/salida** (carpeta EJEMPLOS/)

### Próxima Semana:

1. Implementar parser de archivos
2. Implementar matcher de apellidos
3. Testing inicial con archivos de ejemplo
4. Ajustes basados en resultados

---

**Estado**: 📋 Plan aprobado pendiente
**Próxima revisión**: Después de Fase 1 (parser implementado)
**Owner**: Rodrigo Di Bernardo
**AI Assistant**: Claude Code (Sonnet 4.5)
