'use client'

import { useState, useEffect } from 'react'
import { X, Download, Eye, Calendar, Users, FileText } from 'lucide-react'

interface ProgressReport {
  id: string
  userId: string
  weekStart: string
  weekEnd: string
  subject: string
  submittedAt: string
  user: {
    name: string
    studentId: string | null
    sede: string | null
    academicYear: string | null
    division: string | null
  }
  answers: Array<{
    questionId: string
    answer: string
  }>
}

interface WeeklyData {
  weekStart: string
  weekEnd: string
  totalReports: number
  reports: ProgressReport[]
}

interface WeeklyDownloadModalProps {
  weekData: WeeklyData
  onClose: () => void
}

export default function WeeklyDownloadModal({ weekData, onClose }: WeeklyDownloadModalProps) {
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<ProgressReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = new Date(weekData.weekStart)
  const end = new Date(weekData.weekEnd)

  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Fetch detailed week data for preview
  const fetchWeekData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/instructor/weekly-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: start.toISOString(),
          weekEnd: end.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPreviewData(data.reports || [])
    } catch (error) {
      console.error('Error fetching week data:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeekData()
  }, [])

  // Download function
  const downloadWeekData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/instructor/download-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: start.toISOString(),
          weekEnd: end.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      // Get the blob and create download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `reportes_semana_${formatDate(start).replace(/\//g, '-')}_a_${formatDate(end).replace(/\//g, '-')}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onClose()
    } catch (error) {
      console.error('Error downloading week data:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al descargar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">
                  Descarga Semanal
                </h2>
                <p className="text-blue-100 text-sm">
                  {formatDate(start)} - {formatDate(end)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Reportes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {previewData ? previewData.length : weekData.totalReports}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Estudiantes Únicos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {previewData ? new Set(previewData.map(r => r.userId)).size : '...'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Período</p>
                  <p className="text-lg font-bold text-purple-600">
                    7 días
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Preview Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Vista Previa de Reportes</span>
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Cargando datos...</span>
                </div>
              </div>
            ) : previewData && previewData.length > 0 ? (
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {previewData.slice(0, 10).map((report) => (
                    <div key={report.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {report.user.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {report.user.studentId} • {report.subject}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(report.submittedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {previewData.length > 10 && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">
                        ... y {previewData.length - 10} reportes más
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron reportes para esta semana</p>
              </div>
            )}
          </div>

          {/* Download Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={downloadWeekData}
              disabled={loading || !previewData || previewData.length === 0}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Preparando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}