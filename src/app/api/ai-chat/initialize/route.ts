import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ConversationEngine } from '@/lib/conversation-engine'

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
    const { userName } = body

    // Crear mensaje de bienvenida personalizado (stateless)
    const welcomeMessage = await ConversationEngine.createWelcomeMessage(
      session.user.id, 
      userName || session.user.name
    )

    return NextResponse.json({
      success: true,
      conversationHistory: [welcomeMessage],
      currentMode: 'chat'
    })

  } catch (error) {
    console.error('❌ Error initializing AI chat:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}