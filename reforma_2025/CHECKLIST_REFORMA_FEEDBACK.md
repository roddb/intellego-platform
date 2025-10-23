# CHECKLIST DE VALIDACIÓN: REFORMA FEEDBACK HAIKU

**Fecha**: 2025-10-22
**Versión**: 1.0
**Responsable**: Rodrigo Di Bernardo

---

## 📋 PRE-IMPLEMENTACIÓN

### Backup y Preparación
- [ ] Crear backup de base de datos Turso
- [ ] Crear rama Git: `feature/reforma-feedback-haiku`
- [ ] Documentar configuración actual de prompts
- [ ] Exportar 10 feedbacks reales para testing de regresión
- [ ] Verificar que desarrollo local funciona correctamente

---

## 🔧 FASE 1: MEJORAR PARSEO

### Implementación
- [ ] Actualizar regex de `FORTALEZAS` para ser flexible con `:`
- [ ] Actualizar regex de `MEJORAS` para ser flexible con `:`
- [ ] Actualizar regex de `COMENTARIOS_GENERALES` para ser flexible con `:`
- [ ] Crear función `extractBulletPoints()` para limitar a 3 items
- [ ] Aplicar límite de 3 en fortalezas
- [ ] Aplicar límite de 3 en mejoras
- [ ] Mejorar `_cleanMarkdown()` para preservar bullets

### Testing Fase 1
- [ ] Test 1.1: Parsear feedback con formato correcto (`FORTALEZAS:`)
  - Resultado esperado: 3 fortalezas capturadas correctamente
- [ ] Test 1.2: Parsear feedback sin `:` (`FORTALEZAS` sin dos puntos)
  - Resultado esperado: 3 fortalezas capturadas correctamente
- [ ] Test 1.3: Parsear feedback con saltos de línea extras
  - Resultado esperado: Contenido limpio sin líneas vacías
- [ ] Test 1.4: Parsear feedback con más de 3 fortalezas
  - Resultado esperado: Solo 3 primeras capturadas
- [ ] Test 1.5: Parsear feedback con 1-2 fortalezas
  - Resultado esperado: Todas capturadas (no forzar 3)

### Validación Fase 1
- [ ] Ejecutar tests unitarios (si existen)
- [ ] Probar con 5 feedbacks reales de la DB
- [ ] Verificar que campos `strengths`, `improvements`, `generalComments` NO quedan vacíos
- [ ] Confirmar que `_cleanMarkdown()` preserva bullets (-, •)
- [ ] Logging: Verificar que no hay errores en consola

---

## ✍️ FASE 2: MODIFICAR PROMPTS

### Implementación
- [ ] Actualizar `_buildCacheableSystemPrompts()`:
  - [ ] Especificar "MÁXIMO 3" en FORTALEZAS
  - [ ] Especificar "MÁXIMO 3" en MEJORAS
  - [ ] Redefinir propósito de COMENTARIOS_GENERALES (devolución del reporte)
  - [ ] Aclarar que ANÁLISIS_AI es para recomendaciones técnicas
- [ ] Actualizar `_buildUserMessage()`:
  - [ ] Incluir ejemplos de formato esperado
  - [ ] Agregar instrucción de "máximo 2-3 líneas por item"
- [ ] Verificar que system prompts siguen siendo cacheables (< 2048 tokens cada uno)

### Testing Fase 2
- [ ] Test 2.1: Generar feedback para reporte completo (Fase 2)
  - Resultado esperado: Máximo 3 fortalezas, máximo 3 mejoras
- [ ] Test 2.2: Generar feedback para reporte de alta calidad
  - Resultado esperado: 3 fortalezas bien justificadas
- [ ] Test 2.3: Generar feedback para reporte de baja calidad
  - Resultado esperado: 1-2 fortalezas, 3 mejoras con sugerencias
- [ ] Test 2.4: Verificar COMENTARIOS_GENERALES
  - Resultado esperado: Devolución del reporte (4-6 líneas), NO genérico
- [ ] Test 2.5: Verificar ANÁLISIS_AI
  - Resultado esperado: Recomendaciones técnicas para siguiente fase

### Validación Fase 2
- [ ] Revisar 3 feedbacks generados con nuevo prompt
- [ ] Confirmar que formato es consistente
- [ ] Verificar que cache sigue funcionando (revisar `cache_read_input_tokens`)
- [ ] Comparar costos API: antes vs después (máx +10% aceptable)
- [ ] Logging: No debe haber warnings de parseo

---

## 🆕 FASE 3: RÚBRICA GENÉRICA PARA CASOS ESPECIALES

### Implementación
- [ ] Crear `RUBRICA_CASO_ESPECIAL` en `rubricas.ts`
  - [ ] Sección para ausencias justificadas
  - [ ] Sección para semanas sin clases
  - [ ] Sección para reportes parcialmente completos
