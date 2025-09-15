"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import WeeklyReportForm from "@/components/WeeklyReportForm"
import FeedbackViewer from "@/components/student/FeedbackViewer"
import MonthlyReportsHistory from "@/components/student/MonthlyReportsHistory"
import { useChunkErrorHandler } from "@/components/ErrorBoundary"
import { TrendingUp } from 'lucide-react'
// Import timezone utilities with dynamic import to prevent chunk loading issues
import * as TimezoneUtils from "@/lib/timezone-utils"
const { toArgentinaDate, getCurrentArgentinaDate, isCurrentWeekInArgentina, isPastWeekInArgentina, isFutureWeekInArgentina } = TimezoneUtils

// Helper functions for date management
function getWeekStart(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1)
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function getWeekEnd(weekStart: Date): Date {
  const result = new Date(weekStart)
  result.setDate(weekStart.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

function getMonthWeeks(year: number, month: number): Array<{start: Date, end: Date}> {
  const weeks = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let currentWeekStart = getWeekStart(firstDay)
  
  while (currentWeekStart <= lastDay) {
    const weekEnd = getWeekEnd(currentWeekStart)
    weeks.push({
      start: new Date(currentWeekStart),
      end: new Date(weekEnd)
    })
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  }
  
  return weeks
}

export default function StudentDashboard() {
  // Initialize chunk error handler for better error recovery
  useChunkErrorHandler()
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userSubjects, setUserSubjects] = useState<string[]>([])
  const [canSubmitBySubject, setCanSubmitBySubject] = useState<{[subject: string]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [reportsBySubject, setReportsBySubject] = useState<{[subject: string]: any[]}>({})
  const [monthWeeksBySubject, setMonthWeeksBySubject] = useState<{[subject: string]: Array<{start: Date, end: Date, hasReport: boolean, isCurrentWeek: boolean, isPastWeek: boolean, isFutureWeek: boolean}>}>({})
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeTab, setActiveTab] = useState<'reports' | 'profile' | 'history' | 'progress'>('reports')
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [selectedFeedbackWeek, setSelectedFeedbackWeek] = useState<{weekStart: string, subject: string} | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Allow instructor viewing as student
    const isInstructor = session.user.role === "INSTRUCTOR"
    const isImpersonating = session.user.isImpersonating === true
    const isStudent = session.user.role === "STUDENT"

    if (!isStudent && (!isInstructor || !isImpersonating)) {
      router.push("/dashboard/instructor")
      return
    }

    fetchStudentData()
    calculateMonthWeeksForAllSubjects()
  }, [session, status, router])

  // Handle scroll for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or near top
        setHeaderVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setHeaderVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const fetchStudentData = async () => {
    try {
      // If impersonating, pass the student ID in the request
      const url = session?.user?.isImpersonating && session?.user?.impersonating
        ? `/api/weekly-reports?studentId=${session.user.impersonating.studentId}`
        : "/api/weekly-reports"

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserSubjects(data.subjects || [])
        setCanSubmitBySubject(data.canSubmitBySubject || {})
        setReportsBySubject(data.reportsBySubject || {})
        
        // Update month weeks with report data for each subject
        updateMonthWeeksWithReportsBySubject(data.reportsBySubject || {}, data.subjects || [])
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMonthWeeksForAllSubjects = () => {
    const now = new Date()
    const weeks = getMonthWeeks(now.getFullYear(), now.getMonth())
    const currentWeekStart = getWeekStart(now)
    
    const weeksWithStatus = weeks.map(week => {
      const isCurrentWeek = week.start.getTime() === currentWeekStart.getTime()
      const isPastWeek = week.end < now && !isCurrentWeek
      const isFutureWeek = week.start > now && !isCurrentWeek
      
      return {
        ...week,
        hasReport: false,
        isCurrentWeek,
        isPastWeek,
        isFutureWeek
      }
    })
    
    // Initialize weeks for each subject (will be updated when data is fetched)
    setMonthWeeksBySubject({})
  }

  const updateMonthWeeksWithReportsBySubject = (reportsBySubjectData: {[subject: string]: any[]}, allUserSubjects: string[]) => {
    const updatedWeeksBySubject: {[subject: string]: typeof monthWeeksBySubject[string]} = {}
    
    // Initialize calendar for ALL user subjects, not just those with reports
    allUserSubjects.forEach(subject => {
      const now = getCurrentArgentinaDate()
      const weeks = getMonthWeeks(now.getFullYear(), now.getMonth())
      const currentWeekStart = getWeekStart(now)
      
      const weeksWithStatus = weeks.map(week => {
        const isCurrentWeek = isCurrentWeekInArgentina(week.start, week.end)
        const isPastWeek = isPastWeekInArgentina(week.end) && !isCurrentWeek
        const isFutureWeek = isFutureWeekInArgentina(week.start) && !isCurrentWeek
        
        // Check if this subject has reports and if any match this week
        // Use date range comparison to handle reports submitted within any part of the week
        const hasReport = reportsBySubjectData[subject]?.some(report => {
          const reportWeekStart = new Date(report.weekStart)
          const reportWeekEnd = new Date(report.weekEnd)
          const weekStart = new Date(week.start)
          const weekEnd = new Date(week.end)
          
          // Check if report's date range overlaps with calendar week's date range
          return (reportWeekStart <= weekEnd && reportWeekEnd >= weekStart)
        }) || false
        
        return {
          ...week,
          hasReport,
          isCurrentWeek,
          isPastWeek,
          isFutureWeek
        }
      })
      
      updatedWeeksBySubject[subject] = weeksWithStatus
    })
    
    setMonthWeeksBySubject(updatedWeeksBySubject)
  }

  const handleSubmissionSuccess = (subject: string) => {
    setSuccessMessage(`¡Reporte de ${subject} enviado exitosamente!`)
    setCanSubmitBySubject(prev => ({ ...prev, [subject]: false }))
    
    // Fetch fresh data from server first to get the actual report data
    refreshDataAfterSubmission().then(() => {
      // After getting fresh data, update the calendar to reflect the new report
      // This ensures the calendar uses the actual report data from the database
      // The reportsBySubject and userSubjects will be updated by the fetch, 
      // so we need to wait a bit for the state to update
      setTimeout(() => {
        // Use current state values for the calendar update
        updateMonthWeeksWithReportsBySubject(reportsBySubject, userSubjects)
      }, 100)
    })
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  const handleViewFeedback = (weekStart: string, subject: string) => {
    setSelectedFeedbackWeek({ weekStart, subject })
    setFeedbackModalOpen(true)
  }

  const refreshDataAfterSubmission = async () => {
    try {
      const response = await fetch("/api/weekly-reports", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Update all state including reports data for calendar recalculation
        setUserSubjects(data.subjects || [])
        setCanSubmitBySubject(data.canSubmitBySubject || {})
        setReportsBySubject(data.reportsBySubject || {})
      }
    } catch (error) {
      console.error("Error refreshing student data:", error)
    }
  }



  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation className={`transition-transform duration-300 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard del Estudiante
          </h1>
          <p className="text-slate-600">
            Bienvenido, {session?.user?.name}
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📝 Reportes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📅 Historial
            </button>
            <button
              onClick={() => router.push('/dashboard/student/progress')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 text-slate-600 hover:text-slate-800`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Progreso</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              ⚙️ Perfil
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'reports' && (
          /* Adaptive Layout by User Subjects */
          userSubjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Sin materias registradas
              </h3>
              <p className="text-slate-600">
                No tienes materias registradas. Contacta a tu instructor.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {userSubjects.map(subject => (
                <div key={subject} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-6">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      subject === 'Física' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {subject === 'Física' ? '⚛️ Física' : '🧪 Química'} 
                    </h2>
                  </div>
                  
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Subject Report Form */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-4">
                        💬 Reporte Semanal - {subject}
                      </h3>
                      
                      {(() => {
                        // Check if current week has a report for this subject
                        const currentWeekHasReport = monthWeeksBySubject[subject]?.some(week => 
                          week.isCurrentWeek && week.hasReport
                        ) || false
                        
                        if (canSubmitBySubject[subject] && !currentWeekHasReport) {
                          // Can submit and no report exists for current week
                          return (
                            <WeeklyReportForm 
                              subject={subject}
                              onSubmissionSuccess={() => handleSubmissionSuccess(subject)} 
                            />
                          )
                        } else if (currentWeekHasReport) {
                          // Report exists for current week
                          return (
                            <div className="text-center py-6 bg-slate-50 rounded-lg">
                              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-md font-medium text-slate-700 mb-1">
                                Reporte de {subject} enviado
                              </h4>
                              <p className="text-sm text-slate-500">
                                Ya enviaste tu reporte de {subject} esta semana.
                              </p>
                            </div>
                          )
                        } else {
                          // Cannot submit (either not current week or other restrictions)
                          return (
                            <div className="text-center py-6 bg-slate-100 rounded-lg">
                              <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-md font-medium text-slate-600 mb-1">
                                Fuera del período de entrega
                              </h4>
                              <p className="text-sm text-slate-500">
                                Los reportes se entregan solo durante la semana correspondiente.
                              </p>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {/* Subject Monthly Calendar */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-4">
                        📅 Calendario - {subject}
                      </h3>
                      
                      <div className="mb-3">
                        <p className="text-sm text-slate-600">
                          {monthWeeksBySubject[subject]?.filter(w => w.hasReport).length || 0} de{' '}
                          {monthWeeksBySubject[subject]?.length || 0} semanas completadas
                        </p>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {monthWeeksBySubject[subject]?.map((week, index) => {
                          const weekStartStr = toArgentinaDate(week.start).slice(0, 5) // DD/MM format
                          const weekEndStr = toArgentinaDate(week.end).slice(0, 5) // DD/MM format
                          
                          return (
                            <div 
                              key={index}
                              className={`p-2 rounded border transition-colors text-sm ${
                                week.hasReport 
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : week.isPastWeek
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : week.isCurrentWeek 
                                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  Semana {index + 1} ({weekStartStr} - {weekEndStr}) ART
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {week.hasReport ? '✅ Enviado' : 
                                     week.isPastWeek ? '🔴 Atrasado' : 
                                     week.isCurrentWeek ? '🟡 Actual' : 
                                     '⚪ Futuro'}
                                  </span>
                                  {week.hasReport && (
                                    <button
                                      onClick={() => {
                                        const weekStartISO = week.start.toISOString().split('T')[0]
                                        handleViewFeedback(weekStartISO, subject)
                                      }}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      title="Ver devolución"
                                    >
                                      📝 Devolución
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }) || (
                          <div className="text-center py-4 text-slate-500 text-sm">
                            Cargando calendario...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && session?.user?.id && (
          <div className="space-y-8">
            <MonthlyReportsHistory 
              userId={session.user.id}
              className="w-full"
            />
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                📊 Resumen de Entregas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(reportsBySubject).flat().length}
                  </div>
                  <div className="text-sm text-slate-600">Reportes Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userSubjects.length}
                  </div>
                  <div className="text-sm text-slate-600">Materias Activas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const totalReports = Object.values(reportsBySubject).flat().length;
                      const totalSubjects = userSubjects.length;
                      
                      // Calculate actual weeks in the current month that have passed
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = now.getMonth();
                      const firstDayOfMonth = new Date(year, month, 1);
                      
                      // Get Monday of the first week of the month
                      let firstMonday = new Date(firstDayOfMonth);
                      const dayOfWeek = firstMonday.getDay();
                      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                      firstMonday.setDate(firstMonday.getDate() + diff);
                      
                      // Count complete weeks that have ended
                      let weeksElapsed = 0;
                      let currentWeekStart = new Date(firstMonday);
                      
                      while (currentWeekStart < now) {
                        const weekEnd = new Date(currentWeekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        
                        // Only count if the week has ended (we're past Sunday)
                        if (weekEnd < now) {
                          weeksElapsed++;
                        }
                        
                        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
                        
                        // Stop if we've reached the next month
                        if (currentWeekStart.getMonth() !== month && currentWeekStart > now) {
                          break;
                        }
                      }
                      
                      // Calculate expected reports (only for completed weeks)
                      const expectedReports = totalSubjects * weeksElapsed;
                      
                      // Calculate percentage
                      if (expectedReports === 0) return 0;
                      return Math.round((totalReports / expectedReports) * 100);
                    })()}%
                  </div>
                  <div className="text-sm text-slate-600">Tasa de Entrega</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.values(reportsBySubject).flat().filter((r: any) => r.hasFeedback).length || 0}
                  </div>
                  <div className="text-sm text-slate-600">Con Devolución</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Profile Information Card */}
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
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Gestión de Cuenta
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800">Cambiar Contraseña</h3>
                    <p className="text-sm text-slate-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="mac-button mac-button-primary"
                  >
                    Cambiar
                  </button>
                </div>
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
                  <div className="text-blue-800 space-y-2 text-sm">
                    <p>• Cambia tu contraseña regularmente para mantener tu cuenta segura</p>
                    <p>• No compartas tus credenciales con nadie</p>
                    <p>• Si tienes problemas para acceder, contacta a tu instructor</p>
                    <p>• Tu información personal está protegida según las políticas de privacidad</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Viewer Modal */}
        {selectedFeedbackWeek && (
          <FeedbackViewer
            isOpen={feedbackModalOpen}
            onClose={() => {
              setFeedbackModalOpen(false)
              setSelectedFeedbackWeek(null)
            }}
            weekStart={selectedFeedbackWeek.weekStart}
            subject={selectedFeedbackWeek.subject}
          />
        )}

      </main>
    </div>
  )
}