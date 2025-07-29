'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Brain, BookOpen, Target, User, Sparkles, BarChart3, HelpCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: string | Date
  metadata?: {
    subject?: string
    exerciseId?: string
    suggestedActions?: string[]
  }
}

interface ConversationContext {
  userId: string
  userName?: string
  currentSubject?: string
  conversationHistory: ChatMessage[]
  lastInteraction: Date
  currentMode: 'chat' | 'assessment' | 'exercise' | 'explanation'
}

export default function AITutorChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Inicializar conversación
  useEffect(() => {
    if (session?.user) {
      initializeConversation()
    }
  }, [session])

  // Auto-scroll al final
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeConversation = async () => {
    try {
      setIsInitializing(true)
      const response = await fetch('/api/ai-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: session?.user?.name })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.conversationHistory || [])
      }
    } catch (error) {
      console.error('Error initializing conversation:', error)
      // Fallback welcome message
      setMessages([{
        id: `fallback_${Date.now()}`,
        type: 'ai',
        content: `¡Hola${session?.user?.name ? ' ' + session.user.name : ''}! 👋\n\nSoy tu tutor personal de IA. Estoy aquí para ayudarte con tus estudios.\n\n¿En qué puedo ayudarte hoy?\n• Resolver dudas sobre tus materias\n• Hacer ejercicios y evaluaciones\n• Explicar conceptos difíciles\n• Revisar tu progreso académico`,
        timestamp: new Date().toISOString(),
        metadata: {
          suggestedActions: ['Resolver dudas', 'Hacer ejercicios', 'Ver mi progreso']
        }
      }])
    } finally {
      setIsInitializing(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Preparar historial de conversación para el backend
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))

      const response = await fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputMessage.trim(),
          conversationHistory 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.response])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Fallback response
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: 'Disculpa, hubo un problema procesando tu mensaje. ¿Podrías intentar reformularlo?',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedAction = (action: string) => {
    setInputMessage(action)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessage = (content: string) => {
    // Formato básico para markdown-like text
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .split('\n')
      .map((line, index) => (
        <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
        </div>
      ))
  }

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4 text-slate-600" />
      case 'ai':
        return <Brain className="h-4 w-4 text-purple-600" />
      default:
        return <Sparkles className="h-4 w-4 text-blue-600" />
    }
  }

  const getMessageBubbleClass = (type: ChatMessage['type']) => {
    if (type === 'user') {
      return 'bg-purple-600 text-white ml-auto max-w-[80%]'
    }
    return 'bg-white border border-slate-200 mr-auto max-w-[90%]'
  }

  const getMessageTextClass = (type: ChatMessage['type']) => {
    return type === 'user' ? 'text-white' : 'text-slate-800'
  }

  if (isInitializing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Inicializando IA Tutora
          </h3>
          <p className="text-slate-600">
            Analizando tu progreso académico...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              IA Tutora Personal
            </h3>
            <p className="text-sm text-slate-600">
              Asistente educativo inteligente • Siempre disponible
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={initializeConversation}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reiniciar conversación"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            {message.type !== 'user' && (
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-full">
                {getMessageIcon(message.type)}
              </div>
            )}
            
            <div className={`rounded-lg p-3 ${getMessageBubbleClass(message.type)}`}>
              <div className={`text-sm leading-relaxed ${getMessageTextClass(message.type)}`}>
                {formatMessage(message.content)}
              </div>
              
              {/* Suggested Actions */}
              {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Acciones sugeridas:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.suggestedActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedAction(action)}
                        className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-slate-400 mt-2">
                {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 p-2 bg-slate-100 rounded-full">
                {getMessageIcon(message.type)}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-purple-100 rounded-full">
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 max-w-[90%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta o dime en qué puedo ayudarte..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { icon: BookOpen, text: "Hacer una evaluación", action: "Quiero hacer una evaluación adaptativa" },
            { icon: HelpCircle, text: "Resolver una duda", action: "Tengo una duda que resolver" },
            { icon: Target, text: "Practicar ejercicios", action: "Quiero practicar con ejercicios" },
            { icon: BarChart3, text: "Ver mi progreso", action: "Muéstrame mi progreso académico" }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedAction(item.action)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              disabled={isLoading}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}