# RÚBRICA GENÉRICA PARA CORRECCIÓN DE EXÁMENES

**Sistema**: Intellego Platform - Evaluación Automática
**Versión**: 1.1
**Fecha**: Octubre 2025
**Modelo**: Claude Haiku 4.5
**Última modificación**: 23 de Octubre 2025 - Eliminada D5 (Verificación), redistribuido 10% equitativamente

---

## 🎯 Objetivo de la Rúbrica

Evaluar exámenes de **cualquier materia** (Física, Química, Matemática, etc.) de forma consistente y objetiva usando 4 dimensiones universales de resolución de problemas.

Esta rúbrica es **agnóstica del contenido**: evalúa el proceso de pensamiento y resolución, no el conocimiento específico de la materia.

---

## 📊 Sistema de Evaluación

### Dimensiones (4 totales)

| Dimensión | Peso | Descripción |
|-----------|------|-------------|
| **D1: Comprensión** | 27.5% | Entendimiento del problema planteado |
| **D2: Metodología** | 27.5% | Selección de estrategia/herramientas |
| **D3: Ejecución** | 27.5% | Desarrollo y cálculos |
| **D4: Justificación** | 17.5% | Razonamiento y explicaciones |

### Niveles de Desempeño (4 totales)

| Nivel | Rango | Puntaje | Descriptor |
|-------|-------|---------|------------|
| **Nivel 4** | 85-100 | 92.5 | Excelente |
| **Nivel 3** | 70-84 | 77 | Bueno |
| **Nivel 2** | 55-69 | 62 | En desarrollo |
| **Nivel 1** | 0-54 | 27 | Inicial |

### Cálculo del Score Final

```
Score = (D1 × 0.275) + (D2 × 0.275) + (D3 × 0.275) + (D4 × 0.175)
```

Donde cada D(n) toma el puntaje del nivel asignado (92.5, 77, 62, o 27).

**Ejemplo**:
```
D1 = Nivel 3 (77)
D2 = Nivel 4 (92.5)
D3 = Nivel 2 (62)
D4 = Nivel 3 (77)

Score = (77 × 0.275) + (92.5 × 0.275) + (62 × 0.275) + (77 × 0.175)
      = 21.175 + 25.4375 + 17.05 + 13.475
      = 77.1375 ≈ 77/100
```

---

## 📋 DIMENSIÓN 1: COMPRENSIÓN DEL PROBLEMA (27.5%)

**Evalúa**: ¿El estudiante entiende qué se le está pidiendo?

### Nivel 4 - EXCELENTE (85-100 → 92.5)

**Descriptor**:
- Identifica con precisión el objetivo del problema
- Reconoce todas las variables relevantes e ignora las irrelevantes
- Comprende el contexto físico/químico/matemático del problema
- Reformula el problema con sus propias palabras de forma clara

**Indicadores clave**:
- ✅ Explicación del "qué se busca" al inicio
- ✅ Lista explícita de datos conocidos vs incógnitas
- ✅ Identificación del tipo de problema (ej: "tiro oblicuo", "estequiometría", "ecuación cuadrática")
- ✅ Diagrama o esquema que muestra comprensión visual

**Ejemplo (Física - Tiro Oblicuo)**:
> "El problema pide calcular el alcance máximo de un proyectil lanzado a 20 m/s con ángulo de 30°. Necesito encontrar la distancia horizontal (X) donde cae. Datos: V0 = 20 m/s, θ = 30°, g = 10 m/s². Incógnita: Alcance máximo (X)."

---

### Nivel 3 - BUENO (70-84 → 77)

**Descriptor**:
- Identifica el objetivo del problema correctamente
- Reconoce la mayoría de variables relevantes
- Comprende el contexto general del problema
- Descripción del problema coherente

**Indicadores clave**:
- ✅ Identifica qué calcular
- ⚠️ Puede omitir alguna variable relevante menor
- ✅ Entiende el tipo de problema
- ⚠️ Diagrama ausente o simplificado

**Ejemplo**:
> "Calcular el alcance. Datos: V0 = 20 m/s, θ = 30°. Es un problema de tiro oblicuo."

---

### Nivel 2 - EN DESARROLLO (55-69 → 62)

**Descriptor**:
- Identifica parcialmente el objetivo
- Confunde algunas variables relevantes/irrelevantes
- Comprensión superficial del contexto
- Descripción vaga o incompleta

