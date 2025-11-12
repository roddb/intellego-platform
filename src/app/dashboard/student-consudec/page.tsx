"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import Sidebar from "@/components/student/Sidebar"
import ResourcesPanel from "@/components/student-consudec/ResourcesPanel"
import ActivitiesList from "@/components/consudec/ActivitiesList"
import { useChunkErrorHandler } from "@/components/ErrorBoundary"
import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ConsudecActivity } from "@/types/consudec-activity"

export default function ConsudecStudentDashboard() {
  useChunkErrorHandler()

  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'projects' | 'profile' | 'history' | 'progress' | 'evaluations' | 'feedbacks' | 'resources'>('projects')
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

    setIsLoading(false)
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
          <ActivitiesList
            onActivityClick={(activity) => {
              router.push(`/dashboard/student-consudec/activities/${activity.id}`)
            }}
          />
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
