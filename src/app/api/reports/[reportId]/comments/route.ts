import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Simple in-memory storage for comments (replace with database later)
interface Comment {
  id: string
  reportId: string
  authorId: string
  authorName: string
  authorRole: 'STUDENT' | 'INSTRUCTOR'
  content: string
  type: 'comment' | 'feedback' | 'question' | 'suggestion'
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
}

// Global storage for comments
const globalForComments = globalThis as unknown as {
  reportComments: Comment[] | undefined
}

const reportComments: Comment[] = globalForComments.reportComments ?? []
globalForComments.reportComments = reportComments

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { reportId } = params
    const comments = reportComments
      .filter(comment => comment.reportId === reportId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('Error getting comments:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { reportId } = params
    const { content, type = 'comment', studentId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    // Verify access permissions
    if (session.user.role === 'STUDENT' && session.user.id !== studentId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      reportId,
      authorId: session.user.id,
      authorName: session.user.name || 'Usuario',
      authorRole: session.user.role as 'STUDENT' | 'INSTRUCTOR',
      content: content.trim(),
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false
    }

    reportComments.push(newComment)

    return NextResponse.json({ 
      message: 'Comentario agregado exitosamente',
      comment: newComment 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}