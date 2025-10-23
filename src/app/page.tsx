'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function Home() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const pulsesRef = useRef<any[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      // Dynamically import Vanta CELLS and Three.js (client-side only)
      import('vanta/dist/vanta.cells.min')
        .then((VANTA) => {
          import('three').then((THREE) => {
            vantaEffect.current = (VANTA as any).default({
              el: vantaRef.current,
              THREE: THREE,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              scaleMobile: 1.00,
              color1: 0xE5E7EB, // light gray/white (main cells)
              color2: 0x9CA3AF, // medium gray (secondary cells)
              size: 1.80, // larger cell size for more visibility
              speed: 2.00, // much faster (was 1.50, now even faster)
            })
          })
        })
        .catch((err) => console.error('Error loading Vanta:', err))
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
      }
    }
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background animation container */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Centered login card */}
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="mac-card p-8 text-center login-card-transition backdrop-blur-sm bg-white/90 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-silver-tree to-sea-nymph rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
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
        </div>
      </div>
    </main>
  )
}