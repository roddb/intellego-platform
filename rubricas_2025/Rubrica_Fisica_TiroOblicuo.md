# RÚBRICA - FÍSICA: TIRO OBLICUO
## Colegio Santo Tomás de Aquino - 4to Año

---

## Contenidos Evaluados
- Descomposición de velocidad inicial en componentes
- Movimiento parabólico (horizontal uniforme + vertical acelerado)
- Altura máxima y alcance horizontal
- Tiro horizontal (caso particular con θ = 0)

---

## EJERCICIO TIPO 1: Tiro Oblicuo desde el Suelo

**Contexto típico:** Se lanza un proyectil con velocidad v₀ y ángulo θ desde el suelo. Calcular altura máxima y alcance.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: v₀, θ, g, y₀ = 0. Comprende que el movimiento es parabólico: horizontal (MRU) + vertical (tiro vertical). Reconoce que en h_max, v_y = 0. | Identifica datos principales. Comprende la naturaleza del movimiento. | Datos parciales. Comprensión superficial del movimiento parabólico. | No identifica datos o no comprende el tiro oblicuo. |
| **F2: Identificación de Variables** | v₀ (m/s), θ (°), g = 10 m/s². Calcula v₀ₓ = v₀cosθ, v₀ᵧ = v₀sinθ. Identifica h_max y alcance R como incógnitas. | Variables correctas. Descompone v₀ correctamente. | Algunas variables. Error en descomposición o valores trigonométricos. | Variables incorrectas o sin descomposición. |
| **F3: Selección de Herramientas** | h_max = (v₀sinθ)²/(2g), t_vuelo = 2v₀sinθ/g, R = v₀ₓ × t_vuelo = v₀²sin(2θ)/g. | Ecuaciones correctas con alguna omisión. | Una ecuación correcta, falta otra clave. | Ecuaciones incorrectas. |
| **F4: Estrategia y Ejecución** | Calcula componentes, h_max, t_vuelo, R. Usa valores trigonométricos correctos (sin30° = 0.5, cos30° = √3/2 ≈ 0.866). Resultados con unidades. | Procedimiento correcto con error de cálculo o trigonometría menor. | Procedimiento reconocible con varios errores. | Sin procedimiento o cálculos erróneos. |

### Ejemplo de resolución esperada:

```
Datos: v₀ = 20 m/s, θ = 30°, g = 10 m/s²

Componentes:
v₀ₓ = v₀cos30° = 20 × 0.866 = 17.32 m/s
v₀ᵧ = v₀sin30° = 20 × 0.5 = 10 m/s

a) Altura máxima:
h_max = v₀ᵧ²/(2g) = 10²/(2×10) = 100/20 = 5 m

b) Alcance horizontal:
t_vuelo = 2v₀ᵧ/g = 2×10/10 = 2 s
R = v₀ₓ × t_vuelo = 17.32 × 2 = 34.64 m

(o directamente: R = v₀²sin(2×30°)/g = 400×sin60°/10 = 400×0.866/10 = 34.64 m)
```

---

## EJERCICIO TIPO 2: Tiro Horizontal (desde altura)

**Contexto típico:** Se lanza horizontalmente un objeto desde cierta altura. Determinar si pasa por encima/debajo de un obstáculo.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: h₀ (altura inicial), v₀ₓ (horizontal), v₀ᵧ = 0. Comprende que debe calcular y(t) cuando x = d_obstáculo y comparar con altura del obstáculo. | Identifica datos. Comprende que debe encontrar posición en x dado. | Datos parciales. No comprende cómo vincular x con y. | No identifica datos o no comprende el problema. |
| **F2: Identificación de Variables** | h₀ (m), v₀ₓ (m/s), v₀ᵧ = 0, g = 10 m/s², x_obs (m), y_obs (m). Incógnita: y cuando x = x_obs. | Variables correctas. Reconoce v₀ᵧ = 0 para tiro horizontal. | Algunas variables. Confunde tiro horizontal con oblicuo. | Variables incorrectas. |
| **F3: Selección de Herramientas** | x = v₀ₓ·t → t = x/v₀ₓ, y = h₀ - ½gt². Sustituir t en y para obtener y(x). | Ecuaciones correctas con método claro. | Ecuaciones parciales o método incompleto. | Ecuaciones incorrectas. |
| **F4: Estrategia y Ejecución** | Calcula t cuando x = x_obs. Calcula y en ese instante. Compara y con y_obs. Concluye V o F con justificación. | Procedimiento correcto con error de cálculo. | Procedimiento con errores pero idea correcta. | Sin procedimiento o conclusión sin justificación. |

