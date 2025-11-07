"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import Sidebar from "@/components/student/Sidebar"
import ResourcesPanel from "@/components/student-consudec/ResourcesPanel"
import { useChunkErrorHandler } from "@/components/ErrorBoundary"
import { FolderOpen, FileText, CheckCircle2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface Project {
  id: string
  title: string
  description: string
  status: 'active' | 'submitted' | 'evaluated'
  dueDate?: string
  submittedDate?: string
  feedback?: {
    score: number
    comments: string
  }
}

export default function ConsudecStudentDashboard() {
  useChunkErrorHandler()

  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'projects' | 'profile' | 'history' | 'progress' | 'evaluations' | 'feedbacks' | 'resources'>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Verificar que el usuario sea de CONSUDEC
    const isInstructor = session.user.role === "INSTRUCTOR"
    const isImpersonating = session.user.isImpersonating === true
    const isStudent = session.user.role === "STUDENT"
    const isConsudec = session.user.sede === "CONSUDEC"

    if (!isStudent && (!isInstructor || !isImpersonating)) {
      router.push("/dashboard/instructor")
      return
    }

    // Si no es de CONSUDEC, redirigir al dashboard de secundaria
    // But allow instructors impersonating non-CONSUDEC students to stay
    if (!isConsudec && isStudent) {
      router.push("/dashboard/student")
      return
    }

    fetchProjectsData()
  }, [session, status, router])

  // Handle scroll for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setHeaderVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const fetchProjectsData = async () => {
    try {
      // TODO: Implementar endpoint para proyectos CONSUDEC
      // Por ahora, mock data para visualización
      setProjects([])

    } catch (error) {
      console.error("Error fetching projects data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'evaluated':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'submitted':
        return <FileText className="w-4 h-4" />
      case 'evaluated':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'En Progreso'
      case 'submitted':
        return 'Entregado'
      case 'evaluated':
        return 'Evaluado'
      default:
        return status
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation className={`transition-transform duration-300 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`} />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'progress') {
            router.push('/dashboard/student-consudec/progress')
          } else if (tab === 'evaluations') {
            router.push('/dashboard/student-consudec/evaluations')
          } else {
            setActiveTab(tab as any)
          }
        }}
        userName={session?.user?.name ?? undefined}
        variant="consudec"
      />

      <main className="container mx-auto px-4 py-8 lg:pl-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Portal del Estudiante
          </h1>
          <p className="text-slate-600">
            Bienvenido/a, {session?.user?.name}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            CONSUDEC - Formación Docente
          </p>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Projects Header */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    Trabajos Prácticos
                  </h2>
                  <p className="text-sm text-slate-600">
                    Gestiona tus proyectos y entregas del profesorado
                  </p>
                </div>
                <FolderOpen className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            {/* Projects List */}
            {projects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    No hay proyectos activos
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Los proyectos asignados aparecerán aquí cuando tu instructor los publique.
                  </p>
                  <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    Sistema en configuración inicial
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {project.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    {/* Project Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Project Metadata */}
                    <div className="space-y-2 mb-4">
                      {project.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-4 h-4" />
                          <span>Entrega: {new Date(project.dueDate).toLocaleDateString('es-AR')}</span>
                        </div>
                      )}
                      {project.submittedDate && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Entregado: {new Date(project.submittedDate).toLocaleDateString('es-AR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Project Actions */}
                    <div className="flex gap-2">
                      {project.status === 'active' && (
                        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          Entregar Trabajo
                        </button>
                      )}
                      {project.status === 'submitted' && (
                        <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                          Ver Entrega
                        </button>
                      )}
                      {project.status === 'evaluated' && project.feedback && (
                        <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                          Ver Evaluación ({project.feedback.score}/100)
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Estadísticas
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projects.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-slate-600">En Progreso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {projects.filter(p => p.status === 'submitted').length}
                  </div>
                  <div className="text-sm text-slate-600">Entregados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {projects.filter(p => p.status === 'evaluated').length}
                  </div>
                  <div className="text-sm text-slate-600">Evaluados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Información Personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre Completo
                  </label>
                  <p className="text-slate-900 font-medium">{session?.user?.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-slate-900 font-medium">{session?.user?.email}</p>
                </div>

                {session?.user?.studentId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ID de Estudiante
                    </label>
                    <p className="text-slate-900 font-medium">{session.user.studentId}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Institución
                  </label>
                  <p className="text-slate-900 font-medium">CONSUDEC - Formación Docente</p>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Gestión de Cuenta
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800">Cambiar Contraseña</h3>
                    <p className="text-sm text-slate-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Historial de Entregas
              </h3>
              <p className="text-slate-600">
                El historial de tus trabajos prácticos aparecerá aquí.
              </p>
            </div>
          </div>
        )}

        {/* Feedbacks Tab */}
        {activeTab === 'feedbacks' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Devoluciones
              </h3>
              <p className="text-slate-600">
                Las devoluciones de tus trabajos prácticos aparecerán aquí.
              </p>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <ResourcesPanel userName={session?.user?.name ?? undefined} />
        )}
      </main>
    </div>
  )
}
