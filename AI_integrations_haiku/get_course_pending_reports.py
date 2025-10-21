#!/usr/bin/env python3
"""
Script: get_course_pending_reports.py
Propósito: Obtener lista de REPORTES INDIVIDUALES pendientes de feedback para un curso/materia
Uso: python scripts/get_course_pending_reports.py "5to A" "Física"

INTEGRACIÓN: Workflow 002 - Eslabón 1 (Selección de Scope)
ARQUITECTURA: Propuesta B - Control + Automatización

IMPORTANTE:
- Retorna REPORTES individuales (NO alumnos agrupados)
- Un alumno con 5 reportes sin feedback = 5 elementos en el array
- Cada reporte se procesa independientemente por un agente
- Normalización de fechas crítica (DATE() en queries)
"""

import sys
import json
from datetime import datetime

def format_curso(curso_input):
    """
    Normaliza el input del curso al formato esperado en la BD

    Ejemplos:
    - "5to A" → academicYear="5to Año", division="A"
    - "4to C" → academicYear="4to Año", division="C"
    """
    parts = curso_input.strip().split()
    if len(parts) != 2:
        raise ValueError(f"Formato de curso inválido: '{curso_input}'. Use formato: '5to A'")

    year = parts[0]  # "5to"
    division = parts[1]  # "A"

    # Convertir a formato BD
    academic_year = f"{year} Año"  # "5to Año"

    return academic_year, division

def print_header(title, width=80):
    """Imprime encabezado formateado"""
    print("\n" + "=" * width)
    print(f" {title} ".center(width))
    print("=" * width)

def print_section(title):
    """Imprime título de sección"""
    print(f"\n┌─ {title} " + "─" * (78 - len(title)))

