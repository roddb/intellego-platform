/**
 * API Route: /api/consudec/activities
 * GET: Listar actividades
 * POST: Crear nueva actividad
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ConsudecActivity, ActivityCreateData } from '@/types/consudec-activity';
import { generateActivityId, getCurrentISODate } from '@/lib/consudec-utils';

export const runtime = 'nodejs'; // Required for auth()

/**
 * GET /api/consudec/activities
 * Listar actividades CONSUDEC
 *
 * Query params:
 * - status: 'active' | 'archived' (opcional)
 * - subject: string (opcional)
 * - activityType: 'pedagogical' | 'clinical' | 'project' (opcional)
 *
 * Auth: STUDENT (solo active), INSTRUCTOR (todas)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const subjectFilter = searchParams.get('subject');
    const activityTypeFilter = searchParams.get('activityType');

    const client = db();

    // Construir query según filtros
    let sql = 'SELECT * FROM ConsudecActivity WHERE 1=1';
    const params: any[] = [];

    // Estudiantes solo ven actividades activas
    if (session.user.role === 'STUDENT') {
      sql += ' AND status = ?';
      params.push('active');
    } else if (statusFilter) {
      // Instructor puede filtrar por status
      sql += ' AND status = ?';
      params.push(statusFilter);
    }

    if (subjectFilter) {
      sql += ' AND subject = ?';
      params.push(subjectFilter);
    }

    if (activityTypeFilter) {
      sql += ' AND activityType = ?';
      params.push(activityTypeFilter);
    }

    sql += ' ORDER BY createdAt DESC';

    const result = await client.execute({
      sql,
      args: params
    });

    // Parsear activities (questions es JSON)
    const activities: ConsudecActivity[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      caseText: row.caseText,
      questions: JSON.parse(row.questions),
      subject: row.subject,
      difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
      estimatedTime: row.estimatedTime,
      activityType: row.activityType as 'pedagogical' | 'clinical' | 'project',
      status: row.status as 'active' | 'archived',
      availableFrom: row.availableFrom,
      availableUntil: row.availableUntil,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length
    });

  } catch (error: unknown) {
    console.error('Error en GET /api/consudec/activities:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al obtener actividades', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido al obtener actividades' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consudec/activities
 * Crear nueva actividad
 *
 * Body: ActivityCreateData
 * Auth: INSTRUCTOR only
 */
export async function POST(request: Request) {
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
        { error: 'Forbidden - solo instructores pueden crear actividades' },
        { status: 403 }
      );
    }

    const body: ActivityCreateData = await request.json();

    // Validaciones
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      );
    }

    if (!body.caseText || body.caseText.trim().length === 0) {
      return NextResponse.json(
        { error: 'El texto del caso es requerido' },
        { status: 400 }
      );
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'Debe haber al menos una pregunta' },
        { status: 400 }
      );
    }

    // Validar que todas las preguntas tengan los campos requeridos
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      if (!q.id || !q.text || !q.rubric) {
        return NextResponse.json(
          { error: `Pregunta ${i + 1} tiene campos faltantes` },
          { status: 400 }
        );
      }
    }

    const client = db();
    const now = getCurrentISODate();
    const activityId = generateActivityId();

    // Insertar actividad
    await client.execute({
      sql: `
        INSERT INTO ConsudecActivity (
          id, title, description, caseText, questions,
          subject, difficulty, estimatedTime,
          status, availableFrom, availableUntil,
          createdBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        activityId,
        body.title.trim(),
        body.description.trim(),
        body.caseText.trim(),
        JSON.stringify(body.questions),
        body.subject || null,
        body.difficulty || 'medium',
        body.estimatedTime || null,
        'active',
        body.availableFrom || null,
        body.availableUntil || null,
        session.user.id,
        now,
        now
      ]
    });

    return NextResponse.json({
      success: true,
      activityId,
      message: 'Actividad creada exitosamente'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error en POST /api/consudec/activities:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al crear actividad', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Error desconocido al crear actividad' },
      { status: 500 }
    );
  }
}
