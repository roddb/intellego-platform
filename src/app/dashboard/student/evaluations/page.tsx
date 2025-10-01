'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EvaluationViewer from '@/components/student/EvaluationViewer';
import { FileText, Calendar, BookOpen, Filter, Loader2 } from 'lucide-react';
import type { Evaluation } from '@/types/evaluation';

export default function StudentEvaluationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user) {
      // Allow students and instructors in impersonation mode
      const isStudent = session.user.role === 'STUDENT';
      const isInstructorImpersonating = session.user.role === 'INSTRUCTOR' && session.user.isImpersonating;

      if (!isStudent && !isInstructorImpersonating) {
        router.push('/dashboard/instructor');
      } else {
        fetchEvaluations();
      }
    }
  }, [status, session, router]);

  const fetchEvaluations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subjectFilter !== 'all') {
        params.append('subject', subjectFilter);
      }

      const response = await fetch(`/api/student/evaluations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al cargar las evaluaciones');
      }

      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvaluations();
    }
  }, [subjectFilter, status]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get unique subjects from evaluations
  const uniqueSubjects = Array.from(new Set(evaluations.map(e => e.subject))).sort();

  // Show evaluation viewer if one is selected
  if (selectedEvaluation) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <EvaluationViewer
            evaluation={selectedEvaluation}
            onBack={() => setSelectedEvaluation(null)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Mis Evaluaciones</h1>
                <p className="text-slate-600">Retroalimentación detallada de tus exámenes</p>
              </div>
            </div>

            {/* Filter bar */}
            {uniqueSubjects.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                <Filter className="h-5 w-5 text-slate-500" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="all">Todas las materias</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">Error al cargar evaluaciones</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && evaluations.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No hay evaluaciones disponibles
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                {subjectFilter !== 'all'
                  ? `No tienes evaluaciones de ${subjectFilter} todavía.`
                  : 'Tus evaluaciones aparecerán aquí una vez que tu profesor las suba al sistema.'}
              </p>
            </div>
          )}

          {/* Evaluations list */}
          {!loading && !error && evaluations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedEvaluation(evaluation)}
                >
                  {/* Subject badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {evaluation.subject}
                    </span>
                    <div className={`px-3 py-1 rounded-lg border font-semibold text-sm ${getScoreColor(evaluation.score)}`}>
                      {evaluation.score}/100
                    </div>
                  </div>

                  {/* Topic */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {evaluation.examTopic}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(evaluation.examDate)}</span>
                  </div>

                  {/* Preview */}
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {evaluation.feedback.substring(0, 150)}...
                  </p>

                  {/* View button */}
                  <button className="w-full py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium text-sm group-hover:bg-teal-50 group-hover:text-teal-700">
                    Ver Retroalimentación Completa →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Summary stats */}
          {!loading && !error && evaluations.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Resumen de Evaluaciones</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">{evaluations.length}</p>
                  <p className="text-sm text-slate-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)}
                  </p>
                  <p className="text-sm text-slate-600">Promedio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {Math.max(...evaluations.map(e => e.score))}
                  </p>
                  <p className="text-sm text-slate-600">Nota Máxima</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {uniqueSubjects.length}
                  </p>
                  <p className="text-sm text-slate-600">Materias</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
