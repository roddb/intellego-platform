"use client"

interface Report {
  id: string
  userId: string
  weekStart: string
  weekEnd: string
  subject: string
  submittedAt: string
  userName: string
  userEmail: string
  studentId: string
  sede?: string
  academicYear?: string
  division?: string
  answers: { [questionId: string]: string }
}

interface WeeklyReportViewProps {
  report: Report
  onBack: () => void
  isLoading: boolean
}

// Standard questions for the weekly reports
const QUESTIONS: { [key: string]: string } = {
  "1": "¿Qué has aprendido esta semana?",
  "2": "¿Cuáles fueron tus principales logros?", 
  "3": "¿Qué dificultades encontraste?",
  "4": "¿Cómo las resolviste o qué ayuda necesitas?",
  "5": "¿Qué planeas hacer la próxima semana?"
}

export default function WeeklyReportView({ report, onBack, isLoading }: WeeklyReportViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando reporte...</span>
      </div>
    )
  }

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  const handleDownloadJSON = async () => {
    try {
      const response = await fetch(`/api/instructor/report/${report.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `reporte_${report.studentId}_${report.subject}_${new Date(report.weekStart).toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Error al descargar el reporte')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Error al descargar el reporte')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-800 mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Reporte Semanal</h2>
            <p className="text-sm text-slate-600">
              {report.userName} - {formatWeekRange(report.weekStart, report.weekEnd)}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDownloadJSON}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar JSON
        </button>
      </div>

      {/* Report Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Estudiante</label>
            <p className="text-slate-800">{report.userName}</p>
            <p className="text-sm text-slate-500">{report.studentId}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Materia</label>
            <p className="text-slate-800">{report.subject}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Semana</label>
            <p className="text-slate-800">{formatWeekRange(report.weekStart, report.weekEnd)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Fecha de Envío</label>
            <p className="text-slate-800">
              {new Date(report.submittedAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-500">
              {new Date(report.submittedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {(report.sede || report.academicYear || report.division) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              {report.sede && <span>Sede: {report.sede}</span>}
              {report.academicYear && <span>Año: {report.academicYear}</span>}
              {report.division && <span>Curso: {report.division}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Report Answers */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Respuestas del Reporte</h3>
        
        {Object.keys(report.answers).length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600">No se encontraron respuestas en este reporte</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(report.answers).map(([questionId, answer]) => (
              <div key={questionId} className="border-l-4 border-teal-200 pl-6">
                <h4 className="font-medium text-slate-800 mb-3">
                  {QUESTIONS[questionId] || `Pregunta ${questionId}`}
                </h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {answer || 'Sin respuesta'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Metadata */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">
          Reporte ID: {report.id} | Usuario ID: {report.userId} | 
          Total de respuestas: {Object.keys(report.answers).length}
        </p>
      </div>
    </div>
  )
}