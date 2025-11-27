#!/usr/bin/env python3
"""
Script para obtener todos los feedbacks de 2025 desde Turso
y preparar los datos para exportación.

Este script usa directamente la data del MCP query que ya tenemos.
"""

import json
import sys


def main():
    """
    Este script se ejecutará obteniendo los datos vía MCP.
    Claude Code ejecutará la query SQL y guardará el resultado.
    """

    print("=" * 80)
    print("OBTENCIÓN DE FEEDBACKS 2025 DESDE TURSO")
    print("=" * 80)
    print()
    print("📡 Ejecutando query SQL vía turso-intellego MCP...")
    print()
    print("Query SQL:")
    print("-" * 80)

    sql_query = """
SELECT
  f.id,
  f.studentId,
  u.name as studentName,
  f.subject,
  f.weekStart,
  f.score,
  f.generalComments,
  f.strengths,
  f.improvements,
  f.createdAt
FROM Feedback f
JOIN User u ON f.studentId = u.id
WHERE f.weekStart >= '2025-01-01' AND f.weekStart < '2026-01-01'
ORDER BY u.name, f.subject, f.weekStart
"""

    print(sql_query)
    print("-" * 80)
    print()
    print("⏳ Esperando resultados de la base de datos...")
    print()
    print("ℹ️  Este paso será ejecutado por Claude Code usando el MCP turso-intellego")
    print()


if __name__ == '__main__':
    main()
