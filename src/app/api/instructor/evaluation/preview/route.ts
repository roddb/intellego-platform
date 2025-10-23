import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  logDataAccess,
  logUnauthorizedAccess,
  logRoleViolation,
} from "@/lib/security-logger";
import { extractApellido, matchStudent, type MatchContext } from "@/lib/evaluation";

// Configure to use Node.js runtime
export const runtime = "nodejs";

/**
 * POST /api/instructor/evaluation/preview
 *
 * Preview de matches de estudiantes basado en nombres de archivos y contexto
 *
 * Request:
 * {
 *   "context": {
 *     "materia": "Física",
 *     "division": "5to A",
 *     "anioAcademico": "2025",
 *     "sede": "San Miguel"
 *   },
 *   "fileNames": ["Garcia_Juan.md", "Lopez_Maria.md", ...]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "matches": [
 *     {
 *       "fileName": "Garcia_Juan.md",
 *       "studentId": "u_123",
 *       "studentName": "García, Juan Pablo",
 *       "matchConfidence": 95.2,
 *       "status": "matched"
 *     },
 *     {
 *       "fileName": "Fernandez_Pedro.md",
 *       "studentId": null,
 *       "studentName": null,
 *       "matchConfidence": 0,
 *       "status": "not_found"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess("/api/instructor/evaluation/preview");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check instructor role
    if (session.user.role !== "INSTRUCTOR") {
      logRoleViolation(
        "INSTRUCTOR",
        session.user.role || "unknown",
        "/api/instructor/evaluation/preview",
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
      "evaluation-preview",
      "/api/instructor/evaluation/preview",
      session.user.id,
      session.user.email || "unknown",
      session.user.role || "unknown"
    );

    console.log(`🔍 Evaluation preview requested by: ${session.user.email}`);

    // 4. Parse request body
    let body: {
      context: MatchContext;
      fileNames: string[];
    };

    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // 5. Validate request
    if (!body.context || !body.fileNames) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["context", "fileNames"],
        },
        { status: 400 }
      );
    }

    const { context, fileNames } = body;

    // Validate context
    if (
      !context.materia ||
      !context.division ||
      !context.anioAcademico ||
      !context.sede
    ) {
      return NextResponse.json(
        {
          error: "Incomplete context",
          required: ["materia", "division", "anioAcademico", "sede"],
        },
        { status: 400 }
      );
    }

    // Validate fileNames
    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames must be a non-empty array" },
        { status: 400 }
      );
    }

    console.log(`📂 Processing ${fileNames.length} file(s) for preview`);
    console.log(`📚 Context: ${context.division} - ${context.materia}`);

    // 6. Process each file name
    const matches: Array<{
      fileName: string;
      studentId: string | null;
      studentName: string | null;
      matchConfidence: number;
      status: "matched" | "not_found" | "low_confidence";
    }> = [];

    for (const fileName of fileNames) {
      try {
        // Extract apellido from filename
        const apellido = extractApellido(fileName);

        // Match with context filtering
        const matchResult = await matchStudent(apellido, 70, context); // Lower threshold for preview (70%)

        matches.push({
          fileName,
          studentId: matchResult.student.id,
          studentName: matchResult.student.name,
          matchConfidence: matchResult.matchConfidence,
          status:
            matchResult.matchConfidence >= 90
              ? "matched"
              : "low_confidence",
        });

        console.log(
          `  ✓ ${fileName} → ${matchResult.student.name} (${matchResult.matchConfidence.toFixed(1)}%)`
        );
      } catch (error) {
        // Student not found
        matches.push({
          fileName,
          studentId: null,
          studentName: null,
          matchConfidence: 0,
          status: "not_found",
        });

        console.log(`  ⚠️  ${fileName} → No match found`);
      }
    }

    // 7. Calculate summary
    const summary = {
      total: matches.length,
      matched: matches.filter((m) => m.status === "matched").length,
      lowConfidence: matches.filter((m) => m.status === "low_confidence")
        .length,
      notFound: matches.filter((m) => m.status === "not_found").length,
    };

    console.log(`✅ Preview completed:`, summary);

    // 8. Return results
    return NextResponse.json({
      success: true,
      matches,
      summary,
    });
  } catch (error: unknown) {
    console.error("❌ Error in evaluation preview:", {
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
