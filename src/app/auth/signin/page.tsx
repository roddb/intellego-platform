"use client"

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ParticleStrand from "@/components/ParticleStrand"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: ""
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const router = useRouter()
  
  useEffect(() => {
    // Add entrance animation to login card
    const loginCard = document.querySelector('.mac-card')
    if (loginCard) {
      loginCard.classList.add('login-card-transition')
    }
  }, [])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors = { email: "", password: "" }
    let isValid = true

    if (!email) {
      errors.email = "El email es requerido"
      isValid = false
    } else if (!validateEmail(email)) {
      errors.email = "Ingresa un email válido"
      isValid = false
    }

    if (!password) {
      errors.password = "La contraseña es requerida"
      isValid = false
    } else if (password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres"
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({ email: "", password: "" })

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales inválidas")
      } else {
        setIsTransitioning(true)
        
        // Add shimmer effect to login card
        const loginCard = document.querySelector('.mac-card')
        if (loginCard) {
          const shimmerDiv = document.createElement('div')
          shimmerDiv.className = 'shimmer-overlay'
          loginCard.appendChild(shimmerDiv)
          
          // Add glow effect
          loginCard.classList.add('glow-effect')
        }
        
        // Wait for transition effects before navigating
        setTimeout(async () => {
          const session = await getSession()
          if (session?.user?.role === "INSTRUCTOR") {
            router.push("/dashboard/instructor")
          } else {
            router.push("/dashboard/student")
          }
        }, 1500)
      }
    } catch (error) {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 login-page relative">
      {/* Particle Strand Background */}
      <ParticleStrand 
        particleCount={30}
        connectionDistance={150}
        className="absolute inset-0"
      />
      
      <div className={`mac-card login-card-enhanced p-12 max-w-md w-full relative overflow-hidden ${isTransitioning ? 'page-transition-exit' : ''}`}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--silver-tree), var(--sea-nymph))' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--heavy-metal)' }}>
          Iniciar Sesión
        </h1>
        
        <p className="mb-8 text-center text-sm" style={{ color: 'var(--granite-green)' }}>
          Accede a tu cuenta de Intellego Platform
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mac-input ${fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mac-input ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="mac-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>


        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50/80 rounded-xl border border-blue-200/50">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Credenciales de Prueba</h3>
          <div className="space-y-2 text-xs text-blue-700">
            <div>
              <strong>Estudiante:</strong> estudiante@demo.com / Estudiante123!!!
            </div>
            <div>
              <strong>Instructor:</strong> instructor@demo.com / 123456
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--granite-green)' }}>
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--silver-tree)' }}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}