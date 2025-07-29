import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  findWeeklyReportsByUser, 
  getMonthWeeks,
  findWeeklyReportByUserAndWeek 
} from "@/lib/temp-storage"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())

    // Get all weeks in the specified month
    const monthWeeks = getMonthWeeks(year, month)
    
    // Get user's reports for this month
    const userReports = findWeeklyReportsByUser(session.user.id)
    
    // Map weeks with submission status
    const weekProgress = monthWeeks.map((week, index) => {
      const report = findWeeklyReportByUserAndWeek(session.user.id, week.start)
      const currentDate = new Date()
      const weekHasPassed = week.end < currentDate
      const isCurrentWeek = currentDate >= week.start && currentDate <= week.end
      
      return {
        weekNumber: index + 1,
        weekStart: week.start,
        weekEnd: week.end,
        hasSubmitted: !!report,
        canSubmit: isCurrentWeek && !report,
        isPast: weekHasPassed,
        isCurrent: isCurrentWeek,
        isFuture: week.start > currentDate,
        report: report || null
      }
    })

    return NextResponse.json({
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('es-ES', { month: 'long' }),
      weekProgress,
      totalWeeks: monthWeeks.length,
      submittedWeeks: weekProgress.filter(w => w.hasSubmitted).length,
      availableWeeks: weekProgress.filter(w => w.canSubmit || w.hasSubmitted).length
    })

  } catch (error) {
    console.error("Error getting weekly progress:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}