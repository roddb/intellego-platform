# 📚 Sistema de Corrección Automática de Exámenes

**Estado**: 📋 Planificación Completa
**Tecnología**: Claude Haiku 4.5 + Turso libSQL
**Versión**: 1.0-alpha

---

## 🎯 ¿Qué es esto?

Sistema para corregir exámenes transcritos automáticamente usando IA (Claude Haiku), con:
- ✅ Rúbrica genérica adaptable a cualquier tema
- ✅ Feedback detallado y personalizado
- ✅ Análisis comparativo con historial del estudiante
- ✅ Integración completa con la infraestructura existente de Intellego Platform

---

## 📁 Documentación

### 🚀 Empezar Aquí

1. **[PLAN_INTEGRAL.md](./PLAN_INTEGRAL.md)** ← **LEER PRIMERO**
   - Plan completo de implementación
   - Análisis de infraestructura existente
   - Arquitectura propuesta (6 componentes)
   - Workflow end-to-end
   - Implementación por fases (7 fases)
   - Estimación de costos (~$0.0026 por examen)

### 📐 Rúbrica de Evaluación

2. **[RUBRICA_GENERICA.md](./RUBRICA_GENERICA.md)**
   - 5 Dimensiones de evaluación (Comprensión, Metodología, Ejecución, Justificación, Verificación)
   - 4 Niveles de desempeño por dimensión
   - Descriptores detallados con ejemplos
   - Indicadores clave para cada nivel
   - Cálculo de score final ponderado

### 📝 Ejemplos

3. **[EJEMPLOS/examen_input_ejemplo.md](./EJEMPLOS/examen_input_ejemplo.md)**
   - Ejemplo completo de examen transcrito (Física - Tiro Oblicuo)
   - Formato esperado de entrada
   - 3 ejercicios con desarrollo del alumno
   - Casos de estudio para testing

---

## 🏗️ Arquitectura del Sistema (Resumen)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UPLOAD                                                   │
│    Instructor sube archivos .md con formato: Apellido.md   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PARSER                                                   │
│    - Extrae apellido del filename                           │
│    - Busca estudiante en DB (tabla User)                    │
│    - Lee contenido del examen                               │
│    → Output: ParsedExam                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CORRECTOR AI (Claude Haiku)                              │
│    - System Prompt: Rúbrica genérica (CACHEABLE)            │
│    - User Prompt: Transcripción del examen                  │
│    - Evaluación por 5 dimensiones                           │
│    - Score ponderado 0-100                                  │
│    → Output: AIAnalysis (JSON)                              │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ENRIQUECEDOR                                              │
│    - Query historial del estudiante (Feedback + Evaluation) │
│    - Calcula tendencias                                     │
│    - Genera predicciones vs realidad                        │
│    - Construye feedback en Markdown                         │
│    → Output: Enriched Feedback                              │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PERSISTENCIA                                              │
│    - Guarda en tabla Evaluation                             │
│    - Genera ID único                                        │
│    - Logging completo                                       │
│    → Output: EvaluationRecord                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. UI                                                        │
│    - Vista de resultados                                    │
│    - Preview de feedback                                    │
│    - Export a PDF                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Ejemplo de Flujo

### Input (Archivo subido):

```
Filename: Gonzalez.md

Contenido:
# Examen de Física - Tiro Oblicuo
**Alumno**: González, Juan

## Ejercicio 1: Calcular alcance...
[Desarrollo del alumno con cálculos]
```

### Processing:

1. **Parser** identifica apellido "Gonzalez"
2. **Busca** en DB: encuentra `userId = "u_abc123"` para "González, Juan"
3. **Claude Haiku** evalúa usando rúbrica genérica:
   - D1 Comprensión: Nivel 4 (92.5)
   - D2 Metodología: Nivel 3 (77)
   - D3 Ejecución: Nivel 4 (92.5)
   - D4 Justificación: Nivel 3 (77)
   - D5 Verificación: Nivel 4 (92.5)
   - **Score Final: 86/100**

4. **Enriquecedor** agrega:
   - Historial: últimos 3 exámenes (75, 78, 82) → tendencia ascendente
   - Predicción: esperábamos 80-85 → resultado ALINEADO
   - Comparación con reportes semanales

