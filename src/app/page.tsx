import Link from 'next/link'
import ParticleStrand from '@/components/ParticleStrand'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Particle background */}
      <ParticleStrand />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Platform info */}
            <div className="mac-card p-12 max-w-md w-full text-center lg:text-left mx-auto lg:mx-0">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl mx-auto lg:mx-0 mb-6 flex items-center justify-center shadow-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-semibold text-slate-800 mb-4">
                Intellego Platform
              </h1>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                Plataforma de gestión de progreso estudiantil con Organizador Inteligente y diseño inspirado en macOS
              </p>
              
              <div className="space-y-3">
                <Link href="/auth/signin" className="mac-button-primary w-full block text-center">
                  Iniciar Sesión
                </Link>
                
                <Link href="/auth/signup" className="mac-button-secondary w-full block text-center">
                  Crear Cuenta
                </Link>
              </div>
            </div>
            
            {/* Right side - Features showcase */}
            <div className="flex flex-col space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  Organizador Inteligente
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Gestiona tus exámenes, sesiones de estudio y entregas con nuestro sistema de planificación académica impulsado por IA
                </p>
              </div>
              
              {/* Features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-6 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200">
                  <div className="w-12 h-12 bg-teal-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Planificación IA</h3>
                  <p className="text-sm text-slate-600">Cronogramas personalizados adaptados a tu horario y preferencias</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Simulacros</h3>
                  <p className="text-sm text-slate-600">Evaluaciones progresivas que se adaptan a tu nivel de conocimiento</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Progreso</h3>
                  <p className="text-sm text-slate-600">Seguimiento inteligente de tu rendimiento académico</p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2">Material IA</h3>
                  <p className="text-sm text-slate-600">Análisis inteligente de tu material de estudio</p>
                </div>
              </div>
              
              {/* Call to action */}
              <div className="text-center lg:text-left">
                <p className="text-sm text-slate-600 mb-4">
                  ¿Listo para revolucionar tu manera de estudiar?
                </p>
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm"
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