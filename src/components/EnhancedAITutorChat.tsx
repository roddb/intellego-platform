'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Brain, BookOpen, Target, User, Sparkles, BarChart3, HelpCircle, Calendar, Clock, Settings, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ConversationMode, IntentType } from '@/lib/advanced-intent-engine'
import { SaraPersonalityEngine } from '@/lib/sara-personality'

interface EnhancedChatMessage {
  id: string
  type: 'user' | 'ai' | 'system' | 'suggestion'
  content: string
  timestamp: Date
  mode: ConversationMode
  intent?: IntentType
  metadata?: {
    subject?: string
    resources?: any[]
    suggestedActions?: string[]
    followUpQuestions?: string[]
    visualizations?: any[]
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
}

interface ChatSession {
  userId: string
  sessionId: string
  currentMode: ConversationMode
  context: any
  messageHistory: EnhancedChatMessage[]
  activeFeatures: {
    smartSuggestions: boolean
    proactiveInsights: boolean
    multiModalResponses: boolean
    adaptiveTone: boolean
  }
}

export default function EnhancedAITutorChat() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [currentMode, setCurrentMode] = useState<ConversationMode>(ConversationMode.CHATTING)
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([])
  const [proactiveInsights, setProactiveInsights] = useState<string[]>([])
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Configuración de modos conversacionales
  const conversationModes = [
    {
      mode: ConversationMode.PLANNING,
      icon: Calendar,
      title: 'Planificación',
      description: 'Organiza tu tiempo y crea planes de estudio',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      mode: ConversationMode.TUTORING,
      icon: Brain,
      title: 'Tutoría',
      description: 'Aprende conceptos y resuelve ejercicios',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      mode: ConversationMode.ORGANIZING,
      icon: Target,
      title: 'Organización',
      description: 'Gestiona materiales y recursos',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      mode: ConversationMode.REVIEWING,
      icon: BarChart3,
      title: 'Análisis',
      description: 'Revisa tu progreso y rendimiento',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      mode: ConversationMode.CHATTING,
      icon: Sparkles,
      title: 'Conversación',
      description: 'Chat casual y apoyo motivacional',
      color: 'bg-pink-100 text-pink-700 border-pink-200'
    }
  ]

