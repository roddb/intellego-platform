"use client"

import { useState } from 'react'

interface WeeklyReportFormProps {
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

export default function WeeklyReportForm({ onSubmissionSuccess, className }: WeeklyReportFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Reset form
        setFormData({
          temasYDominio: '',
          evidenciaAprendizaje: '',
          dificultadesEstrategias: '',
          conexionesAplicacion: '',
          comentariosAdicionales: ''
        })
        
        if (onSubmissionSuccess) {
          onSubmissionSuccess()
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Error al enviar el reporte')
      }
      
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Error al enviar el reporte')
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
          Registro Semanal
        </h2>
        <p className="text-slate-600">
          Completa tu reporte de progreso de esta semana
        </p>
      </div>

      {/* Pregunta 1: Temas y Dominio */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          1. Temas trabajados y nivel de dominio <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-600 mb-3">
          Describí los temas que trabajamos esta semana y tu nivel de dominio en cada uno.
        </p>
        <textarea
          value={formData.temasYDominio}
          onChange={(e) => handleChange('temasYDominio', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.temasYDominio ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          placeholder="Ejemplo: JavaScript - Nivel 3: Puedo crear funciones complejas y trabajar con arrays, pero aún me cuesta con async/await..."
          disabled={isLoading}
        />
        {errors.temasYDominio && (
          <p className="text-red-600 text-sm">{errors.temasYDominio}</p>
        )}
      </div>

      {/* Pregunta 2: Evidencia de Aprendizaje */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          2. Evidencia de aprendizaje <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-600 mb-3">
          Describí un problema o ejercicio específico que hayas resuelto esta semana.
        </p>
        <textarea
          value={formData.evidenciaAprendizaje}
          onChange={(e) => handleChange('evidenciaAprendizaje', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.evidenciaAprendizaje ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          placeholder="Ejemplo: Resolví un ejercicio de ordenamiento de arrays. El problema era ordenar una lista de estudiantes por nota..."
          disabled={isLoading}
        />
        {errors.evidenciaAprendizaje && (
          <p className="text-red-600 text-sm">{errors.evidenciaAprendizaje}</p>
        )}
      </div>

      {/* Pregunta 3: Dificultades y Estrategias */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          3. Dificultades y estrategias <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-600 mb-3">
          ¿Qué aspectos específicos de los temas de esta semana te resultaron más difíciles?
        </p>
        <textarea
          value={formData.dificultadesEstrategias}
          onChange={(e) => handleChange('dificultadesEstrategias', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.dificultadesEstrategias ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          placeholder="Ejemplo: Me resultó difícil entender los closures en JavaScript. Para superarlo, practiqué con ejemplos simples..."
          disabled={isLoading}
        />
        {errors.dificultadesEstrategias && (
          <p className="text-red-600 text-sm">{errors.dificultadesEstrategias}</p>
        )}
      </div>

      {/* Pregunta 4: Conexiones y Aplicación */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          4. Conexiones y aplicación avanzada <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-slate-600 mb-3">
          ¿Cómo se conectan los temas de esta semana con otros temas o materias que ya conocés?
        </p>
        <textarea
          value={formData.conexionesAplicacion}
          onChange={(e) => handleChange('conexionesAplicacion', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
            errors.conexionesAplicacion ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
          placeholder="Ejemplo: Los arrays se conectan con lo que vimos de bases de datos porque son como tablas..."
          disabled={isLoading}
        />
        {errors.conexionesAplicacion && (
          <p className="text-red-600 text-sm">{errors.conexionesAplicacion}</p>
        )}
      </div>

      {/* Pregunta 5: Comentarios Adicionales (Opcional) */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          5. Comentarios adicionales (opcional)
        </label>
        <p className="text-sm text-slate-600 mb-3">
          ¿Hay algo más que quieras compartir sobre tu experiencia de aprendizaje esta semana?
        </p>
        <textarea
          value={formData.comentariosAdicionales}
          onChange={(e) => handleChange('comentariosAdicionales', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="Comentarios adicionales, sugerencias, dudas..."
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Enviando...
            </div>
          ) : (
            'Enviar Registro Semanal'
          )}
        </button>
      </div>

      <div className="text-sm text-slate-500 text-center">
        <span className="text-red-500">*</span> Campos requeridos
      </div>
    </form>
  )
}