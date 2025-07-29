'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Calendar, Clock, Users, BookOpen, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface WelcomeStats {
  student?: {
    reportsSubmitted: number
    currentStreak: number
    pointsEarned: number
    goalsCompleted: number
    nextReportDue: string
  }
  instructor?: {
    totalStudents: number
    reportsThisWeek: number
    alertsActive: number
    avgProgress: number
  }
}

export default function WelcomeDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<WelcomeStats>({})
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  const isInstructor = session?.user?.role === 'INSTRUCTOR'

  useEffect(() => {
    // Set mounted flag and initial time
    setMounted(true)
    setCurrentTime(new Date())
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Load welcome stats
    loadWelcomeStats()
  }, [session])

  const loadWelcomeStats = async () => {
    // For now, we'll use mock data
    // In a real implementation, this would fetch from APIs
    
    if (isInstructor) {
      setStats({
        instructor: {
          totalStudents: 24,
          reportsThisWeek: 18,
          alertsActive: 3,
          avgProgress: 78
        }
      })
    } else {
      setStats({
        student: {
          reportsSubmitted: 8,
          currentStreak: 3,
          pointsEarned: 1250,
          goalsCompleted: 2,
          nextReportDue: getNextWeekday(1) // Next Monday
        }
      })
    }
  }

  const getNextWeekday = (dayOfWeek: number) => {
    if (!mounted) return 'próximo lunes'
    
    const today = new Date()
    const nextDate = new Date()
    const currentDay = today.getDay()
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7
    
    nextDate.setDate(today.getDate() + daysUntilNext)
    
    return nextDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const getGreeting = () => {
    if (!currentTime) return '¡Hola'
    const hour = currentTime.getHours()
    if (hour < 12) return '¡Buenos días'
    if (hour < 18) return '¡Buenas tardes'
    return '¡Buenas noches'
  }

  const getMotivationalMessage = () => {
    // Fixed message based on user role to avoid hydration mismatch
    return isInstructor 
      ? "Tu dedicación transforma vidas."
      : "Tu esfuerzo de hoy será tu éxito de mañana."
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <span className="text-sm font-medium text-teal-800">
            {mounted && currentTime ? currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            }) : 'Cargando fecha...'}
          </span>
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900">
          {getGreeting()}, {session?.user?.name}! 👋
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Quick Stats - Simplified */}
      {isInstructor && stats.instructor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.instructor.totalStudents}</p>
                <p className="text-sm text-slate-600">Estudiantes activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.instructor.reportsThisWeek}</p>
                <p className="text-sm text-slate-600">Reportes esta semana</p>
              </div>
            </div>
          </div>
        </div>
      ) : stats.student ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.student.reportsSubmitted}</p>
                <p className="text-sm text-slate-600">Reportes enviados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.student.currentStreak}</p>
                <p className="text-sm text-slate-600">Semanas consecutivas</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pendientes Semanales - Solo para estudiantes */}
      {!isInstructor && (
        <PendientesSemanales stats={stats.student} />
      )}

      {/* Tips Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          💡 {isInstructor ? 'Consejos para Instructores' : 'Consejos para Estudiantes'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isInstructor ? (
            <>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Monitoreo Proactivo</h4>
                <p className="text-sm text-slate-600">Usa el análisis predictivo para identificar estudiantes en riesgo antes de que sea tarde.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Comunicación Efectiva</h4>
                <p className="text-sm text-slate-600">Los recordatorios automáticos mejoran la consistencia en un 40%.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Intervención Temprana</h4>
                <p className="text-sm text-slate-600">Responde a las alertas críticas dentro de 24 horas para mejores resultados.</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Consistencia es Clave</h4>
                <p className="text-sm text-slate-600">Envía tus reportes semanales el mismo día para crear un hábito exitoso.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Metas Específicas</h4>
                <p className="text-sm text-slate-600">Define objetivos medibles y con fecha límite para mejor progreso.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-2">Usa la IA Tutora</h4>
                <p className="text-sm text-slate-600">Practica regularmente con ejercicios adaptativos para reforzar tu aprendizaje.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente interno para Pendientes Semanales
function PendientesSemanales({ stats }: { stats?: any }) {
  const [weeklyPendingTasks, setWeeklyPendingTasks] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [canSubmitReport, setCanSubmitReport] = useState(false)

  useEffect(() => {
    loadPendingTasks()
  }, [])

  const loadPendingTasks = async () => {
    try {
      // Verificar si puede enviar reporte semanal
      const reportResponse = await fetch('/api/weekly-reports')
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setCanSubmitReport(reportData.canSubmitThisWeek)
      }

      // Cargar eventos próximos del calendario
      const eventsResponse = await fetch('/api/ai-calendar/upcoming-events')
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        // Filtrar eventos de los próximos 7 días
        const nextWeekEvents = eventsData.filter((event: any) => {
          const eventDate = new Date(event.date)
          const nextWeek = new Date()
          nextWeek.setDate(nextWeek.getDate() + 7)
          return eventDate <= nextWeek
        })
        setCalendarEvents(nextWeekEvents.slice(0, 3)) // Mostrar solo los próximos 3
      }
    } catch (error) {
      console.error('Error loading pending tasks:', error)
    }
  }

  const pendingTasks = []
  
  // Agregar reporte semanal si está pendiente
  if (canSubmitReport) {
    pendingTasks.push({
      id: 'weekly-report',
      title: 'Reporte Semanal',
      description: `Completa tu reporte semanal. Vence el ${stats?.nextReportDue || 'próximo lunes'}.`,
      type: 'report',
      urgent: true
    })
  }

  // Agregar eventos del calendario
  calendarEvents.forEach((event, index) => {
    pendingTasks.push({
      id: `calendar-${index}`,
      title: event.title,
      description: `${event.date} - ${event.time}${event.location ? ` en ${event.location}` : ''}`,
      type: 'calendar',
      urgent: false
    })
  })

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              📋 Pendientes Semanales
            </h3>
            <p className="text-slate-600">
              Tareas y eventos próximos que requieren tu atención
            </p>
          </div>
        </div>

        {pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-4 rounded-xl border ${
                  task.urgent
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  task.type === 'report'
                    ? 'bg-teal-100'
                    : 'bg-blue-100'
                }`}>
                  {task.type === 'report' ? (
                    <FileText className={`h-5 w-5 ${
                      task.urgent ? 'text-red-600' : 'text-teal-600'
                    }`} />
                  ) : (
                    <Calendar className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{task.title}</h4>
                  <p className="text-sm text-slate-600">{task.description}</p>
                </div>
                {task.urgent && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-slate-900 mb-1">
              ¡Todo al día! 🎉
            </h4>
            <p className="text-sm text-slate-600">
              No tienes tareas pendientes para esta semana
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-amber-200">
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
            📝 Ir a Reportes
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            📅 Ver Calendario
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            🤖 Hablar con IA
          </button>
        </div>
      </div>
    </div>
  )
}