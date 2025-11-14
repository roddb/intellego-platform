# 📊 Reporte de Cobertura de Exámenes

**Generado**: 31 de Octubre de 2025
**Script**: `check_missing_exams.py`

---

## 🎯 Objetivo

Verificar que todos los estudiantes de un curso tengan los exámenes que les corresponden.

---

## 📋 Análisis Manual (Basado en consultas MCP)

### Estudiantes por Curso

| Curso | División | Total Estudiantes |
|-------|----------|-------------------|
| 4to Año | C | 35 |
| 4to Año | D | 28 |
| 4to Año | E | 29 |
| 5to Año | A | 22 |
| 5to Año | B | 28 |
| 5to Año | C | 1 |
| 5to Año | D | 33 |

---

## 🔍 Exámenes Recientes (30-31 Oct 2025)

### 1. Química 4to E - Gases Ideales (31/10/2025)

- **Estudiantes con examen**: 3
- **Total en 4to E**: 29
- **Faltantes**: 26 estudiantes (10.3% completado)
- **Estado**: ⚠️ **INCOMPLETO - Posiblemente en progreso**

---

### 2. Física 5to A - Termodinámica (30/10/2025)

**PROBLEMA**: Hay dos variaciones del tema:

| Variación | Estudiantes |
|-----------|-------------|
| "Termodinámica" | 13 |
| "Termoedinámica" | 9 |
| **TOTAL** | **22** |

- **Total en 5to A**: 22
- **Estado**: ✅ **COMPLETO** (considerando ambas variaciones)
- **Acción requerida**: Normalizar nombre del tema en BD

---

### 3. Química 5to A - Equilibrio Químico (30/10/2025)

**PROBLEMA**: Hay dos variaciones del tema:

| Variación | Estudiantes |
|-----------|-------------|
| "Equilibrio Químico" | 17 |
| "Equilibrio Quimico" (sin tilde) | 2 |
| **TOTAL** | **19** |

- **Total en 5to A**: 22
- **Faltantes**: 3 estudiantes (86.4% completado)
- **Estado**: ⚠️ **CASI COMPLETO**
- **Acción requerida**:
  1. Normalizar nombre del tema
  2. Verificar 3 estudiantes faltantes

---

### 4. Química 5to B - Equilibrio Químico (30/10/2025)

**PROBLEMA**: Hay dos variaciones del tema:

| Variación | Estudiantes |
|-----------|-------------|
| "Equilibrio Químico" | 15 |
| "Equilibrio Quimico" (sin tilde) | 7 |
| **TOTAL** | **22** |

- **Total en 5to B**: 28
- **Faltantes**: 6 estudiantes (78.6% completado)
- **Estado**: ⚠️ **INCOMPLETO**
- **Acción requerida**:
  1. Normalizar nombre del tema
  2. Verificar 6 estudiantes faltantes

---

## 🐛 Problemas Detectados

### 1. Inconsistencia en Nombres de Temas

**Ejemplos**:
- "Termodinámica" vs "Termoedinámica"
- "Equilibrio Químico" vs "Equilibrio Quimico"
- "Gases Ideales" vs "Gases Idelaes"

**Impacto**: Dificulta el conteo preciso de estudiantes

**Solución**:
1. Normalizar nombres en la BD (script de corrección)
2. Validar entrada en el script de importación
3. Usar normalización en queries (remover tildes para comparación)

---

### 2. Múltiples Fechas para Mismo Examen

**Ejemplo - Química 4to C - Gases Ideales**:
- 01/10/2025: 21 estudiantes ("Gases Ideales")
- 01/10/2025: 8 estudiantes ("Gases Idelaes")
- 04/10/2025: 2 estudiantes
- Total: 31 estudiantes (35 esperados)

**Pregunta**: ¿Son correcciones en diferentes fechas o exámenes diferentes?

---

### 3. Exámenes Duplicados del Mismo Día

**Ejemplo - Química 5to A - 07/10/2025**:
- 9 estudiantes registrados

Pero sabemos que el 30/10/2025 hubo 19 estudiantes (17+2).