**Indicadores clave**:
- ⚠️ Objetivo identificado pero no completamente claro
- ❌ Omite variables importantes o incluye irrelevantes
- ⚠️ Comprensión básica del tipo de problema
- ❌ Sin diagrama ni reformulación

**Ejemplo**:
> "Hay que calcular algo con una pelota que se lanza."

---

### Nivel 1 - INICIAL (0-54 → 27)

**Descriptor**:
- No identifica claramente el objetivo
- No distingue variables relevantes de irrelevantes
- Comprensión muy limitada del contexto
- Sin reformulación del problema

**Indicadores clave**:
- ❌ No queda claro qué quiere calcular
- ❌ Lista de datos confusa o ausente
- ❌ No reconoce el tipo de problema
- ❌ Comienza directamente con cálculos sin planificación

---

## 📋 DIMENSIÓN 2: METODOLOGÍA Y ESTRATEGIA (27.5%)

**Evalúa**: ¿El estudiante selecciona las herramientas/fórmulas/estrategias correctas?

### Nivel 4 - EXCELENTE (85-100 → 92.5)

**Descriptor**:
- Selecciona las fórmulas/leyes/conceptos exactos necesarios
- Justifica por qué elige esa metodología
- Organiza el desarrollo en pasos lógicos
- Adapta la estrategia si es necesario

**Indicadores clave**:
- ✅ Fórmulas correctas y completas
- ✅ Explicación de por qué usa esas fórmulas
- ✅ Desarrollo organizado por etapas (ej: "Primero Vox, luego tiempo, finalmente alcance")
- ✅ Conoce cuándo aplicar cada herramienta

**Ejemplo (Física)**:
> "Para calcular alcance en tiro oblicuo, primero descompongo la velocidad inicial en Vox = V0·cos(θ) y Voy = V0·sen(θ). Luego calculo el tiempo de vuelo con t = 2·Voy/g (porque parte y termina a la misma altura). Finalmente X = Vox · t."

---

### Nivel 3 - BUENO (70-84 → 77)

**Descriptor**:
- Selecciona fórmulas/conceptos correctos en su mayoría
- Organización adecuada del desarrollo
- Estrategia coherente aunque sin justificación explícita
- Metodología estándar sin adaptaciones

**Indicadores clave**:
- ✅ Fórmulas correctas
- ⚠️ Sin explicar por qué las usa
- ✅ Pasos lógicos
- ⚠️ Método directo sin flexibilidad

**Ejemplo**:
> "Vox = V0·cos(θ), Voy = V0·sen(θ), t = 2·Voy/g, X = Vox·t"

---

### Nivel 2 - EN DESARROLLO (55-69 → 62)

**Descriptor**:
- Selecciona algunas fórmulas correctas pero con errores
- Organización irregular o confusa
- Estrategia parcialmente correcta
- Puede usar herramientas innecesarias o faltar necesarias

**Indicadores clave**:
- ⚠️ Fórmulas correctas pero incompletas
- ❌ Falta alguna fórmula clave
- ⚠️ Desarrollo desordenado
- ❌ Puede usar métodos no aplicables

**Ejemplo**:
> "Vox = V0·cos(θ) = ... [correcto]
> X = Vox / g [incorrecto - falta tiempo]"

---

### Nivel 1 - INICIAL (0-54 → 27)

**Descriptor**:
- Selecciona fórmulas incorrectas o no selecciona ninguna
- Sin organización del desarrollo
- Estrategia confusa o ausente
- Metodología no coherente con el problema

**Indicadores clave**:
- ❌ Fórmulas incorrectas o mezcladas
- ❌ Sin pasos lógicos
- ❌ Intentos al azar
- ❌ No hay estrategia clara

---

## 📋 DIMENSIÓN 3: EJECUCIÓN Y CÁLCULOS (27.5%)

**Evalúa**: ¿El estudiante ejecuta correctamente los pasos seleccionados?

### Nivel 4 - EXCELENTE (85-100 → 92.5)

**Descriptor**:
- Todos los cálculos son correctos
- Manejo impecable de unidades
- Precisión numérica adecuada
- Trabajo ordenado y fácil de seguir

**Indicadores clave**:
- ✅ Resultado numérico correcto
- ✅ Unidades correctas en cada paso
- ✅ Redondeo apropiado (2-3 decimales)
- ✅ Cálculos intermedios mostrados

