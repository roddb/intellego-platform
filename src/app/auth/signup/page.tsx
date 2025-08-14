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
    sede: "",
    academicYear: "",
    division: "",
    subjects: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    sede: "",
    academicYear: "",
    division: "",
    subjects: ""
  })
  
  const router = useRouter()

  // Academic year and division mapping
  const DIVISION_OPTIONS = {
    "4to Año": ["C", "D", "E"],
    "5to Año": ["A", "B", "C", "D"]
  }

  // Real-time validation functions
  const validateField = (name: string, value: string | string[]) => {
    let error = ""
    
    switch (name) {
      case "name":
        if ((value as string).length < 2) error = "El nombre debe tener al menos 2 caracteres"
        break
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value as string)) error = "Email inválido"
        break
      case "password":
        if ((value as string).length < 6) error = "La contraseña debe tener al menos 6 caracteres"
        break
      case "confirmPassword":
        if (value !== formData.password) error = "Las contraseñas no coinciden"
        break
      case "sede":
        if (!(value as string)) error = "Selecciona una sede"
        break
      case "academicYear":
        if (!(value as string)) error = "Selecciona un año académico"
        break
      case "division":
        if (!(value as string)) error = "Selecciona una división"
        break
      case "subjects":
        if ((value as string[]).length === 0) error = "Selecciona al menos una materia"
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
    const fieldsToValidate = ['name', 'email', 'password', 'sede', 'academicYear', 'division', 'subjects']
    const isValid = fieldsToValidate.every(key => {
      const value = key === 'subjects' ? formData.subjects : formData[key as keyof typeof formData]
      return validateField(key, value)
    })

    if (!isValid || formData.password !== formData.confirmPassword || formData.subjects.length === 0) {
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
          sede: formData.sede,
          academicYear: formData.academicYear,
          division: formData.division,
          subjects: formData.subjects.join(','), // Convert array to comma-separated string
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
            router.push("/dashboard/student")
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
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => {
        const newSubjects = checkbox.checked 
          ? [...prev.subjects, value]
          : prev.subjects.filter(s => s !== value)
        return { ...prev, subjects: newSubjects }
      })
      validateField('subjects', formData.subjects)
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value }
        // Reset division when academic year changes
        if (name === 'academicYear') {
          newData.division = ""
        }
        return newData
      })
      validateField(name, value)
    }
  }

  return (
    <main className="auth-page-container min-h-screen flex items-center justify-center p-6 bg-slate-50">
      {/* Ensure no background elements interfere */}
      <div className="absolute inset-0 bg-slate-50 -z-10"></div>
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
            <label htmlFor="sede" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Sede
            </label>
            <select
              id="sede"
              name="sede"
              value={formData.sede}
              onChange={handleChange}
              className={`mac-input ${validationErrors.sede ? 'border-red-300' : 'border-gray-200'}`}
              required
            >
              <option value="">Selecciona sede</option>
              <option value="Congreso">Congreso</option>
              <option value="Colegiales">Colegiales</option>
            </select>
            {validationErrors.sede && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.sede}</p>
            )}
          </div>

          <div>
            <label htmlFor="academicYear" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Año Académico
            </label>
            <select
              id="academicYear"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className={`mac-input ${validationErrors.academicYear ? 'border-red-300' : 'border-gray-200'}`}
              required
            >
              <option value="">Selecciona año</option>
              <option value="4to Año">4to Año</option>
              <option value="5to Año">5to Año</option>
            </select>
            {validationErrors.academicYear && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.academicYear}</p>
            )}
          </div>

          <div>
            <label htmlFor="division" className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              División
            </label>
            <select
              id="division"
              name="division"
              value={formData.division}
              onChange={handleChange}
              className={`mac-input ${validationErrors.division ? 'border-red-300' : 'border-gray-200'}`}
              required
              disabled={!formData.academicYear}
            >
              <option value="">Selecciona división</option>
              {formData.academicYear && DIVISION_OPTIONS[formData.academicYear as keyof typeof DIVISION_OPTIONS]?.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
            {validationErrors.division && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.division}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--heavy-metal)' }}>
              Materias que cursas conmigo
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Física"
                  checked={formData.subjects.includes('Física')}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Física</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Química"
                  checked={formData.subjects.includes('Química')}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Química</span>
              </label>
            </div>
            {validationErrors.subjects && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.subjects}</p>
            )}
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