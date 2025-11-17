"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

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
    <main className="min-h-screen relative overflow-hidden">
      {/* Background animation container */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Centered signup card */}
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
      </div>
    </main>
  )
}