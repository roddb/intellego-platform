import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { 
  getInstructorHierarchicalData,
  getYearsBySubject,
  getCoursesBySubjectAndYear,
  getStudentsBySubject,
  getStudentsBySubjectAndYear,
  getStudentsBySubjectYearAndCourse
} from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Solo instructores pueden acceder" }, { status: 403 })
    }

    const url = new URL(request.url)
    const subject = url.searchParams.get('subject')
    const year = url.searchParams.get('year')
    const course = url.searchParams.get('course')
    const level = url.searchParams.get('level') || 'subjects'

    switch (level) {
      case 'subjects': {
        const data = await getInstructorHierarchicalData()
        return NextResponse.json(data)
      }

      case 'years': {
        if (!subject) {
          return NextResponse.json({ error: "Subject required for years level" }, { status: 400 })
        }
        const years = await getYearsBySubject(subject)
        return NextResponse.json({ years })
      }

      case 'courses': {
        if (!subject || !year) {
          return NextResponse.json({ error: "Subject and year required for courses level" }, { status: 400 })
        }
        const courses = await getCoursesBySubjectAndYear(subject, year)
        return NextResponse.json({ courses })
      }

      case 'students': {
        if (!subject) {
          return NextResponse.json({ error: "Subject required for students level" }, { status: 400 })
        }
        
        let students
        if (year && course) {
          students = await getStudentsBySubjectYearAndCourse(subject, year, course)
        } else if (year) {
          students = await getStudentsBySubjectAndYear(subject, year)
        } else {
          students = await getStudentsBySubject(subject)
        }
        
        return NextResponse.json({ students })
      }

      default:
        return NextResponse.json({ error: "Invalid level parameter" }, { status: 400 })
    }

  } catch (error) {
    console.error("Error getting hierarchical data:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}