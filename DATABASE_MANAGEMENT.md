# 🗄️ Gestión de Base de Datos - Intellego Platform

## 📋 Resumen

Este documento explica cómo gestionar las bases de datos locales y de producción del proyecto Intellego Platform, incluyendo herramientas para descargar datos de producción y trabajar localmente sin afectar el sistema en vivo.

---

## 🎯 Casos de Uso

### ✅ **Desarrollo Local Seguro**
- Probar cambios sin tocar producción
- Experimentar con nuevas funcionalidades
- Debugging con datos reales
- Testing de migraciones

### ✅ **Backup y Restauración**
- Backup automático antes de cambios
- Restaurar estado anterior en caso de errores
- Mantener múltiples versiones de desarrollo

---

## 🛠️ Herramientas Disponibles

### 1. **Descarga de Base de Datos de Producción**

```bash
# Descargar datos completos de Turso a archivos locales
node download-production-db.js
```

**Genera:**
- `production-database-backup-YYYY-MM-DD.json` - Datos completos con metadata
- `import-production-db-YYYY-MM-DD.sql` - Script SQL para importar

### 2. **Gestor de Base de Datos Local**

```bash
# Script interactivo para gestionar BD local
./manage-local-db.sh [comando]
```

**Comandos disponibles:**

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `backup` | Crear backup de BD actual | `./manage-local-db.sh backup` |
| `restore-production` | Importar datos de producción | `./manage-local-db.sh restore-production` |
| `restore-original` | Volver a BD original | `./manage-local-db.sh restore-original` |
| `info` | Mostrar estadísticas actuales | `./manage-local-db.sh info` |
| `list-backups` | Listar backups disponibles | `./manage-local-db.sh list-backups` |
| `clean` | Limpiar archivos temporales | `./manage-local-db.sh clean` |

---

## 📖 Flujos de Trabajo Típicos

### 🔄 **Workflow 1: Desarrollo con Datos de Producción**

```bash
# 1. Crear backup de tu BD actual
./manage-local-db.sh backup

# 2. Descargar datos frescos de producción
node download-production-db.js

# 3. Importar datos de producción localmente
./manage-local-db.sh restore-production

# 4. Desarrollar y probar con datos reales
npm run dev

# 5. Cuando termines, restaurar BD original
./manage-local-db.sh restore-original
```

### 🧪 **Workflow 2: Testing de Migraciones**

```bash
# 1. Backup antes de migration
./manage-local-db.sh backup

# 2. Aplicar migración experimental
# ... tu código de migración ...

# 3. Si algo sale mal, restaurar
./manage-local-db.sh restore-original

# 4. Si funciona bien, documentar cambios
./manage-local-db.sh info
```

### 📊 **Workflow 3: Análisis de Datos**

```bash
# 1. Descargar datos actuales
node download-production-db.js

# 2. Ver estadísticas detalladas
./manage-local-db.sh info

# 3. Análisis manual con SQLite
sqlite3 prisma/data/intellego.db
```

---

## 📁 Estructura de Archivos

```
prisma/data/
├── intellego.db                              # BD principal de desarrollo
├── backups/
│   ├── intellego-backup-2025-08-13.db       # Backup automático
│   └── intellego-before-production-restore...# Backup antes de restore
├── production-database-backup-2025-08-13.json # Datos de producción (JSON)
└── import-production-db-2025-08-13.sql       # Script de importación
```

---

## 🔍 Datos Actuales de Producción

### 📊 **Estadísticas (2025-08-13)**
- **Usuarios**: 140 (139 estudiantes + 1 instructor)
- **Reportes**: 177 reportes de progreso
- **Respuestas**: 885 respuestas detalladas
- **Materias**: Física (72 reportes), Química (105 reportes)
- **Sedes**: Colegiales (105 estudiantes), Congreso (34 estudiantes)

### 👥 **Usuarios de Prueba**
```bash
# Estudiante demo
Email: estudiante@demo.com
Password: Estudiante123!!!

# Instructor demo
Email: rdb@intellego.com  
Password: 02R07d91!
```

---

## ⚠️ **Consideraciones de Seguridad**

### ✅ **Buenas Prácticas**
- Siempre hacer backup antes de cambios importantes
- NO commitear archivos de BD o backups al repositorio
- Usar datos de producción solo en entorno local
- Limpiar archivos temporales después de uso

### 🚫 **NO Hacer**
- NO ejecutar migraciones directamente en producción sin testing
- NO commitear archivos `*.db` o `*.sql` con datos reales
- NO compartir dumps de BD con datos personales
- NO usar datos de producción en entornos públicos

---

## 🧹 **Limpieza y Mantenimiento**

### **Limpiar Archivos Temporales**
```bash
# Eliminar archivos de descarga y scripts temporales
./manage-local-db.sh clean

# También puedes hacer manualmente:
rm -f production-database-backup-*.json
rm -f import-production-db-*.sql
rm -f download-production-db.js
```

### **Gestión de Backups**
```bash
# Ver todos los backups
./manage-local-db.sh list-backups

# Limpiar backups antiguos (manual)
rm prisma/data/backups/intellego-backup-YYYY-MM-DD-*.db
```

---

## 🆘 **Solución de Problemas**

### **Error: "Base de datos no encontrada"**
```bash
# Verificar que existe la BD
ls -la prisma/data/intellego.db

# Si no existe, crear una nueva
npm run dev  # Esto debería crearla automáticamente
```

### **Error: "No se encontró archivo de importación"**
```bash
# Descargar datos frescos de producción
node download-production-db.js

# Verificar que se crearon los archivos
ls -la production-database-backup-*.json
ls -la import-production-db-*.sql
```

### **Error: "Datos corruptos después de importar"**
```bash
# Restaurar desde backup
./manage-local-db.sh restore-original

# Verificar integridad de datos
./manage-local-db.sh info
```

---

## 📞 **Contacto y Soporte**

Si encuentras problemas con estas herramientas:

1. **Verificar logs**: Todos los scripts muestran output detallado
2. **Crear backup**: Siempre antes de intentar fixes
3. **Documentar el problema**: Incluir comando ejecutado y error exacto
4. **Restaurar estado conocido**: Usar backups para volver a estado funcional

---

**✅ Con estas herramientas puedes desarrollar de manera segura usando datos reales de producción sin riesgo de afectar el sistema en vivo.**