# 📁 Reforma 2025 - Sistema de Retroalimentaciones

Esta carpeta contiene toda la planificación y documentación para la reorganización del sistema de retroalimentaciones de la Plataforma Intellego.

---

## 📂 Contenido de esta Carpeta

```
reforma_2025/
├── README.md           # Este archivo - Introducción y guía
├── PLAN_REFORMA.md     # Plan detallado de la reforma
├── CHECKLIST.md        # Checklist interactivo de tareas
├── CHANGELOG.md        # Registro de cambios (se crea al finalizar)
└── screenshots/        # Capturas antes/después (se crea al finalizar)
```

---

## 🎯 Objetivo de la Reforma

**Problema actual**:
- Indicador "Devolución" aparece inconsistentemente en el dashboard
- Feedbacks se muestran en múltiples lugares causando confusión
- Historial mezcla entregas del estudiante con devoluciones del instructor

**Solución propuesta**:
1. **Eliminar** indicador "Devolución" del calendario del dashboard
2. **Consolidar** todas las retroalimentaciones en el tab "Retroalimentaciones Recibidas"
3. **Limpiar** el historial para mostrar SOLO las entregas del estudiante

---

## 📖 Cómo Usar Esta Documentación

### Para Implementar la Reforma:

1. **Leer primero**: `PLAN_REFORMA.md`
   - Contiene análisis completo del sistema actual
   - Detalla cada fase de modificación
   - Incluye riesgos y consideraciones

2. **Seguir checklist**: `CHECKLIST.md`
   - Lista detallada de 51 tareas
   - Marcar cada tarea al completarla
   - Incluye casos de prueba específicos

3. **Ir fase por fase**:
   - No saltarse fases
   - Hacer commit después de cada fase
   - Probar antes de continuar

### Para Revisar el Progreso:

- Abrir `CHECKLIST.md`
- Ver resumen por fase en la parte superior
- Revisar tareas completadas/pendientes

### Workflow Recomendado:

```bash
# 1. Crear branch de trabajo
git checkout -b reforma-2025

# 2. Hacer checkpoint inicial
git add .
git commit -m "Checkpoint: Estado antes de reforma 2025"

# 3. Implementar Fase 1
# ... trabajar en las tareas de Fase 1 ...

# 4. Actualizar checklist
# Marcar tareas completadas en CHECKLIST.md

# 5. Commit de la fase
git add .
git commit -m "Fase 1 completada: Análisis del sistema"

# 6. Repetir para cada fase
# ...

# 7. Merge a main cuando TODO esté listo
git checkout main
git merge reforma-2025
```

---

## ⏱️ Estimación de Tiempo

**Tiempo total estimado**: 5-7 horas

Desglose por fase:
- Fase 1 (Análisis): 1-2 horas
- Fase 2 (Dashboard): 30 minutos
- Fase 3 (Retroalimentaciones): 1 hora
- Fase 4 (Historial): 1 hora
- Fase 5 (Pruebas): 1-2 horas
- Fase 6 (Documentación): 30 minutos

**Recomendación**: Dividir en 2 sesiones de trabajo de 3-4 horas cada una.

---

## ⚠️ Advertencias Importantes

### ANTES de Empezar:

- [ ] ✅ Leer COMPLETO el `PLAN_REFORMA.md`
- [ ] ✅ Entender el objetivo de cada fase
- [ ] ✅ Tener servidor de desarrollo corriendo (`npm run dev`)
- [ ] ✅ Tener acceso a base de datos Turso
- [ ] ✅ Crear branch `reforma-2025`
- [ ] ✅ Hacer commit del estado inicial

### DURANTE la Implementación:

- ❌ **NO** trabajar directamente en `main`
- ❌ **NO** saltarse las pruebas
- ❌ **NO** hacer cambios sin commit después de cada fase
- ✅ **SÍ** probar cada cambio inmediatamente
- ✅ **SÍ** actualizar checklist regularmente
- ✅ **SÍ** consultar plan ante dudas

### SI ALGO SALE MAL:

1. **NO ENTRAR EN PÁNICO**
2. Ver sección "Rollback Plan" en `PLAN_REFORMA.md`
3. Usar `git log --oneline` para ver commits
4. Usar `git reset --hard [COMMIT]` para volver atrás
5. Revisar qué salió mal antes de reintentar

---

## 📊 Estado Actual

**Última actualización**: 22 de octubre de 2025

| Aspecto | Estado |
|---------|--------|
| **Planificación** | ✅ Completa |
| **Implementación** | 🔴 No iniciada |
| **Pruebas** | 🔴 No iniciadas |
| **Documentación** | 🟡 En progreso |
| **Progreso General** | 0% (0/51 tareas) |

---

## 🤝 Colaboración

Esta reforma fue planificada por:
- **Claude Code** (Planificación y análisis técnico)
- **Rodrigo Di Bernardo** (Requerimientos y validación)

Para preguntas o problemas:
1. Revisar `PLAN_REFORMA.md` sección "Riesgos y Consideraciones"
2. Consultar con Rodrigo si hay dudas de UX
3. Documentar cualquier problema en `CHECKLIST.md` sección "Problemas Encontrados"

---

## 📚 Referencias

### Archivos del Sistema Afectados:

**Frontend**:
- `src/app/dashboard/student/page.tsx` - Dashboard principal
- `src/components/student/MonthlyReportsHistory.tsx` - Historial
- `src/components/student/FeedbackViewer.tsx` - Visualizador de feedbacks

**Backend**:
- `src/app/api/student/feedback/route.ts` - API de feedbacks
- `src/app/api/student/progress-reports/route.ts` - API de reportes

**Base de Datos**:
- Tabla `Feedback` - Retroalimentaciones
- Tabla `ProgressReport` - Reportes semanales

### Documentación Relacionada:

- `/documentation/CLAUDE-WORKFLOW.md` - Workflow general del proyecto
- `/documentation/PROJECT-HISTORY.md` - Historia del proyecto
- `/CLAUDE.md` - Instrucciones para Claude Code

---

## ✅ Criterios de Éxito

La reforma se considerará exitosa cuando:

1. ✅ NO aparece el indicador "Devolución" en el calendario
2. ✅ TODAS las retroalimentaciones aparecen en el tab "Retroalimentaciones"
3. ✅ El historial SOLO muestra si el estudiante entregó o no
4. ✅ Todo funciona correctamente para todos los estudiantes
5. ✅ El modo vista instructor sigue funcionando
6. ✅ No hay errores en consola ni logs
7. ✅ El usuario (Rodrigo) aprueba los cambios

---

## 🎓 Lecciones Aprendidas

_(Esta sección se completará al finalizar la reforma)_

### Lo que funcionó bien:
- ...

### Desafíos enfrentados:
- ...

### Mejoras para futuras reformas:
- ...

---

**Inicio de proyecto**: 22 de octubre de 2025
**Finalización**: Pendiente
**Estado**: 🔴 En Planificación
