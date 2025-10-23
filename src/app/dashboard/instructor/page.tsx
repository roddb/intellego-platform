"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import PasswordResetModal from "@/components/instructor/PasswordResetModal"
import { WeeklyDownloadModal, BatchFeedbackGenerator, APICostDashboard } from "@/components/instructor"
import DatabaseManager from "@/components/instructor/DatabaseManager"
import FeedbackUploadModal from "@/components/instructor/FeedbackUploadModal"
import StudentImpersonationPanel from "@/components/instructor/StudentImpersonationPanel"
import EvaluationStatusGrid from "@/components/evaluation/EvaluationStatusGrid"
import { formatArgentinaWeekRange, toArgentinaDate } from "@/lib/timezone-utils"

// Hierarchical data interfaces - Force deployment for timezone fix
interface HierarchicalStudent {
  id: string;
  name: string;
  email: string;
  studentId: string;
  sede: string;
  academicYear: string;
  division: string;
  subjects: string[];
  reportCount: number;
}

interface HierarchicalWeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  submittedAt: string;
  answers: { [questionId: string]: string };
  questionIds: string[];
  subject: string;
}

interface HierarchicalStudentWithReports extends HierarchicalStudent {
  weeklyReports: HierarchicalWeeklyReport[];
  completedWeeks: number;
}

interface HierarchicalCourse {
  division: string;
  studentCount: number;
  students: HierarchicalStudentWithReports[];
  totalReports: number;
}

interface HierarchicalYear {
  academicYear: string;
  courses: { [division: string]: HierarchicalCourse };
  studentCount: number;
  totalReports: number;
}

interface HierarchicalSubject {
  subject: string;
  years: { [academicYear: string]: HierarchicalYear };
  totalStudents: number;
  totalReports: number;
}

interface HierarchicalInstructorData {
  subjects: { [subject: string]: HierarchicalSubject };
  summary: {
    totalSubjects: number;
    totalStudents: number;
    totalReports: number;
    totalYears: number;
    totalCourses: number;
  };
}

interface NavigationStructure {
  [subject: string]: {
    [year: string]: string[] // array of courses
  }
}

