/**
 * API Route: /api/consudec/activities/[id]
 * GET: Obtener actividad específica
 * PATCH: Actualizar actividad
 * DELETE: Archivar actividad (soft delete)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ConsudecActivity, ActivityUpdateData } from '@/types/consudec-activity';
import { getCurrentISODate } from '@/lib/consudec-utils';

export const runtime = 'nodejs';

/**
 * GET /api/consudec/activities/[id]
 * Obtener actividad por ID
 *
 * Auth: Cualquier usuario autenticado
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

    const activityId = params.id;
    const client = db();

    const result = await client.execute({
      sql: 'SELECT * FROM ConsudecActivity WHERE id = ?',
      args: [activityId]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const row = result.rows[0] as any;

    const activity: ConsudecActivity = {
      id: row.id,
      title: row.title,
      description: row.description,
      caseText: row.caseText,
      questions: JSON.parse(row.questions),
      subject: row.subject,
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      estimatedTime: row.estimatedTime,
      status: row.status as 'active' | 'archived',
      availableFrom: row.availableFrom,
      availableUntil: row.availableUntil,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return NextResponse.json({
      success: true,
      activity
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/consudec/activities/[id]:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al obtener actividad', details: error.message },
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
 * PATCH /api/consudec/activities/[id]
 * Actualizar actividad existente
 *
 * Body: ActivityUpdateData (campos opcionales)
 * Auth: INSTRUCTOR (solo creador)
 */
export async function PATCH(
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

    // Verificar que la actividad existe y pertenece al instructor
    const existingResult = await client.execute({
      sql: 'SELECT createdBy FROM ConsudecActivity WHERE id = ?',
      args: [activityId]
    });

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const createdBy = (existingResult.rows[0] as any).createdBy;
    if (createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - solo el creador puede editar esta actividad' },
        { status: 403 }
      );
    }

    const body: ActivityUpdateData = await request.json();
    const now = getCurrentISODate();

    // Construir UPDATE dinámico
    const updates: string[] = [];
    const args: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      args.push(body.title.trim());
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      args.push(body.description.trim());
    }
    if (body.caseText !== undefined) {
      updates.push('caseText = ?');
      args.push(body.caseText.trim());
    }
    if (body.questions !== undefined) {
      updates.push('questions = ?');
      args.push(JSON.stringify(body.questions));
    }
    if (body.subject !== undefined) {
      updates.push('subject = ?');
      args.push(body.subject || null);
    }
    if (body.difficulty !== undefined) {
      updates.push('difficulty = ?');
      args.push(body.difficulty);
    }
    if (body.estimatedTime !== undefined) {
      updates.push('estimatedTime = ?');
      args.push(body.estimatedTime || null);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      args.push(body.status);
    }
    if (body.availableFrom !== undefined) {
      updates.push('availableFrom = ?');
      args.push(body.availableFrom || null);
    }
    if (body.availableUntil !== undefined) {
      updates.push('availableUntil = ?');
      args.push(body.availableUntil || null);
    }

    // Siempre actualizar updatedAt
    updates.push('updatedAt = ?');
    args.push(now);

    if (updates.length === 1) {
      // Solo updatedAt, nada que actualizar
      return NextResponse.json({
        success: true,
        message: 'No hay cambios para aplicar'
      });
    }

    args.push(activityId);

    const sql = `UPDATE ConsudecActivity SET ${updates.join(', ')} WHERE id = ?`;

    await client.execute({
      sql,
      args
    });

    return NextResponse.json({
      success: true,
      message: 'Actividad actualizada exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error en PATCH /api/consudec/activities/[id]:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al actualizar actividad', details: error.message },
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
 * DELETE /api/consudec/activities/[id]
 * Archivar actividad (soft delete)
 *
 * Auth: INSTRUCTOR (solo creador)
 */
export async function DELETE(
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

    // Verificar ownership
    const existingResult = await client.execute({
      sql: 'SELECT createdBy FROM ConsudecActivity WHERE id = ?',
      args: [activityId]
    });

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    const createdBy = (existingResult.rows[0] as any).createdBy;
    if (createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - solo el creador puede archivar esta actividad' },
        { status: 403 }
      );
    }

    const now = getCurrentISODate();

    // Soft delete: cambiar status a 'archived'
    await client.execute({
      sql: 'UPDATE ConsudecActivity SET status = ?, updatedAt = ? WHERE id = ?',
      args: ['archived', now, activityId]
    });

    return NextResponse.json({
      success: true,
      message: 'Actividad archivada exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error en DELETE /api/consudec/activities/[id]:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al archivar actividad', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido' },
      { status: 500 }
    );
  }
}
