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
    const { message, conversationHistory } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Procesar mensaje (stateless)
    const response = await ConversationEngine.processUserMessage(
      session.user.id,
      message.trim(),
      session.user.name,
      conversationHistory
    )

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error processing message:', error)
    
    // Fallback response in case of error
    const fallbackResponse = {
      id: `fallback_${Date.now()}`,
      type: 'ai' as const,
      content: 'Disculpa, hubo un problema procesando tu mensaje. ¿Podrías intentar reformularlo o ser más específico sobre lo que necesitas?',
      timestamp: new Date(),
      metadata: {
        suggestedActions: ['Resolver dudas', 'Hacer ejercicios', 'Ver mi progreso']
      }
    }
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      error: 'Fallback response due to processing error'
    })
  }
}