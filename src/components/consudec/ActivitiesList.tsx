/**
 * Lista de actividades CONSUDEC para estudiantes
 * Vista de grid con cards mostrando estado y progreso
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Calendar,
  Award,
} from 'lucide-react';
import type { ConsudecActivity } from '@/types/consudec-activity';
import { formatDate, getDifficultyColor, getDifficultyLabel } from '@/lib/consudec-utils';

interface ActivityWithSubmission extends ConsudecActivity {
  hasSubmission?: boolean;
  isEvaluated?: boolean;
  score?: number;
}

interface ActivitiesListProps {
  onActivityClick: (activity: ActivityWithSubmission) => void;
  className?: string;
}

type FilterType = 'clinical' | 'pedagogical' | 'project' | 'all';

export default function ActivitiesList({ onActivityClick, className = '' }: ActivitiesListProps) {
  const [activities, setActivities] = useState<ActivityWithSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('clinical');

  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Construir URL con filtros
      let url = '/api/consudec/activities';
      const params = new URLSearchParams();

      if (activeFilter !== 'all') {
        params.append('activityType', activeFilter);
      }

      // Para casos clínicos, también filtrar por Bioelectricidad
      if (activeFilter === 'clinical') {
        params.append('subject', 'Bioelectricidad');
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar actividades');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al cargar actividades');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando actividades...</p>
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
            <p className="font-semibold mb-1">Error al cargar actividades</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No hay actividades disponibles
          </h3>
          <p className="text-slate-500">
            Las actividades aparecerán aquí cuando tu instructor las publique.
          </p>
        </div>
      </div>
    );
  }

  // Filtrar solo actividades activas y dentro del rango de disponibilidad
  const now = new Date().toISOString();
  const availableActivities = activities.filter((activity) => {
    if (activity.status !== 'active') return false;

    const isAfterStart = !activity.availableFrom || now >= activity.availableFrom;
    const isBeforeEnd = !activity.availableUntil || now <= activity.availableUntil;

    return isAfterStart && isBeforeEnd;
  });

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Actividades Disponibles</h2>
        <p className="text-slate-600">
          Selecciona una actividad para completarla o revisar tus resultados
        </p>
      </div>


      {/* Grid de actividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableActivities.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            index={index}
            onClick={() => onActivityClick(activity)}
          />
        ))}
      </div>

      {availableActivities.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            No hay actividades disponibles en este momento
          </h3>
          <p className="text-amber-700 text-sm">
            Hay {activities.length} actividad(es) pero aún no están dentro del período de
            disponibilidad.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Card individual de actividad
 */
interface ActivityCardProps {
  activity: ActivityWithSubmission;
  index: number;
  onClick: () => void;
}

function ActivityCard({ activity, index, onClick }: ActivityCardProps) {
  const hasSubmission = activity.hasSubmission || false;
  const isEvaluated = activity.isEvaluated || false;
  const score = activity.score;

  // Determinar estado de la card
  const getStatusBadge = () => {
    if (isEvaluated && score !== undefined) {
      const level =
        score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'satisfactory' : 'insufficient';

      const colors = {
        excellent: 'bg-green-100 text-green-700 border-green-300',
        good: 'bg-blue-100 text-blue-700 border-blue-300',
        satisfactory: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        insufficient: 'bg-red-100 text-red-700 border-red-300',
      };

      return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${colors[level]}`}>
          <Award className="w-4 h-4" />
          <span className="text-sm font-semibold">Evaluado: {score}/100</span>
        </div>
      );
    }

    if (hasSubmission) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Entregado</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
        <FileText className="w-4 h-4" />
        <span className="text-sm font-semibold">Pendiente</span>
      </div>
    );
  };

  const difficultyColor = getDifficultyColor(activity.difficulty);
  const difficultyLabel = getDifficultyLabel(activity.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-md border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group overflow-hidden"
    >
      {/* Header con icono */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16" />
        <BookOpen className="w-10 h-10 mb-3" />
        <h3 className="text-xl font-bold mb-1 line-clamp-2 group-hover:underline">
          {activity.title}
        </h3>
        {activity.subject && (
          <span className="inline-block px-2 py-1 bg-white bg-opacity-20 text-xs font-medium rounded">
            {activity.subject}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Descripción */}
        <p className="text-sm text-slate-600 line-clamp-3">{activity.description}</p>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Dificultad */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Dificultad:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>

          {/* Preguntas */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4" />
            <span>{activity.questions.length} preguntas</span>
          </div>

          {/* Tiempo estimado */}
          {activity.estimatedTime && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{activity.estimatedTime} minutos</span>
            </div>
          )}

          {/* Disponibilidad */}
          {activity.availableUntil && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Hasta: {formatDate(activity.availableUntil)}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-4">
          {getStatusBadge()}
        </div>

        {/* CTA */}
        <div className="pt-2">
          {isEvaluated ? (
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
              <CheckCircle2 className="w-5 h-5" />
              <span>Ver Resultados →</span>
            </div>
          ) : hasSubmission ? (
            <div className="flex items-center gap-2 text-amber-600 font-medium text-sm group-hover:gap-3 transition-all">
              <Clock className="w-5 h-5" />
              <span>Ver Estado →</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm group-hover:gap-3 transition-all">
              <FileText className="w-5 h-5" />
              <span>Comenzar Actividad →</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
