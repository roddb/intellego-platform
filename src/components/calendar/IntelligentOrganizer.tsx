'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import SmartCalendar from './SmartCalendar'
import ScheduleSetup from './ScheduleSetup'
import EventWizard from './EventWizard'
import EventEditor from './EventEditor'
import { 
  CalendarEvent, 
  getUserCalendarData, 
  createUserCalendarData,
  findAvailableTimeSlots,
  isTimeSlotAvailable
} from '@/lib/calendar-data'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CogIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface ConflictAlert {
  id: string
  type: 'schedule_conflict' | 'study_overload' | 'exam_proximity'
  message: string
  severity: 'high' | 'medium' | 'low'
  suggestions: string[]
}

export default function IntelligentOrganizer() {
  const { data: session } = useSession()
  const [userCalendarData, setUserCalendarData] = useState<any>(null)
  const [showScheduleSetup, setShowScheduleSetup] = useState(false)
  const [showEventWizard, setShowEventWizard] = useState(false)
  const [showEventEditor, setShowEventEditor] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictAlert[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [mounted, setMounted] = useState(false)

  const userId = session?.user?.id || 'demo-student-fixed'

  useEffect(() => {
    setMounted(true)
    loadUserData()
  }, [userId])

  useEffect(() => {
    if (userCalendarData) {
      analyzeConflicts()
    }
  }, [userCalendarData])

  const loadUserData = () => {
    let userData = getUserCalendarData(userId)
    
    if (!userData) {
      userData = createUserCalendarData(userId)
    }
    
    setUserCalendarData(userData)
    
    // Show setup if not completed
    if (!userData.isSetupComplete) {
      setShowScheduleSetup(true)
    }
  }
  
  // Sistema de refresh automático para datos del calendario
  useEffect(() => {
    const refreshData = () => {
      const newData = getUserCalendarData(userId)
      if (newData && userCalendarData && 
          newData.lastUpdated.getTime() !== userCalendarData.lastUpdated.getTime()) {
        console.log('🗓️ Datos del organizador actualizados automáticamente')
        setUserCalendarData(newData)
      }
    }
    
    // Verificar cada 3 segundos si hay cambios
    const interval = setInterval(refreshData, 3000)
    
    return () => clearInterval(interval)
  }, [userId, userCalendarData?.lastUpdated])

  const analyzeConflicts = () => {
    if (!userCalendarData) return

    const detectedConflicts: ConflictAlert[] = []
    const events = userCalendarData.events
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Check for scheduling conflicts
    events.forEach((event: CalendarEvent, index: number) => {
      events.slice(index + 1).forEach((otherEvent: CalendarEvent) => {
        if (event.date.toDateString() === otherEvent.date.toDateString()) {
          if (event.startTime && event.endTime && otherEvent.startTime && otherEvent.endTime) {
            const eventStart = new Date(`2000-01-01T${event.startTime}:00`)
            const eventEnd = new Date(`2000-01-01T${event.endTime}:00`)
            const otherStart = new Date(`2000-01-01T${otherEvent.startTime}:00`)
            const otherEnd = new Date(`2000-01-01T${otherEvent.endTime}:00`)

            if (eventStart < otherEnd && eventEnd > otherStart) {
              detectedConflicts.push({
                id: `conflict-${event.id}-${otherEvent.id}`,
                type: 'schedule_conflict',
                message: `Conflicto entre "${event.title}" y "${otherEvent.title}"`,
                severity: 'high',
                suggestions: [
                  'Reprogramar uno de los eventos',
                  'Reducir la duración de ambos eventos',
                  'Cambiar la fecha de uno de ellos'
                ]
              })
            }
          }
        }
      })
    })

    // Check for exam proximity (multiple exams in short time)
    const upcomingExams = events.filter((event: CalendarEvent) => 
      event.type === 'exam' && 
      event.date >= today && 
      event.date <= nextWeek
    )

    if (upcomingExams.length > 2) {
      detectedConflicts.push({
        id: 'exam-overload',
        type: 'exam_proximity',
        message: `Tienes ${upcomingExams.length} exámenes en los próximos 7 días`,
        severity: 'medium',
        suggestions: [
          'Crear sesiones de estudio intensivas',
          'Priorizar materias más difíciles',
          'Solicitar reprogramación si es posible'
        ]
      })
    }

    // Check for study session overload
    const studySessions = events.filter((event: CalendarEvent) => 
      event.type === 'study_session' && 
      event.date >= today && 
      event.date <= nextWeek
    )

    const totalStudyHours = studySessions.reduce((total: number, session: CalendarEvent) => {
      return total + (session.duration || 60) / 60
    }, 0)

    if (totalStudyHours > 30) { // More than 30 hours per week
      detectedConflicts.push({
        id: 'study-overload',
        type: 'study_overload',
        message: `Tienes ${totalStudyHours.toFixed(1)} horas de estudio programadas esta semana`,
        severity: 'medium',
        suggestions: [
          'Redistribuir sesiones de estudio',
          'Reducir duración de algunas sesiones',
          'Agregar descansos entre sesiones'
        ]
      })
    }

    setConflicts(detectedConflicts)
  }

  const handleSetupComplete = () => {
    setShowScheduleSetup(false)
    loadUserData()
  }

  const handleEventCreated = (event: CalendarEvent) => {
    // Force re-render by updating state
    setUserCalendarData(null)
    setTimeout(() => {
      loadUserData()
      analyzeConflicts()
    }, 100)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventEditor(true)
  }

  const handleEventUpdated = (updatedEvent: CalendarEvent) => {
    setSelectedEvent(updatedEvent)
    // Force re-render by updating state
    setUserCalendarData(null)
    setTimeout(() => {
      loadUserData()
      analyzeConflicts()
    }, 100)
  }

  const handleEventDeleted = (eventId: string) => {
    setSelectedEvent(null)
    setShowEventEditor(false)
    // Force re-render by updating state
    setUserCalendarData(null)
    setTimeout(() => {
      loadUserData()
      analyzeConflicts()
    }, 100)
  }

  const handleDateClick = (date: Date) => {
    // Could open event wizard for specific date
    console.log('Date clicked:', date)
  }

  const getSuggestions = () => {
    if (!userCalendarData || !mounted) return []

    const suggestions = []
    const today = new Date()

    // Suggest study sessions for upcoming exams
    const upcomingExams = userCalendarData.events.filter((event: CalendarEvent) => 
      event.type === 'exam' && 
      event.date > today
    ).sort((a: CalendarEvent, b: CalendarEvent) => a.date.getTime() - b.date.getTime())

    upcomingExams.slice(0, 2).forEach((exam: CalendarEvent) => {
      const daysUntilExam = Math.ceil((exam.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExam > 1 && daysUntilExam <= 14) {
        // Find available slots for study sessions
        const availableSlots = findAvailableTimeSlots(userId, today, 90, 'afternoon')
        
        if (availableSlots.length > 0) {
          suggestions.push({
            type: 'study_session',
            message: `Programa una sesión de estudio para ${exam.subject}`,
            detail: `Tienes ${daysUntilExam} días hasta el examen`,
            action: () => setShowEventWizard(true)
          })
        }
      }
    })

    // Suggest schedule optimization
    if (conflicts.length > 0) {
      suggestions.push({
        type: 'optimization',
        message: 'Se detectaron conflictos en tu horario',
        detail: `${conflicts.length} conflicto${conflicts.length > 1 ? 's' : ''} encontrado${conflicts.length > 1 ? 's' : ''}`,
        action: () => console.log('Show optimization suggestions')
      })
    }

    return suggestions
  }

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'low':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800'
    }
  }

  const suggestions = getSuggestions()

  if (showScheduleSetup) {
    return (
      <ScheduleSetup
        userId={userId}
        onSetupComplete={handleSetupComplete}
        className="min-h-screen bg-slate-50 py-8"
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Organizador Inteligente
            </h1>
            <p className="text-slate-600 mt-1">
              Gestiona tu tiempo académico con inteligencia artificial
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowScheduleSetup(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <CogIcon className="w-4 h-4" />
              <span>Configurar Horario</span>
            </button>
            
            <button
              onClick={() => setShowEventWizard(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Alerts and Suggestions */}
        {(conflicts.length > 0 || suggestions.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-500" />
                  Conflictos Detectados
                </h3>
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={`p-4 rounded-lg border ${getConflictSeverityColor(conflict.severity)}`}
                  >
                    <p className="font-medium mb-2">{conflict.message}</p>
                    <div className="space-y-1">
                      {conflict.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-sm opacity-80">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2 text-green-500" />
                  Sugerencias Inteligentes
                </h3>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-green-800 mb-1">
                          {suggestion.message}
                        </p>
                        <p className="text-sm text-green-700">
                          {suggestion.detail}
                        </p>
                      </div>
                      <button
                        onClick={suggestion.action}
                        className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors"
                      >
                        Actuar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Calendar */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <SmartCalendar
              userId={userId}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onAddEvent={() => setShowEventWizard(true)}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-medium text-slate-800 mb-4">
                Resumen Semanal
              </h3>
              
              {mounted && userCalendarData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Eventos totales</span>
                    <span className="font-medium text-slate-800">
                      {userCalendarData.events?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Exámenes</span>
                    <span className="font-medium text-red-600">
                      {userCalendarData.events?.filter((e: CalendarEvent) => e.type === 'exam').length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sesiones de estudio</span>
                    <span className="font-medium text-blue-600">
                      {userCalendarData.events?.filter((e: CalendarEvent) => e.type === 'study_session').length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Conflictos</span>
                    <span className={`font-medium ${conflicts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {conflicts.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Event Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-medium text-slate-800 mb-4">
                Acciones Rápidas
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowEventWizard(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-teal-600">📝</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Agregar Examen</p>
                    <p className="text-sm text-slate-600">Programa una evaluación</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowEventWizard(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">📚</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Sesión de Estudio</p>
                    <p className="text-sm text-slate-600">Planifica tiempo de estudio</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowScheduleSetup(true)}
                  className="w-full flex items-center space-x-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">⚙️</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Configurar Horario</p>
                    <p className="text-sm text-slate-600">Actualiza tu cronograma</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Wizard Modal */}
      {showEventWizard && (
        <EventWizard
          userId={userId}
          onEventCreated={handleEventCreated}
          onClose={() => setShowEventWizard(false)}
        />
      )}

      {/* Event Editor Modal */}
      {showEventEditor && selectedEvent && (
        <EventEditor
          event={selectedEvent}
          userId={userId}
          onEventUpdated={handleEventUpdated}
          onEventDeleted={handleEventDeleted}
          onClose={() => {
            setShowEventEditor(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}