- [ ] Implementar `_detectarCasoEspecial(answers)`:
  - [ ] Detectar respuestas vacías (< 10 chars en 4 de 5 preguntas)
  - [ ] Detectar keywords: "ausente", "viaje", "enfermo", "sin clases", etc.
- [ ] Implementar `_seleccionarRubrica(fase, answers)`:
  - [ ] Retornar `RUBRICA_CASO_ESPECIAL` si es caso especial
  - [ ] Retornar `getRubricaByFase(fase)` si es caso normal
- [ ] Integrar en `analyzeAnswers()`:
  - [ ] Usar `_seleccionarRubrica()` en vez de `getRubricaByFase()` directamente
- [ ] Actualizar lógica de score:
  - [ ] Si es caso especial, `score = null` o `score = -1` (indicador especial)

### Testing Fase 3
- [ ] Test 3.1: Reporte con keyword "ausente"
  - Resultado esperado: Usa RUBRICA_CASO_ESPECIAL, sin score numérico
- [ ] Test 3.2: Reporte con keyword "sin clases"
  - Resultado esperado: Usa RUBRICA_CASO_ESPECIAL, mensaje de apoyo
- [ ] Test 3.3: Reporte con 4 respuestas vacías
  - Resultado esperado: Detecta como caso especial
- [ ] Test 3.4: Reporte normal con 1 respuesta vacía
  - Resultado esperado: Usa rúbrica normal (Fase 1-4)
- [ ] Test 3.5: Reporte con keyword "ausente" pero respuestas completas
  - Resultado esperado: Decidir comportamiento (¿caso especial o normal?)

### Validación Fase 3
- [ ] Crear 3 reportes de prueba con casos especiales
- [ ] Verificar que detección es precisa (no falsos positivos)
- [ ] Confirmar que feedback es empático y constructivo
- [ ] Validar que no se asigna puntaje numérico (o se marca como N/A)
- [ ] Logging: Mensaje "🔍 Caso especial detectado" aparece en logs

---

## 🎨 FASE 4: FORMATEAR ANÁLISIS DETALLADO

### Implementación - Opción TypeScript (Recomendada)
- [ ] Crear función `formatAnalysisForDisplay(rawAnalysis: string)` en `FeedbackModal.tsx`
- [ ] Implementar lógica de separación por secciones
- [ ] Implementar formateo de párrafos
- [ ] Implementar preservación de bullets
- [ ] Aplicar CSS para mejorar legibilidad:
  - [ ] Márgenes entre secciones
  - [ ] Títulos destacados
  - [ ] Line-height para mejor lectura
- [ ] Integrar en el componente que muestra "Análisis Detallado"

### Testing Fase 4
- [ ] Test 4.1: Análisis sin formato (bloque de texto)
  - Resultado esperado: Se divide en secciones y párrafos
- [ ] Test 4.2: Análisis con bullets
  - Resultado esperado: Bullets se preservan
- [ ] Test 4.3: Análisis con Q1_NIVEL, Q2_NIVEL, etc.
  - Resultado esperado: Cada nivel se muestra como sección separada
- [ ] Test 4.4: Verificar en diferentes navegadores
  - Chrome: [ ]
  - Firefox: [ ]
  - Safari: [ ]

### Validación Fase 4
- [ ] Abrir modal de feedback en frontend
- [ ] Verificar que "Análisis Detallado" se ve bien formateado
- [ ] Confirmar que no hay bloques gigantes de texto
- [ ] Validar que secciones están separadas visualmente
- [ ] Comprobar legibilidad en móvil (responsive)

---

## 🧪 TESTING GENERAL DE REGRESIÓN

### Funcionalidad Existente
- [ ] Feedbacks normales (Fase 1) siguen funcionando
- [ ] Feedbacks normales (Fase 2) siguen funcionando
- [ ] Feedbacks normales (Fase 3) siguen funcionando
- [ ] Feedbacks normales (Fase 4) siguen funcionando
- [ ] Cálculo de `score` (0-100) es correcto
- [ ] Skills metrics se calculan correctamente:
  - [ ] `comprehension`
  - [ ] `criticalThinking`
  - [ ] `selfRegulation`
  - [ ] `practicalApplication`
  - [ ] `metacognition`
- [ ] Prompt caching sigue funcionando (verificar `cache_read_input_tokens`)
- [ ] Costos API no aumentan significativamente (máx +10%)

### Integración con Base de Datos
- [ ] `createAIFeedback()` guarda correctamente:
  - [ ] `score`
  - [ ] `generalComments`
  - [ ] `strengths`
  - [ ] `improvements`
  - [ ] `aiAnalysis`
  - [ ] `skillsMetrics` (JSON)
- [ ] Query de feedbacks funciona correctamente
- [ ] Modal de feedback muestra datos correctos

### UI/UX
- [ ] Modal de feedback se abre correctamente
- [ ] Secciones de feedback se muestran en orden correcto:
  1. Score
  2. Comentarios Generales
  3. Fortalezas
  4. Áreas de Mejora
  5. Métricas de Habilidades
  6. Análisis Detallado (formateado)
