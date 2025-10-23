import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  logDataAccess,
  logUnauthorizedAccess,
  logRoleViolation,
} from "@/lib/security-logger";
import {
  processExamBatch,
  getInstructorName,
  type ExamMetadata,
} from "@/lib/evaluation";

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes (Vercel free tier limit)

/**
 * POST /api/instructor/evaluation/correct
 *
 * Corrige exámenes usando el sistema de evaluación automática
 * Flujo: Parser → Matcher → Analyzer → Calculator → Generator → Uploader
 *
 * Request: multipart/form-data
 * - files: .md files (exámenes transcritos)
 * - metadata: JSON { subject, examTopic, examDate }
 *
 * Response:
 * {
 *   "success": true,
 *   "batchId": "batch_1729518234567",
 *   "results": [
 *     {
 *       "fileName": "Garcia_Juan.md",
 *       "studentName": "García, Juan",
 *       "evaluationId": "eval_a1b2c3d4e5f6g7h8",
 *       "score": 77,
 *       "status": "success",
 *       "duration": 4523
 *     }
 *   ],
 *   "summary": {
 *     "total": 1,
 *     "successful": 1,
 *     "failed": 0,
 *     "avgScore": 77,
 *     "totalDuration": 4523
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      logUnauthorizedAccess("/api/instructor/evaluation/correct");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check instructor role
    if (session.user.role !== "INSTRUCTOR") {
      logRoleViolation(
        "INSTRUCTOR",
        session.user.role || "unknown",
        "/api/instructor/evaluation/correct",
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
      "evaluation-correct",
      "/api/instructor/evaluation/correct",
      session.user.id,
      session.user.email || "unknown",
      session.user.role || "unknown"
    );

    console.log(`📝 Exam correction requested by: ${session.user.email}`);

    // 4. Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request. Expected multipart/form-data" },
        { status: 400 }
      );
    }

    // 5. Extract metadata
    const metadataStr = formData.get("metadata");
    if (!metadataStr || typeof metadataStr !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid metadata field" },
        { status: 400 }
      );
    }

    let metadata: ExamMetadata;
    try {
      const parsed = JSON.parse(metadataStr);
      metadata = {
        subject: parsed.subject,
        examTopic: parsed.examTopic,
        examDate: parsed.examDate,
        instructorId: session.user.id,
      };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid metadata JSON format" },
        { status: 400 }
      );
    }

    // 6. Validate metadata
    if (!metadata.subject || !metadata.examTopic || !metadata.examDate) {
      return NextResponse.json(
        {
          error: "Missing required metadata fields",
          required: ["subject", "examTopic", "examDate"],
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(metadata.examDate)) {
      return NextResponse.json(
        {
          error: "Invalid examDate format",
          expected: "YYYY-MM-DD",
          received: metadata.examDate,
        },
        { status: 400 }
      );
    }

    // 7. Extract files
    const files: Array<{ name: string; buffer: Buffer; size: number }> = [];
    const fileEntries = Array.from(formData.entries()).filter(
      ([key]) => key === "files"
    );

    if (fileEntries.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Upload at least one .md file" },
        { status: 400 }
      );
    }

    for (const [, value] of fileEntries) {
      if (!(value instanceof File)) {
        continue;
      }

      const file = value as File;

      // Validate file extension
      if (!file.name.endsWith(".md")) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.name}`,
            expected: ".md files only",
          },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            error: `File too large: ${file.name}`,
            maxSize: "5MB",
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      files.push({
        name: file.name,
        buffer,
        size: file.size,
      });
    }

    console.log(`📂 Processing ${files.length} exam file(s)`);
    console.log(`📚 Subject: ${metadata.subject} - ${metadata.examTopic}`);
    console.log(`📅 Exam Date: ${metadata.examDate}`);

    // 8. Get instructor name
    const instructorName = await getInstructorName(session.user.id);

    // 9. Process exam batch
    const result = await processExamBatch(files, metadata, instructorName);

    const totalTime = Date.now() - startTime;

    console.log("✅ Exam correction completed", {
      batchId: result.batchId,
      total: result.summary.total,
      successful: result.summary.successful,
      failed: result.summary.failed,
      avgScore: result.summary.avgScore,
      totalTime: `${totalTime}ms`,
      instructor: session.user.email,
    });

    // 10. Return results
    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      results: result.results,
      summary: {
        ...result.summary,
        totalDuration: totalTime,
      },
    });
  } catch (error: unknown) {
    const totalTime = Date.now() - startTime;

    console.error("❌ Error in exam correction API:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      totalTime: `${totalTime}ms`,
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

/**
 * GET /api/instructor/evaluation/correct
 *
 * Obtiene información sobre el endpoint de corrección
 *
 * Response:
 * {
 *   "endpoint": "/api/instructor/evaluation/correct",
 *   "method": "POST",
 *   "description": "Automatic exam correction using AI",
 *   "contentType": "multipart/form-data",
 *   "fields": { ... },
 *   "costEstimate": { ... }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Return API documentation
    return NextResponse.json({
      endpoint: "/api/instructor/evaluation/correct",
      method: "POST",
      description:
        "Automatic exam correction using AI (Claude Haiku 4.5) with 5-FASE rubric",
      contentType: "multipart/form-data",
      fields: {
        files: {
          type: "file[]",
          required: true,
          description: "One or more .md files (transcribed exams)",
          constraints: {
            extension: ".md",
            maxSize: "5MB",
            naming: "Apellido_Nombre.md or similar (apellido will be extracted)",
          },
        },
        metadata: {
          type: "JSON string",
          required: true,
          description: "Exam metadata",
          schema: {
            subject: {
              type: "string",
              required: true,
              example: "Física",
            },
            examTopic: {
              type: "string",
              required: true,
              example: "Tiro Oblicuo",
            },
            examDate: {
              type: "string",
              format: "YYYY-MM-DD",
              required: true,
              example: "2025-10-15",
            },
          },
        },
      },
      flow: [
        "1. Parser: Extract apellido from filename, parse exercises",
        "2. Matcher: Fuzzy match apellido to active student (90% threshold)",
        "3. Analyzer: AI evaluation with 5-FASE rubric (Claude Haiku 4.5)",
        "4. Calculator: Weighted score calculation (F1:15%, F2:20%, F3:25%, F4:30%, F5:10%)",
        "5. Generator: Markdown feedback generation (2000-3000 words)",
        "6. Uploader: Save to Evaluation table",
      ],
      costEstimate: {
        perExam: "$0.0035 (with cache hit) to $0.0050 (cache miss)",
        model: "claude-haiku-4-5",
        features: ["Prompt caching", "5-FASE rubric", "Exercise analysis"],
      },
      exampleRequest: {
        files: ["Garcia_Juan.md", "Lopez_Maria.md"],
        metadata: JSON.stringify({
          subject: "Física",
          examTopic: "Tiro Oblicuo",
          examDate: "2025-10-15",
        }),
      },
    });
  } catch (error: unknown) {
    console.error("Error getting evaluation API info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
