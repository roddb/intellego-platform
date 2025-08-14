"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import PasswordStrengthIndicator from "./PasswordStrengthIndicator"

interface PasswordChangeFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

interface FormErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

export default function PasswordChangeForm({
  onSuccess,
  onError,
  className = ""
}: PasswordChangeFormProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [successMessage, setSuccessMessage] = useState("")

  const clearErrors = () => {
    setErrors({})
  }

  const clearMessages = () => {
    setSuccessMessage("")
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = "La contraseña actual es requerida"
    }

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

    if (formData.currentPassword === formData.newPassword && formData.currentPassword) {
      newErrors.newPassword = "La nueva contraseña debe ser diferente a la actual"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
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
      const response = await fetch("/api/user/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccessMessage(result.message)
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        // Handle different types of errors
        if (result.message === "La contraseña actual es incorrecta.") {
          setErrors({ currentPassword: result.message })
        } else if (result.message?.includes("contraseña no cumple con los requisitos")) {
          setErrors({ newPassword: result.message })
        } else if (result.message?.includes("contraseña fue utilizada recientemente")) {
          setErrors({ newPassword: result.message })
        } else {
          setErrors({ general: result.message || "Error al cambiar la contraseña" })
        }

        if (onError) {
          onError(result.message || "Error al cambiar la contraseña")
        }
      }
    } catch (error) {
      console.error("Error changing password:", error)
      const errorMessage = "Error de conexión. Inténtalo de nuevo."
      setErrors({ general: errorMessage })
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="mac-card p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 10-8 0v3h8V9z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Debes iniciar sesión para cambiar tu contraseña</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-800 text-lg">¡Contraseña actualizada!</h4>
              <p className="text-emerald-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-red-800 text-lg">Error al cambiar contraseña</h4>
              <p className="text-red-700">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Password Change Card */}
      <div className="p-0">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 10-8 0v3h8V9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Cambiar Contraseña</h2>
          <p className="text-slate-600 text-lg max-w-md mx-auto">
            Actualiza tu contraseña para mantener tu cuenta segura y protegida
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Current Password */}
            <div className="space-y-3">
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Contraseña Actual</span>
                </div>
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange("currentPassword")}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-slate-800 placeholder-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 focus:from-white focus:to-slate-50 ${
                    errors.currentPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
                  } group-hover:border-slate-300`}
                  placeholder="Ingresa tu contraseña actual"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 hover:text-slate-600"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? (
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
              {errors.currentPassword && (
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{errors.currentPassword}</p>
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-3">
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 10-8 0v3h8V9z" />
                  </svg>
                  <span>Nueva Contraseña</span>
                </div>
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange("newPassword")}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-slate-800 placeholder-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 focus:from-white focus:to-slate-50 ${
                    errors.newPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
                  } group-hover:border-slate-300`}
                  placeholder="Ingresa tu nueva contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 hover:text-slate-600"
                  onClick={() => togglePasswordVisibility("new")}
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
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{errors.newPassword}</p>
                </div>
              )}
              
              {/* Password Strength Indicator - Integrated below new password */}
              {formData.newPassword && (
                <div className="mt-4">
                  <PasswordStrengthIndicator 
                    password={formData.newPassword}
                    checkReuse={true}
                    realTimeValidation={true}
                    className="rounded-2xl border-0 shadow-lg backdrop-blur-sm"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Confirmar Nueva Contraseña</span>
                </div>
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 font-medium text-slate-800 placeholder-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 focus:from-white focus:to-slate-50 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
                  } group-hover:border-slate-300`}
                  placeholder="Confirma tu nueva contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-200 hover:text-slate-600"
                  onClick={() => togglePasswordVisibility("confirm")}
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
                <div className="flex items-center space-x-2 mt-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{errors.confirmPassword}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-purple-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Actualizando contraseña...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Cambiar Contraseña</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}