- [ ] No hay errores en consola del navegador
- [ ] Responsive: Se ve bien en móvil y desktop

---

## 📊 VALIDACIÓN CON DATOS REALES

### Feedbacks de Producción
- [ ] Seleccionar 10 reportes reales de diferentes estudiantes
- [ ] Regenerar feedbacks con nuevo sistema
- [ ] Comparar con feedbacks anteriores:
  - [ ] ¿Fortalezas más específicas? Sí/No
  - [ ] ¿Mejoras más accionables? Sí/No
  - [ ] ¿Comentarios más personalizados? Sí/No
  - [ ] ¿Análisis detallado más legible? Sí/No
- [ ] Documentar mejoras observadas

### Casos Especiales
- [ ] Encontrar 3 reportes con ausencias en producción
- [ ] Verificar que se detectan correctamente como casos especiales
- [ ] Confirmar que feedback es apropiado (empático, sin penalización)

---

## 🚀 PRE-DEPLOY

### Checklist de Seguridad
- [ ] No hay credenciales hardcodeadas
- [ ] No hay console.log() sensibles
- [ ] Todos los try/catch manejan errores correctamente
- [ ] Logging apropiado para debugging

### Checklist de Código
- [ ] Código revisado y limpio
- [ ] TypeScript: No hay errores de tipo
- [ ] ESLint: No hay warnings
- [ ] Prettier: Código formateado
- [ ] Comentarios agregados donde es necesario

### Documentación
- [ ] `PLAN_REFORMA_FEEDBACK_HAIKU.md` actualizado
- [ ] `CHECKLIST_REFORMA_FEEDBACK.md` completado
- [ ] README actualizado (si aplica)
- [ ] Changelog actualizado con versión nueva

---

## 🌐 DEPLOY A PRODUCCIÓN

### Pre-Deploy
- [ ] Crear PR en GitHub con descripción completa
- [ ] Solicitar revisión de código (si aplica)
- [ ] Verificar que todos los tests pasan
- [ ] Confirmar que branch `main` está actualizado

### Deploy
- [ ] Merge PR a `main`
- [ ] Verificar que Vercel inicia deploy automáticamente
- [ ] Monitorear logs de deploy en Vercel
- [ ] Esperar a que deploy esté en "Ready"
- [ ] Verificar URL de producción: https://intellego-platform.vercel.app

### Post-Deploy
- [ ] Probar feedback generation en producción
- [ ] Generar 1 feedback de prueba (estudiante test)
- [ ] Verificar que se muestra correctamente en UI
- [ ] Revisar logs de Claude API:
  - [ ] Costos están dentro de lo esperado
  - [ ] Cache está funcionando
  - [ ] No hay errores 5xx
- [ ] Monitorear por 24 horas:
  - [ ] Errores en Sentry/logs
  - [ ] Quejas de usuarios
  - [ ] Costos de API

---

## 🔄 ROLLBACK (Si es necesario)

### Señales de Alerta
- ⚠️ Costos de API aumentan > 20%
- ⚠️ Errores 5xx en > 5% de requests
- ⚠️ Quejas de 3+ usuarios sobre feedbacks incorrectos
- ⚠️ Feedbacks con campos vacíos en producción

### Procedimiento de Rollback
1. [ ] `git revert [COMMIT_HASH]`
2. [ ] `git push origin main`
3. [ ] Verificar que Vercel deploya versión anterior
4. [ ] Comunicar a usuarios (si afectó a muchos)
5. [ ] Analizar logs para entender qué falló
6. [ ] Corregir en rama de desarrollo
7. [ ] Re-testear exhaustivamente
8. [ ] Intentar deploy nuevamente

---

## ✅ MÉTRICAS DE ÉXITO (A las 2 semanas)

### Métricas Técnicas
- [ ] 0 feedbacks con campos vacíos ("No se identificaron...")
- [ ] 100% de casos especiales manejados correctamente
- [ ] Costos API estables o reducidos (gracias a cache)
- [ ] 0 errores en logs de producción

### Métricas de UX
- [ ] Encuesta a 10 estudiantes: ¿Feedback más útil? (escala 1-5)
  - Meta: Promedio ≥ 4.0
- [ ] Encuesta a instructores: ¿Calidad mejoró? (Sí/No)
  - Meta: ≥ 80% responde "Sí"
- [ ] Análisis detallado más legible (evaluación visual)
  - Meta: 8/10 o superior

---

## 📝 NOTAS Y OBSERVACIONES

### Lecciones Aprendidas
_(Completar durante la implementación)_

-

### Problemas Encontrados
_(Completar si surgen issues)_

-

### Mejoras Futuras
_(Completar con ideas post-implementación)_

-

---

**Última actualización**: 2025-10-22 19:05
**Estado**: ⏳ Pendiente de implementación
**Próxima acción**: Iniciar Fase 1 - Mejorar Parseo
