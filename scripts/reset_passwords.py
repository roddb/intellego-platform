#!/usr/bin/env python3
"""
Script para resetear contraseñas de estudiantes en Intellego Platform
Genera contraseñas temporales seguras y las actualiza en la base de datos
"""

import os
import json
import requests
import secrets
import string
from datetime import datetime

# Configuración
TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")

def get_turso_http_url():
    """Convierte la URL de WebSocket a HTTP"""
    if not TURSO_DATABASE_URL:
        raise ValueError("TURSO_DATABASE_URL no está configurada")

    url = TURSO_DATABASE_URL.replace("libsql://", "https://").replace("wss://", "https://")
    if not url.endswith("/v2/pipeline"):
        if url.endswith("/"):
            url = url[:-1]
        url = url + "/v2/pipeline"
    return url

def execute_query(query, params=None):
    """Ejecuta una query usando el API REST de Turso"""
    url = get_turso_http_url()

    headers = {
        "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    stmt = {"sql": query}
    if params:
        # Convertir parámetros a formato Turso (con tipos)
        args = []
        for param in params:
            args.append({"type": "text", "value": str(param)})
        stmt["args"] = args

    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": stmt
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Error en query: {response.status_code} - {response.text}")

    return response.json()

def generate_temporary_password(length=12):
    """Genera una contraseña temporal segura"""
    # Incluir mayúsculas, minúsculas, números y símbolos
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"

    # Asegurar al menos un carácter de cada tipo
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%&*")
    ]

    # Completar el resto
    for _ in range(length - 4):
        password.append(secrets.choice(alphabet))

    # Mezclar aleatoriamente
    secrets.SystemRandom().shuffle(password)

    return ''.join(password)

def hash_password_bcrypt(password):
    """Hash de contraseña usando bcryptjs (compatible con el sistema)"""
    try:
        import bcrypt
        # Generar salt y hash
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except ImportError:
        print("⚠️  bcrypt no está instalado. Instalando...")
        import subprocess
        subprocess.run(["pip3", "install", "bcrypt"], check=True)
        import bcrypt
        salt = bcrypt.gensalt(rounds=10)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

def update_user_password(user_id, hashed_password):
    """Actualiza la contraseña de un usuario en la base de datos"""
    query = """
    UPDATE User
    SET password = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
    """

    result = execute_query(query, [hashed_password, user_id])
    return result

def main():
    """Función principal"""
    print("=" * 70)
    print("🔐 INTELLEGO PLATFORM - Restablecimiento de Contraseñas")
    print("=" * 70)

    # Estudiantes a resetear
    students = [
        {
            "id": "fc83bcc5-a971-4f25-a493-fee973aedbbe",
            "name": "Constantino Chitarino",
            "email": "chitarinoconstantino@gmail.com",
            "studentId": "EST-2025-1751"
        },
        {
            "id": "abf271f9-f2c9-40bb-9d90-585dfcae4aef",
            "name": "Pedro merediz puente",
            "email": "pedromeredizpuente@gmail.com",
            "studentId": "EST-2025-1750"
        },
        {
            "id": "1c4a7804-c22a-498f-8750-9a1482f6e920",
            "name": "Santiago Diego Rodriguez",
            "email": "santidrodriguezc@gmail.com",
            "studentId": "EST-2025-1752"
        }
    ]

    results = []

    print("\n🔑 Generando contraseñas temporales seguras...")
    print("")

    for student in students:
        print(f"👤 Procesando: {student['name']}")

        # Generar contraseña temporal
        temp_password = generate_temporary_password(12)

        # Hash de la contraseña
        print(f"   🔒 Generando hash bcrypt...")
        hashed_password = hash_password_bcrypt(temp_password)

        # Actualizar en la base de datos
        print(f"   💾 Actualizando en base de datos...")
        try:
            update_user_password(student['id'], hashed_password)

            results.append({
                "success": True,
                "student": student,
                "temporary_password": temp_password
            })

            print(f"   ✅ Contraseña actualizada exitosamente")
        except Exception as e:
            results.append({
                "success": False,
                "student": student,
                "error": str(e)
            })
            print(f"   ❌ Error: {str(e)}")

        print("")

    # Resumen
    print("=" * 70)
    print("📊 RESUMEN DE RESTABLECIMIENTO")
    print("=" * 70)
    print("")

    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    print(f"✅ Exitosos: {len(successful)}/{len(students)}")
    print(f"❌ Fallidos: {len(failed)}/{len(students)}")
    print("")

    if successful:
        print("🔑 CREDENCIALES TEMPORALES")
        print("─" * 70)
        print("")

        for result in successful:
            student = result['student']
            password = result['temporary_password']

            print(f"👤 {student['name']}")
            print(f"   📧 Email: {student['email']}")
            print(f"   🆔 Student ID: {student['studentId']}")
            print(f"   🔐 Contraseña Temporal: {password}")
            print("")

    # Guardar en archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"password_reset_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            "reset_timestamp": datetime.now().isoformat(),
            "results": results
        }, f, indent=2, ensure_ascii=False)

    print("─" * 70)
    print(f"💾 Credenciales guardadas en: {filename}")
    print("")
    print("⚠️  IMPORTANTE:")
    print("   1. Comparte estas contraseñas de forma segura con los estudiantes")
    print("   2. Solicítales que cambien la contraseña en su primer inicio de sesión")
    print("   3. Elimina este archivo después de compartir las credenciales")
    print("=" * 70)

if __name__ == "__main__":
    try:
        if not TURSO_AUTH_TOKEN:
            raise ValueError("❌ TURSO_AUTH_TOKEN no está configurada")

        main()
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
