"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import PasswordResetModal from "@/components/instructor/PasswordResetModal"
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
          
          {/* Hierarchical Navigation */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Navegación por Jerarquía</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Materia</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Seleccionar materia...</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Año Académico</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => handleYearChange(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Seleccionar año...</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Curso/División</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={!selectedSubject || !selectedYear}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Seleccionar curso...</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Breadcrumb */}
            {(selectedSubject || selectedYear || selectedCourse) && (
              <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600">
                <span className="font-medium">Ruta actual:</span>
                <span className="ml-2">
                  {selectedSubject && <span className="text-teal-600 font-medium">{selectedSubject}</span>}
                  {selectedYear && <span> → <span className="text-teal-600 font-medium">{selectedYear}</span></span>}
                  {selectedCourse && <span> → <span className="text-teal-600 font-medium">{selectedCourse}</span></span>}
                  {selectedStudent && <span> → <span className="text-teal-600 font-medium">{selectedStudent.name}</span></span>}
                </span>
              </div>
            )}
          </div>
          
          {/* Summary Cards */}
          {selectedSubject && selectedYear && selectedCourse && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">{students.length}</div>
                <div className="text-sm text-slate-600">Estudiantes en {selectedCourse}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">{students.reduce((sum, s) => sum + s.reportCount, 0)}</div>
                <div className="text-sm text-slate-600">Total Reportes</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">
                  {students.length > 0 ? (students.reduce((sum, s) => sum + s.reportCount, 0) / students.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-slate-600">Promedio por Estudiante</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Students List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {selectedSubject && selectedYear && selectedCourse ? (
                    `Estudiantes de ${selectedSubject} - ${selectedYear} ${selectedCourse} (${students.length})`
                  ) : (
                    'Selecciona materia, año y curso para ver estudiantes'
                  )}
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadReports('json')}
                  disabled={!selectedStudent}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  JSON
                </button>
                <button
                  onClick={() => downloadReports('csv')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={() => downloadReports('markdown')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  MD
                </button>
              </div>
            </div>
            
            {!selectedSubject || !selectedYear || !selectedCourse ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Estructura Jerárquica
                </h3>
                <p className="text-slate-600">
                  Utiliza los selectores de arriba para navegar por: Materia → Año → Curso → Estudiantes → Reportes Semanales
                </p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Sin estudiantes registrados
                </h3>
                <p className="text-slate-600">
                  No hay estudiantes registrados en {selectedSubject} para {selectedYear} {selectedCourse}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className={`border border-slate-200 rounded-lg p-4 transition-colors cursor-pointer ${
                      selectedStudent?.id === student.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">
                          {student.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {student.studentId} • {student.email}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {student.sede} • {student.academicYear} {student.division}
                        </p>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-medium">
                          {student.reportCount} reportes
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePasswordResetClick(student)
                          }}
                          className="px-2 py-1 text-xs text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 rounded transition-colors"
                          title="Restablecer contraseña del estudiante"
                        >
                          🔐 Reset
                        </button>
                      </div>
                    </div>
                    
                    {/* Subjects Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {student.subjects.map((subject, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Reports */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedStudent ? `Reportes de ${selectedStudent.name}` : 'Reportes del Estudiante'}
              </h2>
              {selectedStudent && (
                <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                  {studentReports.length} reportes
                </span>
              )}
            </div>
            
            {!selectedStudent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">
                  Selecciona un estudiante para ver sus reportes semanales
                </p>
              </div>
            ) : studentReports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">
                  Este estudiante no ha enviado reportes para {selectedSubject}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {studentReports.map((report) => (
                  <div 
                    key={report.id} 
                    className={`border border-slate-200 rounded-lg p-3 transition-colors cursor-pointer ${
                      selectedReport?.id === report.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleReportSelect(report)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-slate-800 text-sm">
                          Semana del {formatArgentinaWeekRange(report.weekStart, report.weekEnd)}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Enviado: {toArgentinaDate(report.submittedAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                          {Object.keys(report.answers).length} respuestas
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadSingleReport(report.id)
                          }}
                          className="text-teal-600 hover:text-teal-700 text-xs underline"
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected Report Details */}
            {selectedReport && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-medium text-slate-800 mb-4">
                  Detalles - Semana del {formatArgentinaWeekRange(selectedReport.weekStart, selectedReport.weekEnd)}
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedReport.answers).map(([questionId, answer]) => (
                    <div key={questionId} className="border-l-4 border-teal-200 pl-3">
                      <h4 className="font-medium text-slate-700 text-sm mb-1">
                        Pregunta {questionId}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
      </main>
    </div>
  )
}