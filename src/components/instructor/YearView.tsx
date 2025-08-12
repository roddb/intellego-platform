"use client"

interface YearViewProps {
  subject: string
  years: string[]
  onSelectYear: (year: string) => void
  onBack: () => void
  isLoading: boolean
}

export default function YearView({ subject, years, onSelectYear, onBack, isLoading }: YearViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-slate-600">Cargando años...</span>
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
          <h2 className="text-xl font-semibold text-slate-800">Años Académicos</h2>
          <p className="text-sm text-slate-600">Materia: {subject}</p>
        </div>
      </div>

      {years.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0v13a2 2 0 01-2 2H10a2 2 0 01-2-2V7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Sin años disponibles</h3>
          <p className="text-slate-600">No hay años académicos registrados para esta materia.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => onSelectYear(year)}
              className="p-6 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-800 group-hover:text-teal-700">
                  Año {year}
                </h3>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Ver cursos disponibles</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}