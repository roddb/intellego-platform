import { NextRequest, NextResponse } from "next/server"
import { 
  validateUserPassword,
  findWeeklyReportsByUserGroupedBySubject,
  canSubmitForSubject,
  getUserSubjects,
  getCurrentWeekStart,
  getCurrentWeekEnd,
  createWeeklyReport
} from "@/lib/db-operations"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Starting user flow test...")
    
    // Step 1: Simulate login with demo user
    const demoEmail = "estudiante@demo.com"
    const demoPassword = "Estudiante123!!!"
    
    console.log("Step 1: Validating demo user credentials...")
    const user = await validateUserPassword(demoEmail, demoPassword)
    
    if (!user) {
      return NextResponse.json({ 
        error: "Could not validate demo user credentials",
        step: "login"
      }, { status: 400 })
    }
    
    console.log("✅ User validated:", user.id, user.name)
    
    // Step 2: Check current state
    console.log("Step 2: Checking current dashboard state...")
    const userSubjects = await getUserSubjects(user.id)
    const reportsBySubject = await findWeeklyReportsByUserGroupedBySubject(user.id)
    
    const subjectStatus: { [subject: string]: boolean } = {}
    for (const subject of userSubjects) {
      subjectStatus[subject] = await canSubmitForSubject(String(user.id), subject)
    }
    
    console.log("Current subjects:", userSubjects)
    console.log("Can submit status:", subjectStatus)
    console.log("Reports by subject:", Object.keys(reportsBySubject))
    
    // Step 3: Check if we can submit a report for Física
    const canSubmitFisica = subjectStatus["Física"]
    const currentWeekStart = getCurrentWeekStart()
    const currentWeekEnd = getCurrentWeekEnd()
    
    console.log("Can submit Física report:", canSubmitFisica)
    console.log("Current week:", currentWeekStart.toISOString(), "to", currentWeekEnd.toISOString())
    
    let newReportResult = null
    
    // Step 4: If we can submit, create a test report
    if (canSubmitFisica) {
      console.log("Step 4: Creating test report for Física...")
      
      try {
        newReportResult = await createWeeklyReport({
          userId: String(user.id),
          subject: "Física",
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          answers: [
            { questionId: 'q1', answer: 'Test - Temas trabajados esta semana' },
            { questionId: 'q2', answer: 'Test - Evidencia de aprendizaje completada' },
            { questionId: 'q3', answer: 'Test - Dificultades identificadas y estrategias aplicadas' },
            { questionId: 'q4', answer: 'Test - Conexiones realizadas con otros temas' },
            { questionId: 'q5', answer: 'Test - Comentarios adicionales' }
          ]
        })
        
        console.log("✅ Report created:", newReportResult.id)
      } catch (createError) {
        console.error("❌ Error creating report:", createError)
        return NextResponse.json({
          error: "Failed to create test report",
          details: createError.message,
          step: "create_report"
        }, { status: 500 })
      }
    }
    
    // Step 5: Check state after report creation
    console.log("Step 5: Checking state after report creation...")
    
    const newSubjectStatus: { [subject: string]: boolean } = {}
    for (const subject of userSubjects) {
      newSubjectStatus[subject] = await canSubmitForSubject(String(user.id), subject)
    }
    
    const newReportsBySubject = await findWeeklyReportsByUserGroupedBySubject(user.id)
    
    console.log("After report - Can submit status:", newSubjectStatus)
    console.log("After report - Reports by subject:", Object.keys(newReportsBySubject))
    
    return NextResponse.json({
      success: true,
      test_results: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        initial_state: {
          subjects: userSubjects,
          canSubmit: subjectStatus,
          reportCount: Object.keys(reportsBySubject).length
        },
        report_creation: {
          canSubmitFisica,
          reportCreated: !!newReportResult,
          reportId: newReportResult?.id || null
        },
        final_state: {
          canSubmit: newSubjectStatus,
          reportCount: Object.keys(newReportsBySubject).length
        },
        week_info: {
          start: currentWeekStart.toISOString(),
          end: currentWeekEnd.toISOString()
        }
      }
    })

  } catch (error) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}