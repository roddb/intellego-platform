/**
 * API Route: /api/consudec/activities/[id]/submit
 * POST: Entregar actividad y evaluar con IA
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SubmitActivityData, ConsudecActivity } from '@/types/consudec-activity';
import {
  generateSubmissionId,
  getCurrentISODate,
  validateAnswers,
  validateAllWordLimits,
} from '@/lib/consudec-utils';
import {
  evaluateAllQuestions,
  generateGeneralFeedback,
} from '@/services/consudec-evaluation';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 segundos para evaluación IA

/**
 * POST /api/consudec/activities/[id]/submit
 * Entregar actividad completa y evaluar con IA
 *
 * Body: { answers: Record<string, string> }
 * Auth: STUDENT (CONSUDEC only)
 */
export async function POST(
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

    // Solo estudiantes de CONSUDEC pueden entregar
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden - solo estudiantes' },
        { status: 403 }
      );
    }

    if (session.user.sede !== 'CONSUDEC') {
      return NextResponse.json(
        { error: 'Forbidden - solo estudiantes CONSUDEC' },
        { status: 403 }
      );
    }

    const { id: activityId } = await params;
    const body: SubmitActivityData = await request.json();

    if (!body.answers || typeof body.answers !== 'object') {
      return NextResponse.json(
        { error: 'Formato de respuestas inválido' },
        { status: 400 }
      );
    }

    const client = db();

    // ========================================
    // 1. Obtener actividad
    // ========================================
    const activityResult = await client.execute({
      sql: 'SELECT * FROM ConsudecActivity WHERE id = ? AND status = ?',
      args: [activityId, 'active']
    });

    if (activityResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Actividad no encontrada o no está activa' },
        { status: 404 }
      );
    }

    const activityRow = activityResult.rows[0] as any;
    const activity: ConsudecActivity = {
      id: activityRow.id,
      title: activityRow.title,
      description: activityRow.description,
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
    };

    // ========================================
    // 2. Validar respuestas
    // ========================================
    const questionIds = activity.questions.map((q) => q.id);
    const answersValidation = validateAnswers(body.answers, questionIds);

    if (!answersValidation.valid) {
      return NextResponse.json(
        {
          error: 'Respuestas incompletas',
          missingQuestions: answersValidation.missingQuestions
        },
        { status: 400 }
      );
    }

    // Validar límites de palabras
    const wordLimitsValidation = validateAllWordLimits(
      body.answers,
      activity.questions.map((q) => ({ id: q.id, wordLimit: q.wordLimit }))
    );

    if (!wordLimitsValidation.valid) {
      return NextResponse.json(
        {
          error: 'Algunas respuestas exceden el límite de palabras',
          violations: wordLimitsValidation.violations
        },
        { status: 400 }
      );
    }

    // ========================================
    // 3. Verificar que no haya entrega previa
    // ========================================
    const existingSubmission = await client.execute({
      sql: 'SELECT id, status FROM ConsudecSubmission WHERE activityId = ? AND studentId = ?',
      args: [activityId, session.user.id]
    });

    if (existingSubmission.rows.length > 0) {
      const existing = existingSubmission.rows[0] as any;
      if (existing.status === 'submitted' || existing.status === 'evaluated') {
        return NextResponse.json(
          { error: 'Ya has entregado esta actividad previamente' },
          { status: 409 }
        );
      }
      // Si hay borrador, lo actualizaremos
    }

    // ========================================
    // 4. Evaluar con IA (en paralelo)
    // ========================================
    console.log(`🤖 Evaluando actividad ${activityId} para estudiante ${session.user.id}...`);

    const evaluationResult = await evaluateAllQuestions(activity, body.answers);

    console.log(`✅ Evaluación completada. Score: ${evaluationResult.overallScore}/100`);

    // ========================================
    // 5. Generar feedback general
    // ========================================
    const generalFeedback = await generateGeneralFeedback(
      activity.title,
      evaluationResult.questionScores,
      activity.questions,
      activity.activityType || 'pedagogical'
    );

    // ========================================
    // 6. Guardar o actualizar submission
    // ========================================
    const now = getCurrentISODate();
    const submissionId = existingSubmission.rows.length > 0
      ? (existingSubmission.rows[0] as any).id
      : generateSubmissionId();

    if (existingSubmission.rows.length > 0) {
      // Actualizar borrador existente
      await client.execute({
        sql: `
          UPDATE ConsudecSubmission SET
            answers = ?,
            questionScores = ?,
            overallScore = ?,
            percentageAchieved = ?,
            generalFeedback = ?,
            apiCost = ?,
            apiModel = ?,
            apiTokensInput = ?,
            apiTokensOutput = ?,
            status = ?,
            submittedAt = ?,
            updatedAt = ?
          WHERE id = ?
        `,
        args: [
          JSON.stringify(body.answers),
          JSON.stringify(evaluationResult.questionScores),
          evaluationResult.overallScore,
          evaluationResult.percentageAchieved,
          generalFeedback,
          evaluationResult.costInfo.cost,
          evaluationResult.costInfo.model,
          evaluationResult.costInfo.tokensInput,
          evaluationResult.costInfo.tokensOutput,
          'evaluated', // Cambia a evaluated directamente
          now,
          now,
          submissionId
        ]
      });
    } else {
      // Crear nueva submission
      await client.execute({
        sql: `
          INSERT INTO ConsudecSubmission (
            id, activityId, studentId,
            answers, questionScores, overallScore, percentageAchieved,
            generalFeedback, apiCost, apiModel, apiTokensInput, apiTokensOutput,
            status, submittedAt, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          submissionId,
          activityId,
          session.user.id,
          JSON.stringify(body.answers),
          JSON.stringify(evaluationResult.questionScores),
          evaluationResult.overallScore,
          evaluationResult.percentageAchieved,
          generalFeedback,
          evaluationResult.costInfo.cost,
          evaluationResult.costInfo.model,
          evaluationResult.costInfo.tokensInput,
          evaluationResult.costInfo.tokensOutput,
          'evaluated',
          now,
          now,
          now
        ]
      });
    }

    console.log(`✅ Submission guardada: ${submissionId}`);

    return NextResponse.json({
      success: true,
      submissionId,
      overallScore: evaluationResult.overallScore,
      percentageAchieved: evaluationResult.percentageAchieved,
      message: 'Trabajo entregado y evaluado exitosamente'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error en POST /api/consudec/activities/[id]/submit:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al procesar entrega', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido al procesar entrega' },
      { status: 500 }
    );
  }
}
