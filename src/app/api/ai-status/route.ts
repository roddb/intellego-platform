import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiService } from '@/lib/ai-providers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check available AI providers
    const availableProviders = await aiService.getAvailableProviders()
    
    // Check environment variables status
    const providerStatus = {
      google_gemini: {
        configured: !!process.env.GOOGLE_AI_API_KEY,
        available: availableProviders.includes('google_gemini'),
        name: 'Google Gemini',
        description: 'Generación de alta calidad, 15 requests/minuto gratis'
      },
      huggingface: {
        configured: !!process.env.HUGGING_FACE_API_KEY,
        available: availableProviders.includes('huggingface'),
        name: 'Hugging Face',
        description: '30,000 caracteres/mes gratis'
      },
      ollama_local: {
        configured: process.env.OLLAMA_ENABLED === 'true',
        available: availableProviders.includes('ollama_local'),
        name: 'Ollama Local',
        description: 'IA local sin límites (requiere instalación)'
      },
      transformers_js: {
        configured: process.env.TRANSFORMERS_JS_ENABLED === 'true',
        available: availableProviders.includes('transformers_js'),
        name: 'Transformers.js',
        description: 'IA en el navegador (experimental)'
      },
      templates_only: {
        configured: true,
        available: availableProviders.includes('templates_only'),
        name: 'Solo Plantillas',
        description: 'Fallback siempre disponible'
      }
    }

    // Determine the primary provider being used
    const primaryProvider = availableProviders[0] || 'templates_only'
    
    // Configuration recommendations
    const recommendations = []
    
    if (!providerStatus.google_gemini.configured && !providerStatus.huggingface.configured && !providerStatus.ollama_local.configured) {
      recommendations.push({
        type: 'warning',
        message: 'No hay proveedores de IA configurados. La IA Tutora usará solo plantillas.',
        action: 'Configura al menos un proveedor de IA para mejorar la calidad de los ejercicios.'
      })
    }
    
    if (!providerStatus.google_gemini.configured) {
      recommendations.push({
        type: 'info',
        message: 'Google Gemini es el proveedor recomendado para mejor calidad.',
        action: 'Obtén una API key gratuita en https://ai.google.dev/'
      })
    }

    return NextResponse.json({
      success: true,
      primaryProvider,
      availableProviders,
      providerStatus,
      recommendations,
      instructions: {
        google_gemini: {
          steps: [
            'Ve a https://ai.google.dev/',
            'Haz clic en "Get API Key"',
            'Crea un proyecto nuevo o selecciona uno existente',
            'Copia tu API key',
            'Agrégala a tu archivo .env como GOOGLE_AI_API_KEY=tu_api_key'
          ]
        },
        huggingface: {
          steps: [
            'Ve a https://huggingface.co/settings/tokens',
            'Crea una cuenta gratuita si no tienes',
            'Crea un nuevo token con permisos de "Read"',
            'Copia tu token',
            'Agrégalo a tu archivo .env como HUGGING_FACE_API_KEY=tu_token'
          ]
        },
        ollama_local: {
          steps: [
            'Descarga Ollama de https://ollama.ai/',
            'Instala la aplicación',
            'Ejecuta en terminal: ollama pull llama3.1:8b',
            'En tu archivo .env, cambia OLLAMA_ENABLED="true"',
            'Reinicia tu aplicación'
          ]
        }
      }
    })

  } catch (error) {
    console.error('Error checking AI status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}