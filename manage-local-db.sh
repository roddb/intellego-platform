#!/bin/bash

# Script para gestionar la base de datos local del proyecto Intellego Platform
# Permite alternar entre base de datos original y datos de producción

DB_PATH="prisma/data/intellego.db"
BACKUP_DIR="prisma/data/backups"
PRODUCTION_BACKUP="production-database-backup-$(date +%Y-%m-%d).json"
PRODUCTION_SQL="import-production-db-$(date +%Y-%m-%d).sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

case "$1" in
  "backup")
    echo "📦 Creando backup de la base de datos actual..."
    BACKUP_NAME="intellego-backup-$(date +%Y-%m-%d-%H%M%S).db"
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
    echo "✅ Backup creado: $BACKUP_DIR/$BACKUP_NAME"
    ;;
    
  "restore-production")
    echo "🔄 Restaurando base de datos con datos de producción..."
    if [ -f "$PRODUCTION_SQL" ]; then
      # Crear backup antes de restaurar
      BACKUP_NAME="intellego-before-production-restore-$(date +%Y-%m-%d-%H%M%S).db"
      cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
      echo "📦 Backup actual creado: $BACKUP_DIR/$BACKUP_NAME"
      
      # Importar datos de producción
      sqlite3 "$DB_PATH" < "$PRODUCTION_SQL"
      echo "✅ Datos de producción importados exitosamente"
      
      # Verificar importación
      echo "📊 Verificando importación:"
      sqlite3 "$DB_PATH" "SELECT 'Users: ' || COUNT(*) FROM User UNION ALL SELECT 'Reports: ' || COUNT(*) FROM ProgressReport UNION ALL SELECT 'Answers: ' || COUNT(*) FROM Answer;"
    else
      echo "❌ Error: No se encontró el archivo $PRODUCTION_SQL"
      echo "💡 Ejecuta primero: node download-production-db.js"
      exit 1
    fi
    ;;
    
  "restore-original")
    echo "🔄 Restaurando base de datos original..."
    # Buscar el backup original más reciente
    ORIGINAL_BACKUP=$(ls -t "$BACKUP_DIR"/intellego-backup-*.db 2>/dev/null | head -1)
    if [ -n "$ORIGINAL_BACKUP" ]; then
      cp "$ORIGINAL_BACKUP" "$DB_PATH"
      echo "✅ Base de datos original restaurada desde: $ORIGINAL_BACKUP"
    else
      echo "❌ Error: No se encontró backup original"
      echo "💡 Crea un backup primero con: ./manage-local-db.sh backup"
      exit 1
    fi
    ;;
    
  "info")
    echo "📊 Información de la base de datos actual:"
    echo "📁 Ubicación: $DB_PATH"
    if [ -f "$DB_PATH" ]; then
      echo "📈 Estadísticas:"
      sqlite3 "$DB_PATH" "SELECT 'Usuarios: ' || COUNT(*) FROM User WHERE role='STUDENT' UNION ALL SELECT 'Instructores: ' || COUNT(*) FROM User WHERE role='INSTRUCTOR' UNION ALL SELECT 'Reportes: ' || COUNT(*) FROM ProgressReport UNION ALL SELECT 'Respuestas: ' || COUNT(*) FROM Answer;"
      
      echo -e "\n📚 Materias disponibles:"
      sqlite3 "$DB_PATH" "SELECT '  - ' || subject || ': ' || COUNT(*) || ' reportes' FROM ProgressReport WHERE subject IS NOT NULL GROUP BY subject ORDER BY COUNT(*) DESC;"
      
      echo -e "\n🏫 Sedes disponibles:"
      sqlite3 "$DB_PATH" "SELECT '  - ' || sede || ': ' || COUNT(*) || ' estudiantes' FROM User WHERE role='STUDENT' AND sede IS NOT NULL GROUP BY sede ORDER BY COUNT(*) DESC;"
    else
      echo "❌ Base de datos no encontrada"
    fi
    ;;
    
  "list-backups")
    echo "📁 Backups disponibles:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
      ls -lah "$BACKUP_DIR"/*.db 2>/dev/null | awk '{print "  - " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    else
      echo "  (No hay backups disponibles)"
    fi
    ;;
    
  "clean")
    echo "🧹 Limpiando archivos temporales..."
    rm -f production-database-backup-*.json
    rm -f import-production-db-*.sql
    rm -f download-production-db.js
    echo "✅ Archivos temporales eliminados"
    ;;
    
  *)
    echo "🔧 Gestor de Base de Datos Local - Intellego Platform"
    echo ""
    echo "Uso: $0 <comando>"
    echo ""
    echo "Comandos disponibles:"
    echo "  backup              - Crear backup de la BD actual"
    echo "  restore-production  - Restaurar con datos de producción"
    echo "  restore-original    - Restaurar BD original desde backup"
    echo "  info               - Mostrar información de la BD actual"
    echo "  list-backups       - Listar backups disponibles"
    echo "  clean              - Limpiar archivos temporales"
    echo ""
    echo "Ejemplos:"
    echo "  $0 backup                  # Crear backup antes de cambios"
    echo "  $0 restore-production      # Usar datos de producción para pruebas"
    echo "  $0 restore-original        # Volver a la BD original"
    echo "  $0 info                    # Ver estadísticas actuales"
    ;;
esac