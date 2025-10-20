# Product Requirements Document (PRD)
## Integración de Claude Haiku 4.5 API para Plataforma Educativa

**Versión:** 1.0  
**Fecha:** Octubre 20, 2025  
**Autor:** Rodrigo Di Bernardo  
**Stack Tecnológico:** Node.js, Express.js  
**Modelo de IA:** Claude Haiku 4.5 (`claude-haiku-4-5`)

---

## 1. Resumen Ejecutivo

### 1.1 Visión del Proyecto
Integrar la API de Anthropic Claude Haiku 4.5 en la plataforma educativa existente para automatizar tres tareas críticas de procesamiento de texto: análisis de contenido educativo, generación de retroalimentación personalizada para estudiantes, y comparación de trabajos contra rúbricas estandarizadas.

### 1.2 Objetivos de Negocio
- **Eficiencia Operacional**: Reducir tiempo de retroalimentación de 48-72 horas a <5 minutos
- **Escalabilidad**: Procesar 300 trabajos/semana (~43 diarios) con capacidad de escalar a 1,000+
- **Costo-Efectividad**: Mantener costos operacionales bajo $5 USD/mes mediante optimizaciones estratégicas
- **Calidad Consistente**: Lograr >85% concordancia con evaluaciones humanas

### 1.3 Alcance de la Integración
**Incluido en esta fase:**
- Servicio de API Claude Haiku 4.5 con manejo robusto de errores
- Endpoint de análisis de texto en tiempo real
- Endpoint de retroalimentación educativa personalizada
- Endpoint de comparación con rúbricas
- Sistema de procesamiento por lotes (Batch API) para calificación nocturna
- Implementación de prompt caching para optimización de costos
- Sistema de monitoreo y logging de uso de tokens
- Configuración de seguridad y variables de entorno

**No incluido (futuras fases):**
- Interfaz de usuario frontend para gestión de rúbricas
- Sistema de autenticación de usuarios finales (se asume existente)
- Dashboard de métricas en tiempo real
- Integración con bases de datos específicas (se proveen interfaces genéricas)

---

## 2. Contexto Técnico

### 2.1 Estado Actual del Proyecto
- **Arquitectura Existente**: Aplicación Node.js con Express.js funcional
- **Base de Datos**: Asumida existente (implementación agnóstica)
- **Autenticación**: Sistema existente para proteger endpoints
- **Deployment**: Infraestructura Node.js configurada
- **Gap Principal**: Sin integración de IA para procesamiento de texto

### 2.2 Decisiones Técnicas Clave

#### Modelo Seleccionado: Claude Haiku 4.5
**Justificación basada en investigación:**
- **Rendimiento**: Iguala Claude Sonnet 4 (estado del arte mayo 2025) en capacidades de análisis de texto
- **Costo**: 67% más económico que Sonnet 4.5 ($1/$5 vs $3/$15 por MTok entrada/salida)
- **Velocidad**: 2x más rápido que Sonnet, crítico para retroalimentación en tiempo real
- **Capacidades**: 73.3% en SWE-bench Verified, 200K tokens contexto, 64K tokens salida

#### Identificador Correcto del Modelo
```javascript
model: 'claude-haiku-4-5'  // ✅ CORRECTO
// NO usar: 'claude-haiku-4-5-20250929' ❌ INCORRECTO
```

#### Stack de Dependencias
```json
{
  "@anthropic-ai/sdk": "^0.27.0",
  "express": "^4.18.2",
  "dotenv": "^16.3.1",
  "winston": "^3.11.0"
}
```

---

## 3. Arquitectura de la Solución

### 3.1 Estructura de Archivos Propuesta

```
proyecto-raiz/
├── src/
│   ├── services/
│   │   ├── claude/
│   │   │   ├── client.js              # Cliente Anthropic configurado
│   │   │   ├── analyzer.js            # Servicio de análisis educativo
│   │   │   ├── batch-processor.js     # Procesamiento por lotes
│   │   │   └── prompts/
│   │   │       ├── feedback.js        # Prompts de retroalimentación
│   │   │       ├── analysis.js        # Prompts de análisis
│   │   │       └── comparison.js      # Prompts de comparación
│   │   └── monitoring/
│   │       └── token-tracker.js       # Monitoreo de tokens
│   ├── routes/
│   │   └── api/
│   │       └── claude.routes.js       # Endpoints API
│   ├── middleware/
│   │   ├── error-handler.js           # Manejo de errores global
│   │   └── rate-limiter.js            # Limitación de tasas
│   ├── config/
│   │   └── claude.config.js           # Configuración centralizada
│   └── utils/
│       ├── validators.js              # Validación de entrada
│       └── logger.js                  # Sistema de logging
├── tests/
│   ├── integration/
│   │   └── claude.test.js
│   └── unit/
│       └── analyzer.test.js
├── .env.example
├── .env
└── .gitignore
```

### 3.2 Flujo de Datos

```
Cliente HTTP Request
    ↓
[Express Middleware: Auth + Rate Limit + Validación]
    ↓
[Route Handler] → [Analyzer Service]
    ↓                    ↓
[Claude Client] ← [Prompt Builder]
    ↓                    ↓
[Anthropic API] ← [Cache Strategy]
    ↓
[Response Handler] → [Token Tracker]
    ↓
Cliente HTTP Response
```

---

## 4. Especificaciones Técnicas Detalladas

### 4.1 Configuración Base del Cliente Claude

#### Archivo: `src/services/claude/client.js`

```javascript
import Anthropic from '@anthropic-ai/sdk';
import logger from '../../utils/logger.js';

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Timeout de 60 segundos para análisis complejos
      timeout: 60000,
      // Máximo 3 reintentos automáticos
      maxRetries: 3
    });
    
    // Configuración por defecto optimizada para educación
    this.defaultConfig = {
      model: 'claude-haiku-4-5',
      temperature: 0.1,  // Determinístico para evaluación justa
      max_tokens: 1500,  // Ajustable por endpoint
      // Stop sequences para prevenir verbosidad
      stop_sequences: ['</feedback>', '\n\n---\n\n', '\nEn conclusión']
    };
  }

  /**
   * Wrapper principal para llamadas a la API con manejo robusto de errores
   */
  async createMessage(config, retryCount = 0) {
    const startTime = Date.now();
    
    try {
      const response = await this.client.messages.create({
        ...this.defaultConfig,
        ...config
      });

      const latency = Date.now() - startTime;

      // Logging para monitoreo
      logger.info('Claude API call successful', {
        model: config.model || this.defaultConfig.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs: latency,
        requestId: response.id,
        cacheHit: response.usage.cache_read_input_tokens > 0
      });

      return {
        success: true,
        content: response.content[0].text,
        usage: response.usage,
        requestId: response.id,
        latency
      };

    } catch (error) {
      return this._handleError(error, config, retryCount);
    }
  }

  /**
   * Manejo de errores con estrategia de reintentos
   */
  _handleError(error, config, retryCount) {
    const errorInfo = {
      message: error.message,
      status: error.status,
      type: error.type,
      requestId: error.request_id
    };

    logger.error('Claude API error', errorInfo);

    // Errores de cliente (4xx excepto 429) - no reintentar
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      return {
        success: false,
        error: {
          message: 'Error de solicitud',
          details: error.message,
          status: error.status
        }
      };
    }

    // Rate limit (429) o errores de servidor (5xx) - reintentar con backoff exponencial
    if (retryCount < 2 && (error.status === 429 || error.status >= 500)) {
      const waitTime = 1000 * Math.pow(2, retryCount);
      logger.warn(`Retrying after ${waitTime}ms...`, { retryCount });
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.createMessage(config, retryCount + 1));
        }, waitTime);
      });
    }

    return {
      success: false,
      error: {
        message: 'Error de API después de reintentos',
        details: error.message,
        status: error.status
      }
    };
  }

  /**
   * Crear stream para respuestas progresivas
   */
  async createMessageStream(config) {
    try {
      return await this.client.messages.create({
        ...this.defaultConfig,
        ...config,
        stream: true
      });
    } catch (error) {
      logger.error('Stream creation error', { error: error.message });
      throw error;
    }
  }
}

export default new ClaudeClient();
```

