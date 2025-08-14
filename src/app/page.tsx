import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Platform info */}
            <div className="mac-card p-8 text-center lg:text-left login-card-transition">
              <div className="w-16 h-16 bg-gradient-to-br from-silver-tree to-sea-nymph rounded-2xl mx-auto lg:mx-0 mb-6 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-semibold text-heavy-metal mb-4 font-san-francisco">
                Intellego Platform
              </h1>
              
              <p className="text-granite-green mb-8 leading-relaxed">
                Plataforma de gestión de progreso estudiantil diseñada para reemplazar Google Forms
              </p>
              
              <div className="space-y-3">
                <Link 
                  href="/auth/signin" 
                  className="mac-button mac-button-primary w-full block text-center"
                >
                  Iniciar Sesión
                </Link>
                
                <Link 
                  href="/auth/signup" 
                  className="mac-button mac-button-secondary w-full block text-center"
                >
                  Crear Cuenta
                </Link>
              </div>
            </div>
            
            {/* Right side - Features showcase */}
            <div className="flex flex-col space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-heavy-metal mb-2 font-san-francisco">
                  Características Principales
                </h2>
                <p className="text-granite-green leading-relaxed">
                  Sistema simple y efectivo para el seguimiento del progreso académico estudiantil
                </p>
              </div>
              
              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="mac-card text-center p-6 bounce-enter">
                  <div className="w-12 h-12 bg-gradient-to-br from-silver-tree to-powder-ash rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-heavy-metal mb-2">Reportes Semanales</h3>
                  <p className="text-sm text-granite-green">Formularios estructurados para el seguimiento del progreso</p>
                </div>
                
                <div className="mac-card text-center p-6 bounce-enter" style={{animationDelay: '0.1s'}}>
                  <div className="w-12 h-12 bg-gradient-to-br from-sea-nymph to-zorba rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-heavy-metal mb-2">Gestión de Usuarios</h3>
                  <p className="text-sm text-granite-green">Sistema de autenticación para estudiantes e instructores</p>
                </div>
                
                <div className="mac-card text-center p-6 bounce-enter" style={{animationDelay: '0.2s'}}>
                  <div className="w-12 h-12 bg-gradient-to-br from-raw-sienna to-potters-clay rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-heavy-metal mb-2">Análisis de Datos</h3>
                  <p className="text-sm text-granite-green">Visualización del progreso y exportación de datos</p>
                </div>
                
                <div className="mac-card text-center p-6 bounce-enter" style={{animationDelay: '0.3s'}}>
                  <div className="w-12 h-12 bg-gradient-to-br from-bison-hide to-westar rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-heavy-metal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-heavy-metal mb-2">Interfaz Simple</h3>
                  <p className="text-sm text-granite-green">Diseño limpio y fácil de usar para todos los usuarios</p>
                </div>
              </div>
              
              {/* Call to action */}
              <div className="text-center lg:text-left">
                <p className="text-sm text-granite-green mb-4">
                  ¿Listo para comenzar a gestionar el progreso estudiantil?
                </p>
                <Link 
                  href="/auth/signin" 
                  className="mac-button mac-button-primary inline-flex items-center glow-effect"
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