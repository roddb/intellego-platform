"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"

// FASE 5: Enhanced interfaces for AI feedback integration
interface InstructorReportWithFeedback {
  id: string
  user: {
    name: string
    email: string
    studentId: string
  }
  weekStart: string
  weekEnd: string
  submittedAt: string
  subject: string
  feedbackStatus: 'ai_generated' | 'under_review' | 'approved' | 'sent' | 'pending_generation'
  progressScore?: number
  hasAiFeedback: boolean
  requiresReview: boolean
  answers: { [questionId: string]: string }
  feedback?: {
    content?: string
    evaluationResults?: any[]
    progressScore?: number
    instructorReviewed?: boolean
    reviewedAt?: string
    reviewedBy?: string
    emailSent?: boolean
    sentAt?: string
    generatedAt?: string
    instructorNotes?: string
  }
}

interface FeedbackReviewData {
  reportId: string
  student: {
    name: string
    email: string
    studentId: string
  }
  academic: {
    sede: string
    academicYear: string
    division: string
    subject: string
  }
  week: {
    start: string
    end: string
  }
  submittedAt: string
  answers: { [questionId: string]: string }
  feedback?: any
}

interface ReportsSummary {
  total: number
  pendingGeneration: number
  aiGenerated: number
  underReview: number
  approved: number
  sent: number
  requiresReview: number
}

