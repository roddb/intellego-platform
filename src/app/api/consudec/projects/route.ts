/**
 * API endpoint for CONSUDEC project submissions
 * Maps standalone "practical work" submissions to ConsudecActivity system
 *
 * POST /api/consudec/projects
 * Body: {
 *   projectId: string,
 *   subject: string,
 *   descripcionProyecto: string,
 *   estrategiasDidacticas: string,
 *   dificultadesAbordaje: string,
 *   aprendizajesClave: string,
 *   aplicacionPractica: string
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * Standard question IDs for project activities
 * These IDs are consistent across all project-type activities
 */
const PROJECT_QUESTION_IDS = {
  descripcionProyecto: 'q_descripcion',
  estrategiasDidacticas: 'q_estrategias',
  dificultadesAbordaje: 'q_dificultades',
  aprendizajesClave: 'q_aprendizajes',
  aplicacionPractica: 'q_aplicacion',
} as const;

/**
 * POST - Submit a project (practical work)
 *
 * This endpoint handles submissions for project-type activities.
 * It maps the 5 reflective fields to a ConsudecSubmission.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.user.role !== 'CONSUDEC') {
      return NextResponse.json(
        { error: 'Forbidden - CONSUDEC student access only' },
        { status: 403 }
      );
    }

    const studentId = session.user.id;

    // 2. Parse request body
    const body = await request.json();
    const {
      projectId,
      subject,
      descripcionProyecto,
      estrategiasDidacticas,
      dificultadesAbordaje,
      aprendizajesClave,
      aplicacionPractica,
    } = body;

    // 3. Validate required fields
    if (!projectId || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and subject' },
        { status: 400 }
      );
    }

    if (
      !descripcionProyecto?.trim() ||
      !estrategiasDidacticas?.trim() ||
      !dificultadesAbordaje?.trim() ||
      !aprendizajesClave?.trim() ||
      !aplicacionPractica?.trim()
    ) {
      return NextResponse.json(
        { error: 'All 5 reflective questions must have answers' },
        { status: 400 }
      );
    }

    // 4. Verify project activity exists
    const activityResult = await db().execute({
      sql: `SELECT id, title, activityType, status
            FROM ConsudecActivity
            WHERE id = ?`,
      args: [projectId],
    });

    if (activityResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project activity not found' },
        { status: 404 }
      );
    }

    const activity = activityResult.rows[0] as unknown as {
      id: string;
      title: string;
      activityType: string;
      status: string;
    };

    // 5. Verify it's a project-type activity
    if (activity.activityType !== 'project') {
      return NextResponse.json(
        {
          error: `This endpoint is for project submissions only. Use /api/consudec/activities/${projectId}/submit for activity submissions.`,
        },
        { status: 400 }
      );
    }

    // 6. Verify activity is active
    if (activity.status !== 'active') {
      return NextResponse.json(
        { error: 'This project is not currently available for submission' },
        { status: 403 }
      );
    }

    // 7. Check if student already submitted this project
    const existingSubmissionResult = await db().execute({
      sql: `SELECT id, status
            FROM ConsudecSubmission
            WHERE activityId = ? AND studentId = ? AND status != 'draft'`,
      args: [projectId, studentId],
    });

    if (existingSubmissionResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted this project' },
        { status: 409 }
      );
    }

    // 8. Map fields to activity question IDs
    const answers: Record<string, string> = {
      [PROJECT_QUESTION_IDS.descripcionProyecto]: descripcionProyecto,
      [PROJECT_QUESTION_IDS.estrategiasDidacticas]: estrategiasDidacticas,
      [PROJECT_QUESTION_IDS.dificultadesAbordaje]: dificultadesAbordaje,
      [PROJECT_QUESTION_IDS.aprendizajesClave]: aprendizajesClave,
      [PROJECT_QUESTION_IDS.aplicacionPractica]: aplicacionPractica,
    };

    // 9. Create submission ID
    const submissionId = `csub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date().toISOString();

    // 10. Check for existing draft
    const draftResult = await db().execute({
      sql: `SELECT id FROM ConsudecSubmission
            WHERE activityId = ? AND studentId = ? AND status = 'draft'`,
      args: [projectId, studentId],
    });

    if (draftResult.rows.length > 0) {
      // Update existing draft to submitted
      const draftId = (draftResult.rows[0] as unknown as { id: string }).id;

      await db().execute({
        sql: `UPDATE ConsudecSubmission
              SET answers = ?,
                  status = 'submitted',
                  submittedAt = ?,
                  updatedAt = ?
              WHERE id = ?`,
        args: [JSON.stringify(answers), now, now, draftId],
      });

      return NextResponse.json({
        success: true,
        message: 'Project submitted successfully',
        submissionId: draftId,
        activityId: projectId,
        status: 'submitted',
      });
    }

    // 11. Create new submission (status: 'submitted', will be evaluated by instructor)
    await db().execute({
      sql: `INSERT INTO ConsudecSubmission (
              id, activityId, studentId, answers, status, submittedAt, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?)`,
      args: [
        submissionId,
        projectId,
        studentId,
        JSON.stringify(answers),
        now,
        now,
        now,
      ],
    });

    // 12. Return success
    return NextResponse.json({
      success: true,
      message: 'Project submitted successfully',
      submissionId,
      activityId: projectId,
      status: 'submitted',
    });
  } catch (error: unknown) {
    console.error('[API] Error submitting project:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to submit project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
