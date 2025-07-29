# 🤖 Configuración de IA Tutora - Intellego Platform

## 📋 **Resumen**

La IA Tutora de Intellego Platform soporta múltiples proveedores de IA para generar ejercicios personalizados. El sistema incluye un sistema de fallback automático para máxima confiabilidad.

## 🎯 **Opciones Disponibles**

### **1. Google Gemini (RECOMENDADO) 🌟**
- **Ventajas**: Calidad excelente, rápido, fácil de configurar
- **Límites**: 15 requests/minuto gratis
- **Configuración**: Solo requiere API key
- **Costo**: 100% gratis para uso normal

### **2. Hugging Face (ALTERNATIVA)**
- **Ventajas**: Buena calidad, comunidad grande
- **Límites**: 30,000 caracteres/mes gratis
- **Configuración**: Solo requiere token de acceso
- **Costo**: 100% gratis para uso básico

### **3. Ollama Local (USUARIOS AVANZADOS)**
- **Ventajas**: Sin límites, 100% privado, offline
- **Límites**: Ninguno
- **Configuración**: Requiere instalación local
- **Costo**: Gratis pero usa recursos de tu computadora

### **4. Plantillas (FALLBACK)**
- **Ventajas**: Siempre disponible, rápido
- **Límites**: Contenido limitado
- **Configuración**: No requiere configuración
- **Costo**: Gratis

## 🚀 **Configuración Rápida (Recomendada)**

### **Opción 1: Google Gemini (5 minutos)**

1. **Obtener API Key**:
   - Ve a [Google AI Studio](https://ai.google.dev/)
   - Haz clic en "Get API Key"
   - Selecciona "Create API key in new project" o usa un proyecto existente
   - Copia tu API key

2. **Configurar en la aplicación**:
   ```bash
   # En tu archivo .env
   GOOGLE_AI_API_KEY="tu_api_key_aqui"
   ```

3. **Reiniciar aplicación**:
   ```bash
   npm run dev
   ```

4. **Verificar funcionamiento**:
   - Ve a Dashboard → IA Tutora
   - Verifica que aparezca "Funcionando con Google Gemini"

### **Opción 2: Hugging Face**

1. **Crear cuenta y token**:
   - Ve a [Hugging Face](https://huggingface.co/settings/tokens)
   - Crea una cuenta gratuita
   - Crea un nuevo token con permisos "Read"
   - Copia tu token

2. **Configurar**:
   ```bash
   # En tu archivo .env
   HUGGING_FACE_API_KEY="tu_token_aqui"
   ```

3. **Reiniciar y verificar**.

## 🔧 **Configuración Avanzada (Ollama Local)**

### **Requisitos**
- 8GB RAM mínimo (16GB recomendado)
- 5GB espacio en disco
- macOS, Windows o Linux

### **Instalación**

1. **Descargar Ollama**:
   - Ve a [ollama.ai](https://ollama.ai/)
   - Descarga e instala para tu sistema operativo

2. **Instalar modelo**:
   ```bash
   # En terminal/comando
   ollama pull llama3.1:8b
   ```

3. **Configurar aplicación**:
   ```bash
   # En tu archivo .env
   OLLAMA_ENABLED="true"
   OLLAMA_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3.1:8b"
   ```

4. **Verificar funcionamiento**:
   ```bash
   # Verificar que Ollama esté corriendo
   ollama list
   ```

## 🔍 **Verificación del Estado**

### **En la aplicación**:
1. Ve a **Dashboard → IA Tutora**
2. Revisa la sección "Estado de IA Tutora"
3. Verifica qué proveedores están disponibles

### **Solución de problemas**:

#### **"No hay proveedores de IA configurados"**
- Configura al menos una API key (Google Gemini recomendado)
- Verifica que las variables de entorno estén correctas
- Reinicia la aplicación

#### **"Configurado pero no disponible"**
- Verifica que la API key sea válida
- Revisa los límites de uso de tu proveedor
- Verifica tu conexión a internet

#### **Ollama no responde**
- Verifica que Ollama esté corriendo: `ollama list`
- Verifica la URL: `http://localhost:11434`
- Reinstala el modelo: `ollama pull llama3.1:8b`

## 📊 **Comparación de Proveedores**

| Proveedor | Calidad | Velocidad | Límites | Dificultad | Privacidad |
|-----------|---------|-----------|---------|------------|------------|
| Google Gemini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 15/min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Hugging Face | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 30k chars/mes | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Ollama Local | ⭐⭐⭐⭐ | ⭐⭐⭐ | Sin límites | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Plantillas | ⭐⭐ | ⭐⭐⭐⭐⭐ | Sin límites | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🛡️ **Seguridad**

### **API Keys**:
- Nunca commitees las API keys al repositorio
- Usa variables de entorno
- Rota las keys regularmente

### **Datos del usuario**:
- Solo se envía contexto mínimo necesario
- No se almacenan respuestas de IA permanentemente
- Los datos no salen de tu aplicación (excepto para APIs)

## 🎯 **Recomendaciones por Uso**

### **Desarrollo y Testing**:
- Usa **Google Gemini** para desarrollo rápido
- Configura **Plantillas** como fallback

### **Producción Pequeña** (<100 estudiantes):
- **Google Gemini** + **Hugging Face** como backup
- Monitorea los límites de uso

### **Producción Grande** (>100 estudiantes):
- **Ollama Local** en servidor dedicado
- **Google Gemini** como backup para picos de uso

### **Uso Offline/Privado**:
- **Ollama Local** únicamente
- No depende de servicios externos

## 📞 **Soporte**

Si tienes problemas:

1. **Verifica el estado** en Dashboard → IA Tutora
2. **Revisa la consola** del navegador para errores
3. **Verifica las variables de entorno**
4. **Reinicia la aplicación** después de cambios

La aplicación **siempre funcionará** aunque no tengas IA configurada, usando el sistema de plantillas como fallback.

---

💡 **Tip**: Empieza con Google Gemini para una configuración rápida y considera Ollama para uso intensivo o privacidad total.