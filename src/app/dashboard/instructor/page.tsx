"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"

interface WeeklyReport {
  id: string
  user: {
    name: string
    email: string
    studentId: string
  }
  weekStart: Date
  weekEnd: Date
  submittedAt: Date
  answers: Array<{
    question: {
      text: string
    }
    answer: string
  }>
}

export default function InstructorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "INSTRUCTOR") {
      router.push("/dashboard/student")
      return
    }

    fetchReports()
  }, [session, status, router])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/instructor/reports", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadReports = async (format: 'csv' | 'markdown') => {
    try {
      const response = await fetch(`/api/instructor/download?format=${format}`, {
        method: "GET",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `reportes-semanales.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading reports:", error)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard del Instructor
          </h1>
          <p className="text-slate-600">
            Bienvenido, {session?.user?.name}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Reports List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Reportes Semanales ({reports.length})
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReports('csv')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  Descargar CSV
                </button>
                <button
                  onClick={() => downloadReports('markdown')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Descargar MD
                </button>
              </div>
            </div>
            
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Sin reportes aún
                </h3>
                <p className="text-slate-600">
                  Los reportes semanales de los estudiantes aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div 
                    key={report.id} 
                    className={`border border-slate-200 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedReport?.id === report.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {report.user.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {report.user.studentId} • {report.user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          Semana del {new Date(report.weekStart).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Enviado: {new Date(report.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Detalles del Reporte
            </h2>
            
            {!selectedReport ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">
                  Selecciona un reporte para ver los detalles
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-800 mb-2">
                    {selectedReport.user.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {selectedReport.user.studentId} • {selectedReport.user.email}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Semana: {new Date(selectedReport.weekStart).toLocaleDateString()} - {new Date(selectedReport.weekEnd).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {selectedReport.answers.map((answer, index) => (
                    <div key={index} className="border-l-4 border-teal-200 pl-4">
                      <h4 className="font-medium text-slate-800 text-sm mb-2">
                        {answer.question.text}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {answer.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}