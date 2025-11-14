# Extractor de Usuarios - Intellego Platform

Script Python para extraer todos los usuarios registrados en la base de datos Turso de Intellego Platform.

## 📋 Descripción

`extract_users_rest.py` es un script que se conecta a la base de datos Turso usando el API REST y exporta todos los usuarios registrados a archivos JSON y CSV.

## 🔧 Requisitos

- Python 3.9+
- Biblioteca `requests`: `pip3 install requests`
- Variables de entorno configuradas:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`

## 🚀 Uso

```bash
# Desde el directorio scripts/
python3 extract_users_rest.py
```

El script automáticamente:
1. Se conecta a la base de datos Turso
2. Extrae todos los usuarios (sin contraseñas por seguridad)
3. Calcula estadísticas detalladas
4. Genera dos archivos:
   - `users_export_YYYYMMDD_HHMMSS.json` - Datos completos con estadísticas
   - `users_export_YYYYMMDD_HHMMSS.csv` - Datos en formato tabular

## 📊 Campos Exportados

Cada usuario incluye:
- `id` - ID único del usuario
- `name` - Nombre completo
- `email` - Email del usuario
- `role` - Rol (STUDENT, INSTRUCTOR, etc.)
- `studentId` - ID de estudiante (ej: EST-2025-001)
- `sede` - Sede (Colegiales, Congreso, Central)
- `academicYear` - Año académico (4to Año, 5to Año)
- `division` - División (A, B, C, D, E)
- `subjects` - Materias (Física, Química, etc.)
- `status` - Estado (ACTIVE, INACTIVE)
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de última actualización

**Nota de seguridad**: El campo `password` NO se exporta por razones de seguridad.

## 📈 Estadísticas Generadas

El script calcula y muestra:
- Total de usuarios
- Distribución por rol
- Distribución por estado
- Distribución por sede
- Distribución por año académico
- Distribución por división

## 📂 Ejemplo de Salida

### Consola
```
============================================================
🎓 INTELLEGO PLATFORM - Extractor de Usuarios
============================================================

🔍 Conectando a Turso...
📊 Ejecutando query...
📝 Procesando resultados...
✅ Se encontraron 175 usuarios

📊 ESTADÍSTICAS DE USUARIOS
============================================================
Total de usuarios: 175

👥 Por Rol:
  - INSTRUCTOR        1 (  0.6%)
  - STUDENT         174 ( 99.4%)

📍 Por Estado:
  - ACTIVE          175 (100.0%)

🏫 Por Sede:
  - Colegiales      126
  - Congreso         48
  - Central           1

...
```

### JSON (estructura)
```json
{
  "export_timestamp": "2025-10-29T11:59:41.123456",
  "statistics": {
    "total_users": 175,
    "by_role": { "STUDENT": 174, "INSTRUCTOR": 1 },
    "by_status": { "ACTIVE": 175 },
    ...
  },
  "users": [
    {
      "id": "...",
      "name": "...",
      "email": "...",
      ...
    }
  ]
}
```

### CSV (encabezados)
```csv
id,name,email,role,studentId,sede,academicYear,division,subjects,status,createdAt,updatedAt
...
```

## ⚠️ Notas Importantes

1. **Seguridad**: Las contraseñas nunca se exportan
2. **Variables de entorno**: Asegúrate de tener las variables configuradas
3. **Conexión**: Usa el API REST de Turso (más estable que WebSocket)
4. **Timestamp**: Cada ejecución genera archivos con timestamp único

## 🛠️ Otros Scripts Disponibles

- `extract_users.py` - Versión async con libsql_client (puede fallar con WebSocket)
- `extract_users_cli.py` - Versión usando CLI de Turso
- `extract_users_simple.py` - Procesador simple para datos pre-obtenidos
- `extract_all_users.sh` - Script bash alternativo

**Recomendación**: Usar `extract_users_rest.py` por ser el más estable.

## 📝 Licencia

Parte del proyecto Intellego Platform - Uso interno del Colegio Santo Tomás de Aquino
