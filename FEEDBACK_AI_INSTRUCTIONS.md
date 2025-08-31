# Instrucciones para Generación de Feedback con IA

## Estructura JSON Requerida

El sistema Intellego Platform requiere que el feedback se genere en un formato JSON específico. **ES CRÍTICO seguir esta estructura exactamente** para que el sistema pueda procesar correctamente las devoluciones.

## Campos Obligatorios y Formatos

### 1. Metadata (Obligatorio)
```json
"metadata": {
  "instructor": "email@instructor.com",  // DEBE ser el email exacto del instructor
  "generated_at": "YYYY-MM-DDTHH:MM:SSZ", // Formato ISO 8601
  "version": "1.0"
}
```

### 2. Feedbacks Array (Obligatorio)
Cada elemento del array debe contener:

#### Identificación del Estudiante (CRÍTICO)
- `student_email`: Email exacto del estudiante en el sistema
- `student_id`: ID del estudiante (formato: EST-YYYY-XXX)
- **AMBOS campos son validados**: Si no coinciden exactamente, el feedback será rechazado

#### Información Temporal
- `week_start`: Fecha del LUNES de la semana (formato: YYYY-MM-DD)
- **Ejemplo**: Para la semana del 18-24 de agosto 2025, usar "2025-08-18"

#### Materia
- `subject`: Debe ser EXACTAMENTE "Física" o "Química" (con tilde)

#### Objeto Feedback (estructura anidada)
```json
"feedback": {
  "score": 85,  // Número entre 0-100
  "general_comments": "string",
  "strengths": ["array", "de", "strings"],
  "improvements": ["array", "de", "strings"],
  "ai_analysis": "string"
}
```

## Ejemplo Completo

```json
{
  "metadata": {
    "instructor": "rdb@intellego.com",
    "generated_at": "2025-08-25T15:30:00Z",
    "version": "1.0"
  },
  "feedbacks": [
    {
      "student_email": "juan.perez@escuela.com",
      "student_id": "EST-2025-042",
      "week_start": "2025-08-18",
      "subject": "Física",
      "feedback": {
        "score": 88,
        "general_comments": "Excelente progreso esta semana. Juan demostró comprensión profunda de los conceptos de mecánica clásica.",
        "strengths": [
          "Dominio excepcional de las leyes de Newton",
          "Resolución creativa de problemas complejos",
          "Participación activa en clase"
        ],
        "improvements": [
          "Mejorar la presentación de los cálculos",
          "Incluir más diagramas en las respuestas",
          "Revisar notación vectorial"
        ],
        "ai_analysis": "Juan muestra un progreso consistente y está por encima del promedio del curso. Se recomienda introducir problemas de mayor complejidad para mantener su motivación."
      }
    },
    {
      "student_email": "juan.perez@escuela.com",
      "student_id": "EST-2025-042",
      "week_start": "2025-08-18",
      "subject": "Química",
      "feedback": {
        "score": 75,
        "general_comments": "Buen avance en química orgánica, aunque hay áreas que requieren refuerzo.",
        "strengths": [
          "Comprensión de nomenclatura IUPAC",
          "Identificación correcta de grupos funcionales",
          "Buena memoria para las reacciones"
        ],
        "improvements": [
          "Practicar mecanismos de reacción",
          "Mejorar el balanceo de ecuaciones redox",
          "Estudiar estereoquímica con más detalle"
        ],
        "ai_analysis": "Juan necesita dedicar más tiempo a la práctica de mecanismos. Se sugiere usar modelos moleculares para visualizar mejor las estructuras 3D."
      }
    }
  ]
}
```

## Validaciones del Sistema

El sistema valida automáticamente:

1. **Instructor**: El email debe coincidir EXACTAMENTE con el usuario logueado
2. **Estudiante**: TANTO el email COMO el student_id deben existir y coincidir
3. **Semana**: Debe existir un reporte previo del estudiante para esa semana
4. **Formato de fechas**: week_start debe ser formato YYYY-MM-DD
5. **Materias**: Solo acepta "Física" o "Química" (exacto, con tildes)
6. **Score**: Debe ser un número entre 0 y 100

## Consideraciones Importantes para la IA

### 1. Formato de Nombres de Campos
- Usar **snake_case** (student_email, NOT studentEmail)
- El feedback debe estar en un objeto anidado llamado "feedback"

### 2. Semanas y Fechas
- Siempre usar el LUNES como week_start
- Las semanas van de lunes a domingo
- Formato estricto: YYYY-MM-DD

### 3. Arrays de Strings
- strengths y improvements DEBEN ser arrays
- Incluso si hay un solo elemento: ["único elemento"]
- No usar strings simples

### 4. Generación por Lotes
- Se pueden incluir múltiples estudiantes en un mismo JSON
- Se pueden incluir múltiples materias por estudiante
- El sistema procesará todo en una transacción

### 5. Manejo de Errores
- Si un feedback falla, los demás se procesan igual
- El sistema reporta exactamente qué falló y por qué
- Los errores comunes incluyen:
  - "No progress report found": El estudiante no envió reporte esa semana
  - "Student not found": Email o ID incorrectos
  - "Instructor email does not match": Email del instructor incorrecto

## Prompt Sugerido para la IA

```
Genera un archivo JSON de feedback siguiendo EXACTAMENTE esta estructura:
- Usa snake_case para los campos (student_email, week_start, etc.)
- El feedback debe estar en un objeto anidado llamado "feedback"
- strengths e improvements deben ser arrays de strings
- El instructor debe ser: [EMAIL_DEL_INSTRUCTOR]
- La semana debe comenzar en: [FECHA_LUNES]
- Los estudiantes son: [LISTA_DE_ESTUDIANTES_CON_EMAILS_E_IDS]

Estructura exacta requerida:
[PEGAR PLANTILLA JSON]

Asegúrate de que todos los campos estén presentes y en el formato correcto.
```

## Archivo de Plantilla

Disponible en: `feedback-template.json`

Este archivo puede ser usado directamente por la IA como base para generar el feedback.