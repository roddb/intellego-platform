"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import PasswordChangeForm from "@/components/PasswordChangeForm"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Allow both students and instructors to access profile
    if (session.user.role !== "STUDENT" && session.user.role !== "INSTRUCTOR") {
      router.push("/")
      return
    }

    setIsLoading(false)
  }, [session, status, router])

  const handlePasswordChangeSuccess = () => {
    // Could add additional success handling here
    console.log("Password changed successfully")
  }

  const handlePasswordChangeError = (error: string) => {
    // Could add additional error handling here
    console.error("Password change error:", error)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Mi Perfil
          </h1>
          <p className="text-slate-600">
            Administra tu cuenta y configuración de seguridad
          </p>
        </div>

        {/* Profile Information Card */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Información Personal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <p className="text-slate-900 font-medium">{session?.user?.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <p className="text-slate-900 font-medium">{session?.user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol en el Sistema
                </label>
                <p className="text-slate-900 font-medium">
                  {session?.user?.role === "STUDENT" ? "Estudiante" : 
                   session?.user?.role === "INSTRUCTOR" ? "Instructor" : session?.user?.role}
                </p>
              </div>

              {/* Show student-specific information */}
              {session?.user?.role === "STUDENT" && (
                <>
                  {session?.user?.studentId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ID de Estudiante
                      </label>
                      <p className="text-slate-900 font-medium">{session.user.studentId}</p>
                    </div>
                  )}
                  
                  {session?.user?.sede && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sede
                      </label>
                      <p className="text-slate-900 font-medium">{session.user.sede}</p>
                    </div>
                  )}
                  
                  {session?.user?.academicYear && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Año Académico
                      </label>
                      <p className="text-slate-900 font-medium">{session.user.academicYear}</p>
                    </div>
                  )}
                  
                  {session?.user?.division && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        División
                      </label>
                      <p className="text-slate-900 font-medium">{session.user.division}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <PasswordChangeForm
              onSuccess={handlePasswordChangeSuccess}
              onError={handlePasswordChangeError}
              className=""
            />
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Seguridad de tu Cuenta
              </h3>
              <div className="text-blue-800 space-y-2">
                <p>• Cambia tu contraseña regularmente para mantener tu cuenta segura</p>
                <p>• Usa una contraseña única que no hayas utilizado en otros sitios</p>
                <p>• Tu contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales</p>
                <p>• No compartas tus credenciales con nadie</p>
                {session?.user?.role === "STUDENT" && (
                  <p>• Si tienes problemas para acceder, contacta a tu instructor</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Help */}
        <div className="mt-8 text-center">
          <div className="inline-flex space-x-4">
            {session?.user?.role === "STUDENT" ? (
              <button
                onClick={() => router.push("/dashboard/student")}
                className="mac-button mac-button-secondary"
              >
                ← Volver al Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push("/dashboard/instructor")}
                className="mac-button mac-button-secondary"
              >
                ← Volver al Dashboard
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}