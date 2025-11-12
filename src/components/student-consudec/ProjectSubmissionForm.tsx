"use client"

import { useState, useMemo } from 'react'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDown, BookOpen, Target, AlertCircle, Lightbulb, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProjectSubmissionFormProps {
  projectId: string
  projectTitle: string
  subject: string
  onSubmissionSuccess?: () => void
  className?: string
}

interface ProjectSubmissionData {
  descripcionProyecto: string
  estrategiasDidacticas: string
  dificultadesAbordaje: string
  aprendizajesClave: string
  aplicacionPractica: string
}

export default function ProjectSubmissionForm({
  projectId,
  projectTitle,
  subject,
  onSubmissionSuccess,
  className
}: ProjectSubmissionFormProps) {
  const [formData, setFormData] = useState<ProjectSubmissionData>({
    descripcionProyecto: '',
    estrategiasDidacticas: '',
    dificultadesAbordaje: '',
    aprendizajesClave: '',
    aplicacionPractica: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)

  const handleChange = (field: keyof ProjectSubmissionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.descripcionProyecto.trim()) {
      newErrors.descripcionProyecto = 'Este campo es requerido'
    }
    if (!formData.estrategiasDidacticas.trim()) {
      newErrors.estrategiasDidacticas = 'Este campo es requerido'
    }
    if (!formData.dificultadesAbordaje.trim()) {
      newErrors.dificultadesAbordaje = 'Este campo es requerido'
    }
    if (!formData.aprendizajesClave.trim()) {
      newErrors.aprendizajesClave = 'Este campo es requerido'
    }
    if (!formData.aplicacionPractica.trim()) {
      newErrors.aplicacionPractica = 'Este campo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const completedFields = useMemo(() => {
    let count = 0
    if (formData.descripcionProyecto.trim()) count++
    if (formData.estrategiasDidacticas.trim()) count++
    if (formData.dificultadesAbordaje.trim()) count++
    if (formData.aprendizajesClave.trim()) count++
    if (formData.aplicacionPractica.trim()) count++
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
      const progressInterval = setInterval(() => {
        setSubmitProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 50)

      const response = await fetch('/api/consudec/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId,
          subject
        }),
      })

      clearInterval(progressInterval)

      if (response.ok) {
        setSubmitProgress(100)
        await new Promise(resolve => setTimeout(resolve, 800))

        setFormData({
          descripcionProyecto: '',
          estrategiasDidacticas: '',
          dificultadesAbordaje: '',
          aprendizajesClave: '',
          aplicacionPractica: ''
        })

        if (onSubmissionSuccess) {
          setTimeout(() => {
            onSubmissionSuccess()
            setIsSubmitting(false)
            setSubmitProgress(0)
          }, 500)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Error al enviar el proyecto')
        setIsSubmitting(false)
        setSubmitProgress(0)
      }

    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Error al enviar el proyecto')
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {projectTitle}
        </h2>
        <p className="text-slate-600 mb-4">
          {subject} - Entrega de Trabajo Práctico
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Progreso del formulario
            </span>
            <span className="text-sm font-bold text-blue-600">
              {completedFields}/5 completadas
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedFields / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Pregunta 1: Descripción del Proyecto */}
      <Disclosure defaultOpen>
        {({ open }) => (
          <div className="border border-slate-200 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  1. Descripción del trabajo realizado <span className="text-red-500">*</span>
                </span>
                {formData.descripcionProyecto && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Describe detalladamente el proyecto o trabajo práctico que desarrollaste. Incluye objetivos, metodología y resultados obtenidos.
                </p>
                <textarea
                  value={formData.descripcionProyecto}
                  onChange={(e) => handleChange('descripcionProyecto', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.descripcionProyecto ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="Ejemplo: Desarrollé una secuencia didáctica para enseñar el concepto de energía en 5to año. El objetivo fue que los estudiantes comprendieran las transformaciones energéticas mediante experimentos prácticos..."
                  disabled={isLoading}
                />
                {errors.descripcionProyecto && (
                  <p className="text-red-600 text-sm">{errors.descripcionProyecto}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 2: Estrategias Didácticas */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  2. Estrategias didácticas implementadas <span className="text-red-500">*</span>
                </span>
                {formData.estrategiasDidacticas && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  ¿Qué estrategias didácticas específicas utilizaste? ¿Cómo organizaste las actividades y el tiempo? ¿Qué recursos empleaste?
                </p>
                <textarea
                  value={formData.estrategiasDidacticas}
                  onChange={(e) => handleChange('estrategiasDidacticas', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.estrategiasDidacticas ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="Ejemplo: Utilicé el aprendizaje basado en problemas (ABP). Dividí la clase en grupos de 4 estudiantes y les presenté un desafío real. Empleé videos, simulaciones digitales y experimentos prácticos..."
                  disabled={isLoading}
                />
                {errors.estrategiasDidacticas && (
                  <p className="text-red-600 text-sm">{errors.estrategiasDidacticas}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 3: Dificultades y Abordaje */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  3. Dificultades encontradas y cómo las abordaste <span className="text-red-500">*</span>
                </span>
                {formData.dificultadesAbordaje && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Reflexiona sobre los obstáculos que enfrentaste durante el desarrollo del trabajo. ¿Cómo los resolviste? ¿Qué ajustes realizaste?
                </p>
                <textarea
                  value={formData.dificultadesAbordaje}
                  onChange={(e) => handleChange('dificultadesAbordaje', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dificultadesAbordaje ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="Ejemplo: La principal dificultad fue mantener la atención del grupo durante toda la clase. Algunos estudiantes se dispersaban. Decidí acortar las explicaciones teóricas e incorporar más actividades prácticas cada 15 minutos..."
                  disabled={isLoading}
                />
                {errors.dificultadesAbordaje && (
                  <p className="text-red-600 text-sm">{errors.dificultadesAbordaje}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 4: Aprendizajes Clave */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  4. Aprendizajes clave de esta experiencia <span className="text-red-500">*</span>
                </span>
                {formData.aprendizajesClave && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  ¿Qué aprendiste sobre la enseñanza y el aprendizaje a partir de esta experiencia? ¿Qué descubrimientos hiciste sobre tu práctica docente?
                </p>
                <textarea
                  value={formData.aprendizajesClave}
                  onChange={(e) => handleChange('aprendizajesClave', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.aprendizajesClave ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="Ejemplo: Comprendí la importancia de variar las estrategias de enseñanza para mantener el engagement. También descubrí que los estudiantes aprenden mejor cuando pueden relacionar los conceptos con situaciones cotidianas..."
                  disabled={isLoading}
                />
                {errors.aprendizajesClave && (
                  <p className="text-red-600 text-sm">{errors.aprendizajesClave}</p>
                )}
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Pregunta 5: Aplicación Práctica */}
      <Disclosure>
        {({ open }) => (
          <div className="border border-slate-200 rounded-lg">
            <DisclosureButton className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  5. Aplicación en tu futura práctica docente <span className="text-red-500">*</span>
                </span>
                {formData.aplicacionPractica && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                  >
                    ✓ Completado
                  </motion.span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel
              transition
              className="origin-top transition duration-200 ease-out data-closed:-translate-y-2 data-closed:opacity-0"
            >
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  ¿Cómo aplicarás lo aprendido en tu futura práctica docente? ¿Qué aspectos incorporarás o mejorarás?
                </p>
                <textarea
                  value={formData.aplicacionPractica}
                  onChange={(e) => handleChange('aplicacionPractica', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg h-32 resize-none text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.aplicacionPractica ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                  placeholder="Ejemplo: Incorporaré más actividades experimentales en mis clases de Biofísica. Planificaré módulos de 15 minutos alternando teoría y práctica. Crearé un banco de situaciones problemáticas reales para motivar el aprendizaje..."
                  disabled={isLoading}
                />
                {errors.aplicacionPractica && (
                  <p className="text-red-600 text-sm">{errors.aplicacionPractica}</p>
                )}
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
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Enviando...
            </div>
          ) : (
            'Entregar Trabajo Práctico'
          )}
        </motion.button>

        {/* Progress Bar */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {submitProgress < 100 ? 'Enviando trabajo...' : '✓ Trabajo enviado exitosamente'}
              </span>
              <span className={`font-bold transition-colors duration-500 ${
                submitProgress === 100 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {submitProgress}%
              </span>
            </div>

            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                  submitProgress === 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${submitProgress}%` }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-sm text-slate-500 text-center">
        <span className="text-red-500">*</span> Campos requeridos
      </div>
    </form>
  )
}
