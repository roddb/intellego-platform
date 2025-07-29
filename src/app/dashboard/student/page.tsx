"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import WeeklyReportForm from "@/components/WeeklyReportForm"

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [canSubmit, setCanSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [reports, setReports] = useState([])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "STUDENT") {
      router.push("/dashboard/instructor")
      return
    }

    fetchSubmissionStatus()
    fetchReports()
  }, [session, status, router])

  const fetchSubmissionStatus = async () => {
    try {
      const response = await fetch("/api/weekly-reports", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCanSubmit(data.canSubmit)
      }
    } catch (error) {
      console.error("Error checking submission status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/student/download-report", {
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
    }
  }

  const handleSubmissionSuccess = () => {
    setSuccessMessage("¡Reporte enviado exitosamente!")
    setCanSubmit(false)
    fetchReports()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
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
            Dashboard del Estudiante
          </h1>
          <p className="text-slate-600">
            Bienvenido, {session?.user?.name}
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Weekly Report Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Reporte Semanal
            </h2>
            
            {canSubmit ? (
              <WeeklyReportForm onSubmissionSuccess={handleSubmissionSuccess} />
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Reporte ya enviado
                </h3>
                <p className="text-slate-600">
                  Ya has enviado tu reporte para esta semana. Vuelve la próxima semana para enviar un nuevo reporte.
                </p>
              </div>
            )}
          </div>

          {/* Reports History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Historial de Reportes
            </h2>
            
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Sin reportes aún
                </h3>
                <p className="text-slate-600">
                  Cuando envíes tu primer reporte, aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report: any, index: number) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-slate-800">
                        Semana del {new Date(report.weekStart).toLocaleDateString()}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {new Date(report.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Reporte enviado exitosamente
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}