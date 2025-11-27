#!/usr/bin/env python3
"""
Script de Exportación de Feedbacks 2025 - Intellego Platform
Agrupa feedbacks por estudiante y materia para análisis de fin de año.

Uso:
    python3 scripts/export-feedbacks-2025.py
"""

import json
import os
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any


def parse_json_field(field_value: Any) -> Any:
    """Parsea campos que pueden estar en formato JSON string"""
    if field_value is None:
        return None

    if isinstance(field_value, str):
        # Intentar parsear si parece JSON
        if field_value.startswith('[') or field_value.startswith('{'):
            try:
                return json.loads(field_value)
            except json.JSONDecodeError:
                return field_value

    return field_value


def calculate_statistics(feedbacks: List[Dict]) -> Dict:
    """Calcula estadísticas agregadas de los feedbacks"""
    scores = [f['score'] for f in feedbacks if f['score'] is not None]

    stats = {
        'totalFeedbacks': len(feedbacks),
        'feedbacksWithScore': len(scores),
        'averageScore': round(sum(scores) / len(scores), 2) if scores else None,
        'minScore': min(scores) if scores else None,
        'maxScore': max(scores) if scores else None,
        'weeksCovered': len(set(f['weekStart'] for f in feedbacks)),
        'dateRange': {
            'firstWeek': min(f['weekStart'] for f in feedbacks),
            'lastWeek': max(f['weekStart'] for f in feedbacks)
        }
    }

    return stats


def organize_feedbacks_by_student_and_subject(feedbacks_data: List[Dict]) -> Dict:
    """
    Organiza los feedbacks agrupados por estudiante y materia.

    Returns:
        Dict con estructura: {studentId: {subject: [feedbacks]}}
    """
    organized = defaultdict(lambda: defaultdict(list))

    for feedback in feedbacks_data:
        student_id = feedback['studentId']
        subject = feedback['subject']

        # Parsear campos JSON
        feedback['strengths'] = parse_json_field(feedback['strengths'])
        feedback['improvements'] = parse_json_field(feedback['improvements'])

        organized[student_id][subject].append(feedback)

    return organized


def create_student_subject_json(
    student_id: str,
    student_name: str,
    subject: str,
    feedbacks: List[Dict]
) -> Dict:
    """Crea el JSON estructurado para un estudiante-materia"""

    # Ordenar feedbacks por fecha
    sorted_feedbacks = sorted(feedbacks, key=lambda x: x['weekStart'])

    # Calcular estadísticas
    stats = calculate_statistics(sorted_feedbacks)

    # Estructura del JSON
    output = {
        'metadata': {
            'studentId': student_id,
            'studentName': student_name.strip(),
            'subject': subject,
            'academicYear': 2025,
            'generatedAt': datetime.now().isoformat(),
            'statistics': stats
        },
        'feedbacks': []
    }

    # Agregar feedbacks
    for fb in sorted_feedbacks:
        feedback_entry = {
            'feedbackId': fb['id'],
            'weekStart': fb['weekStart'],
            'score': fb['score'],
            'generalComments': fb['generalComments'],
            'strengths': fb['strengths'],
            'improvements': fb['improvements'],
            'createdAt': fb['createdAt']
        }
        output['feedbacks'].append(feedback_entry)

    return output


def sanitize_filename(name: str) -> str:
    """Sanitiza un nombre para usarlo como nombre de archivo"""
    # Remover caracteres no válidos
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '')

    # Remover espacios extras y strip
    name = ' '.join(name.split()).strip()

    # Reemplazar espacios por guiones bajos
    name = name.replace(' ', '_')

    return name


def main():
    """Función principal"""

    print("=" * 80)
    print("EXPORTACIÓN DE FEEDBACKS 2025 - INTELLEGO PLATFORM")
    print("=" * 80)
    print()

    # Nota: En producción, estos datos vendrían de la query SQL vía MCP
    # Este script está diseñado para recibir los datos como input
    print("⚠️  INSTRUCCIONES:")
    print("Este script debe ejecutarse después de obtener los datos vía MCP.")
    print("Guarda el resultado de la query SQL en 'feedbacks_2025_data.json'")
    print()

    # Buscar archivo de datos
    data_file = 'feedbacks_2025_data.json'

    if not os.path.exists(data_file):
        print(f"❌ Error: No se encontró el archivo '{data_file}'")
        print()
        print("Por favor, ejecuta primero la query SQL y guarda los resultados.")
        print()
        return

    print(f"📂 Cargando datos desde '{data_file}'...")

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    feedbacks_data = data.get('rows', [])

    print(f"✅ Se cargaron {len(feedbacks_data)} feedbacks")
    print()

    # Organizar por estudiante y materia
    print("📊 Organizando feedbacks por estudiante y materia...")
    organized = organize_feedbacks_by_student_and_subject(feedbacks_data)

    total_students = len(organized)
    total_combinations = sum(len(subjects) for subjects in organized.values())

    print(f"✅ Encontrados {total_students} estudiantes")
    print(f"✅ Total de combinaciones alumno-materia: {total_combinations}")
    print()

    # Crear directorio de salida
    output_dir = 'feedbacks_2025_export'
    os.makedirs(output_dir, exist_ok=True)

    print(f"📁 Creando JSONs en directorio '{output_dir}/'...")
    print()

    # Generar JSONs
    files_created = 0

    for student_id, subjects_data in organized.items():
        # Obtener nombre del estudiante del primer feedback
        student_name = None
        for subject, feedbacks in subjects_data.items():
            if feedbacks:
                student_name = feedbacks[0]['studentName']
                break

        if not student_name:
            student_name = f"Student_{student_id[:8]}"

        sanitized_name = sanitize_filename(student_name)

        for subject, feedbacks in subjects_data.items():
            # Crear JSON
            json_data = create_student_subject_json(
                student_id,
                student_name,
                subject,
                feedbacks
            )

            # Nombre del archivo
            sanitized_subject = sanitize_filename(subject)
            filename = f"{sanitized_name}_{sanitized_subject}.json"
            filepath = os.path.join(output_dir, filename)

            # Guardar archivo
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)

            files_created += 1

            # Mostrar progreso cada 10 archivos
            if files_created % 10 == 0:
                print(f"  📝 Creados {files_created} archivos...")

    print()
    print("=" * 80)
    print("✅ EXPORTACIÓN COMPLETADA")
    print("=" * 80)
    print()
    print(f"📊 Resumen:")
    print(f"  • Total de estudiantes: {total_students}")
    print(f"  • Total de archivos JSON creados: {files_created}")
    print(f"  • Directorio de salida: {output_dir}/")
    print()
    print(f"📁 Los archivos tienen el formato: Nombre_Apellido_Materia.json")
    print()
    print("🎯 Próximos pasos:")
    print("  1. Revisa los archivos en el directorio de salida")
    print("  2. Usa Claude Web para analizar cada archivo JSON")
    print("  3. Genera retroalimentaciones de cierre de año personalizadas")
    print()


if __name__ == '__main__':
    main()
