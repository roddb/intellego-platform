"use client"

import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-teal-500 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center text-slate-800">
          Iniciar Sesión
        </h1>
        
        <p className="mb-8 text-center text-sm text-slate-600">
          Accede a tu cuenta de Intellego Platform
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${fieldErrors.email ? 'border-red-300' : 'border-slate-300'}`}
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${fieldErrors.password ? 'border-red-300' : 'border-slate-300'}`}
              required
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}