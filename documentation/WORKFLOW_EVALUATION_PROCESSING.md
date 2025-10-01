# 📚 WORKFLOW: Procesamiento de Evaluaciones con Retroalimentaciones

**Versión:** 1.0.0
**Fecha:** 2025-10-01
**Autor:** Sistema Intellego Platform
**Última actualización:** 2025-10-01

---

## 📋 Tabla de Contenidos

1. [Overview y Propósito](#1-overview-y-propósito)
2. [Pre-requisitos y Validación del Entorno](#2-pre-requisitos-y-validación-del-entorno)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Workflow Completo con Checkpoints](#4-workflow-completo-con-checkpoints)
5. [Formato de Archivos de Entrada](#5-formato-de-archivos-de-entrada)
6. [Scripts y Herramientas](#6-scripts-y-herramientas)
7. [Manejo de Errores y Rollback](#7-manejo-de-errores-y-rollback)
8. [Testing y Validación](#8-testing-y-validación)
9. [Consideraciones Multi-Asignatura](#9-consideraciones-multi-asignatura)
10. [Troubleshooting Guide](#10-troubleshooting-guide)
11. [Referencias Rápidas](#11-referencias-rápidas)

---

## 1. Overview y Propósito

### 🎯 Objetivo

Procesar archivos de retroalimentación en formato Markdown (.md) y almacenarlos de forma estructurada en la base de datos de Intellego Platform, permitiendo a los estudiantes visualizar evaluaciones detalladas de sus exámenes.

### 💡 Casos de Uso

- **Física 4to C** - Tiro Oblicuo (implementado)
- **Química** - Reacciones Redox
- **Matemática** - Derivadas e Integrales
- **Cualquier asignatura** con retroalimentaciones en markdown

### 🎓 Usuarios Impactados

- **Estudiantes:** Pueden visualizar sus evaluaciones con feedback detallado
- **Instructores:** Sistema de "View as Student" para verificar visualización
- **Administradores:** Procesan y cargan las evaluaciones masivamente

### 🔄 Flujo General

```
Archivos .md → Parsing (Claude Code) → JSON Estructurado → BD Local → Validación UI → BD Producción
```

---

## 2. Pre-requisitos y Validación del Entorno

### ✅ Checklist Pre-Ejecución

Ejecutar en orden antes de iniciar el workflow:

```bash
# 1. Verificar branch actual
git branch --show-current
# Debe estar en: feature/* o test/*

# 2. Verificar estructura de archivos críticos
ls -la prisma/migrations/create_evaluation_table.sql
ls -la src/types/evaluation.ts
ls -la src/app/api/student/evaluations/route.ts
ls -la src/components/student/EvaluationViewer.tsx

# 3. Verificar dependencias instaladas
grep -A3 "react-markdown" package.json
# Debe incluir: react-markdown, remark-gfm, rehype-raw

# 4. Verificar BD local existe
ls -la prisma/data/intellego.db

# 5. Verificar tabla Evaluation existe en local
sqlite3 prisma/data/intellego.db "SELECT name FROM sqlite_master WHERE type='table' AND name='Evaluation';"
# Debe retornar: Evaluation

# 6. Verificar servidor de desarrollo corriendo
curl -I http://localhost:3000
# Debe retornar: 200 OK
```

### 🔒 Backup Obligatorio

**CRÍTICO:** Siempre hacer backup antes de procesar evaluaciones.

```bash
# Backup BD local
cp prisma/data/intellego.db "prisma/data/backup_$(date +%Y%m%d_%H%M%S).db"

# Backup BD producción (usando Turso CLI)
turso db shell intellego-production ".backup backup_production_$(date +%Y%m%d_%H%M%S).db"
```

### 📁 Estructura de Directorios Esperada

```
/
├── Retroalimentaciones 4to C/       # ← Archivos .md de entrada (root del proyecto)
├── documentation/                    # ← Documentos como este
├── scripts/                          # ← Scripts de procesamiento
│   ├── parse-evaluation-feedbacks.ts
│   ├── insert-evaluations.ts
│   └── validate-evaluations.ts
├── prisma/
│   ├── data/intellego.db            # ← BD local
│   └── migrations/
│       └── create_evaluation_table.sql
└── src/
    ├── types/evaluation.ts
    ├── app/api/student/evaluations/
    └── components/student/EvaluationViewer.tsx
```

---

## 3. Arquitectura del Sistema

### 🗄️ Tabla Evaluation - Schema

```sql
CREATE TABLE IF NOT EXISTS Evaluation (
  id TEXT PRIMARY KEY,              -- UUID generado
  studentId TEXT NOT NULL,          -- FK → User.id
  subject TEXT NOT NULL,            -- "Física", "Química", etc.
  examDate TEXT NOT NULL,           -- ISO 8601: "2025-09-02"
  examTopic TEXT NOT NULL,          -- "Tiro Oblicuo", "Reacciones Redox"
  score INTEGER NOT NULL,           -- 0-100
  feedback TEXT NOT NULL,           -- Markdown completo
  createdBy TEXT NOT NULL,          -- FK → User.id (instructor)
  createdAt TEXT NOT NULL,          -- Timestamp de creación
  updatedAt TEXT NOT NULL,          -- Timestamp de última modificación
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);

-- Índices para performance
CREATE INDEX idx_evaluation_student ON Evaluation(studentId);
CREATE INDEX idx_evaluation_subject ON Evaluation(subject);
CREATE INDEX idx_evaluation_date ON Evaluation(examDate DESC);
```

### 📊 Tipos TypeScript

```typescript
// src/types/evaluation.ts
export interface Evaluation {
  id: string;
  studentId: string;
  subject: string;
  examDate: string;        // ISO 8601
  examTopic: string;
  score: number;           // 0-100
  feedback: string;        // Markdown completo
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Campos poblados por JOIN
  instructorName?: string;
  instructorEmail?: string;
}
```

### 🔗 Relaciones

```
User (STUDENT) ←─┐
                  ├─ Evaluation
User (INSTRUCTOR) ←┘

- Un estudiante tiene N evaluaciones
- Un instructor crea N evaluaciones
- CASCADE DELETE: Si se borra el estudiante, se borran sus evaluaciones
```

### 🎨 Componentes UI

```
/dashboard/student/evaluations
├── page.tsx                    # Lista de evaluaciones + filtros
└── EvaluationViewer.tsx       # Vista detallada con markdown renderizado

Navigation: Tab "📊 Evaluaciones" en dashboard de estudiante
```

---

## 4. Workflow Completo con Checkpoints

### 🚀 FASE 1: Preparación (Checkpoints 1-3)

#### ✅ Checkpoint 1: Backup de Bases de Datos

**Acción:**
```bash
# Local
cp prisma/data/intellego.db "prisma/data/backup_$(date +%Y%m%d_%H%M%S).db"

# Producción (Turso)
turso db shell intellego-production ".backup backup_production_$(date +%Y%m%d_%H%M%S).db"
```

**Validación:**
```bash
ls -lh prisma/data/backup_*.db
# Debe mostrar archivo reciente con tamaño > 0
```

**Rollback:** Si algo falla, restaurar con:
```bash
cp prisma/data/backup_YYYYMMDD_HHMMSS.db prisma/data/intellego.db
```

---

#### ✅ Checkpoint 2: Crear/Verificar Branch

**Acción:**
```bash
# Opción A: Crear nuevo branch
git checkout -b feature/evaluations-[MATERIA]-[FECHA]
# Ejemplo: feature/evaluations-fisica-20251001

# Opción B: Usar branch existente
git checkout feature/student-evaluations
```

**Validación:**
```bash
git branch --show-current
# NO debe ser 'main' o 'production'
```

**Rollback:**
```bash
git checkout main
```

---

#### ✅ Checkpoint 3: Validar Archivos .md en Directorio

**Acción:**
```bash
# Contar archivos .md
ls -1 *.md 2>/dev/null | wc -l

# Listar primeros 5 para verificar nomenclatura
ls -1 *.md | head -5
```

**Nomenclatura esperada:**
```
Apellido_Nombre_retroalimentacion_DDMMYYYY.md
```

**Ejemplos válidos:**
- `Abella_Martin_retroalimentacion_17092025.md` ✅
- `Aiello_Clara_retroalimentacion_17092025.md` ✅
- `Garcia_Canteli_Ulises_retroalimentacion_29092025.md` ✅

**Validación:**
- Todos los archivos deben terminar en `.md`
- Deben estar en el directorio raíz del proyecto o en carpeta específica
- Mínimo 1 archivo, máximo 100 archivos por batch

**Rollback:** No aplica (solo lectura)

---

### 📖 FASE 2: Análisis de Feedbacks (Checkpoints 4-6)

#### ✅ Checkpoint 4: Leer Todos los Archivos .md

**Acción en Claude Code:**
```
"Lee todos los archivos .md del directorio [NOMBRE] y muéstrame un resumen con:
- Nombre del archivo
- Primeras 3 líneas (para verificar formato)
- Tamaño aproximado"
```

**Validación:**
- Todos los archivos deben ser legibles
- No debe haber archivos vacíos
- Detectar archivos con formato inconsistente

**Rollback:** No aplica (solo lectura)

---

#### ✅ Checkpoint 5: Identificar las 6 Secciones Estándar

**Acción en Claude Code:**
```
"Para cada archivo .md, identifica y extrae las siguientes 6 secciones:
1. 📋 Header (nombre, materia, fecha, nota)
2. 📊 Progreso Histórico
3. 🔍 Análisis del Examen
4. 🎯 Validación/Comparación
5. 💡 Recomendaciones
6. 📈 Próximos Pasos

Genera un JSON con esta estructura para CADA archivo."
```

**Formato de salida esperado:**
```json
{
  "fileName": "Abella_Martin_retroalimentacion_17092025.md",
  "metadata": {
    "studentName": "Martin Bautista Abella",
    "subject": "Física",
    "examTopic": "Tiro Oblicuo",
    "examDate": "2025-09-02",
    "score": 58
  },
  "sections": {
    "header": "# RETROALIMENTACIÓN - MARTIN BAUTISTA ABELLA\n...",
    "historicalProgress": "## 📊 Tu Progreso Histórico:\n...",
    "examAnalysis": "## 🔍 Análisis de tu Examen:\n...",
    "validation": "## 🎯 Validación de tu Progreso:\n...",
    "recommendations": "## 💡 Recomendaciones Personalizadas:\n...",
    "nextSteps": "## 📈 Próximos Pasos:\n..."
  },
  "fullFeedback": "[CONTENIDO COMPLETO DEL MARKDOWN]"
}
```

**Validación:**
- Cada archivo debe generar 1 objeto JSON válido
- `score` debe estar entre 0-100
- `examDate` debe ser fecha válida en formato ISO 8601
- `fullFeedback` debe contener el markdown completo

**Rollback:** No aplica (solo análisis)

---

#### ✅ Checkpoint 6: Generar JSON Consolidado

**Acción en Claude Code:**
```
"Genera un archivo JSON consolidado llamado 'evaluations-data.json'
con TODOS los objetos anteriores en un array."
```

**Estructura final:**
```json
{
  "processDate": "2025-10-01T10:30:00Z",
  "totalFiles": 43,
  "subject": "Física",
  "evaluations": [
    { /* Objeto del Checkpoint 5 */ },
    { /* Objeto del Checkpoint 5 */ },
    // ... 43 objetos
  ]
}
```

**Validación:**
```bash
# Verificar archivo existe
ls -lh evaluations-data.json

# Validar JSON es válido
cat evaluations-data.json | jq '.totalFiles'
# Debe retornar: 43 (o el número correcto de archivos)
```

**Rollback:** Borrar archivo si es inválido:
```bash
rm evaluations-data.json
```

---

### 👤 FASE 3: Mapeo de Estudiantes (Checkpoints 7-9)

#### ✅ Checkpoint 7: Extraer Nombres de Archivos

**Acción en Claude Code:**
```
"Del JSON generado, extrae una lista única de nombres de estudiantes
y genera una tabla de mapeo para buscar en la BD."
```

**Formato esperado:**
```
| Nombre Archivo       | Nombre Completo          | Variaciones Posibles           |
|----------------------|--------------------------|--------------------------------|
| Abella_Martin        | Martin Bautista Abella   | Martin Abella, M. Abella       |
| Aiello_Clara         | Maria Clara Aiello       | Clara Aiello, M.C. Aiello      |
| Garcia_Canteli_Ulises| Ulises Garcia Canteli    | Ulises Garcia, Garcia Canteli  |
```

**Validación:**
- Lista debe tener tantas entradas como archivos .md
- No debe haber nombres duplicados exactos
- Identificar nombres compuestos (ej: Garcia_Canteli_Ulises)

**Rollback:** No aplica (solo análisis)

---

#### ✅ Checkpoint 8: Buscar studentId en BD

**Acción:**
```typescript
// Para cada nombre, buscar en BD
const students = await db().execute(`
  SELECT id, name, email, lastName, firstName
  FROM User
  WHERE role = 'STUDENT'
  AND (
    LOWER(name) LIKE '%${searchName}%' OR
    LOWER(lastName) LIKE '%${lastName}%'
  )
`);
```

**Query SQL útil:**
```sql
-- Buscar todos los estudiantes
SELECT id, name, email, lastName, firstName
FROM User
WHERE role = 'STUDENT'
ORDER BY lastName, firstName;

-- Buscar por nombre parcial
SELECT id, name, email
FROM User
WHERE role = 'STUDENT'
AND LOWER(name) LIKE '%abella%';
```

**Validación:**
- Cada nombre debe resolverse a exactamente 1 `studentId`
- Si hay 0 matches → Estudiante no existe en BD (ERROR)
- Si hay >1 matches → Ambigüedad, requiere decisión manual

**Output esperado:**
```json
{
  "matches": [
    {
      "fileName": "Abella_Martin_retroalimentacion_17092025.md",
      "studentId": "u_abc123xyz",
      "studentName": "Martin Bautista Abella",
      "email": "abella.martin@example.com",
      "confidence": "exact"
    }
  ],
  "unresolved": [
    {
      "fileName": "Doe_John_retroalimentacion_01102025.md",
      "searchName": "John Doe",
      "reason": "not_found_in_db"
    }
  ],
  "ambiguous": [
    {
      "fileName": "Garcia_Maria_retroalimentacion_01102025.md",
      "candidates": [
        { "id": "u_xyz1", "name": "Maria Garcia" },
        { "id": "u_xyz2", "name": "Maria Gabriela Garcia" }
      ]
    }
  ]
}
```

**Rollback:** No aplica (solo consulta)

---

#### ✅ Checkpoint 9: Resolver Conflictos Manualmente

**Acción:**

Para casos `unresolved` o `ambiguous`, crear tabla de mapeo manual:

```json
// manual-mappings.json
{
  "Doe_John_retroalimentacion_01102025.md": "u_manually_added_id_123",
  "Garcia_Maria_retroalimentacion_01102025.md": "u_xyz1"
}
```

**Validación:**
- 100% de archivos deben tener `studentId` asignado
- No puede haber `null` o `undefined` en studentId

**Rollback:** Editar `manual-mappings.json` si hay errores

---

### 💾 FASE 4: Inserción en BD (Checkpoints 10-12)

#### ✅ Checkpoint 10: Validar Integridad de Datos

**Acción:**

Script de validación pre-inserción:

```typescript
// scripts/validate-evaluations.ts
interface ValidationResult {
  valid: boolean;
  errors: Array<{
    fileName: string;
    field: string;
    error: string;
  }>;
}

function validateEvaluation(data: any): ValidationResult {
  const errors = [];

  // 1. studentId existe y es válido UUID/string
  if (!data.studentId || data.studentId.length < 5) {
    errors.push({ fileName: data.fileName, field: 'studentId', error: 'Invalid or missing' });
  }

  // 2. subject no vacío
  if (!data.metadata.subject || data.metadata.subject.trim() === '') {
    errors.push({ fileName: data.fileName, field: 'subject', error: 'Empty' });
  }

  // 3. score entre 0-100
  if (data.metadata.score < 0 || data.metadata.score > 100) {
    errors.push({ fileName: data.fileName, field: 'score', error: `Out of range: ${data.metadata.score}` });
  }

  // 4. examDate es fecha válida
  if (isNaN(Date.parse(data.metadata.examDate))) {
    errors.push({ fileName: data.fileName, field: 'examDate', error: 'Invalid date format' });
  }

  // 5. feedback no vacío
  if (!data.fullFeedback || data.fullFeedback.length < 100) {
    errors.push({ fileName: data.fileName, field: 'feedback', error: 'Too short or empty' });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

**Validación:**
```bash
npx tsx scripts/validate-evaluations.ts evaluations-data.json
```

**Output esperado:**
```
✅ Validation passed for 43/43 evaluations
   - 0 errors found
   - Ready for insertion
```

**Si hay errores:**
```
❌ Validation failed for 2/43 evaluations

Errors:
  - Abella_Martin_retroalimentacion_17092025.md
    └─ score: Out of range: 158

  - Doe_John_retroalimentacion_01102025.md
    └─ studentId: Invalid or missing

Fix these issues before proceeding.
```

**Rollback:** Corregir `evaluations-data.json` manualmente

---

#### ✅ Checkpoint 11: Insertar en BD Local Primero

**Acción:**

```typescript
// scripts/insert-evaluations.ts
import { createEvaluation } from '@/lib/db-operations';
import { randomUUID } from 'crypto';

async function insertEvaluations(dataPath: string, instructorId: string) {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const results = {
    success: [],
    failed: []
  };

  for (const evaluation of data.evaluations) {
    try {
      const result = await createEvaluation({
        studentId: evaluation.studentId,
        subject: evaluation.metadata.subject,
        examDate: evaluation.metadata.examDate,
        examTopic: evaluation.metadata.examTopic,
        score: evaluation.metadata.score,
        feedback: evaluation.fullFeedback,
        createdBy: instructorId
      });

      results.success.push({
        fileName: evaluation.fileName,
        evaluationId: result.id
      });

      console.log(`✅ ${evaluation.fileName} → ${result.id}`);

    } catch (error) {
      results.failed.push({
        fileName: evaluation.fileName,
        error: error.message
      });

      console.error(`❌ ${evaluation.fileName} → ${error.message}`);
    }
  }

  return results;
}
```

**Ejecución:**
```bash
# Nota: instructorId debe ser el ID del instructor que crea las evaluaciones
npx tsx scripts/insert-evaluations.ts evaluations-data.json "INSTRUCTOR_ID_HERE"
```

**Validación:**
```bash
# Verificar cantidad de evaluaciones insertadas
sqlite3 prisma/data/intellego.db "SELECT COUNT(*) FROM Evaluation WHERE subject = 'Física';"
# Debe retornar: 43 (o el número esperado)
```

**Rollback en caso de falla:**
```sql
-- Borrar todas las evaluaciones insertadas en este batch
DELETE FROM Evaluation
WHERE createdAt >= '2025-10-01 10:00:00'
AND subject = 'Física';
```

---

#### ✅ Checkpoint 12: Validar en UI (http://localhost:3000)

**Acción:**

1. Asegurarse que el servidor de desarrollo esté corriendo:
```bash
npm run dev
```

2. Abrir navegador en: http://localhost:3000

3. Hacer login con usuario de prueba:
   - Email: `RDB@test.com`
   - Password: [según configuración]

4. Navegar a: **Dashboard → 📊 Evaluaciones**

5. Verificar:
   - ✅ Se muestra la lista de evaluaciones
   - ✅ Las tarjetas tienen el color correcto según score:
     - Verde: score ≥ 80
     - Amarillo: 60 ≤ score < 80
     - Rojo: score < 60
   - ✅ Al hacer clic en una evaluación, se abre la vista detallada
   - ✅ El markdown se renderiza correctamente (negritas, listas, emojis)
   - ✅ El botón "Volver" funciona

**Validación visual:**

Tomar screenshots de:
1. Lista de evaluaciones
2. Vista detallada de una evaluación
3. Sección de markdown renderizado

**Rollback:** Si algo no funciona:
```bash
# Ver logs del servidor
# Buscar errores en la consola del navegador (F12)
# Verificar que la tabla Evaluation existe en BD local
```

---

### 🚀 FASE 5: Deploy a Producción (Checkpoints 13-15)

#### ✅ Checkpoint 13: Tests de Integración

**Acción:**

Ejecutar suite de tests antes de deploy:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build de producción
npm run build
```

**Validación:**
```
✓ Type checking passed (0 errors)
✓ Linting passed (0 warnings)
✓ Build successful
```

**Si hay errores:**
- Revisar mensajes de error
- Corregir archivos afectados
- Re-ejecutar tests

**Rollback:** No hacer deploy hasta que todos los tests pasen

---

#### ✅ Checkpoint 14: Migración a BD Producción

**ADVERTENCIA:** Este paso afecta la base de datos en producción. Proceder con extrema precaución.

**Pre-requisitos:**
- ✅ Checkpoint 13 completado exitosamente
- ✅ Backup de BD producción realizado
- ✅ Validación en local exitosa

**Acción:**

Opción A: Usar el mismo script pero apuntando a producción

```bash
# Configurar variables de entorno para producción
export TURSO_DATABASE_URL="libsql://intellego-production-xxx.turso.io"
export TURSO_AUTH_TOKEN="YOUR_PRODUCTION_TOKEN"

# Ejecutar script de inserción
npx tsx scripts/insert-evaluations.ts evaluations-data.json "INSTRUCTOR_ID_PROD"
```

Opción B: Usar el MCP de Turso para inserción controlada

```typescript
// Desde Claude Code, ejecutar con MCP turso-intellego
// Esto permite monitoreo en tiempo real
```

**Validación:**
```bash
# Verificar cantidad de evaluaciones en producción
turso db shell intellego-production "SELECT COUNT(*) FROM Evaluation WHERE subject = 'Física';"
```

**Monitoreo post-inserción:**
```bash
# Verificar últimas 5 evaluaciones insertadas
turso db shell intellego-production "
  SELECT id, studentId, subject, score, createdAt
  FROM Evaluation
  ORDER BY createdAt DESC
  LIMIT 5;
"
```

**Rollback en producción:**
```sql
-- SOLO SI ES ABSOLUTAMENTE NECESARIO
-- Borrar evaluaciones insertadas en este batch
DELETE FROM Evaluation
WHERE createdAt >= 'TIMESTAMP_INICIO_INSERCION'
AND subject = 'Física';
```

---

#### ✅ Checkpoint 15: Verificación Post-Deploy

**Acción:**

1. Abrir producción: https://intellego-platform.vercel.app

2. Hacer login con usuario real (NO de prueba)

3. Verificar acceso a evaluaciones:
   - ✅ Tab "Evaluaciones" visible
   - ✅ Lista de evaluaciones carga correctamente
   - ✅ Vista detallada funciona
   - ✅ Markdown renderiza correctamente

4. Verificar con 3 usuarios diferentes (alta, media, baja cantidad de evaluaciones)

5. Monitorear logs de Vercel:
```bash
# Usar MCP de Vercel
vercel logs --project=intellego-platform --follow
```

**Validación:**
- ✅ 0 errores en logs
- ✅ Tiempo de respuesta < 2 segundos
- ✅ Todos los usuarios pueden acceder

**Si hay errores críticos:**
```bash
# Rollback inmediato
git revert HEAD
git push origin main

# La auto-deploy de Vercel revertirá automáticamente
```

---

### 🧹 FASE 6: Limpieza (Checkpoints 16-17)

#### ✅ Checkpoint 16: Remover Endpoints Temporales

**Acción:**

Si se crearon endpoints de prueba/debug, removerlos:

```bash
# Identificar endpoints temporales
find src/app/api -name "*test*" -o -name "*debug*"

# Ejemplo de archivos a borrar:
# - src/app/api/test/insert-abella-evaluation/route.ts
# - src/app/api/test/insert-evaluation/route.ts
```

**Validación:**
```bash
npm run build
# Debe compilar sin errores
```

**Rollback:**
```bash
git restore src/app/api/test/
```

---

#### ✅ Checkpoint 17: Commit y Merge a Main

**Acción:**

```bash
# 1. Agregar cambios
git add .

# 2. Commit con mensaje descriptivo
git commit -m "FEAT: Add [SUBJECT] evaluations processing system

- Processed 43 evaluation feedbacks
- Added structured sections storage
- Implemented markdown rendering
- Tested with RDB@test.com user
- Validated in production

Related files:
- evaluations-data.json (processed)
- scripts/insert-evaluations.ts
- Retroalimentaciones 4to C/*.md"

# 3. Push a branch
git push origin feature/evaluations-fisica-20251001

# 4. Crear Pull Request en GitHub
gh pr create --title "FEAT: Física evaluations system" --body "..."

# 5. Merge a main (después de review)
gh pr merge --squash
```

**Validación:**
```bash
# Verificar PR fue mergeado
gh pr status

# Verificar deploy automático de Vercel completó
# Usar MCP de Vercel para monitorear
```

**Documentación final:**

Actualizar `PROJECT-HISTORY.md` con:
- Fecha de procesamiento
- Cantidad de evaluaciones agregadas
- Materia/asignatura
- Issues encontrados y resoluciones

---

## 5. Formato de Archivos de Entrada

### 📄 Nomenclatura de Archivos

**Formato obligatorio:**
```
Apellido_Nombre_retroalimentacion_DDMMYYYY.md
```

**Componentes:**
- `Apellido`: Apellido del estudiante (sin tildes preferiblemente)
- `Nombre`: Nombre del estudiante (puede ser compuesto)
- `DDMMYYYY`: Fecha del examen en formato día-mes-año

**Ejemplos válidos:**
```
✅ Abella_Martin_retroalimentacion_17092025.md
✅ Garcia_Canteli_Ulises_retroalimentacion_29092025.md
✅ Behmer_Cavallo_Brenda_retroalimentacion_18092025.md
```

**Ejemplos inválidos:**
```
❌ martin_abella_17092025.md         (falta "retroalimentacion")
❌ Abella_Martin_feedback.md         (no usa "retroalimentacion")
❌ Abella-Martin-retroalimentacion-17-09-2025.md  (usa guiones)
❌ Abella Martin retroalimentacion 17092025.md    (tiene espacios)
```

### 📋 Estructura de Secciones

#### Sección 1: 📋 Header (Obligatoria)

**Ubicación:** Primeras 5-10 líneas del archivo

**Elementos obligatorios:**
- Nombre completo del estudiante
- Materia/Asignatura
- Tema del examen
- Fecha del examen
- **Nota** (más importante)

**Formatos aceptados:**

```markdown
# RETROALIMENTACIÓN - MARTIN BAUTISTA ABELLA

## Examen: Física 4to C - Tiro Oblicuo
### Fecha: 2/9/2025
### Nota: 58/100
```

O bien:

```markdown
# RETROALIMENTACIÓN PERSONALIZADA
**Estudiante:** Barrera, Mateo
**Examen:** Física 4to C - Tiro Oblicuo
**Fecha de evaluación:** 29/09/2025
**Nota obtenida:** 42.7/100
```

**Extracción de datos:**
- **Nombre:** Buscar después de `#` o `Estudiante:`
- **Materia:** Buscar después de `Examen:` o similar
- **Nota:** Buscar patrón `Nota: XX/100` o `Nota obtenida: XX.X/100`
- **Fecha:** Buscar patrón `Fecha: DD/MM/YYYY` o `Fecha de evaluación:`

---

#### Sección 2: 📊 Progreso Histórico

**Identificadores:**
- `## 📊 Tu Progreso Histórico`
- `## ANÁLISIS COMPARATIVO CON TU HISTORIAL`
- `### Competencias Históricas`

**Contenido esperado:**
- Skills previos del alumno (comprensión, aplicación práctica, etc.)
- Tendencias (ascendente/descendente/estable)
- Promedio histórico

**Ejemplo:**

```markdown
## 📊 Tu Progreso Histórico:

Basado en tu seguimiento de las últimas 3 semanas:
- **Comprensión conceptual:** 58.0 (promedio últimas evaluaciones)
- **Aplicación práctica:** 55.3 (has tenido dificultades con ejercicios prácticos)
- **Pensamiento crítico:** 54.0 (necesitas fortalecer el análisis)
- **Autorregulación:** 57.0 (gestión del tiempo mejorable)
- **Metacognición:** 58.0 (reconoces tus áreas de mejora)
- **Promedio general previo:** 56.7

Tu historial muestra una tendencia descendente (68→55→48) que necesitamos revertir.
```

---

#### Sección 3: 🔍 Análisis Detallado del Examen

**Identificadores:**
- `## 🔍 Análisis de tu Examen`
- `## ANÁLISIS DETALLADO POR EJERCICIO`
- `### Ejercicio 1:`, `### Ejercicio 2:`

**Contenido esperado:**
- Desglose ejercicio por ejercicio
- Lo que se esperaba vs lo que demostró
- Errores específicos
- Aciertos destacados

**Ejemplo:**

```markdown
## 🔍 Análisis de tu Examen:

### Ejercicio 1: Jabalina - Alcance y altura máxima

**Lo que esperábamos de ti:** Con comprensión de 58%, esperábamos identificación básica del problema con algunas confusiones.

**Lo que demostraste:**
- ✅ Identificaste correctamente el tipo de problema (tiro oblicuo)
- ✅ Organizaste bien los datos
- ✅ Seleccionaste las fórmulas correctas
- ⚠️ Confusión en notación (Vo/Vc)
- ❌ No verificaste la razonabilidad de tus resultados

Tu cálculo fue correcto:
- Alcance: 14.37 m ✓
- Altura máxima: 1.31 m ✓
```

---

#### Sección 4: 🎯 Validación/Comparación

**Identificadores:**
- `## 🎯 Validación de tu Progreso`
- `## 💡 RETROALIMENTACIÓN ESPECÍFICA`
- `### Resumen de Predicciones vs Desempeño Real`

**Contenido esperado:**
- Comparación predicciones vs realidad
- Patrones identificados
- Nivel de confianza del sistema
- Aspectos positivos y negativos

**Ejemplo:**

```markdown
## 🎯 Validación de tu Progreso:

**Predicciones del sistema vs tu desempeño:**

| Skill | Predicción | Real | Estado |
|-------|-----------|------|--------|
| Comprensión | 58% | 60% | ✅ Alineado |
| Variables | 54% | 75% | 🔵 Sobre expectativa |
| Herramientas | 55% | 40% | 🔴 Bajo expectativa |

El sistema acertó en 3 de 5 predicciones (60% de precisión).
```

---

#### Sección 5: 💡 Recomendaciones Personalizadas

**Identificadores:**
- `## 💡 Recomendaciones Personalizadas`
- `## 🎯 PLAN DE MEJORA PERSONALIZADO`
- `### Prioridad ALTA:`, `### Prioridad MEDIA:`

**Contenido esperado:**
- Plan de acción concreto
- Prioridades (alta/media/baja)
- Recursos específicos
- Estrategias de estudio

**Ejemplo:**

```markdown
## 💡 Recomendaciones Personalizadas:

### 🔴 PRIORIDAD ALTA (próxima semana):

1. **Verificación de resultados:**
   - Después de cada cálculo, pregúntate: "¿Tiene sentido este resultado?"
   - Ejercicio práctico: Estima el resultado antes de calcular

2. **Refuerzo de fórmulas:**
   - Practica 5 ejercicios diarios de tiro oblicuo
   - Recursos: Capítulo 3.4 del libro, videos tutoriales

### 🟡 PRIORIDAD MEDIA (próximas 2 semanas):

1. **Fortalece tu comprensión conceptual:**
   - Lee la teoría antes de hacer ejercicios
   - Haz diagramas de cada problema
```

---

#### Sección 6: 📈 Próximos Pasos / Mensaje Final

**Identificadores:**
- `## 📈 Próximos Pasos`
- `## 📌 Mensaje Final`
- `## 🎓 MENSAJE FINAL PERSONALIZADO`

**Contenido esperado:**
- Metas específicas para próxima evaluación
- Mensaje motivacional
- Seguimiento recomendado
- Recursos adicionales

**Ejemplo:**

```markdown
## 📈 Próximos Pasos:

### Meta inmediata:

Para el próximo examen, tu objetivo es:
- **Objetivo principal:** Subir comprensión conceptual a 65%
- **Estrategia clave:** Verificar cada resultado antes de pasar al siguiente ejercicio
- **Indicador de éxito:** 0 errores de signo o unidades

### Plan específico para las próximas 2 semanas:

**Semana 1:**
- Lunes a Viernes: 30 minutos diarios de ejercicios
- Sábado: Repaso de teoría (1 hora)
- Domingo: Simulacro de examen

**Semana 2:**
- Practicar verificación en cada ejercicio
- Reunión con el docente (consultas)

## 📌 Mensaje Final:

Martín, tienes las herramientas matemáticas correctas. Tu desafío ahora es desarrollar el "olfato físico" para detectar errores. Confío en que con práctica deliberada mejorarás rápidamente.

¡Adelante! 🚀
```

---

### 🔄 Variaciones Aceptadas

El parser debe ser **flexible** para manejar:

1. **Emojis diferentes:**
   - `📊` vs `📈` vs `📉` (todos significan "progreso")
   - `🔍` vs `🔎` (análisis)
   - `💡` vs `🎯` (recomendaciones)

2. **Niveles de encabezado:**
   - `## Sección` vs `### Sección` (ambos válidos)

3. **Orden de secciones:**
   - No todos los archivos tienen las 6 secciones en el mismo orden
   - Algunas pueden estar fusionadas

4. **Nombres de secciones alternativos:**
   - "Progreso Histórico" = "Análisis Comparativo con Historial"
   - "Recomendaciones" = "Plan de Mejora"
   - "Mensaje Final" = "Próximos Pasos"

---

### ⚠️ Casos Especiales a Manejar

#### Caso 1: Archivo sin estructura clara

```markdown
# Feedback de Martín

Martín hizo bien el ejercicio 1 pero mal el 2. Nota: 65.
Debería estudiar más la teoría.
```

**Acción:**
- Marcar como "estructura_no_estandar"
- Procesar como `fullFeedback` sin dividir en secciones
- Notificar en log para revisión manual

---

#### Caso 2: Notas con múltiples formatos

```markdown
Nota: 58/100
Nota obtenida: 42.7/100
Score: 85
Calificación: 7.5 (sobre 10)
```

**Acción:**
- Parsear con regex: `(\d+\.?\d*)\s*[/\(]?\s*(\d+)?`
- Normalizar siempre a escala 0-100
- Si es sobre 10: multiplicar × 10

---

#### Caso 3: Archivos muy largos (>50KB)

**Ejemplo:** `Pasarin_Matilde_retroalimentacion_30092025.md` (53KB)

**Acción:**
- Almacenar completo en `feedback` (campo TEXT sin límite)
- Advertencia en log sobre tamaño
- Verificar que el componente `EvaluationViewer` maneja scrolling

---

## 6. Scripts y Herramientas

### 📝 Script 1: `parse-evaluation-feedbacks.ts`

**Ubicación:** `scripts/parse-evaluation-feedbacks.ts`

**Propósito:** Leer archivos .md, identificar secciones, generar JSON estructurado

**Uso:**
```bash
npx tsx scripts/parse-evaluation-feedbacks.ts [DIRECTORIO] [OUTPUT_JSON]

# Ejemplo:
npx tsx scripts/parse-evaluation-feedbacks.ts "Retroalimentaciones 4to C" evaluations-data.json
```

**Implementación sugerida:**

```typescript
import fs from 'fs';
import path from 'path';

interface EvaluationData {
  fileName: string;
  metadata: {
    studentName: string;
    subject: string;
    examTopic: string;
    examDate: string;
    score: number;
  };
  sections: {
    header: string;
    historicalProgress: string;
    examAnalysis: string;
    validation: string;
    recommendations: string;
    nextSteps: string;
  };
  fullFeedback: string;
}

function parseEvaluationFile(filePath: string): EvaluationData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Extraer metadata del header
  const metadata = extractMetadata(content);

  // Identificar secciones
  const sections = identifySections(content);

  return {
    fileName,
    metadata,
    sections,
    fullFeedback: content
  };
}

function extractMetadata(content: string): EvaluationData['metadata'] {
  // Regex para nombre
  const nameMatch = content.match(/(?:RETROALIMENTACIÓN|Estudiante).*?[-:]\s*(.+?)(?:\n|$)/i);
  const studentName = nameMatch ? nameMatch[1].trim() : '';

  // Regex para materia
  const subjectMatch = content.match(/(?:Examen|Materia):\s*(.+?)(?:\s+-|$)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';

  // Regex para tema
  const topicMatch = content.match(/(?:Examen|Tema):\s*.+?-\s*(.+?)(?:\n|$)/i);
  const examTopic = topicMatch ? topicMatch[1].trim() : '';

  // Regex para fecha
  const dateMatch = content.match(/Fecha.*?:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const examDate = dateMatch ? convertToISODate(dateMatch[1]) : '';

  // Regex para nota
  const scoreMatch = content.match(/Nota.*?:\s*(\d+\.?\d*)\s*\/?\s*100/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

  return { studentName, subject, examTopic, examDate, score };
}

function identifySections(content: string): EvaluationData['sections'] {
  // Dividir por encabezados de segundo nivel
  const sections = content.split(/(?=^#{2,3}\s+)/m);

  const result = {
    header: '',
    historicalProgress: '',
    examAnalysis: '',
    validation: '',
    recommendations: '',
    nextSteps: ''
  };

  // Buscar cada sección por palabras clave
  for (const section of sections) {
    const lowerSection = section.toLowerCase();

    if (lowerSection.includes('progreso histórico') || lowerSection.includes('historial')) {
      result.historicalProgress = section.trim();
    } else if (lowerSection.includes('análisis') && lowerSection.includes('examen')) {
      result.examAnalysis = section.trim();
    } else if (lowerSection.includes('validación') || lowerSection.includes('comparación')) {
      result.validation = section.trim();
    } else if (lowerSection.includes('recomendaciones') || lowerSection.includes('plan de mejora')) {
      result.recommendations = section.trim();
    } else if (lowerSection.includes('próximos pasos') || lowerSection.includes('mensaje final')) {
      result.nextSteps = section.trim();
    }
  }

  // Header es el contenido antes de la primera sección
  result.header = content.split(/#{2,3}\s+/)[0].trim();

  return result;
}

function convertToISODate(dateStr: string): string {
  // Convertir DD/MM/YYYY a YYYY-MM-DD
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Main execution
async function main() {
  const [,, directory, outputPath] = process.argv;

  if (!directory || !outputPath) {
    console.error('Usage: npx tsx parse-evaluation-feedbacks.ts [DIRECTORY] [OUTPUT_JSON]');
    process.exit(1);
  }

  const files = fs.readdirSync(directory)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(directory, f));

  console.log(`📂 Found ${files.length} markdown files`);

  const evaluations: EvaluationData[] = [];

  for (const filePath of files) {
    try {
      console.log(`📖 Parsing ${path.basename(filePath)}...`);
      const data = parseEvaluationFile(filePath);
      evaluations.push(data);
      console.log(`   ✅ Score: ${data.metadata.score}, Date: ${data.metadata.examDate}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  const output = {
    processDate: new Date().toISOString(),
    totalFiles: evaluations.length,
    subject: evaluations[0]?.metadata.subject || 'Unknown',
    evaluations
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Generated ${outputPath}`);
  console.log(`   Total evaluations: ${evaluations.length}`);
}

main().catch(console.error);
```

**Output esperado:**

```json
{
  "processDate": "2025-10-01T14:30:00.000Z",
  "totalFiles": 43,
  "subject": "Física",
  "evaluations": [
    {
      "fileName": "Abella_Martin_retroalimentacion_17092025.md",
      "metadata": {
        "studentName": "Martin Bautista Abella",
        "subject": "Física",
        "examTopic": "Tiro Oblicuo",
        "examDate": "2025-09-02",
        "score": 58
      },
      "sections": {
        "header": "# RETROALIMENTACIÓN - MARTIN BAUTISTA ABELLA\n...",
        "historicalProgress": "## 📊 Tu Progreso Histórico:\n...",
        "examAnalysis": "## 🔍 Análisis de tu Examen:\n...",
        "validation": "## 🎯 Validación de tu Progreso:\n...",
        "recommendations": "## 💡 Recomendaciones Personalizadas:\n...",
        "nextSteps": "## 📈 Próximos Pasos:\n..."
      },
      "fullFeedback": "[MARKDOWN COMPLETO]"
    }
    // ... 42 more
  ]
}
```

---

### 💾 Script 2: `insert-evaluations.ts`

**Ubicación:** `scripts/insert-evaluations.ts`

**Propósito:** Leer JSON generado, mapear estudiantes, insertar en BD

**Uso:**
```bash
npx tsx scripts/insert-evaluations.ts [JSON_PATH] [INSTRUCTOR_ID] [--dry-run]

# Dry run (no inserta, solo muestra qué haría)
npx tsx scripts/insert-evaluations.ts evaluations-data.json INSTRUCTOR_ID --dry-run

# Inserción real
npx tsx scripts/insert-evaluations.ts evaluations-data.json INSTRUCTOR_ID
```

**Implementación sugerida:**

```typescript
import fs from 'fs';
import { db } from '@/lib/db';
import { createEvaluation } from '@/lib/db-operations';
import { randomUUID } from 'crypto';

interface InsertionResult {
  success: Array<{ fileName: string; evaluationId: string; studentId: string }>;
  failed: Array<{ fileName: string; error: string; studentName: string }>;
  unresolved: Array<{ fileName: string; reason: string; studentName: string }>;
}

async function findStudentByName(name: string): Promise<string | null> {
  // Normalizar nombre para búsqueda
  const normalized = name.toLowerCase().trim();

  // Intentar búsqueda exacta primero
  let result = await db().execute({
    sql: `SELECT id FROM User WHERE role = 'STUDENT' AND LOWER(name) = ?`,
    args: [normalized]
  });

  if (result.rows.length === 1) {
    return result.rows[0].id as string;
  }

  // Intentar por apellido
  const lastNameMatch = name.split(' ').pop()?.toLowerCase();
  result = await db().execute({
    sql: `SELECT id, name FROM User WHERE role = 'STUDENT' AND LOWER(lastName) LIKE ?`,
    args: [`%${lastNameMatch}%`]
  });

  if (result.rows.length === 1) {
    return result.rows[0].id as string;
  }

  // Intentar búsqueda parcial por nombre completo
  result = await db().execute({
    sql: `SELECT id, name FROM User WHERE role = 'STUDENT' AND LOWER(name) LIKE ?`,
    args: [`%${normalized}%`]
  });

  if (result.rows.length === 1) {
    return result.rows[0].id as string;
  }

  // No se pudo resolver
  return null;
}

async function insertEvaluations(
  jsonPath: string,
  instructorId: string,
  dryRun: boolean = false
): Promise<InsertionResult> {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const result: InsertionResult = {
    success: [],
    failed: [],
    unresolved: []
  };

  console.log(`\n📊 Processing ${data.evaluations.length} evaluations`);
  console.log(`👨‍🏫 Instructor ID: ${instructorId}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE INSERTION'}\n`);

  for (const evaluation of data.evaluations) {
    const { fileName, metadata, fullFeedback } = evaluation;

    console.log(`\n📄 ${fileName}`);
    console.log(`   Student: ${metadata.studentName}`);
    console.log(`   Score: ${metadata.score}`);

    // Buscar studentId
    const studentId = await findStudentByName(metadata.studentName);

    if (!studentId) {
      console.log(`   ❌ Student not found in database`);
      result.unresolved.push({
        fileName,
        reason: 'student_not_found',
        studentName: metadata.studentName
      });
      continue;
    }

    console.log(`   ✅ Mapped to studentId: ${studentId}`);

    if (dryRun) {
      console.log(`   ⚠️  DRY RUN: Would insert evaluation`);
      result.success.push({ fileName, evaluationId: 'dry-run-id', studentId });
      continue;
    }

    // Insertar en BD
    try {
      const insertedEvaluation = await createEvaluation({
        studentId,
        subject: metadata.subject,
        examDate: metadata.examDate,
        examTopic: metadata.examTopic,
        score: metadata.score,
        feedback: fullFeedback,
        createdBy: instructorId
      });

      console.log(`   ✅ Inserted with ID: ${insertedEvaluation.id}`);
      result.success.push({
        fileName,
        evaluationId: insertedEvaluation.id,
        studentId
      });

    } catch (error) {
      console.log(`   ❌ Insertion failed: ${error.message}`);
      result.failed.push({
        fileName,
        error: error.message,
        studentName: metadata.studentName
      });
    }
  }

  return result;
}

async function main() {
  const [,, jsonPath, instructorId, ...flags] = process.argv;

  if (!jsonPath || !instructorId) {
    console.error('Usage: npx tsx insert-evaluations.ts [JSON_PATH] [INSTRUCTOR_ID] [--dry-run]');
    process.exit(1);
  }

  const dryRun = flags.includes('--dry-run');

  const result = await insertEvaluations(jsonPath, instructorId, dryRun);

  // Reporte final
  console.log('\n' + '='.repeat(60));
  console.log('📊 INSERTION REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${result.success.length}`);
  console.log(`❌ Failed: ${result.failed.length}`);
  console.log(`⚠️  Unresolved: ${result.unresolved.length}`);

  if (result.failed.length > 0) {
    console.log('\n❌ Failed insertions:');
    result.failed.forEach(f => {
      console.log(`   - ${f.fileName}: ${f.error}`);
    });
  }

  if (result.unresolved.length > 0) {
    console.log('\n⚠️  Unresolved students:');
    result.unresolved.forEach(u => {
      console.log(`   - ${u.fileName}: ${u.studentName} (${u.reason})`);
    });
    console.log('\nCreate manual-mappings.json to resolve these.');
  }

  // Guardar reporte
  const reportPath = `insertion-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

main().catch(console.error);
```

---

### ✅ Script 3: `validate-evaluations.ts`

**Ubicación:** `scripts/validate-evaluations.ts`

**Propósito:** Verificar integridad de datos antes de inserción

**Uso:**
```bash
npx tsx scripts/validate-evaluations.ts [JSON_PATH]

# Ejemplo:
npx tsx scripts/validate-evaluations.ts evaluations-data.json
```

**Implementación sugerida:**

```typescript
import fs from 'fs';

interface ValidationError {
  fileName: string;
  field: string;
  error: string;
  value?: any;
}

function validateEvaluations(jsonPath: string): {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
} {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const evaluation of data.evaluations) {
    const { fileName, metadata, fullFeedback } = evaluation;

    // Validación 1: Score entre 0-100
    if (metadata.score < 0 || metadata.score > 100) {
      errors.push({
        fileName,
        field: 'score',
        error: 'Out of valid range (0-100)',
        value: metadata.score
      });
    }

    // Validación 2: Fecha válida
    if (isNaN(Date.parse(metadata.examDate))) {
      errors.push({
        fileName,
        field: 'examDate',
        error: 'Invalid date format',
        value: metadata.examDate
      });
    }

    // Validación 3: Subject no vacío
    if (!metadata.subject || metadata.subject.trim() === '') {
      errors.push({
        fileName,
        field: 'subject',
        error: 'Empty or missing',
        value: metadata.subject
      });
    }

    // Validación 4: Feedback no vacío
    if (!fullFeedback || fullFeedback.length < 100) {
      errors.push({
        fileName,
        field: 'feedback',
        error: 'Too short or empty (min 100 chars)',
        value: fullFeedback?.length || 0
      });
    }

    // Validación 5: studentName no vacío
    if (!metadata.studentName || metadata.studentName.trim() === '') {
      errors.push({
        fileName,
        field: 'studentName',
        error: 'Empty or missing',
        value: metadata.studentName
      });
    }

    // Warning 1: Fecha futura
    if (new Date(metadata.examDate) > new Date()) {
      warnings.push({
        fileName,
        field: 'examDate',
        error: 'Date is in the future',
        value: metadata.examDate
      });
    }

    // Warning 2: Feedback muy largo (>100KB)
    if (fullFeedback.length > 100000) {
      warnings.push({
        fileName,
        field: 'feedback',
        error: 'Very large feedback (>100KB)',
        value: `${(fullFeedback.length / 1024).toFixed(2)} KB`
      });
    }

    // Warning 3: Score sospechosamente bajo
    if (metadata.score < 20) {
      warnings.push({
        fileName,
        field: 'score',
        error: 'Unusually low score',
        value: metadata.score
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function main() {
  const [,, jsonPath] = process.argv;

  if (!jsonPath) {
    console.error('Usage: npx tsx validate-evaluations.ts [JSON_PATH]');
    process.exit(1);
  }

  console.log(`\n🔍 Validating ${jsonPath}...\n`);

  const { valid, errors, warnings } = validateEvaluations(jsonPath);

  if (errors.length > 0) {
    console.log('❌ VALIDATION FAILED\n');
    console.log(`Found ${errors.length} critical error(s):\n`);

    errors.forEach(e => {
      console.log(`  📄 ${e.fileName}`);
      console.log(`     └─ ${e.field}: ${e.error}`);
      if (e.value !== undefined) {
        console.log(`        Current value: ${JSON.stringify(e.value)}`);
      }
      console.log('');
    });

    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);

    warnings.forEach(w => {
      console.log(`  📄 ${w.fileName}`);
      console.log(`     └─ ${w.field}: ${w.error}`);
      if (w.value !== undefined) {
        console.log(`        Value: ${JSON.stringify(w.value)}`);
      }
      console.log('');
    });
  }

  console.log('✅ VALIDATION PASSED');
  console.log('   All critical validations passed.');
  console.log('   Safe to proceed with insertion.\n');
}

main().catch(console.error);
```

---

## 7. Manejo de Errores y Rollback

### 🚨 Error 1: Archivo .md Malformado

**Síntoma:**
```
❌ Abella_Martin_retroalimentacion_17092025.md
   └─ feedback: Too short or empty (min 100 chars)
```

**Causas posibles:**
- Archivo está vacío
- Contenido corrupto
- Codificación incorrecta

**Diagnóstico:**
```bash
# Verificar tamaño
ls -lh Abella_Martin_retroalimentacion_17092025.md

# Ver contenido
head -20 Abella_Martin_retroalimentacion_17092025.md

# Verificar codificación
file Abella_Martin_retroalimentacion_17092025.md
```

**Solución:**
1. **Si el archivo está corrupto:** Re-exportar desde la fuente original
2. **Si es codificación:** Convertir a UTF-8:
   ```bash
   iconv -f ISO-8859-1 -t UTF-8 archivo.md > archivo_utf8.md
   ```
3. **Si falta contenido:** Contactar al instructor para obtener versión completa

**Rollback:** Skip el archivo en el procesamiento, continuar con los demás.

---

### 🚨 Error 2: Estudiante No Encontrado

**Síntoma:**
```
⚠️  Unresolved students:
   - Garcia_Maria_retroalimentacion_01102025.md: Maria Garcia (student_not_found)
```

**Causas posibles:**
- Estudiante no está registrado en BD
- Nombre mal escrito en archivo
- Nombre difiere entre archivo y BD

**Diagnóstico:**
```bash
# Buscar en BD por nombre parcial
sqlite3 prisma/data/intellego.db "
  SELECT id, name, email, lastName, firstName
  FROM User
  WHERE role = 'STUDENT'
  AND (
    LOWER(name) LIKE '%maria%' OR
    LOWER(lastName) LIKE '%garcia%'
  );
"
```

**Solución:**

Crear archivo `manual-mappings.json`:
```json
{
  "Garcia_Maria_retroalimentacion_01102025.md": {
    "studentId": "u_abc123xyz",
    "note": "Mapped to Maria Gabriela Garcia"
  }
}
```

Modificar script `insert-evaluations.ts` para leer este archivo primero:
```typescript
// Al inicio del script
let manualMappings = {};
if (fs.existsSync('manual-mappings.json')) {
  manualMappings = JSON.parse(fs.readFileSync('manual-mappings.json', 'utf-8'));
}

// En la función insertEvaluations, antes de buscar en BD:
if (manualMappings[fileName]) {
  studentId = manualMappings[fileName].studentId;
  console.log(`   ✅ Mapped via manual-mappings.json`);
}
```

**Rollback:** Remover entrada de `manual-mappings.json` si es incorrecta.

---

### 🚨 Error 3: Falla en Inserción a BD

**Síntoma:**
```
❌ Insertion failed: SQLITE_CONSTRAINT: FOREIGN KEY constraint failed
```

**Causas posibles:**
- `studentId` no existe en tabla `User`
- `createdBy` (instructorId) no existe
- Violación de constraint único (duplicate key)

**Diagnóstico:**
```bash
# Verificar que studentId existe
sqlite3 prisma/data/intellego.db "SELECT id, name FROM User WHERE id = 'u_abc123xyz';"

# Verificar que instructorId existe
sqlite3 prisma/data/intellego.db "SELECT id, name FROM User WHERE id = 'INSTRUCTOR_ID';"

# Verificar si ya existe evaluación para ese estudiante/examen
sqlite3 prisma/data/intellego.db "
  SELECT id, studentId, subject, examDate, score
  FROM Evaluation
  WHERE studentId = 'u_abc123xyz'
  AND subject = 'Física'
  AND examDate = '2025-09-02';
"
```

**Solución:**

1. **Si es FK constraint:**
   - Verificar IDs son correctos
   - Crear usuario si no existe (raro, pero posible)

2. **Si es duplicate:**
   - Decidir: ¿Actualizar evaluación existente o skip?
   - Modificar script para detectar duplicates:
   ```typescript
   // Antes de insertar
   const existing = await db().execute({
     sql: `SELECT id FROM Evaluation
           WHERE studentId = ? AND subject = ? AND examDate = ?`,
     args: [studentId, metadata.subject, metadata.examDate]
   });

   if (existing.rows.length > 0) {
     console.log(`   ⚠️  Evaluation already exists, skipping`);
     continue;
   }
   ```

**Rollback:**

Si se insertaron N evaluaciones antes de fallar:
```sql
-- Borrar las últimas N evaluaciones insertadas
DELETE FROM Evaluation
WHERE id IN (
  SELECT id FROM Evaluation
  ORDER BY createdAt DESC
  LIMIT N
);
```

O más seguro, por rango de tiempo:
```sql
DELETE FROM Evaluation
WHERE createdAt >= '2025-10-01 10:00:00'
AND createdAt <= '2025-10-01 10:30:00'
AND subject = 'Física';
```

---

### 🚨 Error 4: Producción Difiere de Local

**Síntoma:**

Después de insertar en local, al replicar en producción hay discrepancias:
```
Local DB: 43 evaluations
Production DB: 38 evaluations
```

**Causas posibles:**
- Algunos estudiantes no existen en producción
- Constraint violations en producción
- Diferencias en datos de User entre local y producción

**Diagnóstico:**
```bash
# Comparar conteos
sqlite3 prisma/data/intellego.db "SELECT COUNT(*) FROM Evaluation WHERE subject = 'Física';"
turso db shell intellego-production "SELECT COUNT(*) FROM Evaluation WHERE subject = 'Física';"

# Identificar qué falta
sqlite3 prisma/data/intellego.db "SELECT studentId, score FROM Evaluation WHERE subject = 'Física' ORDER BY studentId;"
turso db shell intellego-production "SELECT studentId, score FROM Evaluation WHERE subject = 'Física' ORDER BY studentId;"

# Buscar diferencias en User table
sqlite3 prisma/data/intellego.db "SELECT COUNT(*) FROM User WHERE role = 'STUDENT';"
turso db shell intellego-production "SELECT COUNT(*) FROM User WHERE role = 'STUDENT';"
```

**Solución:**

1. **Generar reporte de diferencias:**
```typescript
// Script: compare-dbs.ts
async function compareDatabases() {
  const localEvaluations = await localDb.execute('SELECT * FROM Evaluation WHERE subject = "Física"');
  const prodEvaluations = await prodDb.execute('SELECT * FROM Evaluation WHERE subject = "Física"');

  const localIds = new Set(localEvaluations.rows.map(r => r.id));
  const prodIds = new Set(prodEvaluations.rows.map(r => r.id));

  const missingInProd = [...localIds].filter(id => !prodIds.has(id));
  const extraInProd = [...prodIds].filter(id => !localIds.has(id));

  console.log(`Missing in production: ${missingInProd.length}`);
  console.log(`Extra in production: ${extraInProd.length}`);

  return { missingInProd, extraInProd };
}
```

2. **Sincronizar selectivamente:**
```typescript
// Insertar solo las que faltan en producción
for (const evalId of missingInProd) {
  const evaluation = localEvaluations.find(e => e.id === evalId);
  // Insertar en producción
}
```

**Rollback:**

Si la sincronización falla, restaurar producción desde backup:
```bash
turso db shell intellego-production ".restore backup_production_YYYYMMDD_HHMMSS.db"
```

---

### 🔄 Procedimiento General de Rollback

**Escenario 1: Error en Fase de Parsing (no destructivo)**
- No requiere rollback, solo corregir archivos y re-ejecutar

**Escenario 2: Error en Inserción Local**
```bash
# Restaurar BD local desde backup
cp prisma/data/backup_YYYYMMDD_HHMMSS.db prisma/data/intellego.db

# O borrar solo las evaluaciones insertadas en esta sesión
sqlite3 prisma/data/intellego.db "
  DELETE FROM Evaluation
  WHERE createdAt >= 'TIMESTAMP_INICIO'
  AND subject = 'Física';
"
```

**Escenario 3: Error en Producción (CRÍTICO)**
```bash
# Opción A: Restaurar backup completo (destructivo)
turso db shell intellego-production ".restore backup_production_YYYYMMDD_HHMMSS.db"

# Opción B: Borrar solo las evaluaciones problemáticas
turso db shell intellego-production "
  DELETE FROM Evaluation
  WHERE createdAt >= 'TIMESTAMP_INICIO'
  AND subject = 'Física';
"

# Opción C: Revertir git commit y auto-deploy
git revert HEAD
git push origin main
# Vercel auto-deploys la versión anterior
```

**Escenario 4: UI rota en producción**
```bash
# Rollback inmediato vía git
git log --oneline -5
git revert COMMIT_SHA
git push origin main

# Monitorear Vercel para confirmar deploy
vercel logs --follow
```

---

## 8. Testing y Validación

### ✅ Test 1: Usuario de Prueba (RDB@test.com)

**Pre-requisitos:**
- Usuario RDB@test.com existe en BD local
- Al menos 1 evaluación insertada para este usuario

**Pasos:**

1. **Insertar evaluación de prueba:**
```bash
npx tsx scripts/insert-evaluations.ts test-data/RDB_evaluation.json INSTRUCTOR_ID
```

2. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

3. **Hacer login:**
   - URL: http://localhost:3000/auth/signin
   - Email: RDB@test.com
   - Password: [según configuración]

4. **Navegar a Evaluaciones:**
   - Click en tab **📊 Evaluaciones** en dashboard

5. **Verificar lista:**
   - ✅ Se muestra al menos 1 evaluación
   - ✅ Tarjeta tiene color correcto según score:
     - Verde: score ≥ 80
     - Amarillo: 60 ≤ score < 80
     - Rojo: score < 60
   - ✅ Se muestra materia, tema, fecha
   - ✅ Score visible y correcto

6. **Abrir evaluación:**
   - Click en tarjeta
   - ✅ Se abre vista detallada
   - ✅ Header muestra: materia, tema, fecha, score
   - ✅ Botón "Volver" visible

7. **Verificar renderizado de markdown:**
   - ✅ Encabezados (`#`, `##`) se renderizan correctamente
   - ✅ Negritas (`**text**`) funcionan
   - ✅ Listas (`-`, `1.`) se muestran
   - ✅ Emojis se ven correctamente
   - ✅ Tablas (si hay) se renderizan
   - ✅ No hay código markdown "crudo" visible

8. **Botón "Volver":**
   - Click en "Volver a Evaluaciones"
   - ✅ Regresa a lista de evaluaciones

**Validación exitosa:**
```
✅ Test 1: RDB@test.com user
   - Login successful
   - Evaluations list visible
   - Card color correct
   - Detail view renders markdown correctly
   - Back button works
```

---

### ✅ Test 2: Filtro por Materia

**Pasos:**

1. Insertar evaluaciones de múltiples materias para RDB@test.com:
   - Física (1 evaluación)
   - Química (1 evaluación)

2. Hacer login como RDB@test.com

3. En lista de evaluaciones:
   - ✅ Se muestran ambas evaluaciones (Física y Química)

4. Usar filtro de materia:
   - Seleccionar "Física" en dropdown
   - ✅ Solo se muestran evaluaciones de Física
   - Seleccionar "Química"
   - ✅ Solo se muestran evaluaciones de Química
   - Seleccionar "Todas"
   - ✅ Se muestran todas las evaluaciones

**Validación exitosa:**
```
✅ Test 2: Subject filtering
   - All subjects visible by default
   - Física filter works
   - Química filter works
   - "All" filter shows all evaluations
```

---

### ✅ Test 3: Permisos (Student vs Instructor)

**Escenario A: Estudiante accede a sus propias evaluaciones**

1. Login como estudiante (ej: RDB@test.com)
2. Navegar a /dashboard/student/evaluations
3. ✅ Ve solo SUS evaluaciones
4. ✅ No ve evaluaciones de otros estudiantes

**Escenario B: Estudiante intenta acceder a evaluación de otro**

1. Obtener ID de evaluación de otro estudiante
2. Intentar: http://localhost:3000/api/student/evaluations?id=OTHER_EVAL_ID
3. ✅ Recibe error 403 (Forbidden)

**Escenario C: Instructor en modo impersonación**

1. Login como instructor
2. Activar "View as Student" para RDB@test.com
3. Navegar a /dashboard/student/evaluations
4. ✅ Ve evaluaciones del estudiante impersonado
5. ✅ NO ve evaluaciones de otros estudiantes

**Validación exitosa:**
```
✅ Test 3: Permissions
   - Students see only their own evaluations
   - Access to other students' evaluations denied (403)
   - Instructor impersonation works correctly
```

---

### ✅ Test 4: Markdown Rendering Edge Cases

**Pasos:**

1. Crear evaluación de prueba con casos especiales:

```markdown
# Test Evaluation

## Emojis
📊 📈 🔍 💡 🎯 ✅ ❌ ⚠️

## Tablas
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Listas anidadas
- Item 1
  - Subitem 1.1
  - Subitem 1.2
- Item 2

## Código inline
La fórmula es: `v = v0 + at`

## Negritas y cursivas
**Negrita** y *cursiva* y ***ambas***

## Links
Ver [documentación](https://example.com)

## HTML (si rehypeRaw está configurado)
<span style="color: red;">Texto en rojo</span>
```

2. Insertar como evaluación de prueba

3. Visualizar en UI

4. Verificar que TODOS los elementos se renderizan correctamente

**Validación exitosa:**
```
✅ Test 4: Markdown rendering
   - Emojis display correctly
   - Tables render with borders
   - Nested lists work
   - Inline code has monospace font
   - Bold and italic text styles applied
   - Links are clickable
   - HTML renders (if enabled)
```

---

### ✅ Test 5: Performance con Evaluaciones Largas

**Objetivo:** Verificar que evaluaciones >50KB se manejan correctamente

**Pasos:**

1. Usar evaluación real larga (ej: Pasarin_Matilde - 53KB)

2. Insertar en BD local

3. Abrir en UI

4. Medir tiempos:
   - Tiempo de carga de lista: < 2 segundos
   - Tiempo de carga de detalle: < 3 segundos
   - Scroll suave (sin lag)

5. Verificar memoria:
   - Abrir DevTools → Performance
   - Grabar mientras se navega
   - Verificar no hay memory leaks

**Validación exitosa:**
```
✅ Test 5: Performance
   - List loads in < 2s
   - Detail loads in < 3s
   - Smooth scrolling
   - No memory leaks detected
```

---

### ✅ Test 6: Responsive Design (Mobile)

**Pasos:**

1. Abrir en navegador: http://localhost:3000

2. Activar DevTools → Toggle device toolbar (Ctrl+Shift+M)

3. Probar en:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)

4. Verificar:
   - ✅ Lista de evaluaciones se adapta (cards en columna)
   - ✅ Vista detallada usa ancho completo
   - ✅ Botones son clickeables (tamaño mínimo 44px)
   - ✅ Texto legible (font-size ≥ 14px)
   - ✅ No hay overflow horizontal

**Validación exitosa:**
```
✅ Test 6: Responsive design
   - iPhone SE: Layout adapts correctly
   - iPhone 12 Pro: All elements visible
   - iPad: Uses available space efficiently
   - No horizontal overflow
   - Touch targets adequate size
```

---

## 9. Consideraciones Multi-Asignatura

### 📚 Materias Soportadas

El sistema está diseñado para funcionar con **cualquier asignatura**. Ejemplos:

- **Física** (implementado)
- **Química**
- **Matemática**
- **Biología**
- **Historia**
- **Literatura**
- etc.

### 🔧 Configuración por Materia

Cada procesamiento de evaluaciones debe especificar la materia:

```typescript
// En evaluations-data.json
{
  "subject": "Química",  // ← Especificar materia aquí
  "evaluations": [...]
}
```

### 📁 Organización de Archivos

**Recomendado:** Usar carpetas separadas por materia

```
/
├── Retroalimentaciones Física 4to C/
│   ├── Abella_Martin_retroalimentacion_17092025.md
│   └── ...
├── Retroalimentaciones Química 4to C/
│   ├── Abella_Martin_retroalimentacion_20102025.md
│   └── ...
└── Retroalimentaciones Matemática 4to C/
    └── ...
```

### 🎯 Ejecución Multi-Materia

**Opción A: Procesar una materia a la vez (recomendado)**

```bash
# Física
npx tsx scripts/parse-evaluation-feedbacks.ts "Retroalimentaciones Física 4to C" evaluations-fisica.json
npx tsx scripts/insert-evaluations.ts evaluations-fisica.json INSTRUCTOR_ID

# Química (después)
npx tsx scripts/parse-evaluation-feedbacks.ts "Retroalimentaciones Química 4to C" evaluations-quimica.json
npx tsx scripts/insert-evaluations.ts evaluations-quimica.json INSTRUCTOR_ID
```

**Opción B: Batch multi-materia (avanzado)**

```bash
# Crear script wrapper
./process-all-subjects.sh
```

Contenido de `process-all-subjects.sh`:
```bash
#!/bin/bash

SUBJECTS=("Física" "Química" "Matemática")
INSTRUCTOR_ID="YOUR_INSTRUCTOR_ID"

for subject in "${SUBJECTS[@]}"; do
  echo "📚 Processing $subject..."

  DIR="Retroalimentaciones $subject 4to C"
  OUTPUT="evaluations-${subject,,}.json"  # lowercase

  if [ ! -d "$DIR" ]; then
    echo "⚠️  Directory not found: $DIR"
    continue
  fi

  # Parse
  npx tsx scripts/parse-evaluation-feedbacks.ts "$DIR" "$OUTPUT"

  # Validate
  npx tsx scripts/validate-evaluations.ts "$OUTPUT"

  # Insert (dry-run first)
  npx tsx scripts/insert-evaluations.ts "$OUTPUT" "$INSTRUCTOR_ID" --dry-run

  # Confirm before proceeding
  read -p "Proceed with insertion for $subject? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx tsx scripts/insert-evaluations.ts "$OUTPUT" "$INSTRUCTOR_ID"
  fi

  echo "✅ $subject completed\n"
done
```

### 🔄 Mapeo de Nombres de Materias

Si los nombres difieren entre archivos y lo que se quiere en BD:

```typescript
// En parse-evaluation-feedbacks.ts
const SUBJECT_MAPPING = {
  'Fisica': 'Física',
  'Quimica': 'Química',
  'Matematica': 'Matemática',
  'Biology': 'Biología',
  'History': 'Historia'
};

function normalizeSubject(rawSubject: string): string {
  return SUBJECT_MAPPING[rawSubject] || rawSubject;
}
```

### 👨‍🏫 Múltiples Instructores

Si diferentes materias tienen diferentes instructores:

```typescript
// Crear mappings por materia
const INSTRUCTOR_BY_SUBJECT = {
  'Física': 'instructor-id-fisica',
  'Química': 'instructor-id-quimica',
  'Matemática': 'instructor-id-matematica'
};

// En insert-evaluations.ts
const instructorId = INSTRUCTOR_BY_SUBJECT[metadata.subject] || DEFAULT_INSTRUCTOR_ID;
```

### 📊 Filtrado en UI

El componente de evaluaciones ya soporta filtrado por materia:

```typescript
// src/app/dashboard/student/evaluations/page.tsx
const [subjectFilter, setSubjectFilter] = useState<string>('all');

// Obtener lista de materias únicas
const uniqueSubjects = [...new Set(evaluations.map(e => e.subject))];

// Dropdown para filtrar
<select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
  <option value="all">Todas las materias</option>
  {uniqueSubjects.map(subject => (
    <option key={subject} value={subject}>{subject}</option>
  ))}
</select>
```

---

## 10. Troubleshooting Guide

### 🚨 Problema: "no such table: Evaluation"

**Síntoma:**
```
Error: SQLITE_ERROR: no such table: Evaluation
```

**Causa:**
La tabla Evaluation no existe en la base de datos donde se está ejecutando la query.

**Diagnóstico:**
```bash
# Verificar si tabla existe en BD local
sqlite3 prisma/data/intellego.db "SELECT name FROM sqlite_master WHERE type='table' AND name='Evaluation';"

# Verificar en producción
turso db shell intellego-production "SELECT name FROM sqlite_master WHERE type='table' AND name='Evaluation';"
```

**Solución:**

**Para BD local:**
```bash
sqlite3 prisma/data/intellego.db < prisma/migrations/create_evaluation_table.sql
```

**Para BD producción:**
```bash
turso db shell intellego-production < prisma/migrations/create_evaluation_table.sql
```

**Verificación:**
```bash
sqlite3 prisma/data/intellego.db "SELECT COUNT(*) FROM Evaluation;"
# Debe retornar 0 (si no hay datos aún) sin error
```

---

### 🚨 Problema: "Student not found"

**Síntoma:**
```
⚠️  Unresolved students:
   - Abella_Martin_retroalimentacion_17092025.md: Martin Bautista Abella (student_not_found)
```

**Causa:**
- Estudiante no existe en BD
- Nombre difiere entre archivo y BD
- Búsqueda no encuentra coincidencia

**Diagnóstico:**
```bash
# Buscar estudiante por nombre parcial
sqlite3 prisma/data/intellego.db "
  SELECT id, name, email, lastName, firstName
  FROM User
  WHERE role = 'STUDENT'
  AND LOWER(name) LIKE '%martin%';
"

# Listar todos los estudiantes para comparar
sqlite3 prisma/data/intellego.db "
  SELECT id, name, email
  FROM User
  WHERE role = 'STUDENT'
  ORDER BY name;
"
```

**Solución:**

**Opción 1: Crear archivo de mapeo manual**
```json
// manual-mappings.json
{
  "Abella_Martin_retroalimentacion_17092025.md": {
    "studentId": "u_abc123xyz",
    "note": "Martin's full name in DB is 'Martin Bautista Abella'"
  }
}
```

**Opción 2: Mejorar lógica de búsqueda**

Modificar `findStudentByName()` en `insert-evaluations.ts` para ser más flexible:
```typescript
// Intentar múltiples estrategias
// 1. Buscar por lastName primero
// 2. Buscar por firstName
// 3. Buscar por combinaciones
```

**Opción 3: Crear estudiante en BD (si realmente no existe)**
```sql
INSERT INTO User (id, name, email, role, lastName, firstName)
VALUES (
  'new-student-id',
  'Martin Bautista Abella',
  'abella.martin@example.com',
  'STUDENT',
  'Abella',
  'Martin Bautista'
);
```

---

### 🚨 Problema: Markdown No Renderiza Correctamente

**Síntoma:**
- Se ve texto crudo: `**Negrita**` en lugar de **Negrita**
- Emojis no se ven
- Tablas no tienen formato

**Causa:**
- Dependencias de markdown no instaladas
- Plugins no configurados
- Componente no usa `ReactMarkdown`

**Diagnóstico:**
```bash
# Verificar dependencias instaladas
npm list react-markdown remark-gfm rehype-raw

# Debe mostrar:
# ├── react-markdown@9.0.1
# ├── remark-gfm@4.0.0
# └── rehype-raw@7.0.0
```

**Solución:**

**1. Instalar dependencias:**
```bash
npm install react-markdown remark-gfm rehype-raw
```

**2. Verificar configuración en `EvaluationViewer.tsx`:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw]}
  className="prose prose-slate max-w-none"
>
  {evaluation.feedback}
</ReactMarkdown>
```

**3. Agregar estilos Tailwind Typography:**
```bash
npm install @tailwindcss/typography
```

En `tailwind.config.ts`:
```typescript
plugins: [
  require('@tailwindcss/typography'),
],
```

---

### 🚨 Problema: Producción vs Local Desynced

**Síntoma:**
```
Local DB: 43 evaluations for Física
Production DB: 38 evaluations for Física
```

**Causa:**
- Inserción parcial falló en producción
- Algunos estudiantes no existen en producción
- Rollback parcial

**Diagnóstico:**

**Script de comparación:**
```bash
# Crear archivo compare-dbs.sh
#!/bin/bash

echo "Local evaluations:"
sqlite3 prisma/data/intellego.db "
  SELECT studentId, subject, score, examDate
  FROM Evaluation
  WHERE subject = 'Física'
  ORDER BY studentId, examDate;
" > local-evaluations.txt

echo "Production evaluations:"
turso db shell intellego-production "
  SELECT studentId, subject, score, examDate
  FROM Evaluation
  WHERE subject = 'Física'
  ORDER BY studentId, examDate;
" > prod-evaluations.txt

echo "Differences:"
diff local-evaluations.txt prod-evaluations.txt
```

**Solución:**

**Opción 1: Re-insertar solo las que faltan**

```typescript
// Script: sync-missing.ts
async function syncMissing() {
  const localEvals = await getLocalEvaluations();
  const prodEvals = await getProdEvaluations();

  const missing = localEvals.filter(le =>
    !prodEvals.some(pe =>
      pe.studentId === le.studentId &&
      pe.examDate === le.examDate
    )
  );

  console.log(`Found ${missing.length} evaluations missing in production`);

  for (const evaluation of missing) {
    await insertToProd(evaluation);
  }
}
```

**Opción 2: Borrar y re-insertar todo**

```bash
# Borrar todas las evaluaciones de Física en producción
turso db shell intellego-production "DELETE FROM Evaluation WHERE subject = 'Física';"

# Re-insertar desde JSON
npx tsx scripts/insert-evaluations.ts evaluations-fisica.json INSTRUCTOR_ID
```

---

### 🚨 Problema: Servidor de Desarrollo No Inicia

**Síntoma:**
```bash
npm run dev
# Error: EADDRINUSE: address already in use :::3000
```

**Causa:**
Puerto 3000 ya está en uso por otro proceso.

**Diagnóstico:**
```bash
# Buscar proceso usando puerto 3000
lsof -ti:3000

# Matar proceso (macOS/Linux)
kill -9 $(lsof -ti:3000)

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**Solución:**

**Opción 1: Matar proceso anterior**
```bash
kill -9 $(lsof -ti:3000)
npm run dev
```

**Opción 2: Usar puerto diferente**
```bash
PORT=3001 npm run dev
```

---

### 🚨 Problema: Error de TypeScript en Build

**Síntoma:**
```bash
npm run build
# Error: Type 'string | undefined' is not assignable to type 'string'
```

**Causa:**
Tipos no compatibles, probablemente en código nuevo.

**Diagnóstico:**
```bash
# Ver errores específicos
npm run type-check
```

**Solución:**

Revisar archivos con errores y corregir tipos:

```typescript
// Antes (error)
const studentId = session.user.id;

// Después (correcto)
const studentId = session.user?.id || '';
```

O usar type guards:
```typescript
if (!session?.user?.id) {
  throw new Error('User ID required');
}
const studentId = session.user.id; // Ahora TypeScript sabe que no es undefined
```

---

### 🚨 Problema: Git Merge Conflicts

**Síntoma:**
```bash
git merge main
# CONFLICT (content): Merge conflict in src/app/api/student/evaluations/route.ts
```

**Diagnóstico:**
```bash
git status
# Will show files with conflicts
```

**Solución:**

**1. Ver conflictos:**
```bash
git diff
```

**2. Resolver manualmente:**

Abrir archivo con conflictos, buscar:
```
<<<<<<< HEAD
[Tu código]
=======
[Código de main]
>>>>>>> main
```

Editar para quedarte con el código correcto.

**3. Marcar como resuelto:**
```bash
git add src/app/api/student/evaluations/route.ts
git commit -m "MERGE: Resolve conflicts in evaluations route"
```

**Prevención:**

Antes de mergear, siempre hacer:
```bash
git checkout main
git pull
git checkout feature/tu-branch
git merge main
# Resolver conflictos ANTES de hacer PR
```

---

## 11. Referencias Rápidas

### 📝 Comandos Git Esenciales

```bash
# Crear branch
git checkout -b feature/evaluations-fisica-20251001

# Ver status
git status

# Agregar cambios
git add .

# Commit
git commit -m "FEAT: Add Física evaluations"

# Push
git push origin feature/evaluations-fisica-20251001

# Crear PR (con GitHub CLI)
gh pr create --title "Física evaluations" --body "Adds 43 evaluations"

# Merge PR
gh pr merge --squash

# Revertir commit
git revert HEAD
git push

# Ver log
git log --oneline -10

# Cambiar a main
git checkout main
git pull
```

### 🗄️ Queries SQL Útiles

```sql
-- Contar evaluaciones por materia
SELECT subject, COUNT(*) as total
FROM Evaluation
GROUP BY subject;

-- Ver últimas 5 evaluaciones
SELECT
  e.id,
  u.name as studentName,
  e.subject,
  e.score,
  e.examDate
FROM Evaluation e
JOIN User u ON e.studentId = u.id
ORDER BY e.createdAt DESC
LIMIT 5;

-- Buscar evaluación específica
SELECT * FROM Evaluation
WHERE studentId = 'u_abc123'
AND subject = 'Física';

-- Borrar evaluaciones de una materia
DELETE FROM Evaluation WHERE subject = 'Física';

-- Estadísticas de notas
SELECT
  subject,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score,
  COUNT(*) as total
FROM Evaluation
GROUP BY subject;

-- Buscar estudiantes sin evaluaciones
SELECT u.id, u.name, u.email
FROM User u
WHERE u.role = 'STUDENT'
AND u.id NOT IN (SELECT DISTINCT studentId FROM Evaluation);

-- Evaluaciones duplicadas (mismo estudiante, materia, fecha)
SELECT studentId, subject, examDate, COUNT(*) as duplicates
FROM Evaluation
GROUP BY studentId, subject, examDate
HAVING COUNT(*) > 1;
```

### 🔗 Endpoints API

```bash
# GET evaluations para estudiante autenticado
GET /api/student/evaluations
# Query params: ?subject=Física&id=eval-id

# Responses:
# 200: { evaluations: Evaluation[], total: number }
# 401: Unauthorized
# 403: Forbidden
# 404: Evaluation not found (cuando ?id=...)

# Ejemplo con curl:
curl -H "Cookie: next-auth.session-token=XXX" \
  "http://localhost:3000/api/student/evaluations?subject=Física"
```

### 📁 Archivos Críticos del Sistema

```
src/
├── types/evaluation.ts                      # Tipos TypeScript
├── app/
│   ├── api/student/evaluations/route.ts    # API endpoint
│   └── dashboard/student/
│       └── evaluations/page.tsx            # Página principal
├── components/student/
│   └── EvaluationViewer.tsx                # Componente de vista detallada
└── lib/
    ├── db.ts                                # Cliente de BD
    └── db-operations.ts                     # Funciones de BD

prisma/
├── data/intellego.db                        # BD local
└── migrations/
    └── create_evaluation_table.sql          # Migración

scripts/
├── parse-evaluation-feedbacks.ts            # Parser
├── insert-evaluations.ts                    # Inserción
└── validate-evaluations.ts                  # Validación
```

### 🎨 Tailwind Classes Útiles

```typescript
// Colores por score
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// Prose para markdown
className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700"

// Card genérica
className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"

// Button primario
className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"

// Badge
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
```

### 📊 Monitoreo y Logs

```bash
# Logs de desarrollo (Next.js)
npm run dev
# Ver consola para errores

# Logs de Vercel (producción)
vercel logs --follow

# Ver deployment status
vercel list

# Ver logs de build
vercel logs --build

# BD local - ver schema
sqlite3 prisma/data/intellego.db ".schema Evaluation"

# BD producción - ejecutar query
turso db shell intellego-production "SELECT COUNT(*) FROM Evaluation;"
```

### 🔐 Variables de Entorno

```bash
# .env.local (para desarrollo local)
TURSO_DATABASE_URL=file:./prisma/data/intellego.db
# No necesita TURSO_AUTH_TOKEN para archivo local

# .env (para producción, NO commitear)
TURSO_DATABASE_URL=libsql://intellego-production-xxx.turso.io
TURSO_AUTH_TOKEN=ey...
NEXTAUTH_URL=https://intellego-platform.vercel.app
NEXTAUTH_SECRET=xxx
```

### 📞 Contactos y Soporte

- **Repositorio:** GitHub - [repositorio-intellego]
- **Producción:** https://intellego-platform.vercel.app
- **Vercel Project:** intellego-platform
- **Turso DB:** intellego-production

---

## 🎓 Conclusión

Este workflow está diseñado para ser:

✅ **Ejecutable:** Cualquier Claude Code puede seguirlo paso a paso
✅ **Seguro:** Múltiples checkpoints y validaciones previenen errores
✅ **Flexible:** Funciona con cualquier materia/asignatura
✅ **Completo:** Cubre desde parsing hasta deploy en producción
✅ **Robusto:** Incluye manejo de errores y procedimientos de rollback

**Próximos pasos sugeridos:**

1. **Ejecutar este workflow** con las retroalimentaciones de Física 4to C
2. **Documentar resultados** en PROJECT-HISTORY.md
3. **Replicar para otras materias** (Química, Matemática, etc.)
4. **Iterar y mejorar** basándose en feedback de usuarios

---

**Última actualización:** 2025-10-01
**Versión del documento:** 1.0.0
**Mantener actualizado:** Sí, después de cada ejecución exitosa del workflow
