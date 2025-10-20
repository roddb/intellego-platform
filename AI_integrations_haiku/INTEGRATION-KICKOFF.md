# INTEGRATION KICKOFF: Claude Haiku 4.5
## Punto de Partida - Primeros Pasos

**Fecha**: Octubre 20, 2025
**Estado**: Ready to Start
**Siguiente Paso**: Fase 1 - Configuración Base

---

## 🎯 Objetivo Inmediato

Establecer conexión con Claude Haiku 4.5 API y realizar primera llamada exitosa en **2-3 horas**.

---

## ✅ Pre-Requisitos Verificados

Antes de comenzar, confirma que tienes:

- [ ] Cuenta en Anthropic (console.anthropic.com)
- [ ] API Key generada y guardada de forma segura
- [ ] Node.js 20 LTS o superior (`node --version`)
- [ ] Ambiente local funcional (`npm run dev`)
- [ ] Git funcionando correctamente
- [ ] Acceso a Turso MCP configurado

---

## 🚀 FASE 1: Primeros 3 Pasos (Siguiente 30 minutos)

### Paso 1: Configurar API Key

**Obtener API Key:**
1. Ir a https://console.anthropic.com
2. Sign in / Create account
3. Settings → API Keys → Create Key
4. Copiar y guardar en gestor de contraseñas

**Agregar a proyecto:**
```bash
# Abrir archivo .env en raíz del proyecto
nano .env

# Agregar al final:
ANTHROPIC_API_KEY=sk-ant-api03-[TU-KEY-AQUI]

# Guardar (Ctrl+O, Enter, Ctrl+X)
```

**Verificar que NO se commitee:**
```bash
# Verificar que .env está en .gitignore
cat .gitignore | grep .env

# Debería mostrar:
# .env
# .env.local
# .env.production
```

✅ **Checkpoint 1**: API Key configurada y asegurada

---

### Paso 2: Instalar Dependencias

```bash
# En raíz del proyecto
npm install @anthropic-ai/sdk winston

# Verificar instalación
npm list @anthropic-ai/sdk

# Debería mostrar:
# @anthropic-ai/sdk@0.27.0 (o superior)
```

✅ **Checkpoint 2**: SDK instalado correctamente

---

### Paso 3: Crear Estructura de Archivos

```bash
# Crear directorios
mkdir -p src/services/ai/claude/prompts
mkdir -p src/services/ai/monitoring

# Verificar estructura
tree src/services/ai/

# Debería mostrar:
# src/services/ai/
# ├── claude/
# │   └── prompts/
# └── monitoring/
```

✅ **Checkpoint 3**: Estructura creada

---

## 🔧 FASE 1: Siguiente Paso - Cliente Base (60-90 minutos)

### Paso 4: Implementar Cliente Claude

**Crear archivo: `src/services/ai/claude/client.ts`**

Este será tu primer archivo TypeScript de la integración. Aquí está el código base:

```typescript
import Anthropic from '@anthropic-ai/sdk';

class ClaudeClient {
  private client: Anthropic;
  private defaultConfig: {
    model: string;
    temperature: number;
    max_tokens: number;
  };

  constructor() {
    // Inicializar cliente con API key desde env
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 60000,  // 60 segundos
      maxRetries: 3
    });

    // Configuración por defecto optimizada para educación
    this.defaultConfig = {
      model: 'claude-haiku-4-5',  // ← Identificador CORRECTO
      temperature: 0.1,            // Determinístico
      max_tokens: 1500
    };
  }

  /**
   * Crear mensaje con manejo robusto de errores
   */
  async createMessage(config: {
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }) {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        ...this.defaultConfig,
        ...config
      });

      const latency = Date.now() - startTime;

      console.log('✅ Claude API call successful', {
        model: this.defaultConfig.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latency: `${latency}ms`
      });

      return {
        success: true,
        content: response.content[0].text,
        usage: response.usage,
        requestId: response.id,
        latency
      };

    } catch (error: any) {
      console.error('❌ Claude API error:', {
        message: error.message,
        status: error.status,
        type: error.type
      });

      return {
        success: false,
        error: {
          message: error.message,
          status: error.status,
          type: error.type
        }
      };
    }
  }
}

// Exportar instancia singleton
export default new ClaudeClient();
```

