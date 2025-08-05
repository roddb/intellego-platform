import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  findWeeklyReportsByUser,
  getCurrentWeekStart,
  getCurrentWeekEnd,
  canSubmitForSubject,
  findWeeklyReportByUserAndWeek
} from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    const currentWeekStart = getCurrentWeekStart()
    const currentWeekEnd = getCurrentWeekEnd()
    
    // Get all reports for this user
    const allReports = await findWeeklyReportsByUser(userId)
    
    // Check specific subjects
    const fisicaCanSubmit = await canSubmitForSubject(userId, "Física")
    const quimicaCanSubmit = await canSubmitForSubject(userId, "Química")
    
    // Check for specific reports this week
    const fisicaReportThisWeek = await findWeeklyReportByUserAndWeek(userId, currentWeekStart, "Física")
    const quimicaReportThisWeek = await findWeeklyReportByUserAndWeek(userId, currentWeekStart, "Química")
    
    return NextResponse.json({
      userId,
      currentWeek: {
        start: currentWeekStart.toISOString(),
        end: currentWeekEnd.toISOString(),
        startForQuery: currentWeekStart.toISOString()
      },
      canSubmit: {
        fisica: fisicaCanSubmit,
        quimica: quimicaCanSubmit
      },
      reportsThisWeek: {
        fisica: fisicaReportThisWeek,
        quimica: quimicaReportThisWeek
      },
      allReports: allReports.map(report => ({
        id: report.id,
        subject: report.subject,
        weekStart: report.weekStart,
        submittedAt: report.submittedAt
      })),
      totalReports: allReports.length
    })

  } catch (error) {
    console.error("Error in debug reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}