### 4.2 Servicio de Análisis Educativo

#### Archivo: `src/services/claude/analyzer.js`

```javascript
import claudeClient from './client.js';
import { buildFeedbackPrompt, buildAnalysisPrompt, buildComparisonPrompt } from './prompts/index.js';
import tokenTracker from '../monitoring/token-tracker.js';

class EducationalAnalyzer {
  
  /**
   * Análisis de ensayo con retroalimentación personalizada
   * Optimizado con prompt caching para rúbricas
   */
  async analyzeEssay(essayText, rubric, options = {}) {
    const {
      maxTokens = 1500,
      temperature = 0.1,
      format = 'structured'  // 'structured' o 'narrative'
    } = options;

    const prompt = buildFeedbackPrompt(essayText, format);

    const config = {
      max_tokens: maxTokens,
      temperature,
      system: [
        {
          type: 'text',
          text: 'Eres un profesor experimentado especializado en proporcionar retroalimentación constructiva y específica para estudiantes de bachillerato.',
          cache_control: { type: 'ephemeral' }
        },
        {
          type: 'text',
          text: `<rubrica>\n${rubric}\n</rubrica>\n\nUtiliza esta rúbrica como guía para evaluar el trabajo del estudiante. Sé específico, constructivo y alentador.`,
          cache_control: { type: 'ephemeral' }  // Cachea la rúbrica
        }
      ],
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    const response = await claudeClient.createMessage(config);

    if (response.success) {
      // Rastrear uso para monitoreo
      await tokenTracker.track({
        operation: 'essay_analysis',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens || 0,
        cacheCreateTokens: response.usage.cache_creation_input_tokens || 0,
        latency: response.latency
      });

      return {
        success: true,
        feedback: response.content,
        metadata: {
          tokensUsed: response.usage,
          requestId: response.requestId,
          estimatedCost: this._calculateCost(response.usage)
        }
      };
    }

    return response;
  }

  /**
   * Comparación de trabajo contra rúbrica de referencia
   */
  async compareWithRubric(studentWork, referenceRubric, comparisonCriteria) {
    const prompt = buildComparisonPrompt(studentWork, referenceRubric, comparisonCriteria);

    const config = {
      max_tokens: 2000,
      temperature: 0.05,  // Muy determinístico para comparación objetiva
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    const response = await claudeClient.createMessage(config);

    if (response.success) {
      await tokenTracker.track({
        operation: 'rubric_comparison',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latency: response.latency
      });

      return {
        success: true,
        comparison: response.content,
        metadata: {
          tokensUsed: response.usage,
          estimatedCost: this._calculateCost(response.usage)
        }
      };
    }

    return response;
  }

  /**
   * Análisis de texto general sin rúbrica específica
   */
  async analyzeText(text, analysisType = 'comprehensive') {
    const prompt = buildAnalysisPrompt(text, analysisType);

    const config = {
      max_tokens: 1200,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    const response = await claudeClient.createMessage(config);

    if (response.success) {
      await tokenTracker.track({
        operation: 'text_analysis',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latency: response.latency
      });
    }

    return response;
  }

  /**
   * Calcula costo estimado basado en uso de tokens
   * Precios Claude Haiku 4.5: $1/MTok entrada, $5/MTok salida
   * Cache write: $1.25/MTok, Cache read: $0.10/MTok
   */
  _calculateCost(usage) {
    const inputCost = (usage.input_tokens / 1_000_000) * 1.00;
    const outputCost = (usage.output_tokens / 1_000_000) * 5.00;
    const cacheWriteCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * 1.25;
    const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.10;

    return {
      total: inputCost + outputCost + cacheWriteCost + cacheReadCost,
      breakdown: {
        input: inputCost,
        output: outputCost,
        cacheWrite: cacheWriteCost,
        cacheRead: cacheReadCost
      }
    };
  }

  /**
   * Streaming de retroalimentación para UI progresiva
   */
  async *streamFeedback(essayText, rubric) {
    const prompt = buildFeedbackPrompt(essayText, 'narrative');

    const config = {
      max_tokens: 1500,
      temperature: 0.1,
      system: [{
        type: 'text',
        text: `<rubrica>\n${rubric}\n</rubrica>\n\nProporciona retroalimentación constructiva.`,
        cache_control: { type: 'ephemeral' }
      }],
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    const stream = await claudeClient.createMessageStream(config);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}

export default new EducationalAnalyzer();
```

### 4.3 Sistema de Prompts Optimizados

#### Archivo: `src/services/claude/prompts/feedback.js`

```javascript
/**
 * Construye prompts para retroalimentación educativa
 * Optimizado para mínimo uso de tokens con máxima claridad
 */
export function buildFeedbackPrompt(essayText, format = 'structured') {
  // Validación de longitud
  const essayLength = essayText.length;
  const wordCount = essayText.split(/\s+/).length;

  const basePrompt = `<ensayo_estudiante>
${essayText}
</ensayo_estudiante>

<metadata>
Longitud: ${essayLength} caracteres
Palabras: ~${wordCount}
</metadata>`;

  if (format === 'structured') {
    return `${basePrompt}

<instrucciones>
Evalúa este ensayo según la rúbrica proporcionada. Proporciona retroalimentación en el siguiente formato estructurado:

1. PUNTAJE GENERAL: [número]/100
2. FORTALEZAS (2-3 puntos específicos con ejemplos del texto)
3. ÁREAS DE MEJORA (2-3 puntos con sugerencias accionables)
4. PRÓXIMOS PASOS (1-2 recomendaciones concretas)

Límite: 200 palabras totales. Sé específico y constructivo.
</instrucciones>

<formato_salida>
Puntaje: [X]/100

Fortalezas:
- [Fortaleza específica 1 con ejemplo]
- [Fortaleza específica 2 con ejemplo]

Áreas de mejora:
- [Mejora 1: problema + sugerencia]
- [Mejora 2: problema + sugerencia]

Próximos pasos:
- [Acción concreta 1]
- [Acción concreta 2]
</formato_salida>`;
  }

  // Formato narrativo
  return `${basePrompt}

<instrucciones>
Proporciona retroalimentación narrativa y personalizada para este estudiante. Incluye:
- Evaluación general de calidad
- 2-3 fortalezas específicas del trabajo
- 2-3 áreas donde puede mejorar
- Sugerencias concretas de cómo mejorar

Tono: alentador pero honesto. Límite: 250 palabras.
</instrucciones>`;
}
```

