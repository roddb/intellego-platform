'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, Edit3, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

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

interface ReportCommentsProps {
  reportId: string
  studentId: string
  className?: string
}

export default function ReportComments({ reportId, studentId, className = '' }: ReportCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'comment' | 'feedback' | 'question' | 'suggestion'>('comment')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [reportId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          type: commentType,
          studentId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        setCommentType('comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const saveEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/reports/${reportId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, ...data.comment, isEdited: true } : c
        ))
        setEditingComment(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback': return <CheckCircle className="w-4 h-4 text-success" />
      case 'question': return <MessageCircle className="w-4 h-4 text-info" />
      case 'suggestion': return <AlertCircle className="w-4 h-4 text-warning" />
      default: return <MessageCircle className="w-4 h-4 text-primary" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feedback': return 'Retroalimentación'
      case 'question': return 'Pregunta'
      case 'suggestion': return 'Sugerencia'
      default: return 'Comentario'
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'feedback': return 'badge-success'
      case 'question': return 'badge-info'
      case 'suggestion': return 'badge-warning'
      default: return 'badge-primary'
    }
  }

  if (isLoading) {
    return (
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-base-300 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-base-300 rounded"></div>
              <div className="h-16 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="card-title text-lg">Comentarios y Retroalimentación</h3>
          <div className="badge badge-primary badge-sm">{comments.length}</div>
        </div>

        {/* Comments List */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content w-8 h-8 rounded-full">
                          <span className="text-xs">
                            {comment.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {comment.authorName}
                          {comment.authorRole === 'INSTRUCTOR' && (
                            <span className="badge badge-accent badge-xs ml-2">Instructor</span>
                          )}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {new Date(comment.createdAt).toLocaleString('es-ES')}
                          {comment.isEdited && <span className="ml-1">(editado)</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`badge badge-sm ${getTypeBadgeClass(comment.type)}`}>
                        {getTypeIcon(comment.type)}
                        <span className="ml-1">{getTypeLabel(comment.type)}</span>
                      </div>
                      
                      {session?.user?.id === comment.authorId && (
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                            <div className="w-1 h-1 bg-current rounded-full"></div>
                          </div>
                          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow">
                            <li>
                              <button onClick={() => startEditing(comment)} className="text-xs">
                                <Edit3 className="w-3 h-3" />
                                Editar
                              </button>
                            </li>
                            <li>
                              <button onClick={() => deleteComment(comment.id)} className="text-xs text-error">
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="textarea textarea-bordered w-full h-20 text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Editar comentario..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(comment.id)}
                          className="btn btn-primary btn-xs"
                          disabled={!editContent.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="btn btn-ghost btn-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        {session?.user && (
          <div className="divider">Agregar comentario</div>
        )}
        
        {session?.user && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                className="select select-bordered select-sm flex-1"
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as any)}
              >
                <option value="comment">💬 Comentario</option>
                <option value="feedback">✅ Retroalimentación</option>
                <option value="question">❓ Pregunta</option>
                <option value="suggestion">💡 Sugerencia</option>
              </select>
            </div>
            
            <div className="form-control">
              <textarea
                className="textarea textarea-bordered h-24 resize-none"
                placeholder={`Escribe tu ${getTypeLabel(commentType).toLowerCase()}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="btn btn-primary btn-sm"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}