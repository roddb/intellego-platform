"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Navigation from "@/components/Navigation"
import InstructorAnalytics from "@/components/InstructorAnalytics"
import SimpleChat from "@/components/SimpleChat"
import ReminderManager from "@/components/ReminderManager"
import PredictiveAnalytics from "@/components/PredictiveAnalytics"
import { LayoutProvider, useLayout } from "@/components/layout/LayoutProvider"
import Sidebar from "@/components/layout/Sidebar"
import WelcomeDashboard from "@/components/layout/WelcomeDashboard"
import ModuleContainer from "@/components/layout/ModuleContainer"

interface StudentSummary {
  student: {
    id: string
    name: string
    email: string
    studentId: string
    status: string
  }
  weeklyStatus: Array<{
    weekNumber: number
    weekStart: Date
    weekEnd: Date
    hasSubmitted: boolean
    report: any
    submittedAt: Date | null
  }>
  summary: {
    submittedCount: number
    totalWeeks: number
    completionRate: number
    lastSubmission: number | null
  }
}

interface InstructorData {
  students: StudentSummary[]
  statistics: {
    totalStudents: number
    studentsWithReports: number
    totalReportsThisMonth: number
    avgCompletionRate: number
    totalWeeks: number
  }
  monthWeeks: Array<{ start: Date; end: Date }>
  monthName: string
  year: number
  month: number
}

function InstructorDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activeModule } = useLayout()
  const [data, setData] = useState<InstructorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<any>(null)

  const fetchInstructorData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/instructor/reports?year=${currentYear}&month=${currentMonth}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching instructor data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentYear, currentMonth])

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "INSTRUCTOR") {
      router.push("/dashboard/student")
      return
    }

    fetchInstructorData()
  }, [session, status, router, currentYear, currentMonth, fetchInstructorData])

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedStudents.size === data?.students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(data?.students.map(s => s.student.id) || []))
    }
  }

  const downloadReports = async (format: 'markdown' | 'csv') => {
    if (selectedStudents.size === 0) return
    
    try {
      const studentIds = Array.from(selectedStudents).join(',')
      const response = await fetch(`/api/instructor/download?year=${currentYear}&month=${currentMonth}&format=${format}&students=${studentIds}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `reporte.${format}`
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error downloading reports')
      }
    } catch (error) {
      console.error('Error downloading reports:', error)
    }
  }

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId)
  }

  const viewReport = (report: any) => {
    setSelectedReport(report)
  }

  const closeReportModal = () => {
    setSelectedReport(null)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "INSTRUCTOR") {
    return null
  }

  const renderModule = () => {
    if (isLoading) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        </div>
      )
    }

    switch (activeModule) {
      case 'welcome':
        return <WelcomeDashboard />
      
      case 'analytics':
        return (
          <ModuleContainer title="Analytics Avanzado" description="Gráficos y métricas detalladas de progreso">
            <InstructorAnalytics />
          </ModuleContainer>
        )
      
      case 'reminders':
        return (
          <ModuleContainer title="Gestión de Recordatorios" description="Sistema de emails automáticos y notificaciones">
            <ReminderManager />
          </ModuleContainer>
        )
      
      case 'predictive':
        return (
          <ModuleContainer title="Análisis Predictivo" description="IA para detectar riesgos tempranos y patrones">
            <PredictiveAnalytics />
          </ModuleContainer>
        )
      
      case 'students':
        return (
          <ModuleContainer title="Gestión de Estudiantes" description="Lista y reportes detallados de estudiantes">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total Estudiantes</p>
                      <p className="text-2xl font-semibold text-slate-700">{data?.statistics.totalStudents || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Reportes Este Mes</p>
                      <p className="text-2xl font-semibold text-slate-700">{data?.statistics.totalReportsThisMonth || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Con Reportes</p>
                      <p className="text-2xl font-semibold text-slate-700">{data?.statistics.studentsWithReports || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Promedio</p>
                      <p className="text-2xl font-semibold text-slate-700">{data?.statistics.avgCompletionRate || 0}%</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Student list would go here - simplified for now */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lista de Estudiantes</h3>
                <p className="text-slate-600">
                  Contenido detallado de gestión de estudiantes se mostraría aquí.
                  Esta funcionalidad incluiría la lista completa, filtros, y reportes individuales.
                </p>
              </div>
            </div>
          </ModuleContainer>
        )
      
      case 'chat':
        return (
          <ModuleContainer title="Centro de Comunicación" description="Chat y comunicación con estudiantes">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <SimpleChat compact={false} />
            </div>
          </ModuleContainer>
        )
      
      default:
        return <WelcomeDashboard />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="px-6 py-8">
        {renderModule()}
      </main>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Report Modal - Keep existing functionality */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Reporte Detallado - {selectedReport.student?.name}
              </h3>
              <p className="text-slate-600">
                Semana del {new Date(selectedReport.submittedAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Report content would be displayed here */}
              <p className="text-slate-600">Contenido del reporte...</p>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  console.log('Export individual report:', selectedReport)
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InstructorDashboard() {
  return (
    <LayoutProvider>
      <InstructorDashboardContent />
    </LayoutProvider>
  )
}