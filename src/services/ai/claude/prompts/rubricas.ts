/**
 * RÚBRICAS DE CORRECCIÓN - SISTEMA INTELLEGO
 * Sistema de evaluación de reportes semanales basado en metodología de Pensamiento Crítico (4 fases)
 *
 * Fuente: AI_integrations_haiku/RUBRICAS_DE_CORRECCION.md
 * Versión: 1.1
 * Última actualización: Septiembre 2025
 */

/**
 * Sistema de niveles de desempeño
 */
export const NIVELES = {
  NIVEL_4: { rango: [85, 100], puntaje: 92.5, descriptor: "Excelente" },
  NIVEL_3: { rango: [70, 84], puntaje: 77, descriptor: "Bueno" },
  NIVEL_2: { rango: [55, 69], puntaje: 62, descriptor: "En desarrollo" },
  NIVEL_1: { rango: [0, 54], puntaje: 27, descriptor: "Inicial" }
} as const;

/**
 * Ponderaciones por pregunta
 */
export const PONDERACIONES = {
  Q1: 0.25, // 25% - Temas trabajados y dominio
  Q2: 0.25, // 25% - Evidencia de aprendizaje
  Q3: 0.20, // 20% - Dificultades y estrategias
  Q4: 0.20, // 20% - Conexiones y aplicación
  Q5: 0.10  // 10% - Comentarios adicionales
} as const;

/**
 * FASE 1: IDENTIFICACIÓN Y COMPRENSIÓN DEL PROBLEMA
 */
export const RUBRICA_FASE_1 = `
# RÚBRICA FASE 1: IDENTIFICACIÓN Y COMPRENSIÓN DEL PROBLEMA

## Foco Metodológico
En la Fase 1, los estudiantes aprenden a identificar problemas, distinguir información relevante e irrelevante, y comprender el contexto de una situación problemática.

---

## Q1: Temas trabajados y nivel de dominio (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica claramente el problema principal y los objetivos.** Distingue con precisión información relevante de irrelevante. Demuestra comprensión profunda del contexto. Articula el problema de forma completa y sistemática.

**Indicadores clave:**
- Claridad en identificación del problema
- Capacidad de filtrar información
- Comprensión del contexto
- Articulación de objetivos

### Nivel 3 (70-84 puntos → 77)
**Identifica el problema y objetivo con claridad aceptable.** Distingue la mayoría de información relevante. Comprende el contexto general. Descripción coherente del problema.

### Nivel 2 (55-69 puntos → 62)
**Identifica parcialmente el problema.** Confunde algunos elementos relevantes/irrelevantes. Comprensión básica del contexto. Descripción incompleta o vaga.

### Nivel 1 (0-54 puntos → 27)
**Dificultad para identificar el problema central.** No distingue información relevante. Comprensión limitada del contexto. Respuesta confusa o ausente.

---

## Q2: Evidencia de aprendizaje (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Presenta evidencias concretas de aplicación del Paso 1 (identificar problema).** Ejemplifica con situaciones específicas trabajadas. Muestra proceso de pensamiento sistemático. Documenta cómo abordó problemas reales.

**Indicadores clave:**
- Ejemplos específicos y concretos
- Documentación del proceso
- Evidencia de aplicación del Paso 1
- Sistematicidad en el pensamiento

### Nivel 3 (70-84 puntos → 77)
**Presenta evidencias adecuadas del Paso 1.** Algunos ejemplos concretos. Proceso de pensamiento visible. Descripción clara de lo trabajado.

### Nivel 2 (55-69 puntos → 62)
**Evidencias parciales o genéricas.** Pocos ejemplos específicos. Proceso de pensamiento irregular. Descripción superficial del trabajo realizado.

### Nivel 1 (0-54 puntos → 27)
**Sin evidencias claras de aplicación.** No hay ejemplos concretos. Proceso no evidente. Respuesta vaga o ausente.

---

## Q3: Dificultades y estrategias (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica dificultades específicas en la comprensión del problema.** Propone estrategias concretas y viables. Reflexiona sobre el proceso metacognitivo. Muestra autoconciencia del aprendizaje.

**Indicadores clave:**
- Especificidad en dificultades identificadas
- Viabilidad de estrategias propuestas
- Profundidad de reflexión metacognitiva
- Autoconciencia del proceso de aprendizaje

### Nivel 3 (70-84 puntos → 77)
**Identifica dificultades generales.** Propone algunas estrategias. Cierta reflexión sobre el proceso. Conciencia básica de obstáculos.

### Nivel 2 (55-69 puntos → 62)
**Identifica dificultades vagas.** Estrategias poco desarrolladas. Reflexión superficial. Poca conciencia de los propios procesos.

### Nivel 1 (0-54 puntos → 27)
**No identifica dificultades o son irrelevantes.** Sin estrategias claras. Sin reflexión. Ausencia de metacognición.

---

## Q4: Conexiones y aplicación (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Conecta la identificación de problemas con situaciones cotidianas.** Transfiere el aprendizaje a otros contextos. Muestra pensamiento crítico integrado. Ejemplos variados y relevantes.

**Indicadores clave:**
- Calidad de conexiones con vida cotidiana
- Capacidad de transferencia
- Integración del pensamiento crítico
- Relevancia de ejemplos

### Nivel 3 (70-84 puntos → 77)
**Hace conexiones básicas con la vida real.** Alguna transferencia a otros contextos. Pensamiento crítico presente. Ejemplos adecuados.

### Nivel 2 (55-69 puntos → 62)
**Conexiones limitadas o forzadas.** Poca transferencia. Pensamiento crítico incipiente. Ejemplos genéricos o escasos.

### Nivel 1 (0-54 puntos → 27)
**Sin conexiones evidentes.** No hay transferencia. Pensamiento crítico ausente. Sin ejemplos o irrelevantes.

---

## Q5: Comentarios adicionales (Peso: 10%)

### Nivel 4 (85-100 puntos → 92.5)
**Aporta reflexiones profundas sobre el proceso.** Muestra iniciativa y curiosidad. Propone extensiones o aplicaciones creativas. Va más allá de lo solicitado.

**Indicadores clave:**
- Profundidad de reflexión
- Iniciativa y curiosidad
- Creatividad en propuestas
- Pertinencia de comentarios

### Nivel 3 (70-84 puntos → 77)
**Comentarios pertinentes al proceso.** Muestra interés. Algunas ideas propias. Reflexión genuina.

### Nivel 2 (55-69 puntos → 62)
**Comentarios genéricos.** Interés moderado. Pocas ideas propias. Reflexión superficial.

### Nivel 1 (0-54 puntos → 27)
**Sin comentarios relevantes o ausentes.** Sin muestras de interés. Respuesta vacía o irrelevante.
`;

