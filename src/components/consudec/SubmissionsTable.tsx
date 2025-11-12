/**
 * Tabla de submissions CONSUDEC para instructores
 * Vista de todas las entregas de una actividad con filtros y búsqueda
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Award,
  User,
  Calendar,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { SubmissionResult } from '@/types/consudec-activity';
import {
  formatDate,
  getLevelLabel,
  getLevelColor,
  getLevelIcon,
  formatPercentage,
} from '@/lib/consudec-utils';

interface SubmissionsTableProps {
  activityId: string;
  activityTitle: string;
  onViewSubmission: (submissionId: string) => void;
  onEditEvaluation?: (submissionId: string) => void;
  className?: string;
}

export default function SubmissionsTable({
  activityId,
  activityTitle,
  onViewSubmission,
  onEditEvaluation,
  className = '',
}: SubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'evaluated'>('all');

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/consudec/activities/${activityId}/submissions`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar entregas');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar entregas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  // Filtrado y búsqueda
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Búsqueda por nombre o email
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentName?.toLowerCase().includes(query) ||
          s.studentEmail?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [submissions, statusFilter, searchQuery]);

  // Estadísticas
  const stats = useMemo(() => {
    const evaluated = submissions.filter((s) => s.status === 'evaluated');
    const avgScore = evaluated.length > 0
      ? evaluated.reduce((sum, s) => sum + (s.manualScore ?? s.overallScore ?? 0), 0) / evaluated.length
      : 0;

    return {
      total: submissions.length,
      drafts: submissions.filter((s) => s.status === 'draft').length,
      submitted: submissions.filter((s) => s.status === 'submitted').length,
      evaluated: evaluated.length,
      averageScore: Math.round(avgScore),
    };
  }, [submissions]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Error al cargar entregas</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{activityTitle}</h2>
        <p className="text-slate-600">Gestión de entregas de estudiantes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Entregas"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Borradores"
          value={stats.drafts}
          icon={<Edit className="w-5 h-5" />}
          color="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="Evaluadas"
          value={stats.evaluated}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Promedio"
          value={stats.averageScore > 0 ? `${stats.averageScore}/100` : '-'}
          icon={<Award className="w-5 h-5" />}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="evaluated">Evaluadas</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No hay entregas</h3>
          <p className="text-slate-500">
            {searchQuery || statusFilter !== 'all'
              ? 'No se encontraron entregas con los filtros aplicados.'
              : 'Aún no hay entregas de estudiantes para esta actividad.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Fecha Entrega
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubmissions.map((submission, index) => (
                  <SubmissionRow
                    key={submission.id}
                    submission={submission}
                    index={index}
                    onView={() => onViewSubmission(submission.id)}
                    onEdit={onEditEvaluation ? () => onEditEvaluation(submission.id) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card de estadística
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

/**
 * Fila de submission
 */
interface SubmissionRowProps {
  submission: SubmissionResult;
  index: number;
  onView: () => void;
  onEdit?: () => void;
}

function SubmissionRow({ submission, index, onView, onEdit }: SubmissionRowProps) {
  const finalScore = submission.manualScore ?? submission.overallScore ?? 0;
  const hasManualOverride = submission.manualScore !== null && submission.manualScore !== undefined;

  const level =
    finalScore >= 85
      ? 'excellent'
      : finalScore >= 70
      ? 'good'
      : finalScore >= 50
      ? 'satisfactory'
      : 'insufficient';

  const statusConfig = {
    draft: {
      label: 'Borrador',
      color: 'bg-slate-100 text-slate-700',
      icon: <Edit className="w-4 h-4" />,
    },
    submitted: {
      label: 'Entregada',
      color: 'bg-amber-100 text-amber-700',
      icon: <Clock className="w-4 h-4" />,
    },
    evaluated: {
      label: 'Evaluada',
      color: 'bg-green-100 text-green-700',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const statusInfo = statusConfig[submission.status];

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Estudiante */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
            {submission.studentName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-800">{submission.studentName || 'Sin nombre'}</p>
            <p className="text-sm text-slate-500">{submission.studentEmail}</p>
          </div>
        </div>
      </td>

      {/* Estado */}
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="text-sm font-medium">{statusInfo.label}</span>
        </div>
      </td>

      {/* Score */}
      <td className="px-6 py-4">
        {submission.status === 'evaluated' ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">{finalScore}</span>
            <span className="text-sm text-slate-500">/100</span>
            {hasManualOverride && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                Manual
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Nivel */}
      <td className="px-6 py-4">
        {submission.status === 'evaluated' ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{getLevelIcon(level)}</span>
            <span className={`text-sm font-medium ${getLevelColor(level).split(' ')[1]}`}>
              {getLevelLabel(level)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Fecha */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          {submission.submittedAt ? formatDate(submission.submittedAt) : 'No entregado'}
        </div>
      </td>

      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver detalle"
          >
            <Eye className="w-5 h-5" />
          </button>
          {onEdit && submission.status === 'evaluated' && (
            <button
              onClick={onEdit}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Editar evaluación"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
