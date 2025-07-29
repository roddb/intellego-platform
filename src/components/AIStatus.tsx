'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, ExternalLink, RefreshCw, Info } from 'lucide-react'

interface ProviderStatus {
  configured: boolean
  available: boolean
  name: string
  description: string
}

interface AIStatusData {
  primaryProvider: string
  availableProviders: string[]
  providerStatus: Record<string, ProviderStatus>
  recommendations: Array<{
    type: 'warning' | 'info'
    message: string
    action: string
  }>
  instructions: Record<string, {
    steps: string[]
  }>
}

export default function AIStatus() {
  const [status, setStatus] = useState<AIStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInstructions, setShowInstructions] = useState<string | null>(null)

  useEffect(() => {
    fetchAIStatus()
  }, [])

  const fetchAIStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching AI status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
          <span className="text-slate-600">Verificando estado de IA...</span>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-slate-600">Error al verificar el estado de IA</span>
          <button 
            onClick={fetchAIStatus}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (provider: ProviderStatus) => {
    if (provider.available) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (provider.configured) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusText = (provider: ProviderStatus) => {
    if (provider.available) {
      return 'Funcionando'
    } else if (provider.configured) {
      return 'Configurado pero no disponible'
    } else {
      return 'No configurado'
    }
  }

  const getStatusColor = (provider: ProviderStatus) => {
    if (provider.available) {
      return 'text-green-600'
    } else if (provider.configured) {
      return 'text-yellow-600'
    } else {
      return 'text-slate-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Estado Principal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Estado de IA Tutora</h3>
          <button 
            onClick={fetchAIStatus}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Actualizar estado"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
          {status.availableProviders.length > 1 ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : status.availableProviders.length === 1 && status.primaryProvider !== 'templates_only' ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          )}
          
          <div>
            <p className="font-medium text-slate-900">
              {status.primaryProvider === 'templates_only' 
                ? 'Funcionando con plantillas' 
                : `Funcionando con ${status.providerStatus[status.primaryProvider]?.name || status.primaryProvider}`
              }
            </p>
            <p className="text-sm text-slate-600">
              {status.availableProviders.length} proveedor(es) disponible(s)
            </p>
          </div>
        </div>

        {/* Recomendaciones */}
        {status.recommendations.length > 0 && (
          <div className="space-y-3">
            {status.recommendations.map((rec, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <Info className={`h-4 w-4 mt-0.5 ${
                    rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      {rec.message}
                    </p>
                    <p className={`text-sm ${
                      rec.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Proveedores */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h4 className="font-medium text-slate-900 mb-4">Proveedores de IA</h4>
        <div className="space-y-3">
          {Object.entries(status.providerStatus).map(([key, provider]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(provider)}
                <div>
                  <p className="font-medium text-slate-900">{provider.name}</p>
                  <p className="text-sm text-slate-600">{provider.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${getStatusColor(provider)}`}>
                  {getStatusText(provider)}
                </span>
                
                {!provider.configured && key !== 'templates_only' && (
                  <button
                    onClick={() => setShowInstructions(showInstructions === key ? null : key)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                  >
                    Configurar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones de Configuración */}
      {showInstructions && status.instructions[showInstructions] && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900">
              Configurar {status.providerStatus[showInstructions]?.name}
            </h4>
            <button
              onClick={() => setShowInstructions(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <p className="text-slate-600 mb-4">
              Sigue estos pasos para configurar {status.providerStatus[showInstructions]?.name}:
            </p>
            
            <ol className="space-y-2">
              {status.instructions[showInstructions].steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ol>

            {showInstructions === 'google_gemini' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <span>Ir a Google AI Studio</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {showInstructions === 'huggingface' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <span>Ir a Hugging Face Tokens</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {showInstructions === 'ollama_local' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <a
                  href="https://ollama.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <span>Descargar Ollama</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>Nota:</strong> Después de configurar las variables de entorno, reinicia tu aplicación para que los cambios surtan efecto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}