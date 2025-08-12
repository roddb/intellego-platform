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

interface StudentsViewProps {
  subject: string
  year?: string
  course?: string
  students: Student[]
  onSelectStudent: (student: Student) => void
  onBack: () => void
  isLoading: boolean
}

export default function StudentsView({ subject, year, course, students, onSelectStudent, onBack, isLoading }: StudentsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando estudiantes...</span>
      </div>
    )
  }

  const getBreadcrumb = () => {
    let breadcrumb = `Materia: ${subject}`
    if (year) breadcrumb += ` - Año: ${year}`
    if (course) breadcrumb += ` - Curso: ${course}`
    return breadcrumb
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
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Listado de Alumnos</h2>
          <p className="text-sm text-slate-600">{getBreadcrumb()}</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sin estudiantes disponibles</h3>
          <p className="text-slate-600">No hay estudiantes registrados para estos criterios.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 font-medium text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800 group-hover:text-teal-700">
                        {student.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {student.studentId} • {student.email}
                      </p>
                      {student.sede && student.academicYear && student.division && (
                        <p className="text-xs text-slate-500 mt-1">
                          {student.sede} - Año {student.academicYear} - Curso {student.division}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}