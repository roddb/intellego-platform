'use client'

import { useState } from 'react'
import { CalendarIcon, BookOpenIcon, PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import StudyPlanner from './StudyPlanner'
import SimulatorEngine from './SimulatorEngine'

interface AcademicDashboardProps {
  userId: string
  className?: string
}

type TabType = 'calendar' | 'planner' | 'simulator' | 'progress'

export default function AcademicDashboard({ userId, className = '' }: AcademicDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('calendar')

  const tabs = [
    {
      id: 'calendar' as TabType,
      title: 'Calendario Académico',
      description: 'Vista de exámenes y eventos',
      icon: CalendarIcon,
      color: 'text-teal-600 border-teal-500'
    },
    {
      id: 'planner' as TabType,
      title: 'Planificador IA',
      description: 'Genera planes de estudio inteligentes',
      icon: BookOpenIcon,
      color: 'text-blue-600 border-blue-500'
    },
    {
      id: 'simulator' as TabType,
      title: 'Simulacros',
      description: 'Evaluaciones progresivas adaptativas',
      icon: PlayIcon,
      color: 'text-purple-600 border-purple-500'
    },
    {
      id: 'progress' as TabType,
      title: 'Mi Progreso',
      description: 'Estadísticas de preparación',
      icon: ChartBarIcon,
      color: 'text-emerald-600 border-emerald-500'
    }
  ]

  const PersonalizedCalendar = () => {
    // Importar datos del estudiante
    const userExams = [
      {
        id: '1',
        title: 'Examen Química Orgánica',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'parcial',
        subject: 'Química',
        readiness: 65
      },
      {
        id: '2',
        title: 'Examen Final Matemáticas',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        type: 'final',
        subject: 'Matemáticas',
        readiness: 80
      },
      {
        id: '3',
        title: 'Examen Parcial Física',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        type: 'parcial',
        subject: 'Física',
        readiness: 45
      }
    ]

    const upcomingSessions = [
      {
        id: '1',
        title: 'Sesión: Reacciones Químicas',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        duration: 90,
        subject: 'Química'
      },
      {
        id: '2',
        title: 'Sesión: Cálculo Integral',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 60,
        subject: 'Matemáticas'
      }
    ]

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date)
    }

    const getReadinessColor = (readiness: number) => {
      if (readiness >= 80) return 'text-green-600 bg-green-100'
      if (readiness >= 60) return 'text-yellow-600 bg-yellow-100'
      return 'text-red-600 bg-red-100'
    }

    const getExamTypeColor = (type: string) => {
      switch (type) {
        case 'final':
          return 'bg-red-500'
        case 'parcial':
          return 'bg-blue-500'
        default:
          return 'bg-gray-500'
      }
    }

    return (
      <div className="space-y-6">
        {/* Header con resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mac-card p-4 text-center">
            <div className="text-2xl font-bold text-teal-600 mb-1">{userExams.length}</div>
            <div className="text-sm text-slate-600">Próximos Exámenes</div>
          </div>
          <div className="mac-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{upcomingSessions.length}</div>
            <div className="text-sm text-slate-600">Sesiones Programadas</div>
          </div>
          <div className="mac-card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {Math.round(userExams.reduce((sum, exam) => sum + exam.readiness, 0) / userExams.length)}%
            </div>
            <div className="text-sm text-slate-600">Preparación Promedio</div>
          </div>
        </div>

        {/* Próximos Exámenes */}
        <div className="mac-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
            Próximos Exámenes
          </h3>
          <div className="space-y-4">
            {userExams.map((exam) => (
              <div key={exam.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{exam.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{formatDate(exam.date)}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`w-3 h-3 rounded-full ${getExamTypeColor(exam.type)}`} />
                      <span className="text-sm text-slate-700 capitalize">{exam.type}</span>
                      <span className="text-sm text-slate-500">•</span>
                      <span className="text-sm text-slate-700">{exam.subject}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadinessColor(exam.readiness)}`}>
                      {exam.readiness}% Listo
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas Sesiones */}
        <div className="mac-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
            Próximas Sesiones de Estudio
          </h3>
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-800">{session.title}</h4>
                  <p className="text-sm text-slate-600">{formatDate(session.date)}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-700">{session.duration} min</div>
                  <div className="text-xs text-slate-500">{session.subject}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('planner')}
            className="mac-card p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <BookOpenIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-800 mb-1">Crear Plan de Estudio</h3>
            <p className="text-sm text-slate-600">Genera un cronograma personalizado con IA</p>
          </button>
          
          <button
            onClick={() => setActiveTab('simulator')}
            className="mac-card p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <PlayIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-medium text-slate-800 mb-1">Simulacro Rápido</h3>
            <p className="text-sm text-slate-600">Evalúa tu conocimiento actual</p>
          </button>
        </div>
      </div>
    )
  }

  const ProgressAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Preparación General */}
        <div className="mac-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Preparación General</h3>
          <div className="space-y-4">
            {['Química Orgánica', 'Matemáticas', 'Física Nuclear'].map((subject, index) => {
              const progress = [65, 80, 45][index]
              return (
                <div key={subject} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-700">{subject}</span>
                    <span className="text-sm text-slate-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress >= 80 ? 'bg-green-500' :
                        progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Estadísticas de Estudio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mac-card p-6">
            <h4 className="font-medium text-slate-800 mb-4">Esta Semana</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Sesiones Completadas</span>
                <span className="text-sm font-medium text-slate-800">8/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Tiempo de Estudio</span>
                <span className="text-sm font-medium text-slate-800">12.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Simulacros</span>
                <span className="text-sm font-medium text-slate-800">3</span>
              </div>
            </div>
          </div>

          <div className="mac-card p-6">
            <h4 className="font-medium text-slate-800 mb-4">Rendimiento</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Efectividad Promedio</span>
                <span className="text-sm font-medium text-green-600">4.2/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Simulacros Promedio</span>
                <span className="text-sm font-medium text-blue-600">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Mejora vs Semana Anterior</span>
                <span className="text-sm font-medium text-emerald-600">+12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones IA */}
        <div className="mac-card p-6">
          <h4 className="font-medium text-slate-800 mb-4">Recomendaciones Personalizadas</h4>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">Enfócate en Física Nuclear</h5>
              <p className="text-sm text-blue-700">Tu nivel de preparación es del 45%. Dedica 2 horas adicionales esta semana a conceptos de radiactividad.</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Excelente progreso en Matemáticas</h5>
              <p className="text-sm text-green-700">Mantén el ritmo actual. Considera hacer simulacros adicionales para consolidar tu conocimiento.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <PersonalizedCalendar />
      case 'planner':
        return <StudyPlanner userId={userId} />
      case 'simulator':
        return <SimulatorEngine userId={userId} />
      case 'progress':
        return <ProgressAnalytics />
      default:
        return <PersonalizedCalendar />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Organizador Inteligente</h1>
          <p className="text-slate-600 mt-1">
            Planificación académica impulsada por IA para maximizar tu éxito
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? `${tab.color} bg-slate-50`
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.title}</span>
                <span className="sm:hidden">{tab.title.split(' ')[0]}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  )
}