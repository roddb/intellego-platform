/**
 * API Route: /api/consudec/activities/[id]/submission
 * GET: Obtener submission del estudiante para esta actividad
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ConsudecSubmission } from '@/types/consudec-activity';

export const runtime = 'nodejs';

/**
 * GET /api/consudec/activities/[id]/submission
 * Obtener la submission del estudiante actual
 *
 * Auth: STUDENT
 * Returns: submission o null si no existe
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden - solo estudiantes' },
        { status: 403 }
      );
    }

    const activityId = params.id;
    const studentId = session.user.id;

    const client = db();

    const result = await client.execute({
      sql: 'SELECT * FROM ConsudecSubmission WHERE activityId = ? AND studentId = ?',
      args: [activityId, studentId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        submission: null
      });
    }

    const row = result.rows[0] as any;

    const submission: ConsudecSubmission = {
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
    };

    return NextResponse.json({
      success: true,
      submission
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/consudec/activities/[id]/submission:', error);
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