export default function InstructorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<InstructorReportWithFeedback[]>([])
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<InstructorReportWithFeedback | null>(null)
  const [feedbackReviewData, setFeedbackReviewData] = useState<FeedbackReviewData | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<string | null>(null)
  const [feedbackFilterStatus, setFeedbackFilterStatus] = useState<string>('all')
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null)
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false)

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
      console.log('📊 Fetching enhanced instructor reports...')
      const response = await fetch("/api/instructor/reports-with-feedback", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        setReportsSummary(data.summary || null)
        console.log('✅ Enhanced reports loaded:', data.summary)
      } else {
        console.error('Failed to fetch reports:', response.status)
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // FASE 5: Enhanced functionality for AI feedback workflow
  const generateAIFeedback = async (reportId: string) => {
    setIsGeneratingFeedback(reportId)
    try {
      console.log('🤖 Generating AI feedback for report:', reportId)
      const response = await fetch(`/api/instructor/generate-feedback/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ AI feedback generated successfully')
        // Refresh reports to show updated status
        await fetchReports()
        alert('Feedback generado exitosamente')
      } else {
        console.error('Failed to generate feedback:', result)
        alert(result.message || 'Error generando feedback')
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error)
      alert('Error generando feedback')
    } finally {
      setIsGeneratingFeedback(null)
    }
  }
  
  const loadFeedbackForReview = async (reportId: string) => {
    try {
      console.log('📋 Loading feedback for review:', reportId)
      const response = await fetch(`/api/instructor/feedback/${reportId}`)
      
      if (response.ok) {
        const feedbackData = await response.json()
        setFeedbackReviewData(feedbackData)
        setShowFeedbackPanel(true)
        console.log('✅ Feedback data loaded for review')
      } else {
        console.error('Failed to load feedback data')
        alert('Error cargando datos de feedback')
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
      alert('Error cargando feedback')
    }
  }
  
  const updateFeedbackStatus = async (reportId: string, action: string, data?: any) => {
    try {
      console.log(`🔄 Updating feedback status: ${action}`, reportId)
      const response = await fetch(`/api/instructor/feedback/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, ...data })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Feedback status updated successfully')
        // Refresh reports and close panel if needed
        await fetchReports()
        if (action === 'approve' || action === 'mark_sent') {
          setShowFeedbackPanel(false)
          setFeedbackReviewData(null)
        }
        alert(result.message || 'Estado actualizado exitosamente')
      } else {
        console.error('Failed to update feedback:', result)
        alert(result.message || 'Error actualizando estado')
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
      alert('Error actualizando estado')
    }
  }

  // FASE 6: Email sending functionality
  const sendFeedbackEmail = async (reportId: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    setIsSendingEmail(reportId)
    try {
      console.log('📧 Sending feedback email for report:', reportId)
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId,
          priority
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ Feedback email sent successfully')
        alert(`Email enviado exitosamente: ${result.message}`)
        await fetchReports() // Refresh to show updated status
      } else {
        console.error('Failed to send email:', result)
        const errorMsg = result.message || result.error || 'Error enviando email'
        if (response.status === 503 && result.message?.includes('reintentará')) {
          alert(`${errorMsg}\nEl email se procesará automáticamente en segundo plano.`)
        } else {
          alert(`Error: ${errorMsg}`)
        }
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error enviando email. Intente nuevamente más tarde.')
    } finally {
      setIsSendingEmail(null)
    }
  }

  const sendBulkFeedbackEmails = async () => {
    const approvedReports = reports.filter(r => r.feedbackStatus === 'approved')
    
    if (approvedReports.length === 0) {
      alert('No hay reportes aprobados para enviar')
      return
    }

    const confirmSend = confirm(
      `¿Está seguro de enviar emails a ${approvedReports.length} estudiantes?\n\n` +
      `Estudiantes: ${approvedReports.slice(0, 3).map(r => r.user.name).join(', ')}` +
      (approvedReports.length > 3 ? ` y ${approvedReports.length - 3} más...` : '')
    )

    if (!confirmSend) return

    setSendingBulkEmail(true)
    try {
      console.log('📧 Sending bulk feedback emails for', approvedReports.length, 'reports')
      const response = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportIds: approvedReports.map(r => r.id),
          priority: 'medium'
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Bulk email operation completed')
        const { totalSent, totalFailed, totalRequested } = result
        
        let message = `Envío masivo completado:\n`
        message += `• ${totalSent} emails enviados exitosamente\n`
        if (totalFailed > 0) {
          message += `• ${totalFailed} emails fallaron (se reintentarán automáticamente)\n`
        }
        message += `• Total procesados: ${totalRequested}`
        
        alert(message)
        await fetchReports() // Refresh to show updated statuses
      } else {
        console.error('Bulk email failed:', result)
        alert(`Error en envío masivo: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error('Error in bulk email:', error)
      alert('Error enviando emails masivos. Intente nuevamente más tarde.')
    } finally {
      setSendingBulkEmail(false)
    }
  }

  const viewEmailStatus = async (reportId: string) => {
    try {
      console.log('📊 Checking email status for report:', reportId)
      const response = await fetch(`/api/email/status?reportId=${reportId}`)
      
      if (response.ok) {
        const result = await response.json()
        const { deliveryRecords } = result
        
        if (deliveryRecords.length === 0) {
          alert('No se encontraron registros de entrega para este reporte.')
          return
        }

        const latest = deliveryRecords[0]
        let statusMessage = `Estado de entrega para ${latest.recipientName}:\n\n`
        statusMessage += `Email: ${latest.recipientEmail}\n`
        statusMessage += `Estado: ${latest.status}\n`
        statusMessage += `Creado: ${new Date(latest.createdAt).toLocaleString()}\n`
        
        if (latest.sentAt) {
          statusMessage += `Enviado: ${new Date(latest.sentAt).toLocaleString()}\n`
        }
        if (latest.failureReason) {
          statusMessage += `Error: ${latest.failureReason}\n`
        }
        if (latest.retryCount > 0) {
          statusMessage += `Intentos: ${latest.retryCount}/${latest.maxRetries}\n`
        }

        alert(statusMessage)
      } else {
        alert('Error consultando estado de entrega')
      }
    } catch (error) {
      console.error('Error checking email status:', error)
      alert('Error consultando estado de entrega')
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
  
  // Filter reports based on feedback status
  const getFilteredReports = () => {
    if (feedbackFilterStatus === 'all') return reports
    return reports.filter(report => {
      switch (feedbackFilterStatus) {
        case 'needs_generation':
          return report.feedbackStatus === 'pending_generation'
        case 'needs_review':
          return report.requiresReview || report.feedbackStatus === 'under_review'
        case 'ready_to_send':
          return report.feedbackStatus === 'approved'
        case 'sent':
          return report.feedbackStatus === 'sent'
        default:
          return true
      }
    })
  }
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_generation':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'ai_generated':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'sent':
        return 'bg-teal-100 text-teal-700 border-teal-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_generation':
        return 'Pendiente IA'
      case 'ai_generated':
        return 'IA Generado'
      case 'under_review':
        return 'En Revisión'
      case 'approved':
        return 'Aprobado'
      case 'sent':
        return 'Enviado'
      default:
        return 'Desconocido'
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
        {/* FASE 5: Enhanced header with summary statistics */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard del Instructor
          </h1>
          <p className="text-slate-600 mb-4">
            Bienvenido, {session?.user?.name}
          </p>
          
          {/* Summary Cards */}
          {reportsSummary && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">{reportsSummary.total}</div>
                <div className="text-sm text-slate-600">Total Reportes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-700">{reportsSummary.pendingGeneration}</div>
                <div className="text-sm text-gray-600">Sin IA</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{reportsSummary.underReview}</div>
                <div className="text-sm text-yellow-600">En Revisión</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{reportsSummary.approved}</div>
                <div className="text-sm text-green-600">Aprobados</div>
              </div>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <div className="text-2xl font-bold text-teal-700">{reportsSummary.sent}</div>
                <div className="text-sm text-teal-600">Enviados</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-red-700">{reportsSummary.requiresReview}</div>
                <div className="text-sm text-red-600">Requieren Atención</div>
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-8 ${showFeedbackPanel ? 'lg:grid-cols-3' : 'lg:grid-cols-3'}`}>
          {/* Reports List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {/* FASE 5: Enhanced controls with filtering */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Reportes Semanales ({getFilteredReports().length})
                </h2>
                {feedbackFilterStatus !== 'all' && (
                  <p className="text-sm text-slate-500 mt-1">
                    Filtrado por: {feedbackFilterStatus === 'needs_generation' ? 'Necesitan IA' : 
                                  feedbackFilterStatus === 'needs_review' ? 'Necesitan Revisión' :
                                  feedbackFilterStatus === 'ready_to_send' ? 'Listos para Enviar' : 'Enviados'}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Filter Dropdown */}
                <select 
                  value={feedbackFilterStatus}
                  onChange={(e) => setFeedbackFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50 transition-colors"
                >
                  <option value="all">Todos los Reportes</option>
                  <option value="needs_generation">Necesitan IA</option>
                  <option value="needs_review">Necesitan Revisión</option>
                  <option value="ready_to_send">Listos para Enviar</option>
                  <option value="sent">Enviados</option>
                </select>
                
                {/* FASE 6: Bulk Email Button */}
                <button
                  onClick={sendBulkFeedbackEmails}
                  disabled={sendingBulkEmail || reports.filter(r => r.feedbackStatus === 'approved').length === 0}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${
                    sendingBulkEmail 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : reports.filter(r => r.feedbackStatus === 'approved').length > 0
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  title={`Enviar emails a ${reports.filter(r => r.feedbackStatus === 'approved').length} estudiantes con feedback aprobado`}
                >
                  {sendingBulkEmail ? (
                    <>
                      <span className="inline-block animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-2"></span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      📧 Enviar Todos ({reports.filter(r => r.feedbackStatus === 'approved').length})
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => downloadReports('csv')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={() => downloadReports('markdown')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  MD
                </button>
              </div>
            </div>
            
            {getFilteredReports().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  {feedbackFilterStatus === 'all' ? 'Sin reportes aún' : 'No hay reportes con este filtro'}
                </h3>
                <p className="text-slate-600">
                  {feedbackFilterStatus === 'all' 
                    ? 'Los reportes semanales de los estudiantes aparecerán aquí.' 
                    : 'Cambia el filtro para ver reportes con diferentes estados.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredReports().map((report) => (
                  <div 
                    key={report.id} 
                    className={`border border-slate-200 rounded-lg p-4 transition-colors ${
                      selectedReport?.id === report.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* FASE 5: Enhanced report card with feedback status and actions */}
                    <div className="flex justify-between items-start mb-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      >
                        <h3 className="font-medium text-slate-800">
                          {report.user.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {report.user.studentId} • {report.user.email}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {report.subject} • Semana del {new Date(report.weekStart).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-2">
                          Enviado: {new Date(report.submittedAt).toLocaleDateString()}
                        </p>
                        
                        {/* Feedback Status Badge */}
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                          getStatusBadgeColor(report.feedbackStatus)
                        }`}>
                          {getStatusText(report.feedbackStatus)}
                        </span>
                        
                        {/* Progress Score */}
                        {report.progressScore !== undefined && (
                          <div className="mt-2 text-xs">
                            <span className={`font-medium ${
                              report.progressScore >= 3.5 ? 'text-green-600' :
                              report.progressScore >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              Score: {report.progressScore.toFixed(1)}/4.0
                            </span>
                          </div>
                        )}
                        
                        {/* Attention Flag */}
                        {report.requiresReview && (
                          <div className="mt-1">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full" title="Requiere atención"></span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      {report.feedbackStatus === 'pending_generation' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateAIFeedback(report.id)
                          }}
                          disabled={isGeneratingFeedback === report.id}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isGeneratingFeedback === report.id ? 'Generando...' : '🤖 Generar IA'}
                        </button>
                      )}
                      
                      {(report.feedbackStatus === 'ai_generated' || report.feedbackStatus === 'under_review') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadFeedbackForReview(report.id)
                          }}
                          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          👁️ Revisar
                        </button>
                      )}
                      
                      {report.feedbackStatus === 'approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            sendFeedbackEmail(report.id, 'medium')
                          }}
                          disabled={isSendingEmail === report.id}
                          className={`px-3 py-1 text-xs text-white rounded-md transition-colors ${
                            isSendingEmail === report.id
                              ? 'bg-green-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {isSendingEmail === report.id ? (
                            <>
                              <span className="inline-block animate-spin w-2 h-2 border border-white border-t-transparent rounded-full mr-1"></span>
                              Enviando...
                            </>
                          ) : (
                            '📧 Enviar Email'
                          )}
                        </button>
                      )}
                      
                      {report.feedbackStatus === 'sent' && (
                        <>
                          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                            ✅ Enviado {report.feedback?.sentAt && `el ${new Date(report.feedback.sentAt).toLocaleDateString()}`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              viewEmailStatus(report.id)
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            title="Ver estado de entrega"
                          >
                            📊
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`¿Reenviar email a ${report.user.name}?`)) {
                                sendFeedbackEmail(report.id, 'high')
                              }
                            }}
                            disabled={isSendingEmail === report.id}
                            className="px-2 py-1 text-xs border border-orange-300 text-orange-600 rounded-md hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reenviar email"
                          >
                            {isSendingEmail === report.id ? '⏳' : '🔄'}
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedReport(report)
                        }}
                        className="px-3 py-1 text-xs border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        📄 Ver Detalles
                      </button>
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
                  {Object.entries(selectedReport.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="border-l-4 border-teal-200 pl-4">
                      <h4 className="font-medium text-slate-800 text-sm mb-2">
                        Pregunta {questionId}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {answer}
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