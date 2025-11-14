# Análisis de Usuarios Duplicados

**Fecha**: 1 de Noviembre de 2025
**Total Duplicados**: 6 estudiantes (13 registros en total)

---

## 📊 Resumen de Duplicados

| Estudiante | Registros | Evaluaciones | Acción |
|------------|-----------|--------------|---------|
| catalina cresci | 4 | 1 total | Consolidar a EST-2025-117 |
| Lucio Fernández rico | 2 | 5 total | Consolidar a EST-2025-003 |
| Charo Reig | 2 | 2 total | Consolidar a EST-2025-1020 |
| Salvador Veltri | 2 | 2 total | Consolidar a EST-2025-072 |
| Isabel Ortiz Güemes | 2 | 0 total | Consolidar a EST-2025-134 |
| Agustin Gonzalez Castro Feijoo | 2 | 0 total | Consolidar a EST-2025-1008 |

---

## 🔍 Análisis Detallado

### 1. catalina cresci (4 registros) - 5to B

**MANTENER**: `u_yjrnyfsg2me6bmfeg` (EST-2025-117)
- ✅ Email: catalina.cresci@gmail.com
- ✅ Creado: 2025-08-10
- ✅ Tiene: 1 evaluación
- ✅ Registro más antiguo con datos

**ELIMINAR**:
- `271939b0-23ab-4ee4-9b2a-1ac4fc117d94` (EST-2025-1019) - 0 evaluaciones
- `bf75d4ac-5f88-4043-a227-4a512846cafe` (EST-2025-1743) - 0 evaluaciones
- `7cfecfff-7374-43c3-94b0-3bd182f7345e` (EST-2025-1747) - 0 evaluaciones

---

### 2. Lucio Fernández rico (2 registros) - 5to A

**MANTENER**: `u_0ewscw8ksmdyn9paz` (EST-2025-003)
- ✅ Email: fernandezlucio4@gnail.com (typo pero es el que tiene datos)
- ✅ Creado: 2025-08-05
- ✅ Tiene: 5 evaluaciones
- ✅ Registro más antiguo con actividad

**ELIMINAR**:
- `u_qjugmxdtzme5ry9mk` (EST-2025-102) - 0 evaluaciones
  - Email correcto: fernandezlucio4@gmail.com
  - **ACCIÓN**: Corregir email del registro que mantenermos

---

### 3. Charo Reig (2 registros) - 4to E

**MANTENER**: `7c833c54-face-42df-8ba9-758c9e0a838e` (EST-2025-1020)
- ✅ Email: charoreigg@gmail.com
- ✅ Creado: 2025-08-18
- ✅ Tiene: 2 evaluaciones
- ✅ Registro con datos

**ELIMINAR**:
- `0dc9641c-192c-4b0f-9d9c-a900dc161495` (EST-2025-1023) - 0 evaluaciones

---

### 4. Salvador Veltri (2 registros) - 4to D

**MANTENER**: `u_t7fxqb0y0me1fm6ec` (EST-2025-072)
- ✅ Email: salveltri21@gmail.com
- ✅ Creado: 2025-08-07
- ✅ Tiene: 2 evaluaciones
- ✅ Registro más antiguo con datos

**ELIMINAR**:
- `u_zsmjtajb0me1fut40` (EST-2025-077) - 0 evaluaciones

---

### 5. Isabel Ortiz Güemes (2 registros) - 5to B

**MANTENER**: `u_bap6b4k2rme73bmwt` (EST-2025-134)
- ✅ Email: ortizguemesisabel@gmail.com
- ✅ Creado: 2025-08-11
- ✅ Registro más antiguo
- ⚠️ Ambos sin evaluaciones

**ELIMINAR**:
- `75188ebe-9c16-467d-8353-7313d6d65b7a` (EST-2025-1744) - 0 evaluaciones

---

### 6. Agustin Gonzalez Castro Feijoo (2 registros) - 5to D

**MANTENER**: `d5aec9ad-a91c-4304-87e1-01fa6f8d399b` (EST-2025-1008)
- ✅ Email: agustingcf@gmail.com
- ✅ Creado: 2025-08-17
- ✅ Registro más antiguo
- ⚠️ Ambos sin evaluaciones

