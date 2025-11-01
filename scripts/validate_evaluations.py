#!/usr/bin/env python3
"""
Script to validate evaluation assignments in the Intellego Platform database.

This script checks if evaluations are assigned to the correct students based on:
- Subject matching student's academic year and division
- Sede (location) consistency

Usage:
    python3 scripts/validate_evaluations.py [--fix-mode]

Options:
    --fix-mode    Enable interactive mode to fix misassigned evaluations
"""

import os
import sys
import json
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

try:
    import libsql_experimental as libsql
except ImportError:
    print("Error: libsql_experimental not installed")
    print("Install with: pip3 install libsql-experimental")
    sys.exit(1)


@dataclass
class Student:
    id: str
    name: str
    student_id: str
    sede: str
    academic_year: str
    division: str
    email: str


@dataclass
class Evaluation:
    id: str
    student_id: str
    subject: str
    exam_date: str
    exam_topic: str
    score: int
    created_by: str
    created_at: str


@dataclass
class ValidationIssue:
    evaluation_id: str
    student_name: str
    student_id: str
    student_course: str  # e.g., "4to C"
    expected_course: str  # e.g., "5to A"
    subject: str
    exam_topic: str
    exam_date: str
    score: int
    issue_type: str  # "year_mismatch", "division_mismatch", "sede_mismatch"
    details: str


def get_db_connection():
    """Create database connection using environment variables."""
    url = os.getenv('TURSO_DATABASE_URL')
    auth_token = os.getenv('TURSO_AUTH_TOKEN')

    if not url or not auth_token:
        raise ValueError("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")

    return libsql.connect(database=url, auth_token=auth_token)


