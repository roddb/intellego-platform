"use client"

import { useState, useEffect } from 'react'
import FileUpload from './FileUpload'

interface WeeklyReportFormProps {
  onSubmit: (data: WeeklyReportData) => Promise<void>
  canSubmit: boolean
  isLoading?: boolean
  className?: string
}

interface WeeklyReportData {
  temasYDominio: string
  evidenciaAprendizaje: string
  dificultadesEstrategias: string
  conexionesAplicacion: string
  comentariosAdicionales: string
  attachments?: File[]
}

export default function WeeklyReportForm({ onSubmit, canSubmit, isLoading = false, className }: WeeklyReportFormProps) {
  const [formData, setFormData] = useState<WeeklyReportData>({
    temasYDominio: '',
    evidenciaAprendizaje: '',
    dificultadesEstrategias: '',
    conexionesAplicacion: '',
    comentariosAdicionales: '',
    attachments: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [fieldCompletionStatus, setFieldCompletionStatus] = useState<Record<string, boolean>>({})
  const [animationStep, setAnimationStep] = useState<'pending' | 'submitting' | 'success'>('pending')

  const handleChange = (field: keyof WeeklyReportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Update field completion status
    const isCompleted = value.trim().length > 10 // Consider field completed if has substantial content
    setFieldCompletionStatus(prev => ({
      ...prev,
      [field]: isCompleted
    }))
  }

  const handleFilesChange = (files: File[]) => {
    setFormData(prev => ({ ...prev, attachments: files }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setAnimationStep('submitting')
    
    try {
      await onSubmit(formData)
      
      // Success animation sequence
      setAnimationStep('success')
      setSubmissionSuccess(true)
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          temasYDominio: '',
          evidenciaAprendizaje: '',
          dificultadesEstrategias: '',
          conexionesAplicacion: '',
          comentariosAdicionales: '',
          attachments: []
        })
        setFieldCompletionStatus({})
        setSubmissionSuccess(false)
        setAnimationStep('pending')
      }, 3000)
      
    } catch (error) {
      console.error('Error submitting form:', error)
      setAnimationStep('pending')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get field styling based on completion status
  const getFieldStyling = (field: string, hasError: boolean) => {
    const baseClass = "mac-input h-32 resize-none transition-all duration-500 ease-in-out"
    
    if (hasError) {
      return `${baseClass} border-red-300 bg-red-50/50`
    }
    
    if (fieldCompletionStatus[field]) {
      return `${baseClass} border-green-400 bg-green-50/30 shadow-green-100 shadow-sm`
    }
    
    if (formData[field as keyof WeeklyReportData].trim().length > 0) {
      return `${baseClass} border-yellow-400 bg-yellow-50/30 shadow-yellow-100 shadow-sm`
    }
    
    return `${baseClass} border-gray-300`
  }

  // Helper function to get container styling based on animation step
  const getContainerStyling = () => {
    const baseClass = "mac-card p-8 space-y-6 transition-all duration-1000 ease-in-out"
    
    switch (animationStep) {
      case 'submitting':
        return `${baseClass} bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200`
      case 'success':
        return `${baseClass} bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-green-100 shadow-lg`
      default:
        return `${baseClass} bg-white`
    }
  }

  if (!canSubmit) {
    return (
      <div className={`mac-card p-8 text-center ${className}`}>
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Registro no disponible</h3>
        <p className="text-gray-600">
          Ya enviaste tu registro de esta semana o aún no está disponible para entregar.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${getContainerStyling()} ${className}`}>
      {submissionSuccess && (
        <div className="text-center mb-6 animate-bounce">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 mb-2">¡Registro Enviado Exitosamente!</h3>
          <p className="text-green-600">Tu reporte ha sido guardado correctamente.</p>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h2 className={`text-2xl font-bold mb-2 transition-colors duration-500 ${
          animationStep === 'success' ? 'text-green-800' : 'text-gray-800'
        }`}>
          Registro Semanal
        </h2>
        <p className={`transition-colors duration-500 ${
          animationStep === 'success' ? 'text-green-600' : 'text-gray-600'
        }`}>
          {animationStep === 'success' ? '¡Completado!' : 'Completa tu reporte de progreso de esta semana'}
        </p>
      </div>

      {/* Pregunta 1: Temas y Dominio */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          1. Temas trabajados y nivel de dominio <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Describí los temas que trabajamos esta semana y tu nivel de dominio en cada uno. 
          Para cada tema, indicá: el nombre del tema, tu nivel de dominio (nivel 1, 2, 3 o 4) y por qué te ubicás en ese nivel.
        </p>
        <textarea
          value={formData.temasYDominio}
          onChange={(e) => handleChange('temasYDominio', e.target.value)}
          className={getFieldStyling('temasYDominio', !!errors.temasYDominio)}
          placeholder="Ejemplo: JavaScript - Nivel 3: Puedo crear funciones complejas y trabajar con arrays, pero aún me cuesta con async/await..."
          disabled={isSubmitting || isLoading}
        />
        {errors.temasYDominio && (
          <p className="text-red-600 text-sm">{errors.temasYDominio}</p>
        )}
      </div>

      {/* Pregunta 2: Evidencia de Aprendizaje */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          2. Evidencia de aprendizaje <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Describí un problema o ejercicio específico que hayas resuelto esta semana. 
          Incluí: el tema, el enunciado (resumido), tu proceso de resolución y el resultado obtenido.
        </p>
        <textarea
          value={formData.evidenciaAprendizaje}
          onChange={(e) => handleChange('evidenciaAprendizaje', e.target.value)}
          className={getFieldStyling('evidenciaAprendizaje', !!errors.evidenciaAprendizaje)}
          placeholder="Ejemplo: Resolví un ejercicio de ordenamiento de arrays. El problema era ordenar una lista de estudiantes por nota..."
          disabled={isSubmitting || isLoading}
        />
        {errors.evidenciaAprendizaje && (
          <p className="text-red-600 text-sm">{errors.evidenciaAprendizaje}</p>
        )}
      </div>

      {/* Archivos de Evidencia */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Archivos de evidencia (opcional)
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Podés adjuntar capturas de pantalla, documentos, archivos de código u otros materiales que respalden tu evidencia de aprendizaje.
        </p>
        <FileUpload
          onFilesChange={handleFilesChange}
          acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.js', '.py', '.html', '.css']}
          maxFiles={5}
          maxSizeInMB={10}
          className="w-full"
        />
      </div>

      {/* Pregunta 3: Dificultades y Estrategias */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          3. Dificultades y estrategias <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          ¿Qué aspectos específicos de los temas de esta semana te resultaron más difíciles? 
          ¿Qué estrategias utilizaste o necesitarías para superarlos?
        </p>
        <textarea
          value={formData.dificultadesEstrategias}
          onChange={(e) => handleChange('dificultadesEstrategias', e.target.value)}
          className={getFieldStyling('dificultadesEstrategias', !!errors.dificultadesEstrategias)}
          placeholder="Ejemplo: Me resultó difícil entender los closures en JavaScript. Para superarlo, practiqué con ejemplos simples..."
          disabled={isSubmitting || isLoading}
        />
        {errors.dificultadesEstrategias && (
          <p className="text-red-600 text-sm">{errors.dificultadesEstrategias}</p>
        )}
      </div>

      {/* Pregunta 4: Conexiones y Aplicación */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          4. Conexiones y aplicación avanzada <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-3">
          a) ¿Cómo se conectan los temas de esta semana con otros temas o materias que ya conocés? 
          b) Proponé un problema o situación más compleja donde se apliquen estos conocimientos.
        </p>
        <textarea
          value={formData.conexionesAplicacion}
          onChange={(e) => handleChange('conexionesAplicacion', e.target.value)}
          className={getFieldStyling('conexionesAplicacion', !!errors.conexionesAplicacion)}
          placeholder="Ejemplo: Los arrays se conectan con lo que vimos de bases de datos porque son como tablas... Podría aplicarlo para crear un sistema de inventario..."
          disabled={isSubmitting || isLoading}
        />
        {errors.conexionesAplicacion && (
          <p className="text-red-600 text-sm">{errors.conexionesAplicacion}</p>
        )}
      </div>

      {/* Pregunta 5: Comentarios Adicionales (Opcional) */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          5. Comentarios adicionales (opcional)
        </label>
        <p className="text-sm text-gray-600 mb-3">
          ¿Hay algo más que quieras compartir sobre tu experiencia de aprendizaje esta semana? 
          (Dudas pendientes, sugerencias, comentarios, etc.)
        </p>
        <textarea
          value={formData.comentariosAdicionales}
          onChange={(e) => handleChange('comentariosAdicionales', e.target.value)}
          className={getFieldStyling('comentariosAdicionales', false).replace('h-32', 'h-24')}
          placeholder="Comentarios adicionales, sugerencias, dudas..."
          disabled={isSubmitting || isLoading}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || submissionSuccess}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-500 ease-in-out transform ${
            animationStep === 'success' 
              ? 'bg-green-500 text-white shadow-lg scale-105' 
              : animationStep === 'submitting'
              ? 'bg-yellow-500 text-white shadow-md'
              : 'mac-button-primary hover:scale-[1.02]'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {animationStep === 'success' ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ¡Enviado Exitosamente!
            </div>
          ) : isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Enviando...
            </div>
          ) : (
            'Enviar Registro Semanal'
          )}
        </button>
      </div>

      <div className="text-sm text-gray-500 text-center">
        <span className="text-red-500">*</span> Campos requeridos
      </div>
    </form>
  )
}