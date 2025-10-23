import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBatchProgress, type BatchProgress } from "@/lib/evaluation";
import {
  logDataAccess,
  logUnauthorizedAccess,
  logRoleViolation,
} from "@/lib/security-logger";

export const runtime = "nodejs";

/**
 * GET /api/instructor/evaluation/progress?batchId=xxx
 *
 * Obtiene el progreso de un batch de corrección de exámenes
 * Endpoint para polling durante el proceso de corrección
 *
 * Query params:
 * - batchId: ID del batch (ej: "batch_1729518234567")
 *
 * Response:
 * {
 *   "batchId": "batch_1729518234567",
 *   "totalFiles": 5,
 *   "processedFiles": 2,
 *   "currentFile": "Garcia_Juan.md",
 *   "currentPhase": "Analizando con IA",
 *   "status": "processing" | "completed" | "failed",
 *   "results": [...],
 *   "startTime": 1729518234567,
 *   "endTime": null,
 *   "progress": 40  // percentage
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess("/api/instructor/evaluation/progress");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check instructor role
    if (session.user.role !== "INSTRUCTOR") {
      logRoleViolation(
        "INSTRUCTOR",
        session.user.role || "unknown",
        "/api/instructor/evaluation/progress",
        session.user.id,
        session.user.email || undefined
      );
      return NextResponse.json(
        { error: "Forbidden. Instructor access required." },
        { status: 403 }
      );
    }

    // 3. Get batchId from query params
    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return NextResponse.json(
        { error: "Missing required parameter: batchId" },
        { status: 400 }
      );
    }

    // 4. Log data access
    logDataAccess(
      "evaluation-progress",
      `/api/instructor/evaluation/progress?batchId=${batchId}`,
      session.user.id,
      session.user.email || "unknown",
      session.user.role || "unknown"
    );

    // 5. Get progress from tracker
    const progress = getBatchProgress(batchId);

    if (!progress) {
      return NextResponse.json(
        {
          error: "Batch not found",
          message: `No progress found for batch: ${batchId}. The batch may have expired (1 hour limit).`,
        },
        { status: 404 }
      );
    }

    // 6. Calculate percentage
    const percentage = Math.round(
      (progress.processedFiles / progress.totalFiles) * 100
    );

    // 7. Return progress data
    return NextResponse.json({
      ...progress,
      progress: percentage,
    });
  } catch (error: unknown) {
    console.error("❌ Error in progress API:", {
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