**ELIMINAR**:
- `f5c6ca4e-cd98-4729-bbc6-51c26cd7c505` (EST-2025-1010) - 0 evaluaciones

---

## 🎯 Plan de Consolidación

### Paso 1: Reasignar evaluaciones (si las hay)

**Usuarios con evaluaciones a migrar**: Ninguno
- Todos los duplicados sin evaluaciones ya están en cero
- Los registros con evaluaciones son los que mantendremos

### Paso 2: Actualizar correos incorrectos

```sql
-- Corregir email de Lucio Fernández
UPDATE User
SET email = 'fernandezlucio4@gmail.com'
WHERE id = 'u_0ewscw8ksmdyn9paz';
```

### Paso 3: Eliminar registros duplicados

```sql
-- catalina cresci (eliminar 3)
DELETE FROM User WHERE id IN (
  '271939b0-23ab-4ee4-9b2a-1ac4fc117d94',
  'bf75d4ac-5f88-4043-a227-4a512846cafe',
  '7cfecfff-7374-43c3-94b0-3bd182f7345e'
);

-- Lucio Fernández rico (eliminar 1)
DELETE FROM User WHERE id = 'u_qjugmxdtzme5ry9mk';

-- Charo Reig (eliminar 1)
DELETE FROM User WHERE id = '0dc9641c-192c-4b0f-9d9c-a900dc161495';

-- Salvador Veltri (eliminar 1)
DELETE FROM User WHERE id = 'u_zsmjtajb0me1fut40';

-- Isabel Ortiz Güemes (eliminar 1)
DELETE FROM User WHERE id = '75188ebe-9c16-467d-8353-7313d6d65b7a';

-- Agustin Gonzalez Castro Feijoo (eliminar 1)
DELETE FROM User WHERE id = 'f5c6ca4e-cd98-4729-bbc6-51c26cd7c505';
```

### Paso 4: Verificar resultados

```sql
-- Verificar que no haya duplicados
SELECT
    name,
    COUNT(*) as count
FROM User
WHERE role = 'STUDENT'
GROUP BY LOWER(TRIM(name)), academicYear, division
HAVING COUNT(*) > 1;

-- Debe retornar 0 filas
```

---

## ✅ Registros a Mantener

| ID | Nombre | Código | Email |
|----|--------|--------|-------|
| u_yjrnyfsg2me6bmfeg | catalina cresci | EST-2025-117 | catalina.cresci@gmail.com |
| u_0ewscw8ksmdyn9paz | Lucio Fernández rico | EST-2025-003 | fernandezlucio4@gmail.com ⚠️ |
| 7c833c54-face-42df-8ba9-758c9e0a838e | Charo Reig | EST-2025-1020 | charoreigg@gmail.com |
| u_t7fxqb0y0me1fm6ec | Salvador Veltri | EST-2025-072 | salveltri21@gmail.com |
| u_bap6b4k2rme73bmwt | Isabel Ortiz Güemes | EST-2025-134 | ortizguemesisabel@gmail.com |
| d5aec9ad-a91c-4304-87e1-01fa6f8d399b | Agustin Gonzalez Castro Feijoo | EST-2025-1008 | agustingcf@gmail.com |

⚠️ = Requiere corrección de email

---

## 📈 Impacto

**ANTES**:
- Total estudiantes: 176 (con duplicados)
- Duplicados: 13 registros

**DESPUÉS**:
- Total estudiantes: 169 (sin duplicados)
- Duplicados eliminados: 7 registros
- Correcciones de email: 1

---

## ⚠️ Precauciones

1. **Backup**: Antes de ejecutar, hacer backup de la tabla User
2. **Verificar**: No hay ProgressReports u otros datos vinculados a los IDs a eliminar
3. **Orden**: Ejecutar correcciones de email ANTES de eliminar duplicados
4. **Validar**: Verificar que los IDs a eliminar no tengan evaluaciones

---

**Generado por**: Claude Code
**Fecha**: 2025-11-01
**Versión**: 1.0
