#!/usr/bin/env python3
"""
Script para extraer todos los usuarios de Turso usando HTTP REST API
Genera archivos CSV y JSON con la información completa
"""

import os
import json
import csv
import requests
from datetime import datetime

# Configuración
TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")

def get_turso_http_url():
    """Convierte la URL de WebSocket a HTTP"""
    if not TURSO_DATABASE_URL:
        raise ValueError("TURSO_DATABASE_URL no está configurada")

    # Convertir libsql:// o wss:// a https://
    url = TURSO_DATABASE_URL.replace("libsql://", "https://").replace("wss://", "https://")

    # Asegurar que termine con /v2/pipeline para el API REST
    if not url.endswith("/v2/pipeline"):
        if url.endswith("/"):
            url = url[:-1]
        url = url + "/v2/pipeline"

    return url

def execute_query(query):
    """Ejecuta una query usando el API REST de Turso"""
    url = get_turso_http_url()

    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # Formato de request para Turso HTTP API
    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": query
                }
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Error en query: {response.status_code} - {response.text}")

    return response.json()

def parse_turso_response(response_data):
    """Parsea la respuesta de Turso y devuelve lista de usuarios"""
    results = response_data.get("results", [])

    if not results:
        return []

    result = results[0]
    response = result.get("response", {})

    # El resultado está en response.result
    query_result = response.get("result", {})
    cols = query_result.get("cols", [])
    rows = query_result.get("rows", [])

    users = []
    for row in rows:
        user = {}
        for i, col_name in enumerate(cols):
            col_name_str = col_name.get("name", f"col_{i}")
            # Los valores vienen en un array, obtener el valor
            value = row[i]
            # Si el valor es un dict con "type" y "value", extraer el valor
            if isinstance(value, dict) and "value" in value:
                user[col_name_str] = value.get("value")
            else:
                user[col_name_str] = value

        users.append(user)

    return users

def calculate_statistics(users):
    """Calcula estadísticas de los usuarios"""
    stats = {
        "total_users": len(users),
        "by_role": {},
        "by_status": {},
        "by_sede": {},
        "by_academic_year": {},
        "by_division": {}
    }

    for user in users:
        # Por rol
        role = user.get("role", "N/A")
        stats["by_role"][role] = stats["by_role"].get(role, 0) + 1

        # Por estado
        status = user.get("status", "N/A")
        stats["by_status"][status] = stats["by_status"].get(status, 0) + 1

        # Por sede
        if user.get("sede"):
            sede = user["sede"]
            stats["by_sede"][sede] = stats["by_sede"].get(sede, 0) + 1

        # Por año académico
        if user.get("academicYear"):
            year = user["academicYear"]
            stats["by_academic_year"][year] = stats["by_academic_year"].get(year, 0) + 1

        # Por división
        if user.get("division"):
            div = user["division"]
            stats["by_division"][div] = stats["by_division"].get(div, 0) + 1

    return stats

def export_to_json(users, stats, filename):
    """Exporta usuarios a JSON"""
    timestamp = datetime.now().isoformat()

    export_data = {
        "export_timestamp": timestamp,
        "statistics": stats,
        "users": users
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Archivo JSON exportado: {filename}")

def export_to_csv(users, filename):
    """Exporta usuarios a CSV"""
    if not users:
        return

    fieldnames = users[0].keys()

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)

    print(f"✅ Archivo CSV exportado: {filename}")

def print_statistics(stats):
    """Imprime estadísticas en consola"""
    print("\n📊 ESTADÍSTICAS DE USUARIOS")
    print("=" * 60)
    print(f"Total de usuarios: {stats['total_users']}")

    print("\n👥 Por Rol:")
    for role, count in sorted(stats['by_role'].items()):
        percentage = (count / stats['total_users'] * 100)
        print(f"  - {role:15} {count:3} ({percentage:5.1f}%)")

    print("\n📍 Por Estado:")
    for status, count in sorted(stats['by_status'].items()):
        percentage = (count / stats['total_users'] * 100)
        print(f"  - {status:15} {count:3} ({percentage:5.1f}%)")

    if stats['by_sede']:
        print("\n🏫 Por Sede:")
        for sede, count in sorted(stats['by_sede'].items()):
            print(f"  - {sede:15} {count:3}")

    if stats['by_academic_year']:
        print("\n📚 Por Año Académico:")
        for year, count in sorted(stats['by_academic_year'].items()):
            print(f"  - {year:15} {count:3}")

    if stats['by_division']:
        print("\n📖 Por División:")
        for div, count in sorted(stats['by_division'].items()):
            print(f"  - {div:15} {count:3}")

def main():
    """Función principal"""
    print("=" * 60)
    print("🎓 INTELLEGO PLATFORM - Extractor de Usuarios")
    print("=" * 60)

    try:
        if not TURSO_AUTH_TOKEN:
            raise ValueError("❌ TURSO_AUTH_TOKEN no está configurada en variables de entorno")

        print("\n🔍 Conectando a Turso...")

        # Query para obtener todos los usuarios
        query = """
        SELECT
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
        ORDER BY createdAt DESC
        """

        # Ejecutar query
        print("📊 Ejecutando query...")
        response = execute_query(query)

        # Parsear resultados
        print("📝 Procesando resultados...")
        users = parse_turso_response(response)

        if not users:
            print("⚠️  No se encontraron usuarios")
            return

        print(f"✅ Se encontraron {len(users)} usuarios")

        # Calcular estadísticas
        stats = calculate_statistics(users)

        # Mostrar estadísticas
        print_statistics(stats)

        # Exportar archivos
        print("\n📁 Exportando archivos...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"users_export_{timestamp}.json"
        csv_filename = f"users_export_{timestamp}.csv"

        export_to_json(users, stats, json_filename)
        export_to_csv(users, csv_filename)

        print("\n✨ Extracción completada exitosamente!")
        print("=" * 60)
        print(f"\n📂 Archivos generados:")
        print(f"   - {json_filename}")
        print(f"   - {csv_filename}")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