/**
 * FASE 2: IDENTIFICACIÓN DE VARIABLES Y DATOS
 */
export const RUBRICA_FASE_2 = `
# RÚBRICA FASE 2: IDENTIFICACIÓN DE VARIABLES Y DATOS

## Foco Metodológico
En la Fase 2, los estudiantes aprenden a identificar variables (conocidas/desconocidas, controlables/no controlables), distinguir magnitudes físicas y comprender relaciones entre variables. Se integra con la Fase 1.

---

## Q1: Temas trabajados y nivel de dominio (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica y clasifica todas las variables** (conocidas/desconocidas, controlables/no controlables). **Distingue magnitudes físicas con precisión.** Comprende relaciones entre variables. Análisis sistemático y completo.

**Indicadores clave:**
- Completitud en identificación de variables
- Precisión en clasificación
- Comprensión de relaciones entre variables
- Distinción de magnitudes físicas

### Nivel 3 (70-84 puntos → 77)
**Identifica mayoría de variables importantes.** Clasifica correctamente la mayoría. Comprende relaciones básicas. Análisis adecuado.

### Nivel 2 (55-69 puntos → 62)
**Identifica algunas variables.** Clasificación parcial o con errores. Comprensión limitada de relaciones. Análisis incompleto.

### Nivel 1 (0-54 puntos → 27)
**Dificultad para identificar variables.** Clasificación incorrecta o ausente. No comprende relaciones. Sin análisis sistemático.

---

## Q2: Evidencia de aprendizaje (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Demuestra aplicación sistemática de F1+F2.** Lista completa de variables en problemas trabajados. Evidencia clasificación metódica. Integra fases previas fluidamente.

**Indicadores clave:**
- Integración de Fase 1 con Fase 2
- Completitud de listas de variables
- Sistematicidad en clasificación
- Evidencia documental del proceso

### Nivel 3 (70-84 puntos → 77)
**Muestra aplicación de F1+F2.** Lista variables principales. Evidencia de clasificación. Integración adecuada.

### Nivel 2 (55-69 puntos → 62)
**Aplicación parcial de F1+F2.** Lista incompleta de variables. Clasificación irregular. Integración débil.

### Nivel 1 (0-54 puntos → 27)
**No evidencia aplicación de fases previas.** Lista mínima o incorrecta. Sin clasificación. Sin integración.

---

## Q3: Dificultades y estrategias (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica dificultades específicas con tipos de variables.** Estrategias claras para diferenciar magnitudes. Reflexiona sobre mejora en identificación. Metacognición avanzada.

**Indicadores clave:**
- Especificidad de dificultades con variables
- Claridad de estrategias de diferenciación
- Reflexión sobre progreso
- Metacognición sobre el proceso

### Nivel 3 (70-84 puntos → 77)
**Identifica dificultades con variables.** Algunas estrategias útiles. Cierta reflexión sobre el proceso. Autoconciencia presente.

### Nivel 2 (55-69 puntos → 62)
**Dificultades genéricas mencionadas.** Estrategias vagas. Poca reflexión. Metacognición limitada.

### Nivel 1 (0-54 puntos → 27)
**No identifica dificultades reales.** Sin estrategias. Sin reflexión. Ausencia de autoconciencia.

---

## Q4: Conexiones y aplicación (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Conecta variables con fenómenos reales.** Transfiere identificación a nuevos problemas. Integra F1+F2 fluidamente. Muestra versatilidad en aplicación.

**Indicadores clave:**
- Calidad de conexiones con fenómenos físicos/químicos
- Capacidad de transferencia a nuevos problemas
- Fluidez en integración de fases
- Versatilidad en aplicación

### Nivel 3 (70-84 puntos → 77)
**Hace conexiones básicas con fenómenos.** Alguna transferencia. Integra F1+F2 adecuadamente. Aplicación correcta.

### Nivel 2 (55-69 puntos → 62)
**Conexiones limitadas.** Poca transferencia. Integración parcial F1+F2. Aplicación irregular.

### Nivel 1 (0-54 puntos → 27)
**Sin conexiones claras.** No hay transferencia. No integra fases previas. Sin aplicación evidente.

---

## Q5: Comentarios adicionales (Peso: 10%)

### Nivel 4 (85-100 puntos → 92.5)
**Reflexiones sobre la importancia de las variables.** Propone categorías propias. Muestra evolución desde Fase 1. Pensamiento original.

**Indicadores clave:**
- Comprensión de importancia de variables
- Originalidad en categorización
- Evidencia de evolución desde Fase 1
- Profundidad de reflexión

### Nivel 3 (70-84 puntos → 77)
**Comentarios sobre el proceso de identificación.** Muestra progreso. Algunas observaciones propias. Reflexión genuina.

### Nivel 2 (55-69 puntos → 62)
**Comentarios básicos.** Progreso limitado visible. Pocas observaciones. Reflexión superficial.

### Nivel 1 (0-54 puntos → 27)
**Sin comentarios relevantes.** Sin evidencia de progreso. Respuesta ausente o irrelevante.
`;

