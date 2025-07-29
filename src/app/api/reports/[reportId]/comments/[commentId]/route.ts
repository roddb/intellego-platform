import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Access the global comments storage
const globalForComments = globalThis as unknown as {
  reportComments: any[] | undefined
}

const reportComments = globalForComments.reportComments ?? []

export async function PUT(
  request: NextRequest,
  { params }: { params: { reportId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { commentId } = params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    const commentIndex = reportComments.findIndex(
      comment => comment.id === commentId && comment.authorId === session.user.id
    )

    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
    }

    // Update the comment
    reportComments[commentIndex] = {
      ...reportComments[commentIndex],
      content: content.trim(),
      updatedAt: new Date(),
      isEdited: true
    }

    return NextResponse.json({ 
      message: 'Comentario actualizado exitosamente',
      comment: reportComments[commentIndex]
    })

  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { commentId } = params

    const commentIndex = reportComments.findIndex(
      comment => comment.id === commentId && comment.authorId === session.user.id
    )

    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
    }

    // Remove the comment
    reportComments.splice(commentIndex, 1)

    return NextResponse.json({ 
      message: 'Comentario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}