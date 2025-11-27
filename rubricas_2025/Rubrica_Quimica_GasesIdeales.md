# RÚBRICA - QUÍMICA: GASES IDEALES
## Colegio Santo Tomás de Aquino - 4to Año

---

## Contenidos Evaluados
- Ecuación de estado de gases ideales (PV = nRT)
- Ecuación combinada de gases
- Procesos isotérmicos, isobáricos e isocóricos
- Conversión de temperaturas (°C ↔ K)

---

## EJERCICIO TIPO 1: Cambio de Condiciones (Ecuación Combinada)

**Contexto típico:** Un gas cambia de condiciones iniciales a finales. Calcular la nueva presión/volumen/temperatura.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica: P₁, V₁, T₁, P₂, V₂, T₂. Reconoce qué variable es incógnita. Comprende que T debe estar en Kelvin. Identifica si n es constante. | Identifica datos principales. Reconoce necesidad de Kelvin. | Datos parciales. No convierte a Kelvin o confunde variables. | No identifica datos o no comprende el problema. |
| **F2: Identificación de Variables** | P₁ (atm), V₁ (L), T₁ (K), P₂ (atm), V₂ (L), T₂ (K). Convierte °C a K correctamente (T(K) = T(°C) + 273). | Variables correctas con conversiones adecuadas. | Algunas variables. Error en conversión de temperatura. | Variables incorrectas o sin conversiones. |
| **F3: Selección de Herramientas** | P₁V₁/T₁ = P₂V₂/T₂ (si n constante). Despeje correcto de la incógnita. O PV = nRT si pide moles. | Ecuación correcta con despeje adecuado. | Ecuación correcta pero despeje incorrecto. | Ecuación incorrecta. |
| **F4: Estrategia y Ejecución** | Convierte temperaturas. Sustituye valores. Calcula correctamente. Resultado con unidades apropiadas. | Procedimiento correcto con error de cálculo menor. | Procedimiento reconocible con errores. | Sin procedimiento o cálculos erróneos. |

### Ejemplo de resolución esperada:

```
Datos: P₁ = 1.50 atm, V₁ = 2.00 L, T₁ = 27°C
       V₂ = 0.500 L (500 mL), T₂ = -23°C

Conversión de temperaturas:
T₁ = 27 + 273 = 300 K
T₂ = -23 + 273 = 250 K

a) Presión final (usando ecuación combinada):
P₁V₁/T₁ = P₂V₂/T₂
P₂ = P₁V₁T₂/(T₁V₂)
P₂ = (1.50 × 2.00 × 250)/(300 × 0.500)
P₂ = 750/150 = 5.00 atm

b) Moles de oxígeno (usando PV = nRT con estado inicial):
n = P₁V₁/(RT₁) = (1.50 × 2.00)/(0.082 × 300)
n = 3.00/24.6 = 0.122 mol
```

---

## EJERCICIO TIPO 2: Proceso Específico (Isocórico, Isotérmico, Isobárico)

**Contexto típico:** Un gas en recipiente rígido (isocórico) se calienta. Verificar una afirmación sobre el cambio de presión.

| FASE | EXCELENTE (12.5-11 pts) | BUENO (10-8 pts) | REGULAR (7-5 pts) | INSUFICIENTE (4-0 pts) |
|------|-------------------------|------------------|-------------------|------------------------|
| **F1: Comprensión del Problema** | Identifica el tipo de proceso (rígido = isocórico, V constante). Comprende que P/T = constante. Reconoce que T debe ser en Kelvin, no °C. | Identifica proceso y condiciones. Comprende relación P-T. | Datos parciales. No identifica tipo de proceso claramente. | No identifica el proceso o confunde conceptos. |
| **F2: Identificación de Variables** | P₁ (atm), T₁ (K), P₂ (incógnita), T₂ (K). V = constante (no aparece). Convierte ambas T a Kelvin. | Variables correctas. Conversiones adecuadas. | Algunas variables. Error en conversión o identificación. | Variables incorrectas. |
| **F3: Selección de Herramientas** | Proceso isocórico: P₁/T₁ = P₂/T₂. Reconoce que la relación es proporcional a T en Kelvin, no a ΔT en °C. | Ecuación correcta para el proceso. | Ecuación genérica en vez de específica. | Ecuación incorrecta. |
| **F4: Estrategia y Ejecución** | Calcula P₂ = P₁T₂/T₁. Compara con afirmación. Explica por qué la temperatura en Kelvin determina la proporción, no el cambio en °C. | Cálculo correcto con explicación de la falacia. | Cálculo correcto pero explicación pobre. | Cálculo erróneo o sin explicación. |

