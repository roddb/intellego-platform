'use client'

import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline'
import { 
  CalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getEventTypeColor 
} from '@/lib/calendar-data'

interface EventEditorProps {
  event: CalendarEvent
  userId: string
  onEventUpdated?: (event: CalendarEvent) => void
  onEventDeleted?: (eventId: string) => void
  onClose?: () => void
  className?: string
}

const academicSubjects = [
  'Matemáticas', 'Química', 'Física', 'Biología', 'Historia', 'Literatura', 
  'Inglés', 'Educación Física', 'Arte', 'Filosofía', 'Geografía', 'Informática'
]

const studyTopics = [
  'Revisión General', 'Ejercicios Prácticos', 'Memorización', 'Comprensión de Conceptos',
  'Resolución de Problemas', 'Lectura de Material', 'Preparación de Examen',
  'Investigación', 'Trabajo en Grupo', 'Consulta con Profesor'
]

const personalActivities = [
  'Cita Médica', 'Reunión Familiar', 'Tiempo Personal', 'Descanso',
  'Hobbie', 'Salida Social', 'Compras', 'Trámites', 'Visita', 'Otro'
]

const extracurricularActivities = [
  'Fútbol', 'Básquet', 'Natación', 'Atletismo', 'Danza', 'Teatro',
  'Música', 'Coro', 'Voluntariado', 'Club de Ciencias', 'Debate',
  'Robótica', 'Arte', 'Fotografía', 'Otro Deporte', 'Otra Actividad'
]

const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
]

export default function EventEditor({ 
  event, 
  userId, 
  onEventUpdated, 
  onEventDeleted, 
  onClose, 
  className = '' 
}: EventEditorProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [formData, setFormData] = useState({
    title: event.title,
    date: event.date.toISOString().split('T')[0],
    startTime: event.startTime || '15:00',
    endTime: event.endTime || '16:00',
    subject: event.subject || '',
    location: event.location || '',
    description: event.description || '',
    priority: event.priority || 'medium' as 'high' | 'medium' | 'low'
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getSubjectOptions = () => {
    switch (event.type) {
      case 'exam':
        return academicSubjects
      case 'study_session':
        return studyTopics
      case 'personal':
        return personalActivities
      case 'extracurricular':
        return extracurricularActivities
      default:
        return academicSubjects
    }
  }

  const getSubjectLabel = () => {
    switch (event.type) {
      case 'exam':
        return 'Materia del examen'
      case 'study_session':
        return 'Tema de estudio'
      case 'personal':
        return 'Tipo de actividad'
      case 'extracurricular':
        return 'Actividad extracurricular'
      default:
        return 'Materia'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'exam':
        return 'Examen'
      case 'study_session':
        return 'Sesión de Estudio'
      case 'personal':
        return 'Personal'
      case 'extracurricular':
        return 'Extracurricular'
      default:
        return type
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    try {
      const updates: Partial<CalendarEvent> = {
        title: formData.title,
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        subject: formData.subject,
        location: formData.location,
        description: formData.description,
        priority: formData.priority
      }

      const success = updateCalendarEvent(userId, event.id, updates)
      
      if (success) {
        const updatedEvent = { ...event, ...updates }
        onEventUpdated?.(updatedEvent)
        setMode('view')
      }
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const success = deleteCalendarEvent(userId, event.id)
      
      if (success) {
        onEventDeleted?.(event.id)
        onClose?.()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${formData.startTime}:00`)
    const end = new Date(`2000-01-01T${formData.endTime}:00`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    return duration
  }

  if (mode === 'delete') {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${className}`}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              ¿Eliminar evento?
            </h3>
            
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que quieres eliminar &quot;<strong>{event.title}</strong>&quot;? 
              Esta acción no se puede deshacer.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setMode('view')}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {mode === 'edit' ? 'Editar Evento' : 'Detalles del Evento'}
              </h2>
              <p className="text-slate-600 text-sm">
                {getEventTypeLabel(event.type)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Editar evento"
                >
                  <PencilIcon className="w-5 h-5 text-slate-600" />
                </button>
                
                <button
                  onClick={() => setMode('delete')}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Eliminar evento"
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {mode === 'view' ? (
            // View Mode
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">Título</label>
                <p className="text-lg font-medium text-slate-900">{event.title}</p>
              </div>
              
              {event.subject && (
                <div>
                  <label className="text-sm text-slate-600">{getSubjectLabel()}</label>
                  <p className="font-medium text-slate-900">{event.subject}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm text-slate-600">Fecha y hora</label>
                <p className="font-medium text-slate-900">
                  {event.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                  {event.startTime && ` • ${event.startTime} - ${event.endTime}`}
                </p>
              </div>
              
              {event.location && (
                <div>
                  <label className="text-sm text-slate-600">Ubicación</label>
                  <p className="font-medium text-slate-900">{event.location}</p>
                </div>
              )}
              
              {event.description && (
                <div>
                  <label className="text-sm text-slate-600">Descripción</label>
                  <p className="text-slate-900">{event.description}</p>
                </div>
              )}
              
              {event.priority && (
                <div>
                  <label className="text-sm text-slate-600">Prioridad</label>
                  <span className={`
                    inline-block px-3 py-1 rounded-full text-sm font-medium
                    ${event.priority === 'high' ? 'bg-red-100 text-red-800' :
                      event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                  `}>
                    {event.priority === 'high' ? 'Alta' :
                     event.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título del evento *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {getSubjectLabel()}
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Seleccionar...</option>
                  {getSubjectOptions().map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de inicio
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hora de fin
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>Duración: {calculateDuration()} minutos</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ej: Aula 201, Laboratorio A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prioridad
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
                    { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
                    { value: 'low', label: 'Baja', color: 'bg-green-100 text-green-800' }
                  ].map(priority => (
                    <button
                      key={priority.value}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${formData.priority === priority.value
                          ? priority.color
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }
                      `}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Información adicional del evento"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'edit' && (
          <div className="flex items-center justify-between p-6 border-t border-slate-200">
            <button
              onClick={() => setMode('view')}
              disabled={isUpdating}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleUpdate}
              disabled={isUpdating || !formData.title.trim()}
              className="inline-flex items-center space-x-2 px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isUpdating ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}