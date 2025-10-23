"use client"

import { useState, useMemo } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown, BookOpen, Lightbulb, AlertCircle, Network, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface WeeklyReportFormProps {
  subject: string
  onSubmissionSuccess?: () => void
  className?: string
}

interface WeeklyReportData {
  temasYDominio: string
  evidenciaAprendizaje: string
  dificultadesEstrategias: string
  conexionesAplicacion: string
  comentariosAdicionales: string
}

export default function WeeklyReportForm({ subject, onSubmissionSuccess, className }: WeeklyReportFormProps) {
  const [formData, setFormData] = useState<WeeklyReportData>({
    temasYDominio: '',
    evidenciaAprendizaje: '',
    dificultadesEstrategias: '',
    conexionesAplicacion: '',
    comentariosAdicionales: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)

  const handleChange = (field: keyof WeeklyReportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.temasYDominio.trim()) {
      newErrors.temasYDominio = 'Este campo es requerido'
    }
    if (!formData.evidenciaAprendizaje.trim()) {
      newErrors.evidenciaAprendizaje = 'Este campo es requerido'
    }
    if (!formData.dificultadesEstrategias.trim()) {
      newErrors.dificultadesEstrategias = 'Este campo es requerido'
    }
    if (!formData.conexionesAplicacion.trim()) {
      newErrors.conexionesAplicacion = 'Este campo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Celebración de confetis cuando se envía el reporte exitosamente
  const fireConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      colors: ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a'] // Teal colors matching the theme
    }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Disparar desde la izquierda
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })

      // Disparar desde la derecha
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    // Disparo central grande inicial
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a']
    })
  }

  // Calculate progress
  const completedFields = useMemo(() => {
    let count = 0
    if (formData.temasYDominio.trim()) count++
    if (formData.evidenciaAprendizaje.trim()) count++
    if (formData.dificultadesEstrategias.trim()) count++
    if (formData.conexionesAplicacion.trim()) count++
    if (formData.comentariosAdicionales.trim()) count++
    return count
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setIsSubmitting(true)
    setError('')
    setSubmitProgress(0)

    try {
      // Iniciar animación de progreso
      const progressInterval = setInterval(() => {
        setSubmitProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95 // Detenerse en 95% hasta que termine la request
          }
          return prev + 5
        })
      }, 50)

      const response = await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, subject }),
      })

      clearInterval(progressInterval)

      if (response.ok) {
        // Completar la barra al 100%
        setSubmitProgress(100)

        // Esperar 800ms para la transición amarillo → verde
        await new Promise(resolve => setTimeout(resolve, 800))

        // 🎉 ¡Celebración! Disparar confetis DESPUÉS de la animación
        fireConfetti()

        // Reset form
        setFormData({
          temasYDominio: '',
          evidenciaAprendizaje: '',
          dificultadesEstrategias: '',
          conexionesAplicacion: '',
          comentariosAdicionales: ''
        })

        // Llamar al callback DESPUÉS de los confetis para que el calendario se actualice suavemente
        if (onSubmissionSuccess) {
          // Esperar 500ms más para que los confetis empiecen antes de actualizar el DOM
          setTimeout(() => {
            onSubmissionSuccess()
            setIsSubmitting(false)
            setSubmitProgress(0)
          }, 500)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Error al enviar el reporte')
        setIsSubmitting(false)
        setSubmitProgress(0)
      }

    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Error al enviar el reporte')
      setIsSubmitting(false)
      setSubmitProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Registro Semanal - {subject}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Completa tu reporte de progreso de {subject} para esta semana
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Progreso del formulario
            </span>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
              {completedFields}/5 completadas
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedFields / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Pregunta 1: Temas y Dominio */}
      <Disclosure defaultOpen>
        {({ open }) => (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  1. Temas trabajados y nivel de dominio <span className="text-red-500">*</span>
                </span>
                {formData.temasYDominio && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Describí los temas que trabajamos esta semana y tu nivel de dominio en cada uno.
                </p>
                <textarea
                  value={formData.temasYDominio}
                  onChange={(e) => handleChange('temasYDominio', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 ${
                    errors.temasYDominio ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="Ejemplo: JavaScript - Nivel 3: Puedo crear funciones complejas y trabajar con arrays, pero aún me cuesta con async/await..."
                  disabled={isLoading}
                />
                {errors.temasYDominio && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.temasYDominio}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 2: Evidencia de Aprendizaje */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  2. Evidencia de aprendizaje <span className="text-red-500">*</span>
                </span>
                {formData.evidenciaAprendizaje && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Describí un problema o ejercicio específico que hayas resuelto esta semana.
                </p>
                <textarea
                  value={formData.evidenciaAprendizaje}
                  onChange={(e) => handleChange('evidenciaAprendizaje', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 ${
                    errors.evidenciaAprendizaje ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="Ejemplo: Resolví un ejercicio de ordenamiento de arrays. El problema era ordenar una lista de estudiantes por nota..."
                  disabled={isLoading}
                />
                {errors.evidenciaAprendizaje && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.evidenciaAprendizaje}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 3: Dificultades y Estrategias */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  3. Dificultades y estrategias <span className="text-red-500">*</span>
                </span>
                {formData.dificultadesEstrategias && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ¿Qué aspectos específicos de los temas de esta semana te resultaron más difíciles?
                </p>
                <textarea
                  value={formData.dificultadesEstrategias}
                  onChange={(e) => handleChange('dificultadesEstrategias', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 ${
                    errors.dificultadesEstrategias ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="Ejemplo: Me resultó difícil entender los closures en JavaScript. Para superarlo, practiqué con ejemplos simples..."
                  disabled={isLoading}
                />
                {errors.dificultadesEstrategias && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.dificultadesEstrategias}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 4: Conexiones y Aplicación */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  4. Conexiones y aplicación avanzada <span className="text-red-500">*</span>
                </span>
                {formData.conexionesAplicacion && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ¿Cómo se conectan los temas de esta semana con otros temas o materias que ya conocés?
                </p>
                <textarea
                  value={formData.conexionesAplicacion}
                  onChange={(e) => handleChange('conexionesAplicacion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 ${
                    errors.conexionesAplicacion ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="Ejemplo: Los arrays se conectan con lo que vimos de bases de datos porque son como tablas..."
                  disabled={isLoading}
                />
                {errors.conexionesAplicacion && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.conexionesAplicacion}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 5: Comentarios Adicionales (Opcional) */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  5. Comentarios adicionales (opcional)
                </span>
                {formData.comentariosAdicionales && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ¿Hay algo más que quieras compartir sobre tu experiencia de aprendizaje esta semana?
                </p>
                <textarea
                  value={formData.comentariosAdicionales}
                  onChange={(e) => handleChange('comentariosAdicionales', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg h-24 resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Comentarios adicionales, sugerencias, dudas..."
                  disabled={isLoading}
                />
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Submit Button */}
      <div className="pt-6 space-y-4">
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Enviando...
            </div>
          ) : (
            `Enviar Registro de ${subject}`
          )}
        </motion.button>

        {/* Barra de progreso animada */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {submitProgress < 100 ? '🟡 Enviando reporte...' : '✅ ¡Reporte enviado!'}
              </span>
              <span className={`font-bold transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {submitProgress}%
              </span>
            </div>

            {/* Barra de progreso con transición suave de amarillo a verde */}
            <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                  submitProgress === 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${submitProgress}%` }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
        <span className="text-red-500">*</span> Campos requeridos
      </div>
    </form>
  )
}