### Ejemplo de resolución esperada:

```
Datos: h₀ = 5 m, v₀ₓ = 10 m/s, v₀ᵧ = 0, g = 10 m/s²
       Obstáculo: x_obs = 12 m, y_obs = 2 m (red)

Paso 1: Tiempo para llegar a x = 12 m
x = v₀ₓ·t → t = x/v₀ₓ = 12/10 = 1.2 s

Paso 2: Altura cuando x = 12 m
y = h₀ - ½gt² = 5 - ½×10×(1.2)² = 5 - 5×1.44 = 5 - 7.2 = -2.2 m

Interpretación: y = -2.2 m significa que ya llegó al suelo (y < 0).
La piedra toca el suelo antes de llegar a x = 12 m.

Verificación: ¿Cuándo toca el suelo?
0 = 5 - 5t² → t² = 1 → t = 1 s
x_suelo = 10 × 1 = 10 m < 12 m

Conclusión: FALSO - La piedra NO pasa por encima de la red porque 
cae al suelo a 10 m, antes de llegar a los 12 m donde está la red.
```

---

## FÓRMULAS CLAVE

| Concepto | Fórmula |
|----------|---------|
| Componente horizontal | v₀ₓ = v₀·cosθ |
| Componente vertical | v₀ᵧ = v₀·sinθ |
| Posición horizontal | x(t) = v₀ₓ·t |
| Posición vertical | y(t) = h₀ + v₀ᵧ·t - ½·g·t² |
| Altura máxima | h_max = (v₀·sinθ)²/(2g) |
| Tiempo de vuelo | t_vuelo = 2v₀·sinθ/g |
| Alcance | R = v₀²·sin(2θ)/g |

---

## VALORES TRIGONOMÉTRICOS FRECUENTES

| Ángulo | sin | cos | sin(2θ) |
|--------|-----|-----|---------|
| 30° | 0.5 | 0.866 | 0.866 |
| 45° | 0.707 | 0.707 | 1.0 |
| 60° | 0.866 | 0.5 | 0.866 |

---

## CASOS ESPECIALES

| Caso | Condición | Características |
|------|-----------|-----------------|
| **Tiro horizontal** | θ = 0° | v₀ᵧ = 0, v₀ₓ = v₀ |
| **Máximo alcance** | θ = 45° | R = v₀²/g (máximo) |
| **Ángulos complementarios** | θ₁ + θ₂ = 90° | Mismo alcance R |

---

## ERRORES COMUNES A DETECTAR

| Error | Penalización sugerida |
|-------|----------------------|
| No descomponer v₀ en componentes | -5 pts en Fase 2 |
| Invertir sin y cos | -3 pts en Fase 2 |
| Usar v₀ en lugar de v₀ᵧ para h_max | -4 pts en Fase 3 |
| No reconocer v₀ᵧ = 0 en tiro horizontal | -3 pts en Fase 1 |
| Error en valores trigonométricos | -2 pts en Fase 4 |
| No interpretar resultado negativo de y | -3 pts en Fase 4 |

---

## PLANILLA DE REGISTRO - TIRO OBLICUO

### Alumno: _________________ Fecha: _________

| Ejercicio | Fase 1 (/12.5) | Fase 2 (/12.5) | Fase 3 (/12.5) | Fase 4 (/12.5) | Subtotal (/50) |
|-----------|----------------|----------------|----------------|----------------|----------------|
| Ej. 1: Tiro Oblicuo | | | | | |
| Ej. 2: Tiro Horizontal V/F | | | | | |
| **TOTAL** | | | | | **/100** |

**Observaciones:**

---

*Instituto Santo Tomás de Aquino - 2025*
