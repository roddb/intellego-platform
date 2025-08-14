"use client"

import { useState, useEffect } from "react"
import PasswordStrengthIndicator from "../PasswordStrengthIndicator"

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  role?: string
  sede?: string
  academicYear?: string
  division?: string
  subjects?: string[]
  reportCount?: number
}

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  student?: Student | null
  onSuccess?: (student: Student) => void
  onError?: (error: string) => void
}

interface FormData {
  newPassword: string
  confirmPassword: string
  resetReason: string
}

interface FormErrors {
  newPassword?: string
  confirmPassword?: string
  resetReason?: string
  general?: string
}

export default function PasswordResetModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  onError
}: PasswordResetModalProps) {
  const [formData, setFormData] = useState<FormData>({
    newPassword: "",
    confirmPassword: "",
    resetReason: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [successMessage, setSuccessMessage] = useState("")

  // Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (!isOpen || !student) {
      setFormData({
        newPassword: "",
        confirmPassword: "",
        resetReason: ""
      })
      setErrors({})
      setSuccessMessage("")
      setShowPasswords({ new: false, confirm: false })
    }
  }, [isOpen, student])

  const clearErrors = () => {
    setErrors({})
  }

  const clearMessages = () => {
    setSuccessMessage("")
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "La nueva contraseña debe tener al menos 8 caracteres"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "La confirmación de contraseña es requerida"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!formData.resetReason.trim()) {
      newErrors.resetReason = "El motivo del restablecimiento es requerido"
    } else if (formData.resetReason.trim().length < 10) {
      newErrors.resetReason = "El motivo debe tener al menos 10 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }

    clearMessages()
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!student) {
      setErrors({ general: "No hay estudiante seleccionado" })
      return
    }

    clearErrors()
    clearMessages()

    // Client-side validation
    if (!validateForm()) {
      return
    }

    // Get password strength validation if available
    let passwordValidation = null
    if (typeof window !== 'undefined' && (window as any).triggerPasswordValidation) {
      try {
        passwordValidation = await (window as any).triggerPasswordValidation()
      } catch (error) {
        console.warn("Could not get password validation:", error)
      }
    }

    // Check if password meets requirements (if validation was successful)
    if (passwordValidation && !passwordValidation.isValid) {
      setErrors({
        newPassword: "La contraseña no cumple con los requisitos de seguridad"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: student.id,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
          resetReason: formData.resetReason.trim()
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessMessage(result.message)
        
        // Wait a moment to show success, then close modal
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(student)
          }
          onClose()
        }, 2000)
      } else {
        // Handle different types of errors
        if (result.message?.includes("contraseña no cumple con los requisitos")) {
          setErrors({ newPassword: result.message })
        } else if (result.message?.includes("Permisos insuficientes")) {
          setErrors({ general: result.message })
        } else if (result.message?.includes("Usuario objetivo no encontrado")) {
          setErrors({ general: result.message })
        } else {
          setErrors({ general: result.message || "Error al restablecer la contraseña" })
        }

        if (onError) {
          onError(result.message || "Error al restablecer la contraseña")
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      const errorMessage = "Error de conexión. Inténtalo de nuevo."
      setErrors({ general: errorMessage })
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Restablecer Contraseña
            </h2>
            {student && (
              <p className="text-slate-600 mt-1">
                Para: {student.name} ({student.email})
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2 text-green-800">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2 text-red-800">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2 p-6">
          {/* Password Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information Display */}
              {student && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-800 mb-2">Información del Estudiante</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">ID:</span>
                      <span className="ml-2 font-medium">{student.studentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Rol:</span>
                      <span className="ml-2 font-medium">{student.role}</span>
                    </div>
                    {student.sede && (
                      <div>
                        <span className="text-slate-600">Sede:</span>
                        <span className="ml-2 font-medium">{student.sede}</span>
                      </div>
                    )}
                    {student.academicYear && (
                      <div>
                        <span className="text-slate-600">Año:</span>
                        <span className="ml-2 font-medium">{student.academicYear}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange("newPassword")}
                    className={`mac-input ${errors.newPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                    placeholder="Ingresa la nueva contraseña"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("new")}
                    disabled={isLoading}
                  >
                    {showPasswords.new ? (
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    className={`mac-input ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
                    placeholder="Confirma la nueva contraseña"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("confirm")}
                    disabled={isLoading}
                  >
                    {showPasswords.confirm ? (
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Reset Reason */}
              <div>
                <label htmlFor="resetReason" className="block text-sm font-medium text-slate-700 mb-2">
                  Motivo del Restablecimiento *
                </label>
                <textarea
                  id="resetReason"
                  value={formData.resetReason}
                  onChange={handleInputChange("resetReason")}
                  rows={3}
                  className={`mac-input resize-none ${errors.resetReason ? 'border-red-300 focus:border-red-500' : ''}`}
                  placeholder="Explica por qué necesitas restablecer la contraseña del estudiante (mínimo 10 caracteres)"
                  disabled={isLoading}
                />
                {errors.resetReason && (
                  <p className="mt-1 text-sm text-red-600">{errors.resetReason}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Este motivo será registrado en el sistema de auditoría
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="mac-button mac-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mac-button mac-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                      <span>Restableciendo...</span>
                    </div>
                  ) : (
                    "Restablecer Contraseña"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password Strength Indicator */}
          <div>
            <PasswordStrengthIndicator 
              password={formData.newPassword}
              checkReuse={false}
              realTimeValidation={true}
              className="sticky top-4"
            />
          </div>
        </div>

        {/* Warning Footer */}
        <div className="bg-yellow-50 border-t border-yellow-200 p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-yellow-800 text-sm">
              <p className="font-medium">Advertencia:</p>
              <p>Esta acción restablecerá la contraseña del estudiante y será registrada en el sistema de auditoría. Asegúrate de informar al estudiante sobre su nueva contraseña de forma segura.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}