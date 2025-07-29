'use client'

import { useState } from 'react'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  BookOpenIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { 
  CalendarEvent, 
  addCalendarEvent, 
  getEventTypeColor, 
  isTimeSlotAvailable,
  findAvailableTimeSlots,
  getUserCalendarData
} from '@/lib/calendar-data'

interface EventWizardProps {
  userId: string
  onEventCreated?: (event: CalendarEvent) => void
  onClose?: () => void
  className?: string
}

interface WizardStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface EventFormData {
  title: string
  date: Date
  startTime: string
  endTime: string
  type: CalendarEvent['type']
  subject: string
  location: string
  description: string
  priority: 'high' | 'medium' | 'low'
  duration: number
}

const eventTypes = [
  { value: 'exam', label: 'Examen', icon: '📝', description: 'Evaluación académica' },
  { value: 'study_session', label: 'Sesión de Estudio', icon: '📚', description: 'Tiempo dedicado al estudio' },
  { value: 'personal', label: 'Personal', icon: '👤', description: 'Actividad personal' },
  { value: 'extracurricular', label: 'Extracurricular', icon: '🏃‍♀️', description: 'Actividad fuera del plan de estudios' }
]

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

export default function EventWizard({ userId, onEventCreated, onClose, className = '' }: EventWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: new Date(),
    startTime: '15:00',
    endTime: '16:00',
    type: 'exam',
    subject: '',
    location: '',
    description: '',
    priority: 'medium',
    duration: 60
  })
  const [conflicts, setConflicts] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const steps: WizardStep[] = [
    {
      id: 'type',
      title: 'Tipo de Evento',
      description: 'Selecciona qué tipo de evento quieres agregar',
      completed: !!formData.type
    },
    {
      id: 'details',
      title: 'Detalles del Evento',
      description: 'Información básica del evento',
      completed: !!formData.title && !!formData.subject
    },
    {
      id: 'datetime',
      title: 'Fecha y Hora',
      description: 'Cuándo será el evento',
      completed: !!formData.date && !!formData.startTime && !!formData.endTime
    },
    {
      id: 'conflicts',
      title: 'Verificar Conflictos',
      description: 'Revisión de disponibilidad',
      completed: conflicts.length === 0
    },
    {
      id: 'confirm',
      title: 'Confirmar',
      description: 'Revisar y crear el evento',
      completed: false
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      
      // Check conflicts when moving to conflicts step
      if (currentStep + 1 === 3) {
        checkConflicts()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const checkConflicts = () => {
    const isAvailable = isTimeSlotAvailable(userId, formData.date, formData.startTime, formData.endTime)
    
    if (!isAvailable) {
      setConflicts(['Ya tienes un evento programado en este horario'])
      
      // Find alternative time slots
      const alternatives = findAvailableTimeSlots(userId, formData.date, formData.duration)
      setAvailableSlots(alternatives.slice(0, 3))
    } else {
      setConflicts([])
      setAvailableSlots([])
    }
  }

  const createEvent = async () => {
    setIsCreating(true)
    
    try {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        type: formData.type,
        color: getEventTypeColor(formData.type),
        subject: formData.subject,
        location: formData.location,
        description: formData.description,
        priority: formData.priority,
        duration: formData.duration
      }

      const success = addCalendarEvent(userId, newEvent)
      
      if (success) {
        onEventCreated?.(newEvent)
        onClose?.()
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const selectAlternativeSlot = (slot: { start: string; end: string }) => {
    setFormData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }))
    setConflicts([])
    setAvailableSlots([])
  }

  const getSubjectOptions = () => {
    switch (formData.type) {
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
    switch (formData.type) {
      case 'exam':
        return 'Materia del examen *'
      case 'study_session':
        return 'Tema de estudio *'
      case 'personal':
        return 'Tipo de actividad *'
      case 'extracurricular':
        return 'Actividad extracurricular *'
      default:
        return 'Materia *'
    }
  }

  const calculateDuration = () => {
    const start = new Date(`2000-01-01T${formData.startTime}:00`)
    const end = new Date(`2000-01-01T${formData.endTime}:00`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60)
    setFormData(prev => ({ ...prev, duration }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type selection
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as CalendarEvent['type'] }))}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${formData.type === type.value 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <h3 className="font-medium text-slate-800">{type.label}</h3>
                      <p className="text-sm text-slate-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 1: // Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título del evento *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Examen de Matemáticas"
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
                <option value="">
                  {formData.type === 'exam' ? 'Seleccionar materia' :
                   formData.type === 'study_session' ? 'Seleccionar tema' :
                   formData.type === 'personal' ? 'Seleccionar actividad' :
                   'Seleccionar actividad extracurricular'}
                </option>
                {getSubjectOptions().map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
        )

      case 2: // Date and time
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, startTime: e.target.value }))
                    calculateDuration()
                  }}
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, endTime: e.target.value }))
                    calculateDuration()
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <ClockIcon className="w-4 h-4" />
                <span>Duración: {formData.duration} minutos</span>
              </div>
            </div>
          </div>
        )

      case 3: // Conflicts
        return (
          <div className="space-y-6">
            {conflicts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  ¡Perfecto! No hay conflictos
                </h3>
                <p className="text-slate-600">
                  El horario seleccionado está disponible
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="font-medium">Conflictos detectados</span>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {conflicts.map((conflict, index) => (
                      <li key={index} className="text-sm text-red-800">
                        • {conflict}
                      </li>
                    ))}
                  </ul>
                </div>

                {availableSlots.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-3">
                      Horarios alternativos disponibles:
                    </h4>
                    <div className="space-y-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => selectAlternativeSlot(slot)}
                          className="w-full p-3 text-left border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800">
                              {slot.start} - {slot.end}
                            </span>
                            <span className="text-sm text-teal-600">
                              Usar este horario
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 4: // Confirm
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Confirmar Evento
              </h3>
              <p className="text-slate-600">
                Revisa los detalles antes de crear el evento
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tipo:</span>
                <span className="font-medium text-slate-800">
                  {eventTypes.find(t => t.value === formData.type)?.label}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Título:</span>
                <span className="font-medium text-slate-800">{formData.title}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Materia:</span>
                <span className="font-medium text-slate-800">{formData.subject}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Fecha:</span>
                <span className="font-medium text-slate-800">
                  {formData.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Horario:</span>
                <span className="font-medium text-slate-800">
                  {formData.startTime} - {formData.endTime}
                </span>
              </div>
              
              {formData.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Ubicación:</span>
                  <span className="font-medium text-slate-800">{formData.location}</span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!formData.type
      case 1:
        return !!formData.title && !!formData.subject
      case 2:
        return !!formData.date && !!formData.startTime && !!formData.endTime
      case 3:
        return conflicts.length === 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Crear Nuevo Evento
            </h2>
            <p className="text-slate-600 mt-1">
              Paso {currentStep + 1} de {steps.length}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStep 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-12 h-0.5 mx-2
                      ${index < currentStep ? 'bg-teal-500' : 'bg-slate-200'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium text-slate-800">
              {steps[currentStep].title}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex space-x-3">
            {currentStep === steps.length - 1 ? (
              <button
                onClick={createEvent}
                disabled={!isStepValid() || isCreating}
                className="inline-flex items-center space-x-2 px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{isCreating ? 'Creando...' : 'Crear Evento'}</span>
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="inline-flex items-center space-x-2 px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <span>Siguiente</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}