#### Archivo: `src/services/claude/prompts/comparison.js`

```javascript
/**
 * Prompts para comparación con rúbricas de referencia
 */
export function buildComparisonPrompt(studentWork, referenceRubric, criteria) {
  return `<rubrica_referencia>
${referenceRubric}
</rubrica_referencia>

<trabajo_estudiante>
${studentWork}
</trabajo_estudiante>

<criterios_comparacion>
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
</criterios_comparacion>

<instrucciones>
Compara sistemáticamente el trabajo del estudiante con la rúbrica de referencia.

Para cada criterio:
1. Identifica qué elementos están presentes en el trabajo del estudiante
2. Identifica qué elementos faltan o están incompletos
3. Evalúa la calidad relativa (escala: Excelente/Bueno/Aceptable/Necesita mejora)
4. Proporciona recomendación específica de cómo alcanzar el estándar

Formato: tabla o lista estructurada. Máximo 300 palabras.
</instrucciones>

<formato_salida>
CRITERIO 1: [nombre]
- Presente: [elementos encontrados]
- Ausente: [elementos faltantes]
- Calidad: [nivel]
- Recomendación: [acción específica]

[Repetir para cada criterio]

RESUMEN GENERAL:
- Puntos fuertes de alineación: [2-3]
- Brechas principales: [2-3]
- Prioridad de mejora: [orden de importancia]
</formato_salida>`;
}
```

#### Archivo: `src/services/claude/prompts/analysis.js`

```javascript
/**
 * Prompts para análisis general de texto
 */
export function buildAnalysisPrompt(text, analysisType) {
  const baseContext = `<texto_analizar>
${text}
</texto_analizar>`;

  const analysisTypes = {
    comprehensive: `${baseContext}

<instrucciones>
Proporciona un análisis completo de este texto educativo:

1. CONTENIDO: ¿Qué temas/conceptos principales aborda?
2. ESTRUCTURA: ¿Cómo está organizado? ¿Es coherente?
3. CLARIDAD: ¿Es comprensible? ¿Vocabulario apropiado?
4. ARGUMENTACIÓN: Si presenta argumentos, ¿son sólidos?
5. EVIDENCIA: ¿Usa ejemplos/datos de soporte?
6. GRAMÁTICA/ESTILO: Calidad técnica de la escritura

Límite: 250 palabras. Formato: lista numerada.
</instrucciones>`,

    grammar: `${baseContext}

<instrucciones>
Identifica y categoriza errores gramaticales/ortográficos:

1. ERRORES CRÍTICOS: [lista con corrección]
2. ERRORES MENORES: [lista con corrección]
3. PATRONES: ¿Hay errores recurrentes?
4. FORTALEZAS: Aspectos bien ejecutados

Proporciona 3 recomendaciones prioritarias para mejora.
Límite: 200 palabras.
</instrucciones>`,

    structure: `${baseContext}

<instrucciones>
Analiza la estructura y organización:

1. ORGANIZACIÓN GENERAL: ¿Tiene introducción, desarrollo, conclusión?
2. TRANSICIONES: ¿Flujo lógico entre ideas?
3. PÁRRAFOS: ¿Cada uno tiene idea principal clara?
4. JERARQUÍA: ¿Uso efectivo de títulos/subtítulos si aplica?

Califica estructura (0-100) y proporciona 3 sugerencias de mejora.
Límite: 150 palabras.
</instrucciones>`,

    content: `${baseContext}

<instrucciones>
Evalúa profundidad y calidad del contenido:

1. RELEVANCIA: ¿Aborda el tema apropiadamente?
2. PROFUNDIDAD: ¿Superficial o análisis profundo?
3. ORIGINALIDAD: ¿Perspectivas únicas o genérico?
4. EVIDENCIA: ¿Soporte adecuado para afirmaciones?
5. CONCLUSIONES: ¿Síntesis efectiva?

Puntaje contenido (0-100) + 3 áreas de fortalecimiento.
Límite: 200 palabras.
</instrucciones>`
  };

  return analysisTypes[analysisType] || analysisTypes.comprehensive;
}
```

### 4.4 Procesador por Lotes (Batch API)

#### Archivo: `src/services/claude/batch-processor.js`

```javascript
import claudeClient from './client.js';
import { buildFeedbackPrompt } from './prompts/index.js';
import logger from '../../utils/logger.js';

class BatchProcessor {
  constructor() {
    this.client = claudeClient.client;  // Cliente Anthropic directo
    this.activeBatches = new Map();
  }

  /**
   * Procesa múltiples ensayos en batch con 50% descuento
   * Ideal para calificación nocturna de tareas
   */
  async processBatch(essays, rubric, options = {}) {
    const {
      maxTokens = 1500,
      temperature = 0.1,
      batchName = `batch-${Date.now()}`
    } = options;

    logger.info(`Creating batch: ${batchName}`, { essayCount: essays.length });

    // Construir requests del batch
    const requests = essays.map((essay, index) => ({
      custom_id: essay.id || `essay-${index}`,
      params: {
        model: 'claude-haiku-4-5',
        max_tokens: maxTokens,
        temperature,
        system: [
          {
            type: 'text',
            text: 'Eres un profesor experimentado. Proporciona retroalimentación constructiva.',
            cache_control: { type: 'ephemeral' }
          },
          {
            type: 'text',
            text: `<rubrica>\n${rubric}\n</rubrica>`,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [{
          role: 'user',
          content: buildFeedbackPrompt(essay.text, 'structured')
        }]
      }
    }));

    try {
      // Crear batch
      const batch = await this.client.messages.batches.create({
        requests
      });

      this.activeBatches.set(batch.id, {
        name: batchName,
        status: 'processing',
        createdAt: new Date(),
        essayCount: essays.length
      });

      logger.info(`Batch created successfully`, {
        batchId: batch.id,
        status: batch.processing_status
      });

      return {
        success: true,
        batchId: batch.id,
        message: `Batch iniciado con ${essays.length} ensayos. Procesando...`
      };

    } catch (error) {
      logger.error('Batch creation failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Monitorea el progreso de un batch
   */
  async checkBatchStatus(batchId) {
    try {
      const status = await this.client.messages.batches.retrieve(batchId);

      this.activeBatches.set(batchId, {
        ...this.activeBatches.get(batchId),
        status: status.processing_status,
        progress: status.request_counts
      });

      return {
        success: true,
        batchId,
        status: status.processing_status,
        progress: {
          total: status.request_counts.processing + 
                 status.request_counts.succeeded + 
                 status.request_counts.errored + 
                 status.request_counts.canceled,
          processing: status.request_counts.processing,
          succeeded: status.request_counts.succeeded,
          failed: status.request_counts.errored,
          canceled: status.request_counts.canceled
        },
        expiresAt: status.expires_at
      };

    } catch (error) {
      logger.error('Batch status check failed', { batchId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene resultados de un batch completado
   */
  async getBatchResults(batchId) {
    try {
      // Verificar que el batch haya terminado
      const status = await this.client.messages.batches.retrieve(batchId);

      if (status.processing_status !== 'ended') {
        return {
          success: false,
          error: `Batch aún no completado. Estado: ${status.processing_status}`
        };
      }

      // Obtener resultados
      const results = [];
      const stream = await this.client.messages.batches.results(batchId);

      for await (const result of stream) {
        if (result.result.type === 'succeeded') {
          results.push({
            essayId: result.custom_id,
            feedback: result.result.message.content[0].text,
            usage: result.result.message.usage,
            cost: this._calculateBatchCost(result.result.message.usage)
          });
        } else {
          logger.error('Individual batch result failed', {
            essayId: result.custom_id,
            error: result.result.error
          });
          results.push({
            essayId: result.custom_id,
            error: result.result.error.message
          });
        }
      }

      // Limpiar batch de memoria
      this.activeBatches.delete(batchId);

      const successCount = results.filter(r => !r.error).length;
      const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

      logger.info('Batch results retrieved', {
        batchId,
        totalResults: results.length,
        successful: successCount,
        totalCost: totalCost.toFixed(6)
      });

      return {
        success: true,
        batchId,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          estimatedCost: totalCost
        }
      };

    } catch (error) {
      logger.error('Batch results retrieval failed', { batchId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula costo con descuento del 50% de Batch API
   */
  _calculateBatchCost(usage) {
    // Batch API: 50% descuento
    const inputCost = (usage.input_tokens / 1_000_000) * 0.50;  // $0.50 vs $1.00
    const outputCost = (usage.output_tokens / 1_000_000) * 2.50; // $2.50 vs $5.00
    const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.05; // $0.05 vs $0.10

    return inputCost + outputCost + cacheReadCost;
  }

  /**
   * Lista todos los batches activos
   */
  getActiveBatches() {
    return Array.from(this.activeBatches.entries()).map(([id, data]) => ({
      batchId: id,
      ...data
    }));
  }

  /**
   * Cancela un batch en progreso
   */
  async cancelBatch(batchId) {
    try {
      await this.client.messages.batches.cancel(batchId);
      this.activeBatches.delete(batchId);
      
      logger.info('Batch canceled', { batchId });
      return { success: true, message: 'Batch cancelado exitosamente' };
    } catch (error) {
      logger.error('Batch cancellation failed', { batchId, error: error.message });
      return { success: false, error: error.message };
    }
  }
}

export default new BatchProcessor();
```

