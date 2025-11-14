#!/bin/bash

# Script para extraer todos los usuarios de Turso Intellego
# Usa el CLI de Turso para hacer la extracción completa

echo "=================================================="
echo "🎓 INTELLEGO PLATFORM - Extractor de Usuarios"
echo "=================================================="
echo ""

# Nombre de la base de datos
DB_NAME="intellego-production"

# Timestamp para los archivos
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Nombres de archivos de salida
JSON_FILE="users_export_${TIMESTAMP}.json"
CSV_FILE="users_export_${TIMESTAMP}.csv"
TMP_FILE="users_raw_${TIMESTAMP}.txt"

echo "🔍 Conectando a base de datos: $DB_NAME"
echo ""

# Query SQL
QUERY="SELECT
    id,
    name,
    email,
    role,
    studentId,
    sede,
    academicYear,
    division,
    subjects,
    status,
    createdAt,
    updatedAt
FROM User
ORDER BY createdAt DESC;"

# Ejecutar query y guardar resultado
echo "📊 Ejecutando query..."
turso db shell "$DB_NAME" "$QUERY" > "$TMP_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Query ejecutada exitosamente"
    echo ""

    # Contar líneas (aproximado de usuarios)
    LINE_COUNT=$(wc -l < "$TMP_FILE")
    echo "📝 Datos extraídos: $LINE_COUNT líneas"

    # Mostrar primeras líneas
    echo ""
    echo "📋 Vista previa de los datos:"
    echo "─────────────────────────────────────────────────"
    head -n 20 "$TMP_FILE"
    echo "─────────────────────────────────────────────────"
    echo ""

    echo "✅ Archivo guardado: $TMP_FILE"
    echo ""

    # Opción para convertir a JSON/CSV si se requiere
    echo "💡 Para procesar estos datos a JSON/CSV, usa:"
    echo "   python3 parse_turso_output.py $TMP_FILE"

else
    echo "❌ Error al ejecutar query"
    cat "$TMP_FILE"
    rm "$TMP_FILE"
    exit 1
fi

echo ""
echo "✨ Extracción completada!"
echo "=================================================="
