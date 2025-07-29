"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    program: "",
    phoneNumber: "",
    dateOfBirth: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    program: "",
    phoneNumber: ""
  })
  
  const router = useRouter()

  // Real-time validation functions
  const validateField = (name: string, value: string) => {
    let error = ""
    
    switch (name) {
      case "name":
        if (value.length < 2) error = "El nombre debe tener al menos 2 caracteres"
        break
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) error = "Email inválido"
        break
      case "password":
        if (value.length < 6) error = "La contraseña debe tener al menos 6 caracteres"
        break
      case "confirmPassword":
        if (value !== formData.password) error = "Las contraseñas no coinciden"
        break
      case "program":
        if (formData.role === "STUDENT" && value.length < 2) error = "El programa es requerido para estudiantes"
        break
      case "phoneNumber":
        const phoneRegex = /^[+]?[\d\s-()]{10,}$/
        if (value && !phoneRegex.test(value)) error = "Formato de teléfono inválido"
        break
    }
    
    setValidationErrors(prev => ({ ...prev, [name]: error }))
    return error === ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validate all fields
    const isValid = Object.keys(formData).every(key => {
      if (key === "confirmPassword" || key === "dateOfBirth") return true
      return validateField(key, formData[key as keyof typeof formData])
    })

    if (!isValid || formData.password !== formData.confirmPassword) {
      setError("Por favor corrige los errores en el formulario")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          program: formData.program || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        }),
      })

      if (response.ok) {
        setSuccess("¡Cuenta creada exitosamente! Iniciando sesión...")
        
        // Auto login after successful registration
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          setTimeout(() => {
            router.push(formData.role === "INSTRUCTOR" ? "/dashboard/instructor" : "/dashboard/student")
          }, 1000)
        }
      } else {
        const data = await response.json()
        setError(data.message || "Error al crear la cuenta")
      }
    } catch (error) {
      setError("Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Real-time validation
    validateField(name, value)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="mac-card p-12 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--silver-tree), var(--sea-nymph))' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--heavy-metal)' }}>
          Crear Cuenta
        </h1>
        
        <p className="mb-8 text-center text-sm" style={{ color: 'var(--granite-green)' }}>
          Únete a Intellego Platform
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm animate-pulse">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm animate-pulse">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Nombre Completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`mac-input ${validationErrors.name ? 'border-red-300' : 'border-gray-200'}`}
              required
            />
            {validationErrors.name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`mac-input ${validationErrors.email ? 'border-red-300' : 'border-gray-200'}`}
              required
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Tipo de Usuario
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mac-input"
              required
            >
              <option value="STUDENT">Estudiante</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          {formData.role === "STUDENT" && (
            <div>
              <label htmlFor="program" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
                Programa de Estudios
              </label>
              <input
                id="program"
                name="program"
                type="text"
                value={formData.program}
                onChange={handleChange}
                className={`mac-input ${validationErrors.program ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Ej: Ingeniería en Sistemas"
                required={formData.role === "STUDENT"}
              />
              {validationErrors.program && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.program}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Número de Teléfono (Opcional)
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`mac-input ${validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="+1234567890"
            />
            {validationErrors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Fecha de Nacimiento (Opcional)
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="mac-input"
            />
          </div>


          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`mac-input ${validationErrors.password ? 'border-red-300' : 'border-gray-200'}`}
              required
              minLength={6}
            />
            {validationErrors.password && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`mac-input ${validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'}`}
              required
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mac-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>



        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--granite-green)' }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/signin" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--silver-tree)' }}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}