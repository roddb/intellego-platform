import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatService } from '@/lib/chat-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'messages':
        const messages = chatService.getMessages()
        return NextResponse.json({ messages })

      case 'users':
        const users = chatService.getOnlineUsers()
        return NextResponse.json({ users })

      case 'join':
        chatService.addUser({
          id: session.user.id,
          name: session.user.name || 'Usuario',
          role: session.user.role as 'STUDENT' | 'INSTRUCTOR',
          lastSeen: new Date()
        })
        return NextResponse.json({ success: true })

      case 'leave':
        chatService.removeUser(session.user.id)
        return NextResponse.json({ success: true })

      case 'ping':
        chatService.updateUserActivity(session.user.id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { content, type = 'message' } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    // Update user activity
    chatService.updateUserActivity(session.user.id)

    // Add message
    const message = chatService.addMessage({
      userId: session.user.id,
      userName: session.user.name || 'Usuario',
      userRole: session.user.role as 'STUDENT' | 'INSTRUCTOR',
      content: content.trim(),
      type
    })

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error posting chat message:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}