### 4.5 Sistema de Monitoreo de Tokens

#### Archivo: `src/services/monitoring/token-tracker.js`

```javascript
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger.js';

class TokenTracker {
  constructor() {
    this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    this.stats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      totalCost: 0,
      operationBreakdown: {},
      dailyStats: {}
    };
    this.loadStats();
  }

  /**
   * Registra uso de tokens de una operación
   */
  async track(data) {
    const {
      operation,
      inputTokens,
      outputTokens,
      cacheReadTokens = 0,
      cacheCreateTokens = 0,
      latency
    } = data;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Calcular costo
    const cost = this._calculateCost(inputTokens, outputTokens, cacheReadTokens, cacheCreateTokens);

    // Actualizar estadísticas globales
    this.stats.totalRequests++;
    this.stats.totalInputTokens += inputTokens;
    this.stats.totalOutputTokens += outputTokens;
    this.stats.totalCacheReadTokens += cacheReadTokens;
    this.stats.totalCacheWriteTokens += cacheCreateTokens;
    this.stats.totalCost += cost;

    // Actualizar por operación
    if (!this.stats.operationBreakdown[operation]) {
      this.stats.operationBreakdown[operation] = {
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        avgLatency: 0
      };
    }

    const opStats = this.stats.operationBreakdown[operation];
    opStats.count++;
    opStats.inputTokens += inputTokens;
    opStats.outputTokens += outputTokens;
    opStats.cost += cost;
    opStats.avgLatency = ((opStats.avgLatency * (opStats.count - 1)) + latency) / opStats.count;

    // Actualizar estadísticas diarias
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0
      };
    }

    const dailyStats = this.stats.dailyStats[today];
    dailyStats.requests++;
    dailyStats.inputTokens += inputTokens;
    dailyStats.outputTokens += outputTokens;
    dailyStats.cost += cost;

    // Guardar periódicamente
    if (this.stats.totalRequests % 10 === 0) {
      await this.saveStats();
    }

    // Log si se excede umbral de costo
    if (this.stats.totalCost > 10) { // $10 umbral de alerta
      logger.warn('Monthly cost threshold exceeded', {
        currentCost: this.stats.totalCost.toFixed(2),
        threshold: 10
      });
    }
  }

  /**
   * Calcula costo de una operación
   */
  _calculateCost(inputTokens, outputTokens, cacheReadTokens, cacheCreateTokens) {
    return (
      (inputTokens / 1_000_000) * 1.00 +
      (outputTokens / 1_000_000) * 5.00 +
      (cacheReadTokens / 1_000_000) * 0.10 +
      (cacheCreateTokens / 1_000_000) * 1.25
    );
  }

  /**
   * Obtiene resumen de estadísticas
   */
  getStats(period = 'month') {
    if (period === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      return this.stats.dailyStats[today] || {};
    }

    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);

      const weekStats = Object.entries(this.stats.dailyStats)
        .filter(([date]) => date >= weekAgoStr)
        .reduce((acc, [_, stats]) => ({
          requests: (acc.requests || 0) + stats.requests,
          inputTokens: (acc.inputTokens || 0) + stats.inputTokens,
          outputTokens: (acc.outputTokens || 0) + stats.outputTokens,
          cost: (acc.cost || 0) + stats.cost
        }), {});

      return weekStats;
    }

    // Retornar stats del mes completo
    return {
      ...this.stats,
      avgCostPerRequest: this.stats.totalRequests > 0 
        ? (this.stats.totalCost / this.stats.totalRequests).toFixed(6)
        : 0,
      cacheHitRate: this.stats.totalCacheReadTokens > 0
        ? ((this.stats.totalCacheReadTokens / 
           (this.stats.totalInputTokens + this.stats.totalCacheReadTokens)) * 100).toFixed(2)
        : 0
    };
  }

  /**
   * Guarda estadísticas a disco
   */
  async saveStats() {
    try {
      const statsDir = path.join(process.cwd(), 'data', 'stats');
      await fs.mkdir(statsDir, { recursive: true });
      
      const filePath = path.join(statsDir, `token-stats-${this.currentMonth}.json`);
      await fs.writeFile(filePath, JSON.stringify(this.stats, null, 2));
      
      logger.debug('Token stats saved', { month: this.currentMonth });
    } catch (error) {
      logger.error('Failed to save token stats', { error: error.message });
    }
  }

  /**
   * Carga estadísticas del mes actual
   */
  async loadStats() {
    try {
      const filePath = path.join(
        process.cwd(), 
        'data', 
        'stats', 
        `token-stats-${this.currentMonth}.json`
      );
      const data = await fs.readFile(filePath, 'utf-8');
      this.stats = JSON.parse(data);
      logger.info('Token stats loaded', { month: this.currentMonth });
    } catch (error) {
      // Archivo no existe - usar stats iniciales
      logger.info('Starting fresh token stats', { month: this.currentMonth });
    }
  }

  /**
   * Reset de estadísticas (inicio de mes nuevo)
   */
  async resetMonthly() {
    const newMonth = new Date().toISOString().slice(0, 7);
    
    if (newMonth !== this.currentMonth) {
      // Guardar stats del mes anterior
      await this.saveStats();
      
      // Inicializar nuevo mes
      this.currentMonth = newMonth;
      this.stats = {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheWriteTokens: 0,
        totalCost: 0,
        operationBreakdown: {},
        dailyStats: {}
      };
      
      logger.info('Monthly stats reset', { month: this.currentMonth });
    }
  }
}

export default new TokenTracker();
```

