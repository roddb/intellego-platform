# RÚBRICA - FÍSICA: CAÍDA LIBRE Y TIRO VERTICAL
## Colegio Santo Tomás de Aquino - 4to Año

---

## Contenidos Evaluados
- Caída libre (v₀ = 0)
- Tiro vertical hacia arriba
- Altura máxima y tiempos de vuelo
- Análisis de afirmaciones con cálculos

---

## EJERCICIO TIPO 1: Caída Libre

**Contexto típico:** Se deja caer un objeto desde cierta altura. Calcular tiempo de caída y velocidad de impacto.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: altura inicial h, v₀ = 0 (se deja caer), g = 10 m/s². Comprende que debe calcular t y v_f. Define sistema de referencia (hacia abajo positivo o negativo). | Identifica datos principales. Reconoce v₀ = 0. | Datos parciales. No explicita v₀ = 0 o confunde con lanzamiento. | No identifica datos clave o confunde caída libre con tiro vertical. |
| **F2: Identificación de Variables** | h₀ (m), y_f = 0 (suelo), v₀ = 0, g = 10 m/s², t (incógnita), v_f (incógnita). Sistema de referencia claro. | Variables correctas con error menor en sistema de referencia. | Algunas variables. Confusión en signos o referencias. | Variables incorrectas o ausentes. |
| **F3: Selección de Herramientas** | y = y₀ - ½gt² (o h = ½gt²), v = gt, o v² = 2gh. Selecciona las apropiadas para cada incógnita. | Ecuaciones correctas con alguna imprecisión en signos. | Una ecuación correcta, falta otra. | Ecuaciones incorrectas. |
| **F4: Estrategia y Ejecución** | Calcula t = √(2h/g). Calcula v_f = gt o v_f = √(2gh). Resultados con unidades correctas (s, m/s). | Procedimiento correcto con error de cálculo menor. | Procedimiento reconocible con errores. | Sin procedimiento o cálculos erróneos. |

### Ejemplo de resolución esperada:

```
Datos: h = 45 m, v₀ = 0, g = 10 m/s²

a) Tiempo de caída:
   h = ½gt² → t² = 2h/g = 2(45)/10 = 9
   t = 3 s

b) Velocidad de impacto:
   v = gt = 10 × 3 = 30 m/s
   (o v = √(2gh) = √(2 × 10 × 45) = √900 = 30 m/s)
```

---

## EJERCICIO TIPO 2: Tiro Vertical hacia Arriba

**Contexto típico:** Se lanza un objeto hacia arriba con cierta velocidad. Verificar afirmaciones sobre altura máxima y tiempo total.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: v₀ (hacia arriba), y₀ = 0 (desde suelo), g = 10 m/s². Comprende que en h_max la velocidad es cero. Reconoce simetría del movimiento. | Identifica datos principales. Comprende h_max cuando v = 0. | Datos parciales. No comprende la condición de h_max. | No identifica datos o no comprende el tiro vertical. |
| **F2: Identificación de Variables** | v₀ (m/s), g = 10 m/s², h_max (incógnita o dato a verificar), t_subida, t_total = 2t_subida. | Variables correctas. Reconoce la simetría temporal. | Algunas variables. No reconoce t_total = 2t_subida. | Variables incorrectas o incompletas. |
| **F3: Selección de Herramientas** | h_max = v₀²/(2g), t_subida = v₀/g, t_total = 2v₀/g. O usar v = v₀ - gt con v = 0. | Ecuaciones correctas con alguna omisión. | Una ecuación correcta, faltan otras. | Ecuaciones incorrectas. |
| **F4: Estrategia y Ejecución** | Calcula h_max y t_total. Compara con afirmación. Concluye V o F con justificación clara de AMBOS valores. | Procedimiento correcto con error menor. Verifica ambos datos. | Verifica solo uno de los datos o con errores. | Sin procedimiento o conclusión sin justificación. |

### Ejemplo de resolución esperada:

```
Datos: v₀ = 20 m/s, g = 10 m/s²

Afirmación: "h_max = 25 m y t_total = 4 s"

Cálculos:
h_max = v₀²/(2g) = 20²/(2×10) = 400/20 = 20 m ≠ 25 m ✗

t_subida = v₀/g = 20/10 = 2 s
t_total = 2 × t_subida = 2 × 2 = 4 s ✓

Conclusión: FALSO
La altura máxima es 20 m (no 25 m), aunque el tiempo total sí es 4 s.
```

---

## FÓRMULAS CLAVE

| Concepto | Fórmula |
|----------|---------|
| Velocidad | v = v₀ - g·t |
| Posición | y = y₀ + v₀·t - ½·g·t² |
| Sin tiempo | v² = v₀² - 2g·Δy |
| Altura máxima | h_max = v₀²/(2g) |
| Tiempo de subida | t_subida = v₀/g |
| Tiempo total | t_total = 2v₀/g |
| Caída libre | v₀ = 0 |

---

## CASOS ESPECIALES

| Caso | Condición | Resultado |
|------|-----------|-----------|
| **Caída libre** | v₀ = 0, cae desde h | t = √(2h/g), v_f = √(2gh) |
| **Altura máxima** | v = 0 | h_max = v₀²/(2g) |
| **Regreso al suelo** | y = y₀ | t_total = 2v₀/g, v = -v₀ |

---

## ERRORES COMUNES A DETECTAR

| Error | Penalización sugerida |
|-------|----------------------|
| Confundir caída libre con tiro vertical (v₀ ≠ 0) | -4 pts en Fase 1 |
| No reconocer que v = 0 en altura máxima | -3 pts en Fase 1 |
| Error en signos de g o v | -2 pts en Fase 2 |
| Usar fórmulas de MRU en lugar de caída libre | -4 pts en Fase 3 |
| Verificar solo una parte de la afirmación | -3 pts en Fase 4 |
| Error en raíz cuadrada o aritmética | -2 pts en Fase 4 |

---

## PLANILLA DE REGISTRO - CAÍDA LIBRE Y TIRO VERTICAL

### Alumno: _________________ Fecha: _________

| Ejercicio | Fase 1 (/12.5) | Fase 2 (/12.5) | Fase 3 (/12.5) | Fase 4 (/12.5) | Subtotal (/50) |
|-----------|----------------|----------------|----------------|----------------|----------------|
| Ej. 1: Caída Libre | | | | | |
| Ej. 2: Tiro Vertical V/F | | | | | |
| **TOTAL** | | | | | **/100** |

**Observaciones:**

---

*Instituto Santo Tomás de Aquino - 2025*