def main():
    # Verificar argumentos
    if len(sys.argv) < 3:
        print("❌ Error: Faltan argumentos")
        print("\nUso:")
        print('  python scripts/get_course_pending_reports.py "5to A" "Física"')
        print('  python scripts/get_course_pending_reports.py "4to C" "Química"')
        print("\nEjemplos:")
        print('  python scripts/get_course_pending_reports.py "5to A" "Física"')
        sys.exit(1)

    curso_input = sys.argv[1]
    materia = sys.argv[2]

    # Validar materia
    if materia not in ["Física", "Química"]:
        print(f"❌ Error: Materia inválida '{materia}'")
        print("   Materias válidas: Física, Química")
        sys.exit(1)

    # Normalizar curso
    try:
        academic_year, division = format_curso(curso_input)
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    print_header(f"ANÁLISIS DE SCOPE - {curso_input} {materia}")
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Curso: {curso_input} (BD: {academic_year}, {division})")
    print(f"📚 Materia: {materia}")
    print("=" * 80)

    # =========================================================================
    # QUERY PRINCIPAL: Obtener REPORTES individuales sin feedback
    # =========================================================================

    print_section("📊 EJECUTANDO QUERY OPTIMIZADA")

    query = f"""
    SELECT
        pr.id as progressReportId,
        pr.userId as studentId,
        u.name as studentName,
        pr.subject as materia,
        DATE(pr.weekStart) as weekStart,
        DATE(pr.weekEnd) as weekEnd,
        pr.submittedAt,
        u.academicYear,
        u.division,
        f.id as feedback_id
    FROM ProgressReport pr
    INNER JOIN User u ON pr.userId = u.id
    LEFT JOIN Feedback f ON pr.userId = f.studentId
        AND DATE(pr.weekStart) = f.weekStart
        AND pr.subject = f.subject
    WHERE u.role = 'STUDENT'
        AND u.status = 'ACTIVE'
        AND u.academicYear = '{academic_year}'
        AND u.division = '{division}'
        AND pr.subject = '{materia}'
        AND f.id IS NULL
    ORDER BY pr.submittedAt ASC, u.name ASC
    """

    print("\n🔍 Query SQL:")
    print("─" * 80)
    print(query.strip())
    print("─" * 80)

    print("\n⚠️  CRITICAL: Esta query DEBE ejecutarse AHORA con mcp__turso-cloud__execute_read_only_query")
    print("          y los resultados procesados para generar el output estructurado.\n")

    # =========================================================================
    # MARCADOR PARA CLAUDE CODE - NO REMOVER
    # =========================================================================
    print("\n### CLAUDE_CODE_EXECUTE_QUERY ###")
    print(query.strip())
    print("### END_QUERY ###\n")

    # =========================================================================
    # OUTPUT ESPERADO (EJEMPLO)
    # =========================================================================

    print_section("📤 FORMATO DE OUTPUT ESPERADO")

    output_example = {
        "timestamp": datetime.now().isoformat(),
        "curso": curso_input,
        "materia": materia,
        "query_ejecutada": query.strip(),
        "reportes_pendientes": [
            {
                "progressReportId": "pr_abc123",
                "studentId": "u_yf5munab0me67oai8",
                "studentName": "Alippi, Matías Ernesto",
                "materia": materia,
                "weekStart": "2025-09-15",
                "weekEnd": "2025-09-22",
                "submittedAt": "2025-09-20T15:30:00.000Z",
                "tiene_feedback": False,
                "index_en_lista": 0
            },
            {
                "progressReportId": "pr_abc124",
                "studentId": "u_yf5munab0me67oai8",
                "studentName": "Alippi, Matías Ernesto",
                "materia": materia,
                "weekStart": "2025-09-22",
                "weekEnd": "2025-09-29",
                "submittedAt": "2025-09-27T15:30:00.000Z",
                "tiene_feedback": False,
                "index_en_lista": 1
            }
        ],
        "resumen": {
            "total_reportes_pendientes": 2,
            "alumnos_unicos": 1,
            "semanas_distintas": 2
        },
        "agrupacion_por_alumno": {
            "u_yf5munab0me67oai8": {
                "nombre": "Alippi, Matías Ernesto",
                "reportes_pendientes": 2,
                "semanas": ["2025-09-15", "2025-09-22"]
            }
        }
    }

    print("\n📄 Estructura JSON de salida:")
    print(json.dumps(output_example, indent=2, ensure_ascii=False))

    # =========================================================================
    # INSTRUCCIONES PARA INTEGRACIÓN
    # =========================================================================

    print_section("🔧 INSTRUCCIONES PARA INTEGRACIÓN CON W002")

    print("""
    1. Claude Code ejecutará la query usando mcp__turso-cloud__execute_read_only_query
    2. Procesará los resultados y generará el JSON estructurado
    3. Por cada reporte en el array:
       - Lanzar 1 agente workflow-002-student-processor
       - Agente procesa ESE reporte específico
       - Si alumno tiene múltiples reportes → múltiples agentes (loop)

    4. Batching (Eslabón 1):
       - Agrupar reportes en batches de 5-10
       - Ejemplo: 71 reportes → 15 batches de 5 reportes cada uno
       - Cada batch = 5 agentes en paralelo (1 agente = 1 reporte)

    5. Normalización de fechas CRÍTICA:
       - ProgressReport.weekStart: DATETIME
       - Feedback.weekStart: TEXT
       - Query usa DATE(pr.weekStart) para comparación correcta
       - Evita duplicados no detectados
    """)

    # =========================================================================
    # VENTAJAS DE ESTE ENFOQUE
    # =========================================================================

    print_section("✅ VENTAJAS DEL ENFOQUE")

    print("""
    ✅ UNA query optimizada (no N+1)
    ✅ Retorna REPORTES individuales (no alumnos agrupados)
    ✅ Normalización de fechas garantizada (DATE())
    ✅ Cada reporte = 1 ejecución de agente
    ✅ Control por curso/materia (usuario decide)
    ✅ Datos estructurados listos para procesamiento
    ✅ Agrupación por alumno disponible si se necesita
    """)

    print("\n" + "=" * 80)
    print("✅ Script completado. Listo para integración en Workflow 002 - Eslabón 1")
    print("=" * 80 + "\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())