---

## 5. Endpoints API (Express Routes)

### Archivo: `src/routes/api/claude.routes.js`

```javascript
import express from 'express';
import analyzer from '../../services/claude/analyzer.js';
import batchProcessor from '../../services/claude/batch-processor.js';
import tokenTracker from '../../services/monitoring/token-tracker.js';
import { validateEssayInput, validateBatchInput } from '../../utils/validators.js';

const router = express.Router();

/**
 * POST /api/claude/analyze-essay
 * Análisis de ensayo individual en tiempo real
 */
router.post('/analyze-essay', validateEssayInput, async (req, res) => {
  try {
    const { essayText, rubric, options } = req.body;

    const result = await analyzer.analyzeEssay(essayText, rubric, options);

    if (result.success) {
      res.json({
        success: true,
        feedback: result.feedback,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/compare-rubric
 * Comparación de trabajo con rúbrica de referencia
 */
router.post('/compare-rubric', async (req, res) => {
  try {
    const { studentWork, referenceRubric, criteria } = req.body;

    // Validaciones
    if (!studentWork || studentWork.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'El trabajo del estudiante debe tener al menos 50 caracteres'
      });
    }

    if (!referenceRubric) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una rúbrica de referencia'
      });
    }

    const result = await analyzer.compareWithRubric(
      studentWork, 
      referenceRubric, 
      criteria || []
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/analyze-text
 * Análisis de texto general
 */
router.post('/analyze-text', async (req, res) => {
  try {
    const { text, analysisType } = req.body;

    if (!text || text.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'El texto debe tener al menos 20 caracteres'
      });
    }

    const result = await analyzer.analyzeText(text, analysisType);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/stream-feedback
 * Streaming de retroalimentación para UI progresiva
 */
router.post('/stream-feedback', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { essayText, rubric } = req.body;

    for await (const chunk of analyzer.streamFeedback(essayText, rubric)) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/claude/batch/create
 * Crear batch de procesamiento (50% descuento)
 */
router.post('/batch/create', validateBatchInput, async (req, res) => {
  try {
    const { essays, rubric, options } = req.body;

    const result = await batchProcessor.processBatch(essays, rubric, options);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/batch/:batchId/status
 * Verificar estado de un batch
 */
router.get('/batch/:batchId/status', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await batchProcessor.checkBatchStatus(batchId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/batch/:batchId/results
 * Obtener resultados de un batch completado
 */
router.get('/batch/:batchId/results', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await batchProcessor.getBatchResults(batchId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/batches
 * Listar todos los batches activos
 */
router.get('/batches', (req, res) => {
  const batches = batchProcessor.getActiveBatches();
  res.json({ success: true, batches });
});

/**
 * DELETE /api/claude/batch/:batchId
 * Cancelar un batch en progreso
 */
router.delete('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const result = await batchProcessor.cancelBatch(batchId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/stats
 * Obtener estadísticas de uso de tokens
 */
router.get('/stats', (req, res) => {
  const { period = 'month' } = req.query;

  const stats = tokenTracker.getStats(period);

  res.json({
    success: true,
    period,
    stats
  });
});

export default router;
```

---

## 6. Configuración y Utilidades

### Archivo: `src/config/claude.config.js`

```javascript
export default {
  // Modelo y configuración base
  model: 'claude-haiku-4-5',
  
  // Configuración por tipo de tarea
  taskConfigs: {
    feedback: {
      temperature: 0.1,
      max_tokens: 1500,
      stopSequences: ['</feedback>', '\n\n---\n\n']
    },
    analysis: {
      temperature: 0.1,
      max_tokens: 1200,
      stopSequences: ['</analysis>']
    },
    comparison: {
      temperature: 0.05,  // Muy determinístico
      max_tokens: 2000,
      stopSequences: ['</comparison>']
    },
    creative: {
      temperature: 0.7,  // Más variabilidad
      max_tokens: 2000,
      stopSequences: []
    }
  },

  // Límites de seguridad
  limits: {
    minTextLength: 20,
    maxTextLength: 100000,  // ~75K palabras
    minEssayLength: 50,
    maxBatchSize: 100,
    requestTimeout: 60000  // 60 segundos
  },

  // Optimización de costos
  caching: {
    enabled: true,
    minContentLength: 1024,  // Cachear solo si >1024 tokens
    ttl: 300  // 5 minutos (mínimo de Anthropic)
  },

  // Monitoreo
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    costAlertThreshold: 10,  // Alerta en $10/mes
    tokenAlertThreshold: 2000000  // Alerta en 2M tokens
  },

  // Rate limiting
  rateLimits: {
    perUser: {
      requests: 50,
      windowMs: 3600000  // 50 requests por hora
    },
    perIP: {
      requests: 100,
      windowMs: 3600000  // 100 requests por hora
    }
  }
};
```

### Archivo: `src/utils/validators.js`

```javascript
import config from '../config/claude.config.js';

/**
 * Valida entrada para análisis de ensayo
 */
export function validateEssayInput(req, res, next) {
  const { essayText, rubric } = req.body;

  // Validar texto del ensayo
  if (!essayText) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere el texto del ensayo (campo: essayText)'
    });
  }

  if (typeof essayText !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'El texto del ensayo debe ser una cadena de texto'
    });
  }

  if (essayText.length < config.limits.minEssayLength) {
    return res.status(400).json({
      success: false,
      error: `El ensayo debe tener al menos ${config.limits.minEssayLength} caracteres`
    });
  }

  if (essayText.length > config.limits.maxTextLength) {
    return res.status(400).json({
      success: false,
      error: `El ensayo excede la longitud máxima de ${config.limits.maxTextLength} caracteres`
    });
  }

  // Validar rúbrica (opcional pero recomendada)
  if (rubric && typeof rubric !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'La rúbrica debe ser una cadena de texto'
    });
  }

  // Validar opciones (opcional)
  const { options } = req.body;
  if (options) {
    if (options.maxTokens && (options.maxTokens < 100 || options.maxTokens > 4000)) {
      return res.status(400).json({
        success: false,
        error: 'maxTokens debe estar entre 100 y 4000'
      });
    }

    if (options.temperature && (options.temperature < 0 || options.temperature > 1)) {
      return res.status(400).json({
        success: false,
        error: 'temperature debe estar entre 0 y 1'
      });
    }
  }

  next();
}

/**
 * Valida entrada para procesamiento por lotes
 */
export function validateBatchInput(req, res, next) {
  const { essays, rubric } = req.body;

  // Validar array de ensayos
  if (!essays || !Array.isArray(essays)) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere un array de ensayos (campo: essays)'
    });
  }

  if (essays.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'El array de ensayos no puede estar vacío'
    });
  }

  if (essays.length > config.limits.maxBatchSize) {
    return res.status(400).json({
      success: false,
      error: `El batch no puede contener más de ${config.limits.maxBatchSize} ensayos`
    });
  }

  // Validar cada ensayo
  for (let i = 0; i < essays.length; i++) {
    const essay = essays[i];

    if (!essay.text || typeof essay.text !== 'string') {
      return res.status(400).json({
        success: false,
        error: `Ensayo ${i}: se requiere campo 'text' como cadena de texto`
      });
    }

    if (essay.text.length < config.limits.minEssayLength) {
      return res.status(400).json({
        success: false,
        error: `Ensayo ${i}: debe tener al menos ${config.limits.minEssayLength} caracteres`
      });
    }

    // ID opcional pero recomendado
    if (essay.id && typeof essay.id !== 'string') {
      return res.status(400).json({
        success: false,
        error: `Ensayo ${i}: el campo 'id' debe ser una cadena de texto`
      });
    }
  }

  // Validar rúbrica
  if (!rubric || typeof rubric !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Se requiere una rúbrica como cadena de texto'
    });
  }

  next();
}

/**
 * Sanitiza texto de entrada
 */
export function sanitizeText(text) {
  // Eliminar caracteres de control excepto newlines y tabs
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Estima tokens aproximados (1 token ≈ 4 caracteres en español)
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
```

