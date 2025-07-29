import { NextResponse } from "next/server"
import { getAllProgressReports } from "@/lib/hybrid-storage"

export async function GET() {
  try {
    const allReports = await getAllProgressReports()
    
    return NextResponse.json({
      count: allReports.length,
      sampleReport: allReports[0] || null,
      allReports: allReports
    })
  } catch (error) {
    console.error('Error getting reports:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}