/**
 * FASE 3: SELECCIÓN DE HERRAMIENTAS Y RELACIONES
 */
export const RUBRICA_FASE_3 = `
# RÚBRICA FASE 3: SELECCIÓN DE HERRAMIENTAS Y RELACIONES

## Foco Metodológico
En la Fase 3, los estudiantes aprenden a seleccionar fórmulas/leyes apropiadas, comprender relaciones entre variables y ecuaciones, usar representaciones gráficas y aplicar teoría disciplinar. Integra F1+F2+F3.

---

## Q1: Temas trabajados y nivel de dominio (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Selecciona fórmulas/leyes apropiadas con justificación clara.** Comprende relación variables-ecuaciones. Usa representaciones gráficas efectivamente. Integra teoría disciplinar con precisión.

**Indicadores clave:**
- Pertinencia en selección de fórmulas/leyes
- Justificación de selecciones
- Uso efectivo de representaciones gráficas
- Integración de teoría disciplinar

### Nivel 3 (70-84 puntos → 77)
**Selecciona fórmulas correctas mayormente.** Comprende relaciones básicas. Usa algunos gráficos. Comprensión teórica adecuada.

### Nivel 2 (55-69 puntos → 62)
**Selección parcial de herramientas.** Comprensión limitada de relaciones. Gráficos básicos o incorrectos. Teoría superficial.

### Nivel 1 (0-54 puntos → 27)
**Dificultad para seleccionar herramientas.** No comprende relaciones. Sin representaciones gráficas. Teoría ausente.

---

## Q2: Evidencia de aprendizaje (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Evidencia clara de F1+F2+F3 integradas.** Justifica selección de cada fórmula. Muestra diagramas/esquemas propios. Aplica teoría específica del tema. Documentación completa.

**Indicadores clave:**
- Integración completa de tres fases
- Calidad de justificaciones
- Producción de diagramas propios
- Aplicación de teoría específica

### Nivel 3 (70-84 puntos → 77)
**Muestra integración F1+F2+F3.** Justifica mayoría de selecciones. Algunos diagramas. Aplica teoría básica. Documentación adecuada.

### Nivel 2 (55-69 puntos → 62)
**Integración parcial de fases.** Justificaciones débiles. Pocos diagramas. Teoría mínima. Documentación incompleta.

### Nivel 1 (0-54 puntos → 27)
**No integra fases previas.** Sin justificaciones. Sin diagramas. Sin aplicación teórica. Documentación ausente.

---

## Q3: Dificultades y estrategias (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica dificultades con fórmulas específicas.** Estrategias para relacionar variables-ecuaciones. Reflexiona sobre criterios de selección. Metacognición avanzada sobre herramientas.

**Indicadores clave:**
- Especificidad en dificultades con herramientas
- Estrategias para relacionar variables-ecuaciones
- Reflexión sobre criterios de selección
- Metacognición sobre uso de herramientas

### Nivel 3 (70-84 puntos → 77)
**Identifica dificultades con herramientas.** Algunas estrategias útiles. Cierta reflexión sobre selección. Autoconciencia presente.

### Nivel 2 (55-69 puntos → 62)
**Dificultades genéricas.** Estrategias vagas. Poca reflexión sobre proceso. Metacognición limitada.

### Nivel 1 (0-54 puntos → 27)
**No identifica dificultades reales.** Sin estrategias claras. Sin reflexión. Ausencia de autoconciencia.

---

## Q4: Conexiones y aplicación (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Conecta herramientas matemáticas con fenómenos físicos/químicos.** Transfiere a problemas complejos. Muestra versatilidad en selección. Integración teoría-práctica sólida.

**Indicadores clave:**
- Calidad de conexiones matemática-fenómenos
- Transferencia a problemas complejos
- Versatilidad en selección de herramientas
- Integración efectiva teoría-práctica

### Nivel 3 (70-84 puntos → 77)
**Hace conexiones básicas teoría-práctica.** Alguna transferencia. Selección apropiada generalmente. Integración adecuada.

### Nivel 2 (55-69 puntos → 62)
**Conexiones limitadas.** Poca transferencia. Selección irregular. Integración débil.

### Nivel 1 (0-54 puntos → 27)
**Sin conexiones teoría-práctica.** No hay transferencia. Selección incorrecta. Sin integración.

---

## Q5: Comentarios adicionales (Peso: 10%)

### Nivel 4 (85-100 puntos → 92.5)
**Reflexiones sobre la elegancia de las soluciones.** Propone métodos alternativos. Muestra madurez en el razonamiento físico/químico. Pensamiento crítico avanzado.

**Indicadores clave:**
- Apreciación de elegancia matemática
- Propuesta de alternativas
- Madurez en razonamiento disciplinar
- Evolución del pensamiento crítico

### Nivel 3 (70-84 puntos → 77)
**Comentarios sobre utilidad de herramientas.** Muestra evolución en comprensión. Algunas ideas propias. Reflexión genuina.

### Nivel 2 (55-69 puntos → 62)
**Comentarios básicos.** Progreso limitado. Pocas reflexiones propias. Pensamiento superficial.

### Nivel 1 (0-54 puntos → 27)
**Sin comentarios relevantes.** Sin evidencia de evolución. Respuesta ausente o irrelevante.
`;