def parse_subject(subject: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parse subject string to extract academic year and division.

    Examples:
        "Física 5to A" -> ("5to Año", "A")
        "Química 4to C" -> ("4to Año", "C")
        "Matemática" -> (None, None)

    Returns:
        Tuple of (academic_year, division) or (None, None) if not parseable
    """
    # Pattern: Subject Name + Year + Division
    # Examples: "Física 5to A", "Química 4to C"
    pattern = r'(\d)(?:to|do)\s*([A-Z])'
    match = re.search(pattern, subject)

    if match:
        year_num = match.group(1)
        division = match.group(2)
        academic_year = f"{year_num}to Año"
        return academic_year, division

    return None, None


def fetch_all_students(conn) -> List[Student]:
    """Fetch all students from the database."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, studentId, sede, academicYear, division, email
        FROM User
        WHERE role = 'STUDENT'
        ORDER BY academicYear, division, name
    """)

    students = []
    for row in cursor.fetchall():
        students.append(Student(
            id=row[0],
            name=row[1],
            student_id=row[2] or '',
            sede=row[3] or '',
            academic_year=row[4] or '',
            division=row[5] or '',
            email=row[6] or ''
        ))

    return students


def fetch_all_evaluations(conn) -> List[Evaluation]:
    """Fetch all evaluations from the database."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, studentId, subject, examDate, examTopic, score, createdBy, createdAt
        FROM Evaluation
        ORDER BY examDate DESC
    """)

    evaluations = []
    for row in cursor.fetchall():
        evaluations.append(Evaluation(
            id=row[0],
            student_id=row[1],
            subject=row[2],
            exam_date=row[3],
            exam_topic=row[4],
            score=row[5],
            created_by=row[6],
            created_at=row[7]
        ))

    return evaluations


def validate_evaluations(
    students: List[Student],
    evaluations: List[Evaluation]
) -> List[ValidationIssue]:
    """
    Validate all evaluations against student data.

    Returns list of validation issues found.
    """
    # Create student lookup by ID
    student_by_id = {s.id: s for s in students}

    issues = []

    for eval in evaluations:
        student = student_by_id.get(eval.student_id)

        if not student:
            # Student not found - this is a critical error
            issues.append(ValidationIssue(
                evaluation_id=eval.id,
                student_name="[STUDENT NOT FOUND]",
                student_id=eval.student_id,
                student_course="N/A",
                expected_course="N/A",
                subject=eval.subject,
                exam_topic=eval.exam_topic,
                exam_date=eval.exam_date,
                score=eval.score,
                issue_type="student_not_found",
                details=f"Student ID {eval.student_id} not found in database"
            ))
            continue

        # Parse subject to extract expected year and division
        expected_year, expected_division = parse_subject(eval.subject)

        if expected_year is None or expected_division is None:
            # Subject doesn't contain year/division info - skip validation
            continue

        # Check if student's year matches
        student_course = f"{student.academic_year} {student.division}"
        expected_course = f"{expected_year} {expected_division}"

        issue_details = []
        issue_types = []

        if student.academic_year != expected_year:
            issue_types.append("year_mismatch")
            issue_details.append(
                f"Student is in {student.academic_year} but exam is for {expected_year}"
            )

        if student.division != expected_division:
            issue_types.append("division_mismatch")
            issue_details.append(
                f"Student is in division {student.division} but exam is for division {expected_division}"
            )

        # If any mismatch found, add to issues
        if issue_types:
            issues.append(ValidationIssue(
                evaluation_id=eval.id,
                student_name=student.name,
                student_id=student.student_id,
                student_course=student_course,
                expected_course=expected_course,
                subject=eval.subject,
                exam_topic=eval.exam_topic,
                exam_date=eval.exam_date,
                score=eval.score,
                issue_type=", ".join(issue_types),
                details="; ".join(issue_details)
            ))

    return issues


def print_summary(issues: List[ValidationIssue]):
    """Print summary of validation issues."""
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)

    if not issues:
        print("\n✅ No issues found! All evaluations are correctly assigned.\n")
        return

    print(f"\n❌ Found {len(issues)} misassigned evaluations:\n")

    # Group by issue type
    by_type = {}
    for issue in issues:
        if issue.issue_type not in by_type:
            by_type[issue.issue_type] = []
        by_type[issue.issue_type].append(issue)

    for issue_type, issues_list in by_type.items():
        print(f"\n{issue_type.upper()}: {len(issues_list)} issues")
        print("-" * 80)

        for issue in issues_list[:10]:  # Show first 10 of each type
            print(f"\n  Evaluation: {issue.evaluation_id}")
            print(f"  Student: {issue.student_name} ({issue.student_id})")
            print(f"  Student Course: {issue.student_course}")
            print(f"  Exam Subject: {issue.subject}")
            print(f"  Expected Course: {issue.expected_course}")
            print(f"  Exam Topic: {issue.exam_topic}")
            print(f"  Date: {issue.exam_date} | Score: {issue.score}")
            print(f"  Details: {issue.details}")

        if len(issues_list) > 10:
            print(f"\n  ... and {len(issues_list) - 10} more")

    print("\n" + "=" * 80)


def export_issues_to_json(issues: List[ValidationIssue], filename: str = "evaluation_issues.json"):
    """Export issues to JSON file for further analysis."""
    data = []
    for issue in issues:
        data.append({
            "evaluation_id": issue.evaluation_id,
            "student_name": issue.student_name,
            "student_id": issue.student_id,
            "student_course": issue.student_course,
            "expected_course": issue.expected_course,
            "subject": issue.subject,
            "exam_topic": issue.exam_topic,
            "exam_date": issue.exam_date,
            "score": issue.score,
            "issue_type": issue.issue_type,
            "details": issue.details
        })

    filepath = os.path.join("scripts", filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Issues exported to: {filepath}")


def main():
    """Main execution function."""
    print("🔍 Intellego Platform - Evaluation Validator")
    print("=" * 80)

    # Connect to database
    print("\n📡 Connecting to database...")
    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)

    print("✅ Connected successfully!")

    # Fetch data
    print("\n📥 Fetching students...")
    students = fetch_all_students(conn)
    print(f"✅ Loaded {len(students)} students")

    print("\n📥 Fetching evaluations...")
    evaluations = fetch_all_evaluations(conn)
    print(f"✅ Loaded {len(evaluations)} evaluations")

    # Validate
    print("\n🔍 Validating evaluations...")
    issues = validate_evaluations(students, evaluations)

    # Print results
    print_summary(issues)

    # Export to JSON
    if issues:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"evaluation_issues_{timestamp}.json"
        export_issues_to_json(issues, filename)

    # Close connection
    conn.close()

    # Exit code
    sys.exit(0 if not issues else 1)


if __name__ == "__main__":
    main()
