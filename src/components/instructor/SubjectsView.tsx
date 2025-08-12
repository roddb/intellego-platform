"use client"

interface Subject {
  subject: string
}

interface SubjectsViewProps {
  subjects: string[]
  onSelectSubject: (subject: string) => void
  isLoading: boolean
}

export default function SubjectsView({ subjects, onSelectSubject, isLoading }: SubjectsViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando materias...</span>
      </div>
    )
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">Sin materias disponibles</h3>
        <p className="text-slate-600">No hay materias registradas aún.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Materias Disponibles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, index) => (
          <button
            key={index}
            onClick={() => onSelectSubject(subject)}
            className="p-6 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-800 group-hover:text-teal-700">
                {subject}
              </h3>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-sm text-slate-600">Ver años académicos disponibles</p>
          </button>
        ))}
      </div>
    </div>
  )
}