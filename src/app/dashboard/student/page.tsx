"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/Navigation"
import WeeklyReportForm from "@/components/WeeklyReportForm"
import { useChunkErrorHandler } from "@/components/ErrorBoundary"
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
  const [activeTab, setActiveTab] = useState<'reports'>('reports')

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "STUDENT") {
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
      const response = await fetch("/api/weekly-reports", {
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
        // Use date comparison instead of exact timestamp to avoid millisecond differences
        const hasReport = reportsBySubjectData[subject]?.some(report => {
          const reportWeekStart = new Date(report.weekStart)
          const reportDateOnly = reportWeekStart.toISOString().split('T')[0]
          const weekDateOnly = week.start.toISOString().split('T')[0]
          return reportDateOnly === weekDateOnly
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
    
    // Immediately update the calendar visual state for this subject and current week
    const now = new Date()
    const currentWeekStart = getWeekStart(now)
    
    setMonthWeeksBySubject(prev => {
      const updated = { ...prev }
      if (updated[subject]) {
        updated[subject] = updated[subject].map(week => {
          if (week.start.getTime() === currentWeekStart.getTime()) {
            return { ...week, hasReport: true }
          }
          return week
        })
      }
      return updated
    })
    
    // Fetch fresh data from server to update other state but don't let it override calendar
    refreshDataAfterSubmission()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
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
        // Update other state but NOT the calendar weeks
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
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg max-w-md">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📝 Reportes Semanales
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
                      
                      {canSubmitBySubject[subject] ? (
                        <WeeklyReportForm 
                          subject={subject}
                          onSubmissionSuccess={() => handleSubmissionSuccess(subject)} 
                        />
                      ) : (
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
                      )}
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
                                <span className="text-xs font-medium">
                                  {week.hasReport ? '✅ Enviado' : 
                                   week.isPastWeek ? '🔴 Atrasado' : 
                                   week.isCurrentWeek ? '🟡 Actual' : 
                                   '⚪ Futuro'}
                                </span>
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

      </main>
    </div>
  )
}