**Ejemplo**:
> "Vox = 20 m/s · cos(30°) = 20 · 0.866 = 17.32 m/s ✓
> Voy = 20 m/s · sen(30°) = 20 · 0.5 = 10 m/s ✓
> t = 2 · 10 m/s / 10 m/s² = 2 s ✓
> X = 17.32 m/s · 2 s = 34.64 m ✓"

---

### Nivel 3 - BUENO (70-84 → 77)

**Descriptor**:
- La mayoría de cálculos correctos
- Manejo generalmente correcto de unidades
- Errores menores que no afectan la lógica
- Trabajo ordenado

**Indicadores clave**:
- ✅ Resultado final correcto o con error menor (<5%)
- ✅ Unidades presentes (pueden faltar en pasos intermedios)
- ⚠️ Algún error de redondeo
- ✅ Desarrollo legible

**Ejemplo**:
> "Vox = 20 · 0.87 = 17.4 m/s [error menor en cos(30°)]
> Voy = 20 · 0.5 = 10 m/s ✓
> t = 20/10 = 2 s ✓
> X = 17.4 · 2 = 34.8 m [resultado ligeramente diferente pero aceptable]"

---

### Nivel 2 - EN DESARROLLO (55-69 → 62)

**Descriptor**:
- Varios errores de cálculo
- Manejo inconsistente de unidades
- Errores que afectan resultado final significativamente
- Trabajo parcialmente ordenado

**Indicadores clave**:
- ❌ Resultado final incorrecto (error >10%)
- ⚠️ Unidades ausentes o incorrectas
- ❌ Errores conceptuales en cálculos (ej: cos por sen)
- ⚠️ Desarrollo difícil de seguir

**Ejemplo**:
> "Vox = 20 · sen(30°) = 10 [confusión cos/sen]
> t = 10/10 = 1 s [correcto por coincidencia]
> X = 10 · 1 = 10 m [resultado muy incorrecto]"

---

### Nivel 1 - INICIAL (0-54 → 27)

**Descriptor**:
- Mayoría de cálculos incorrectos
- Sin manejo de unidades
- Errores fundamentales que invalidan el resultado
- Trabajo desorganizado o incomprensible

**Indicadores clave**:
- ❌ Resultado completamente incorrecto
- ❌ Sin unidades
- ❌ Operaciones incorrectas (ej: suma en vez de multiplicación)
- ❌ Imposible seguir la lógica

---

## 📋 DIMENSIÓN 4: JUSTIFICACIÓN Y RAZONAMIENTO (17.5%)

**Evalúa**: ¿El estudiante explica su razonamiento lógico?

### Nivel 4 - EXCELENTE (85-100 → 92.5)

**Descriptor**:
- Justifica cada paso del desarrollo
- Explica por qué usa cada fórmula
- Conecta pasos entre sí lógicamente
- Anticipa posibles confusiones

**Indicadores clave**:
- ✅ Explicaciones textuales entre cálculos
- ✅ Justificación de elecciones (ej: "uso cos porque es componente horizontal")
- ✅ Coherencia narrativa del desarrollo
- ✅ Aclaraciones preventivas (ej: "notar que θ está en grados")

**Ejemplo**:
> "Uso cos(30°) para Vox porque el coseno da la componente horizontal de un vector. Como queremos el alcance (distancia horizontal), necesitamos la velocidad horizontal."

---

### Nivel 3 - BUENO (70-84 → 77)

**Descriptor**:
- Justifica algunos pasos clave
- Explicaciones breves pero correctas
- Coherencia en el desarrollo
- Sin explicaciones preventivas

**Indicadores clave**:
- ✅ Algunas explicaciones presentes
- ⚠️ No justifica todo
- ✅ Lógica clara aunque implícita
- ⚠️ Asume conocimiento sin aclarar

**Ejemplo**:
> "Vox es con coseno y Voy con seno por las componentes."

---

### Nivel 2 - EN DESARROLLO (55-69 → 62)

**Descriptor**:
- Justificaciones escasas o superficiales
- Explicaciones genéricas
- Coherencia parcial
- Saltos lógicos no explicados

**Indicadores clave**:
- ⚠️ Muy pocas explicaciones
- ❌ Justificaciones vagas
- ⚠️ Desarrollo difícil de seguir sin conocimiento previo
- ❌ No explica por qué hace cada cosa

---

### Nivel 1 - INICIAL (0-54 → 27)

**Descriptor**:
- Sin justificaciones
- Solo cálculos sin explicación
- Sin coherencia narrativa
- Imposible entender el razonamiento

