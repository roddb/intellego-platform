#!/usr/bin/env python3
"""
Script de Análisis de Estructura de Base de Datos - Intellego Platform
Analiza el esquema de Turso y genera documentación detallada de todas las tablas.
"""

import re
from typing import Dict, List, Tuple
from datetime import datetime


class DatabaseAnalyzer:
    """Analizador de estructura de base de datos Turso/SQLite"""

    def __init__(self, schema_definitions: List[str]):
        self.schema_definitions = schema_definitions
        self.tables: Dict[str, Dict] = {}

    def parse_schema(self) -> None:
        """Parsea todas las definiciones CREATE TABLE del esquema"""
        for definition in self.schema_definitions:
            table_info = self._parse_table_definition(definition)
            if table_info:
                self.tables[table_info['name']] = table_info

    def _parse_table_definition(self, create_statement: str) -> Dict:
        """Extrae información de una declaración CREATE TABLE"""
        # Extraer nombre de tabla
        table_match = re.search(r'CREATE TABLE\s+"?(\w+)"?\s*\(', create_statement)
        if not table_match:
            return None

        table_name = table_match.group(1)

        # Extraer columnas
        columns = self._parse_columns(create_statement)

        # Extraer foreign keys
        foreign_keys = self._parse_foreign_keys(create_statement)

        # Determinar propósito de la tabla
        purpose = self._infer_table_purpose(table_name, columns)

        return {
            'name': table_name,
            'columns': columns,
            'foreign_keys': foreign_keys,
            'purpose': purpose
        }

    def _parse_columns(self, create_statement: str) -> List[Dict]:
        """Extrae columnas de la declaración CREATE TABLE"""
        columns = []

        # Limpiar statement para mejor parsing
        lines = create_statement.split('\n')

        for line in lines:
            line = line.strip()

            # Skip CREATE TABLE, CONSTRAINT, FOREIGN KEY lines
            if any(keyword in line for keyword in ['CREATE TABLE', 'CONSTRAINT', 'FOREIGN KEY', 'PRIMARY KEY (']):
                continue

            # Skip closing parenthesis
            if line == ')' or not line:
                continue

            # Parse column definition
            column_info = self._parse_column_line(line)
            if column_info:
                columns.append(column_info)

        return columns

    def _parse_column_line(self, line: str) -> Dict:
        """Parsea una línea de definición de columna"""
        # Remove trailing comma
        line = line.rstrip(',')

        # Extract column name (can be quoted)
        name_match = re.match(r'"?(\w+)"?\s+', line)
        if not name_match:
            return None

        column_name = name_match.group(1)

        # Extract type
        type_match = re.search(r'\s+(TEXT|INTEGER|REAL|BOOLEAN|DATETIME|BLOB)\b', line)
        column_type = type_match.group(1) if type_match else 'UNKNOWN'

        # Check constraints
        is_primary = 'PRIMARY KEY' in line
        is_nullable = 'NOT NULL' not in line
        is_unique = 'UNIQUE' in line
        has_default = 'DEFAULT' in line

        # Extract default value
        default_value = None
        if has_default:
            default_match = re.search(r"DEFAULT\s+([^,)]+)", line)
            if default_match:
                default_value = default_match.group(1).strip()

        # Infer purpose
        purpose = self._infer_column_purpose(column_name, column_type)

        return {
            'name': column_name,
            'type': column_type,
            'primary_key': is_primary,
            'nullable': is_nullable,
            'unique': is_unique,
            'default': default_value,
            'purpose': purpose
        }

    def _parse_foreign_keys(self, create_statement: str) -> List[Dict]:
        """Extrae relaciones de foreign keys"""
        foreign_keys = []

        fk_pattern = r'FOREIGN KEY\s*\("?(\w+)"?\)\s*REFERENCES\s+"?(\w+)"?\s*\("?(\w+)"?\)'
        matches = re.finditer(fk_pattern, create_statement)

        for match in matches:
            foreign_keys.append({
                'column': match.group(1),
                'references_table': match.group(2),
                'references_column': match.group(3)
            })

        return foreign_keys

    def _infer_table_purpose(self, table_name: str, columns: List[Dict]) -> str:
        """Infiere el propósito de una tabla basado en su nombre y columnas"""
        purposes = {
            'User': 'Almacena información de usuarios (estudiantes, instructores, administradores)',
            'Question': 'Catálogo de preguntas para reportes de progreso semanales',
            'ProgressReport': 'Reportes de progreso semanales enviados por estudiantes',
            'Answer': 'Respuestas individuales a preguntas dentro de reportes de progreso',
            'Feedback': 'Retroalimentación generada por instructores o IA sobre reportes',
            'Evaluation': 'Evaluaciones de exámenes con puntuaciones y feedback',
            'PasswordAudit': 'Registro de auditoría para cambios de contraseña',
            'PasswordPolicy': 'Políticas de seguridad para contraseñas',
            'CalendarEvent': 'Eventos de calendario para estudiantes e instructores',
            'Task': 'Tareas y pendientes creados por estudiantes',
            'ImpersonationLog': 'Registro de suplantación de identidad de instructores',
            'ConsudecActivity': 'Actividades de casos clínicos pedagógicos tipo CONSUDEC',
            'ConsudecSubmission': 'Envíos de estudiantes para actividades CONSUDEC',
            'test_feedback': 'Tabla de prueba para feedback (deprecated)'
        }

        return purposes.get(table_name, f'Tabla {table_name} - propósito no documentado')

    def _infer_column_purpose(self, column_name: str, column_type: str) -> str:
        """Infiere el propósito de una columna basado en su nombre y tipo"""
        common_purposes = {
            'id': 'Identificador único (Primary Key)',
            'userId': 'Referencia al usuario propietario',
            'studentId': 'Referencia a estudiante',
            'instructorId': 'Referencia a instructor',
            'name': 'Nombre del registro',
            'email': 'Correo electrónico',
            'password': 'Contraseña hasheada',
            'role': 'Rol del usuario (STUDENT, INSTRUCTOR, ADMIN)',
            'createdAt': 'Fecha y hora de creación',
            'updatedAt': 'Fecha y hora de última actualización',
            'createdBy': 'Usuario que creó el registro',
            'submittedAt': 'Fecha y hora de envío',
            'status': 'Estado del registro',
            'subject': 'Materia académica',
            'score': 'Puntuación o calificación',
            'feedback': 'Comentarios de retroalimentación',
            'weekStart': 'Inicio de la semana',
            'weekEnd': 'Fin de la semana',
            'apiCost': 'Costo de llamada a API de IA',
            'apiModel': 'Modelo de IA utilizado',
            'apiTokensInput': 'Tokens de entrada consumidos',
            'apiTokensOutput': 'Tokens de salida generados'
        }

        # Check exact match first
        if column_name in common_purposes:
            return common_purposes[column_name]

        # Pattern matching for common suffixes
        if column_name.endswith('Id'):
            return f'Referencia a {column_name[:-2]}'
        if column_name.endswith('At'):
            return f'Timestamp de {column_name[:-2]}'
        if column_name.endswith('By'):
            return f'Usuario que realizó {column_name[:-2]}'

        # Type-based inference
        if column_type == 'DATETIME' or 'date' in column_name.lower() or 'time' in column_name.lower():
            return 'Fecha/hora'
        if column_type == 'BOOLEAN':
            return 'Valor booleano (verdadero/falso)'
        if column_type == 'INTEGER' and 'count' in column_name.lower():
            return 'Contador numérico'

        return f'Campo de tipo {column_type}'

    def generate_report(self) -> str:
        """Genera un reporte completo de la estructura de la base de datos"""
        report = []
        report.append("=" * 100)
        report.append("ANÁLISIS DE ESTRUCTURA DE BASE DE DATOS - INTELLEGO PLATFORM")
        report.append("=" * 100)
        report.append(f"\nGenerado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total de tablas: {len(self.tables)}\n")

        # Table of contents
        report.append("\n" + "=" * 100)
        report.append("ÍNDICE DE TABLAS")
        report.append("=" * 100)
        for i, table_name in enumerate(sorted(self.tables.keys()), 1):
            table = self.tables[table_name]
            report.append(f"\n{i}. {table_name}")
            report.append(f"   Propósito: {table['purpose']}")
            report.append(f"   Columnas: {len(table['columns'])}")
            if table['foreign_keys']:
                report.append(f"   Relaciones: {len(table['foreign_keys'])}")

        # Detailed table documentation
        report.append("\n\n" + "=" * 100)
        report.append("DOCUMENTACIÓN DETALLADA DE TABLAS")
        report.append("=" * 100)

        for table_name in sorted(self.tables.keys()):
            table = self.tables[table_name]
            report.append(f"\n\n{'─' * 100}")
            report.append(f"TABLA: {table_name}")
            report.append('─' * 100)
            report.append(f"\nPROPÓSITO:")
            report.append(f"  {table['purpose']}")

            # Columns
            report.append(f"\nCOLUMNAS ({len(table['columns'])}):")
            report.append("")

            for col in table['columns']:
                report.append(f"  • {col['name']} ({col['type']})")
                report.append(f"    Propósito: {col['purpose']}")

                constraints = []
                if col['primary_key']:
                    constraints.append("PRIMARY KEY")
                if not col['nullable']:
                    constraints.append("NOT NULL")
                if col['unique']:
                    constraints.append("UNIQUE")
                if col['default']:
                    constraints.append(f"DEFAULT {col['default']}")

                if constraints:
                    report.append(f"    Restricciones: {', '.join(constraints)}")
                report.append("")

            # Foreign Keys
            if table['foreign_keys']:
                report.append(f"RELACIONES ({len(table['foreign_keys'])}):")
                report.append("")
                for fk in table['foreign_keys']:
                    report.append(f"  • {fk['column']} → {fk['references_table']}.{fk['references_column']}")
                    report.append(f"    Esta columna referencia a la tabla {fk['references_table']}")
                report.append("")

        # Entity Relationship Summary
        report.append("\n\n" + "=" * 100)
        report.append("RESUMEN DE RELACIONES ENTRE ENTIDADES")
        report.append("=" * 100)
        report.append("")

        for table_name in sorted(self.tables.keys()):
            table = self.tables[table_name]
            if table['foreign_keys']:
                report.append(f"\n{table_name}:")
                for fk in table['foreign_keys']:
                    report.append(f"  ├─ Depende de: {fk['references_table']}")

        # Key Statistics
        report.append("\n\n" + "=" * 100)
        report.append("ESTADÍSTICAS CLAVE")
        report.append("=" * 100)
        report.append("")

        total_columns = sum(len(table['columns']) for table in self.tables.values())
        total_relationships = sum(len(table['foreign_keys']) for table in self.tables.values())

        report.append(f"Total de tablas: {len(self.tables)}")
        report.append(f"Total de columnas: {total_columns}")
        report.append(f"Total de relaciones (Foreign Keys): {total_relationships}")
        report.append("")

        # Tables by category
        report.append("\nTABLAS POR CATEGORÍA:")
        report.append("")
        report.append("Core (Usuarios y Autenticación):")
        report.append("  • User, PasswordAudit, PasswordPolicy")
        report.append("")
        report.append("Reportes de Progreso:")
        report.append("  • ProgressReport, Question, Answer, Feedback")
        report.append("")
        report.append("Evaluaciones:")
        report.append("  • Evaluation")
        report.append("")
        report.append("Actividades CONSUDEC:")
        report.append("  • ConsudecActivity, ConsudecSubmission")
        report.append("")
        report.append("Productividad Estudiantil:")
        report.append("  • CalendarEvent, Task")
        report.append("")
        report.append("Auditoría y Seguridad:")
        report.append("  • ImpersonationLog, PasswordAudit, PasswordPolicy")

        report.append("\n\n" + "=" * 100)
        report.append("FIN DEL REPORTE")
        report.append("=" * 100)

        return '\n'.join(report)


