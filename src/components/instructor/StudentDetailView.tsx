"use client"

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  sede?: string
  academicYear?: string
  division?: string
  subjects?: string
}

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

interface StudentDetailViewProps {
  student: Student
  reports: Report[]
  onBack: () => void
  onSelectWeeklyReport: (report: Report) => void
  isLoading: boolean
}

export default function StudentDetailView({ 
  student, 
  reports, 
  onBack, 
  onSelectWeeklyReport, 
  isLoading 
}: StudentDetailViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando reportes del estudiante...</span>
      </div>
    )
  }

  // Group reports by subject and then by week
  const reportsBySubject = reports.reduce((acc, report) => {
    if (!acc[report.subject]) {
      acc[report.subject] = []
    }
    acc[report.subject].push(report)
    return acc
  }, {} as { [subject: string]: Report[] })

  // Sort reports by date (most recent first)
  Object.keys(reportsBySubject).forEach(subject => {
    reportsBySubject[subject].sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    )
  })

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-800 mr-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-800">Reportes del Estudiante</h2>
          <p className="text-sm text-slate-600">{student.name} ({student.studentId})</p>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-700 font-medium text-lg">
              {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">{student.name}</h3>
            <p className="text-sm text-slate-600">{student.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>ID: {student.studentId}</span>
              {student.sede && <span>Sede: {student.sede}</span>}
              {student.academicYear && <span>Año: {student.academicYear}</span>}
              {student.division && <span>Curso: {student.division}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal-600">{reports.length}</div>
            <div className="text-sm text-slate-600">Reportes</div>
          </div>
        </div>
      </div>

      {/* Reports by Subject */}
      {Object.keys(reportsBySubject).length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sin reportes disponibles</h3>
          <p className="text-slate-600">Este estudiante aún no ha enviado ningún reporte semanal.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(reportsBySubject).map(([subject, subjectReports]) => (
            <div key={subject} className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {subject}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({subjectReports.length} reportes)
                </span>
              </h3>
              
              <div className="space-y-3">
                {subjectReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => onSelectWeeklyReport(report)}
                    className="w-full p-4 border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 group-hover:text-teal-700">
                          Semana del {formatWeekRange(report.weekStart, report.weekEnd)}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Enviado el {new Date(report.submittedAt).toLocaleDateString()} a las{' '}
                          {new Date(report.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                          {Object.keys(report.answers).length} respuestas
                        </span>
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}