### Archivo: `src/utils/logger.js`

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claude-integration' },
  transports: [
    // Logs de error en archivo separado
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Todos los logs en archivo combinado
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// En desarrollo, también log a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

---

## 7. Variables de Entorno

### Archivo: `.env.example`

```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Security
API_SECRET_KEY=your_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
COST_ALERT_THRESHOLD=10
TOKEN_ALERT_THRESHOLD=2000000

# Optional: Webhook for alerts
ALERT_WEBHOOK_URL=

# Optional: Database connection (if applicable)
DATABASE_URL=
```

### Archivo: `.gitignore` (agregar)

```
# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Token statistics
data/stats/

# Node modules
node_modules/

# Build outputs
dist/
build/
```

---

## 8. Plan de Implementación por Fases

### Fase 1: Configuración Base (Día 1 - 2-3 horas)

**Objetivos:**
- Instalar dependencias
- Configurar variables de entorno
- Crear estructura de archivos
- Implementar cliente básico de Claude
- Hacer primera prueba exitosa

**Pasos específicos:**
1. Ejecutar `npm install @anthropic-ai/sdk dotenv express winston`
2. Crear archivo `.env` con `ANTHROPIC_API_KEY`
3. Crear estructura de carpetas según arquitectura
4. Implementar `src/services/claude/client.js`
5. Crear script de prueba simple:

```javascript
// test-connection.js
import claudeClient from './src/services/claude/client.js';

async function testConnection() {
  const response = await claudeClient.createMessage({
    messages: [{
      role: 'user',
      content: 'Responde con: OK'
    }],
    max_tokens: 10
  });

  console.log('✅ Conexión exitosa:', response);
}

testConnection();
```

6. Ejecutar `node test-connection.js`
7. Verificar respuesta y tokens usados

**Criterios de éxito:**
- ✅ Respuesta exitosa de la API
- ✅ Tokens reportados correctamente
- ✅ Sin errores de autenticación

---

### Fase 2: MVP Funcional (Días 2-3 - 6-8 horas)

**Objetivos:**
- Implementar servicio de análisis educativo
- Crear sistema de prompts
- Configurar endpoints básicos
- Agregar manejo de errores robusto

**Pasos específicos:**
1. Implementar `src/services/claude/analyzer.js` (método `analyzeEssay`)
2. Crear archivos de prompts en `src/services/claude/prompts/`
3. Implementar `src/routes/api/claude.routes.js` con endpoint `/analyze-essay`
4. Agregar validadores en `src/utils/validators.js`
5. Configurar middleware de error handling
6. Integrar routes en aplicación Express principal

**Ejemplo de integración en app principal:**

```javascript
// app.js o server.js
import express from 'express';
import dotenv from 'dotenv';
import claudeRoutes from './src/routes/api/claude.routes.js';
import errorHandler from './src/middleware/error-handler.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/claude', claudeRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Prueba de MVP:**

```bash
curl -X POST http://localhost:3000/api/claude/analyze-essay \
  -H "Content-Type: application/json" \
  -d '{
    "essayText": "La Revolución Francesa fue un período de cambio político y social en Francia que duró de 1789 a 1799. Transformó la estructura de poder en Francia, eliminando el antiguo régimen y estableciendo una república. Los ideales de libertad, igualdad y fraternidad resonaron en todo el mundo.",
    "rubric": "Evalúa: 1) Claridad del tema principal, 2) Uso de fechas y datos específicos, 3) Análisis de impacto histórico"
  }'
```

**Criterios de éxito:**
- ✅ Endpoint responde con retroalimentación coherente
- ✅ Manejo de errores funciona (probar con input inválido)
- ✅ Tokens se reportan en respuesta
- ✅ Costo estimado calculado correctamente

---

### Fase 3: Optimización de Costos (Semana 2 - 4-6 horas)

**Objetivos:**
- Implementar prompt caching
- Configurar Batch API
- Agregar sistema de monitoreo de tokens
- Optimizar prompts

**Pasos específicos:**
1. Implementar `src/services/monitoring/token-tracker.js`
2. Integrar tracking en analyzer.js (llamadas a `tokenTracker.track()`)
3. Implementar `src/services/claude/batch-processor.js`
4. Agregar endpoints de batch en routes
5. Crear rúbrica de prueba larga (>1024 tokens) para validar caching
6. Ejecutar 10-20 solicitudes con misma rúbrica
7. Verificar cache hit rate en logs

**Validación de caching:**

```javascript
// test-caching.js
import analyzer from './src/services/claude/analyzer.js';

const rubricaLarga = `[RÚBRICA DE 2000+ PALABRAS]`;
const ensayos = [/* 10 ensayos diferentes */];

async function testCaching() {
  console.log('Ejecutando 10 análisis con rúbrica cacheada...');
  
  for (let i = 0; i < ensayos.length; i++) {
    const result = await analyzer.analyzeEssay(ensayos[i], rubricaLarga);
    console.log(`Ensayo ${i+1}:`, {
      cacheRead: result.metadata.tokensUsed.cache_read_input_tokens || 0,
      cacheWrite: result.metadata.tokensUsed.cache_creation_input_tokens || 0,
      cost: result.metadata.estimatedCost.total
    });
  }
}

testCaching();
```

**Criterios de éxito:**
- ✅ Primera solicitud: cache_creation_input_tokens > 0
- ✅ Solicitudes 2-10: cache_read_input_tokens > 0
- ✅ Costo por solicitud reduce ~40% después de primera
- ✅ Endpoint `/api/claude/stats` retorna métricas correctas

---

### Fase 4: Producción (Semana 3-4 - 8-12 horas)

**Objetivos:**
- Rate limiting
- Logging comprehensivo
- Testing automatizado
- Documentación de API
- Alertas de costo

**Pasos específicos:**

1. **Rate Limiting:**

```javascript
// src/middleware/rate-limiter.js
import rateLimit from 'express-rate-limit';
import config from '../config/claude.config.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimits.perIP.windowMs,
  max: config.rateLimits.perIP.requests,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intente nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

2. **Testing:**

