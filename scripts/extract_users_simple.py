#!/usr/bin/env python3
"""
Script simple para procesar y exportar usuarios de Intellego Platform
Los datos se obtienen mediante el MCP de Turso y se pasan como JSON
"""

import json
import csv
import sys
from datetime import datetime

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

        # Por sede (solo estudiantes)
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

def export_to_json(users, stats, filename="users_export.json"):
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
    return filename

def export_to_csv(users, filename="users_export.csv"):
    """Exporta usuarios a CSV"""
    if not users:
        print("⚠️  No hay usuarios para exportar")
        return None

    # Obtener todas las claves (campos) del primer usuario
    fieldnames = users[0].keys()

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)

    print(f"✅ Archivo CSV exportado: {filename}")
    return filename

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
    print("🎓 INTELLEGO PLATFORM - Procesador de Usuarios")
    print("=" * 60)

    try:
        # Leer datos de stdin si se proporcionan
        if not sys.stdin.isatty():
            input_data = sys.stdin.read()
            data = json.loads(input_data)
            users = data.get("rows", [])
        else:
            print("⚠️  Este script espera datos JSON desde stdin")
            print("📖 Uso: cat users_data.json | python3 extract_users_simple.py")
            print("\n💡 O proporciona los datos como argumento:")
            print("   python3 extract_users_simple.py '[{...}]'")

            if len(sys.argv) > 1:
                users = json.loads(sys.argv[1])
            else:
                return

        if not users:
            print("⚠️  No se encontraron usuarios en los datos proporcionados")
            return

        print(f"✅ Procesando {len(users)} usuarios")

        # Calcular estadísticas
        stats = calculate_statistics(users)

        # Imprimir estadísticas
        print_statistics(stats)

        # Exportar a archivos
        print("\n📁 Exportando archivos...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"users_export_{timestamp}.json"
        csv_filename = f"users_export_{timestamp}.csv"

        json_file = export_to_json(users, stats, json_filename)
        csv_file = export_to_csv(users, csv_filename)

        print("\n✨ Extracción completada exitosamente!")
        print("=" * 60)
        print(f"\n📂 Archivos generados:")
        print(f"   - {json_file}")
        print(f"   - {csv_file}")

    except json.JSONDecodeError as e:
        print(f"\n❌ Error al parsear JSON: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante el procesamiento: {str(e)}")
        raise

if __name__ == "__main__":
    main()
