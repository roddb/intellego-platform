import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AITutorService, Subject, ExerciseType } from '@/lib/ai-tutor-service'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const subject = searchParams.get('subject') as Subject
    const count = parseInt(searchParams.get('count') || '5')

    switch (action) {
      case 'analyze':
        const analysis = await AITutorService.analyzeStudent(session.user.id)
        return NextResponse.json({
          success: true,
          analysis
        })

      case 'exercise':
        const exercise = await AITutorService.generateExercise(session.user.id, subject)
        return NextResponse.json({
          success: true,
          exercise
        })

      case 'exercise_set':
        const exercises = await AITutorService.generateExerciseSet(session.user.id, count)
        return NextResponse.json({
          success: true,
          exercises
        })

      case 'recommendations':
        const recommendations = await AITutorService.getStudyRecommendations(session.user.id)
        return NextResponse.json({
          success: true,
          recommendations
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze, exercise, exercise_set, or recommendations' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in AI tutor service:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, exerciseId, answer, timeSpent } = body

    switch (action) {
      case 'submit_answer':
        // Here you could implement answer validation and progress tracking
        // For now, we'll just return a success response
        
        return NextResponse.json({
          success: true,
          message: 'Answer submitted successfully',
          // You could add scoring logic here
          feedback: {
            correct: true, // This would be determined by actual validation
            explanation: "¡Bien hecho! Tu respuesta muestra comprensión del concepto.",
            nextRecommendation: "Intenta un ejercicio más desafiante"
          }
        })

      case 'generate_custom':
        const { subject: customSubject, difficulty, type } = body
        
        if (!customSubject) {
          return NextResponse.json(
            { error: 'Subject is required for custom exercise generation' },
            { status: 400 }
          )
        }

        const customExercise = await AITutorService.generateExercise(
          session.user.id, 
          customSubject as Subject
        )

        return NextResponse.json({
          success: true,
          exercise: customExercise
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: submit_answer or generate_custom' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in AI tutor POST:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}