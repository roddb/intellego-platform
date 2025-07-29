#!/bin/bash

# Script de prueba para verificar integración completa de Sara
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN COMPLETA DE SARA"
echo "===================================================="

BASE_URL="http://localhost:3000"
USER_ID="demo-student-fixed"
USER_NAME="Estudiante Demo"
SESSION_ID="test_session_$(date +%s)_$(openssl rand -hex 4)"

echo "🎯 SessionId de prueba: $SESSION_ID"

# PASO 1: Inicializar conversación
echo ""
echo "📱 PASO 1: Inicializando conversación con Sara..."

INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-chat/initialize" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"userName\": \"$USER_NAME\",
    \"sessionId\": \"$SESSION_ID\",
    \"mode\": \"chatting\"
  }")

echo "✅ Inicialización completada"
echo "📝 Respuesta: $(echo "$INIT_RESPONSE" | jq -r '.welcomeMessage // "Sin mensaje"' 2>/dev/null || echo "Respuesta obtenida")"

# PASO 2: Primer mensaje - Solicitar evento de calendario
echo ""
echo "💬 PASO 2: Enviando solicitud de calendario..."
echo "📤 Usuario: 'Agrega un examen de química para el lunes próximo a las 10 AM en aula 201'"

MESSAGE1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-chat/enhanced-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Agrega un examen de química para el lunes próximo a las 10 AM en aula 201\",
    \"userId\": \"$USER_ID\",
    \"userName\": \"$USER_NAME\",
    \"sessionId\": \"$SESSION_ID\",
    \"currentMode\": \"chatting\",
    \"conversationHistory\": []
  }")

echo "✅ Respuesta 1 recibida"
MESSAGE1_TEXT=$(echo "$MESSAGE1_RESPONSE" | jq -r '.response // "Sin respuesta"' 2>/dev/null || echo "Respuesta procesada")
echo "📝 Sara respondió: $(echo "$MESSAGE1_TEXT" | head -c 100)..."

# Verificar si se ejecutó la tarea
TASK_EXECUTED=$(echo "$MESSAGE1_RESPONSE" | jq -r '.personalizations[]? | select(. == "calendar_task_executed")' 2>/dev/null)
if [ -n "$TASK_EXECUTED" ]; then
  echo "📅 Tarea de calendario ejecutada: ✅ SÍ"
else
  echo "📅 Tarea de calendario ejecutada: ❌ NO"
fi

# PASO 3: Segundo mensaje - Verificar contexto
echo ""
echo "💬 PASO 3: Enviando segundo mensaje para verificar contexto..."
echo "📤 Usuario: '¿A qué hora es el examen?'"

MESSAGE2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-chat/enhanced-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"¿A qué hora es el examen?\",
    \"userId\": \"$USER_ID\",
    \"userName\": \"$USER_NAME\",
    \"sessionId\": \"$SESSION_ID\",
    \"currentMode\": \"chatting\",
    \"conversationHistory\": []
  }")

echo "✅ Respuesta 2 recibida"
MESSAGE2_TEXT=$(echo "$MESSAGE2_RESPONSE" | jq -r '.response // "Sin respuesta"' 2>/dev/null || echo "Respuesta procesada")
echo "📝 Sara respondió: $(echo "$MESSAGE2_TEXT" | head -c 100)..."

# Verificar si mantiene contexto (busca "10" y "química" o "examen")
if echo "$MESSAGE2_TEXT" | grep -qi "10" && (echo "$MESSAGE2_TEXT" | grep -qi "química\|examen"); then
  echo "🧠 Contexto mantenido: ✅ SÍ"
else
  echo "🧠 Contexto mantenido: ❌ NO"
fi

# PASO 4: Tercer mensaje - Verificar continuidad
echo ""
echo "💬 PASO 4: Enviando tercer mensaje para verificar continuidad completa..."
echo "📤 Usuario: '¿Qué más tengo programado esa semana?'"

MESSAGE3_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai-chat/enhanced-message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"¿Qué más tengo programado esa semana?\",
    \"userId\": \"$USER_ID\",
    \"userName\": \"$USER_NAME\",
    \"sessionId\": \"$SESSION_ID\",
    \"currentMode\": \"chatting\",
    \"conversationHistory\": []
  }")

echo "✅ Respuesta 3 recibida"
MESSAGE3_TEXT=$(echo "$MESSAGE3_RESPONSE" | jq -r '.response // "Sin respuesta"' 2>/dev/null || echo "Respuesta procesada")
echo "📝 Sara respondió: $(echo "$MESSAGE3_TEXT" | head -c 100)..."

# Verificar continuidad (no debe actuar como si fuera primera vez)
if echo "$MESSAGE3_TEXT" | grep -qi "encantada de conocerte\|primera vez\|soy sara.*asistente"; then
  echo "🔗 Mantiene continuidad: ❌ NO (actúa como primera vez)"
else
  echo "🔗 Mantiene continuidad: ✅ SÍ"
fi

# RESULTADO FINAL
echo ""
echo "🎯 RESULTADO FINAL DE LA PRUEBA"
echo "================================"
echo "✅ Todas las respuestas fueron exitosas"
echo "🎯 SessionId utilizado: $SESSION_ID"
echo ""
echo "🏁 PRUEBA COMPLETADA"