// AI Providers Configuration
// Supports multiple AI providers with fallback system

export enum AIProvider {
  GOOGLE_GEMINI = 'google_gemini',
  GROQ = 'groq',
  HUGGING_FACE = 'huggingface',
  OLLAMA_LOCAL = 'ollama_local',
  TRANSFORMERS_JS = 'transformers_js',
  TEMPLATES_ONLY = 'templates_only'
}

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  model?: string
  enabled: boolean
}

// Default configuration - Groq first for ultra-fast responses
export const AI_CONFIG: AIConfig[] = [
  {
    provider: AIProvider.GROQ,
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile', // Ultra-fast: 249 tokens/sec
    enabled: !!process.env.GROQ_API_KEY
  },
  {
    provider: AIProvider.GOOGLE_GEMINI,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-1.5-flash', // Free tier model - backup
    enabled: !!process.env.GOOGLE_AI_API_KEY
  },
  {
    provider: AIProvider.HUGGING_FACE,
    apiKey: process.env.HUGGING_FACE_API_KEY,
    baseUrl: 'https://api-inference.huggingface.co/models',
    model: 'microsoft/DialoGPT-large', // Good for educational content
    enabled: !!process.env.HUGGING_FACE_API_KEY
  },
  {
    provider: AIProvider.OLLAMA_LOCAL,
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    enabled: process.env.OLLAMA_ENABLED === 'true'
  },
  {
    provider: AIProvider.TRANSFORMERS_JS,
    enabled: process.env.TRANSFORMERS_JS_ENABLED === 'true'
  },
  {
    provider: AIProvider.TEMPLATES_ONLY,
    enabled: true // Always available as final fallback
  }
]

// Abstract AI Provider Interface
export abstract class BaseAIProvider {
  protected config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  abstract generateExercise(prompt: string): Promise<string>
  abstract isAvailable(): Promise<boolean>
}

// Google Gemini Provider
export class GoogleGeminiProvider extends BaseAIProvider {
  async generateExercise(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Google AI API key not configured')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 500,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates[0]?.content?.parts[0]?.text || 'Error generating content'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }
}

// Hugging Face Provider
export class HuggingFaceProvider extends BaseAIProvider {
  async generateExercise(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Hugging Face API key not configured')
    }

    const response = await fetch(`${this.config.baseUrl}/${this.config.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          return_full_text: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    return data[0]?.generated_text || 'Error generating content'
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }
}

// Ollama Local Provider
export class OllamaProvider extends BaseAIProvider {
  async generateExercise(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 300
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response || 'Error generating content'
    } catch (error) {
      throw new Error(`Ollama connection failed: ${error}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Transformers.js Provider (Browser-based)
export class TransformersJSProvider extends BaseAIProvider {
  private pipeline: any = null

  async generateExercise(prompt: string): Promise<string> {
    if (!this.pipeline) {
      const { pipeline } = await import('@xenova/transformers')
      this.pipeline = await pipeline('text-generation', 'Xenova/gpt2')
    }

    const result = await this.pipeline(prompt, {
      max_new_tokens: 150,
      temperature: 0.7
    })

    return result[0]?.generated_text?.replace(prompt, '').trim() || 'Error generating content'
  }

  async isAvailable(): Promise<boolean> {
    try {
      await import('@xenova/transformers')
      return true
    } catch {
      return false
    }
  }
}

// Groq Provider
export class GroqProvider extends BaseAIProvider {
  async generateExercise(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Groq API key not configured')
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Eres Sara, un asistente personal académico especializado en ayudar a estudiantes con organización, planificación y aprendizaje. Responde de manera clara, práctica y motivacional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Groq API error (${response.status}): ${errorData}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Error generating content'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) return false
    
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Template Provider (Always Available Fallback)
export class TemplateProvider extends BaseAIProvider {
  async generateExercise(prompt: string): Promise<string> {
    // This will use the existing template system
    return 'TEMPLATE_FALLBACK'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }
}

// Provider Factory
export class AIProviderFactory {
  static createProvider(config: AIConfig): BaseAIProvider {
    switch (config.provider) {
      case AIProvider.GOOGLE_GEMINI:
        return new GoogleGeminiProvider(config)
      case AIProvider.GROQ:
        return new GroqProvider(config)
      case AIProvider.HUGGING_FACE:
        return new HuggingFaceProvider(config)
      case AIProvider.OLLAMA_LOCAL:
        return new OllamaProvider(config)
      case AIProvider.TRANSFORMERS_JS:
        return new TransformersJSProvider(config)
      case AIProvider.TEMPLATES_ONLY:
        return new TemplateProvider(config)
      default:
        throw new Error(`Unknown AI provider: ${config.provider}`)
    }
  }
}

// Main AI Service with Fallback System
export class AIService {
  private providers: BaseAIProvider[] = []
  private currentProviderIndex = 0

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    this.providers = AI_CONFIG
      .filter(config => config.enabled)
      .map(config => AIProviderFactory.createProvider(config))
  }

  async generateExercise(prompt: string): Promise<string> {
    for (let i = this.currentProviderIndex; i < this.providers.length; i++) {
      const provider = this.providers[i]
      
      try {
        const isAvailable = await provider.isAvailable()
        if (!isAvailable) {
          console.log(`Provider ${i} not available, trying next...`)
          continue
        }

        const result = await provider.generateExercise(prompt)
        
        if (result === 'TEMPLATE_FALLBACK') {
          return result // Special marker for template system
        }
        
        if (result && result.length > 10) { // Basic quality check
          this.currentProviderIndex = i // Remember working provider
          return result
        }
      } catch (error) {
        console.error(`Provider ${i} failed:`, error)
        continue
      }
    }

    // If all providers fail, return template fallback marker
    return 'TEMPLATE_FALLBACK'
  }

  async getAvailableProviders(): Promise<string[]> {
    const available = []
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const isAvailable = await this.providers[i].isAvailable()
        if (isAvailable) {
          available.push(AI_CONFIG[i].provider)
        }
      } catch {
        // Provider not available
      }
    }
    return available
  }
}

// Export singleton instance
export const aiService = new AIService()