#!/usr/bin/env python3
"""
Script to verify that all students have the exams they should have.

This script:
1. Identifies all unique exams in the database (by subject, topic, date)
2. For each exam, determines which students should have it (based on course)
3. Reports students who are missing exams
4. Reports students with duplicate exams
5. Reports students with exams from wrong courses

Usage:
    python3 scripts/check_missing_exams.py [--export-json] [--show-details]

Options:
    --export-json    Export results to JSON file
    --show-details   Show detailed student lists
"""

import os
import sys
import json
import re
from typing import List, Dict, Set, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from collections import defaultdict

# For now, we'll use direct SQL queries via MCP
# In the future, this can be adapted to use libsql_experimental

@dataclass
class Student:
    id: str
    name: str
    student_id: str
    academic_year: str
    division: str
    sede: str


@dataclass
class Exam:
    subject: str
    topic: str
    date: str
    academic_year: str
    division: str


@dataclass
class ExamInstance:
    id: str
    student_id: str
    subject: str
    topic: str
    date: str
    score: int


@dataclass
class MissingExamReport:
    exam: Exam
    total_students_in_course: int
    students_with_exam: int
    students_missing: List[Student]
    percentage_complete: float


@dataclass
class DuplicateExamReport:
    student: Student
    exam: Exam
    count: int
    exam_ids: List[str]


@dataclass
class WrongCourseReport:
    student: Student
    exam: Exam
    student_course: str
    exam_course: str


