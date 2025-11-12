/**
 * API Route: /api/consudec/activities/[id]/submissions
 * GET: Obtener todas las submissions de una actividad (instructor)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SubmissionResult } from '@/types/consudec-activity';

export const runtime = 'nodejs';

/**
 * GET /api/consudec/activities/[id]/submissions
 * Listar todas las entregas de una actividad
 *
 * Auth: INSTRUCTOR only
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

    if (session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Forbidden - solo instructores' },
        { status: 403 }
      );
    }

    const activityId = params.id;
    const client = db();

    // Verificar que la actividad existe
    const activityCheck = await client.execute({
      sql: 'SELECT id, title, caseText, questions FROM ConsudecActivity WHERE id = ?',
      args: [activityId]
    });

    if (activityCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const activityRow = activityCheck.rows[0] as any;

    // Obtener todas las submissions con info del estudiante
    const submissionsResult = await client.execute({
      sql: `
        SELECT
          s.*,
          u.name as studentName,
          u.email as studentEmail
        FROM ConsudecSubmission s
        JOIN User u ON s.studentId = u.id
        WHERE s.activityId = ?
        ORDER BY s.submittedAt DESC, s.createdAt DESC
      `,
      args: [activityId]
    });

    const submissions: SubmissionResult[] = submissionsResult.rows.map((row: any) => ({
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
        id: activityRow.id,
        title: activityRow.title,
        description: activityRow.description || '',
        caseText: activityRow.caseText,
        questions: JSON.parse(activityRow.questions),
        subject: activityRow.subject,
        difficulty: activityRow.difficulty,
        estimatedTime: activityRow.estimatedTime,
        status: activityRow.status,
        availableFrom: activityRow.availableFrom,
        availableUntil: activityRow.availableUntil,
        createdBy: activityRow.createdBy,
        createdAt: activityRow.createdAt,
        updatedAt: activityRow.updatedAt,
      },
      studentName: row.studentName,
      studentEmail: row.studentEmail,
    }));

    // Calcular estadísticas
    const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');
    const avgScore = evaluatedSubmissions.length > 0
      ? evaluatedSubmissions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / evaluatedSubmissions.length
      : 0;

    return NextResponse.json({
      success: true,
      submissions,
      stats: {
        total: submissions.length,
        drafts: submissions.filter(s => s.status === 'draft').length,
        submitted: submissions.filter(s => s.status === 'submitted').length,
        evaluated: evaluatedSubmissions.length,
        averageScore: Math.round(avgScore),
      }
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/consudec/activities/[id]/submissions:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al obtener submissions', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido' },
      { status: 500 }
    );
  }
}
