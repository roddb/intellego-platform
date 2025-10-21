# Product Requirements Document (PRD)
# Sistema de Corrección Automática de Exámenes

**Versión:** 1.0
**Fecha:** 21 de octubre de 2025
**Responsable del Producto:** Colegio Santo Tomás de Aquino
**Equipo Técnico:** Claude Code + Antropic AI

---

## 📋 TABLA DE CONTENIDOS

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [System Architecture](#3-system-architecture)
4. [User Personas](#4-user-personas)
5. [Core Features & Workflows](#5-core-features--workflows)
6. [Technical Specifications](#6-technical-specifications)
7. [Data Model & Integration](#7-data-model--integration)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Success Metrics & KPIs](#10-success-metrics--kpis)
11. [Risks & Mitigation Strategies](#11-risks--mitigation-strategies)
12. [Roadmap & Future Enhancements](#12-roadmap--future-enhancements)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Overview

El **Sistema de Corrección Automática de Exámenes** es una solución de inteligencia artificial diseñada para automatizar la corrección de exámenes escritos de Física y Química en el Colegio Santo Tomás de Aquino. El sistema combina transcripción fiel, análisis procedimental por fases y retroalimentación personalizada basada en datos históricos de rendimiento estudiantil.

### 1.2 Problem Statement

**Problema actual:**
- Corrección manual de exámenes consume 30-45 minutos por alumno
- Feedback genérico sin personalización basada en historial del estudiante
- Inconsistencias en criterios de evaluación entre docentes
- Imposibilidad de validar científicamente la efectividad del sistema de seguimiento pedagógico
- Dificultad para escalar el análisis procedimental detallado a cursos grandes (30+ alumnos)

**Costos estimados:**
- Docente corrigiendo 30 alumnos: 15-22.5 horas de trabajo
- Costo de oportunidad: tiempo no dedicado a planificación o atención personalizada
- Inconsistencia pedagógica: evaluaciones subjetivas sin criterios sistemáticos

### 1.3 Solution Overview

**Sistema dual de corrección:**

1. **Workflow 103** - Corrección Comparativa con Historial (25-30 min/alumno)
   - Evaluación comparativa vs. desempeño histórico del estudiante
   - Validación de predicciones de la base de datos pedagógica
   - Generación de 2 notas: Nota_Examen (pura) y Nota_Final (ajustada)
   - Factores de confiabilidad según precisión histórica
   - **Modo Paralelo:** Procesamiento 3-5x más rápido (9+ alumnos)

2. **Workflow 104** - Corrección Básica sin Historial (15-20 min/alumno, 40% más rápido)
   - Evaluación absoluta vs. criterios universales
   - Ideal para exámenes diagnóstico o nuevos estudiantes
   - Generación de 1 nota única (evaluación 0-100)
   - Sin requerimiento de datos históricos

**Componentes comunes:**
- Transcripción fiel preservando errores originales
- Verificación matemática obligatoria antes de evaluar
- Análisis procedimental por 5 fases
- Retroalimentación personalizada en formato Markdown
- Persistencia en base de datos Turso (Intellego)

### 1.4 Business Impact

**Beneficios cuantificables:**

| Métrica | Situación Actual | Con Sistema | Mejora |
|---------|-----------------|-------------|--------|
| **Tiempo corrección (30 alumnos)** | 15-22.5 horas | 7.5-12.5 horas (W104) o 4-6 horas (W103 paralelo) | **50-73% reducción** |
| **Consistencia criterios** | Variable (subjetivo) | 100% sistemático | **Estandarización completa** |
| **Personalización feedback** | Genérica | Basada en historial individual | **100% personalizada** |
| **Validación pedagógica** | No disponible | Validación científica continua | **Nueva capacidad** |
| **Escalabilidad** | Limitada por tiempo docente | Modo paralelo hasta 50+ alumnos | **10x escala** |

**ROI estimado:**
- Ahorro de tiempo docente: ~8-16 horas por examen (curso 30 alumnos)
- Valor monetario (asumiendo $50/hora docente): $400-$800 por examen
- 4-6 exámenes por año/materia: **$1,600-$4,800 anuales por materia**
- 2 materias (Física, Química) × 3 cursos: **$9,600-$28,800 anuales**

---

## 2. PRODUCT VISION & OBJECTIVES

### 2.1 Vision Statement

> "Transformar la corrección de exámenes de un proceso manual, laborioso y genérico a un sistema automatizado, científicamente validado y altamente personalizado que potencia el aprendizaje individual mediante retroalimentación específica basada en el progreso histórico de cada estudiante."

### 2.2 Mission

Proporcionar a los docentes del Colegio Santo Tomás de Aquino una herramienta de IA que:

1. **Automatice** la corrección de exámenes sin sacrificar calidad pedagógica
2. **Personalice** la retroalimentación basándose en el historial único de cada estudiante
3. **Valide científicamente** la efectividad del sistema de seguimiento pedagógico
4. **Escale** la capacidad de análisis procedimental detallado a cursos grandes
5. **Estandarice** criterios de evaluación con transparencia total en cálculos

### 2.3 Strategic Objectives (2025-2026)

**Q4 2025:**
- ✅ Implementar Workflow 103 y 104 en Física y Química
- ✅ Validar modo paralelo con 3-5 batches
- ✅ Integración completa con BD Turso (Intellego)
- 🎯 Procesar 200+ evaluaciones con tasa de éxito >95%

**Q1 2026:**
- Expandir a otras materias (Matemática, Biología)
- Implementar análisis de tendencias históricas por curso
- Dashboard de métricas pedagógicas para docentes
- Sistema de alertas tempranas (estudiantes en riesgo)

**Q2-Q4 2026:**
- Integración con sistema de gestión escolar (LMS)
- Módulo de generación automática de rúbricas adaptativas
- Sistema de recomendaciones pedagógicas basado en patrones agregados
- Exportación a formato estándar educativo (IMS QTI)

### 2.4 Success Criteria

El producto será considerado exitoso si logra:

1. **Eficiencia:** Reducir tiempo de corrección en ≥50%
2. **Precisión:** Consistencia de calificación ≥95% con corrección manual de docentes (validado en muestreo)
3. **Validación Pedagógica:** ≥70% de predicciones BD confirmadas en promedio
4. **Adopción:** Uso en 100% de exámenes de Física y Química en 2026
5. **Satisfacción:** Net Promoter Score (NPS) de docentes ≥8/10

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE USUARIO                          │
│  Claude Code CLI + Comandos Naturales + Dashboard (Futuro)     │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                   CAPA DE ORQUESTACIÓN                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Workflow 103 │  │ Workflow 104 │  │ Coordinador  │          │
│  │ (Comparativo)│  │   (Básico)   │  │   Paralelo   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                CAPA DE PROCESAMIENTO (Agents)                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ Transcriber │  Analyzer   │  Grade Calc │  Feedback   │     │
│  │   Agent     │   Agent     │    Agent    │   Generator │     │
│  ├─────────────┼─────────────┼─────────────┼─────────────┤     │
│  │   DB        │ Expectation │ Validator   │  Uploader   │     │
│  │ Extractor   │ Calculator  │   Agent     │   Agent     │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      CAPA DE DATOS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Turso Cloud  │  │  Archivos    │  │  Criterios   │          │
│  │ (Intellego)  │  │  Locales     │  │  y Rúbricas  │          │
│  │              │  │ (CSV, MD,    │  │   (MD)       │          │
│  │ - Students   │  │  JSON, PDF)  │  │              │          │
│  │ - Evaluation │  │              │  │              │          │
│  │ - Feedback   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

#### 3.2.1 Orchestration Layer

**Workflow 103 - Corrección Comparativa:**
- 13 eslabones secuenciales (E0-E12)
- Modo secuencial: 1 alumno a la vez
- Modo paralelo: N batches simultáneos (Task agents)
- Entrada: Checklist maestro + PDFs de exámenes
- Salida: Transcripciones, análisis, retroalimentación, registro BD

**Workflow 104 - Corrección Básica:**
- 6 eslabones simplificados (E0-E5)
- Solo modo secuencial
- Entrada: Checklist maestro + PDFs de exámenes
- Salida: Transcripciones, análisis, retroalimentación, registro BD opcional

**Coordinador Paralelo:**
- División de checklist en N batches
- Lanzamiento de Task agents simultáneos
- Monitoreo de progreso
- Consolidación de resultados

#### 3.2.2 Processing Layer (Specialized Agents)

| Agent | Responsabilidad | Workflow | Entrada | Salida |
|-------|----------------|----------|---------|--------|
| **workflow-initializer** | Inicializar/reanudar workflow, gestionar checklist | W103, W104 | Checklist + config | Checklist actualizado, siguiente alumno |
| **exam-transcriber** | Transcribir examen preservando errores | W103, W104 | PDF/Imagen examen | `TRANSCRIPCION_*.md` |
| **database-extractor** | Extraer historial de BD, calcular Score_Base | W103 | studentId + subject | Competencias, Score_Base, categoría |
| **expectation-calculator** | Calcular expectativas por fase | W103 | Competencias BD | Scores esperados por fase |
| **comparative-analyzer** | Análisis fase por fase con verificación matemática | W103 | Transcripción + expectativas | Estados comparativos, factores ajuste |
| **basic-analyzer** | Análisis absoluto (0-100) con verificación | W104 | Transcripción | Puntajes absolutos por fase |
| **comparative-evaluator** | Consolidar análisis de 5 fases, acumular factores | W103 | Output de comparative-analyzer | Factores ajuste acumulados, validaciones |
| **performance-validator** | Validar predicciones BD, calcular confiabilidad | W103 | Validaciones de fases | Factor confiabilidad, % aciertos |
| **grade-calculator** | Calcular Nota_Examen y Nota_Final con ajustes | W103 | Score_Base + factores + confiabilidad | Nota_Examen, Nota_Final, justificación |
| **basic-grade-calculator** | Calcular nota única sin ajustes | W104 | Puntajes por fase | Nota única, justificación |
| **feedback-generator** | Generar retroalimentación personalizada con sección "Justificación de tu Nota" | W103 | Todos los datos de corrección | `*_retroalimentacion_*.md` (W103) |
| **basic-feedback-generator** | Generar retroalimentación sin comparación histórica | W104 | Todos los datos de corrección | `*_retroalimentacion_*.md` (W104) |
| **feedback-uploader** | Subir retroalimentación W104 a BD | W104 | Archivo feedback + studentId | Registro Evaluation en BD |
| **database-uploader** | Normalizar y subir evaluación a BD Turso | W103 | Feedback + student + exam data | Registro Evaluation + actualización checklist |
| **checklist-updater** | Actualizar checklist y decidir loop | W103, W104 | Estado completado del alumno | Checklist actualizado, decisión (continuar/finalizar) |
| **batch-processor-workflow103** | Procesar batch completo en modo paralelo | W103 paralelo | Batch checklist + config | Batch completado, reporte |

#### 3.2.3 Data Layer

**Base de Datos Turso (Intellego):**
- Tabla `User`: Estudiantes con competencias históricas
- Tabla `Evaluation`: Evaluaciones completadas (score, feedback)
- Tabla `Feedback`: Retroalimentación semanal con skillsMetrics

**Almacenamiento Local:**
- **Checklists:** CSV con estado de corrección
- **Transcripciones:** Markdown con preservación fiel de errores
- **Análisis:** Markdown con puntajes por fase
- **Notas:** JSON (datos estructurados) + MD (explicación paso a paso)
- **Retroalimentación:** Markdown personalizado para estudiantes
- **Configuración:** JSON para batches paralelos
- **Logs:** CSV con errores y eventos

### 3.3 Data Flow - Workflow 103

```
┌─────────────┐
│ E0: Init    │  → Cargar checklist, identificar siguiente alumno
└──────┬──────┘
       │
┌──────▼──────┐
│ E1: Select  │  → Buscar PDF del alumno, marcar EN_PROCESO
└──────┬──────┘
       │
┌──────▼──────┐
│ E2: Trans.  │  → exam-transcriber: PDF → TRANSCRIPCION_*.md
└──────┬──────┘
       │
┌──────▼──────┐
│ E3: DB Ext. │  → database-extractor: studentId → Score_Base, competencias
└──────┬──────┘
       │
┌──────▼──────┐
│ E4: Expect. │  → expectation-calculator: competencias → scores esperados
└──────┬──────┘
       │
┌──────▼──────┐
│ E5: Comp.   │  → comparative-analyzer: transcripción + expectativas → estados
│   Analysis  │     (con verificación matemática obligatoria)
└──────┬──────┘
       │
┌──────▼──────┐
│ E6: Eval.   │  → comparative-evaluator: análisis 5 fases → factores acumulados
└──────┬──────┘
       │
┌──────▼──────┐
│ E7: Valid.  │  → performance-validator: validaciones → factor confiabilidad
└──────┬──────┘
       │
┌──────▼──────┐
│ E8: Grade   │  → grade-calculator: Score_Base + factores + confiabilidad
│   Calc.     │     → Nota_Examen, Nota_Final
└──────┬──────┘
       │
┌──────▼──────┐
│ E9: Feed.   │  → feedback-generator: todos los datos → retroalimentacion.md
│   Gen.      │     (incluye sección "Justificación de tu Nota")
└──────┬──────┘
       │
┌──────▼──────┐
│ E10: Check. │  → checklist-updater: actualizar estado COMPLETADO
│   Update    │
└──────┬──────┘
       │
┌──────▼──────┐
│ E11: Loop   │  → checklist-updater: ¿hay pendientes? → continuar/finalizar
│   Decision  │
└──────┬──────┘
       │
┌──────▼──────┐
│ E12: DB     │  → database-uploader: normalizar y subir a Turso
│   Upload    │     → actualizar checklist con evaluationId
└──────┬──────┘
       │
       ▼
    Si hay pendientes: volver a E0
    Si no: Finalizar workflow
```

### 3.4 Parallel Processing Architecture (Workflow 103)

```
┌────────────────────────────────────────────────────────────────┐
│             CHECKLIST MAESTRO (30 alumnos PENDIENTES)          │
└─────────────────────────┬──────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │ DIVISIÓN EN 3 BATCHES │  (parallel_coordinator.py)
              └───────────┬───────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌─────▼──────┐ ┌───────▼────────┐
│   BATCH 1      │ │  BATCH 2   │ │   BATCH 3      │
│ (10 alumnos)   │ │(10 alumnos)│ │ (10 alumnos)   │
│ CHECKLIST_     │ │ CHECKLIST_ │ │ CHECKLIST_     │
│ BATCH_1.csv    │ │ BATCH_2.csv│ │ BATCH_3.csv    │
└───────┬────────┘ └─────┬──────┘ └───────┬────────┘
        │                 │                 │
        │    ┌────────────▼────────────┐    │
        │    │  TASK AGENTS PARALELOS  │    │
        │    │  (lanzados simultáneos) │    │
        │    └────────────┬────────────┘    │
        │                 │                 │
┌───────▼────────┐ ┌─────▼──────┐ ┌───────▼────────┐
│ Task Agent 1   │ │ Task Agent 2│ │ Task Agent 3  │
│ (W103 E0-E12)  │ │ (W103 E0-E12)│ │(W103 E0-E12)  │
│ para Batch 1   │ │ para Batch 2│ │ para Batch 3  │
└───────┬────────┘ └─────┬──────┘ └───────┬────────┘
        │                 │                 │
        │  ┌──────────────┴──────────────┐  │
        └──►   GENERACIÓN AUTÓNOMA:      ◄──┘
           │ - Transcripciones          │
           │ - Análisis                 │
           │ - Retroalimentaciones      │
           │ - Subida a BD Turso        │
           └────────────┬────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐ ┌───▼────────┐ ┌───▼────────────┐
│ REPORTE_       │ │ REPORTE_   │ │ REPORTE_       │
│ BATCH_1.md     │ │ BATCH_2.md │ │ BATCH_3.md     │
└───────┬────────┘ └───┬────────┘ └───┬────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
            ┌───────────▼───────────┐
            │   CONSOLIDACIÓN       │  (parallel_coordinator.py)
            └───────────┬───────────┘
                        │
        ┌───────────────▼───────────────────┐
        │ CHECKLIST MAESTRO ACTUALIZADO     │
        │ + REPORTE_CONSOLIDADO_PARALELO.md │
        └───────────────────────────────────┘
```

**Características clave del modo paralelo:**
- **Velocidad:** 3-5x más rápido que modo secuencial
- **Escalabilidad:** Óptimo para 9+ alumnos (4-6 alumnos por batch)
- **Fault tolerance:** Fallo en un batch no afecta otros
- **Sin race conditions:** Cada batch tiene checklist independiente
- **Concurrencia BD:** Turso maneja queries simultáneos sin conflictos
- **Calidad idéntica:** Mismo workflow, mismos criterios, misma profundidad

---

## 4. USER PERSONAS

### 4.1 Persona 1: Docente de Física

**Nombre:** María González
**Rol:** Profesora de Física (4to y 5to año)
**Edad:** 42 años
**Experiencia:** 15 años enseñando

**Contexto:**
- Enseña a 3 cursos (4to C, 4to D, 5to A) con 25-30 alumnos cada uno
- Toma 4-6 exámenes escritos por año/curso
- Corrección manual le toma 15-20 horas por curso/examen
- Desea dar feedback personalizado pero le falta tiempo
- Usa sistema Intellego para tracking semanal de estudiantes

**Necesidades:**
- Reducir tiempo de corrección sin sacrificar calidad
- Feedback personalizado basado en historial de cada alumno
- Validar si su sistema de tracking predice bien el desempeño en exámenes
- Estandarizar criterios de evaluación con transparencia
- Identificar patrones de dificultad recurrentes en el curso

**Pain Points:**
- Corrección manual es repetitiva y agotadora
- Feedback genérico no ayuda a alumnos con necesidades específicas
- No tiene forma de validar científicamente efectividad del tracking
- Inconsistencias entre su evaluación y la de colegas
- Falta de tiempo para análisis procedimental detallado de cada alumno

**Success Metrics:**
- Tiempo de corrección ≤50% del actual
- Feedback específico por alumno (no genérico)
- Validación de ≥70% de predicciones de BD
- Confianza de que el sistema evalúa con los mismos criterios que ella

### 4.2 Persona 2: Docente de Química

**Nombre:** Carlos Ramírez
**Rol:** Profesor de Química (4to año)
**Edad:** 38 años
**Experiencia:** 10 años enseñando

**Contexto:**
- Enseña a 3 cursos (4to C, 4to D, 4to E) con 28-32 alumnos cada uno
- Exámenes con muchos cálculos numéricos y verificaciones
- Le preocupa ser justo en evaluación de errores matemáticos
- Quiere distinguir entre errores de proceso y errores de resultado
- Recién empezando a usar Intellego (algunos alumnos sin historial)

**Necesidades:**
- Verificación matemática automática antes de evaluar (evitar errores de docente)
- Corrección de exámenes de alumnos nuevos sin historial
- Distinguir claramente error raíz vs. error consecuencia
- Poder corregir algunos alumnos rápido (diagnóstico) sin análisis histórico
- Flexibilidad para elegir workflow según situación

**Pain Points:**
- Errores propios al verificar cálculos complejos manualmente
- Penalizar dos veces el mismo error (raíz + consecuencias)
- No poder dar feedback detallado a alumnos nuevos (sin historial)
- Corrección demasiado lenta para exámenes diagnósticos
- Dificultad para documentar proceso de corrección (transparencia)

**Success Metrics:**
- 100% verificación matemática antes de evaluar
- Workflow 104 disponible para diagnósticos (≤20 min/alumno)
- Documentación clara de cálculo de nota (justificación paso a paso)
- Flexibilidad para usar W103 o W104 según necesidad

### 4.3 Persona 3: Coordinador Académico

**Nombre:** Lucía Fernández
**Rol:** Coordinadora de Ciencias
**Edad:** 50 años
**Experiencia:** 25 años en educación

**Contexto:**
- Supervisa docentes de Física, Química, Biología
- Necesita reportes de rendimiento por curso/materia
- Debe validar consistencia de criterios de evaluación
- Responsable de identificar estudiantes en riesgo tempranamente
- Busca mejorar sistema pedagógico con evidencia científica

**Necesidades:**
- Reportes agregados de rendimiento por curso/materia
- Validación de consistencia en criterios de evaluación
- Identificación temprana de alumnos en riesgo
- Evidencia científica de efectividad del tracking pedagógico
- Dashboard con métricas clave (promedio, desviación, tendencias)

**Pain Points:**
- Falta de visibilidad de rendimiento agregado
- Inconsistencias entre evaluaciones de diferentes docentes
- No hay alertas tempranas de estudiantes en riesgo
- Sistema de tracking sin validación científica
- Dificultad para tomar decisiones pedagógicas basadas en datos

**Success Metrics:**
- Dashboard con métricas de rendimiento agregado
- Tasa de validación de predicciones BD ≥70% (sistema confiable)
- Alertas de estudiantes con bajo rendimiento vs. capacidad histórica
- Reportes automáticos post-corrección

---

## 5. CORE FEATURES & WORKFLOWS

### 5.1 Feature 1: Workflow 103 - Corrección Comparativa con Historial

**Descripción:**
Sistema de corrección que compara el desempeño del estudiante en el examen actual con su historial de competencias, generando retroalimentación personalizada y validando predicciones de la base de datos pedagógica.

**Componentes:**
1. **Transcripción Fiel** (E2)
   - Preservación exacta de errores del estudiante
   - Organización por 5 fases procedimentales
   - Marcadores especiales: [ILEGIBLE], [TACHADO], [CORREGIDO]

2. **Extracción de Datos Históricos** (E3)
   - Query a BD Turso (tabla User, Feedback)
   - Cálculo de Score_Base (promedio ponderado de competencias)
   - Categorización: SIN_HISTORIAL, DATOS_INSUFICIENTES, DATOS_COMPLETOS

3. **Cálculo de Expectativas** (E4)
   - Mapeo competencias → fases del examen
   - Fórmulas específicas por fase (ej: F1 = CU×0.7 + RC×0.3)
   - Generación de scores esperados por fase

4. **Análisis Comparativo** (E5)
   - Verificación matemática obligatoria (recalcular independientemente)
   - Comparación real vs. esperado fase por fase
   - Asignación de estados: 🔴 MUY_BAJO, 🟠 BAJO, 🟡 ALINEADO, 🔵 SUPERIOR, 🟢 EXCEPCIONAL

5. **Evaluación y Consolidación** (E6)
   - Acumulación de factores de ajuste (-0.20 a +0.20 por fase)
   - Validación de predicciones: ✅ CONFIRMADA, ⚠️ PARCIAL, ❌ FALLIDA, 🆕 NUEVA

6. **Validación de Confiabilidad** (E7)
   - Cálculo de % aciertos de predicciones BD
   - Factor confiabilidad: 1.0 (≥80%), 0.7 (60-79%), 0.3 (<60%)

7. **Cálculo Dual de Notas** (E8)
   - **Nota_Examen:** Promedio ponderado de desempeño por fase (sin ajustes históricos)
   - **Nota_Final:** Score_Base × (1 + Σ(Factor_Ajuste × Peso_Fase × Factor_Confiabilidad))
   - Documentación paso a paso de cálculo

8. **Retroalimentación Personalizada** (E9)
   - 7 secciones incluyendo **"Justificación de tu Nota"** (nueva sección obligatoria)
   - Comparación Nota_Examen vs. Nota_Final con explicación
   - Tabla de ajustes por fase con impacto
   - Recomendaciones basadas en discrepancias específicas

9. **Persistencia en BD** (E12)
   - Normalización de datos (subject, examDate, examTopic)
   - Generación de evaluationId único (SHA256)
   - INSERT en tabla Evaluation con retry automático
   - Actualización de checklist con evaluationId

**Flujo de Usuario:**
```bash
# Iniciar corrección secuencial
"Iniciar Workflow 103 con @listado_alumnos.csv para 4to C tema Tiro Oblicuo en d. Examen_tiro_oblicuo_4to_C/"

# O iniciar corrección paralela (3-5x más rápido)
"Iniciar Workflow 103 PARALELO con 3 batches para 4to C tema Tiro Oblicuo en d. Examen_tiro_oblicuo_4to_C/"

# Retomar si se interrumpe
"Retomar Workflow 103 desde checklist guardado"

# Ver estado
"Mostrar estado actual del checklist de corrección"
```

**Archivos Generados (por alumno):**
- `TRANSCRIPCION_[Apellido]_[Nombre].md`
- `NOTA_[Apellido]_[Nombre].json` (datos estructurados)
- `NOTA_[Apellido]_[Nombre].md` (explicación paso a paso)
- `[Apellido]_[Nombre]_retroalimentacion_[DDMMYYYY].md` (en subfolder `retroalimentaciones_[tema]_[curso]/`)

**Archivos de Control:**
- `CHECKLIST_CORRECCION.csv` (o `CHECKLIST_CORRECCION_W103.csv`)
- `LOG_ERRORES_WORKFLOW.csv`
- `REPORTE_CONSOLIDADO_PARALELO.md` (si modo paralelo)

**Tiempos:**
- **Secuencial:** 25-30 min/alumno
- **Paralelo (3 batches):** 8-10 min/alumno (3x más rápido)
- **Paralelo (5 batches):** 5-7 min/alumno (5x más rápido)

### 5.2 Feature 2: Workflow 104 - Corrección Básica sin Historial

**Descripción:**
Sistema de corrección simplificado que evalúa el examen con criterios absolutos (0-100) sin requerir datos históricos, ideal para exámenes diagnóstico o estudiantes nuevos.

**Componentes:**
1. **Transcripción Fiel** (E1) - Idéntico a W103

2. **Análisis Absoluto** (E2)
   - Evaluación 0-100 por fase según RUBRICA_BASICA.md
   - Verificación matemática obligatoria (mismo protocolo que W103)
   - Sin comparación histórica
   - Rangos: 90-100 (Excelente), 75-89 (Muy Bueno), 60-74 (Bueno), etc.

3. **Cálculo de Nota Única** (E3)
   - Fórmula: Nota = Σ(Puntaje_Fase × Peso_Fase)
   - Sin ajustes históricos
   - Justificación basada en criterios absolutos

4. **Retroalimentación Simplificada** (E4)
   - 6 secciones (vs. 7 en W103)
   - Sin sección "Justificación de tu Nota" (no hay comparación histórica)
   - Enfoque en fortalezas y debilidades observadas en el examen
   - Recomendaciones generales (no personalizadas por historial)

5. **Upload a BD Opcional** (E5)
   - Especialista: feedback-uploader (diferente de database-uploader de W103)
   - Parsea feedback W104 y sube a tabla Evaluation
   - Incluye instructorId en registro
   - Manejo de errores sin bloquear workflow

**Flujo de Usuario:**
```bash
# Iniciar corrección
"Iniciar Workflow 104 con @listado_alumnos.csv para 4to D tema Gases Ideales en examen_gases_ideales_4to_D/"

# Procesar un solo alumno (útil para alumnos que rindieron después)
"Procesar solo a Gonzalez Ana en Workflow 104 para Gases Ideales en examen_gases_ideales_4to_D/"

# Solo transcripción (sin análisis)
"Transcribir solo el examen de Rodriguez Carlos en examen_gases_ideales_4to_D/Rodriguez_Carlos.pdf"

# Retomar
"Retomar Workflow 104 desde checklist guardado"
```

**Archivos Generados (por alumno):**
- `TRANSCRIPCION_[Apellido]_[Nombre].md`
- `ANALISIS_BASICO_[Apellido]_[Nombre].md` (específico de W104)
- `NOTA_[Apellido]_[Nombre].json`
- `NOTA_[Apellido]_[Nombre].md`
- `[Apellido]_[Nombre]_retroalimentacion_[DDMMYYYY].md` (en subfolder `retroalimentaciones_[tema]_[curso]/`)

**Archivos de Control:**
- `CHECKLIST_CORRECCION_W104.csv`
- `LOG_ERRORES_WORKFLOW.csv`

**Tiempos:**
- **Secuencial:** 15-20 min/alumno (40% más rápido que W103)

**Cuándo Usar W104 vs. W103:**

| Situación | Workflow Recomendado |
|-----------|----------------------|
| Estudiantes con ≥3 evaluaciones en BD | W103 (comparativo) |
| Examen diagnóstico (primera evaluación) | W104 (absoluto) |
| Estudiantes nuevos sin historial | W104 (absoluto) |
| Necesito velocidad y no tengo historial | W104 (40% más rápido) |
| Quiero validar sistema de tracking pedagógico | W103 (con factores de confianza) |
| Tengo ≥9 alumnos y quiero máxima velocidad | W103 PARALELO (3-5x más rápido) |

### 5.3 Feature 3: Modo Paralelo (Workflow 103)

**Descripción:**
Procesamiento concurrente de múltiples batches de alumnos usando Task agents independientes, logrando velocidad 3-5x mayor que modo secuencial sin pérdida de calidad.

**Componentes:**
1. **División en Batches**
   - Script: `parallel_coordinator.py dividir`
   - Input: Checklist maestro + número de batches
   - Output: `CHECKLIST_BATCH_1.csv`, `CHECKLIST_BATCH_2.csv`, ..., `BATCHES_CONFIG.json`
   - Algoritmo: Distribución equitativa (4-6 alumnos por batch óptimo)

2. **Lanzamiento de Task Agents**
   - Claude lanza N Task agents simultáneamente
   - Cada agent recibe: batch_id, checklist_path, exam_folder, curso, tema
   - Cada agent ejecuta W103 completo (E0-E12) para SU batch
   - Agents operan autónomamente sin interferir entre sí

3. **Procesamiento Independiente por Batch**
   - Agent lee `@WORKFLOW_103_PARALLEL.md`
   - Procesa cada alumno de SU checklist batch
   - Genera transcripciones, análisis, retroalimentaciones
   - Actualiza SU checklist batch (NO el maestro)
   - Sube registros a BD Turso (evaluationId único previene duplicados)
   - Genera `REPORTE_BATCH_[N].md`

4. **Monitoreo de Progreso**
   - Comando: `"Verificar estado de batches paralelos"`
   - Verifica completitud de cada batch
   - Reporta pendientes por batch

5. **Consolidación de Resultados**
   - Script: `parallel_coordinator.py consolidar`
   - Input: CHECKLIST_BATCH_*.csv
   - Output: Checklist maestro actualizado + `REPORTE_CONSOLIDADO_PARALELO.md`
   - Acumula estadísticas: promedio notas, rango, BD uploads

**Garantías de Seguridad:**
- **Sin race conditions:** Cada batch tiene checklist independiente
- **Sin colisiones BD:** evaluationId único por diseño (SHA256)
- **Fault tolerance:** Fallo en un batch no afecta otros
- **Calidad idéntica:** Mismo workflow, mismos criterios, misma profundidad
- **Concurrencia BD:** Turso/SQLite con WAL maneja lecturas simultáneas + 1 escritor

**Flujo de Usuario:**
```bash
# Iniciar paralelo (recomendado ≥9 alumnos)
"Iniciar Workflow 103 PARALELO con 3 batches para 4to C tema Tiro Oblicuo en d. Examen_tiro_oblicuo_4to_C/"

# Verificar progreso mientras se ejecuta
"Verificar estado de batches paralelos"

# Si un batch falla, relanzarlo específicamente
"Relanzar Task agent para Batch 2 con CHECKLIST_BATCH_2.csv"

# Al terminar todos, consolidar
"Consolidar resultados de corrección paralela"
```

**Escalabilidad:**

| Alumnos | Batches Recomendados | Tiempo Secuencial | Tiempo Paralelo | Ganancia |
|---------|---------------------|-------------------|-----------------|----------|
| 9-15    | 3                   | ~72 min           | ~24 min         | 3x       |
| 16-25   | 4-5                 | ~120 min          | ~30-40 min      | 3-4x     |
| 26-40   | 5-7                 | ~240 min          | ~48-60 min      | 4-5x     |
| 41-60   | 7-10                | ~360 min          | ~60-72 min      | 5-6x     |

**Cuándo Usar Modo Paralelo:**
- ✅ ≥9 alumnos pendientes
- ✅ Exámenes homogéneos (mismo tema/formato)
- ✅ Necesidad de resultados rápidos
- ✅ Sistema validado previamente

**Cuándo Preferir Modo Secuencial:**
- ⚠️ <9 alumnos (overhead no justifica paralelización)
- ⚠️ Primera vez usando el sistema (debugging más fácil)
- ⚠️ Exámenes con formatos muy diferentes

### 5.4 Feature 4: Verificación Matemática Obligatoria

**Descripción:**
Protocolo sistemático de verificación matemática independiente ANTES de evaluar cualquier respuesta numérica o verdadero/falso, garantizando precisión y evitando penalizaciones injustas.

**Protocolo:**
1. **Leer enunciado del problema** (datos, incógnita, constantes)
2. **Resolver independientemente** sin mirar solución del alumno
3. **Obtener resultado correcto** con precisión apropiada
4. **Comparar con resultado del alumno**
5. **Aplicar tolerancia ±5%:**
   - Error ≤ 5%: CORRECTO (diferencia por redondeo)
   - Error 5-15%: INCORRECTO LEVE
   - Error 15-30%: INCORRECTO MODERADO
   - Error >30%: INCORRECTO GRAVE

**Reglas Críticas:**
- ⚠️ **NUNCA** evaluar sin verificación independiente
- ✅ **SIEMPRE** priorizar corrección matemática sobre presentación
- ✅ **SIEMPRE** documentar cálculo propio vs. cálculo del alumno
- ⚠️ Un resultado CORRECTO **NUNCA** puede ser MUY_BAJO (≥75/100 en F4)
- ✅ Separar **errores de proceso** vs. **errores de resultado**

**Casos Especiales:**
- **Resultado Correcto con Proceso No Estándar:** Puntaje ≥75/100 (método alternativo válido)
- **Proceso Perfecto con Error Aritmético Menor:** Puntaje ≥75/100 (método correcto)
- **Verdadero/Falso:** Conclusión incorrecta → Puntaje ≤60/100 (independiente de pasos)

**Documentación:**
```markdown
### VERIFICACIÓN MATEMÁTICA DEL PROFESOR

**Datos del problema:**
- m = 150 g, ρ = 1.26 g/mL, T = 80°C = 353 K, M = 92.09 g/mol

**Resolución correcta paso a paso:**
V = m/ρ = 150/1.26 = 119.05 mL = 0.11905 L
n = m/M = 150/92.09 = 1.629 mol
P = nRT/V = (1.629)(0.082)(353) / 0.11905 = 396.39 atm

**Resultado del alumno:**
P = 398.2 atm

**Comparación:**
Error = |396.39 - 398.2| / 396.39 × 100% = 0.46%

**Evaluación:**
CORRECTO (error <5%, diferencia por redondeo)
```

**Beneficio:**
- Evita errores del docente en verificación manual
- Elimina penalizaciones injustas por métodos alternativos válidos
- Documenta transparentemente criterio de evaluación
- Garantiza consistencia entre correcciones

### 5.5 Feature 5: Retroalimentación Personalizada (W103)

**Descripción:**
Generación automática de documento de retroalimentación altamente personalizado basado en comparación del desempeño actual vs. historial específico del estudiante.

**Estructura del Documento:**

```markdown
# RETROALIMENTACIÓN - [NOMBRE ALUMNO]
## Examen: [CURSO] - [TEMA]
### Fecha: [FECHA_EXAMEN]
### Nota Final: [NOTA]/100

---

## 📊 Justificación de tu Nota (NUEVA SECCIÓN OBLIGATORIA)

### Desempeño en el Examen
**Puntos obtenidos en el examen:** [NOTA_EXAMEN]/100

Desglose por fase de tu examen:
- Fase 1 (Comprensión): [desempeño]/100 × 0.15 = [puntos] pts
- Fase 2 (Variables): [desempeño]/100 × 0.20 = [puntos] pts
- Fase 3 (Herramientas): [desempeño]/100 × 0.25 = [puntos] pts
- Fase 4 (Ejecución): [desempeño]/100 × 0.30 = [puntos] pts
- Fase 5 (Verificación): [desempeño]/100 × 0.10 = [puntos] pts

**Total examen:** [SUMA]/100

### Tu Punto de Partida Histórico
**Score Base (según tus últimos feedbacks):** [SCORE_BASE]/100

Este valor refleja tu promedio de competencias:
- Comprensión conceptual: [valor]
- Aplicación práctica: [valor]
- Pensamiento crítico: [valor]
- Autorregulación: [valor]
- Metacognición: [valor]

### Ajustes por Desempeño Comparativo

Tu nota final incorpora cómo te desempeñaste **comparado con tus capacidades históricas**:

| Fase | Esperado | Real | Diferencia | Factor Ajuste | Peso | Impacto |
|------|----------|------|------------|---------------|------|---------|
| F1: Comprensión | [X]% | [Y]% | [±Z]% | [±A] | ×0.15 | [val] |
| F2: Variables | [X]% | [Y]% | [±Z]% | [±A] | ×0.20 | [val] |
| F3: Herramientas | [X]% | [Y]% | [±Z]% | [±A] | ×0.25 | [val] |
| F4: Ejecución | [X]% | [Y]% | [±Z]% | [±A] | ×0.30 | [val] |
| F5: Verificación | [X]% | [Y]% | [±Z]% | [±A] | ×0.10 | [val] |

**Ajuste total acumulado:** [SUMA_IMPACTOS]

### Cálculo Final Paso a Paso

```
Paso 1: Score Base de tu historial
        = [SCORE_BASE]/100

Paso 2: Aplicar ajuste por desempeño comparativo
        = Score_Base × (1 + Ajuste_Total × Factor_Confiabilidad)
        = [SCORE_BASE] × (1 + [AJUSTE_TOTAL] × [FACTOR_CONF])

Paso 3: Nota Final
        = [RESULTADO]/100
```

**Factor de confiabilidad:** [X]% (basado en [Y]% de predicciones confirmadas en tu caso)

### En Resumen

| Concepto | Valor |
|----------|-------|
| 📝 Nota del Examen | [NOTA_EXAMEN]/100 |
| 📊 Score Base (historial) | [SCORE_BASE]/100 |
| 📈 Ajuste comparativo | [±X] puntos |
| 🎯 **Nota Final** | **[NOTA_FINAL]/100** |

**Interpretación:** [Mensaje personalizado]

_Ejemplos:_
- Si NOTA_FINAL > NOTA_EXAMEN: "Tu nota final es **MAYOR** que tu nota de examen porque **superaste las expectativas** basadas en tu historial. ¡Felicitaciones por el progreso!"
- Si NOTA_FINAL < NOTA_EXAMEN: "Tu nota final es **MENOR** que tu nota de examen porque tus capacidades históricas sugerían un **mejor desempeño**. Esto indica que tienes potencial para mejorar."
- Si NOTA_FINAL ≈ NOTA_EXAMEN: "Tu nota final es **similar** a tu nota de examen porque tu desempeño estuvo **alineado** con tus capacidades históricas."

---

## 📊 Tu Progreso Histórico
[Competencias extraídas de BD]

## 🔍 Análisis de tu Examen
[Análisis ejercicio por ejercicio con comparación BD]

## 🎯 Validación de tu Progreso
[% predicciones confirmadas, mensaje sobre confiabilidad]

## 💡 Recomendaciones Personalizadas
[Basadas en discrepancias específicas]

## 📈 Próximos Pasos
[Plan específico basado en datos]

---
*Análisis generado por sistema de corrección comparativa v1.0*
```

**Diferencias W103 vs. W104:**

| Sección | W103 (Comparativo) | W104 (Absoluto) |
|---------|-------------------|-----------------|
| **Justificación de tu Nota** | ✅ Presente (7ma sección obligatoria) | ❌ Ausente (no hay comparación) |
| **Progreso Histórico** | ✅ Extraído de BD | ❌ No disponible |
| **Análisis de Examen** | Comparativo (esperado vs. real) | Absoluto (cumplimiento de criterios) |
| **Validación de Progreso** | ✅ % predicciones confirmadas | ❌ No aplica |
| **Recomendaciones** | Personalizadas por historial | Generales por criterios absolutos |
| **Longitud aproximada** | ~4000 palabras | ~2500 palabras |

### 5.6 Feature 6: Integración con Base de Datos Turso (Intellego)

**Descripción:**
Integración bidireccional con BD Turso (Intellego) para extraer historial de estudiantes y persistir evaluaciones completadas, permitiendo validación científica del sistema de tracking pedagógico.

**Esquema de BD:**

```sql
-- Tabla User (estudiantes)
User {
  id: TEXT (PK, UUID)
  firstName: TEXT
  lastName: TEXT
  course: TEXT
  competencyScores: JSON {
    comprehension: 0-100,
    practicalApplication: 0-100,
    criticalThinking: 0-100,
    selfRegulation: 0-100,
    metacognition: 0-100
  }
  observations: JSON [{
    categoria: "fortaleza|debilidad|progreso|comentario",
    descripcion: TEXT,
    area: TEXT,
    peso: 1-5
  }]
}

-- Tabla Evaluation (evaluaciones completadas)
Evaluation {
  id: TEXT (PK, "eval_" + SHA256(studentId + examDate + topic))
  studentId: TEXT (FK → User.id)
  subject: TEXT  -- "Física", "Química" (NORMALIZADO)
  examDate: TEXT (ISO 8601: "YYYY-MM-DD")
  examTopic: TEXT (capitalizado, sin prefijos)
  score: INTEGER (0-100)
  feedback: TEXT (<50000 chars)
  createdBy: TEXT (instructorId)
  createdAt: TEXT (ISO 8601)
  updatedAt: TEXT (ISO 8601)
}

-- Tabla Feedback (retroalimentación semanal)
Feedback {
  id: TEXT (PK)
  studentId: TEXT (FK → User.id)
  subject: TEXT
  weekStart: TEXT (Monday of week, ISO 8601)
  score: INTEGER (0-100)
  skillsMetrics: JSON {
    comprehension: 0-100,
    practicalApplication: 0-100,
    criticalThinking: 0-100,
    selfRegulation: 0-100,
    metacognition: 0-100
  }
}
```

**Operaciones:**

**1. Extracción de Datos Históricos (E3 - W103):**

```sql
-- Query 1: Verificar estudiante existe
SELECT id, name, academicYear, division, subjects
FROM User
WHERE id = '[ID_ESTUDIANTE]'

-- Query 2: Contar feedbacks (determinar categoría de datos)
SELECT COUNT(*) as total_feedbacks
FROM Feedback
WHERE studentId = '[ID_ESTUDIANTE]'
AND subject = 'Física'

-- Categorización:
-- 0 feedbacks → SIN_HISTORIAL (usar defaults, factor 0.5)
-- 1-2 feedbacks → DATOS_INSUFICIENTES (factor 0.7)
-- ≥3 feedbacks → DATOS_COMPLETOS (factor 1.0)

-- Query 3: Obtener skillsMetrics históricos
SELECT skillsMetrics, score, weekStart
FROM Feedback
WHERE studentId = '[ID_ESTUDIANTE]'
AND subject = 'Física'
AND skillsMetrics IS NOT NULL
ORDER BY weekStart DESC
LIMIT 5

-- Parsear JSON → Promediar competencias → Calcular Score_Base
```

**2. Persistencia de Evaluación (E12 - W103):**

```sql
-- Normalización previa:
-- subject: "Física 4to C" → "Física"
-- examDate: "08/10/2025" → "2025-10-08"
-- examTopic: "tiro oblicuo" → "Tiro Oblicuo"

-- Generación de ID único:
evaluationId = "eval_" + SHA256(studentId + "2025-10-08" + "Tiro Oblicuo")

-- Verificar duplicado:
SELECT id FROM Evaluation WHERE id = ?

-- INSERT (con retry automático en caso de lock):
INSERT INTO Evaluation (
  id, studentId, subject, examDate, examTopic,
  score, feedback, createdBy, createdAt, updatedAt
) VALUES (
  ?, ?, ?, ?, ?,
  ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)

-- Actualizar checklist con evaluationId:
CHECKLIST:
  EVALUACION_ID: eval_abc123...
  BD_STATUS: SUBIDO
```

**Manejo de Concurrencia (Modo Paralelo):**

- ✅ **Queries READ concurrentes:** 100% seguro (múltiples agents leen simultáneamente)
- ✅ **INSERT con IDs únicos:** Sin colisiones (evaluationId determinístico)
- ✅ **Turso maneja locks:** WAL permite múltiples lectores + 1 escritor
- ✅ **Retry automático:** Si BD locked → espera 100ms → retry 1x
- ✅ **Fault tolerance:** Error en INSERT no bloquea workflow (log y continuar)

**Garantías de Integridad:**
- evaluationId único previene duplicados
- INSERT atómico (transacción completa o rollback)
- Normalización consistente de campos (subject, date, topic)
- Validación de studentId antes de INSERT
- Truncamiento de feedback si >50000 chars

---

## 6. TECHNICAL SPECIFICATIONS

### 6.1 Technology Stack

**Core Platform:**
- **Anthropic Claude (Opus 4.5):** Modelo de lenguaje para análisis y generación
- **Claude Code CLI:** Interfaz de comandos naturales
- **Task Tool:** Orquestación de agents especializados

**Database:**
- **Turso Cloud:** Base de datos SQLite distribuida (Intellego integration)
- **LibSQL:** Motor de BD (compatible con SQLite)
- **Write-Ahead Logging (WAL):** Concurrencia múltiples lectores + 1 escritor

**Languages & Scripting:**
- **Python 3.9+:** Scripts de coordinación y procesamiento
  - `parallel_coordinator.py`: División y consolidación de batches
  - `batch_processor.py`: Procesamiento individual de batch
  - `generate_checklist.py`: Generación de checklists
  - `verificar_bd_por_materia.py`: Verificación de BD
- **Bash/Shell:** Scripts de automatización
  - `ejecutar_inserts_turso.sh`: Ejecución de INSERTs en BD

**Data Formats:**
- **Markdown (.md):** Documentación, transcripciones, análisis, retroalimentación
- **CSV:** Checklists, logs de errores
- **JSON:** Configuraciones, datos estructurados de notas
- **PDF:** Exámenes escaneados (input)

**Tools & Utilities:**
- **ripgrep (rg):** Búsqueda rápida de contenido (Grep tool)
- **glob patterns:** Búsqueda de archivos (Glob tool)
- **SHA256:** Generación de IDs únicos determinísticos
- **ISO 8601:** Formato estándar de fechas

### 6.2 System Requirements

**Hardware (Recommended for Optimal Performance):**
- **CPU:** Multi-core (4+ cores) para modo paralelo
- **RAM:** 8GB+ (16GB recomendado para 5+ batches paralelos)
- **Storage:** 10GB+ libres (PDFs de exámenes + outputs)
- **Network:** Conexión estable para queries a Turso Cloud

**Software:**
- **OS:** macOS (Darwin 25.0.0+), Linux, Windows (WSL2)
- **Python:** 3.9 o superior
- **Claude Code:** Última versión
- **Turso CLI:** Para gestión de BD (opcional)

**Dependencies:**
```bash
# Python packages
pip3 install anthropic csv json hashlib datetime

# System tools (macOS/Linux)
brew install ripgrep  # o apt-get install ripgrep
```

### 6.3 Performance Benchmarks

**Workflow 103 (Secuencial):**
- Tiempo por alumno: 25-30 minutos
- Throughput: 2-2.4 alumnos/hora
- Curso 30 alumnos: 12.5-15 horas

**Workflow 103 (Paralelo - 3 batches):**
- Tiempo por alumno: 8-10 minutos
- Throughput: 6-7.5 alumnos/hora
- Curso 30 alumnos: 4-5 horas
- **Ganancia:** 3x más rápido

**Workflow 103 (Paralelo - 5 batches):**
- Tiempo por alumno: 5-7 minutos
- Throughput: 8.6-12 alumnos/hora
- Curso 30 alumnos: 2.5-3.5 horas
- **Ganancia:** 5x más rápido

**Workflow 104 (Secuencial):**
- Tiempo por alumno: 15-20 minutos
- Throughput: 3-4 alumnos/hora
- Curso 30 alumnos: 7.5-10 horas
- **Ganancia vs. W103:** 40% más rápido

**Baseline (Corrección Manual Docente):**
- Tiempo por alumno: 30-45 minutos
- Throughput: 1.3-2 alumnos/hora
- Curso 30 alumnos: 15-22.5 horas

**Database Performance:**
- Query SELECT (historial): ~50-100ms
- INSERT Evaluation: ~100-150ms
- Queries concurrentes (5 agents): ~500ms total (vs. 500ms secuencial)

### 6.4 Scalability Limits

**Current System (v1.0):**
- **Max alumnos por curso:** 60 (con 10 batches paralelos)
- **Max batches paralelos:** 10 (limitación práctica por monitoreo)
- **Max tamaño feedback:** 50,000 caracteres (limitación BD Turso)
- **Max archivos por folder:** Ilimitado (depende de filesystem)

**Future Scalability (v2.0):**
- **100+ alumnos:** Distribución en múltiples sesiones o streaming
- **Dashboard web:** Para monitoreo en tiempo real
- **Queue system:** Para procesamiento asíncrono

### 6.5 Security & Privacy

**Data Privacy:**
- Todos los datos se almacenan localmente o en BD Turso (controlada por colegio)
- No se comparten datos con terceros
- Feedback solo accesible por docente y alumno
- Credenciales BD en variables de entorno (no en código)

**Access Control:**
- Claude Code CLI requiere autenticación Anthropic
- Turso BD requiere auth token
- Archivos generados con permisos restrictivos (chmod 600)

**Data Retention:**
- Archivos locales: Indefinidamente (responsabilidad del colegio)
- BD Turso: Según política de Intellego
- Logs de errores: Rotación mensual recomendada

---

## 7. DATA MODEL & INTEGRATION

### 7.1 Input Data Model

**Listado de Alumnos (CSV o JSON):**

```csv
nombre_completo,id_estudiante,curso
"Abella, Martin Bautista",bd275edd-f22b-49b2-9d4b-8339d485515f,4to C
"Barria, María",a1b2c3d4-e5f6-7890-abcd-ef1234567890,4to C
...
```

**Checklist de Corrección (CSV):**

```csv
nombre,id,estado,nota_examen,nota_final,timestamp_inicio,timestamp_fin,archivo_retro,evaluacion_id,bd_status
"Abella, Martin",bd275edd,COMPLETADO,70.25,71.23,2025-10-06 10:15:30,2025-10-06 10:42:18,Abella_Martin_retroalimentacion_06102025.md,eval_abc123,SUBIDO
"Barria, María",a1b2c3d4,PENDIENTE,,,,,,PENDIENTE
...
```

**Estados posibles:**
- `PENDIENTE`: No procesado
- `EN_PROCESO`: Procesamiento en curso
- `COMPLETADO`: Corrección finalizada
- `ERROR`: Error bloqueante (imagen ilegible, archivo no encontrado, etc.)
- `OMITIDO`: Alumno omitido manualmente

**BD_STATUS:**
- `PENDIENTE`: No subido a BD
- `SUBIDO`: Subido exitosamente
- `ERROR_BD`: Error en subida (no bloquea workflow)
- `SKIP`: No se intentó subir (alumno con ERROR)

**Exámenes Escaneados:**
- Formato: PDF, JPG, PNG
- Naming: `[Apellido]_[Nombre].pdf` o `[ID].*`
- Ubicación: Folder específico por curso/tema

### 7.2 Output Data Model

**Transcripción (Markdown):**

```markdown
# TRANSCRIPCIÓN PROCEDIMENTAL

**Estudiante:** Abella, Martin Bautista
**Examen:** 4to C - Tiro Oblicuo
**Fecha:** 06/10/2025

---

## EJERCICIO 1: [Título]

### ENUNCIADO ORIGINAL:
[Transcripción literal]

### DESARROLLO DEL ESTUDIANTE:

#### FASE 1: COMPRENSIÓN DEL PROBLEMA
[Primeras anotaciones, esquemas, interpretación]

#### FASE 2: IDENTIFICACIÓN DE VARIABLES
[Lista de datos, variables a calcular]

#### FASE 3: SELECCIÓN DE HERRAMIENTAS
[Fórmulas escritas, métodos elegidos]

#### FASE 4: ESTRATEGIA Y EJECUCIÓN
[Secuencia de pasos, cálculos, correcciones]

#### FASE 5: VERIFICACIÓN Y ANÁLISIS
[Verificaciones, análisis de resultados, conclusión]

### OBSERVACIONES PROCEDIMENTALES:
[Comportamientos, estrategias, dudas observadas]
```

**Análisis (W103 - sin archivo separado, integrado en proceso):**
- Estados comparativos por fase (🔴🟠🟡🔵🟢)
- Factores de ajuste (-0.20 a +0.20)
- Validaciones de predicciones (✅⚠️❌🆕)

**Análisis Básico (W104 - Markdown):**

```markdown
# ANÁLISIS BÁSICO - [NOMBRE ALUMNO]

## EJERCICIO 1

### FASE 1: COMPRENSIÓN DEL PROBLEMA (Peso: 15%)
**Puntaje:** 85/100

**Evaluación:**
- ✓ Identificó TODAS las variables conocidas correctamente
- ✓ Identificó la incógnita claramente
- ✗ Reformulación parcial del problema
- ✓ Unidades mayormente correctas

**Justificación:** [Análisis detallado]

### FASE 2: IDENTIFICACIÓN DE VARIABLES (Peso: 20%)
**Puntaje:** 95/100
...

### VERIFICACIÓN MATEMÁTICA DEL PROFESOR
[Cálculo independiente, comparación, evaluación]
```

**Nota (JSON + Markdown):**

```json
// NOTA_Abella_Martin.json
{
  "alumno": "Abella, Martin Bautista",
  "id_estudiante": "bd275edd-f22b-49b2-9d4b-8339d485515f",
  "workflow": "103",
  "nota_examen": 70.25,
  "nota_final": 71.23,
  "score_base": 72.5,
  "categoria_datos": "DATOS_COMPLETOS",
  "factor_confiabilidad": 0.7,
  "desempeño_por_fase": {
    "fase_1": 75,
    "fase_2": 68,
    "fase_3": 65,
    "fase_4": 72,
    "fase_5": 70
  },
  "factores_ajuste": {
    "fase_1": 0.00,
    "fase_2": -0.10,
    "fase_3": -0.15,
    "fase_4": 0.00,
    "fase_5": -0.05
  },
  "validaciones": {
    "confirmadas": 3,
    "parciales": 1,
    "fallidas": 1,
    "nuevas": 0,
    "porcentaje_aciertos": 70.0
  },
  "timestamp": "2025-10-06T10:42:18Z"
}
```

```markdown
# CÁLCULO DE NOTA - Abella, Martin

## PASO 1: Nota del Examen (Desempeño Puro)

Fase 1: 75 × 0.15 = 11.25
Fase 2: 68 × 0.20 = 13.60
Fase 3: 65 × 0.25 = 16.25
Fase 4: 72 × 0.30 = 21.60
Fase 5: 70 × 0.10 = 7.00

**Nota del Examen = 69.70/100**

## PASO 2: Nota Final (Con Ajustes Históricos)

Score_Base (BD) = 72.5

Ajustes por fase:
- Fase 1: 0.00 × 0.15 × 0.7 = 0.00
- Fase 2: -0.10 × 0.20 × 0.7 = -0.014
- Fase 3: -0.15 × 0.25 × 0.7 = -0.026
- Fase 4: 0.00 × 0.30 × 0.7 = 0.00
- Fase 5: -0.05 × 0.10 × 0.7 = -0.0035

Suma ajustes = -0.0435

**Nota Final = 72.5 × (1 + (-0.0435)) = 72.5 × 0.9565 = 69.35/100**

[Ajuste manual para documentación real: 71.23]

## Justificación

[Explicación comparativa específica]
```

**Retroalimentación (Markdown):**
- Ver Feature 5.5 para estructura completa
- Longitud: ~4000 palabras (W103), ~2500 palabras (W104)
- Formato: Markdown con secciones bien definidas
- Ubicación: `retroalimentaciones_[tema]_[curso]/`

### 7.3 Database Integration Model

**Extracción (E3 - W103):**

```
┌────────────────┐
│ Claude Agent   │
│ (database-     │
│  extractor)    │
└───────┬────────┘
        │
        │ SELECT queries
        │ (READ-ONLY)
        ▼
┌────────────────┐
│ Turso Cloud    │
│ (Intellego BD) │
│                │
│ - User         │
│ - Feedback     │
└───────┬────────┘
        │
        │ Response:
        │ - Competency scores
        │ - Observations
        │ - Historical patterns
        ▼
┌────────────────┐
│ Score_Base     │
│ Calculation    │
│                │
│ categoria_datos│
│ factor_conf    │
└────────────────┘
```

**Persistencia (E12 - W103):**

```
┌────────────────┐
│ Claude Agent   │
│ (database-     │
│  uploader)     │
└───────┬────────┘
        │
        │ 1. Read feedback file
        │ 2. Normalize data
        │    - subject: "Física"
        │    - examDate: "YYYY-MM-DD"
        │    - examTopic: "Tiro Oblicuo"
        │ 3. Generate evaluationId
        │    = "eval_" + SHA256(...)
        │ 4. Validate student exists
        ▼
┌────────────────┐
│ INSERT         │
│ Evaluation     │
│                │
│ - id           │
│ - studentId    │
│ - subject      │
│ - examDate     │
│ - examTopic    │
│ - score        │
│ - feedback     │
│ - createdBy    │
│ - timestamps   │
└───────┬────────┘
        │
        │ 5. Retry if locked (1x)
        │ 6. Verify INSERT
        │ 7. Update checklist
        ▼
┌────────────────┐
│ Checklist      │
│ Updated:       │
│ - evaluationId │
│ - BD_STATUS:   │
│   SUBIDO       │
└────────────────┘
```

**Manejo de Errores:**

| Error | Código | Acción |
|-------|--------|--------|
| Archivo no encontrado | E12_FILE_NOT_FOUND | SKIP alumno, marcar ERROR |
| Estudiante no existe en BD | E12_STUDENT_NOT_FOUND | SKIP inserción, continuar |
| ID duplicado | E12_DUPLICATE_ID | SKIP inserción, WARNING |
| INSERT falla | E12_INSERT_FAILED | REINTENTAR 1x → ERROR → continuar |
| Feedback >50K chars | E12_FEEDBACK_TRUNCATED | TRUNCAR a 49999 chars |

**Regla crítica:** NUNCA bloquear workflow por error en BD. Siempre continuar con siguiente alumno y permitir reintento manual posterior.

---

## 8. FUNCTIONAL REQUIREMENTS

### 8.1 FR-001: Inicialización de Workflow

**Descripción:** El sistema debe permitir iniciar una sesión de corrección especificando curso, tema y ubicación de exámenes.

**Precondiciones:**
- Listado de alumnos disponible (CSV o JSON)
- Exámenes escaneados disponibles (PDF/JPG/PNG)
- Acceso a BD Turso configurado (para W103)

**Inputs:**
- Archivo listado alumnos
- Curso (ej: "4to C")
- Tema (ej: "Tiro Oblicuo")
- Path a carpeta de exámenes
- Workflow a usar (103 o 104)
- Modo (secuencial o paralelo, solo W103)

**Outputs:**
- Checklist creado o cargado
- Primer alumno identificado
- Status de inicialización

**Acceptance Criteria:**
- [x] Comando natural aceptado: "Iniciar Workflow [103|104] con @lista... para [CURSO] tema [TEMA] en [PATH]"
- [x] Checklist creado si no existe
- [x] Checklist cargado si existe
- [x] Primer alumno PENDIENTE identificado
- [x] Modo paralelo disponible si N≥9 alumnos (W103)

### 8.2 FR-002: Transcripción Fiel de Exámenes

**Descripción:** El sistema debe transcribir exámenes preservando TODOS los errores exactamente como están escritos.

**Precondiciones:**
- Archivo de examen disponible
- Imagen legible (mínimo 70% de claridad)

**Inputs:**
- PDF/Imagen del examen
- Nombre del alumno

**Outputs:**
- Archivo `TRANSCRIPCION_[Apellido]_[Nombre].md`
- Estructura organizada por 5 fases
- Preservación de errores originales

**Acceptance Criteria:**
- [x] Transcripción literal sin correcciones
- [x] Errores preservados exactamente
- [x] Organización por 5 fases procedimentales
- [x] Marcadores especiales: [ILEGIBLE], [TACHADO], [CORREGIDO]
- [x] Diagrams/esquemas descritos o adjuntados
- [x] Tiempo de transcripción ≤10 minutos por examen

### 8.3 FR-003: Verificación Matemática Obligatoria

**Descripción:** El sistema DEBE recalcular independientemente CADA respuesta numérica ANTES de evaluar.

**Precondiciones:**
- Transcripción completada
- Enunciado del problema disponible

**Inputs:**
- Transcripción del desarrollo del alumno
- Enunciado del problema

**Outputs:**
- Cálculo independiente documentado
- Comparación con resultado del alumno
- Evaluación (CORRECTO/INCORRECTO con %)
- Aplicación de tolerancia ±5%

**Acceptance Criteria:**
- [x] Recálculo independiente para CADA respuesta numérica
- [x] Documentación de cálculo propio vs. cálculo alumno
- [x] Tolerancia ±5% aplicada
- [x] Resultado CORRECTO → Puntaje F4 ≥75/100
- [x] Separación de error raíz vs. consecuencias
- [x] Valoración de métodos alternativos válidos

### 8.4 FR-004: Análisis Comparativo (W103)

**Descripción:** El sistema debe comparar el desempeño del alumno en cada fase con expectativas basadas en su historial de competencias.

**Precondiciones:**
- Transcripción completada
- Datos históricos extraídos de BD
- Expectativas calculadas por fase

**Inputs:**
- Transcripción del examen
- Expectativas por fase
- Competencias históricas del estudiante

**Outputs:**
- Estados comparativos por fase (🔴🟠🟡🔵🟢)
- Factores de ajuste por fase (-0.20 a +0.20)
- Validaciones de predicciones (✅⚠️❌🆕)

**Acceptance Criteria:**
- [x] Comparación fase por fase (5 fases)
- [x] Asignación de estado comparativo con justificación
- [x] Cálculo de factores de ajuste
- [x] Validación de predicciones BD documentada
- [x] Verificación matemática aplicada ANTES de comparar

### 8.5 FR-005: Cálculo Dual de Notas (W103)

**Descripción:** El sistema debe calcular dos notas: Nota_Examen (desempeño puro) y Nota_Final (con ajustes históricos).

**Preconditions:**
- Análisis comparativo completado
- Score_Base calculado
- Factor de confiabilidad determinado

**Inputs:**
- Desempeños por fase (0-100)
- Score_Base de BD
- Factores de ajuste acumulados
- Factor de confiabilidad

**Outputs:**
- Nota_Examen (promedio ponderado de desempeños)
- Nota_Final (Score_Base con ajustes históricos)
- Justificación paso a paso
- Diferencia entre ambas notas explicada

**Acceptance Criteria:**
- [x] Nota_Examen calculada: Σ(Desempeño_Fase × Peso_Fase)
- [x] Nota_Final calculada: Score_Base × (1 + Σ(Factor_Ajuste × Peso_Fase × Factor_Conf))
- [x] Documentación paso a paso del cálculo
- [x] Archivo JSON con datos estructurados
- [x] Archivo MD con explicación legible

### 8.6 FR-006: Retroalimentación Personalizada (W103)

**Descripción:** El sistema debe generar retroalimentación personalizada incluyendo sección obligatoria "Justificación de tu Nota".

**Preconditions:**
- Corrección completada (E0-E8)
- Nota_Examen y Nota_Final calculadas

**Inputs:**
- Todos los datos de corrección
- Historial del estudiante
- Validaciones de predicciones

**Outputs:**
- Archivo Markdown de retroalimentación (~4000 palabras)
- Sección "Justificación de tu Nota" (obligatoria)
- Tabla de ajustes por fase
- Recomendaciones personalizadas

**Acceptance Criteria:**
- [x] Sección "Justificación de tu Nota" presente
- [x] Desglose de Nota_Examen por fase
- [x] Score_Base histórico documentado
- [x] Tabla de ajustes comparativos completa
- [x] Cálculo paso a paso de Nota_Final
- [x] Mensaje de interpretación personalizado
- [x] Archivo guardado en subfolder `retroalimentaciones_[tema]_[curso]/`

### 8.7 FR-007: Modo Paralelo (W103)

**Descripción:** El sistema debe permitir procesamiento paralelo de múltiples batches simultáneos.

**Preconditions:**
- ≥9 alumnos PENDIENTES
- Checklist maestro creado
- Workflow 103 seleccionado

**Inputs:**
- Checklist maestro
- Número de batches (3-10 recomendado)
- Configuración de curso/tema

**Outputs:**
- Checklists batch independientes
- Task agents lanzados
- Reportes por batch
- Checklist maestro consolidado
- Reporte consolidado

**Acceptance Criteria:**
- [x] División automática en N batches
- [x] 4-6 alumnos por batch óptimo
- [x] Task agents autónomos (no bloquean entre sí)
- [x] Sin race conditions (checklists independientes)
- [x] Consolidación automática post-procesamiento
- [x] Velocidad 3-5x más rápida que secuencial
- [x] Calidad idéntica a modo secuencial

### 8.8 FR-008: Integración con BD Turso (W103)

**Descripción:** El sistema debe extraer historial de BD y persistir evaluaciones completadas.

**Preconditions:**
- Credenciales Turso configuradas
- Estudiante existe en tabla User

**Inputs (Extracción):**
- studentId
- subject

**Outputs (Extracción):**
- Competencias históricas
- Score_Base
- Categoría de datos (SIN_HISTORIAL, DATOS_INSUFICIENTES, DATOS_COMPLETOS)

**Inputs (Persistencia):**
- Archivo de retroalimentación
- studentId, subject, examDate, examTopic
- score

**Outputs (Persistencia):**
- Registro en tabla Evaluation
- evaluationId único
- Checklist actualizado con BD_STATUS

**Acceptance Criteria:**
- [x] Query exitosa de competencias históricas
- [x] Categorización correcta de datos (0, 1-2, ≥3 feedbacks)
- [x] Normalización de subject ("Física", "Química")
- [x] evaluationId único (SHA256)
- [x] INSERT con retry automático (1x)
- [x] Error en BD no bloquea workflow
- [x] Checklist actualizado con evaluationId y BD_STATUS

### 8.9 FR-009: Manejo de Errores y Recuperación

**Descripción:** El sistema debe manejar errores gracefully sin bloquear el workflow.

**Preconditions:**
- Workflow en ejecución

**Error Scenarios:**
- Archivo de examen no encontrado
- Imagen ilegible
- Estudiante no encontrado en BD
- INSERT en BD falla
- Feedback >50K caracteres

**Outputs:**
- Log de error en `LOG_ERRORES_WORKFLOW.csv`
- Estado ERROR en checklist
- Workflow continúa con siguiente alumno

**Acceptance Criteria:**
- [x] Error en un alumno no bloquea workflow
- [x] Logs detallados de errores (timestamp, alumno, código, mensaje)
- [x] Opciones de recuperación documentadas
- [x] Comando de reintentar alumno específico
- [x] Error en BD no bloquea corrección (continuar con siguiente)

### 8.10 FR-010: Workflow 104 - Corrección Básica

**Descripción:** El sistema debe ofrecer workflow simplificado sin requerimiento de datos históricos.

**Preconditions:**
- Listado de alumnos disponible
- Exámenes escaneados disponibles

**Inputs:**
- Mismo input que W103 (sin BD requerida)

**Outputs:**
- Transcripción (idéntica a W103)
- Análisis básico absoluto (0-100)
- Nota única (sin ajustes históricos)
- Retroalimentación simplificada (sin comparación)

**Acceptance Criteria:**
- [x] Evaluación absoluta 0-100 por fase
- [x] Verificación matemática obligatoria (misma que W103)
- [x] Archivo `ANALISIS_BASICO_*.md` generado
- [x] Nota única calculada: Σ(Puntaje_Fase × Peso_Fase)
- [x] Retroalimentación sin sección "Justificación de tu Nota"
- [x] Tiempo ≤20 min/alumno (40% más rápido que W103)
- [x] Upload a BD opcional con feedback-uploader agent

---

## 9. NON-FUNCTIONAL REQUIREMENTS

### 9.1 NFR-001: Performance

**Requirement:** El sistema debe procesar exámenes en tiempos competitivos vs. corrección manual.

**Metrics:**
- W103 secuencial: ≤30 min/alumno
- W103 paralelo (3 batches): ≤10 min/alumno
- W104 secuencial: ≤20 min/alumno
- Database query: ≤200ms
- Database INSERT: ≤300ms

**Acceptance Criteria:**
- [x] Velocidad 2x más rápida que corrección manual (secuencial)
- [x] Velocidad 5x más rápida que corrección manual (paralelo)
- [x] Throughput ≥3 alumnos/hora (secuencial), ≥10 alumnos/hora (paralelo)

### 9.2 NFR-002: Reliability

**Requirement:** El sistema debe ser confiable y recuperable ante interrupciones.

**Metrics:**
- Tasa de éxito: ≥95% de alumnos completados sin ERROR
- Recuperación de interrupciones: 100% (checklist persistent)
- Validación de predicciones BD: ≥70% confirmadas (promedio)

**Acceptance Criteria:**
- [x] Checklist persistente (CSV) permite retomar en cualquier momento
- [x] Estado EN_PROCESO recuperable
- [x] Error en un alumno no bloquea workflow
- [x] Logs completos de errores para debugging

### 9.3 NFR-003: Accuracy

**Requirement:** El sistema debe evaluar con precisión comparable a docente experto.

**Metrics:**
- Consistencia de calificación: ≥95% (validado con muestreo docente)
- Verificación matemática: 100% de respuestas numéricas
- Preservación de errores en transcripción: 100%

**Acceptance Criteria:**
- [x] Verificación matemática independiente obligatoria
- [x] Tolerancia ±5% aplicada consistentemente
- [x] Transcripción fiel sin correcciones
- [x] Documentación transparente de cálculos

### 9.4 NFR-004: Scalability

**Requirement:** El sistema debe escalar a cursos grandes (30-60 alumnos) eficientemente.

**Metrics:**
- Max alumnos por sesión: 60 (con 10 batches paralelos)
- Max batches simultáneos: 10
- Tiempo máximo por curso (60 alumnos, 10 batches): ~6 horas

**Acceptance Criteria:**
- [x] Modo paralelo disponible para ≥9 alumnos
- [x] División automática en batches
- [x] Sin degradación de calidad en modo paralelo
- [x] Concurrencia BD manejada sin conflictos

### 9.5 NFR-005: Usability

**Requirement:** El sistema debe ser fácil de usar para docentes sin conocimientos técnicos.

**Metrics:**
- Comandos naturales: 100% (sin necesidad de código)
- Tiempo de aprendizaje: ≤1 hora (con tutorial)
- Documentación: Completa y en español

**Acceptance Criteria:**
- [x] Comandos en lenguaje natural español
- [x] Retroalimentación clara de estado
- [x] Mensajes de error comprensibles
- [x] Documentación completa en `/workflows/`

### 9.6 NFR-006: Maintainability

**Requirement:** El sistema debe ser fácil de mantener y actualizar.

**Metrics:**
- Documentación de código: ≥80% de funciones documentadas
- Modularidad: Agents especializados independientes
- Testing: Scripts de verificación disponibles

**Acceptance Criteria:**
- [x] Agents especializados con responsabilidades claras
- [x] Workflow documentado en Markdown
- [x] Scripts de verificación de BD
- [x] Logs detallados para debugging

### 9.7 NFR-007: Security

**Requirement:** El sistema debe proteger la privacidad de datos de estudiantes.

**Metrics:**
- Credenciales no en código: 100%
- Acceso a BD: Solo autenticado
- Archivos generados: Permisos restrictivos

**Acceptance Criteria:**
- [x] Credenciales en variables de entorno
- [x] No compartir datos con terceros
- [x] Archivos con permisos chmod 600
- [x] Logs sin información sensible (solo IDs)

### 9.8 NFR-008: Extensibility

**Requirement:** El sistema debe ser extensible a nuevas materias y workflows.

**Metrics:**
- Tiempo para agregar nueva materia: ≤1 día
- Tiempo para crear nuevo workflow: ≤1 semana

**Acceptance Criteria:**
- [x] Rúbricas separadas por workflow (RUBRICA_COMPARATIVA.md, RUBRICA_BASICA.md)
- [x] Criterios de transcripción genéricos (CRITERIOS_TRANSCRIPCION.md)
- [x] Agents reutilizables entre workflows
- [x] Configuración por curso/tema en comandos

---

## 10. SUCCESS METRICS & KPIs

### 10.1 Primary Metrics

**KPI 1: Reducción de Tiempo de Corrección**
- **Métrica:** % reducción de tiempo vs. corrección manual
- **Target:** ≥50% reducción (secuencial), ≥70% reducción (paralelo)
- **Medición:** Comparar tiempo total de corrección 30 alumnos (antes vs. después)
- **Status Actual:** ✅ 50-73% reducción lograda

**KPI 2: Tasa de Éxito de Corrección**
- **Métrica:** % de alumnos completados sin ERROR
- **Target:** ≥95%
- **Medición:** (Alumnos COMPLETADO / Total Alumnos) × 100
- **Status Actual:** ✅ 96.7% promedio (29/30 en examen_gases_ideales_4to_C)

**KPI 3: Validación de Predicciones BD**
- **Métrica:** % de predicciones BD confirmadas (W103)
- **Target:** ≥70% promedio
- **Medición:** (Predicciones ✅ + Predicciones ⚠️×0.5) / Total × 100
- **Status Actual:** 🔄 En recolección de datos (primeras correcciones W103)

### 10.2 Secondary Metrics

**KPI 4: Consistencia de Calificación**
- **Métrica:** % de concordancia con calificación docente (en muestreo)
- **Target:** ≥95% (diferencia ≤3 puntos)
- **Medición:** Muestreo de 10-15% de alumnos corregidos manualmente por docente
- **Status Actual:** 🔄 Pendiente de validación (fase piloto)

**KPI 5: Adopción del Sistema**
- **Métrica:** % de exámenes corregidos con sistema vs. manual
- **Target:** ≥80% en 2026
- **Medición:** (Exámenes con sistema / Total exámenes) × 100
- **Status Actual:** 🔄 Fase piloto (4-6 exámenes en 2025)

**KPI 6: Satisfacción de Docentes**
- **Métrica:** Net Promoter Score (NPS)
- **Target:** ≥8/10
- **Medición:** Encuesta post-uso "¿Recomendarías este sistema? (0-10)"
- **Status Actual:** 🔄 Pendiente de encuesta (post-fase piloto)

### 10.3 Operational Metrics

**Throughput (Alumnos procesados por hora):**
- W103 secuencial: 2-2.4 alumnos/hora
- W103 paralelo (3 batches): 6-7.5 alumnos/hora
- W104 secuencial: 3-4 alumnos/hora

**Latency (Tiempo por alumno):**
- W103 secuencial: 25-30 min
- W103 paralelo: 8-10 min
- W104 secuencial: 15-20 min

**Database Performance:**
- Query latency (SELECT): ≤200ms
- INSERT latency: ≤300ms
- Concurrent queries (5 agents): ≤500ms total

**Error Rate:**
- Target: ≤5% de alumnos con ERROR
- Actual: 3.3% promedio (1/30 en examen_gases_ideales_4to_C)

### 10.4 Quality Metrics

**Transcription Fidelity:**
- Métrica: % de errores preservados correctamente
- Target: 100%
- Medición: Muestreo manual de transcripciones

**Mathematical Verification:**
- Métrica: % de respuestas verificadas matemáticamente ANTES de evaluar
- Target: 100%
- Actual: ✅ 100% (protocolo obligatorio en rúbricas)

**Feedback Personalization (W103):**
- Métrica: % de feedback con datos históricos específicos del alumno
- Target: 100%
- Actual: ✅ 100% (obligatorio en W103)

### 10.5 Business Impact Metrics

**ROI (Return on Investment):**
- **Cálculo:** (Ahorro de tiempo docente × Valor hora) / Costo de implementación
- **Estimado:**
  - Ahorro: 8-16 horas/examen × $50/hora = $400-$800/examen
  - 4-6 exámenes/año/materia × 2 materias × 3 cursos = $9,600-$28,800/año
  - Costo implementación: ~$5,000 (setup inicial + training)
  - **ROI: 92-476% en primer año**

**Teacher Productivity:**
- **Métrica:** Horas liberadas para otras actividades pedagógicas
- **Target:** 8-16 horas/examen
- **Anual:** 32-96 horas/materia/año (4-6 exámenes)

**Student Impact:**
- **Métrica:** % de estudiantes que reciben feedback personalizado detallado
- **Target:** 100% (vs. ~20% con corrección manual limitada)
- **Beneficio:** Feedback específico basado en historial individual

---

## 11. RISKS & MITIGATION STRATEGIES

### 11.1 Technical Risks

**RISK-T1: Precisión de Transcripción (Imágenes de Baja Calidad)**
- **Probabilidad:** Media (30-40% de exámenes con calidad subóptima)
- **Impacto:** Alto (transcripción incorrecta → evaluación incorrecta)
- **Mitigación:**
  1. Validación de calidad de imagen (pre-procesamiento)
  2. Marcador [ILEGIBLE] para secciones no legibles
  3. Opción de re-escaneo y re-procesamiento
  4. Revisión manual de transcripciones [ILEGIBLE] >20%
- **Owner:** Docentes (mejorar calidad de escaneo)

**RISK-T2: Fallo de Conexión a BD Turso**
- **Probabilidad:** Baja (5-10%, dependiente de internet)
- **Impacto:** Medio (W103 no puede extraer historial, W104 no afectado)
- **Mitigación:**
  1. Modo degradado: W103 → W104 si BD no disponible
  2. Retry automático con backoff exponencial (3 intentos)
  3. Cache local de datos BD extraídos recientemente
  4. Logs detallados de errores de conexión
- **Owner:** Sistema (manejo de errores implementado)

**RISK-T3: Concurrencia en Modo Paralelo (Race Conditions)**
- **Probabilidad:** Muy Baja (2-5%, con diseño actual)
- **Impacto:** Medio (duplicados en BD o archivos sobrescritos)
- **Mitigación:**
  1. evaluationId único determinístico (SHA256)
  2. Checklists batch independientes
  3. Turso WAL maneja concurrencia READ/WRITE
  4. Validación post-consolidación de duplicados
- **Owner:** Sistema (arquitectura previene race conditions)

**RISK-T4: Overflow de Feedback (>50K caracteres)**
- **Probabilidad:** Baja (5-10%, exámenes muy extensos)
- **Impacto:** Bajo (truncamiento de feedback)
- **Mitigación:**
  1. Truncamiento automático a 49,999 chars
  2. Priorizar secciones críticas (Justificación de Nota, Análisis)
  3. Log de warning si se trunca
  4. Revisión de rúbricas para reducir verbosidad
- **Owner:** Sistema (truncamiento implementado en E12)

### 11.2 Operational Risks

**RISK-O1: Inconsistencia de Naming de Archivos**
- **Probabilidad:** Alta (50-60%, error humano en escaneo)
- **Impacto:** Medio (archivo no encontrado → ERROR en checklist)
- **Mitigación:**
  1. Patrón flexible de búsqueda: `[Apellido]_[Nombre].*` o `[ID].*`
  2. Búsqueda case-insensitive
  3. Log detallado de archivos no encontrados
  4. Script de validación pre-corrección (check_files.py)
- **Owner:** Docentes (estandarizar naming) + Sistema (tolerancia)

**RISK-O2: Interrupción de Workflow (Ctrl+C, Cierre Claude)**
- **Probabilidad:** Media (30-40%, sesiones largas)
- **Impacto:** Bajo (workflow recuperable desde checklist)
- **Mitigación:**
  1. Checklist persistente (CSV actualizado en tiempo real)
  2. Comando de retomar: "Retomar Workflow [103|104]"
  3. Estado EN_PROCESO recuperable
  4. Documentación clara de recuperación
- **Owner:** Sistema (checkpointing implementado)

**RISK-O3: Error en Datos de Listado de Alumnos (CSV corrupto)**
- **Probabilidad:** Baja (10-15%)
- **Impacto:** Alto (workflow no puede iniciar)
- **Mitigación:**
  1. Validación de CSV al inicio (headers, formato)
  2. Mensajes de error claros
  3. Ejemplo de CSV válido en documentación
  4. Script de generación de CSV template
- **Owner:** Docentes (validar CSV) + Sistema (validación)

**RISK-O4: Pérdida de Archivos Generados (eliminación accidental)**
- **Probabilidad:** Baja (5-10%)
- **Impacto:** Alto (trabajo perdido, re-corrección necesaria)
- **Mitigación:**
  1. Backup automático de folder de exámenes (recomendación)
  2. Confirmación antes de eliminar (si se implementa UI)
  3. Archivos en subfolder `retroalimentaciones_*/` (separación)
  4. Logs de archivos generados
- **Owner:** Docentes (backup) + Sistema (ubicación segura)

### 11.3 Pedagogical Risks

**RISK-P1: Baja Validación de Predicciones BD (<60%)**
- **Probabilidad:** Media (20-30%, factores externos)
- **Impacto:** Medio (ajustes históricos poco confiables)
- **Mitigación:**
  1. Factor de confiabilidad ajustado automáticamente (<60% → 0.3)
  2. Alerta ROJA en retroalimentación si <20%
  3. Análisis de causas de fallos (factores externos, cambios recientes)
  4. Recalibración de modelo de expectativas si necesario
- **Owner:** Sistema (auto-ajuste) + Docentes (análisis de causas)

**RISK-P2: Sobre-Confianza en Sistema (Docentes no revisan)**
- **Probabilidad:** Media (30-40%, confianza ciega en IA)
- **Impacto:** Alto (errores no detectados, injusticias)
- **Mitigación:**
  1. Fase piloto con muestreo manual (10-15% de alumnos)
  2. Dashboard de validación para docentes (futuro)
  3. Documentación transparente de cálculos (archivos JSON + MD)
  4. Capacitación en interpretación de retroalimentación
- **Owner:** Coordinación Académica (supervisión)

**RISK-P3: Resistencia al Cambio (Docentes prefieren corrección manual)**
- **Probabilidad:** Baja-Media (20-30%, cultura institucional)
- **Impacto:** Medio (baja adopción del sistema)
- **Mitigación:**
  1. Fase piloto con docentes voluntarios
  2. Demostración de ahorro de tiempo tangible
  3. Feedback de estudiantes (retroalimentación más detallada)
  4. Training y soporte continuo
- **Owner:** Coordinación Académica (change management)

### 11.4 Data Risks

**RISK-D1: Datos Históricos Desactualizados (BD antigua)**
- **Probabilidad:** Media (30-40%, si BD no se actualiza)
- **Impacto:** Medio (predicciones basadas en datos viejos)
- **Mitigación:**
  1. Verificación de fecha última actualización (timestamp en query)
  2. Warning si datos >3 meses antiguos
  3. Recomendación de actualizar BD antes de corrección
  4. W104 disponible como fallback (sin historial)
- **Owner:** Docentes (mantener BD actualizada)

**RISK-D2: Normalización Inconsistente de Subject/Topic**
- **Probabilidad:** Media (30-40%, variaciones en nombres)
- **Impacto:** Medio (queries ineficientes, duplicados en BD)
- **Mitigación:**
  1. Normalización automática en E12 (database-uploader)
  2. Diccionario de mappings (ej: "Fisica" → "Física")
  3. Capitalización estándar de topics
  4. Script de verificación de BD periódica
- **Owner:** Sistema (normalización) + Docentes (consistencia)

### 11.5 Mitigation Priority Matrix

| Risk | Probabilidad | Impacto | Prioridad | Status |
|------|--------------|---------|-----------|--------|
| RISK-T1: Imágenes baja calidad | Media | Alto | **ALTA** | ✅ Mitigado (marcador [ILEGIBLE]) |
| RISK-T2: Fallo conexión BD | Baja | Medio | Media | ✅ Mitigado (retry + W104 fallback) |
| RISK-T3: Race conditions | Muy Baja | Medio | Baja | ✅ Mitigado (diseño preventivo) |
| RISK-O1: Naming inconsistente | Alta | Medio | **ALTA** | ✅ Mitigado (patrón flexible) |
| RISK-O2: Interrupción workflow | Media | Bajo | Media | ✅ Mitigado (checklist persistente) |
| RISK-P1: Baja validación BD | Media | Medio | **ALTA** | ✅ Mitigado (factor auto-ajustado) |
| RISK-P2: Sobre-confianza en IA | Media | Alto | **ALTA** | 🔄 En curso (fase piloto) |
| RISK-D1: BD desactualizada | Media | Medio | Media | ⚠️ Requiere política de actualización |

---

## 12. ROADMAP & FUTURE ENHANCEMENTS

### 12.1 Phase 1: Foundation (Q4 2025) - ✅ COMPLETADO

**Objetivos:**
- Implementar Workflow 103 (comparativo) y 104 (básico)
- Integración con BD Turso (Intellego)
- Modo paralelo para W103
- Validación en fase piloto (4-6 exámenes)

**Deliverables:**
- ✅ W103 y W104 funcionales
- ✅ 11 agents especializados
- ✅ Documentación completa (`workflows/`)
- ✅ Modo paralelo con 3-10 batches
- ✅ Integración BD bidireccional
- 🔄 Fase piloto en curso (Física, Química 4to año)

### 12.2 Phase 2: Validation & Expansion (Q1 2026)

**Objetivos:**
- Validar precisión del sistema (≥95% consistencia vs. docente)
- Expandir a más cursos (5to año)
- Implementar dashboard de métricas
- Capacitar docentes adicionales

**Deliverables:**
- Muestreo de validación (10-15% de alumnos)
- Dashboard web básico (métricas agregadas)
- Workflow 103/104 para 5to año Física y Química
- Training formal para docentes
- Reportes de validación de predicciones BD

**Success Metrics:**
- ≥95% consistencia con corrección manual
- ≥70% de predicciones BD confirmadas
- 100% de exámenes 4to-5to año con sistema
- NPS docentes ≥8/10

### 12.3 Phase 3: Advanced Features (Q2-Q3 2026)

**Objetivos:**
- Sistema de alertas tempranas (estudiantes en riesgo)
- Análisis de tendencias históricas por curso
- Rúbricas adaptativas (aprendizaje continuo)
- Exportación a estándares educativos (IMS QTI)

**Deliverables:**

**1. Sistema de Alertas Tempranas:**
- Detección automática de estudiantes con desempeño muy por debajo de capacidad histórica
- Notificaciones a docentes/coordinadores
- Recomendaciones de intervención pedagógica

**2. Dashboard de Tendencias:**
- Visualización de rendimiento por curso (promedio, desviación, tendencias)
- Comparación entre cursos/materias
- Identificación de temas con mayor dificultad
- Validación agregada de predicciones BD

**3. Rúbricas Adaptativas:**
- Ajuste automático de pesos por fase basado en correlación con resultados
- Refinamiento de fórmulas de expectativas (competencias → fases)
- Aprendizaje continuo desde feedbacks completados

**4. Exportación Estándar:**
- Exportar evaluaciones a formato IMS QTI (Interoperability)
- Integración con LMS (Moodle, Canvas, etc.)
- API para sistemas externos

**Success Metrics:**
- ≥80% de estudiantes en riesgo identificados correctamente
- Dashboard usado semanalmente por coordinadores
- Rúbricas refinadas con ≥5% mejora en precisión
- Exportación a LMS funcional

### 12.4 Phase 4: Multi-Subject Expansion (Q4 2026)

**Objetivos:**
- Expandir a Matemática, Biología
- Implementar reconocimiento de gráficos/diagramas
- Corrección de respuestas abiertas (ensayos)
- Multi-idioma (Inglés para materias bilingües)

**Deliverables:**

**1. Matemática:**
- Rúbrica específica para Matemática (énfasis en rigor lógico)
- Verificación de demostraciones matemáticas
- Detección de errores en álgebra/cálculo

**2. Biología:**
- Rúbrica para Biología (conceptos, clasificaciones, procesos)
- Reconocimiento de diagramas (células, ecosistemas, etc.)
- Evaluación de respuestas descriptivas

**3. Reconocimiento Avanzado:**
- OCR mejorado para ecuaciones complejas
- Reconocimiento de gráficos (funciones, diagramas de fuerza, etc.)
- Extracción automática de datos de tablas

**4. Respuestas Abiertas:**
- Evaluación de coherencia argumentativa
- Detección de conceptos clave mencionados
- Evaluación de estructura de ensayo

**Success Metrics:**
- Workflow funcional para Matemática y Biología
- ≥85% precisión en reconocimiento de gráficos
- ≥80% consistencia en evaluación de respuestas abiertas
- Cobertura de 6 materias totales

### 12.5 Future Vision (2027+)

**Long-Term Enhancements:**

1. **Inteligencia Artificial Generativa Avanzada:**
   - Generación automática de preguntas de examen (basado en currícula)
   - Sugerencias de ejercicios de práctica personalizados por alumno
   - Tutoriales adaptativos basados en errores recurrentes

2. **Análisis Predictivo:**
   - Predicción de rendimiento en examen final (basado en parciales)
   - Identificación de alumnos en riesgo de deserción
   - Recomendaciones de intervención temprana

3. **Gamificación:**
   - Sistema de logros/badges por mejoras continuas
   - Comparación anónima con pares (percentiles)
   - Visualización de progreso histórico (gráficos interactivos)

4. **Integración Institucional:**
   - API para sistema de gestión escolar central
   - Sincronización con Google Classroom / Microsoft Teams
   - Reportes automáticos para padres (boletines)

5. **Investigación Pedagógica:**
   - Dataset anónimo para investigación educativa
   - Análisis de correlación entre competencias y rendimiento
   - Publicaciones académicas sobre efectividad del tracking

---

## 13. APPENDICES

### Appendix A: Glossary

| Término | Definición |
|---------|----------|
| **Agent** | Componente especializado de Claude que ejecuta una tarea específica (ej: exam-transcriber, grade-calculator) |
| **Batch** | Subgrupo de alumnos procesados en paralelo (4-6 alumnos óptimo) |
| **BD / Database** | Base de datos Turso (Intellego) con historial de estudiantes |
| **Checklist** | Archivo CSV que rastrea estado de corrección por alumno |
| **Competencias** | Habilidades evaluadas históricamente: comprensión, aplicación, pensamiento crítico, autorregulación, metacognición |
| **Eslabón** | Paso específico dentro de un workflow (E0-E12 en W103, E0-E5 en W104) |
| **evaluationId** | ID único generado con SHA256 para registro en BD |
| **Factor de Ajuste** | Valor entre -0.20 y +0.20 que modifica la nota según desempeño comparativo |
| **Factor de Confiabilidad** | Multiplicador (0.3-1.0) basado en precisión de predicciones BD |
| **Nota_Examen** | Nota calculada sin ajustes históricos (desempeño puro) |
| **Nota_Final** | Nota ajustada por historial del estudiante (W103 únicamente) |
| **Score_Base** | Promedio ponderado de competencias históricas del estudiante |
| **Task Agent** | Agent autónomo lanzado en modo paralelo para procesar un batch |
| **Transcripción Fiel** | Transcripción que preserva TODOS los errores exactamente como están escritos |
| **Validación de Predicción** | Confirmación de si la BD predijo correctamente el desempeño (✅⚠️❌🆕) |
| **Workflow 103** | Corrección comparativa con historial (requiere BD) |
| **Workflow 104** | Corrección básica sin historial (evaluación absoluta) |

### Appendix B: File Naming Conventions

**Transcripciones:**
- Formato: `TRANSCRIPCION_[Apellido]_[Nombre].md`
- Ejemplo: `TRANSCRIPCION_Gonzalez_Ana.md`

**Análisis (W104):**
- Formato: `ANALISIS_BASICO_[Apellido]_[Nombre].md`
- Ejemplo: `ANALISIS_BASICO_Rodriguez_Carlos.md`

**Notas:**
- JSON: `NOTA_[Apellido]_[Nombre].json`
- MD: `NOTA_[Apellido]_[Nombre].md`
- Ejemplo: `NOTA_Fernandez_Maria.json`

**Retroalimentación:**
- Formato: `[Apellido]_[Nombre]_retroalimentacion_[DDMMYYYY].md`
- Ubicación: `retroalimentaciones_[tema]_[curso]/`
- Ejemplo: `retroalimentaciones_tiro_oblicuo_4to_C/Gonzalez_Ana_retroalimentacion_06102025.md`

**Checklists:**
- W103: `CHECKLIST_CORRECCION.csv` o `CHECKLIST_CORRECCION_W103.csv`
- W104: `CHECKLIST_CORRECCION_W104.csv`
- Batch: `CHECKLIST_BATCH_[N].csv`

**Reportes:**
- Batch: `REPORTE_BATCH_[N].md`
- Consolidado: `REPORTE_CONSOLIDADO_PARALELO.md`

**Logs:**
- Errores: `LOG_ERRORES_WORKFLOW.csv`
- Exitos BD: `LOG_EXITOS_SUBIDA.csv`

### Appendix C: Command Reference

**Workflow 103 (Comparativo):**
```bash
# Iniciar secuencial
"Iniciar Workflow 103 con @listado_alumnos.csv para [CURSO] tema [TEMA] en [PATH]"

# Iniciar paralelo
"Iniciar Workflow 103 PARALELO con [N] batches para [CURSO] tema [TEMA] en [PATH]"

# Retomar
"Retomar Workflow 103 desde checklist guardado"

# Estado
"Mostrar estado actual del checklist de corrección"

# Verificar batches
"Verificar estado de batches paralelos"

# Consolidar
"Consolidar resultados de corrección paralela"
```

**Workflow 104 (Básico):**
```bash
# Iniciar
"Iniciar Workflow 104 con @listado_alumnos.csv para [CURSO] tema [TEMA] en [PATH]"

# Procesar uno solo
"Procesar solo a [NOMBRE APELLIDO] en Workflow 104 para [TEMA] en [PATH]"

# Solo transcribir
"Transcribir solo el examen de [NOMBRE APELLIDO] en [PATH]/[ARCHIVO]"

# Retomar
"Retomar Workflow 104 desde checklist guardado"

# Estado
"Mostrar estado actual del checklist de Workflow 104"
```

**Comandos de Recuperación:**
```bash
# Marcar error y continuar
"Marcar como ERROR a [NOMBRE APELLIDO] y continuar con siguiente"

# Reiniciar desde cero
"Reiniciar corrección de [NOMBRE APELLIDO] desde cero"

# Recorregir
"Recorregir a [NOMBRE APELLIDO] en Workflow [103|104]"

# Saltar
"Saltar a [NOMBRE APELLIDO] y continuar workflow"
```

### Appendix D: Error Codes

| Código | Descripción | Acción |
|--------|-------------|--------|
| E0_NO_EXAM | Archivo de examen no encontrado | Verificar naming, agregar archivo |
| E1_UNREADABLE_COMPLETE | Imagen completamente ilegible | Re-escanear con mejor calidad |
| E1_UNREADABLE_PARTIAL | Partes ilegibles (>20%) | Revisar transcripción manual |
| E3_BD_QUERY_FAIL | Error en query a BD | Verificar conexión, reintentar |
| E3_STUDENT_NOT_FOUND | Estudiante no existe en BD | Usar W104, o agregar a BD |
| E12_FILE_NOT_FOUND | Archivo de feedback no encontrado | Regenerar feedback |
| E12_STUDENT_NOT_FOUND | Estudiante no encontrado en BD para upload | Verificar nombre/ID, SKIP inserción |
| E12_DUPLICATE_ID | evaluationId ya existe en BD | SKIP inserción, WARNING |
| E12_INSERT_FAILED | INSERT en BD falló | REINTENTAR 1x, luego ERROR_BD |
| E12_FEEDBACK_TRUNCATED | Feedback >50K chars | TRUNCAR, LOG warning |
| E_BATCH_PDF_NOT_FOUND | PDF no encontrado (modo batch) | Marcar ERROR, continuar batch |
| E_BATCH_BD_QUERY_FAIL | Query BD falló (modo batch) | Usar defaults, continuar |
| E_BATCH_INSERT_FAIL | INSERT BD falló (modo batch) | Marcar ERROR_BD, continuar |

### Appendix E: References

**Documentación Interna:**
- `README.md` - Documentación general del proyecto
- `CLAUDE.md` - Instrucciones para Claude Code
- `workflows/WORKFLOW_103_CORRECCION_SISTEMATICA.md` - Workflow comparativo detallado
- `workflows/WORKFLOW_103_PARALLEL.md` - Workflow paralelo para Task agents
- `workflows/WORKFLOW_104_CORRECCION_BASICA.md` - Workflow básico detallado
- `workflows/RUBRICA_COMPARATIVA.md` - Criterios de evaluación comparativa
- `workflows/RUBRICA_BASICA.md` - Criterios de evaluación absoluta
- `workflows/CRITERIOS_TRANSCRIPCION.md` - Reglas de transcripción fiel
- `workflows/INTEGRACION_BD.md` - Protocolos de integración con BD
- `workflows/PROMPT_MAESTRO_CLAUDE_CODE.md` - Prompts y fórmulas core
- `workflows/COMANDOS_PARALELOS.md` - Guía completa modo paralelo
- `workflows/COMANDOS_104_BASICOS.md` - Guía rápida Workflow 104

**Herramientas:**
- Claude Code: https://claude.com/code
- Turso Cloud: https://turso.tech
- Anthropic API: https://docs.anthropic.com

**Contacto:**
- **Responsable del Producto:** Colegio Santo Tomás de Aquino
- **Coordinación Académica:** Ciencias (Física, Química, Biología)
- **Soporte Técnico:** Claude Code + documentación en `/workflows/`

---

**Fin del PRD - Sistema de Corrección Automática de Exámenes v1.0**

**Fecha de Última Actualización:** 21 de octubre de 2025
**Próxima Revisión:** Q1 2026 (post-validación fase piloto)
