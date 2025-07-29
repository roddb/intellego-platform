import { NextResponse } from "next/server"
import { getAllWeeklyReports } from "@/lib/temp-storage"

export async function GET() {
  try {
    const reports = getAllWeeklyReports()
    return NextResponse.json({
      count: reports.length,
      reports: reports.map(report => ({
        id: report.id,
        userId: report.userId,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        submittedAt: report.submittedAt,
        responses: report.responses
      }))
    })
  } catch (error) {
    console.error("Debug reports error:", error)
    return NextResponse.json(
      { error: "Error getting reports" },
      { status: 500 }
    )
  }
}