### Ejemplo de resolución esperada:

```
Datos: n = 3.00 mol de N₂, T₁ = 25°C, P₁ = 2.00 atm, T₂ = 127°C
Recipiente rígido → V constante (proceso isocórico)

Afirmación: "La presión se duplica porque T aumentó 100°C"

Conversión de temperaturas:
T₁ = 25 + 273 = 298 K
T₂ = 127 + 273 = 400 K

Cálculo (proceso isocórico):
P₁/T₁ = P₂/T₂
P₂ = P₁ × T₂/T₁ = 2.00 × 400/298 = 2.68 atm

Verificación de la afirmación:
- Si P se duplicara: P₂ = 4.00 atm
- Calculado: P₂ = 2.68 atm ≠ 4.00 atm

Conclusión: FALSO

Explicación: La presión NO se duplica. El error está en pensar que 
"aumentar 100°C" duplica la presión. La relación P/T requiere 
temperaturas absolutas (Kelvin):
- T₂/T₁ = 400/298 = 1.34 (aumentó 34%, no 100%)
- Para duplicar P, se necesitaría T₂ = 2×298 = 596 K = 323°C
```

---

## ECUACIONES DE GASES

| Ecuación | Uso | Fórmula |
|----------|-----|---------|
| **Ecuación de estado** | General | PV = nRT |
| **Ecuación combinada** | n constante | P₁V₁/T₁ = P₂V₂/T₂ |
| **Isotérmica** | T constante | P₁V₁ = P₂V₂ |
| **Isobárica** | P constante | V₁/T₁ = V₂/T₂ |
| **Isocórica** | V constante | P₁/T₁ = P₂/T₂ |

---

## CONSTANTE DE GASES

```
R = 0.082 atm·L/(mol·K)
```

**Otras unidades de R:**
- R = 8.314 J/(mol·K)
- R = 1.987 cal/(mol·K)

---

## CONVERSIÓN DE TEMPERATURA

```
T(K) = T(°C) + 273
T(°C) = T(K) - 273
```

**¡IMPORTANTE!** Las ecuaciones de gases SIEMPRE usan temperatura en Kelvin.

---

## TIPOS DE PROCESOS

| Proceso | Variable constante | Relación | Ejemplo |
|---------|-------------------|----------|---------|
| **Isotérmico** | T | P₁V₁ = P₂V₂ | Comprimir lentamente |
| **Isobárico** | P | V₁/T₁ = V₂/T₂ | Globo al sol |
| **Isocórico** | V | P₁/T₁ = P₂/T₂ | Recipiente rígido |
| **Adiabático** | Q = 0 | PVᵞ = cte | Compresión rápida |

---

## ERRORES COMUNES A DETECTAR

| Error | Penalización sugerida |
|-------|----------------------|
| No convertir °C a Kelvin | -4 pts en Fase 2 |
| Usar ΔT en vez de T absoluta | -4 pts en Fase 3 |
| Confundir tipo de proceso | -3 pts en Fase 1 |
| Error en despeje de ecuación | -3 pts en Fase 3 |
| No convertir mL a L | -2 pts en Fase 2 |
| Pensar que ΔT°C = ΔT K implica proporcionalidad | -3 pts en Fase 4 |

---

## PLANILLA DE REGISTRO - GASES IDEALES

### Alumno: _________________ Fecha: _________

| Ejercicio | Fase 1 (/12.5) | Fase 2 (/12.5) | Fase 3 (/12.5) | Fase 4 (/12.5) | Subtotal (/50) |
|-----------|----------------|----------------|----------------|----------------|----------------|
| Ej. 1: Cambio de condiciones | | | | | |
| Ej. 2: Proceso específico V/F | | | | | |
| **TOTAL** | | | | | **/100** |

**Observaciones:**

---

*Instituto Santo Tomás de Aquino - 2025*