export default function InstructorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [navigationData, setNavigationData] = useState<NavigationStructure>({})
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<HierarchicalStudent | null>(null)
  const [selectedReport, setSelectedReport] = useState<HierarchicalWeeklyReport | null>(null)
  const [students, setStudents] = useState<HierarchicalStudent[]>([])
  const [studentReports, setStudentReports] = useState<HierarchicalWeeklyReport[]>([])
  const [hierarchicalSummary, setHierarchicalSummary] = useState<HierarchicalInstructorData['summary'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string>('')
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false)
  const [studentForPasswordReset, setStudentForPasswordReset] = useState<HierarchicalStudent | null>(null)
  const [isWeeklyDownloadModalOpen, setIsWeeklyDownloadModalOpen] = useState(false)
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false)
  const [isFeedbackUploadModalOpen, setIsFeedbackUploadModalOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "INSTRUCTOR") {
      router.push("/dashboard/student")
      return
    }

    fetchNavigationData()
  }, [session, status, router])

  const fetchNavigationData = async () => {
    try {
      console.log('📊 Fetching navigation data...')
      setLoadingAction('Cargando estructura jerárquica...')
      
      const response = await fetch("/api/instructor/hierarchical?action=navigation", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        setNavigationData(result.data || {})
        
        // Auto-select first subject if available
        const subjects = Object.keys(result.data || {})
        if (subjects.length > 0 && !selectedSubject) {
          setSelectedSubject(subjects[0])
        }
        
        console.log('✅ Navigation data loaded:', subjects.length, 'subjects')
      } else {
        console.error('Failed to fetch navigation data:', response.status)
      }
    } catch (error) {
      console.error("Error fetching navigation data:", error)
    } finally {
      setIsLoading(false)
      setLoadingAction('')
    }
  }

  const fetchStudents = async (subject: string, year: string, course: string) => {
    try {
      setLoadingAction(`Cargando estudiantes de ${course}...`)
      
      const response = await fetch(`/api/instructor/hierarchical?action=students&subject=${encodeURIComponent(subject)}&year=${encodeURIComponent(year)}&course=${encodeURIComponent(course)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        setStudents(result.data || [])
        console.log('✅ Students loaded:', result.data?.length || 0)
      } else {
        console.error('Failed to fetch students:', response.status)
        setStudents([])
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      setStudents([])
    } finally {
      setLoadingAction('')
    }
  }

  const fetchStudentReports = async (userId: string, subject: string) => {
    try {
      setLoadingAction('Cargando reportes del estudiante...')
      
      const response = await fetch(`/api/instructor/hierarchical?action=student-reports&userId=${userId}&subject=${encodeURIComponent(subject)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        setStudentReports(result.data || [])
        console.log('✅ Student reports loaded:', result.data?.length || 0)
      } else {
        console.error('Failed to fetch student reports:', response.status)
        setStudentReports([])
      }
    } catch (error) {
      console.error("Error fetching student reports:", error)
      setStudentReports([])
    } finally {
      setLoadingAction('')
    }
  }

  
  const downloadReports = async (format: 'csv' | 'markdown' | 'json') => {
    try {
      let url = ''
      if (format === 'json') {
        if (selectedStudent && selectedSubject) {
          // Download student-specific reports
          url = `/api/instructor/hierarchical?action=export-student-subject&userId=${selectedStudent.id}&subject=${encodeURIComponent(selectedSubject)}`
        } else {
          // Download complete hierarchical data
          url = `/api/instructor/hierarchical?action=export-complete`
        }
      } else {
        url = `/api/instructor/download?format=${format}`
      }
      
      const response = await fetch(url, { method: "GET" })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = downloadUrl
        
        if (format === 'json' && selectedStudent) {
          a.download = `${selectedStudent.studentId}_${selectedStudent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedSubject}_reportes.json`
        } else {
          a.download = `intellego_reportes.${format}`
        }
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading reports:", error)
    }
  }

  const downloadSingleReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/instructor/hierarchical?action=export-report&reportId=${reportId}`, {
        method: "GET",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `reporte_${reportId}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading single report:", error)
    }
  }

  // Event handlers for hierarchical navigation
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    setSelectedYear('')
    setSelectedCourse('')
    setSelectedStudent(null)
    setStudents([])
    setStudentReports([])
    setSelectedReport(null)
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    setSelectedCourse('')
    setSelectedStudent(null)
    setStudents([])
    setStudentReports([])
    setSelectedReport(null)
  }

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course)
    setSelectedStudent(null)
    setStudentReports([])
    setSelectedReport(null)
    
    if (selectedSubject && selectedYear && course) {
      fetchStudents(selectedSubject, selectedYear, course)
    }
  }

  const handleStudentSelect = (student: HierarchicalStudent) => {
    setSelectedStudent(student)
    setSelectedReport(null)
    
    if (selectedSubject) {
      fetchStudentReports(student.id, selectedSubject)
    }
  }

  const handleReportSelect = (report: HierarchicalWeeklyReport) => {
    setSelectedReport(report)
  }

  const handlePasswordResetClick = (student: HierarchicalStudent) => {
    setStudentForPasswordReset(student)
    setIsPasswordResetModalOpen(true)
  }

  const handlePasswordResetModalClose = () => {
    setIsPasswordResetModalOpen(false)
    setStudentForPasswordReset(null)
  }

  const handlePasswordResetSuccess = (student: HierarchicalStudent) => {
    console.log(`Password reset successful for ${student.name}`)
    // Could add additional success handling here like showing a toast notification
  }

  const handlePasswordResetError = (error: string) => {
    console.error("Password reset error:", error)
    // Could add additional error handling here like showing a toast notification
  }
  

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{loadingAction || 'Cargando...'}</p>
        </div>
      </div>
    )
  }

  const subjects = Object.keys(navigationData)
  const years = selectedSubject ? Object.keys(navigationData[selectedSubject] || {}) : []
  const courses = selectedSubject && selectedYear ? navigationData[selectedSubject][selectedYear] || [] : []

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard del Instructor - Vista Jerárquica
          </h1>
          <p className="text-slate-600 mb-4">
            Bienvenido, {session?.user?.name}
          </p>
          
          {/* Admin Database and Feedback Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/dashboard/instructor/evaluation/correct')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Corregir Exámenes
              </button>

              <button
                onClick={() => setIsDatabaseManagerOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Administrar Base de Datos
              </button>

              <button
                onClick={() => setIsFeedbackUploadModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Cargar Devoluciones
              </button>
            </div>
          </div>

          {/* Batch Feedback Generator - AI Automation */}
          <div className="mb-6">
            <BatchFeedbackGenerator />
          </div>

          {/* Evaluation Status Grid - Evaluation Tracking */}
          <div className="mb-6">
            <EvaluationStatusGrid />
          </div>

          {/* API Cost Dashboard - Instructor Only */}
          <div className="mb-6">
            <APICostDashboard />
          </div>

          {/* Student Impersonation Panel */}
          <div className="mb-6">
            <StudentImpersonationPanel />
          </div>
        </div>
        
        {/* Loading Overlay */}
        {loadingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-600">{loadingAction}</p>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        <PasswordResetModal
          isOpen={isPasswordResetModalOpen}
          onClose={handlePasswordResetModalClose}
          student={studentForPasswordReset}
          onSuccess={(student) => handlePasswordResetSuccess(student as HierarchicalStudent)}
          onError={handlePasswordResetError}
        />

        {/* Weekly Download Modal */}
        <WeeklyDownloadModal
          isOpen={isWeeklyDownloadModalOpen}
          onClose={() => setIsWeeklyDownloadModalOpen(false)}
          selectedSubject={selectedSubject}
          sede="N/A" // TODO: Get from user session or selected student
          academicYear={selectedYear}
          division={selectedCourse}
        />

        {/* Database Manager Modal */}
        <DatabaseManager
          isOpen={isDatabaseManagerOpen}
          onClose={() => setIsDatabaseManagerOpen(false)}
        />

        {/* Feedback Upload Modal */}
        <FeedbackUploadModal
          isOpen={isFeedbackUploadModalOpen}
          onClose={() => setIsFeedbackUploadModalOpen(false)}
        />
      </main>
    </div>
  )
}