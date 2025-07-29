'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Download, Eye, FileText, ChevronDown, ChevronUp, Clock, CheckCircle } from 'lucide-react'

interface WeeklyReport {
  id: string
  userId: string
  weekStart: Date
  weekEnd: Date
  submittedAt: Date
  responses: {
    temasYDominio: string
    evidenciaAprendizaje: string
    dificultadesEstrategias: string
    conexionesAplicacion: string
    comentariosAdicionales?: string
  }
  attachments?: Array<{
    filename: string
    originalName: string
    size: number
    type: string
    url: string
  }>
}

interface ReportHistoryProps {
  userId: string
}

export default function ReportHistory({ userId }: ReportHistoryProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'weekStart'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null)

  useEffect(() => {
    loadReportHistory()
  }, [userId])

  const loadReportHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/reports-history?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error loading report history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedReports = reports
    .filter(report => {
      const matchesSearch = searchTerm === '' || 
        Object.values(report.responses).some(response => 
          response?.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const reportDate = new Date(report.submittedAt)
      const matchesMonth = selectedMonth === '' || 
        (reportDate.getMonth() + 1).toString() === selectedMonth
      
      const matchesYear = selectedYear === '' || 
        reportDate.getFullYear().toString() === selectedYear

      return matchesSearch && matchesMonth && matchesYear
    })
    .sort((a, b) => {
      const dateA = sortBy === 'date' ? new Date(a.submittedAt) : new Date(a.weekStart)
      const dateB = sortBy === 'date' ? new Date(b.submittedAt) : new Date(b.weekStart)
      
      if (sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime()
      } else {
        return dateA.getTime() - dateB.getTime()
      }
    })

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId)
  }

  const viewReportDetails = (report: WeeklyReport) => {
    setSelectedReport(report)
  }

  const closeReportModal = () => {
    setSelectedReport(null)
  }

  const downloadReport = async (report: WeeklyReport, format: 'pdf' | 'markdown') => {
    try {
      const response = await fetch(`/api/student/download-report?reportId=${report.id}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `reporte-${new Date(report.weekStart).toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const getUniqueYears = () => {
    const years = reports.map(report => new Date(report.submittedAt).getFullYear())
    return [...new Set(years)].sort((a, b) => b - a)
  }

  const getUniqueMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: (i + 1).toString(),
      label: new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar en reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Todos los meses</option>
                {getUniqueMonths().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Todos los años</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'weekStart')}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="date">Fecha de envío</option>
              <option value="weekStart">Semana del reporte</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
              <p className="text-sm text-slate-600">Total de reportes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{filteredAndSortedReports.length}</p>
              <p className="text-sm text-slate-600">Reportes filtrados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {reports.length > 0 
                  ? Math.ceil((Date.now() - new Date(reports[reports.length - 1].submittedAt).getTime()) / (1000 * 60 * 60 * 24 * 7))
                  : 0
                }
              </p>
              <p className="text-sm text-slate-600">Semanas activo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Reportes */}
      <div className="space-y-4">
        {filteredAndSortedReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron reportes</h3>
            <p className="text-slate-600">
              {reports.length === 0 
                ? 'Aún no has enviado ningún reporte semanal.'
                : 'No hay reportes que coincidan con los filtros seleccionados.'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Semana del {new Date(report.weekStart).toLocaleDateString()} al {new Date(report.weekEnd).toLocaleDateString()}
                      </h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Enviado
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Enviado el {new Date(report.submittedAt).toLocaleDateString()} a las {new Date(report.submittedAt).toLocaleTimeString()}</span>
                      </div>
                      {report.attachments && report.attachments.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{report.attachments.length} archivo(s) adjunto(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewReportDetails(report)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </button>
                    
                    <button
                      onClick={() => downloadReport(report, 'markdown')}
                      className="flex items-center space-x-1 px-3 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar</span>
                    </button>

                    <button
                      onClick={() => toggleReportExpansion(report.id)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {expandedReport === report.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Preview expandible */}
                {expandedReport === report.id && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Temas y Dominio</h4>
                        <p className="text-slate-700 text-sm line-clamp-3">{report.responses.temasYDominio}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Evidencia de Aprendizaje</h4>
                        <p className="text-slate-700 text-sm line-clamp-3">{report.responses.evidenciaAprendizaje}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles del Reporte */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Reporte Detallado
                  </h3>
                  <p className="text-slate-600">
                    Semana del {new Date(selectedReport.weekStart).toLocaleDateString()} al {new Date(selectedReport.weekEnd).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={closeReportModal}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información de envío */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-900 mb-2">Información de Envío</h4>
                <p className="text-sm text-slate-600">
                  Enviado el {new Date(selectedReport.submittedAt).toLocaleDateString()} a las {new Date(selectedReport.submittedAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Respuestas */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">1. Temas y Dominio</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.responses.temasYDominio}</p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">2. Evidencia de Aprendizaje</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.responses.evidenciaAprendizaje}</p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">3. Dificultades y Estrategias</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.responses.dificultadesEstrategias}</p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">4. Conexiones y Aplicación</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.responses.conexionesAplicacion}</p>
                </div>

                {selectedReport.responses.comentariosAdicionales && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">5. Comentarios Adicionales</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedReport.responses.comentariosAdicionales}</p>
                  </div>
                )}
              </div>

              {/* Archivos adjuntos */}
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Archivos Adjuntos</h4>
                  <div className="space-y-2">
                    {selectedReport.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{file.originalName}</p>
                            <p className="text-sm text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button 
                onClick={closeReportModal}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => downloadReport(selectedReport, 'markdown')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Descargar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}