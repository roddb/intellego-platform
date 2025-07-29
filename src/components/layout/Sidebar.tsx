'use client'

import { useSession } from 'next-auth/react'
import { X, TrendingUp, Brain, FileText, Bell, Users, BarChart, User, Calendar } from 'lucide-react'
import { useLayout, ModuleType } from './LayoutProvider'

interface SidebarModule {
  id: ModuleType
  title: string
  description: string
  icon: any
  color: string
  role?: 'STUDENT' | 'INSTRUCTOR' | 'BOTH'
}

const studentModules: SidebarModule[] = [
  {
    id: 'profile',
    title: 'Mi Perfil',
    description: 'Información personal y configuraciones',
    icon: User,
    color: 'bg-slate-100 text-slate-600',
    role: 'STUDENT'
  },
  {
    id: 'ai-tutor',
    title: 'IA Tutora',
    description: 'Ejercicios adaptativos personalizados',
    icon: Brain,
    color: 'bg-blue-100 text-blue-600',
    role: 'STUDENT'
  },
  {
    id: 'study-organizer',
    title: 'Organizador Inteligente',
    description: 'Planificación IA y simulacros adaptativos',
    icon: Calendar,
    color: 'bg-teal-100 text-teal-600',
    role: 'STUDENT'
  },
  {
    id: 'reports',
    title: 'Reportes',
    description: 'Gestión completa de reportes semanales',
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-600',
    role: 'STUDENT'
  }
]

const instructorModules: SidebarModule[] = [
  {
    id: 'analytics',
    title: 'Analytics Avanzado',
    description: 'Gráficos y métricas detalladas',
    icon: BarChart,
    color: 'bg-blue-100 text-blue-600',
    role: 'INSTRUCTOR'
  },
  {
    id: 'reminders',
    title: 'Recordatorios',
    description: 'Gestión de emails automáticos',
    icon: Bell,
    color: 'bg-orange-100 text-orange-600',
    role: 'INSTRUCTOR'
  },
  {
    id: 'predictive',
    title: 'Análisis Predictivo',
    description: 'IA para detectar riesgos tempranos',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
    role: 'INSTRUCTOR'
  },
  {
    id: 'students',
    title: 'Gestión Estudiantes',
    description: 'Lista y reportes de estudiantes',
    icon: Users,
    color: 'bg-green-100 text-green-600',
    role: 'INSTRUCTOR'
  }
]

export default function Sidebar() {
  const { data: session } = useSession()
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useLayout()

  const isInstructor = session?.user?.role === 'INSTRUCTOR'
  const modules = isInstructor ? instructorModules : studentModules

  const handleModuleClick = (moduleId: ModuleType) => {
    setActiveModule(moduleId)
    // No cerramos automáticamente el sidebar para que puedan navegar entre módulos
  }

  const handleBackToWelcome = () => {
    setActiveModule('welcome')
    setSidebarOpen(false)
  }

  if (!sidebarOpen) return null

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isInstructor ? 'Panel Instructor' : 'Panel Estudiante'}
            </h2>
            <p className="text-sm text-slate-600">
              Selecciona un módulo para comenzar
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-3 overflow-y-auto h-full pb-24">
          {/* Welcome Button */}
          <button
            onClick={handleBackToWelcome}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
              activeModule === 'welcome'
                ? 'bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Dashboard Principal</h3>
                <p className="text-sm text-slate-600">Resumen y bienvenida</p>
              </div>
            </div>
          </button>

          {/* Module Buttons */}
          {modules.map((module) => {
            const IconComponent = module.icon
            const isActive = activeModule === module.id

            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-100 border-slate-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${module.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{module.title}</h3>
                    <p className="text-sm text-slate-600">{module.description}</p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-50 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Intellego Platform v2.0
            </p>
            <p className="text-xs text-slate-400">
              {session?.user?.name}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}