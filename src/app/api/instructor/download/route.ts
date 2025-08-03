import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { exportReportsAsCSV, exportReportsAsMarkdown } from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'markdown'

    if (format === 'markdown') {
      const markdown = await exportReportsAsMarkdown()
      
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="reportes-semanales.md"'
        }
      })
    }

    if (format === 'csv') {
      const csv = await exportReportsAsCSV()
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="reportes-semanales.csv"'
        }
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })

  } catch (error) {
    console.error("Error generating download:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}