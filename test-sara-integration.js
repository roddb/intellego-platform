#!/usr/bin/env node

// Script de prueba para verificar integración completa de Sara
// Simula la conversación real que el usuario reportó como problemática

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'
const TEST_USER_ID = 'demo-student-fixed'
const TEST_USER_NAME = 'Estudiante Demo'

async function testSaraIntegration() {
  console.log('🧪 INICIANDO PRUEBA DE INTEGRACIÓN COMPLETA DE SARA')
  console.log('=====================================================')
  
  // Generar sessionId único para esta prueba
  const sessionId = `test_session_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🎯 SessionId de prueba: ${sessionId}`)
  
  try {
    // PASO 1: Inicializar conversación
    console.log('\n📱 PASO 1: Inicializando conversación con Sara...')
    const initResponse = await fetch(`${BASE_URL}/api/ai-chat/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        sessionId: sessionId,
        mode: 'chatting'
      })
    })
    
    if (initResponse.ok) {
      const initData = await initResponse.json()
      console.log('✅ Inicialización exitosa')
      console.log(`📝 Mensaje de bienvenida: ${initData.welcomeMessage?.substring(0, 100)}...`)
    } else {
      throw new Error(`Error en inicialización: ${initResponse.status}`)
    }
    
    // PASO 2: Primer mensaje - Solicitar evento de calendario
    console.log('\n💬 PASO 2: Enviando solicitud de calendario...')
    console.log('📤 Usuario: "Agrega un examen de química para el lunes próximo a las 10 AM en aula 201"')
    
    const message1Response = await fetch(`${BASE_URL}/api/ai-chat/enhanced-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Agrega un examen de química para el lunes próximo a las 10 AM en aula 201",
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        sessionId: sessionId,
        currentMode: 'chatting',
        conversationHistory: []
      })
    })
    
    if (message1Response.ok) {
      const message1Data = await message1Response.json()
      console.log('✅ Respuesta 1 recibida')
      console.log(`📝 Sara respondió: ${message1Data.response}`)
      console.log(`🎯 Intent detectado: ${message1Data.detectedIntent}`)
      console.log(`⭐ Prioridad: ${message1Data.priority}`)
      
      // Verificar si se ejecutó la tarea de calendario
      const taskExecuted = message1Data.personalizations?.includes('calendar_task_executed')
      console.log(`📅 Tarea de calendario ejecutada: ${taskExecuted ? '✅ SÍ' : '❌ NO'}`)
      
    } else {
      throw new Error(`Error en mensaje 1: ${message1Response.status}`)
    }
    
    // PASO 3: Segundo mensaje - Verificar contexto
    console.log('\n💬 PASO 3: Enviando segundo mensaje para verificar contexto...')
    console.log('📤 Usuario: "¿A qué hora es el examen?"')
    
    const message2Response = await fetch(`${BASE_URL}/api/ai-chat/enhanced-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿A qué hora es el examen?",
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        sessionId: sessionId,
        currentMode: 'chatting',
        conversationHistory: [
          { role: 'user', content: 'Agrega un examen de química para el lunes próximo a las 10 AM en aula 201' },
          { role: 'assistant', content: 'He agregado el examen de química a tu calendario.' }
        ]
      })
    })
    
    if (message2Response.ok) {
      const message2Data = await message2Response.json()
      console.log('✅ Respuesta 2 recibida')
      console.log(`📝 Sara respondió: ${message2Data.response}`)
      
      // Verificar si mantiene contexto
      const hasContext = message2Data.response.toLowerCase().includes('10') && 
                        (message2Data.response.toLowerCase().includes('química') || 
                         message2Data.response.toLowerCase().includes('examen'))
      console.log(`🧠 Contexto mantenido: ${hasContext ? '✅ SÍ' : '❌ NO'}`)
      
    } else {
      throw new Error(`Error en mensaje 2: ${message2Response.status}`)
    }
    
    // PASO 4: Tercer mensaje - Verificar continuidad
    console.log('\n💬 PASO 4: Enviando tercer mensaje para verificar continuidad completa...')
    console.log('📤 Usuario: "¿Qué más tengo programado esa semana?"')
    
    const message3Response = await fetch(`${BASE_URL}/api/ai-chat/enhanced-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿Qué más tengo programado esa semana?",
        userId: TEST_USER_ID,
        userName: TEST_USER_NAME,
        sessionId: sessionId,
        currentMode: 'chatting',
        conversationHistory: [
          { role: 'user', content: 'Agrega un examen de química para el lunes próximo a las 10 AM en aula 201' },
          { role: 'assistant', content: 'He agregado el examen de química a tu calendario.' },
          { role: 'user', content: '¿A qué hora es el examen?' },
          { role: 'assistant', content: 'El examen de química es a las 10 AM.' }
        ]
      })
    })
    
    if (message3Response.ok) {
      const message3Data = await message3Response.json()
      console.log('✅ Respuesta 3 recibida')
      console.log(`📝 Sara respondió: ${message3Data.response}`)
      
      // Verificar si sigue recordando la conversación
      const continuityScore = message3Data.continuityScore || 0
      console.log(`🔄 Puntuación de continuidad: ${continuityScore}`)
      
      const maintainsContinuity = !message3Data.response.toLowerCase().includes('encantada de conocerte') &&
                                 !message3Data.response.toLowerCase().includes('primera vez')
      console.log(`🔗 Mantiene continuidad: ${maintainsContinuity ? '✅ SÍ' : '❌ NO'}`)
      
    } else {
      throw new Error(`Error en mensaje 3: ${message3Response.status}`)
    }
    
    // RESULTADO FINAL
    console.log('\n🎯 RESULTADO FINAL DE LA PRUEBA')
    console.log('================================')
    console.log(`✅ Todas las respuestas fueron exitosas`)
    console.log(`🎯 SessionId utilizado: ${sessionId}`)
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error.message)
    process.exit(1)
  }
}

// Ejecutar prueba
testSaraIntegration()
  .then(() => {
    console.log('\n🏁 PRUEBA COMPLETADA')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 PRUEBA FALLÓ:', error)
    process.exit(1)
  })