def parse_subject_course(subject: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse subject string to extract academic year and division.

    Examples:
        "Física 5to A" -> ("5to Año", "A")
        "Química 4to C" -> ("4to Año", "C")
        "Matemática" -> (None, None)
    """
    pattern = r'(\d)(?:to|ro)\s*([A-Z])'
    match = re.search(pattern, subject)

    if match:
        year_num = match.group(1)
        division = match.group(2)
        academic_year = '3er Año' if year_num == '3' else f'{year_num}to Año'
        return academic_year, division

    return None, None


def normalize_topic(topic: str) -> str:
    """
    Normalize exam topic for comparison.
    Handles typos and variations.

    Examples:
        "Termoedinámica" -> "termodinamica"
        "Equilibrio Químico" -> "equilibrio quimico"
    """
    # Remove accents and convert to lowercase
    normalized = topic.lower()
    normalized = normalized.replace('á', 'a').replace('é', 'e').replace('í', 'i')
    normalized = normalized.replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
    return normalized.strip()


# =============================================================================
# DATA FETCHING FUNCTIONS (To be replaced with actual DB queries)
# =============================================================================

def get_all_students() -> List[Student]:
    """
    Fetch all students from database.

    TODO: Replace with actual MCP query
    """
    print("⚠️  This is a template script. You need to run actual MCP queries.")
    print("   See USAGE section below for SQL queries to use.\n")
    return []


def get_all_exam_instances() -> List[ExamInstance]:
    """
    Fetch all exam instances from database.

    TODO: Replace with actual MCP query
    """
    return []


# =============================================================================
# ANALYSIS FUNCTIONS
# =============================================================================

def group_students_by_course(students: List[Student]) -> Dict[str, List[Student]]:
    """Group students by their course (academicYear + division)."""
    courses = defaultdict(list)
    for student in students:
        course_key = f"{student.academic_year}_{student.division}"
        courses[course_key].append(student)
    return dict(courses)


def identify_unique_exams(exam_instances: List[ExamInstance]) -> List[Exam]:
    """
    Identify unique exams from exam instances.
    Groups by subject, normalized topic, and date.
    """
    exam_set = set()
    exams = []

    for instance in exam_instances:
        academic_year, division = parse_subject_course(instance.subject)

        if not academic_year or not division:
            continue

        normalized_topic = normalize_topic(instance.topic)
        exam_key = (instance.subject, normalized_topic, instance.date)

        if exam_key not in exam_set:
            exam_set.add(exam_key)
            exams.append(Exam(
                subject=instance.subject,
                topic=instance.topic,  # Keep original topic
                date=instance.date,
                academic_year=academic_year,
                division=division
            ))

    return exams


def find_missing_exams(
    exams: List[Exam],
    students_by_course: Dict[str, List[Student]],
    exam_instances: List[ExamInstance]
) -> List[MissingExamReport]:
    """
    Find students who are missing exams they should have.
    """
    reports = []

    for exam in exams:
        # Get course key
        course_key = f"{exam.academic_year}_{exam.division}"

        # Get all students in this course
        students_in_course = students_by_course.get(course_key, [])

        if not students_in_course:
            continue

        # Find which students have this exam
        students_with_exam = set()
        normalized_exam_topic = normalize_topic(exam.topic)

        for instance in exam_instances:
            if (instance.subject == exam.subject and
                instance.date == exam.date and
                normalize_topic(instance.topic) == normalized_exam_topic):
                students_with_exam.add(instance.student_id)

        # Find missing students
        missing_students = [
            student for student in students_in_course
            if student.id not in students_with_exam
        ]

        # Calculate percentage
        total = len(students_in_course)
        with_exam = len(students_with_exam)
        percentage = (with_exam / total * 100) if total > 0 else 0

        # Only report if there are missing students
        if missing_students:
            reports.append(MissingExamReport(
                exam=exam,
                total_students_in_course=total,
                students_with_exam=with_exam,
                students_missing=missing_students,
                percentage_complete=percentage
            ))

    return reports


def find_duplicate_exams(
    students: List[Student],
    exam_instances: List[ExamInstance]
) -> List[DuplicateExamReport]:
    """
    Find students who have the same exam multiple times.
    """
    reports = []
    students_by_id = {s.id: s for s in students}

    # Group exam instances by student and exam
    student_exams = defaultdict(lambda: defaultdict(list))

    for instance in exam_instances:
        normalized_topic = normalize_topic(instance.topic)
        exam_key = (instance.subject, normalized_topic, instance.date)
        student_exams[instance.student_id][exam_key].append(instance.id)

    # Find duplicates
    for student_id, exams in student_exams.items():
        student = students_by_id.get(student_id)
        if not student:
            continue

        for exam_key, exam_ids in exams.items():
            if len(exam_ids) > 1:
                subject, topic, date = exam_key
                academic_year, division = parse_subject_course(subject)

                if academic_year and division:
                    # Get original topic from first instance
                    original_topic = next(
                        (inst.topic for inst in exam_instances if inst.id == exam_ids[0]),
                        topic
                    )

                    reports.append(DuplicateExamReport(
                        student=student,
                        exam=Exam(
                            subject=subject,
                            topic=original_topic,
                            date=date,
                            academic_year=academic_year,
                            division=division
                        ),
                        count=len(exam_ids),
                        exam_ids=exam_ids
                    ))

    return reports


# =============================================================================
# REPORTING FUNCTIONS
# =============================================================================

def print_missing_exams_summary(reports: List[MissingExamReport]):
    """Print summary of missing exams."""
    print("\n" + "=" * 80)
    print("📊 MISSING EXAMS REPORT")
    print("=" * 80)

    if not reports:
        print("\n✅ Great! All students have all the exams they should have.\n")
        return

    # Sort by percentage complete (worst first)
    reports.sort(key=lambda r: r.percentage_complete)

    print(f"\n❌ Found {len(reports)} exams with missing student submissions\n")

    for i, report in enumerate(reports, 1):
        print(f"\n{i}. {report.exam.subject} - {report.exam.topic}")
        print(f"   Date: {report.exam.date}")
        print(f"   Progress: {report.students_with_exam}/{report.total_students_in_course} students ({report.percentage_complete:.1f}%)")
        print(f"   Missing: {len(report.students_missing)} students")

        # Show first 5 missing students
        if report.students_missing:
            print(f"   Students without exam:")
            for student in report.students_missing[:5]:
                print(f"      - {student.name} ({student.student_id})")

            if len(report.students_missing) > 5:
                print(f"      ... and {len(report.students_missing) - 5} more")

    print("\n" + "=" * 80)


def print_duplicate_exams_summary(reports: List[DuplicateExamReport]):
    """Print summary of duplicate exams."""
    print("\n" + "=" * 80)
    print("📊 DUPLICATE EXAMS REPORT")
    print("=" * 80)

    if not reports:
        print("\n✅ No duplicate exams found.\n")
        return

    print(f"\n⚠️  Found {len(reports)} duplicate exam submissions\n")

    for i, report in enumerate(reports, 1):
        print(f"\n{i}. Student: {report.student.name} ({report.student.student_id})")
        print(f"   Exam: {report.exam.subject} - {report.exam.topic}")
        print(f"   Date: {report.exam.date}")
        print(f"   Duplicates: {report.count} copies")
        print(f"   IDs: {', '.join(report.exam_ids)}")

    print("\n" + "=" * 80)


def export_to_json(
    missing_reports: List[MissingExamReport],
    duplicate_reports: List[DuplicateExamReport],
    filename: str = "exam_verification_report.json"
):
    """Export reports to JSON file."""
    data = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "exams_with_missing_students": len(missing_reports),
            "total_duplicate_submissions": len(duplicate_reports)
        },
        "missing_exams": [
            {
                "exam": {
                    "subject": r.exam.subject,
                    "topic": r.exam.topic,
                    "date": r.exam.date,
                    "course": f"{r.exam.academic_year} {r.exam.division}"
                },
                "stats": {
                    "total_students": r.total_students_in_course,
                    "students_with_exam": r.students_with_exam,
                    "students_missing": len(r.students_missing),
                    "percentage_complete": round(r.percentage_complete, 2)
                },
                "missing_students": [
                    {
                        "name": s.name,
                        "student_id": s.student_id,
                        "id": s.id
                    }
                    for s in r.students_missing
                ]
            }
            for r in missing_reports
        ],
        "duplicate_exams": [
            {
                "student": {
                    "name": r.student.name,
                    "student_id": r.student.student_id,
                    "id": r.student.id
                },
                "exam": {
                    "subject": r.exam.subject,
                    "topic": r.exam.topic,
                    "date": r.exam.date
                },
                "count": r.count,
                "exam_ids": r.exam_ids
            }
            for r in duplicate_reports
        ]
    }

    filepath = os.path.join("scripts", filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Report exported to: {filepath}")


# =============================================================================
# MAIN & USAGE
# =============================================================================

def print_usage_instructions():
    """Print instructions on how to use this script with MCP."""
    print("\n" + "=" * 80)
    print("📖 HOW TO USE THIS SCRIPT")
    print("=" * 80)
    print("""
This script requires data from the Turso database via MCP.

STEP 1: Get all students
-------------------------
Use MCP query:

SELECT id, name, studentId, academicYear, division, sede
FROM User
WHERE role = 'STUDENT'
ORDER BY academicYear, division, name


STEP 2: Get all exam instances
-------------------------------
Use MCP query:

SELECT id, studentId, subject, examTopic, examDate, score
FROM Evaluation
ORDER BY examDate DESC


STEP 3: Save the results
------------------------
Save the JSON results from both queries to files:
- scripts/students_data.json
- scripts/exams_data.json


STEP 4: Run the analysis
------------------------
Modify this script to read from those JSON files and run the analysis.


ALTERNATIVE: Direct MCP Integration
------------------------------------
This script can be enhanced to use MCP directly by importing the
turso-intellego MCP server functions.
""")
    print("=" * 80 + "\n")


def main():
    """Main execution function."""
    print("🔍 Intellego Platform - Exam Coverage Verification")
    print("=" * 80)

    # For now, print usage instructions
    print_usage_instructions()

    print("\n⚠️  This is a template script.")
    print("   To use it, you need to:")
    print("   1. Run the MCP queries shown above")
    print("   2. Modify this script to load the data")
    print("   3. Run the analysis functions")
    print("\n   Or ask Claude to integrate MCP queries directly.\n")


if __name__ == "__main__":
    main()
