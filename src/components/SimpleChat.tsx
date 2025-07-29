'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, MessageCircle, Users, Circle } from 'lucide-react'

interface Message {
  id: string
  userId: string
  userName: string
  userRole: 'STUDENT' | 'INSTRUCTOR'
  content: string
  timestamp: Date
  type: 'message' | 'notification'
}

interface OnlineUser {
  id: string
  name: string
  role: 'STUDENT' | 'INSTRUCTOR'
  lastSeen: Date
}

interface SimpleChatProps {
  className?: string
  compact?: boolean
}

export default function SimpleChat({ className = '', compact = false }: SimpleChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isVisible, setIsVisible] = useState(!compact)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Join chat
    joinChat()

    // Start polling for messages
    startPolling()

    // Cleanup on unmount
    return () => {
      leaveChat()
      stopPolling()
    }
  }, [session?.user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const joinChat = async () => {
    try {
      await fetch('/api/chat?action=join', { method: 'GET' })
      await fetchMessages()
      await fetchUsers()
    } catch (error) {
      console.error('Error joining chat:', error)
    }
  }

  const leaveChat = async () => {
    try {
      await fetch('/api/chat?action=leave', { method: 'GET' })
    } catch (error) {
      console.error('Error leaving chat:', error)
    }
  }

  const startPolling = () => {
    // Poll for new messages every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      await fetchMessages()
      await fetchUsers()
      await ping()
    }, 2000)
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat?action=messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/chat?action=users')
      if (response.ok) {
        const data = await response.json()
        setOnlineUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const ping = async () => {
    try {
      await fetch('/api/chat?action=ping')
    } catch (error) {
      console.error('Error pinging server:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'message'
        })
      })

      if (response.ok) {
        setNewMessage('')
        await fetchMessages() // Refresh messages immediately
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!session?.user) {
    return null
  }

  if (compact && !isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="btn btn-primary btn-circle shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && (
            <div className="badge badge-secondary badge-sm absolute -top-2 -right-2">
              {messages.filter(m => m.type === 'message').length}
            </div>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'fixed bottom-4 right-4 z-50' : ''} ${className}`}>
      <div className={`card bg-base-100 shadow-xl ${compact ? 'w-80 h-96' : 'w-full h-full'}`}>
        {/* Header */}
        <div className="card-body p-0">
          <div className="bg-primary text-primary-content p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-bold">Chat Académico</h3>
                <div className="flex items-center gap-1 text-success">
                  <Circle className="w-2 h-2 fill-current" />
                  <span className="text-xs">En línea</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                    <Users className="w-4 h-4" />
                    <span className="badge badge-sm">{onlineUsers.length}</span>
                  </div>
                  <div tabIndex={0} className="dropdown-content card card-compact w-64 p-2 shadow bg-base-100 text-base-content">
                    <div className="card-body">
                      <h4 className="font-bold">Usuarios en línea</h4>
                      <div className="space-y-2">
                        {onlineUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-2">
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content w-8 h-8 rounded-full">
                                <span className="text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs opacity-60">
                                {user.role === 'INSTRUCTOR' ? 'Instructor' : 'Estudiante'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {compact && (
                  <button
                    onClick={() => setIsVisible(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${compact ? 'h-64' : 'min-h-64 max-h-96'}`}>
            {messages.length === 0 ? (
              <div className="text-center text-base-content/60 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay mensajes aún. ¡Inicia la conversación!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                  {message.type === 'notification' ? (
                    <div className="text-center">
                      <span className="text-xs text-base-content/60 bg-base-200 px-2 py-1 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  ) : (
                    <div className={`chat ${message.userId === session.user.id ? 'chat-end' : 'chat-start'}`}>
                      <div className="chat-image avatar">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
                          <span className="text-xs">
                            {message.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="chat-header text-xs opacity-60">
                        {message.userName}
                        {message.userRole === 'INSTRUCTOR' && (
                          <span className="badge badge-accent badge-xs ml-1">Instructor</span>
                        )}
                        <time className="ml-1">
                          {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      </div>
                      <div className={`chat-bubble text-sm ${
                        message.userId === session.user.id ? 'chat-bubble-primary' : 'chat-bubble-secondary'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-base-300">
            <div className="flex gap-2">
              <textarea
                className="textarea textarea-bordered flex-1 resize-none"
                rows={1}
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}