### Output (Guardado en DB):

```markdown
# RETROALIMENTACIÓN - GONZÁLEZ, JUAN

## Examen: Física - Tiro Oblicuo
### Fecha: 15/10/2025
### Nota: 86/100

## 📊 Tu Progreso Histórico:
Tus últimos 3 exámenes: 75 → 78 → 82 → 86 (TENDENCIA ASCENDENTE ✓)
Promedio histórico: 80.25

## 🔍 Análisis Ejercicio por Ejercicio:
[Feedback detallado...]

## 💡 Recomendaciones Personalizadas:
[3-4 recomendaciones específicas...]
```

---

## 💰 Costos Estimados

**Por examen** (con Prompt Caching):
- Primera corrección: ~$0.00405
- Siguientes (cache hit): ~$0.00255
- **Promedio: $0.0026 por examen**

**Batch de 30 exámenes**: ~$0.08

**Proyección mensual**:
- 120 exámenes/mes → **$0.31/mes**
- 480 exámenes/mes → **$1.25/mes**

**Muy por debajo del presupuesto de $10/mes** ✅

---

## 🚀 Estado de Implementación

### ✅ Completado:
- [x] Análisis de infraestructura existente
- [x] Diseño de rúbrica genérica
- [x] Diseño de arquitectura
- [x] Plan de implementación detallado
- [x] Ejemplos y casos de prueba

### 📋 Próximas Fases:

#### Fase 1: Fundamentos (Semana 1)
- [ ] Implementar parser de archivos `.md`
- [ ] Lógica de matching de apellidos
- [ ] Testing del parser

#### Fase 2: Corrección AI (Semana 2)
- [ ] Adaptar `EducationalAnalyzer` para exámenes
- [ ] Implementar `ExamAnalyzer`
- [ ] Integración con Claude Haiku

#### Fase 3-6: [Ver PLAN_INTEGRAL.md para detalles]

---

## 🔑 Decisiones Clave de Diseño

### 1. Rúbrica Genérica vs Específica
**Decisión**: Rúbrica genérica de 5 dimensiones
**Razón**:
- Permite corregir exámenes de cualquier tema
- Evalúa proceso de pensamiento (universal)
- No requiere conocimiento específico del dominio
- Futura extensión: rúbricas específicas por materia

### 2. Matching por Apellido
**Decisión**: Usar apellido en filename como identificador principal
**Razón**:
- Fácil para instructores (nombrar archivo = apellido)
- Más robusto que nombre completo (evita errores de tipeo)
- Fuzzy matching permite variaciones (tildes, espacios)
**Alternativa considerada**: OCR de fotos → descartada por fase inicial

### 3. Prompt Caching
**Decisión**: Cachear rúbrica genérica en system prompt
**Razón**:
- Rúbrica es constante (~5,000 tokens)
- Ahorro de 70-90% en costos
- Cache duration: 5 minutos (suficiente para batch)
**Impacto**: Reduce costo de $0.0048 a $0.0026 por examen

### 4. Enriquecimiento con Historial
**Decisión**: Incluir análisis comparativo con datos históricos
**Razón**:
- Feedback más contextualizado y personalizado
- Identifica tendencias (mejora/empeora)
- Validación de predicciones (confiabilidad)
- Reutiliza infraestructura existente (Feedback + Evaluation tables)

---

## 📞 Contacto y Siguiente Paso

**Owner**: Rodrigo Di Bernardo
**Assistant**: Claude Code (Sonnet 4.5)

### 🎯 Próximo Paso Inmediato:

1. **Revisar y aprobar** este plan completo
2. **Decidir** si proceder con implementación de Fase 1
3. **Preparar** archivos `.md` de exámenes reales para testing inicial

---

## 📚 Referencias Relacionadas

- **Sistema de Feedback Actual**: `src/services/ai/claude/analyzer.ts`
- **Rúbricas de Reportes**: `src/services/ai/claude/prompts/rubricas.ts`
- **Tabla Evaluation**: Ver schema en PLAN_INTEGRAL.md
- **Documentación AI Integration**: `AI_integrations_haiku/`

---

**Creado**: 21 de Octubre, 2025
**Última actualización**: 21 de Octubre, 2025
**Versión**: 1.0-alpha