**Guardar el archivo**

✅ **Checkpoint 4**: Cliente Claude implementado

---

### Paso 5: Script de Validación

**Crear archivo: `test-claude-connection.ts` (raíz del proyecto)**

```typescript
import dotenv from 'dotenv';
import claudeClient from './src/services/ai/claude/client';

dotenv.config();

async function testConnection() {
  console.log('\n🔍 Testing Claude API connection...\n');

  // Test simple
  const response = await claudeClient.createMessage({
    messages: [{
      role: 'user',
      content: 'Responde con exactamente: "Conexión exitosa"'
    }],
    max_tokens: 50
  });

  if (response.success) {
    console.log('✅ SUCCESS!');
    console.log('📝 Response:', response.content);
    console.log('📊 Tokens:', response.usage);
    console.log('⏱️  Latency:', response.latency, 'ms');
    console.log('\n✅ Claude Haiku 4.5 is ready to use!\n');
  } else {
    console.error('❌ FAILED!');
    console.error('Error:', response.error);
    console.log('\n❌ Fix the error above before continuing.\n');
  }
}

testConnection().catch(console.error);
```

**Ejecutar:**
```bash
npx tsx test-claude-connection.ts
```

**Resultado esperado:**
```
🔍 Testing Claude API connection...

✅ SUCCESS!
📝 Response: Conexión exitosa
📊 Tokens: { input_tokens: 15, output_tokens: 8 }
⏱️  Latency: 1234 ms

✅ Claude Haiku 4.5 is ready to use!
```

✅ **Checkpoint 5**: Primera llamada exitosa

---

## 🎉 FASE 1 COMPLETADA - ¿Qué sigue?

Si llegaste hasta aquí con éxito, has completado la Fase 1. Ahora tienes:

- ✅ API Key configurada
- ✅ SDK instalado
- ✅ Cliente funcional
- ✅ Primera llamada exitosa
- ✅ Verificación de tokens y latencia

### Próximos pasos (Fase 2):

**Opción A: Continuar inmediatamente** (si tienes 6-8 horas disponibles)
```bash
# Seguir con Fase 2 del ROADMAP.md
# Implementar analyzer.ts y primer endpoint
```

**Opción B: Pausar y revisar** (recomendado)
```bash
# Commit lo que hiciste
git add .
git commit -m "FEAT: Claude Haiku 4.5 client - Phase 1 complete"

# Revisar ROADMAP.md sección Fase 2
cat AI_integrations_haiku/ROADMAP.md
```

---

## 📋 Decisión de Caso de Uso

Antes de continuar a Fase 2, decide cuál caso de uso implementar primero:

### Opción 1: Análisis Automático de Reportes (RECOMENDADO)
**Tiempo**: 6-8 horas
**Complejidad**: Media
**Valor inmediato**: Alto
**Descripción**: Analizar reportes semanales y generar feedback automático

**Pros:**
- Valor inmediato para instructores
- Más fácil de implementar
- Testing sencillo con reportes existentes

**Siguiente archivo**: `src/services/ai/claude/analyzer.ts`

---

### Opción 2: Sistema de Rúbricas Completo
**Tiempo**: 8-12 horas
**Complejidad**: Alta
**Valor inmediato**: Medio (más estratégico)
**Descripción**: Implementar sistema completo de rúbricas por materia

**Pros:**
- Alineado con roadmap de AI Assessment
- Base sólida para features futuras
- Escalable a múltiples materias

**Siguiente archivo**: Schema de tabla `Rubric` + `analyzer.ts`

---

### Opción 3: Evaluación de Habilidades Académicas
**Tiempo**: 4-6 horas
**Complejidad**: Media-Baja
**Valor inmediato**: Medio
**Descripción**: Calcular métricas de las 5 habilidades académicas

