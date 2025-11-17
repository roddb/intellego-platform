'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

export default function Home() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const pulsesRef = useRef<any[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      // Dynamically import Vanta CELLS and Three.js (client-side only)
      // @ts-ignore - vanta library doesn't have TypeScript definitions
      import('vanta/dist/vanta.cells.min')
        .then((VANTA) => {
          // @ts-ignore - three library imported dynamically
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
              color1: 0x6ABAAD, // turquoise from Intellego logo (main cells)
              color2: 0xE09E5C, // orange/amber from Intellego logo (secondary cells)
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
          <div className="mac-card p-4 text-center login-card-transition backdrop-blur-sm bg-white/90 shadow-2xl">
            <div className="w-full mx-auto mb-4 flex items-center justify-center">
              <Image
                src="/intellego-logo.png"
                alt="Intellego Logo"
                width={500}
                height={500}
                priority
                className="object-contain w-full h-auto"
              />
            </div>

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