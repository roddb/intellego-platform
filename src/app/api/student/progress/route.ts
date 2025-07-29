import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllProgressReports, findUserById } from '@/lib/hybrid-storage'

// Define badges system
const BADGES = [
  {
    id: 'first_report',
    name: 'Primer Paso',
    description: 'Envía tu primer reporte',
    icon: 'star',
    color: 'from-blue-400 to-blue-600',
    requirement: (stats: any) => stats.reportsSubmitted >= 1
  },
  {
    id: 'week_streak_3',
    name: 'Constante',
    description: '3 semanas seguidas',
    icon: 'flame',
    color: 'from-orange-400 to-red-500',
    requirement: (stats: any) => stats.weeklyStreak >= 3
  },
  {
    id: 'week_streak_5',
    name: 'Dedicado',
    description: '5 semanas seguidas',
    icon: 'flame',
    color: 'from-red-500 to-pink-600',
    requirement: (stats: any) => stats.weeklyStreak >= 5
  },
  {
    id: 'completionist',
    name: 'Completista',
    description: '100% de reportes enviados',
    icon: 'target',
    color: 'from-green-400 to-emerald-600',
    requirement: (stats: any) => stats.completionRate >= 100
  },
  {
    id: 'high_achiever',
    name: 'Alto Rendimiento',
    description: 'Más de 500 puntos',
    icon: 'trophy',
    color: 'from-yellow-400 to-orange-500',
    requirement: (stats: any) => stats.totalPoints >= 500
  },
  {
    id: 'scholar',
    name: 'Académico',
    description: 'Más de 1000 puntos',
    icon: 'award',
    color: 'from-purple-400 to-indigo-600',
    requirement: (stats: any) => stats.totalPoints >= 1000
  },
  {
    id: 'master',
    name: 'Maestro',
    description: 'Nivel 5 alcanzado',
    icon: 'trophy',
    color: 'from-indigo-500 to-purple-600',
    requirement: (stats: any) => {
      const levels = [0, 100, 250, 450, 700, 1000]
      return stats.totalPoints >= levels[4] // Level 5
    }
  },
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: '10 reportes de calidad',
    icon: 'star',
    color: 'from-pink-400 to-rose-600',
    requirement: (stats: any) => stats.reportsSubmitted >= 10
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Verify access (students can only see their own progress, instructors can see anyone's)
    if (session.user.role === 'STUDENT' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Get user data
    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Get all reports for this user
    const allReports = await getAllProgressReports()
    const userReports = allReports.filter(report => report.userId === userId)

    // Calculate total weeks since user creation or start of academic period
    const startDate = new Date(user.createdAt)
    const currentDate = new Date()
    const weeksSinceStart = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const totalWeeks = Math.max(weeksSinceStart, 1)

    // Calculate points (50 points per report + bonus for streaks)
    let totalPoints = userReports.length * 50

    // Calculate weekly streak
    const sortedReports = userReports
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())

    let weeklyStreak = 0
    let currentWeekStart = new Date()
    currentWeekStart.setHours(0, 0, 0, 0)
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()) // Start of current week

    // Check for consecutive weeks
    for (let i = 0; i < totalWeeks; i++) {
      const weekToCheck = new Date(currentWeekStart)
      weekToCheck.setDate(weekToCheck.getDate() - (i * 7))
      
      const hasReportThisWeek = sortedReports.some(report => {
        const reportWeekStart = new Date(report.weekStart)
        return Math.abs(reportWeekStart.getTime() - weekToCheck.getTime()) < (24 * 60 * 60 * 1000) // Within 1 day tolerance
      })

      if (hasReportThisWeek) {
        weeklyStreak++
      } else {
        break
      }
    }

    // Add streak bonus points
    if (weeklyStreak >= 3) totalPoints += weeklyStreak * 10
    if (weeklyStreak >= 5) totalPoints += weeklyStreak * 5

    // Calculate completion rate
    const completionRate = totalWeeks > 0 ? Math.round((userReports.length / totalWeeks) * 100) : 0

    // Calculate basic stats
    const stats = {
      totalPoints,
      weeklyStreak,
      reportsSubmitted: userReports.length,
      totalWeeks,
      completionRate: Math.min(completionRate, 100) // Cap at 100%
    }

    // Calculate badges
    const badges = BADGES.map(badge => {
      const earned = badge.requirement(stats)
      return {
        ...badge,
        earned,
        earnedAt: earned ? userReports[0]?.submittedAt || new Date() : undefined
      }
    })

    // Calculate level
    const levels = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]
    let level = 1
    let currentLevelPoints = 0
    let nextLevelPoints = 100

    for (let i = 0; i < levels.length - 1; i++) {
      if (totalPoints >= levels[i] && totalPoints < levels[i + 1]) {
        level = i + 1
        currentLevelPoints = levels[i]
        nextLevelPoints = levels[i + 1]
        break
      }
    }

    if (totalPoints >= levels[levels.length - 1]) {
      level = levels.length
      currentLevelPoints = levels[levels.length - 1]
      nextLevelPoints = levels[levels.length - 1]
    }

    const pointsToNextLevel = nextLevelPoints - totalPoints

    return NextResponse.json({
      ...stats,
      badges,
      level,
      pointsToNextLevel: Math.max(pointsToNextLevel, 0),
      currentLevelPoints,
      nextLevelPoints
    })

  } catch (error) {
    console.error('Error getting student progress:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}