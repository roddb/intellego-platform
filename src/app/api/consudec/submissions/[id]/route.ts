/**
 * API Route: /api/consudec/submissions/[id]
 * GET: Obtener submission específica con detalles
 * PATCH: Edición manual de evaluación (instructor)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SubmissionResult, ManualEvaluationData } from '@/types/consudec-activity';
import { getCurrentISODate, isValidScore } from '@/lib/consudec-utils';

export const runtime = 'nodejs';

/**
 * GET /api/consudec/submissions/[id]
 * Obtener submission específica con toda la info
 *
 * Auth: STUDENT (own) | INSTRUCTOR
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id: submissionId } = await params;
    const client = db();

    // Obtener submission con datos del estudiante y actividad
    const result = await client.execute({
      sql: `
        SELECT
          s.*,
          u.name as studentName,
          u.email as studentEmail,
          a.id as activityId,
          a.title as activityTitle,
          a.description as activityDescription,
          a.caseText,
          a.questions,
          a.subject,
          a.difficulty,
          a.estimatedTime,
          a.status as activityStatus,
          a.availableFrom,
          a.availableUntil,
          a.createdBy,
          a.createdAt as activityCreatedAt,
          a.updatedAt as activityUpdatedAt
        FROM ConsudecSubmission s
        JOIN User u ON s.studentId = u.id
        JOIN ConsudecActivity a ON s.activityId = a.id
        WHERE s.id = ?
      `,
      args: [submissionId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission no encontrada' },
        { status: 404 }
      );
    }

    const row = result.rows[0] as any;

    // Verificar permisos
    if (session.user.role === 'STUDENT' && row.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - no puedes ver submissions de otros estudiantes' },
        { status: 403 }
      );
    }

    const submission: SubmissionResult = {
      id: row.id,
      activityId: row.activityId,
      studentId: row.studentId,
      answers: JSON.parse(row.answers),
      questionScores: row.questionScores ? JSON.parse(row.questionScores) : undefined,
      overallScore: row.overallScore,
      percentageAchieved: row.percentageAchieved,
      generalFeedback: row.generalFeedback,
      apiCost: row.apiCost,
      apiModel: row.apiModel,
      apiTokensInput: row.apiTokensInput,
      apiTokensOutput: row.apiTokensOutput,
      manualScore: row.manualScore,
      manualFeedback: row.manualFeedback,
      evaluatedBy: row.evaluatedBy,
      evaluatedAt: row.evaluatedAt,
      status: row.status as 'draft' | 'submitted' | 'evaluated',
      submittedAt: row.submittedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // Datos poblados
      activity: {
        id: row.activityId,
        title: row.activityTitle,
        description: row.activityDescription,
        caseText: row.caseText,
        questions: JSON.parse(row.questions),
        subject: row.subject,
        difficulty: row.difficulty,
        estimatedTime: row.estimatedTime,
        status: row.activityStatus,
        availableFrom: row.availableFrom,
        availableUntil: row.availableUntil,
        createdBy: row.createdBy,
        createdAt: row.activityCreatedAt,
        updatedAt: row.activityUpdatedAt,
      },
      studentName: row.studentName,
      studentEmail: row.studentEmail,
    };

    return NextResponse.json({
      success: true,
      submission
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/consudec/submissions/[id]:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al obtener submission', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/consudec/submissions/[id]
 * Edición manual de evaluación
 *
 * Body: ManualEvaluationData
 * Auth: INSTRUCTOR only
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - solo instructores' },
        { status: 403 }
      );
    }

    const { id: submissionId } = await params;
    const body: ManualEvaluationData = await request.json();

    // Validaciones
    if (body.manualScore !== undefined) {
      if (!isValidScore(body.manualScore)) {
        return NextResponse.json(
          { error: 'Score manual debe estar entre 0 y 100' },
          { status: 400 }
        );
      }
    }

    const client = db();
    const now = getCurrentISODate();

    // Verificar que la submission existe
    const existingResult = await client.execute({
      sql: 'SELECT id FROM ConsudecSubmission WHERE id = ?',
      args: [submissionId]
    });

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Submission no encontrada' },
        { status: 404 }
      );
    }

    // Construir UPDATE dinámico
    const updates: string[] = [];
    const args: any[] = [];

    if (body.manualScore !== undefined) {
      updates.push('manualScore = ?');
      args.push(body.manualScore);
    }

    if (body.manualFeedback !== undefined) {
      updates.push('manualFeedback = ?');
      args.push(body.manualFeedback);
    }

    if (body.questionScores !== undefined) {
      updates.push('questionScores = ?');
      args.push(JSON.stringify(body.questionScores));
    }

    // Registrar quién evaluó
    updates.push('evaluatedBy = ?');
    args.push(session.user.id);

    updates.push('evaluatedAt = ?');
    args.push(now);

    updates.push('updatedAt = ?');
    args.push(now);

    if (updates.length === 3) {
      // Solo updatedAt, evaluatedBy y evaluatedAt, nada que actualizar
      return NextResponse.json({
        success: true,
        message: 'No hay cambios para aplicar'
      });
    }

    args.push(submissionId);

    const sql = `UPDATE ConsudecSubmission SET ${updates.join(', ')} WHERE id = ?`;

    await client.execute({
      sql,
      args
    });

    return NextResponse.json({
      success: true,
      message: 'Evaluación actualizada exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error en PATCH /api/consudec/submissions/[id]:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al actualizar evaluación', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido' },
      { status: 500 }
    );
  }
}
