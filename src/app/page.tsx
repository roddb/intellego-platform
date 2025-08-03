import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Platform info */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center lg:text-left">
              <div className="w-16 h-16 bg-teal-500 rounded-2xl mx-auto lg:mx-0 mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-semibold text-slate-800 mb-4">
                Intellego Platform
              </h1>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                Plataforma de gestión de progreso estudiantil diseñada para reemplazar Google Forms
              </p>
              
              <div className="space-y-3">
                <Link 
                  href="/auth/signin" 
                  className="w-full block text-center py-3 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                
                <Link 
                  href="/auth/signup" 
                  className="w-full block text-center py-3 px-6 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
            
            {/* Right side - Features showcase */}
            <div className="flex flex-col space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  Características Principales
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Sistema simple y efectivo para el seguimiento del progreso académico estudiantil
                </p>
              </div>
              
              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-6 rounded-lg bg-white shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-teal-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Reportes Semanales</h3>
                  <p className="text-sm text-slate-600">Formularios estructurados para el seguimiento del progreso</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Gestión de Usuarios</h3>
                  <p className="text-sm text-slate-600">Sistema de autenticación para estudiantes e instructores</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Análisis de Datos</h3>
                  <p className="text-sm text-slate-600">Visualización del progreso y exportación de datos</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Interfaz Simple</h3>
                  <p className="text-sm text-slate-600">Diseño limpio y fácil de usar para todos los usuarios</p>
                </div>
              </div>
              
              {/* Call to action */}
              <div className="text-center lg:text-left">
                <p className="text-sm text-slate-600 mb-4">
                  ¿Listo para comenzar a gestionar el progreso estudiantil?
                </p>
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                >
                  Comenzar Ahora
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}