**Indicadores clave**:
- ❌ Cero explicaciones
- ❌ Solo números y fórmulas
- ❌ No se entiende por qué hace lo que hace

---

## 🎯 Ejemplos Completos de Evaluación

### Ejemplo 1: Examen Excelente (Score: 92)

**Ejercicio**: Calcular tiempo de vuelo de proyectil con V0=15 m/s, θ=45°

**Respuesta del estudiante**:
```
Comprendo que debo calcular el tiempo total desde el lanzamiento hasta que
cae al suelo. Datos: V0=15 m/s, θ=45°, g=10 m/s². Incógnita: tiempo de vuelo.

Descompongo la velocidad:
Voy = 15·sen(45°) = 15·0.707 = 10.6 m/s (componente vertical)

Para el tiempo de vuelo uso t = 2·Voy/g porque el proyectil vuelve
al mismo nivel de altura:
t = 2·10.6/10 = 2.12 s

Verifico: en el punto más alto (t/2 = 1.06s), la altura es h=Voy²/2g = 112/20 = 5.6m,
lo que parece razonable para esta velocidad inicial.
```

**Evaluación**:
- D1 (Comprensión): Nivel 4 (92.5) - Reformula problema, identifica datos
- D2 (Metodología): Nivel 4 (92.5) - Fórmula correcta, justificada
- D3 (Ejecución): Nivel 4 (92.5) - Cálculos precisos, unidades correctas
- D4 (Justificación): Nivel 4 (92.5) - Explica por qué usa cada fórmula

**Score Final**: (92.5 × 0.275) + (92.5 × 0.275) + (92.5 × 0.275) + (92.5 × 0.175) = 92.5/100

---

### Ejemplo 2: Examen Bueno (Score: 83)

**Misma pregunta**

**Respuesta del estudiante**:
```
Calcular tiempo de vuelo.
Voy = 15·sen(45°) = 10.6 m/s
t = 2·10.6/10 = 2.12 s
```

**Evaluación**:
- D1: Nivel 3 (77) - Identifica objetivo pero sin reformular
- D2: Nivel 4 (92.5) - Fórmula correcta
- D3: Nivel 4 (92.5) - Cálculos correctos
- D4: Nivel 2 (62) - Sin explicaciones

**Score Final**: (77 × 0.275) + (92.5 × 0.275) + (92.5 × 0.275) + (62 × 0.175) = 82.9 ≈ 83/100

---

### Ejemplo 3: En Desarrollo (Score: 56)

**Misma pregunta**

**Respuesta del estudiante**:
```
t = 2·15/10 = 3 s
```

**Evaluación**:
- D1: Nivel 2 (62) - Solo identifica variable a calcular
- D2: Nivel 2 (62) - Fórmula incompleta (falta sen(θ))
- D3: Nivel 2 (62) - Cálculo incorrecto pero metodología visible
- D4: Nivel 1 (27) - Sin justificación

**Score Final**: (62 × 0.275) + (62 × 0.275) + (62 × 0.275) + (27 × 0.175) = 55.9 ≈ 56/100

---

## 📌 Notas de Uso para el Modelo AI

### Al Evaluar un Examen:

1. **Lee el examen completo primero** antes de evaluar
2. **Evalúa ejercicio por ejercicio** asignando niveles a cada dimensión
3. **Sé consistente**: Usa los descriptores exactos de cada nivel
4. **Prioriza el proceso sobre el resultado**: Un estudiante con metodología correcta pero un error de cálculo merece D2=Nivel 4, D3=Nivel 3
5. **Documenta tu razonamiento**: Para cada nivel asignado, cita evidencia específica del examen

### Formato de Output Esperado:

```json
{
  "scores": {
    "D1_COMPRENSION": { "nivel": 3, "puntaje": 77, "evidencia": "..." },
    "D2_METODOLOGIA": { "nivel": 4, "puntaje": 92.5, "evidencia": "..." },
    "D3_EJECUCION": { "nivel": 3, "puntaje": 77, "evidencia": "..." },
    "D4_JUSTIFICACION": { "nivel": 2, "puntaje": 62, "evidencia": "..." }
  },
  "totalScore": 77,
  "exerciseAnalysis": [
    {
      "exerciseNumber": 1,
      "scores": { "D1": 3, "D2": 4, "D3": 3, "D4": 2 },
      "feedback": "..."
    }
  ]
}
```

---

**Fin de la Rúbrica Genérica v1.1**
