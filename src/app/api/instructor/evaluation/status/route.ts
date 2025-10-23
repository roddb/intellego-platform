import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db-operations";
import {
  logDataAccess,
  logUnauthorizedAccess,
  logRoleViolation,
} from "@/lib/security-logger";

// Configure to use Node.js runtime
export const runtime = "nodejs";

/**
 * GET /api/instructor/evaluation/status
 *
 * Obtiene el estado de evaluaciones para una materia/división
 * Muestra qué alumnos tienen evaluaciones cargadas y cuáles están pendientes
 *
 * Query params:
 * - subject: Materia (ej: "Física", "Química")
 * - division: División (ej: "C", "D", "E")
 * - academicYear: Año académico (ej: "4to Año", "5to Año")
 *
 * Response:
 * {
 *   "students": [
 *     {
 *       "id": "user_id",
 *       "name": "García, Juan",
 *       "studentId": "12345",
 *       "evaluations": {
 *         "2025-09-08": {
 *           "examTopic": "Tiro Oblicuo",
 *           "score": 77,
 *           "evaluationId": "eval_...",
 *           "submitted": true
 *         },
 *         "2025-10-15": {
 *           "submitted": false
 *         }
 *       }
 *     }
 *   ],
 *   "examDates": ["2025-09-08", "2025-10-15"],
 *   "examTopics": {
 *     "2025-09-08": "Tiro Oblicuo",
 *     "2025-10-15": "Dinámica"
 *   },
 *   "summary": {
 *     "totalStudents": 25,
 *     "totalExams": 2,
 *     "completionByExam": {
 *       "2025-09-08": { "completed": 20, "pending": 5 },
 *       "2025-10-15": { "completed": 18, "pending": 7 }
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess("/api/instructor/evaluation/status");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check instructor role
    if (session.user.role !== "INSTRUCTOR") {
      logRoleViolation(
        "INSTRUCTOR",
        session.user.role || "unknown",
        "/api/instructor/evaluation/status",
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: "Forbidden. Instructor access required." },
        { status: 403 }
      );
    }

    // 3. Log data access
    logDataAccess(
      "evaluation-status",
      "/api/instructor/evaluation/status",
      session.user.id,
      session.user.email || "unknown",
      session.user.role || "unknown"
    );

    // 4. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const division = searchParams.get("division");
    const academicYear = searchParams.get("academicYear");

    // 5. Validate parameters
    if (!subject || !division || !academicYear) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["subject", "division", "academicYear"],
        },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching evaluation status for:`, {
      subject,
      division,
      academicYear,
      instructor: session.user.email,
    });

    // 6. Extract year prefix from academicYear (e.g., "4to Año" -> "4to")
    // The academicYear comes from the API as just the year (e.g., "4to Año")
    // but division comes as just the letter (e.g., "C")
    // We need to match this structure

    // Get all students for this division/year/subject
    const students = await query(
      `
        SELECT
          id,
          name,
          studentId,
          subjects
        FROM User
        WHERE division = ?
          AND academicYear = ?
          AND role = 'STUDENT'
          AND status = 'ACTIVE'
        ORDER BY name ASC
      `,
      [division, academicYear]
    );

    // Filter students who have this subject
    // Note: subjects is stored as comma-separated string, not JSON
    const filteredStudents = students.rows.filter((student) => {
      const subjects = student.subjects as string;
      if (!subjects) return false;

      // Split comma-separated string and check if subject is included
      const subjectsArray = subjects.split(',').map(s => s.trim());
      return subjectsArray.includes(subject);
    });

    if (filteredStudents.length === 0) {
      return NextResponse.json({
        students: [],
        examDates: [],
        examTopics: {},
        summary: {
          totalStudents: 0,
          totalExams: 0,
          completionByExam: {},
        },
      });
    }

    // 7. Get all evaluations for this subject
    // Note: subject in Evaluation table is stored as "Física 4to C" format
    // Need to extract year prefix from academicYear (e.g., "4to Año" -> "4to")
    const yearPrefix = academicYear.replace(" Año", "").trim();
    const subjectPattern = `${subject} ${yearPrefix} ${division}`;

    // Filter evaluations by current academic year
    // Extract year from academicYear (e.g., "4to Año" -> get current year 2025)
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    const evaluations = await query(
      `
        SELECT
          id,
          studentId,
          subject,
          examDate,
          examTopic,
          score,
          createdAt
        FROM Evaluation
        WHERE subject = ?
          AND examDate >= ?
          AND examDate <= ?
        ORDER BY examDate ASC, studentId ASC
      `,
      [subjectPattern, startOfYear, endOfYear]
    );

    console.log(`📝 Found ${evaluations.rows.length} evaluations for ${subjectPattern}`);

    // 8. Get unique exam topics (group by topic instead of date)
    // If there are multiple evaluations for the same student+topic, keep the most recent one
    const examTopicsSet = new Set<string>();
    const latestEvaluationByStudentTopic = new Map<string, any>();

    evaluations.rows.forEach((evaluation) => {
      const studentId = evaluation.studentId as string;
      const examTopic = evaluation.examTopic as string;
      const key = `${studentId}-${examTopic}`;

      examTopicsSet.add(examTopic);

      // Keep the most recent evaluation for this student+topic
      const existing = latestEvaluationByStudentTopic.get(key);
      if (!existing || (evaluation.createdAt && (!existing.createdAt || evaluation.createdAt > existing.createdAt))) {
        latestEvaluationByStudentTopic.set(key, evaluation);
      }
    });

    const examTopics = Array.from(examTopicsSet).sort();

    // 9. Build student evaluation map by topic
    const evaluationsByStudent = new Map<string, Map<string, any>>();

    // Use only the latest evaluation for each student+topic
    latestEvaluationByStudentTopic.forEach((evaluation) => {
      const studentId = evaluation.studentId as string;
      const examTopic = evaluation.examTopic as string;

      if (!evaluationsByStudent.has(studentId)) {
        evaluationsByStudent.set(studentId, new Map());
      }

      evaluationsByStudent.get(studentId)!.set(examTopic, {
        examDate: evaluation.examDate,
        score: evaluation.score,
        evaluationId: evaluation.id,
        submitted: true,
      });
    });

    // 10. Build response data
    const studentsData = filteredStudents.map((student) => {
      const studentId = student.id as string;
      const evaluationsForStudent = evaluationsByStudent.get(studentId) || new Map();

      // Build evaluations object with all exam topics
      const evaluationsObj: { [key: string]: any } = {};
      examTopics.forEach((examTopic) => {
        if (evaluationsForStudent.has(examTopic)) {
          evaluationsObj[examTopic] = evaluationsForStudent.get(examTopic);
        } else {
          evaluationsObj[examTopic] = {
            submitted: false,
          };
        }
      });

      return {
        id: studentId,
        name: student.name,
        studentId: student.studentId,
        evaluations: evaluationsObj,
      };
    });

    // 11. Calculate completion summary by topic
    const completionByTopic: { [key: string]: { completed: number; pending: number } } = {};

    examTopics.forEach((examTopic) => {
      let completed = 0;
      let pending = 0;

      filteredStudents.forEach((student) => {
        const studentId = student.id as string;
        const hasEvaluation = evaluationsByStudent.get(studentId)?.has(examTopic);

        if (hasEvaluation) {
          completed++;
        } else {
          pending++;
        }
      });

      completionByTopic[examTopic] = { completed, pending };
    });

    // 12. Return response
    const response = {
      students: studentsData,
      examTopics, // Now returning topics instead of dates
      summary: {
        totalStudents: filteredStudents.length,
        totalExams: examTopics.length,
        completionByTopic,
      },
    };

    console.log(`✅ Evaluation status retrieved:`, {
      students: response.students.length,
      topics: response.examTopics.length,
      subject,
      division,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ Error in evaluation status API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
