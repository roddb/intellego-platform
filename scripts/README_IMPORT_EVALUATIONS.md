# Import Evaluations Script

Script para importar evaluaciones desde archivos markdown a la base de datos de Intellego Platform.

## 🔧 Uso

```bash
npx tsx scripts/import-evaluations.ts <directory> <subject> <examTopic> [instructorEmail]
```

### Parámetros

- **directory**: Directorio que contiene los archivos markdown de retroalimentación
- **subject**: Materia y curso (ej: "Física 5to A", "Química 4to C")
- **examTopic**: Tema del examen (ej: "Termodinámica", "Equilibrio Químico")
- **instructorEmail** (opcional): Email del instructor (default: rodrigodibernardo33@gmail.com)

### Ejemplos

```bash
# Importar exámenes de Física 5to A
npx tsx scripts/import-evaluations.ts \
  "../Retroalimentaciones 5to A/Fisica" \
  "Física 5to A" \
  "Termodinámica"

# Importar exámenes de Química 4to C
npx tsx scripts/import-evaluations.ts \
  "../Retroalimentaciones 4to C/Quimica" \
  "Química 4to C" \
  "Gases Ideales"
```

## 📋 Formato de Archivos

Los archivos markdown deben seguir este formato:

```
Apellido_Nombre_retroalimentacion_DDMMYYYY.md
```

**Ejemplos**:
- `Fontan_Federica_retroalimentacion_30102025.md`
- `Ortiz_Ignacio_retroalimentacion_07102025.md`

### Contenido del Archivo

El archivo debe contener:
- Retroalimentación completa del examen
- Línea con formato: `Nota: XX/100` o `### Nota: XX.X/100`

## ✅ Validación Automática de Curso

**NUEVO**: El script ahora valida automáticamente que el estudiante pertenezca al curso correcto.

### Extracción Automática

El script extrae el año y división del parámetro `subject`:

- `"Física 5to A"` → Busca estudiantes de **5to Año, División A**
- `"Química 4to C"` → Busca estudiantes de **4to Año, División C**
- `"Biología 3ro B"` → Busca estudiantes de **3er Año, División B**

### Búsqueda Filtrada

Cuando se detecta año/división en el subject, el script:

1. ✅ Busca estudiantes por nombre
2. ✅ Filtra por `academicYear` y `division`
3. ✅ Solo asigna el examen si el estudiante está en el curso correcto

### Mensajes de Log

```bash
# Cuando se detecta curso correctamente:
📚 Extracted course info: 5to Año A

# Al buscar estudiantes:
🔄 Processing: Fontan_Federica_retroalimentacion_30102025.md
   ✅ Found student: Federica Fontan (u_pv2qe98lhme0b4xi4)

# Cuando no encuentra estudiante en el curso:
   ❌ Student not found: Federica Fontan (5to Año A)
```

## 🚨 Errores Comunes

### Error: Student not found with course filter

```
❌ Student not found: Juan Pérez (5to Año A)
```

**Causas posibles**:
1. El estudiante no existe en la base de datos
2. El estudiante está en un curso diferente (ej: 4to C en vez de 5to A)
3. El nombre en el archivo no coincide con el nombre en la BD

**Solución**:
- Verificar que el estudiante esté registrado
- Verificar el año y división del estudiante en la BD
- Verificar el formato del nombre en el archivo

### Error: Could not extract course info

```
⚠️  Could not extract course info from subject: Matemática
   Script will search students without year/division filters
```

**Causa**: El subject no contiene año/división (ej: "Matemática" en vez de "Matemática 5to A")

**Comportamiento**: El script funciona en modo legacy (sin filtros de curso)

## 🔍 Verificación Post-Importación

Después de importar, puedes verificar las evaluaciones con:

```bash
# Ver evaluaciones recientes
npx tsx scripts/list-evaluations.ts

# Validar asignaciones correctas
python3 scripts/validate_evaluations.py
```

## 📊 Estructura de la Base de Datos

### Tabla: Evaluation

```sql
CREATE TABLE Evaluation (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  subject TEXT NOT NULL,
  examDate TEXT NOT NULL,
  examTopic TEXT NOT NULL,
  score INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (studentId) REFERENCES User(id)
  FOREIGN KEY (createdBy) REFERENCES User(id)
);
```

## 🔒 Variables de Entorno

El script requiere las siguientes variables de entorno:

```bash
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## 📝 Changelog

### v2.0 (2025-10-31)
- ✅ Agregada validación automática de curso/división
- ✅ Extracción de año y división desde el subject
- ✅ Filtrado de estudiantes por academicYear y division
- ✅ Mejores mensajes de error con información del curso

### v1.0 (2025-10-02)
- Importación básica de evaluaciones
- Búsqueda de estudiantes por nombre
- Extracción automática de notas

## 🐛 Bugs Corregidos

### Bug #1: Exámenes asignados a estudiantes incorrectos

**Problema**: El script asignaba exámenes a estudiantes con el mismo nombre pero en cursos diferentes.

**Ejemplo**: Examen de "Física 5to A" asignado a estudiante de "4to C"

**Solución**: Implementada validación de curso en v2.0

**Referencia**: Ver `scripts/INFORME_VALIDACION_EXAMENES.md`