```javascript
// tests/integration/claude.test.js
import request from 'supertest';
import app from '../../app.js';

describe('Claude API Integration', () => {
  test('POST /api/claude/analyze-essay should return feedback', async () => {
    const response = await request(app)
      .post('/api/claude/analyze-essay')
      .send({
        essayText: 'Ensayo de prueba con al menos 50 caracteres para validación.',
        rubric: 'Evaluar claridad y estructura.'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.feedback).toBeDefined();
    expect(response.body.metadata.tokensUsed).toBeDefined();
  });

  test('POST /api/claude/analyze-essay should reject short text', async () => {
    const response = await request(app)
      .post('/api/claude/analyze-essay')
      .send({
        essayText: 'Muy corto',
        rubric: 'Test'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

3. **Alertas de costo:**

```javascript
// src/services/monitoring/cost-alerts.js
import tokenTracker from './token-tracker.js';
import logger from '../../utils/logger.js';

export async function checkCostThresholds() {
  const stats = tokenTracker.getStats('month');
  const threshold = 10; // $10

  if (stats.totalCost > threshold) {
    logger.warn('⚠️ COST ALERT', {
      currentCost: stats.totalCost.toFixed(2),
      threshold,
      requests: stats.totalRequests,
      avgCostPerRequest: stats.avgCostPerRequest
    });

    // Enviar webhook si está configurado
    if (process.env.ALERT_WEBHOOK_URL) {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: 'Cost threshold exceeded',
          cost: stats.totalCost,
          threshold
        })
      });
    }
  }
}

// Ejecutar cada hora
setInterval(checkCostThresholds, 3600000);
```

4. **Documentación de API:**

Crear `docs/API.md` con ejemplos de cada endpoint, códigos de error, y mejores prácticas.

**Criterios de éxito:**
- ✅ Rate limiting previene abuso
- ✅ Tests pasan exitosamente
- ✅ Logs capture todas las operaciones importantes
- ✅ Alertas funcionan cuando se excede umbral
- ✅ Documentación completa y clara

---

## 9. Métricas de Éxito y KPIs

### 9.1 Métricas Técnicas

**Rendimiento:**
- Latencia p95: <3 segundos para análisis estándar
- Tasa de error: <1% de solicitudes
- Uptime: >99.5%

**Costos:**
- Costo promedio por análisis: <$0.01
- Costo mensual total: <$5 USD (para 300 solicitudes/semana)
- Cache hit rate: >80% después de primeras 20 solicitudes

**Calidad:**
- Concordancia con evaluación humana: >85%
- Retroalimentación completa y útil: >90% (evaluación cualitativa)

### 9.2 Monitoreo Continuo

**Dashboard básico de métricas (implementar endpoint):**

```javascript
// En claude.routes.js
router.get('/dashboard', (req, res) => {
  const monthStats = tokenTracker.getStats('month');
  const weekStats = tokenTracker.getStats('week');
  const todayStats = tokenTracker.getStats('today');

  res.json({
    success: true,
    dashboard: {
      today: todayStats,
      week: weekStats,
      month: {
        ...monthStats,
        projectedMonthlyCost: (monthStats.totalCost / new Date().getDate()) * 30,
        efficiency: {
          avgTokensPerRequest: Math.round(
            (monthStats.totalInputTokens + monthStats.totalOutputTokens) / 
            monthStats.totalRequests
          ),
          avgCostPerRequest: monthStats.avgCostPerRequest,
          cacheEfficiency: `${monthStats.cacheHitRate}%`
        }
      }
    }
  });
});
```

---

## 10. Seguridad y Privacidad

### 10.1 Protección de Datos Educativos

**Compliance:**
- FERPA (Family Educational Rights and Privacy Act)
- GDPR (si aplicable)
- Políticas institucionales

**Implementación:**

```javascript
// src/middleware/data-protection.js
import crypto from 'crypto';

/**
 * Anonimiza datos antes de enviar a API
 */
export function anonymizeEssay(essayText, studentId) {
  // Reemplazar nombres propios con placeholders
  const anonymized = essayText
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NOMBRE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');

  // Hash del student ID para tracking sin PII
  const hashedId = crypto
    .createHash('sha256')
    .update(studentId + process.env.API_SECRET_KEY)
    .digest('hex')
    .slice(0, 16);

  return {
    anonymizedText: anonymized,
    trackingId: hashedId
  };
}

/**
 * Middleware para anonimización automática
 */
export function dataProtectionMiddleware(req, res, next) {
  if (req.body.essayText && req.body.studentId) {
    const { anonymizedText, trackingId } = anonymizeEssay(
      req.body.essayText,
      req.body.studentId
    );
    req.body.essayText = anonymizedText;
    req.body.trackingId = trackingId;
  }
  next();
}
```

### 10.2 No Logging de Contenido Sensible

```javascript
// src/utils/logger.js - configuración segura
logger.info('Essay analyzed', {
  requestId: response.requestId,
  tokensUsed: response.usage,
  // ❌ NO INCLUIR: essayText, feedback completo
  essayLength: essayText.length,
  trackingId: req.body.trackingId || 'anonymous'
});
```

### 10.3 Retención de Datos

```javascript
// src/services/monitoring/data-retention.js
import fs from 'fs/promises';
import path from 'path';

/**
 * Limpia logs y stats antiguos
 */
export async function cleanOldData() {
  const retentionDays = 90; // 3 meses
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const logsDir = path.join(process.cwd(), 'logs');
  const files = await fs.readdir(logsDir);

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const stats = await fs.stat(filePath);

    if (stats.mtime < cutoffDate) {
      await fs.unlink(filePath);
      console.log(`Deleted old log: ${file}`);
    }
  }
}

// Ejecutar diariamente
setInterval(cleanOldData, 86400000); // 24 horas
```

---

## 11. Troubleshooting y Debugging

### 11.1 Problemas Comunes

**Error: Invalid API Key**
```
Solución: Verificar ANTHROPIC_API_KEY en .env
- Asegurar que no tiene espacios antes/después
- Regenerar key en console.anthropic.com si es necesario
```

**Error: Rate Limit Exceeded**
```
Solución: Implementar retry con exponential backoff
- Ya implementado en claudeClient._handleError()
- Verificar tier actual en Console de Anthropic
```

**Caching no funciona**
```
Diagnóstico:
1. Verificar que cache_control está en system prompt
2. Contenido debe ser >1024 tokens para ser elegible
3. TTL mínimo es 5 minutos - esperar entre pruebas
4. Revisar logs: cache_read_input_tokens debería ser >0
```

**Costos más altos de lo esperado**
```
Diagnóstico:
1. Revisar /api/claude/stats
2. Verificar cache hit rate
3. Analizar operationBreakdown para identificar operaciones costosas
4. Revisar max_tokens - reducir si es posible
```

### 11.2 Debug Mode

```javascript
// Agregar a .env para debugging
DEBUG=true
LOG_LEVEL=debug