  // Generar sessionId estable al montar el componente
  useEffect(() => {
    if (session?.user && !sessionId) {
      const newSessionId = `session_${session.user.id}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      console.log('🎯 Generated stable sessionId:', newSessionId)
    }
  }, [session?.user, sessionId])

  // Inicializar conversación con Sara
  useEffect(() => {
    if (session?.user && sessionId) {
      initializeWithSara()
    }
  }, [session, sessionId])

  // Auto-scroll y foco
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const initializeWithSara = async () => {
    try {
      setIsInitializing(true)
      
      // Inicializar conversación con Sara
      const response = await fetch('/api/ai-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          userName: session?.user?.name,
          sessionId: sessionId,
          mode: currentMode
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const welcomeMessage: EnhancedChatMessage = {
          id: `init_${Date.now()}`,
          type: 'ai',
          content: data.welcomeMessage || '¡Hola! Soy Sara, tu asistente personal académico. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date(),
          mode: currentMode,
          metadata: {
            suggestedActions: data.suggestedActions || [
              'Planificar sesiones de estudio',
              'Revisar mi progreso',
              'Organizar mi horario',
              'Buscar materiales de estudio'
            ],
            followUpQuestions: data.followUpQuestions || [
              '¿Qué te gustaría lograr hoy?',
              '¿Hay alguna materia en la que necesites ayuda?'
            ]
          }
        }

        setMessages([welcomeMessage])
        
        // Cargar insights proactivos
        if (data.proactiveInsights) {
          setProactiveInsights(data.proactiveInsights)
        }
        
        // Generar sugerencias inteligentes
        generateSmartSuggestions(currentMode)
        
      } else {
        console.error('Error initializing chat')
      }
    } catch (error) {
      console.error('Error initializing Sara:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: EnhancedChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      mode: currentMode
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      console.log('📤 Sending message with sessionId:', sessionId)
      
      // Procesar comando avanzado con Sara
      const response = await fetch('/api/ai-chat/enhanced-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId: session?.user?.id,
          userName: session?.user?.name,
          sessionId: sessionId,
          currentMode,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMessage: EnhancedChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          mode: data.suggestedMode || currentMode,
          intent: data.detectedIntent,
          metadata: {
            suggestedActions: data.suggestedActions,
            followUpQuestions: data.followUpQuestions,
            visualizations: data.visualizations,
            priority: data.priority,
            resources: data.resources
          }
        }

        setMessages(prev => [...prev, aiMessage])
        
        // Actualizar modo si Sara lo sugiere
        if (data.suggestedMode && data.suggestedMode !== currentMode) {
          setCurrentMode(data.suggestedMode)
        }

        // Generar nuevas sugerencias basadas en la conversación
        generateContextualSuggestions(data.detectedIntent, data.response)
        
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: EnhancedChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Lo siento, hubo un problema procesando tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
        mode: currentMode
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setInputMessage(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const changeMode = (newMode: ConversationMode) => {
    setCurrentMode(newMode)
    setShowModeSelector(false)
    
    // Mensaje del sistema sobre cambio de modo
    const modeInfo = conversationModes.find(m => m.mode === newMode)
    const systemMessage: EnhancedChatMessage = {
      id: `mode_${Date.now()}`,
      type: 'system',
      content: `Modo cambiado a: ${modeInfo?.title}. ${modeInfo?.description}`,
      timestamp: new Date(),
      mode: newMode
    }
    
    setMessages(prev => [...prev, systemMessage])
    generateSmartSuggestions(newMode)
  }

  const generateSmartSuggestions = (mode: ConversationMode) => {
    const suggestions = {
      [ConversationMode.PLANNING]: [
        "Crea un plan de estudio para esta semana",
        "Organiza mi horario de matemáticas",
        "¿Cuándo debería estudiar para el examen?",
        "Optimiza mi tiempo de estudio"
      ],
      [ConversationMode.TUTORING]: [
        "Explícame este concepto de física",
        "Ayúdame con este ejercicio de química",
        "¿Puedes resolver este problema paso a paso?",
        "Necesito practicar álgebra"
      ],
      [ConversationMode.ORGANIZING]: [
        "Organiza mis materiales de estudio",
        "Importa mi horario escolar",
        "Encuentra recursos para biología",
        "Gestiona mis deadlines"
      ],
      [ConversationMode.REVIEWING]: [
        "Analiza mi progreso académico",
        "¿Cómo voy en matemáticas?",
        "Muestra mis estadísticas de estudio",
        "¿En qué materias debo mejorar?"
      ],
      [ConversationMode.CHATTING]: [
        "¿Cómo puedo mantenerme motivado?",
        "Me siento abrumado con los estudios",
        "Necesito consejos para concentrarme",
        "¿Cómo balanceo estudio y vida personal?"
      ]
    }
    
    setSmartSuggestions(suggestions[mode] || [])
  }

  const generateContextualSuggestions = (intent?: IntentType, response?: string) => {
    // Generar sugerencias basadas en el contexto de la conversación
    if (intent === IntentType.SCHEDULE_MANAGEMENT) {
      setSmartSuggestions([
        "Muestra mi calendario optimizado",
        "Detecta conflictos en mi horario",
        "Programa sesiones de estudio automáticamente"
      ])
    } else if (intent === IntentType.PERFORMANCE_ANALYSIS) {
      setSmartSuggestions([
        "¿Qué materias necesitan más atención?",
        "Genera un plan de mejora personalizado",
        "Compara mi rendimiento con objetivos"
      ])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderMessage = (message: EnhancedChatMessage) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
          <div
            className={`p-4 rounded-2xl ${
              isUser
                ? 'bg-teal-600 text-white'
                : isSystem
                ? 'bg-gray-100 text-gray-700 border-l-4 border-blue-500'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {message.metadata?.suggestedActions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.metadata.suggestedActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(action)}
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm hover:bg-teal-200 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
            
            {message.metadata?.followUpQuestions && (
              <div className="mt-3 text-sm opacity-75">
                {message.metadata.followUpQuestions.map((question, index) => (
                  <div key={index} className="mb-1">💭 {question}</div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1 px-1">
            {message.timestamp instanceof Date 
              ? message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : new Date(message.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            }
            {message.mode !== ConversationMode.CHATTING && (
              <span className="ml-2 text-teal-600">
                • {conversationModes.find(m => m.mode === message.mode)?.title}
              </span>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 ml-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando Sara...</p>
        </div>
      </div>
    )
  }

  const currentModeInfo = conversationModes.find(m => m.mode === currentMode)

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header con selector de modo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sara - Asistente Personal Académico</h3>
            <p className="text-sm text-gray-600">
              Modo: <span className="font-medium text-teal-600">{currentModeInfo?.title}</span>
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cambiar modo de conversación"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          
          {showModeSelector && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-3 border-b border-gray-100">
                <h4 className="font-medium text-gray-900">Modos de Conversación</h4>
                <p className="text-sm text-gray-600">Selecciona el tipo de ayuda que necesitas</p>
              </div>
              <div className="p-2">
                {conversationModes.map((modeInfo) => {
                  const IconComponent = modeInfo.icon
                  return (
                    <button
                      key={modeInfo.mode}
                      onClick={() => changeMode(modeInfo.mode)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors mb-2 ${
                        currentMode === modeInfo.mode
                          ? modeInfo.color
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{modeInfo.title}</div>
                          <div className="text-sm opacity-75">{modeInfo.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias inteligentes */}
      {smartSuggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Sugerencias</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input de mensaje */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Escribe tu mensaje para ${currentModeInfo?.title.toLowerCase()}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Sara responde usando inteligencia artificial. Verifica información importante.
        </div>
      </div>
    </div>
  )
}