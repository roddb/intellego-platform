#!/usr/bin/env python3
"""
Script para detectar y reportar feedbacks con JSON malformado en skillsMetrics.

Este script:
1. Recorre toda la tabla Feedback
2. Detecta registros con JSON mal formateado (doble escape)
3. Intenta parsear el JSON para identificar problemas
4. Genera un reporte detallado de los problemas encontrados

Uso:
    python check_feedback_json.py [--fix]

Opciones:
    --fix    Corregir automáticamente los registros con doble escape
"""

import os
import sys
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

try:
    import libsql_client
except ImportError:
    print("❌ Error: libsql_client no está instalado")
    print("Instálalo con: pip install libsql-client")
    sys.exit(1)

# Cargar variables de entorno
load_dotenv()

# Configuración de conexión a Turso
TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN')

if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
    print("❌ Error: Variables de entorno no configuradas")
    print("Asegúrate de tener TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env")
    sys.exit(1)


class FeedbackChecker:
    """Clase para verificar y corregir JSON en feedbacks"""

    def __init__(self, db_url: str, auth_token: str):
        """Inicializa la conexión a la base de datos"""
        self.client = libsql_client.create_client(
            url=db_url,
            auth_token=auth_token
        )
        self.problems_found = []

    def check_all_feedbacks(self) -> Dict[str, Any]:
        """
        Recorre todos los feedbacks y detecta problemas de JSON

        Returns:
            Dict con estadísticas y lista de problemas encontrados
        """
        print("🔍 Iniciando verificación de feedbacks...")

        # Obtener todos los feedbacks con skillsMetrics
        query = """
            SELECT id, studentId, subject, weekStart, skillsMetrics
            FROM Feedback
            WHERE skillsMetrics IS NOT NULL
            ORDER BY createdAt DESC
        """

        result = self.client.execute(query)
        feedbacks = result.rows

        print(f"📊 Total de feedbacks con skillsMetrics: {len(feedbacks)}")

        stats = {
            'total': len(feedbacks),
            'valid': 0,
            'double_escaped': 0,
            'invalid_json': 0,
            'missing_keys': 0,
            'problems': []
        }

        for feedback in feedbacks:
            problem = self._check_feedback(feedback)

            if problem:
                stats['problems'].append(problem)

                # Categorizar el problema
                if problem['type'] == 'double_escaped':
                    stats['double_escaped'] += 1
                elif problem['type'] == 'invalid_json':
                    stats['invalid_json'] += 1
                elif problem['type'] == 'missing_keys':
                    stats['missing_keys'] += 1
            else:
                stats['valid'] += 1

        return stats

    def _check_feedback(self, feedback: Any) -> Optional[Dict[str, Any]]:
        """
        Verifica un feedback individual

        Args:
            feedback: Row de la base de datos

        Returns:
            Dict con detalles del problema o None si está OK
        """
        feedback_id = feedback[0]
        student_id = feedback[1]
        subject = feedback[2]
        week_start = feedback[3]
        skills_metrics = feedback[4]

        # 1. Detectar doble escape
        if self._has_double_escape(skills_metrics):
            return {
                'id': feedback_id,
                'studentId': student_id,
                'subject': subject,
                'weekStart': week_start,
                'type': 'double_escaped',
                'raw': skills_metrics,
                'description': 'JSON con doble escape (\\\\\")',
                'fixable': True
            }

        # 2. Intentar parsear JSON
        try:
            data = json.loads(skills_metrics)
        except json.JSONDecodeError as e:
            return {
                'id': feedback_id,
                'studentId': student_id,
                'subject': subject,
                'weekStart': week_start,
                'type': 'invalid_json',
                'raw': skills_metrics[:100] + '...' if len(skills_metrics) > 100 else skills_metrics,
                'description': f'JSON inválido: {str(e)}',
                'fixable': False
            }

        # 3. Verificar que tenga las keys esperadas
        required_keys = ['comprehension', 'criticalThinking', 'selfRegulation',
                        'practicalApplication', 'metacognition']

        missing_keys = [key for key in required_keys if key not in data]

        if missing_keys:
            return {
                'id': feedback_id,
                'studentId': student_id,
                'subject': subject,
                'weekStart': week_start,
                'type': 'missing_keys',
                'raw': skills_metrics,
                'description': f'Faltan keys: {", ".join(missing_keys)}',
                'missingKeys': missing_keys,
                'fixable': False
            }

        # 4. Verificar que los valores sean numéricos
        for key in required_keys:
            if not isinstance(data[key], (int, float)):
                return {
                    'id': feedback_id,
                    'studentId': student_id,
                    'subject': subject,
                    'weekStart': week_start,
                    'type': 'invalid_values',
                    'raw': skills_metrics,
                    'description': f'Valor no numérico en {key}: {data[key]}',
                    'fixable': False
                }

        return None

    def _has_double_escape(self, json_str: str) -> bool:
        """
        Detecta si el JSON tiene doble escape

        Args:
            json_str: String JSON a verificar

        Returns:
            True si tiene doble escape
        """
        # Patrón para detectar doble escape: \\\"
        return r'\\\"' in json_str or '\\\\\"' in json_str

    def fix_double_escaped(self, feedback_id: str, skills_metrics: str) -> bool:
        """
        Corrige un feedback con doble escape

        Args:
            feedback_id: ID del feedback
            skills_metrics: JSON con doble escape

        Returns:
            True si se corrigió exitosamente
        """
        try:
            # Remover el doble escape
            fixed_json = skills_metrics.replace('\\\"', '"')

            # Verificar que el JSON sea válido
            data = json.loads(fixed_json)

            # Actualizar en la base de datos
            query = """
                UPDATE Feedback
                SET skillsMetrics = ?,
                    updatedAt = datetime('now')
                WHERE id = ?
            """

            self.client.execute(query, [fixed_json, feedback_id])

            return True

        except Exception as e:
            print(f"❌ Error corrigiendo {feedback_id}: {e}")
            return False

    def print_report(self, stats: Dict[str, Any]):
        """
        Imprime un reporte detallado de los problemas encontrados

        Args:
            stats: Diccionario con estadísticas
        """
        print("\n" + "="*70)
        print("📋 REPORTE DE VERIFICACIÓN DE FEEDBACKS")
        print("="*70)

        print(f"\n📊 Estadísticas Generales:")
        print(f"   Total de feedbacks:        {stats['total']}")
        print(f"   ✅ Feedbacks válidos:      {stats['valid']} ({stats['valid']/stats['total']*100:.1f}%)")
        print(f"   ❌ Feedbacks con problemas: {len(stats['problems'])} ({len(stats['problems'])/stats['total']*100:.1f}%)")

        print(f"\n🔍 Problemas por Tipo:")
        print(f"   🔸 Doble escape:           {stats['double_escaped']}")
        print(f"   🔸 JSON inválido:          {stats['invalid_json']}")
        print(f"   🔸 Keys faltantes:         {stats['missing_keys']}")

        if stats['problems']:
            print(f"\n📝 Detalles de Problemas Encontrados:")
            print("-"*70)

            for i, problem in enumerate(stats['problems'], 1):
                print(f"\n{i}. ID: {problem['id']}")
                print(f"   Estudiante: {problem['studentId']}")
                print(f"   Materia: {problem['subject']}")
                print(f"   Semana: {problem['weekStart']}")
                print(f"   Tipo: {problem['type']}")
                print(f"   Descripción: {problem['description']}")
                print(f"   Corregible: {'✅ Sí' if problem.get('fixable') else '❌ No'}")

                if len(problem['raw']) <= 150:
                    print(f"   Raw: {problem['raw']}")
        else:
            print("\n✨ ¡No se encontraron problemas! Todos los feedbacks tienen JSON válido.")

        print("\n" + "="*70)

    def fix_all_double_escaped(self, problems: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Corrige todos los feedbacks con doble escape

        Args:
            problems: Lista de problemas encontrados

        Returns:
            Dict con contadores de éxitos y fallos
        """
        double_escaped = [p for p in problems if p['type'] == 'double_escaped']

        if not double_escaped:
            print("\n✅ No hay feedbacks con doble escape para corregir")
            return {'success': 0, 'failed': 0}

        print(f"\n🔧 Corrigiendo {len(double_escaped)} feedbacks con doble escape...")

        success = 0
        failed = 0

        for problem in double_escaped:
            if self.fix_double_escaped(problem['id'], problem['raw']):
                print(f"   ✅ Corregido: {problem['id']}")
                success += 1
            else:
                print(f"   ❌ Falló: {problem['id']}")
                failed += 1

        print(f"\n📊 Resultado:")
        print(f"   ✅ Corregidos: {success}")
        print(f"   ❌ Fallidos: {failed}")

        return {'success': success, 'failed': failed}


def main():
    """Función principal"""
    # Verificar si se debe corregir automáticamente
    auto_fix = '--fix' in sys.argv

    print("🚀 Script de Verificación de Feedbacks")
    print("="*70)

    # Crear checker
    checker = FeedbackChecker(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)

    # Ejecutar verificación
    stats = checker.check_all_feedbacks()

    # Imprimir reporte
    checker.print_report(stats)

    # Corregir si se solicitó
    if auto_fix and stats['problems']:
        print("\n" + "="*70)
        response = input("\n⚠️  ¿Deseas corregir automáticamente los problemas de doble escape? (s/n): ")

        if response.lower() == 's':
            result = checker.fix_all_double_escaped(stats['problems'])

            if result['success'] > 0:
                print("\n✅ Correcciones aplicadas. Ejecutando nueva verificación...")
                new_stats = checker.check_all_feedbacks()
                checker.print_report(new_stats)

    print("\n✨ Verificación completada\n")


if __name__ == "__main__":
    main()
