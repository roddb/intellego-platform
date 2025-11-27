# Feedbacks 2025 - Exportación para Análisis

Este directorio contiene los feedbacks de todos los estudiantes del año 2025, organizados por alumno y materia.

## 📊 Resumen de la Exportación

- **Total de estudiantes:** 160
- **Total de archivos generados:** 261
- **Período:** Enero 2025 - Noviembre 2025
- **Total de feedbacks:** 2,355
- **Fecha de generación:** 2025-11-19

## 📁 Estructura de Archivos

Cada archivo JSON sigue el formato: `Nombre_Apellido_Materia.json`

Ejemplos:
- `Agustin_Lo_Valvo_Física.json`
- `Agustin_Lo_Valvo_Química.json`
- `Ana_Rosiello_Física.json`

## 📋 Estructura del JSON

Cada archivo contiene:

```json
{
  "metadata": {
    "studentId": "u_...",
    "studentName": "Nombre Completo",
    "subject": "Materia",
    "academicYear": 2025,
    "generatedAt": "2025-11-19T...",
    "statistics": {
      "totalFeedbacks": 13,
      "feedbacksWithScore": 13,
      "averageScore": 56.92,
      "minScore": 30,
      "maxScore": 75,
      "weeksCovered": 11,
      "dateRange": {
        "firstWeek": "2025-08-04",
        "lastWeek": "2025-11-10"
      }
    }
  },
  "feedbacks": [
    {
      "feedbackId": "...",
      "weekStart": "2025-08-04",
      "score": 42,
      "generalComments": "...",
      "strengths": ["...", "...", "..."],
      "improvements": ["...", "...", "..."],
      "createdAt": "2025-01-09 16:00:00"
    }
  ]
}
```

## 🎯 Cómo Usar los Archivos para Retroalimentación de Cierre de Año

### Opción 1: Análisis Individual en Claude Web

1. Abre [Claude.ai](https://claude.ai)
2. Carga el archivo JSON del estudiante que quieras analizar
3. Usa un prompt como:

```
Analiza este archivo JSON que contiene todos los feedbacks del año 2025
de un estudiante en [MATERIA].

Por favor genera una retroalimentación de cierre de año que incluya:

1. **Resumen del progreso anual**: Cómo evolucionó el estudiante a lo largo del año
2. **Fortalezas principales**: Las 3-5 habilidades más destacadas consistentemente
3. **Áreas de mejora**: Los desafíos recurrentes que debe abordar
4. **Recomendaciones para 2026**: Sugerencias concretas y accionables
5. **Mensaje motivacional**: Personalizado y constructivo

Basa tu análisis en:
- La progresión de scores (promedio, tendencias, mejoras/caídas)
- Los comentarios generales acumulados
- Las fortalezas identificadas repetidamente
- Las mejoras sugeridas de forma consistente

El tono debe ser profesional, constructivo y motivador.
```

### Opción 2: Análisis Batch (Múltiples Estudiantes)

Si necesitas procesar muchos estudiantes:

1. Agrupa archivos por materia en subcarpetas
2. Usa Claude Projects para mantener contexto
3. Procesa en lotes de 5-10 estudiantes

### Opción 3: Generar Reportes Automatizados

Si quieres automatizar la generación de reportes, puedes:

1. Crear un script Python que lea cada JSON
2. Use la API de Anthropic (Claude) para generar retroalimentaciones
3. Guarde los resultados en formato PDF o Markdown

## 📈 Estadísticas Útiles Incluidas

Cada archivo incluye estadísticas calculadas automáticamente:

- **totalFeedbacks**: Cantidad de feedbacks del año
- **averageScore**: Promedio de calificaciones
- **minScore / maxScore**: Rango de calificaciones
- **weeksCovered**: Cuántas semanas tuvo feedback
- **dateRange**: Primera y última semana con feedback

## 🔍 Filtros y Búsquedas

Para encontrar archivos específicos:

```bash
# Buscar todos los archivos de Física
ls *_Física.json

# Buscar archivos de un estudiante específico
ls Agustin_Lo_Valvo_*.json

# Contar archivos por materia
ls *_Química.json | wc -l
```

## 📝 Notas Importantes

1. **Formato de Arrays**: Los campos `strengths` e `improvements` pueden estar como:
   - Arrays de strings: `["Item 1", "Item 2"]`
   - String simple: `"Item único"`
   - Dependiendo de cómo se almacenaron originalmente

2. **Scores Null**: Algunos feedbacks pueden tener `score: null` si no se asignó calificación

3. **Fechas**: Las fechas están en formato ISO 8601 o formato de base de datos

## 🚀 Scripts Utilizados

- `scripts/fetch-feedbacks-2025.js` - Obtiene datos desde Turso
- `scripts/export-feedbacks-2025.py` - Procesa y genera JSONs

Para regenerar los archivos:

```bash
# 1. Obtener datos actualizados desde Turso
node scripts/fetch-feedbacks-2025.js

# 2. Procesar y generar JSONs
python3 scripts/export-feedbacks-2025.py
```

---

**Generado:** 2025-11-19
**Plataforma:** Intellego Platform
**Año Académico:** 2025