// En código, logs detallados:
if (process.env.DEBUG === 'true') {
  logger.debug('Full API request', {
    model: config.model,
    systemPromptLength: system[0].text.length,
    userPromptLength: messages[0].content.length,
    config
  });
}
```

---

## 12. Próximos Pasos y Mejoras Futuras

### 12.1 Fase 5: Características Avanzadas (Opcional)

**Sistema de templates de rúbricas:**
- Almacenar rúbricas comunes en base de datos
- Sistema de versionado de rúbricas
- Compartir rúbricas entre profesores

**Dashboard web de administración:**
- Visualización de estadísticas en tiempo real
- Gestión de batches desde UI
- Configuración de alertas

**Análisis comparativo:**
- Comparar rendimiento de estudiantes
- Identificar patrones en errores comunes
- Sugerencias de instrucción basadas en análisis agregado

**Fine-tuning específico (si disponible):**
- Entrenar modelo con ejemplos de retroalimentación de profesores
- Mejorar tono y estilo para contexto institucional específico

### 12.2 Integraciones

**LMS (Learning Management Systems):**
- Canvas API
- Moodle plugins
- Google Classroom

**Herramientas de escritura:**
- Integración con Google Docs
- Plugin de Word
- Editor web personalizado

---

## 13. Apéndice: Ejemplos de Uso Completos

### Ejemplo 1: Calificación de ensayo completo

```javascript
const essayExample = `
La Revolución Francesa, que abarcó desde 1789 hasta 1799, representa uno de los períodos más transformadores en la historia moderna. Este evento no solo cambió radicalmente la estructura política de Francia, sino que también inspiró movimientos revolucionarios en todo el mundo.

El Antiguo Régimen francés se caracterizaba por una sociedad profundamente estratificada. La nobleza y el clero gozaban de privilegios significativos, mientras que el Tercer Estado, que representaba a más del 95% de la población, soportaba la carga fiscal. Esta desigualdad económica, combinada con el descontento político y las ideas ilustradas, creó un caldo de cultivo para el cambio.

Los eventos de 1789 marcaron el comienzo de la revolución. La Toma de la Bastilla el 14 de julio simbolizó la resistencia popular contra la tiranía. La Declaración de los Derechos del Hombre y del Ciudadano proclamó principios de libertad e igualdad que resonarían a través de generaciones.

Sin embargo, la revolución también tuvo sus aspectos oscuros. El Reinado del Terror bajo Robespierre resultó en miles de ejecuciones. Esta fase demostró cómo los ideales revolucionarios podían corromperse en busca de pureza ideológica.

El legado de la Revolución Francesa es complejo pero innegable. Estableció precedentes para la democracia moderna, los derechos humanos, y el poder del pueblo para derrocar gobiernos opresivos.
`;

const rubricExample = `
RÚBRICA DE EVALUACIÓN - ENSAYO HISTÓRICO

1. TESIS Y ARGUMENTO PRINCIPAL (20 puntos)
   - Clara identificación del tema
   - Argumento coherente y bien definido
   - Posición del autor evidente

2. USO DE EVIDENCIA HISTÓRICA (25 puntos)
   - Fechas y datos específicos
   - Contexto histórico apropiado
   - Fuentes/referencias implícitas o explícitas

3. ANÁLISIS Y PROFUNDIDAD (25 puntos)
   - Va más allá de descripción superficial
   - Conecta causas y efectos
   - Considera múltiples perspectivas
   - Evalúa impacto y legado

4. ORGANIZACIÓN Y ESTRUCTURA (15 puntos)
   - Introducción clara
   - Párrafos bien estructurados
   - Transiciones lógicas
   - Conclusión efectiva

5. CALIDAD DE ESCRITURA (15 puntos)
   - Gramática y ortografía
   - Vocabulario apropiado
   - Claridad de expresión
   - Tono académico
`;

// Llamada al API
const result = await analyzer.analyzeEssay(essayExample, rubricExample, {
  format: 'structured',
  maxTokens: 1500,
  temperature: 0.1
});

console.log(result.feedback);
```

**Respuesta esperada:**
```
Puntaje: 82/100

Fortalezas:
- Estructura organizacional sólida con introducción clara, desarrollo temático coherente y conclusión que sintetiza el legado. Las transiciones entre párrafos son fluidas.
- Uso efectivo de evidencia específica incluyendo fechas clave (1789-1799, 14 de julio), eventos concretos (Toma de la Bastilla, Declaración de Derechos), y figuras históricas (Robespierre).
- Análisis balanceado que reconoce tanto logros (democracia, derechos humanos) como aspectos problemáticos (Reinado del Terror), demostrando pensamiento crítico.

Áreas de mejora:
- Profundizar en las causas económicas mencionadas: incluir datos específicos sobre impuestos o deuda nacional que ilustren la crisis financiera.
- Expandir el análisis del Tercer Estado: ¿quiénes componían este grupo? ¿Cómo se organizaron? Esto fortalecería el contexto social.
- La conclusión podría ser más específica sobre el "legado complejo": mencionar ejemplos concretos de revoluciones inspiradas o conceptos democráticos específicos heredados.

Próximos pasos:
- Investigar y agregar 2-3 ejemplos cuantitativos (estadísticas de impuestos, números de ejecutados en el Terror) para solidificar argumentos.
- Desarrollar un párrafo adicional sobre la perspectiva de diferentes grupos sociales durante la revolución para mostrar análisis multidimensional.
```

---

## 14. Contacto y Soporte

**Documentación Oficial de Anthropic:**
- API Docs: https://docs.anthropic.com
- SDK GitHub: https://github.com/anthropics/anthropic-sdk-typescript
- Console: https://console.anthropic.com
- Soporte: support@anthropic.com

**Recursos Adicionales:**
- Cookbook de ejemplos: https://github.com/anthropics/anthropic-cookbook
- Community Forum: https://community.anthropic.com
- Status Page: https://status.anthropic.com

---

## 15. Checklist de Implementación

**Pre-Implementación:**
- [ ] API key de Anthropic obtenida
- [ ] Proyecto Node.js configurado
- [ ] Variables de entorno seguras
- [ ] Estructura de archivos creada

**Fase 1 - Base:**
- [ ] Cliente Claude implementado
- [ ] Primera llamada exitosa
- [ ] Manejo de errores básico
- [ ] Logging configurado

**Fase 2 - MVP:**
- [ ] Servicio de análisis funcional
- [ ] Endpoints REST implementados
- [ ] Validación de entrada
- [ ] Pruebas manuales exitosas

**Fase 3 - Optimización:**
- [ ] Prompt caching activo y validado
- [ ] Batch API implementada
- [ ] Token tracker funcionando
- [ ] Cache hit rate >80%

**Fase 4 - Producción:**
- [ ] Rate limiting activo
- [ ] Tests automatizados pasando
- [ ] Alertas de costo configuradas
- [ ] Documentación completa
- [ ] Deployment exitoso

**Post-Implementación:**
- [ ] Monitoreo activo
- [ ] Revisión semanal de métricas
- [ ] Ajustes basados en uso real
- [ ] Feedback de usuarios incorporado

---

## 16. Estimación de Tiempo y Recursos

**Tiempo Total Estimado: 18-25 horas**

- Fase 1 (Base): 2-3 horas
- Fase 2 (MVP): 6-8 horas
- Fase 3 (Optimización): 4-6 horas
- Fase 4 (Producción): 6-8 horas

**Recursos Humanos:**
- 1 desarrollador backend con experiencia Node.js
- Conocimiento básico de APIs REST
- Opcional: 1 tester para QA

**Costos Estimados:**
- Desarrollo: Variable según recursos
- API de Anthropic: $3-5/mes (operacional)
- Infraestructura: Depende del hosting existente

---

**Fin del PRD**

Este documento debe ser tratado como una especificación viva que se actualiza conforme avanza la implementación. Todas las decisiones de diseño están justificadas con base en la investigación de documentación oficial de Anthropic y mejores prácticas de la industria.