# Guía de Pruebas Manuales para Sara - Sistema Contextual Integrado

## 🎯 Objetivo
Verificar que Sara mantiene el contexto de conversación y ejecuta tareas reales (especialmente calendario) en la interfaz real.

## ✅ Estado del Sistema
- **Sistema Contextual**: ✅ Completamente integrado
- **Persistencia de Sesiones**: ✅ Implementada con temp-storage
- **Ejecución de Tareas de Calendario**: ✅ Integrada con AICalendarIntegration
- **Logs de Debugging**: ✅ Habilitados en todos los componentes

## 🧪 Protocolo de Prueba

### Preparación
1. **Servidor en funcionamiento**: `npm run dev` debe estar ejecutándose
2. **Monitoreo activo**: Ejecutar `./monitor-sara.sh` en una terminal separada
3. **Credenciales**: `estudiante@demo.com` / `Estudiante123!!!`

### Prueba 1: Contexto y Memoria de Conversación
**Escenario**: Verificar que Sara recuerda la conversación entre múltiples mensajes

1. **Login**: Acceder a http://localhost:3000 con credenciales demo
2. **Navegar**: Ir a IA Tutor en el sidebar
3. **Mensaje 1**: "Hola, soy María, tengo 20 años y estudio ingeniería"
   - ✅ **Esperar**: Sara debe responder reconociendo la información personal
4. **Mensaje 2**: "¿Cómo te llamas?"
   - ✅ **Esperar**: Sara debe responder "Soy Sara" SIN preguntar quién soy yo
5. **Mensaje 3**: "¿Qué edad tengo?"
   - ✅ **Esperar**: Sara debe recordar "20 años" de la conversación anterior

**🔍 Logs esperados**:
```
🎯 [CONTEXTUAL-DEBUG] Procesando mensaje contextual
🔄 [CONTEXTUAL-DEBUG] Usando sesión existente
```

### Prueba 2: Ejecución Real de Tareas de Calendario
**Escenario**: Verificar que Sara realmente crea eventos, no solo habla sobre ellos

1. **Mensaje 1**: "Agrega un examen de química para el lunes próximo a las 10 AM en aula 201"
   - ✅ **Esperar**: Mensaje de confirmación con detalles específicos del evento
   - ✅ **Verificar**: Navegar a "Organizador Inteligente" y confirmar que el evento aparece
2. **Mensaje 2**: "¿A qué hora es el examen?"
   - ✅ **Esperar**: Sara debe responder "10 AM" recordando el evento creado
3. **Mensaje 3**: "¿Dónde es el examen?"
   - ✅ **Esperar**: Sara debe responder "aula 201" manteniendo el contexto

**🔍 Logs esperados**:
```
🔍 [CALENDAR-DEBUG] Checking for calendar tasks
📅 [CALENDAR-DEBUG] Calendar processing result: needsEventCreation: true
🎯 [CALENDAR-DEBUG] Calendar task detected and executed!
✅ [CALENDAR-DEBUG] Event created
```

### Prueba 3: Continuidad de Conversación Completa
**Escenario**: Verificar que Sara no "olvida" la conversación y actúa como si fuera la primera vez

1. **Mensaje 1**: "Necesito ayuda con mi horario de matemáticas"
2. **Mensaje 2**: "¿Qué recomiendas?"
3. **Mensaje 3**: "¿De qué estábamos hablando?"
   - ❌ **NO debe**: Decir "Encantada de conocerte" o actuar como primera conversación
   - ✅ **SÍ debe**: Referirse al horario de matemáticas mencionado anteriormente

**🔍 Logs esperados**:
```
📊 Session has X previous turns
Continuity score: > 0.7
```

## 🚨 Problemas Conocidos Resueltos

### ❌ Problema Original (Reportado por Usuario)
- Sara no ejecutaba tareas reales
- Sara perdía contexto después de 3 mensajes
- Sara actuaba como si fuera la primera vez en cada conversación

### ✅ Solución Implementada
- **Sistema Contextual**: Reemplaza el sistema de memoria volátil
- **Persistencia**: Almacenamiento persistent en temp-storage.ts
- **Ejecución Real**: Integración directa con AICalendarIntegration
- **SessionId Estable**: Generación consistente en frontend

## 📊 Interpretación de Logs

### Logs Correctos (Sistema Funcionando)
```bash
🎯 [CONTEXTUAL-DEBUG] Procesando mensaje contextual
🔄 [CONTEXTUAL-DEBUG] Usando sesión existente: turnsCount: 3
📅 [CALENDAR-DEBUG] Calendar task detected and executed!
✅ [ENHANCED-ENDPOINT] calendarTaskExecuted: true
```

### Logs de Problema (Si algo falla)
```bash
🆕 [CONTEXTUAL-DEBUG] Creando nueva sesión de conversación  # En cada mensaje = MAL
❌ [CALENDAR-DEBUG] Error in calendar task handling         # Falla ejecución
🤖 [ENHANCED-ENDPOINT] contextual conversation manager failed # Sistema degradado
```

## 🛠️ Scripts de Apoyo

### Monitoreo en Tiempo Real
```bash
./monitor-sara.sh
```

### Verificación del Sistema
```bash
node test-contextual-system.js
```

### Reinicio de Servidor
```bash
pkill -f "npm run dev"; nohup npm run dev > server.log 2>&1 &
```

## 📋 Checklist de Verificación

- [ ] **Contexto mantenido**: Sara recuerda información de mensajes anteriores
- [ ] **Tareas ejecutadas**: Los eventos realmente aparecen en el calendario
- [ ] **Continuidad preservada**: No actúa como primera conversación
- [ ] **Logs correctos**: Aparecen logs de CONTEXTUAL-DEBUG y CALENDAR-DEBUG
- [ ] **SessionId estable**: Mismo sessionId durante toda la conversación
- [ ] **Sin errores 401**: Todas las respuestas son exitosas

## 🎉 Resultado Esperado

**ANTES** (Problema):
- Usuario: "Agrega examen de química"
- Sara: "Te ayudo a planificar" (no crea nada)
- Usuario: "¿A qué hora?"
- Sara: "¡Hola! Encantada de conocerte" (perdió contexto)

**DESPUÉS** (Solucionado):
- Usuario: "Agrega examen de química"
- Sara: "✅ He creado el examen de química en tu calendario..."
- Usuario: "¿A qué hora?"
- Sara: "El examen de química es a las [hora recordada]"