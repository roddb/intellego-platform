import Anthropic from '@anthropic-ai/sdk';

/**
 * Cliente de Claude Haiku 4.5 para Intellego Platform
 *
 * Configuración optimizada para análisis educativo:
 * - Temperature 0.1 (determinístico para evaluaciones justas)
 * - Max tokens 1500 (suficiente para feedback detallado)
 * - Timeout 60s (análisis complejos)
 * - 3 reintentos automáticos con backoff exponencial
 */
class ClaudeClient {
  private client: Anthropic | null = null;
  private defaultConfig: {
    model: string;
    temperature: number;
    max_tokens: number;
    stop_sequences: string[];
  };

  constructor() {
    // Nota: No inicializamos el cliente aquí para permitir que dotenv cargue primero
    // El cliente se inicializa lazy en getClient()

    // Configuración por defecto optimizada para educación
    this.defaultConfig = {
      model: 'claude-haiku-4-5',  // ← Identificador CORRECTO
      temperature: 0.1,            // Determinístico para evaluación justa
      max_tokens: 1500,            // Ajustable por endpoint
      stop_sequences: ['</feedback>', '\n\n---\n\n', '\nEn conclusión']
    };
  }

  /**
   * Obtener cliente (lazy initialization)
   */
  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error(
          'ANTHROPIC_API_KEY no encontrada. ' +
          'Asegúrate de que existe en el archivo .env'
        );
      }

      this.client = new Anthropic({
        apiKey,
        timeout: 60000,  // 60 segundos
        maxRetries: 3    // Reintentos automáticos
      });
    }

    return this.client;
  }

  /**
   * Wrapper principal para llamadas a la API con manejo robusto de errores
   */
  async createMessage(config: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    max_tokens?: number;
    temperature?: number;
    system?: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
    stop_sequences?: string[];  // Permite override de stop sequences
  }, retryCount = 0): Promise<{
    success: boolean;
    content?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    requestId?: string;
    latency?: number;
    error?: {
      message: string;
      status?: number;
      type?: string;
    };
  }> {
    const startTime = Date.now();

    try {
      const client = this.getClient();
      const response = await client.messages.create({
        model: this.defaultConfig.model,
        temperature: config.temperature ?? this.defaultConfig.temperature,
        max_tokens: config.max_tokens ?? this.defaultConfig.max_tokens,
        stop_sequences: config.stop_sequences ?? this.defaultConfig.stop_sequences,
        stream: false,  // Explicitly use non-streaming API
        ...config
      });

      const latency = Date.now() - startTime;

      // Logging para monitoreo
      console.log('✅ Claude API call successful', {
        model: this.defaultConfig.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs: latency,
        requestId: response.id,
        cacheHit: (response.usage.cache_read_input_tokens ?? 0) > 0
      });

      return {
        success: true,
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? undefined,
          cache_read_input_tokens: response.usage.cache_read_input_tokens ?? undefined
        },
        requestId: response.id,
        latency
      };

    } catch (error: any) {
      return this._handleError(error, config, retryCount);
    }
  }

  /**
   * Manejo de errores con estrategia de reintentos
   */
  private async _handleError(
    error: any,
    config: any,
    retryCount: number
  ): Promise<any> {
    const errorInfo = {
      message: error.message,
      status: error.status,
      type: error.type,
      requestId: error.request_id
    };

    console.error('❌ Claude API error', errorInfo);

    // Errores de cliente (4xx excepto 429) - no reintentar
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return {
        success: false,
        error: {
          message: 'Error de solicitud',
          status: error.status,
          type: error.type
        }
      };
    }

    // Rate limit (429) o errores de servidor (5xx) - reintentar con backoff exponencial
    if (retryCount < 2 && (error.status === 429 || error.status >= 500)) {
      const waitTime = 1000 * Math.pow(2, retryCount);
      console.log(`⏳ Reintentando en ${waitTime}ms... (intento ${retryCount + 1}/3)`);

      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.createMessage(config, retryCount + 1);
    }

    return {
      success: false,
      error: {
        message: 'Error de API después de reintentos',
        status: error.status,
        type: error.type
      }
    };
  }

  /**
   * Crear stream para respuestas progresivas (Fase 2)
   */
  async createMessageStream(config: any) {
    try {
      const client = this.getClient();
      return await client.messages.create({
        model: this.defaultConfig.model,
        temperature: config.temperature ?? this.defaultConfig.temperature,
        max_tokens: config.max_tokens ?? this.defaultConfig.max_tokens,
        ...config,
        stream: true
      });
    } catch (error: any) {
      console.error('❌ Stream creation error', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtener configuración por defecto (para debugging)
   */
  getDefaultConfig() {
    return { ...this.defaultConfig };
  }
}

// Exportar instancia singleton
export default new ClaudeClient();
