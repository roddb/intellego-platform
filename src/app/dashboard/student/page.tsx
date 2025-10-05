"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Navigation from "@/components/Navigation"
import WeeklyReportForm from "@/components/WeeklyReportForm"
import FeedbackViewer from "@/components/student/FeedbackViewer"
import MonthlyReportsHistory from "@/components/student/MonthlyReportsHistory"
import Sidebar from "@/components/student/Sidebar"
import { useChunkErrorHandler } from "@/components/ErrorBoundary"
import { TrendingUp } from 'lucide-react'
import { AnimatedCard, GlowCard } from '@/components/ui/AnimatedCard'
import { motion } from 'framer-motion'
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

  // DEBUG: Log session data
  useEffect(() => {
    if (session?.user) {
      console.log('[SESSION DEBUG] Current session:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        studentId: session.user.studentId,
        isImpersonating: session.user.isImpersonating
      })
    }
  }, [session])
  const [userSubjects, setUserSubjects] = useState<string[]>([])
  const [canSubmitBySubject, setCanSubmitBySubject] = useState<{[subject: string]: boolean}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [reportsBySubject, setReportsBySubject] = useState<{[subject: string]: any[]}>({})
  const [monthWeeksBySubject, setMonthWeeksBySubject] = useState<{[subject: string]: Array<{start: Date, end: Date, hasReport: boolean, hasFeedback: boolean, isCurrentWeek: boolean, isPastWeek: boolean, isFutureWeek: boolean}>}>({})
  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeTab, setActiveTab] = useState<'reports' | 'profile' | 'history' | 'progress' | 'evaluations' | 'feedbacks'>('reports')
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [selectedFeedbackWeek, setSelectedFeedbackWeek] = useState<{weekStart: string, subject: string} | null>(null)
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([])
  const [isFeedbacksLoading, setIsFeedbacksLoading] = useState(false)

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

  // Load feedbacks when tab becomes active
  useEffect(() => {
    if (activeTab !== 'feedbacks') return
    if (allFeedbacks.length > 0) return // Already loaded

    console.log('[FEEDBACKS] Loading feedbacks...')
    setIsFeedbacksLoading(true)

    fetch('/api/student/feedback')
      .then(res => {
        console.log('[FEEDBACKS] Response:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('[FEEDBACKS] Data:', data)
        setAllFeedbacks(data.feedbacks || [])
      })
      .catch(err => {
        console.error('[FEEDBACKS] Error:', err)
      })
      .finally(() => {
        console.log('[FEEDBACKS] Done')
        setIsFeedbacksLoading(false)
      })
  }, [activeTab, allFeedbacks.length])

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
        const matchingReport = reportsBySubjectData[subject]?.find(report => {
          const reportWeekStart = new Date(report.weekStart)
          const reportWeekEnd = new Date(report.weekEnd)
          const weekStart = new Date(week.start)
          const weekEnd = new Date(week.end)

          // Check if report's date range overlaps with calendar week's date range
          return (reportWeekStart <= weekEnd && reportWeekEnd >= weekStart)
        })

        const hasReport = !!matchingReport
        const hasFeedback = matchingReport?.hasFeedback === true || matchingReport?.hasFeedback === 1

        return {
          ...week,
          hasReport,
          hasFeedback,
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

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'progress') {
            router.push('/dashboard/student/progress')
          } else if (tab === 'evaluations') {
            router.push('/dashboard/student/evaluations')
          } else {
            setActiveTab(tab)
          }
        }}
        userName={session?.user?.name ?? undefined}
      />

      <main className="container mx-auto px-4 py-8 lg:pl-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Dashboard del Estudiante
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bienvenido, {session?.user?.name}
          </p>
        </motion.div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === 'reports' && (
          /* Adaptive Layout by User Subjects */
          userSubjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                Sin materias registradas
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                No tienes materias registradas. Contacta a tu instructor.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {userSubjects.map((subject, index) => (
                <GlowCard
                  key={subject}
                  delay={index * 0.1}
                  color={subject === 'Física' ? 'blue' : 'green'}
                  className="p-6"
                >
                  <div className="flex items-center mb-6">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      subject === 'Física' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {subject === 'Física' ? '⚛️ Física' : '🧪 Química'}
                    </h2>
                  </div>
                  
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Subject Report Form */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
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
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Reporte de {subject} enviado
                              </h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Ya enviaste tu reporte de {subject} esta semana.
                              </p>
                            </div>
                          )
                        } else {
                          // Cannot submit (either not current week or other restrictions)
                          return (
                            <div className="text-center py-6 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className="text-md font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Fuera del período de entrega
                              </h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Los reportes se entregan solo durante la semana correspondiente.
                              </p>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {/* Subject Monthly Calendar */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        📅 Calendario - {subject}
                      </h3>

                      <div className="mb-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
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
                                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                                  : week.isPastWeek
                                  ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                                  : week.isCurrentWeek
                                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
                                  {week.hasFeedback && (
                                    <button
                                      onClick={() => {
                                        const weekStartISO = week.start.toISOString().split('T')[0]
                                        handleViewFeedback(weekStartISO, subject)
                                      }}
                                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800"
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
                          <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                            Cargando calendario...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlowCard>
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

        {/* Feedbacks Tab Content */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                💬 Retroalimentaciones Recibidas
              </h2>
              <p className="text-sm text-slate-600">
                Todas las devoluciones de tus reportes semanales
              </p>
            </div>

            {/* Loading State */}
            {isFeedbacksLoading && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="animate-pulse">
                  <div className="text-slate-400 text-lg">Cargando retroalimentaciones...</div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isFeedbacksLoading && allFeedbacks.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-slate-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No hay retroalimentaciones disponibles
                </h3>
                <p className="text-slate-600">
                  Tus devoluciones aparecerán aquí cuando tu profesor las suba al sistema.
                </p>
              </div>
            )}

            {/* Feedbacks List */}
            {!isFeedbacksLoading && allFeedbacks.length > 0 && (
              <div className="space-y-4">
                {allFeedbacks.map((feedback) => {
                  const weekStartDate = new Date(feedback.weekStart);
                  const formattedDate = weekStartDate.toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });

                  // Score color logic
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
                    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    return 'bg-red-100 text-red-800 border-red-200';
                  };

                  return (
                    <div
                      key={feedback.id || `${feedback.weekStart}-${feedback.subject}`}
                      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border border-slate-200"
                      onClick={() => {
                        setSelectedFeedbackWeek({
                          weekStart: feedback.weekStart,
                          subject: feedback.subject
                        });
                        setFeedbackModalOpen(true);
                      }}
                    >
                      {/* Header with subject and score */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {feedback.subject}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Semana del {formattedDate}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border font-bold ${getScoreColor(feedback.score)}`}>
                          {feedback.score}/100
                        </div>
                      </div>

                      {/* Instructor info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {feedback.instructor?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {feedback.instructor?.name || 'Instructor'}
                        </div>
                      </div>

                      {/* Preview of comments */}
                      {feedback.generalComments && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-slate-700 line-clamp-2">
                            {feedback.generalComments}
                          </p>
                        </div>
                      )}

                      {/* Tags for strengths and improvements */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {feedback.strengths && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            ✓ Fortalezas
                          </span>
                        )}
                        {feedback.improvements && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            ↗ Mejoras
                          </span>
                        )}
                        {feedback.aiAnalysis && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            🤖 Análisis IA
                          </span>
                        )}
                      </div>

                      {/* View button */}
                      <button className="w-full mt-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm">
                        Ver Retroalimentación Completa →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary Stats */}
            {!isFeedbacksLoading && allFeedbacks.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  📊 Resumen de Retroalimentaciones
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {allFeedbacks.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Recibidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {allFeedbacks.length > 0
                        ? Math.round(allFeedbacks.reduce((sum, f) => sum + f.score, 0) / allFeedbacks.length)
                        : 0}
                    </div>
                    <div className="text-sm text-slate-600">Promedio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(allFeedbacks.map(f => f.subject)).size}
                    </div>
                    <div className="text-sm text-slate-600">Materias</div>
                  </div>
                </div>
              </div>
            )}
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