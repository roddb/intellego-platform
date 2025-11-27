# RÚBRICA - FÍSICA: MRU Y MRUV
## Colegio Santo Tomás de Aquino - 4to Año

---

## Contenidos Evaluados
- Movimiento Rectilíneo Uniforme (MRU)
- Movimiento Rectilíneo Uniformemente Variado (MRUV)
- Conversión de unidades (km/h ↔ m/s)
- Análisis de movimientos combinados

---

## EJERCICIO TIPO 1: Movimiento Combinado (MRUV + MRU)

**Contexto típico:** Un móvil acelera desde el reposo durante un tiempo, luego continúa a velocidad constante. Calcular velocidad máxima y distancia total.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica las DOS etapas del movimiento (acelerado + uniforme). Reconoce v₀ = 0, a, t₁, t₂. Comprende que la velocidad final del MRUV es la velocidad del MRU. | Identifica las dos etapas. Comprende la conexión entre ellas con alguna imprecisión. | Identifica parcialmente las etapas. Confunde datos entre ellas. | No distingue las dos etapas o no comprende el problema. |
| **F2: Identificación de Variables** | Etapa 1: v₀ = 0, a (m/s²), t₁ (s), v_max (incógnita), d₁ (incógnita). Etapa 2: v = v_max, t₂ (s), d₂ (incógnita). d_total = d₁ + d₂. | Variables correctas con error menor. Identifica la mayoría. | Algunas variables correctas. Confunde tiempos o distancias. | Variables incorrectas o muy incompletas. |
| **F3: Selección de Herramientas** | MRUV: v = v₀ + at, x = v₀t + ½at². MRU: x = vt. Selecciona correctamente para cada etapa. | Ecuaciones correctas con alguna omisión o error menor. | Una ecuación correcta, falta la otra o mal aplicada. | Ecuaciones incorrectas o inaplicables. |
| **F4: Estrategia y Ejecución** | Calcula v_max = at₁. Calcula d₁ = ½at₁². Calcula d₂ = v_max × t₂. Suma d_total. Resultados con unidades. | Procedimiento correcto con error de cálculo menor. | Procedimiento reconocible con varios errores. | Sin procedimiento claro o cálculos erróneos. |

### Ejemplo de resolución esperada:

```
Datos: v₀ = 0, a = 2 m/s², t₁ = 10 s, t₂ = 20 s

ETAPA 1 (MRUV):
a) v_max = v₀ + at₁ = 0 + 2 × 10 = 20 m/s
   d₁ = v₀t₁ + ½at₁² = 0 + ½ × 2 × 10² = 100 m

ETAPA 2 (MRU):
   d₂ = v_max × t₂ = 20 × 20 = 400 m

b) d_total = d₁ + d₂ = 100 + 400 = 500 m
```

---

## EJERCICIO TIPO 2: Frenado (MRUV con desaceleración)

**Contexto típico:** Un móvil frena con desaceleración constante. Determinar si se detiene antes, en, o después de cierto punto.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: v₀ (convierte km/h a m/s), a < 0 (desaceleración), distancia al obstáculo. Comprende que debe calcular distancia de frenado y comparar. | Identifica datos principales. Comprende que debe comparar distancias. | Datos parciales. No convierte unidades o no comprende la comparación. | No identifica datos clave o no comprende el problema. |
| **F2: Identificación de Variables** | v₀ (m/s), v_f = 0 (se detiene), a = -2 m/s² (negativa), d_frenado (incógnita), d_obstáculo (dato). | Variables correctas. Reconoce a como negativa o su módulo. | Algunas variables. Error en signo de a o en conversión. | Variables incorrectas o ausentes. |
| **F3: Selección de Herramientas** | v² = v₀² + 2aΔx → Δx = (v² - v₀²)/(2a) o Δx = v₀²/(2|a|). Criterio: comparar d_frenado con d_obstáculo. | Ecuación correcta con criterio de comparación. | Ecuación correcta pero sin criterio claro. | Ecuación incorrecta. |
| **F4: Estrategia y Ejecución** | Convierte 36 km/h = 10 m/s. Calcula d_frenado. Compara con d_obstáculo. Concluye V o F con justificación. | Procedimiento correcto con error de cálculo o conclusión imprecisa. | Procedimiento con errores pero idea correcta. | Sin procedimiento o conclusión sin justificación. |

### Ejemplo de resolución esperada:

```
Datos: v₀ = 36 km/h = 10 m/s, a = -2 m/s², d_obstáculo = 25 m

Usando v² = v₀² + 2aΔx con v = 0 (se detiene):
0 = 10² + 2(-2)Δx
0 = 100 - 4Δx
Δx = 100/4 = 25 m

Comparación: d_frenado = 25 m = d_obstáculo

Conclusión: VERDADERO - El ciclista se detiene exactamente en el obstáculo.
```

---

## FÓRMULAS CLAVE

| Movimiento | Fórmulas |
|------------|----------|
| **MRU** | x = x₀ + v·t |
| **MRUV** | v = v₀ + a·t |
| **MRUV** | x = x₀ + v₀·t + ½·a·t² |
| **MRUV** | v² = v₀² + 2a·Δx |

---

## CONVERSIONES IMPORTANTES

| De | A | Factor |
|----|---|--------|
| km/h | m/s | ÷ 3.6 |
| m/s | km/h | × 3.6 |
| 36 km/h | 10 m/s | (dato frecuente) |

---

## ERRORES COMUNES A DETECTAR

| Error | Penalización sugerida |
|-------|----------------------|
| No convertir km/h a m/s | -3 pts en Fase 2 |
| Olvidar el signo negativo en desaceleración | -2 pts en Fase 2 |
| No separar las etapas del movimiento | -4 pts en Fase 1 |
| Usar fórmula de MRU en etapa acelerada | -4 pts en Fase 3 |
| No comparar distancias en ejercicio de V/F | -3 pts en Fase 4 |
| Error aritmético | -2 pts en Fase 4 |

---

## PLANILLA DE REGISTRO - MRU Y MRUV

### Alumno: _________________ Fecha: _________

| Ejercicio | Fase 1 (/12.5) | Fase 2 (/12.5) | Fase 3 (/12.5) | Fase 4 (/12.5) | Subtotal (/50) |
|-----------|----------------|----------------|----------------|----------------|----------------|
| Ej. 1: Mov. Combinado | | | | | |
| Ej. 2: Frenado V/F | | | | | |
| **TOTAL** | | | | | **/100** |

**Observaciones:**

---

*Instituto Santo Tomás de Aquino - 2025*
