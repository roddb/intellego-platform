"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import AITutor from "@/components/AITutor"
import StudentProfile from "@/components/StudentProfile"
import ReportsUnified from "@/components/ReportsUnified"
import IntelligentOrganizer from "@/components/calendar/IntelligentOrganizer"
import { LayoutProvider, useLayout } from "@/components/layout/LayoutProvider"
import Sidebar from "@/components/layout/Sidebar"
import WelcomeDashboard from "@/components/layout/WelcomeDashboard"
import ModuleContainer from "@/components/layout/ModuleContainer"

function StudentDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activeModule, sidebarOpen, setSidebarOpen } = useLayout()
  const [canSubmit, setCanSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "STUDENT") {
      router.push("/dashboard/instructor")
      return
    }

    // Check if user can submit this week
    fetchSubmissionStatus()
    
    // Add entrance animation after component mounts
    const timer = setTimeout(() => {
      setHasEntered(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [session, status, router])

  const fetchSubmissionStatus = async () => {
    try {
      const response = await fetch('/api/weekly-reports')
      if (response.ok) {
        const data = await response.json()
        setCanSubmit(data.canSubmitThisWeek)
      }
    } catch (error) {
      console.error('Error fetching submission status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportSubmit = async (data: any) => {
    try {
      // First, upload files if any
      let uploadedFiles: any[] = []
      if (data.attachments && data.attachments.length > 0) {
        const fileFormData = new FormData()
        data.attachments.forEach((file: File) => {
          fileFormData.append('files', file)
        })

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          uploadedFiles = uploadResult.files
        } else {
          throw new Error('Error al subir los archivos')
        }
      }

      // Then submit the report with file references
      const reportData = {
        ...data,
        attachments: uploadedFiles
      }

      const response = await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        setSuccessMessage("¡Reporte enviado exitosamente!")
        setCanSubmit(false)
        setTimeout(() => setSuccessMessage(""), 5000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al enviar el reporte")
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "STUDENT") {
    return null
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'welcome':
        return <WelcomeDashboard />
      
      case 'profile':
        return (
          <ModuleContainer title="Mi Perfil" description="Información personal y configuraciones">
            <StudentProfile userId={session.user.id} />
          </ModuleContainer>
        )
      
      case 'ai-tutor':
        return (
          <ModuleContainer title="IA Tutora Personal" description="Ejercicios adaptativos y aprendizaje personalizado">
            <AITutor />
          </ModuleContainer>
        )
      
      case 'reports':
        return (
          <ReportsUnified
            userId={session.user.id}
            onReportSubmit={handleReportSubmit}
            canSubmit={canSubmit}
            isLoading={isLoading}
            successMessage={successMessage}
          />
        )
      
      case 'study-organizer':
        return <IntelligentOrganizer />
      
      default:
        return <WelcomeDashboard />
    }
  }

  return (
    <div className={`min-h-screen ${hasEntered ? 'page-transition-enter' : ''}`}>
      {/* Navigation */}
      <Navigation />

      {/* Main Content Container */}
      <div 
        className={`transition-all duration-500 ease-out ${hasEntered ? 'bounce-enter' : ''} ${
          sidebarOpen ? 'ml-80' : 'ml-0'
        }`}
        onClick={() => {
          if (sidebarOpen) {
            setSidebarOpen(false)
          }
        }}
      >
        {/* Main Content */}
        <main className="px-6 py-8">
          {renderModule()}
        </main>
      </div>
      
      {/* Sidebar */}
      <Sidebar />
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <LayoutProvider>
      <StudentDashboardContent />
    </LayoutProvider>
  )
}