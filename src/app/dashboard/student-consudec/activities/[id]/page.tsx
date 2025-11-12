/**
 * Página de actividad individual CONSUDEC (Estudiante)
 * Muestra formulario de entrega o resultados según el estado
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ConsudecActivity, ConsudecSubmission } from '@/types/consudec-activity';
import ActivitySubmissionForm from '@/components/consudec/ActivitySubmissionForm';
import SubmissionResultViewer from '@/components/consudec/SubmissionResultViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConsudecActivityPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'STUDENT') {
    redirect('/dashboard');
  }

  const { id: activityId } = await params;
  const studentId = session.user.id;

  // Fetch activity
  const client = db();
  const activityResult = await client.execute({
    sql: 'SELECT * FROM ConsudecActivity WHERE id = ? AND status = ?',
    args: [activityId, 'active'],
  });

  if (activityResult.rows.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Actividad no encontrada</h1>
            <p className="text-slate-600 mb-6">
              Esta actividad no existe o no está disponible.
            </p>
            <Link
              href="/dashboard/student-consudec"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
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

  // Verificar disponibilidad
  const now = new Date().toISOString();
  if (activity.availableFrom && now < activity.availableFrom) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Actividad no disponible aún</h1>
            <p className="text-slate-600 mb-6">
              Esta actividad estará disponible a partir del{' '}
              {new Date(activity.availableFrom).toLocaleDateString('es-AR')}.
            </p>
            <Link
              href="/dashboard/student-consudec"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (activity.availableUntil && now > activity.availableUntil) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Actividad cerrada</h1>
            <p className="text-slate-600 mb-6">
              El plazo para entregar esta actividad finalizó el{' '}
              {new Date(activity.availableUntil).toLocaleDateString('es-AR')}.
            </p>
            <Link
              href="/dashboard/student-consudec"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch submission
  const submissionResult = await client.execute({
    sql: 'SELECT * FROM ConsudecSubmission WHERE activityId = ? AND studentId = ?',
    args: [activityId, studentId],
  });

  let existingSubmission: ConsudecSubmission | null = null;

  if (submissionResult.rows.length > 0) {
    const subRow = submissionResult.rows[0] as any;
    existingSubmission = {
      id: subRow.id,
      activityId: subRow.activityId,
      studentId: subRow.studentId,
      answers: JSON.parse(subRow.answers),
      questionScores: subRow.questionScores ? JSON.parse(subRow.questionScores) : undefined,
      overallScore: subRow.overallScore,
      percentageAchieved: subRow.percentageAchieved,
      generalFeedback: subRow.generalFeedback,
      apiCost: subRow.apiCost,
      apiModel: subRow.apiModel,
      apiTokensInput: subRow.apiTokensInput,
      apiTokensOutput: subRow.apiTokensOutput,
      manualScore: subRow.manualScore,
      manualFeedback: subRow.manualFeedback,
      evaluatedBy: subRow.evaluatedBy,
      evaluatedAt: subRow.evaluatedAt,
      status: subRow.status,
      submittedAt: subRow.submittedAt,
      createdAt: subRow.createdAt,
      updatedAt: subRow.updatedAt,
    };
  }

  // Decidir qué mostrar
  const showResults = existingSubmission?.status === 'evaluated' || existingSubmission?.status === 'submitted';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Link
          href="/dashboard/student-consudec"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Actividades
        </Link>

        {/* Content */}
        {showResults && existingSubmission ? (
          <SubmissionResultViewer
            submission={{
              ...existingSubmission,
              activity,
              studentName: session.user.name || 'Sin nombre',
              studentEmail: session.user.email || '',
            }}
          />
        ) : (
          <ActivitySubmissionForm
            activity={activity}
            existingSubmission={existingSubmission}
          />
        )}
      </div>
    </div>
  );
}
