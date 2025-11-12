/**
 * Dashboard CONSUDEC para Instructores
 * Gestión de actividades con caso educativo
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Users,
  Award,
  Clock,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import ActivityCreationModal from '@/components/consudec/ActivityCreationModal';
import type { ConsudecActivity } from '@/types/consudec-activity';
import {
  formatDate,
  getDifficultyLabel,
  getDifficultyColor,
} from '@/lib/consudec-utils';

export default function InstructorConsudecPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activities, setActivities] = useState<ConsudecActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

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

    fetchActivities();
  }, [session, status, router]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/consudec/activities');

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

  const handleViewSubmissions = (activityId: string) => {
    router.push(`/dashboard/instructor/consudec/activities/${activityId}/submissions`);
  };

  const handleEditActivity = (activityId: string) => {
    // TODO: Implement edit modal
    console.log('Edit activity:', activityId);
  };

  const handleDeleteActivity = async (activityId: string, activityTitle: string) => {
    if (!confirm(`¿Estás seguro de eliminar la actividad "${activityTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/consudec/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar actividad');
      }

      // Refresh list
      fetchActivities();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Gestión de Actividades CONSUDEC
              </h1>
              <p className="text-slate-600">
                Crea y administra actividades con casos educativos para tus estudiantes
              </p>
            </div>
            <button
              onClick={() => setIsCreationModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Actividad
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Actividades"
              value={activities.length}
              icon={<BookOpen className="w-5 h-5" />}
              color="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Activas"
              value={activities.filter((a) => a.status === 'active').length}
              icon={<Clock className="w-5 h-5" />}
              color="bg-green-100 text-green-700"
            />
            <StatCard
              label="Archivadas"
              value={activities.filter((a) => a.status === 'archived').length}
              icon={<BookOpen className="w-5 h-5" />}
              color="bg-slate-100 text-slate-700"
            />
            <StatCard
              label="Borradores"
              value={activities.filter((a) => a.status === 'draft').length}
              icon={<Edit className="w-5 h-5" />}
              color="bg-amber-100 text-amber-700"
            />
          </div>
        </motion.div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Activities List */}
        {activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No hay actividades creadas
            </h3>
            <p className="text-slate-500 mb-6">
              Comienza creando tu primera actividad con caso educativo.
            </p>
            <button
              onClick={() => setIsCreationModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Actividad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                onViewSubmissions={handleViewSubmissions}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
              />
            ))}
          </div>
        )}

        {/* Creation Modal */}
        <ActivityCreationModal
          isOpen={isCreationModalOpen}
          onClose={() => setIsCreationModalOpen(false)}
          onSuccess={(activityId) => {
            setIsCreationModalOpen(false);
            fetchActivities();
          }}
        />
      </main>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: number;
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
 * Activity Card Component
 */
interface ActivityCardProps {
  activity: ConsudecActivity;
  index: number;
  onViewSubmissions: (activityId: string) => void;
  onEdit: (activityId: string) => void;
  onDelete: (activityId: string, activityTitle: string) => void;
}

function ActivityCard({
  activity,
  index,
  onViewSubmissions,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const statusConfig = {
    active: { label: 'Activa', color: 'bg-green-100 text-green-700 border-green-300' },
    draft: { label: 'Borrador', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    archived: { label: 'Archivada', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  };

  const status = statusConfig[activity.status];
  const difficultyColor = getDifficultyColor(activity.difficulty);
  const difficultyLabel = getDifficultyLabel(activity.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold line-clamp-2 flex-1">{activity.title}</h3>
          <BookOpen className="w-8 h-8 flex-shrink-0 ml-3" />
        </div>
        {activity.subject && (
          <span className="inline-block px-3 py-1 bg-white bg-opacity-20 text-xs font-medium rounded-full">
            {activity.subject}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2">{activity.description}</p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Preguntas:</span>{' '}
            <strong className="text-slate-800">{activity.questions.length}</strong>
          </div>
          <div>
            <span className="text-slate-500">Dificultad:</span>{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>
          {activity.estimatedTime && (
            <div>
              <span className="text-slate-500">Tiempo:</span>{' '}
              <strong className="text-slate-800">{activity.estimatedTime} min</strong>
            </div>
          )}
          <div>
            <span className="text-slate-500">Estado:</span>{' '}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Availability */}
        {(activity.availableFrom || activity.availableUntil) && (
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            {activity.availableFrom && (
              <div>Desde: {formatDate(activity.availableFrom)}</div>
            )}
            {activity.availableUntil && (
              <div>Hasta: {formatDate(activity.availableUntil)}</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={() => onViewSubmissions(activity.id)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Ver Entregas
          </button>
          <button
            onClick={() => onEdit(activity.id)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(activity.id, activity.title)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