**Pregunta**: ¿Es el mismo examen re-tomado o exámenes diferentes?

---

## ✅ Cómo Usar el Script Python

### Opción 1: Análisis Manual con MCP Queries

```sql
-- 1. Ver todos los exámenes de un curso específico
SELECT
  e.subject,
  e.examTopic,
  e.examDate,
  COUNT(DISTINCT e.studentId) as students_with_exam
FROM Evaluation e
JOIN User u ON e.studentId = u.id
WHERE u.role = 'STUDENT'
  AND e.subject LIKE '%5to A%'
GROUP BY e.subject, e.examTopic, e.examDate
ORDER BY e.examDate DESC;

-- 2. Ver qué estudiantes TIENEN un examen específico
SELECT
  u.name,
  u.studentId,
  e.score,
  e.examDate
FROM Evaluation e
JOIN User u ON e.studentId = u.id
WHERE e.subject = 'Química 5to A'
  AND e.examTopic LIKE '%Equilibrio%'
  AND e.examDate = '2025-10-30'
ORDER BY u.name;

-- 3. Ver qué estudiantes NO TIENEN un examen específico
SELECT
  u.name,
  u.studentId,
  u.academicYear,
  u.division
FROM User u
WHERE u.role = 'STUDENT'
  AND u.academicYear = '5to Año'
  AND u.division = 'A'
  AND u.id NOT IN (
    SELECT DISTINCT e.studentId
    FROM Evaluation e
    WHERE e.subject = 'Química 5to A'
      AND e.examTopic LIKE '%Equilibrio%'
      AND e.examDate = '2025-10-30'
  )
ORDER BY u.name;
```

### Opción 2: Script Python Automatizado

El script `check_missing_exams.py` requiere:

1. **Instalar dependencias** (si usas libsql):
   ```bash
   pip3 install libsql-experimental
   ```

2. **Configurar variables de entorno**:
   ```bash
   export TURSO_DATABASE_URL="..."
   export TURSO_AUTH_TOKEN="..."
   ```

3. **Ejecutar**:
   ```bash
   python3 scripts/check_missing_exams.py --export-json --show-details
   ```

---

## 🎯 Recomendaciones

### Inmediatas

1. **Normalizar nombres de temas** en la BD
   - Crear script de normalización
   - Consolidar variaciones (ej: todas a "Equilibrio Químico")

2. **Verificar estudiantes faltantes** en exámenes recientes
   - Química 5to A: 3 faltantes
   - Química 5to B: 6 faltantes
   - Química 4to E: 26 faltantes (posiblemente en progreso)

### A Futuro

1. **Validación en import script**
   - Normalizar temas antes de guardar
   - Prevenir typos

2. **Dashboard de cobertura**
   - Vista para instructores: % completitud por examen
   - Alertas de estudiantes faltantes

3. **Automatización**
   - Script semanal de verificación
   - Notificaciones automáticas

---

## 📝 Consultas SQL Útiles

### Ver exámenes duplicados (mismo estudiante, mismo examen, misma fecha)

```sql
SELECT
  u.name,
  u.studentId,
  e.subject,
  e.examTopic,
  e.examDate,
  COUNT(*) as count,
  GROUP_CONCAT(e.id) as exam_ids
FROM Evaluation e
JOIN User u ON e.studentId = u.id
GROUP BY e.studentId, e.subject, e.examTopic, e.examDate
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Ver estudiantes con exámenes de cursos incorrectos

```sql
SELECT
  u.name,
  u.studentId,
  u.academicYear,
  u.division,
  e.subject,
  e.examDate
FROM Evaluation e
JOIN User u ON e.studentId = u.id
WHERE u.role = 'STUDENT'
  AND (
    (e.subject LIKE '%5to A%' AND (u.academicYear != '5to Año' OR u.division != 'A'))
    OR (e.subject LIKE '%4to C%' AND (u.academicYear != '4to Año' OR u.division != 'C'))
    -- Agregar más patrones según necesites
  )
ORDER BY u.name;
```

---

**Generado por**: Claude Code
**Fecha**: 2025-10-31
**Versión**: 1.0
