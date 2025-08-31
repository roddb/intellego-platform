import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import { getAllWeeklyReports } from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    // Get all weekly reports for simplified instructor dashboard
    const reports = await getAllWeeklyReports()

    return NextResponse.json({
      reports
    })

  } catch (error) {
    console.error("Error getting instructor reports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}