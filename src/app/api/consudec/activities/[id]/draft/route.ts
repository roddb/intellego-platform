/**
 * API Route: /api/consudec/activities/[id]/draft
 * POST: Guardar borrador de actividad (sin evaluación IA)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { SubmitActivityData } from '@/types/consudec-activity';
import { generateSubmissionId, getCurrentISODate } from '@/lib/consudec-utils';

export const runtime = 'nodejs';

/**
 * POST /api/consudec/activities/[id]/draft
 * Guardar borrador sin evaluar
 *
 * Body: { answers: Record<string, string> }
 * Auth: STUDENT (CONSUDEC only)
 */
export async function POST(
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

    if (session.user.sede !== 'CONSUDEC') {
      return NextResponse.json(
        { error: 'Forbidden - solo estudiantes CONSUDEC' },
        { status: 403 }
      );
    }

    const activityId = params.id;
    const body: SubmitActivityData = await request.json();

    if (!body.answers || typeof body.answers !== 'object') {
      return NextResponse.json(
        { error: 'Formato de respuestas inválido' },
        { status: 400 }
      );
    }

    const client = db();
    const now = getCurrentISODate();

    // Verificar si ya existe un borrador o submission
    const existingResult = await client.execute({
      sql: 'SELECT id, status FROM ConsudecSubmission WHERE activityId = ? AND studentId = ?',
      args: [activityId, session.user.id]
    });

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0] as any;

      // No permitir modificar si ya fue entregado/evaluado
      if (existing.status === 'submitted' || existing.status === 'evaluated') {
        return NextResponse.json(
          { error: 'No puedes modificar una actividad ya entregada' },
          { status: 409 }
        );
      }

      // Actualizar borrador existente
      await client.execute({
        sql: `
          UPDATE ConsudecSubmission SET
            answers = ?,
            updatedAt = ?
          WHERE id = ?
        `,
        args: [
          JSON.stringify(body.answers),
          now,
          existing.id
        ]
      });

      return NextResponse.json({
        success: true,
        submissionId: existing.id,
        message: 'Borrador actualizado'
      });

    } else {
      // Crear nuevo borrador
      const submissionId = generateSubmissionId();

      await client.execute({
        sql: `
          INSERT INTO ConsudecSubmission (
            id, activityId, studentId,
            answers, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          submissionId,
          activityId,
          session.user.id,
          JSON.stringify(body.answers),
          'draft',
          now,
          now
        ]
      });

      return NextResponse.json({
        success: true,
        submissionId,
        message: 'Borrador guardado'
      }, { status: 201 });
    }

  } catch (error: unknown) {
    console.error('Error en POST /api/consudec/activities/[id]/draft:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al guardar borrador', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido' },
      { status: 500 }
    );
  }
}
