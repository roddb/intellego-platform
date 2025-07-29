import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllUsers, getAllProgressReports, findUsersByRole, getMonthWeeks } from '@/lib/hybrid-storage'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'month'

    // Get all data
    const allUsers = await getAllUsers()
    const allReports = await getAllProgressReports()
    const students = await findUsersByRole('STUDENT')

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)

    switch (timeframe) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'semester':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 6)
        break
      case 'month':
      default:
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    // Filter reports by timeframe
    const timeFrameReports = allReports.filter(report => {
      const reportDate = new Date(report.submittedAt)
      return reportDate >= startDate && reportDate <= endDate
    })

    // Calculate submission trends
    const submissionTrends = calculateSubmissionTrends(timeFrameReports, students, timeframe, startDate, endDate)

    // Calculate student performance
    const studentPerformance = calculateStudentPerformance(students, allReports)

    // Calculate weekly stats
    const weeklyStats = calculateWeeklyStats(students, timeFrameReports, allReports)

    // Calculate engagement metrics
    const engagementMetrics = calculateEngagementMetrics(students, timeFrameReports)

    // Calculate time distribution
    const timeDistribution = calculateTimeDistribution(timeFrameReports)

    return NextResponse.json({
      submissionTrends,
      studentPerformance,
      weeklyStats,
      engagementMetrics,
      timeDistribution
    })

  } catch (error) {
    console.error('Error getting instructor analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function calculateSubmissionTrends(reports: any[], students: any[], timeframe: string, startDate: Date, endDate: Date) {
  const trends = []
  const totalStudents = students.length

  if (timeframe === 'week') {
    // Daily data for week view
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayReports = reports.filter(report => {
        const reportDate = new Date(report.submittedAt)
        return reportDate >= dayStart && reportDate <= dayEnd
      })

      trends.push({
        week: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        submissions: dayReports.length,
        total: totalStudents,
        rate: totalStudents > 0 ? Math.round((dayReports.length / totalStudents) * 100) : 0
      })
    }
  } else {
    // Weekly data for month/semester view
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    for (let i = 0; i < Math.min(weeks, 12); i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekReports = reports.filter(report => {
        const reportDate = new Date(report.submittedAt)
        return reportDate >= weekStart && reportDate <= weekEnd
      })

      trends.push({
        week: `Sem ${i + 1}`,
        submissions: weekReports.length,
        total: totalStudents,
        rate: totalStudents > 0 ? Math.round((weekReports.length / totalStudents) * 100) : 0
      })
    }
  }

  return trends
}

function calculateStudentPerformance(students: any[], allReports: any[]) {
  return students.map(student => {
    const studentReports = allReports.filter(report => report.userId === student.id)
    const totalPossibleWeeks = 12 // Assume 12 weeks in semester
    const completionRate = Math.round((studentReports.length / totalPossibleWeeks) * 100)
    
    const lastReport = studentReports.length > 0 
      ? studentReports.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
      : null

    return {
      studentName: student.name,
      reportsSubmitted: studentReports.length,
      completionRate: Math.min(completionRate, 100),
      averageScore: 85 + Math.random() * 15, // Mock score for now
      lastSubmission: lastReport 
        ? new Date(lastReport.submittedAt).toLocaleDateString('es-ES')
        : 'Nunca'
    }
  }).sort((a, b) => b.reportsSubmitted - a.reportsSubmitted)
}

function calculateWeeklyStats(students: any[], timeFrameReports: any[], allReports: any[]) {
  const totalStudents = students.length
  const activeStudents = timeFrameReports.reduce((acc, report) => {
    if (!acc.includes(report.userId)) {
      acc.push(report.userId)
    }
    return acc
  }, []).length

  const avgSubmissionRate = totalStudents > 0 
    ? (timeFrameReports.length / totalStudents) * 100 
    : 0

  // Calculate weekly growth (mock for now)
  const weeklyGrowth = Math.random() * 20 - 10 // Random between -10% and +10%

  return {
    totalStudents,
    activeStudents,
    avgSubmissionRate,
    totalReports: allReports.length,
    weeklyGrowth
  }
}

function calculateEngagementMetrics(students: any[], reports: any[]) {
  const studentsWithReports = new Set(reports.map(r => r.userId)).size
  const studentsWithoutReports = students.length - studentsWithReports
  
  const consistentStudents = students.filter(student => {
    const studentReports = reports.filter(r => r.userId === student.id)
    return studentReports.length >= 3 // Consider consistent if 3+ reports
  }).length

  return [
    {
      name: 'Estudiantes Activos',
      value: studentsWithReports,
      color: '#10b981'
    },
    {
      name: 'Estudiantes Consistentes',
      value: consistentStudents,
      color: '#3b82f6'
    },
    {
      name: 'Necesitan Seguimiento',
      value: studentsWithoutReports,
      color: '#f59e0b'
    }
  ]
}

function calculateTimeDistribution(reports: any[]) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  
  return days.map(day => {
    // Mock data for now - in real implementation, would analyze actual submission times
    const morning = Math.floor(Math.random() * 10) + 5
    const afternoon = Math.floor(Math.random() * 15) + 10
    const evening = Math.floor(Math.random() * 8) + 3

    return {
      day,
      morning,
      afternoon,
      evening
    }
  })
}