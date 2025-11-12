/**
 * Página de visualización de submission individual (Instructor)
 * Muestra resultados de evaluación con opción de volver
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SubmissionResultViewer from '@/components/consudec/SubmissionResultViewer';
import type { SubmissionResult } from '@/types/consudec-activity';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SubmissionViewPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'INSTRUCTOR') {
      router.push('/dashboard');
      return;
    }

    fetchSubmission();
  }, [session, status, router]);

  const fetchSubmission = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/consudec/submissions/${id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar submission');
      }

      const data = await response.json();
      setSubmission(data.submission);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar submission');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Error al cargar evaluación</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <Link
            href="/dashboard/instructor/consudec"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mt-6 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Actividades
          </Link>
        </main>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Evaluación no encontrada</h1>
            <p className="text-slate-600 mb-6">Esta evaluación no existe.</p>
            <Link
              href="/dashboard/instructor/consudec"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a Actividades
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleBack = () => {
    // Navigate back to the submissions list for this activity
    router.push(
      `/dashboard/instructor/consudec/activities/${submission.activityId}/submissions`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Lista de Entregas
        </button>

        {/* Submission Results */}
        <SubmissionResultViewer submission={submission} onBack={handleBack} />
      </main>
    </div>
  );
}
