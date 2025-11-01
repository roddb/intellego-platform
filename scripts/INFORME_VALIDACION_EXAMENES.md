# Informe de Validación de Exámenes - Intellego Platform

**Fecha**: 31 de Octubre de 2025
**Analista**: Claude Code
**Solicitante**: Rodrigo Di Bernardo

---

## 📊 Resumen Ejecutivo

Se detectó un problema crítico en el sistema de asignación de exámenes. **8 exámenes están incorrectamente asignados** a estudiantes que no corresponden al curso/división especificado en el examen.

### Caso Ejemplo: Federica Fontan (EST-2025-024)

- **Perfil del estudiante**: 4to Año C - Colegiales
- **Exámenes mal asignados**:
  - Física 5to A - Termodinámica (2 duplicados)
  - Química 5to A - Equilibrio Químico (2 duplicados)

---

## 🔍 Análisis de la Causa Raíz

### Problema Identificado

El script `scripts/import-evaluations.ts` **no valida** que el estudiante pertenezca al curso/división del examen antes de asignarlo.

### Código Problemático

**Ubicación**: `scripts/import-evaluations.ts` líneas 85-113

```typescript
async function findStudent(firstName: string, lastName: string): Promise<Student | null> {
  try {
    // ❌ PROBLEMA: Solo busca por nombre, sin filtrar por año/división
    const result = await db.execute({
      sql: `SELECT id, name, email FROM User
            WHERE role = 'STUDENT'
            AND (name LIKE ? OR name LIKE ? OR name LIKE ?)
            LIMIT 1`,  // ❌ Toma el PRIMER estudiante que coincida
      args: [
        `%${firstName}%${lastName}%`,
        `%${lastName}%${firstName}%`,
        `%${firstName.toUpperCase()}%${lastName.toUpperCase()}%`
      ]
    });
    // ...
  }
}
```

### ¿Por qué ocurre?

1. El script busca estudiantes **solo por nombre**
2. No filtra por `academicYear`, `division` o `sede`
3. Usa `LIMIT 1` - toma el **primer** estudiante que coincida
4. Si hay estudiantes con el mismo nombre en diferentes cursos, asigna al primero que encuentra

### Ejemplo Concreto

```
# Al procesar: "Fontan_Federica_retroalimentacion_30102025.md"
# Para materia: "Física 5to A"

1. Script busca: estudiante con nombre "Federica Fontan"
2. Encuentra: Federica Fontan (4to C) - ID: u_pv2qe98lhme0b4xi4
3. ❌ Asigna el examen de "5to A" a estudiante de "4to C"
4. ✅ Debería buscar: estudiante de "5to A" con nombre "Federica Fontan"
```

---

## 📋 Exámenes Mal Asignados (8 total)

### 1-3. Federica Fontan (4to C) con exámenes de 5to A

| ID | Materia | Tema | Fecha | Nota |
|----|---------|------|-------|------|
| eval_7af5c789080489c2 | Química 5to A | Equilibrio Químico | 2025-10-30 | 67 |
| eval_0cfb40124bf121f7 | Física 5to A | Termodinámica | 2025-10-30 | 61 |
| eval_883e21ac7ca4a6c6 | Física 5to A | Termodinámica | 2025-10-30 | 61 |

### 4-5. Federica Fontan (4to C) - Exámenes duplicados anteriores

| ID | Materia | Tema | Fecha | Nota |
|----|---------|------|-------|------|
| eval_eb03f54abf5e81ab | Química 5to A | Equilibrio Químico | 2025-10-07 | 67 |
| eval_af09ec1869eade83 | Química 5to A | Equilibrio Químico | 2025-10-07 | 67 |

### 6-7. Ignacio Ortiz Gagliano (4to E) con exámenes de 5to B

| ID | Materia | Tema | Fecha | Nota |
|----|---------|------|-------|------|
| eval_d6e2044a029e8d02 | Química 5to B | Equilibrio Químico | 2025-10-30 | 68 |
| eval_8d6eb79047c665b1 | Química 5to B | Equilibrio Químico | 2025-10-30 | 68 |

### 8. Matilde Pasarin de la Torre (4to C) con examen de 5to B

| ID | Materia | Tema | Fecha | Nota |
|----|---------|------|-------|------|
| eval_b9b85dc53e0fbdbb | Química 5to B | Equilibrio Químico | 2025-10-30 | 50 |

---

## ✅ Solución Propuesta

### 1. Modificar `scripts/import-evaluations.ts`

Agregar parámetros `--academic-year` y `--division` al script para filtrar estudiantes:

```typescript
async function findStudent(
  firstName: string,
  lastName: string,
  academicYear: string,  // ✅ NUEVO
  division: string        // ✅ NUEVO
): Promise<Student | null> {
  try {
    const result = await db.execute({
      sql: `SELECT id, name, email FROM User
            WHERE role = 'STUDENT'
            AND (name LIKE ? OR name LIKE ? OR name LIKE ?)
            AND academicYear = ?     -- ✅ FILTRO POR AÑO
            AND division = ?          -- ✅ FILTRO POR DIVISIÓN
            LIMIT 1`,
      args: [
        `%${firstName}%${lastName}%`,
        `%${lastName}%${firstName}%`,
        `%${firstName.toUpperCase()}%${lastName.toUpperCase()}%`,
        academicYear,   // ✅ NUEVO
        division        // ✅ NUEVO
      ]
    });
    // ...
  }
}
```

### 2. Nuevo uso del script

```bash
# Antes (❌ incorrecto):
npx tsx scripts/import-evaluations.ts "../Retroalimentaciones" "Física 5to A" "Termodinámica"

# Después (✅ correcto):
npx tsx scripts/import-evaluations.ts "../Retroalimentaciones" "Física 5to A" "Termodinámica" "5to Año" "A"
```

### 3. Limpieza de exámenes mal asignados

**Opciones**:

1. **Eliminar manualmente** los 8 exámenes mal asignados
2. **Reasignar** a los estudiantes correctos (si existen)
3. **Verificar** si los estudiantes correctos tienen estos exámenes duplicados

---

## 🔧 Script de Validación

Se creó el script `scripts/validate_evaluations.py` para:

1. Detectar exámenes mal asignados
2. Generar reportes JSON con detalles
3. Permitir corrección interactiva (modo `--fix-mode`)

**Nota**: Actualmente requiere instalación de `libsql-experimental` que tiene problemas de compilación en macOS. Se recomienda usar consultas SQL directas con MCP Turso.

---

## 📊 Estadísticas de la Base de Datos

- **Total estudiantes**: 169+
- **Evaluaciones totales**: ~300+ (estimado)
- **Evaluaciones mal asignadas**: 8 (2.6% estimado)
- **Estudiantes afectados**: 3
  - Federica Fontan (EST-2025-024)
  - Ignacio Ortiz Gagliano (EST-2025-085)
  - Matilde Pasarin de la Torre (EST-2025-131)

---

## 🎯 Recomendaciones Inmediatas

1. **NO usar** `scripts/import-evaluations.ts` hasta corregir el bug
2. **Implementar** la validación de año/división en el script
3. **Eliminar** los 8 exámenes mal asignados identificados
4. **Revisar** si hay más exámenes mal asignados con otros patrones
5. **Agregar** validación automática en el código de importación

---

## 🔍 Consultas SQL Útiles

### Encontrar todos los exámenes mal asignados

```sql
SELECT
    e.id as evaluation_id,
    e.subject,
    e.examTopic,
    e.examDate,
    e.score,
    u.name as student_name,
    u.studentId as student_code,
    u.academicYear,
    u.division,
    u.sede
FROM Evaluation e
JOIN User u ON e.studentId = u.id
WHERE u.role = 'STUDENT'
  AND (
    (e.subject LIKE '%5to A%' AND (u.academicYear != '5to Año' OR u.division != 'A'))
    OR (e.subject LIKE '%5to B%' AND (u.academicYear != '5to Año' OR u.division != 'B'))
    OR (e.subject LIKE '%4to C%' AND (u.academicYear != '4to Año' OR u.division != 'C'))
    -- ... agregar más patrones según sea necesario
  )
ORDER BY e.examDate DESC
```

### Eliminar un examen específico

```sql
DELETE FROM Evaluation WHERE id = 'eval_7af5c789080489c2';
```

### Buscar estudiantes de un curso específico

```sql
SELECT id, name, studentId, sede, academicYear, division
FROM User
WHERE academicYear = '5to Año'
  AND division = 'A'
  AND sede = 'Congreso'
  AND role = 'STUDENT';
```

---

## 📝 Próximos Pasos

1. ✅ Diagnóstico completado
2. ✅ Causa raíz identificada
3. ✅ Script de validación creado
4. ⏳ **Pendiente**: Corregir `import-evaluations.ts`
5. ⏳ **Pendiente**: Limpiar exámenes mal asignados
6. ⏳ **Pendiente**: Re-importar exámenes correctamente

---

**Generado por**: Claude Code
**Fecha**: 2025-10-31
**Versión**: 1.0
