/**
 * Página de submissions de una actividad CONSUDEC (Instructor)
 * Muestra tabla con todas las entregas de estudiantes
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SubmissionsTable from '@/components/consudec/SubmissionsTable';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ActivitySubmissionsPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Unwrap params promise (Next.js 15+)
  const resolvedParams = use(params);
  const activityId = resolvedParams.id;

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

    fetchActivityTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, activityId]);

  const fetchActivityTitle = async () => {
    try {
      const response = await fetch(`/api/consudec/activities/${activityId}`);

      if (response.ok) {
        const data = await response.json();
        setActivityTitle(data.activity?.title || 'Actividad');
      }
    } catch (err) {
      console.error('Error fetching activity title:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/dashboard/instructor/consudec/submissions/${submissionId}`);
  };

  const handleEditEvaluation = (submissionId: string) => {
    router.push(`/dashboard/instructor/consudec/submissions/${submissionId}/edit`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back button */}
        <Link
          href="/dashboard/instructor/consudec"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Actividades
        </Link>

        {/* Submissions Table */}
        <SubmissionsTable
          activityId={activityId}
          activityTitle={activityTitle}
          onViewSubmission={handleViewSubmission}
          onEditEvaluation={handleEditEvaluation}
        />
      </main>
    </div>
  );
}
