"use client"

import { useEffect, useState } from "react"

interface PasswordStrength {
  score: number
  level: string
  description: string
}

interface PasswordEntropy {
  score: number
  level: string
  description: string
}

interface PasswordRequirement {
  required: boolean
  current?: number
  meets: boolean
  message: string
  allowedChars?: string
}

interface PasswordValidation {
  isValid: boolean
  feedback: {
    strength: PasswordStrength
    entropy: PasswordEntropy
    requirements: {
      minLength: PasswordRequirement
      maxLength: PasswordRequirement
      uppercase: PasswordRequirement
      lowercase: PasswordRequirement
      numbers: PasswordRequirement
      specialChars: PasswordRequirement
    }
    reuse: {
      checked: boolean
      isReused?: boolean
      message: string
    }
    recommendations: string[]
  }
  errors: string[]
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
  checkReuse?: boolean
  realTimeValidation?: boolean
}

export default function PasswordStrengthIndicator({ 
  password, 
  className = "",
  checkReuse = false,
  realTimeValidation = true
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState<PasswordValidation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Validate password when it changes (with debouncing for performance)
  useEffect(() => {
    if (!password || password.length === 0) {
      setValidation(null)
      return
    }

    if (!realTimeValidation) return

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer for debounced validation
    const newTimer = setTimeout(async () => {
      await validatePassword(password)
    }, 300)

    setDebounceTimer(newTimer)

    // Cleanup function
    return () => {
      if (newTimer) {
        clearTimeout(newTimer)
      }
    }
  }, [password, checkReuse, realTimeValidation])

  const validatePassword = async (passwordToValidate: string) => {
    if (!passwordToValidate) {
      setValidation(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/password/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: passwordToValidate,
          checkReuse
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setValidation(result)
        }
      } else {
        console.error("Password validation failed:", response.status)
      }
    } catch (error) {
      console.error("Error validating password:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger manual validation (for form submission)
  const triggerValidation = async () => {
    if (!password) return null
    await validatePassword(password)
    return validation
  }

  // Expose validation trigger to parent components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Adding validation function to window for parent access
      ;(window as any).triggerPasswordValidation = triggerValidation
    }
  }, [password, validation])

  if (!password || password.length === 0) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-white/80 to-slate-50/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-600 font-medium">Validando contraseña...</span>
        </div>
      </div>
    )
  }

  if (!validation) {
    return null
  }

  const getStrengthColor = (score: number) => {
    if (score <= 1) return "text-red-600 bg-red-50 border-red-200"
    if (score <= 2) return "text-orange-600 bg-orange-50 border-orange-200"
    if (score <= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    if (score <= 4) return "text-blue-600 bg-blue-50 border-blue-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getProgressColor = (score: number) => {
    if (score <= 1) return "bg-red-500"
    if (score <= 2) return "bg-orange-500"
    if (score <= 3) return "bg-yellow-500"
    if (score <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getRequirementIcon = (meets: boolean, required: boolean) => {
    if (!required) return "⚪"
    return meets ? "✅" : "❌"
  }

  const getProgressGradient = (score: number) => {
    if (score <= 1) return "#ef4444, #dc2626"
    if (score <= 2) return "#f97316, #ea580c"
    if (score <= 3) return "#eab308, #ca8a04"
    if (score <= 4) return "#3b82f6, #2563eb"
    return "#10b981, #059669"
  }

  const strength = validation.feedback.strength
  const entropy = validation.feedback.entropy
  const requirements = validation.feedback.requirements
  const strengthColorClass = getStrengthColor(strength.score)
  const progressColorClass = getProgressColor(strength.score)

  return (
    <div className={`bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden ${className}`}>
      {/* Header with overall status */}
      <div className="p-6 bg-gradient-to-r from-slate-50/50 to-white/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Fortaleza de la Contraseña</h3>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm ${strengthColorClass}`}>
            {strength.level}
          </div>
        </div>
        
        {/* Strength Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-700">Puntuación: {strength.score}/5</span>
            <span className="text-slate-700">Entropía: {entropy.score} bits</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ease-out shadow-lg ${progressColorClass}`}
              style={{ 
                width: `${(strength.score / 5) * 100}%`,
                background: `linear-gradient(90deg, ${getProgressGradient(strength.score)})`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="p-6 border-b border-slate-100/50">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center space-x-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Requisitos</span>
        </h4>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${requirements.minLength.meets ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {requirements.minLength.meets ? (
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-slate-700">Longitud mínima</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 px-2 py-1 bg-slate-100 rounded-lg">
              {requirements.minLength.current}/{requirements.minLength.required}
            </span>
          </div>

          {requirements.uppercase.required && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${requirements.uppercase.meets ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {requirements.uppercase.meets ? (
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">Mayúsculas (A-Z)</span>
              </div>
            </div>
          )}

          {requirements.lowercase.required && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${requirements.lowercase.meets ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {requirements.lowercase.meets ? (
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">Minúsculas (a-z)</span>
              </div>
            </div>
          )}

          {requirements.numbers.required && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${requirements.numbers.meets ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {requirements.numbers.meets ? (
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">Números (0-9)</span>
              </div>
            </div>
          )}

          {requirements.specialChars.required && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${requirements.specialChars.meets ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {requirements.specialChars.meets ? (
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">Caracteres especiales</span>
              </div>
              {requirements.specialChars.allowedChars && (
                <span className="text-xs text-slate-500 font-mono px-2 py-1 bg-slate-100 rounded">
                  {requirements.specialChars.allowedChars}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password Reuse Check */}
      {checkReuse && validation.feedback.reuse.checked && (
        <div className="p-6 border-b border-slate-100/50">
          <div className={`flex items-center space-x-3 p-4 rounded-xl ${validation.feedback.reuse.isReused ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${validation.feedback.reuse.isReused ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {validation.feedback.reuse.isReused ? (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold ${validation.feedback.reuse.isReused ? 'text-red-800' : 'text-emerald-800'}`}>
                {validation.feedback.reuse.isReused ? 'Contraseña reutilizada' : 'Contraseña única'}
              </p>
              <p className={`text-sm ${validation.feedback.reuse.isReused ? 'text-red-700' : 'text-emerald-700'}`}>
                {validation.feedback.reuse.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {validation.feedback.recommendations.length > 0 && (
        <div className="p-6 border-b border-slate-100/50">
          <h4 className="font-semibold text-slate-700 mb-4 flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Recomendaciones</span>
          </h4>
          <div className="space-y-3">
            {validation.feedback.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-amber-800 font-medium">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entropy Information */}
      <div className="p-6 bg-gradient-to-r from-slate-50/50 to-indigo-50/50 rounded-b-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Entropía: {entropy.level}</span>
          <span className="text-sm font-bold text-slate-700 px-3 py-1 bg-white/70 rounded-full border">
            {entropy.score} bits
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{entropy.description}</p>
      </div>
    </div>
  )
}