def main():
    """Función principal que ejecuta el análisis"""

    # Schema definitions from Turso database
    schema_definitions = [
        """CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sede" TEXT,
    "academicYear" TEXT,
    "division" TEXT,
    "subjects" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE'
)""",
        """CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
)""",
        """CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)""",
        """CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "progressReportId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_progressReportId_fkey" FOREIGN KEY ("progressReportId") REFERENCES "ProgressReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)""",
        """CREATE TABLE PasswordAudit (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          action TEXT NOT NULL,
          performedBy TEXT,
          timestamp TEXT NOT NULL,
          ipAddress TEXT,
          reason TEXT,
          FOREIGN KEY (userId) REFERENCES User(id)
        )""",
        """CREATE TABLE PasswordPolicy (
          id TEXT PRIMARY KEY,
          minLength INTEGER DEFAULT 8,
          requireUppercase BOOLEAN DEFAULT 1,
          requireLowercase BOOLEAN DEFAULT 1,
          requireNumbers BOOLEAN DEFAULT 1,
          requireSpecialChars BOOLEAN DEFAULT 1,
          preventReuse BOOLEAN DEFAULT 1,
          reuseHistoryCount INTEGER DEFAULT 5,
          maxAttempts INTEGER DEFAULT 5,
          lockoutDuration INTEGER DEFAULT 300,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        , isActive INTEGER DEFAULT 1, policyName TEXT, description TEXT, maxLength INTEGER DEFAULT 128, allowedSpecialChars TEXT DEFAULT "!@#$%^&*()_+-=[]{}|;:,.<>?", expirationDays INTEGER, appliesTo TEXT DEFAULT "ALL")""",
        """CREATE TABLE CalendarEvent (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      type TEXT DEFAULT 'personal',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id)
    )""",
        """CREATE TABLE Task (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      subject TEXT,
      estimatedHours INTEGER,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES User(id)
    )""",
        """CREATE TABLE test_feedback (id TEXT PRIMARY KEY, data TEXT)""",
        """CREATE TABLE ImpersonationLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instructorId TEXT NOT NULL,
        instructorEmail TEXT NOT NULL,
        studentId TEXT NOT NULL,
        studentEmail TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('START', 'END')),
        timestamp TEXT NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )""",
        """CREATE TABLE Evaluation (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  subject TEXT NOT NULL,
  examDate TEXT NOT NULL,
  examTopic TEXT NOT NULL,
  score INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')), apiCost REAL DEFAULT 0.0, apiModel TEXT DEFAULT 'claude-haiku-4-5', apiTokensInput INTEGER DEFAULT 0, apiTokensOutput INTEGER DEFAULT 0,
  FOREIGN KEY (studentId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES User(id)
)""",
        """CREATE TABLE "Feedback" (
    id TEXT NOT NULL PRIMARY KEY,
    studentId TEXT NOT NULL,
    progressReportId TEXT,
    weekStart TEXT NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER,
    generalComments TEXT,
    strengths TEXT,
    improvements TEXT,
    aiAnalysis TEXT,
    createdBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    skillsMetrics TEXT
, apiCost REAL)""",
        """CREATE TABLE ConsudecActivity (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        caseText TEXT NOT NULL,
        questions TEXT NOT NULL,
        subject TEXT,
        difficulty TEXT DEFAULT 'medium',
        estimatedTime INTEGER,
        status TEXT DEFAULT 'active',
        availableFrom TEXT,
        availableUntil TEXT,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL, activityType TEXT DEFAULT 'pedagogical',
        FOREIGN KEY (createdBy) REFERENCES User(id)
      )""",
        """CREATE TABLE ConsudecSubmission (
        id TEXT PRIMARY KEY,
        activityId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        answers TEXT NOT NULL,
        questionScores TEXT,
        overallScore REAL,
        percentageAchieved REAL,
        generalFeedback TEXT,
        apiCost REAL,
        apiModel TEXT DEFAULT 'claude-haiku-4-5',
        apiTokensInput INTEGER,
        apiTokensOutput INTEGER,
        manualScore REAL,
        manualFeedback TEXT,
        evaluatedBy TEXT,
        evaluatedAt TEXT,
        status TEXT DEFAULT 'draft',
        submittedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (activityId) REFERENCES ConsudecActivity(id),
        FOREIGN KEY (studentId) REFERENCES User(id),
        FOREIGN KEY (evaluatedBy) REFERENCES User(id)
      )"""
    ]

    print("🔍 Iniciando análisis de estructura de base de datos...")
    print("")

    analyzer = DatabaseAnalyzer(schema_definitions)
    analyzer.parse_schema()

    print(f"✅ Se encontraron {len(analyzer.tables)} tablas")
    print("")
    print("📊 Generando reporte detallado...")
    print("")

    report = analyzer.generate_report()

    # Save to file
    output_file = 'database_structure_report.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"✅ Reporte guardado en: {output_file}")
    print("")
    print("Vista previa del reporte:")
    print("")
    print(report)


if __name__ == '__main__':
    main()
