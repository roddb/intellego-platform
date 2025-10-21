# Examen de Física - Tiro Oblicuo

**Nombre del archivo**: `Gonzalez.md`
**Alumno**: González, Juan
**Fecha**: 15/10/2025

---

## Ejercicio 1: Jabalina (40 puntos)

Un atleta lanza una jabalina con una velocidad inicial de 15 m/s y un ángulo de 30° respecto a la horizontal.

**a)** Calcular el alcance máximo de la jabalina.

**b)** Calcular la altura máxima que alcanza la jabalina.

### Desarrollo del alumno:

**a) Alcance máximo:**

Primero identifico que es un problema de tiro oblicuo. Necesito calcular la distancia horizontal donde cae la jabalina.

Datos:
- V0 = 15 m/s
- θ = 30°
- g = 10 m/s²

Incógnita: Alcance máximo (X)

Descompongo la velocidad inicial en componentes:

Vox = V0 · cos(θ) = 15 · cos(30°) = 15 · 0.866 = 12.99 m/s

Voy = V0 · sen(θ) = 15 · sen(30°) = 15 · 0.5 = 7.5 m/s

Calculo el tiempo de vuelo. Como la jabalina parte y cae a la misma altura, uso:

t = 2 · Voy / g = 2 · 7.5 / 10 = 1.5 s

Finalmente, el alcance es:

X = Vox · t = 12.99 · 1.5 = 19.48 m

**Respuesta: El alcance máximo es 19.48 m**

Verifico que tiene sentido: para un ángulo de 30° (no óptimo), el alcance debe ser menor que el máximo teórico V0²/g = 225/10 = 22.5 m. ✓

---

**b) Altura máxima:**

Uso la fórmula de altura máxima en tiro oblicuo:

h_max = Voy² / (2 · g)

h_max = (7.5)² / (2 · 10) = 56.25 / 20 = 2.8125 m

**Respuesta: La altura máxima es 2.81 m**

Verifico con otro método. En el punto más alto (t/2 = 0.75s), la velocidad vertical es cero. Usando cinemática:

h = Voy · t - (1/2) · g · t²
h = 7.5 · 0.75 - 5 · (0.75)² = 5.625 - 2.8125 = 2.8125 m ✓

Los dos métodos coinciden.

---

## Ejercicio 2: Proyectil y blanco (30 puntos)

Se lanza un proyectil horizontalmente desde una altura de 5 metros con una velocidad de 10 m/s. A 12 metros de distancia horizontal hay un blanco ubicado a 3 metros de altura.

¿El proyectil impacta el blanco? Justificar con cálculos.

### Desarrollo del alumno:

Primero hago un diagrama para visualizar el problema:

```
        ^
        |  h0 = 5m
        |
        o---------> Vox = 10 m/s
        |
        |  Blanco: x=12m, y=3m
        |
    ____|____________________
```

Es un lanzamiento horizontal, por lo que:
- Vox = 10 m/s (constante)
- Voy = 0 m/s (no hay componente vertical inicial)

Necesito encontrar:
1. ¿Cuánto tarda en recorrer 12 m horizontalmente?
2. ¿A qué altura está cuando x = 12 m?

**Cálculo del tiempo:**

x = Vox · t
12 = 10 · t
t = 1.2 s

**Cálculo de la altura en t = 1.2 s:**

y = h0 - (1/2) · g · t²
y = 5 - 5 · (1.2)²
y = 5 - 5 · 1.44
y = 5 - 7.2
y = -2.2 m

¡El resultado es negativo! Esto significa que el proyectil ya cayó al suelo antes de llegar a x = 12 m.

Verifico calculando cuándo llega al suelo (y = 0):

0 = 5 - 5 · t²
5 · t² = 5
t² = 1
t = 1 s

Cuando llega al suelo (t = 1s), ha recorrido horizontalmente:

x = 10 · 1 = 10 m

Como el blanco está a 12 m, y el proyectil cae a los 10 m, **NO IMPACTA EL BLANCO**.

**Respuesta: FALSO, el proyectil no impacta el blanco porque cae al suelo a los 10 metros, antes de llegar a los 12 metros donde está ubicado el blanco.**

---

## Ejercicio 3: Velocidad en un punto (30 puntos)

Una pelota es lanzada con velocidad inicial de 20 m/s y ángulo de 60°. Calcular la velocidad de la pelota cuando se encuentra a una altura de 10 metros.

### Desarrollo del alumno:

Datos:
- V0 = 20 m/s
- θ = 60°
- y = 10 m
- g = 10 m/s²

Incógnita: Velocidad total a altura h = 10 m

Descompongo V0:
- Vox = 20 · cos(60°) = 20 · 0.5 = 10 m/s (constante durante todo el vuelo)
- Voy = 20 · sen(60°) = 20 · 0.866 = 17.32 m/s

Para encontrar Vy a altura h = 10 m, uso conservación de energía:

(1/2) · m · V0² = (1/2) · m · V² + m · g · h

Simplificando (cancelando m y multiplicando por 2):

V0² = V² + 2 · g · h
V² = V0² - 2 · g · h
V² = (20)² - 2 · 10 · 10
V² = 400 - 200
V² = 200

V = √200 = 14.14 m/s

**Respuesta: La velocidad a 10 metros de altura es 14.14 m/s**

Nota: Esta es la velocidad total. Podría descomponerla en:
- Vx = Vox = 10 m/s (constante)
- Usando V² = Vx² + Vy², obtengo Vy = √(200 - 100) = √100 = 10 m/s

---

**Fin del examen**
