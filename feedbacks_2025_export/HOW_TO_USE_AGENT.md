# Cómo Usar el Agente de Reportes Anuales

Esta guía explica cómo usar el agente `progress-report-generator` para generar reportes anuales de todos los estudiantes del 2025.

## 📋 Prerequisitos

- Todos los archivos JSON de feedbacks deben estar en `feedbacks_2025_export/`
- Claude Code instalado y configurado
- El agente `progress-report-generator` debe estar en `.claude/agents/`

## 🚀 Inicio Rápido

### Opción 1: Generar Todos los Reportes (Recomendado para sesiones largas)

```bash
# En Claude Code, invoca el agente:
@progress-report-generator "Genera reportes anuales para todos los estudiantes"
```

El agente te preguntará:
1. Cuántos estudiantes procesar (batch size)
2. Si quieres continuar automáticamente o uno por uno

**Recomendación:** Empieza con batch de 10 para probar el sistema.

### Opción 2: Generar Reporte de Un Estudiante Específico

```bash
@progress-report-generator "Genera el reporte anual de Catalina Varrente"
```

### Opción 3: Procesar en Lotes

```bash
# Primera sesión
@progress-report-generator "batch 20"

# Cuando quieras continuar (otra sesión)
@progress-report-generator "continue"
```

## 📊 Comandos Útiles

### Ver Progreso
```bash
@progress-report-generator "show progress"
```

Muestra:
- Total de estudiantes procesados
- Estudiantes pendientes
- Estudiantes con errores
- Próximo estudiante en la lista

### Listar Errores
```bash
@progress-report-generator "list errors"
```

Muestra todos los estudiantes que tuvieron problemas durante la generación.

### Continuar desde Donde se Dejó
```bash
@progress-report-generator "continue"
```

El agente automáticamente:
1. Lee el archivo de checkpoint
2. Encuentra el último estudiante procesado
3. Continúa con el siguiente

### Reiniciar Todo
```bash
@progress-report-generator "reset"
```

**⚠️ CUIDADO:** Esto borra todo el progreso y empieza desde cero.

## 🔄 Sistema de Checkpoint

El agente mantiene un archivo de progreso en:
```
feedbacks_2025_export/.progress_checkpoint.json
```

Este archivo registra:
- ✅ Estudiantes completados
- ⏳ Estudiante actual (in_progress)
- ⏸️ Estudiantes pendientes
- ❌ Estudiantes con errores

**Ventajas:**
- Si se interrumpe la sesión, puedes continuar exactamente donde quedaste
- Puedes procesar en múltiples sesiones
- Nunca pierdes el progreso
- Puedes ver estadísticas en tiempo real

## 📁 Estructura de Salida

Los reportes generados se guardan en:
```
feedbacks_2025_export/annual_reports/Reporte_Anual_2025_[Nombre_Estudiante].md
```

Cada reporte incluye:
- **Desempeño General**: Resumen ejecutivo
- **Progresión del Año**: Evolución de calificaciones
- **Fortalezas Principales**: Top 3-5 habilidades destacadas
- **Áreas de Mejora**: Temas recurrentes que necesitan atención
- **Recomendaciones 2026**: Sugerencias accionables
- **Mensaje Personal**: Motivación personalizada
- **Estadísticas**: Datos numéricos del año

## 🎯 Flujo de Trabajo Recomendado

### Primera Sesión (30-60 minutos)
```bash
@progress-report-generator "start"
# Elige: batch 10
```

**Resultado:** 10 reportes generados (~3-5 minutos cada uno)

### Sesiones Subsiguientes
```bash
@progress-report-generator "continue"
# Elige: batch 20 (ya tienes confianza en el proceso)
```

### Revisión Final
```bash
@progress-report-generator "show progress"
# Verifica: 160/160 completados

@progress-report-generator "list errors"
# Revisa si hay estudiantes que necesitan atención manual
```

## 🔧 Troubleshooting

### Problema: "No checkpoint found"
**Solución:** Es normal en la primera ejecución. Responde "yes" para inicializar.

### Problema: Estudiante con status "error"
**Causas posibles:**
- Archivo JSON corrupto
- Sin datos de feedback para 2025
- Formato de datos inesperado

**Solución:**
1. Usa `list errors` para ver el mensaje de error
2. Revisa manualmente el archivo JSON del estudiante
3. Usa `retry [Nombre]` si corregiste el problema
4. Usa `skip [Nombre]` si quieres procesarlo manualmente después

### Problema: Checkpoint desactualizado
**Solución:**
```bash
@progress-report-generator "scan students"
```
Esto reescanea el directorio y actualiza la lista de estudiantes.

## 📈 Estimaciones de Tiempo

| Batch Size | Tiempo Estimado | Reportes Generados |
|------------|-----------------|-------------------|
| 1 estudiante | ~3-5 minutos | 1-2 reportes (si tiene Física y Química) |
| 10 estudiantes | ~30-50 minutos | ~15-20 reportes |
| 50 estudiantes | ~2.5-4 horas | ~75-100 reportes |
| 160 estudiantes (todos) | ~8-12 horas | ~261 reportes |

**💡 Tip:** Es mejor hacer sesiones de 10-20 estudiantes para poder revisar la calidad de los reportes iniciales.

## 🎨 Personalización

Si necesitas ajustar el tono, longitud, o contenido de los reportes:
1. Edita `.claude/agents/agent-progress-report-generator.md`
2. Modifica la sección "Report Structure"
3. Guarda y reinicia el agente
4. Usa `retry [Estudiante]` para regenerar con nuevas configuraciones

## ✅ Checklist Pre-Generación

Antes de generar todos los reportes, verifica:

- [ ] Todos los archivos JSON están en `feedbacks_2025_export/`
- [ ] El directorio `annual_reports/` existe (el agente lo crea automáticamente)
- [ ] Tienes ~4-8 horas disponibles (para batch completo) O planeas hacerlo en sesiones
- [ ] Has probado con 1-2 estudiantes primero para verificar calidad
- [ ] El formato de salida cumple tus expectativas

## 📞 Soporte

Si encuentras problemas:
1. Usa `show progress` para entender el estado actual
2. Usa `list errors` para ver errores específicos
3. Revisa el archivo `.progress_checkpoint.json` manualmente
4. Si todo falla, usa `reset` y empieza de nuevo (perderás progreso)

---

**Última actualización:** 2025-11-19
**Versión del agente:** 1.0
**Total de estudiantes:** 160
