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

import subprocess
import json
import sys
from typing import List, Dict, Any, Optional


class FeedbackChecker:
    """Clase para verificar y corregir JSON en feedbacks"""

    def __init__(self, db_name: str = "intellego-production"):
        """
        Inicializa el checker con el nombre de la base de datos

        Args:
            db_name: Nombre de la base de datos Turso
        """
        self.db_name = db_name
        self.problems_found = []

    def _execute_query(self, query: str) -> List[List[Any]]:
        """
        Ejecuta una query SQL usando Turso CLI

        Args:
            query: Query SQL a ejecutar

        Returns:
            Lista de filas con los resultados
        """
        try:
            # Ejecutar con turso CLI
            result = subprocess.run(
                ['turso', 'db', 'shell', self.db_name, query],
                capture_output=True,
                text=True,
                check=True
            )

            # Parsear resultados (formato de columnas con espacios)
            output = result.stdout.strip()

            if not output:
                return []

            lines = output.split('\n')

            if len(lines) < 2:
                return []

            # Primera línea son los headers (para entender las columnas)
            headers_line = lines[0]

            # Encontrar las posiciones de cada columna basándose en los headers
            # Los headers están separados por múltiples espacios
            import re
            # Dividir por múltiples espacios
            headers = [h.strip() for h in re.split(r'\s{2,}', headers_line) if h.strip()]

            # Las líneas de datos empiezan en la línea 1
            data_lines = [l for l in lines[1:] if l.strip()]

            results = []
            for line in data_lines:
                # Dividir por múltiples espacios (mínimo 2)
                # Pero el último campo (skillsMetrics) puede contener espacios
                # así que necesitamos un enfoque diferente

                # Usar regex para dividir por 2 o más espacios
                parts = re.split(r'\s{2,}', line.strip())

                # Limpiar y agregar
                if len(parts) >= len(headers):
                    # Si hay más partes que headers, los últimos son parte del skillsMetrics
                    if len(parts) > len(headers):
                        # Unir las partes extra al último campo
                        parts = parts[:len(headers)-1] + [' '.join(parts[len(headers)-1:])]
                    results.append(parts)
                elif len(parts) > 0:
                    # Rellenar con strings vacíos si faltan columnas
                    while len(parts) < len(headers):
                        parts.append('')
                    results.append(parts)

            return results

        except subprocess.CalledProcessError as e:
            print(f"❌ Error ejecutando query: {e.stderr}")
            return []
        except Exception as e:
            print(f"❌ Error inesperado: {e}")
            return []

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
            ORDER BY createdAt DESC;
        """

        feedbacks = self._execute_query(query)

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
            if len(feedback) < 5:
                continue

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

    def _check_feedback(self, feedback: List[str]) -> Optional[Dict[str, Any]]:
        """
        Verifica un feedback individual

        Args:
            feedback: Lista con datos del feedback [id, studentId, subject, weekStart, skillsMetrics]

        Returns:
            Dict con detalles del problema o None si está OK
        """
        feedback_id = feedback[0]
        student_id = feedback[1]
        subject = feedback[2]
        week_start = feedback[3]
        skills_metrics = feedback[4] if len(feedback) > 4 else ""

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
        return r'\\\"' in json_str or '\\\\\"' in json_str or '\\\\"' in json_str

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
            fixed_json = skills_metrics.replace('\\\"', '"').replace('\\\\\\"', '\\"')

            # Verificar que el JSON sea válido
            data = json.loads(fixed_json)

            # Escapar comillas para SQL
            fixed_json_escaped = fixed_json.replace("'", "''")
            feedback_id_escaped = feedback_id.replace("'", "''")

            # Actualizar en la base de datos
            query = f"""
                UPDATE Feedback
                SET skillsMetrics = '{fixed_json_escaped}',
                    updatedAt = datetime('now')
                WHERE id = '{feedback_id_escaped}';
            """

            self._execute_query(query)

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
    checker = FeedbackChecker()

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
