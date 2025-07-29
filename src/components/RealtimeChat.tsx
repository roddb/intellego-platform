'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
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

interface RealtimeChatProps {
  className?: string
  compact?: boolean
}

export default function RealtimeChat({ className = '', compact = false }: RealtimeChatProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isVisible, setIsVisible] = useState(!compact)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Initialize socket connection
    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      query: {
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role
      }
    })

    socketIo.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
    })

    socketIo.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    })

    socketIo.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socketIo.on('userJoined', (user: OnlineUser) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user])
      
      // Add notification message
      if (user.id !== session.user.id) {
        const notification: Message = {
          id: `notif-${Date.now()}`,
          userId: 'system',
          userName: 'Sistema',
          userRole: 'INSTRUCTOR',
          content: `${user.name} se ha conectado`,
          timestamp: new Date(),
          type: 'notification'
        }
        setMessages(prev => [...prev, notification])
      }
    })

    socketIo.on('userLeft', (user: OnlineUser) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== user.id))
      
      // Add notification message
      if (user.id !== session.user.id) {
        const notification: Message = {
          id: `notif-${Date.now()}`,
          userId: 'system',
          userName: 'Sistema',
          userRole: 'INSTRUCTOR',
          content: `${user.name} se ha desconectado`,
          timestamp: new Date(),
          type: 'notification'
        }
        setMessages(prev => [...prev, notification])
      }
    })

    socketIo.on('onlineUsers', (users: OnlineUser[]) => {
      setOnlineUsers(users)
    })

    socketIo.on('messageHistory', (history: Message[]) => {
      setMessages(history)
    })

    setSocket(socketIo)

    return () => {
      socketIo.disconnect()
    }
  }, [session?.user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !session?.user) return

    const message: Omit<Message, 'id' | 'timestamp'> = {
      userId: session.user.id,
      userName: session.user.name || 'Usuario',
      userRole: session.user.role as 'STUDENT' | 'INSTRUCTOR',
      content: newMessage.trim(),
      type: 'message'
    }

    socket.emit('sendMessage', message)
    setNewMessage('')
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
              {messages.length}
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
                <h3 className="font-bold">Chat en Vivo</h3>
                <div className={`flex items-center gap-1 ${isConnected ? 'text-success' : 'text-error'}`}>
                  <Circle className={`w-2 h-2 ${isConnected ? 'fill-current' : ''}`} />
                  <span className="text-xs">{isConnected ? 'Conectado' : 'Desconectado'}</span>
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
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}