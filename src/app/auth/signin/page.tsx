"use client"

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: ""
  })
  const router = useRouter()
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)

  // Initialize Vanta CELLS background
  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
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
              size: 1.80,
              speed: 2.00,
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
        const session = await getSession()
        if (session?.user?.role === "INSTRUCTOR") {
          router.push("/dashboard/instructor")
        } else if (session?.user?.role === "STUDENT") {
          // Redirigir según sede
          if (session.user.sede === "CONSUDEC") {
            router.push("/dashboard/student-consudec")
          } else {
            router.push("/dashboard/student")
          }
        } else {
          router.push("/dashboard/student")
        }
      }
    } catch (error) {
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background animation container */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Centered login card */}
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="mac-card p-4 max-w-md w-full backdrop-blur-sm bg-white/90 shadow-2xl login-card-transition">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-heavy-metal">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mac-input ${fieldErrors.email ? 'border-red-300' : ''}`}
              placeholder="tu@email.com"
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-heavy-metal">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mac-input ${fieldErrors.password ? 'border-red-300' : ''}`}
              placeholder="Tu contraseña"
              required
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mac-button mac-button-primary w-full glow-effect disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>



        <div className="mt-6 text-center">
          <p className="text-sm text-granite-green">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="font-semibold text-silver-tree hover:text-sea-nymph transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
        </div>
      </div>
    </main>
  )
}