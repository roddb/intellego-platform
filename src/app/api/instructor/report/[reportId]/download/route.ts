import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import { getStudentReportById } from "@/lib/db-operations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { reportId } = await params
    
    // Get the report with answers
    const report = await getStudentReportById(reportId)
    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 })
    }

    // Format the report for JSON download
    const jsonReport = {
      reportInfo: {
        id: report.id,
        subject: report.subject,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        submittedAt: report.submittedAt
      },
      student: {
        id: report.userId,
        name: report.userName,
        email: report.userEmail,
        studentId: report.studentId,
        sede: report.sede,
        academicYear: report.academicYear,
        division: report.division
      },
      answers: report.answers,
      metadata: {
        downloadedAt: new Date().toISOString(),
        downloadedBy: session.user.email
      }
    }

    // Convert to pretty JSON
    const jsonContent = JSON.stringify(jsonReport, null, 2)
    
    // Create response with appropriate headers
    const response = new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="reporte_${report.studentId}_${report.subject}_${report.weekStart ? new Date(String(report.weekStart)).toISOString().split('T')[0] : 'unknown'}.json"`
      }
    })

    return response

  } catch (error) {
    console.error("Error downloading report:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}