/**
 * FASE 4: ESTRATEGIA Y EJECUCIÓN COMPLETA
 */
export const RUBRICA_FASE_4 = `
# RÚBRICA FASE 4: ESTRATEGIA Y EJECUCIÓN COMPLETA

## Foco Metodológico
En la Fase 4, los estudiantes planifican estrategias completas, ejecutan cálculos sistemáticamente, verifican resultados y demuestran dominio integrado de las 4 fases del pensamiento crítico.

---

## Q1: Temas trabajados y nivel de dominio (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Planifica estrategia completa antes de ejecutar.** Ejecuta cálculos sistemáticamente. Verifica resultados múltiples formas. Integra F1+F2+F3+F4 fluidamente. Dominio completo del proceso.

**Indicadores clave:**
- Calidad de planificación estratégica
- Sistematicidad en ejecución
- Multiplicidad de verificaciones
- Integración fluida de las 4 fases

### Nivel 3 (70-84 puntos → 77)
**Planifica adecuadamente.** Ejecuta mayoría de cálculos bien. Alguna verificación. Integra fases correctamente. Proceso coherente.

### Nivel 2 (55-69 puntos → 62)
**Planificación parcial.** Ejecución con errores. Poca verificación. Integración irregular de fases. Proceso incompleto.

### Nivel 1 (0-54 puntos → 27)
**Sin planificación evidente.** Ejecución incorrecta. Sin verificación. No integra fases previas. Proceso ausente o caótico.

---

## Q2: Evidencia de aprendizaje (Peso: 25%)

### Nivel 4 (85-100 puntos → 92.5)
**Muestra problemas completamente resueltos con proceso completo.** Evidencia verificación dimensional/numérica. Diagramas de flujo o tablas de decisión. Documentación exhaustiva.

**Indicadores clave:**
- Completitud de resolución de problemas
- Evidencia de verificación (dimensional, numérica)
- Uso de herramientas de organización (diagramas, tablas)
- Calidad de documentación

### Nivel 3 (70-84 puntos → 77)
**Muestra problemas resueltos.** Proceso mayormente completo. Alguna verificación. Organización clara. Documentación adecuada.

### Nivel 2 (55-69 puntos → 62)
**Problemas parcialmente resueltos.** Proceso incompleto. Verificación mínima. Organización irregular. Documentación limitada.

### Nivel 1 (0-54 puntos → 27)
**Problemas sin resolver o incorrectos.** Sin proceso claro. Sin verificación. Desorganizado. Sin documentación.

---

## Q3: Dificultades y estrategias (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Identifica puntos críticos en la resolución.** Estrategias para evitar errores de cálculo. Reflexiona sobre eficiencia del método. Metacognición sobre proceso completo.

**Indicadores clave:**
- Identificación de puntos críticos
- Estrategias preventivas de errores
- Reflexión sobre eficiencia metodológica
- Metacognición sobre proceso completo

### Nivel 3 (70-84 puntos → 77)
**Identifica dificultades de ejecución.** Algunas estrategias útiles. Cierta reflexión sobre método. Autoconciencia presente.

### Nivel 2 (55-69 puntos → 62)
**Dificultades genéricas mencionadas.** Estrategias vagas. Poca reflexión. Metacognición limitada.

### Nivel 1 (0-54 puntos → 27)
**No identifica dificultades reales.** Sin estrategias. Sin reflexión sobre proceso. Ausencia total de metacognición.

---

## Q4: Conexiones y aplicación (Peso: 20%)

### Nivel 4 (85-100 puntos → 92.5)
**Conecta soluciones con aplicaciones reales.** Evalúa razonabilidad de resultados. Propone variaciones o extensiones del problema. Pensamiento crítico maduro.

**Indicadores clave:**
- Calidad de conexiones con aplicaciones reales
- Evaluación de razonabilidad de resultados
- Propuestas de extensiones
- Madurez del pensamiento crítico

### Nivel 3 (70-84 puntos → 77)
**Hace conexiones básicas con realidad.** Evalúa algunos resultados. Comprende implicaciones básicas. Pensamiento apropiado.

### Nivel 2 (55-69 puntos → 62)
**Conexiones limitadas.** Poca evaluación de resultados. Comprensión superficial de implicaciones. Pensamiento básico.

### Nivel 1 (0-54 puntos → 27)
**Sin conexiones con realidad.** No evalúa resultados. Sin comprensión de implicaciones. Pensamiento ausente.

---

## Q5: Comentarios adicionales (Peso: 10%)

### Nivel 4 (85-100 puntos → 92.5)
**Reflexiones sobre el proceso completo de 4 fases.** Propone optimizaciones. Muestra dominio metodológico y disciplinar integrado. Visión holística del aprendizaje.

**Indicadores clave:**
- Visión holística de las 4 fases
- Propuestas de optimización
- Integración metodológica-disciplinar
- Conciencia del progreso personal

### Nivel 3 (70-84 puntos → 77)
**Comentarios sobre utilidad del método.** Muestra comprensión del proceso completo. Satisfacción con progreso. Reflexión genuina.

### Nivel 2 (55-69 puntos → 62)
**Comentarios básicos.** Comprensión parcial del proceso. Progreso limitado visible. Reflexión superficial.

### Nivel 1 (0-54 puntos → 27)
**Sin comentarios relevantes.** Sin comprensión del proceso completo. Sin evidencia de progreso. Respuesta ausente.
`;

