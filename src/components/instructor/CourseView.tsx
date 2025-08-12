"use client"

interface CourseViewProps {
  subject: string
  year: string
  courses: string[]
  onSelectCourse: (course: string) => void
  onBack: () => void
  isLoading: boolean
}

export default function CourseView({ subject, year, courses, onSelectCourse, onBack, isLoading }: CourseViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando cursos...</span>
      </div>
    )
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
          <h2 className="text-xl font-semibold text-slate-800">Cursos Disponibles</h2>
          <p className="text-sm text-slate-600">Materia: {subject} - Año: {year}</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sin cursos disponibles</h3>
          <p className="text-slate-600">No hay cursos registrados para este año académico.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <button
              key={course}
              onClick={() => onSelectCourse(course)}
              className="p-6 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-800 group-hover:text-teal-700">
                  Curso {course}
                </h3>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Ver listado de alumnos</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}