**Pros:**
- Usa infraestructura existente (skillsMetrics)
- Datos estructurados fáciles de visualizar
- Complementa Progress Rings existentes

**Siguiente archivo**: `src/services/ai/claude/skills-evaluator.ts`

---

## 🤔 ¿Cuál elijo?

**Si quieres ver resultados rápido y útiles**: → **Opción 1**
**Si quieres construir la base para el futuro**: → **Opción 2**
**Si quieres mejorar la visualización actual**: → **Opción 3**

---

## 📞 Comandos Útiles para Debugging

### Ver logs en tiempo real (si usas Vercel)
```bash
# Después de deployment
vercel logs --follow
```

### Probar diferentes configuraciones
```typescript
// En test-claude-connection.ts, modifica:

// Test con temperature diferente
max_tokens: 100,
temperature: 0.5

// Test con prompt complejo
content: 'Analiza este ensayo: [ensayo de prueba aquí]'
```

### Verificar uso de tokens
```bash
# Consultar en Anthropic Console
# https://console.anthropic.com → Usage
```

---

## ⚠️ Troubleshooting Rápido

### Error: "API key not found"
```bash
# Verificar que .env existe y tiene la key
cat .env | grep ANTHROPIC

# Si no aparece, agregar:
echo "ANTHROPIC_API_KEY=tu-key-aqui" >> .env
```

### Error: "Module not found @anthropic-ai/sdk"
```bash
# Reinstalar dependencia
rm -rf node_modules
npm install
```

### Error: "Invalid model ID"
```bash
# Verificar que usas 'claude-haiku-4-5' (NO 'claude-haiku-4-5-20250929')
# Editar client.ts línea model:
model: 'claude-haiku-4-5'
```

---

## 📚 Recursos Adicionales

**Documentación del proyecto:**
- ROADMAP completo: `AI_integrations_haiku/ROADMAP.md`
- PRD técnico: `AI_integrations_haiku/prd-claude-haiku-integration.md`
- Guía de integración: `AI_integrations_haiku/haiku-integration-guide.md`

**Documentación oficial:**
- Claude API Docs: https://docs.anthropic.com
- SDK TypeScript: https://github.com/anthropics/anthropic-sdk-typescript
- Pricing: https://anthropic.com/pricing
- Console: https://console.anthropic.com

**Workflow de desarrollo:**
- CLAUDE.md: Guía de workflow del proyecto
- CLAUDE-WORKFLOW.md: Procedimientos detallados
- PROJECT-HISTORY.md: Contexto histórico

---

## ✅ Checklist Final de Fase 1

Antes de continuar, verifica:

- [ ] ✅ Respuesta exitosa de Claude API
- [ ] ✅ Tokens reportados correctamente
- [ ] ✅ Sin errores de autenticación
- [ ] ✅ Latencia razonable (<3 segundos)
- [ ] ✅ Código commiteado a git
- [ ] ✅ Decisión tomada sobre caso de uso

---

## 🚀 Listo para Fase 2

Una vez que todos los checks estén completos, estás listo para continuar.

**Comando para continuar:**
```bash
# Leer sección de Fase 2 del ROADMAP
cat AI_integrations_haiku/ROADMAP.md | grep -A 100 "FASE 2"

# O abrir en editor
code AI_integrations_haiku/ROADMAP.md
```

**Siguiente archivo a crear:**
- `src/services/ai/claude/analyzer.ts` (si elegiste Opción 1)
- `src/lib/db-operations.ts` (agregar funciones de AI)
- `src/app/api/ai/analyze-report/route.ts` (nuevo endpoint)

---

**¡Éxito en la integración!** 🎉

Si tienes dudas, revisa:
1. ROADMAP.md (paso a paso detallado)
2. PRD (especificaciones técnicas completas)
3. Guía de integración (mejores prácticas de Anthropic)

---

**Última actualización**: Octubre 20, 2025
**Estado**: Ready to Start
**Tiempo estimado Fase 1**: 2-3 horas
**Siguiente milestone**: MVP funcional (Fase 2)