/**
 * Obtiene la rúbrica correspondiente según la fase
 */
export function getRubricaByFase(fase: number): string {
  switch (fase) {
    case 1:
      return RUBRICA_FASE_1;
    case 2:
      return RUBRICA_FASE_2;
    case 3:
      return RUBRICA_FASE_3;
    case 4:
      return RUBRICA_FASE_4;
    default:
      throw new Error(`Fase inválida: ${fase}. Debe ser 1, 2, 3 o 4.`);
  }
}

/**
 * Calcula el score final ponderado según algoritmo de rúbricas
 */
export function calcularScoreFinal(scores: {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
}): number {
  const scoreFinal =
    scores.q1 * PONDERACIONES.Q1 +
    scores.q2 * PONDERACIONES.Q2 +
    scores.q3 * PONDERACIONES.Q3 +
    scores.q4 * PONDERACIONES.Q4 +
    scores.q5 * PONDERACIONES.Q5;

  return Math.round(scoreFinal);
}

/**
 * Calcula las 5 métricas de habilidades transversales según fórmulas oficiales
 *
 * Fórmulas:
 * - comprehension = (q1 * 0.4 + q2 * 0.3) / 0.7
 * - criticalThinking = (q1 * 0.6 + q3 * 0.4) / 1.0
 * - selfRegulation = (q4 * 0.5 + q5 * 0.4) / 0.9
 * - practicalApplication = (q2 * 0.7 + q3 * 0.6) / 1.3
 * - metacognition = (q4 * 0.5 + q5 * 0.6) / 1.1
 */
export function calcularSkillsMetrics(scores: {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
}): {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
} {
  const { q1, q2, q3, q4, q5 } = scores;

  const comprehension = Math.round((q1 * 0.4 + q2 * 0.3) / 0.7);
  const criticalThinking = Math.round((q1 * 0.6 + q3 * 0.4) / 1.0);
  const selfRegulation = Math.round((q4 * 0.5 + q5 * 0.4) / 0.9);
  const practicalApplication = Math.round((q2 * 0.7 + q3 * 0.6) / 1.3);
  const metacognition = Math.round((q4 * 0.5 + q5 * 0.6) / 1.1);

  // Asegurar rango 0-100
  return {
    comprehension: Math.max(0, Math.min(100, comprehension)),
    criticalThinking: Math.max(0, Math.min(100, criticalThinking)),
    selfRegulation: Math.max(0, Math.min(100, selfRegulation)),
    practicalApplication: Math.max(0, Math.min(100, practicalApplication)),
    metacognition: Math.max(0, Math.min(100, metacognition))
  };
}

/**
 * Convierte un nivel (1-4) al puntaje correspondiente
 */
export function nivelAPuntaje(nivel: 1 | 2 | 3 | 4): number {
  switch (nivel) {
    case 4:
      return NIVELES.NIVEL_4.puntaje;
    case 3:
      return NIVELES.NIVEL_3.puntaje;
    case 2:
      return NIVELES.NIVEL_2.puntaje;
    case 1:
      return NIVELES.NIVEL_1.puntaje;
    default:
      throw new Error(`Nivel inválido: ${nivel}. Debe ser 1, 2, 3 o 4.`);
  }
}
