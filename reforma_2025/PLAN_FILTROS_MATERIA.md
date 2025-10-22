# 🎯 PLAN: FILTROS POR MATERIA EN RETROALIMENTACIONES

**Fecha de creación**: 22 de octubre de 2025
**Estado**: 📋 Planificado (Pendiente de implementación)
**Prioridad**: Media
**Tiempo estimado**: 45 minutos - 1 hora
**Tipo**: Mejora de UX/UI

---

## 📌 OBJETIVO

Agregar filtros por materia en el tab "Retroalimentaciones Recibidas" para permitir a los estudiantes ver solo las retroalimentaciones de una materia específica (Física, Química, etc.) o todas juntas.

---

## 🎯 PROBLEMA ACTUAL

Actualmente en el tab de "Retroalimentaciones Recibidas":

**✅ Lo que funciona bien**:
- Todas las retroalimentaciones se cargan correctamente
- Se muestran ordenadas por fecha (más recientes primero)
- Son clickeables para ver el detalle completo
- Loading y empty states funcionan correctamente

**❌ El problema**:
- Cuando hay muchas retroalimentaciones de diferentes materias, todas aparecen mezcladas
- El estudiante tiene que hacer scroll para encontrar retroalimentaciones de una materia específica
- No hay forma de filtrar o agrupar por materia
- La UX se degrada cuando hay >10 retroalimentaciones

**Ubicación del código**: `src/app/dashboard/student/page.tsx` (líneas 706-810)

---

## 💡 SOLUCIÓN PROPUESTA

Agregar un **sistema de filtros por materia** con botones encima de la lista de retroalimentaciones.

### Comportamiento:

1. **Botón "Todas"** (default activo):
   - Muestra todas las retroalimentaciones mezcladas
   - Ordenadas por fecha (comportamiento actual)

2. **Botones por materia** (Física, Química, etc.):
   - Se generan dinámicamente basándose en las materias del estudiante
   - Al hacer clic, filtran solo las retroalimentaciones de esa materia
   - Se mantiene el orden por fecha dentro de cada filtro

3. **Indicador visual**:
   - Botón activo se muestra con color/estilo diferente
   - Cantidad de retroalimentaciones por materia (badge numérico)

### Diseño propuesto:

```
┌─────────────────────────────────────────────────────────┐
│ 💬 Retroalimentaciones Recibidas                        │
│ Todas las devoluciones de tus reportes semanales        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  [Todas (12)]  [Física (7)]  [Química (5)]              │
│   ^active                                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Física - Semana del 13 de octubre de 2025     73/100   │
│ Rodrigo Di Bernardo                                     │
│ Continuar con el trabajo actual y buscar...            │
│ [Ver Retroalimentación Completa →]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Química - Semana del 13 de octubre de 2025    69/100   │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ IMPLEMENTACIÓN TÉCNICA

### Estado necesario:

```typescript
// Nuevo estado para el filtro seleccionado
const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null)
// null = "Todas", string = materia específica (ej: "Física")
```

### Lógica de filtrado:

```typescript
// Obtener materias únicas de los feedbacks
const uniqueSubjects = Array.from(new Set(allFeedbacks.map(f => f.subject)))

// Filtrar feedbacks basándose en la selección
const filteredFeedbacks = selectedSubjectFilter
  ? allFeedbacks.filter(f => f.subject === selectedSubjectFilter)
  : allFeedbacks

// Contar feedbacks por materia
const feedbackCountBySubject = uniqueSubjects.reduce((acc, subject) => {
  acc[subject] = allFeedbacks.filter(f => f.subject === subject).length
  return acc
}, {} as Record<string, number>)
```

### Componente de filtros:

```tsx
{/* Filter Buttons */}
{!isFeedbacksLoading && allFeedbacks.length > 0 && uniqueSubjects.length > 1 && (
  <div className="bg-white rounded-lg shadow-lg p-4">
    <div className="flex flex-wrap gap-2">
      {/* Todas */}
      <button
        onClick={() => setSelectedSubjectFilter(null)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          selectedSubjectFilter === null
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Todas
        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
          {allFeedbacks.length}
        </span>
      </button>

      {/* Por materia */}
      {uniqueSubjects.map(subject => (
        <button
          key={subject}
          onClick={() => setSelectedSubjectFilter(subject)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedSubjectFilter === subject
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {subject}
          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
            {feedbackCountBySubject[subject]}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Renderizado de lista:

```tsx
{/* Feedbacks List - ahora usa filteredFeedbacks en vez de allFeedbacks */}
{!isFeedbacksLoading && filteredFeedbacks.length > 0 && (
  <div className="space-y-4">
    {filteredFeedbacks.map((feedback) => {
      // ... código existente sin cambios
    })}
  </div>
)}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Preparación (5 min)
- [ ] **1.1** - Leer código actual del tab de retroalimentaciones
- [ ] **1.2** - Confirmar ubicación exacta de inserción (línea ~716)
- [ ] **1.3** - Verificar estado `allFeedbacks` está disponible

### FASE 2: Agregar Estado y Lógica (10 min)
- [ ] **2.1** - Agregar estado `selectedSubjectFilter` (inicialmente null)
- [ ] **2.2** - Crear función para obtener materias únicas
  ```typescript
  const uniqueSubjects = useMemo(() =>
    Array.from(new Set(allFeedbacks.map(f => f.subject))),
    [allFeedbacks]
  )
  ```
- [ ] **2.3** - Crear función para contar feedbacks por materia
  ```typescript
  const feedbackCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {}
    uniqueSubjects.forEach(subject => {
      counts[subject] = allFeedbacks.filter(f => f.subject === subject).length
    })
    return counts
  }, [allFeedbacks, uniqueSubjects])
  ```
- [ ] **2.4** - Crear variable de feedbacks filtrados
  ```typescript
  const filteredFeedbacks = useMemo(() =>
    selectedSubjectFilter
      ? allFeedbacks.filter(f => f.subject === selectedSubjectFilter)
      : allFeedbacks,
    [allFeedbacks, selectedSubjectFilter]
  )
  ```

### FASE 3: UI de Filtros (15 min)
- [ ] **3.1** - Crear componente de filtros con botones
- [ ] **3.2** - Agregar botón "Todas" con contador
- [ ] **3.3** - Mapear botones dinámicos por materia con contadores
- [ ] **3.4** - Implementar estilos activo/inactivo
- [ ] **3.5** - Agregar transiciones suaves
- [ ] **3.6** - Solo mostrar filtros si hay >1 materia

### FASE 4: Integrar Filtrado (10 min)
- [ ] **4.1** - Cambiar `allFeedbacks.map` a `filteredFeedbacks.map`
- [ ] **4.2** - Verificar que todo el código existente funciona igual
- [ ] **4.3** - Asegurar que el click en feedback sigue funcionando
- [ ] **4.4** - Verificar que el modal de detalle funciona

### FASE 5: Empty States (5 min)
- [ ] **5.1** - Actualizar empty state para considerar filtros
- [ ] **5.2** - Si no hay feedbacks con filtro activo:
  ```tsx
  {selectedSubjectFilter && filteredFeedbacks.length === 0 && (
    <div className="text-center py-8 text-slate-500">
      No hay retroalimentaciones de {selectedSubjectFilter} aún
    </div>
  )}
  ```

### FASE 6: Responsive Design (5 min)
- [ ] **6.1** - Verificar que botones se adaptan en móvil
- [ ] **6.2** - Usar `flex-wrap` para múltiples líneas si es necesario
- [ ] **6.3** - Probar en viewport pequeño (375px)

### FASE 7: Pruebas (10 min)
- [ ] **7.1** - Probar con estudiante que tiene feedbacks de múltiples materias
- [ ] **7.2** - Verificar filtro "Todas" muestra todos
- [ ] **7.3** - Verificar cada filtro por materia funciona
- [ ] **7.4** - Verificar contadores son correctos
- [ ] **7.5** - Verificar que no hay errores en consola
- [ ] **7.6** - Verificar que carga inicial funciona (default "Todas")
- [ ] **7.7** - Verificar responsive en móvil

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Mantener Reforma 2025 intacta**
   - ✅ NO tocar la carga de feedbacks (ya funciona perfecto)
   - ✅ NO modificar el modal de detalle (FeedbackViewer)
   - ✅ NO cambiar el ordenamiento por fecha
   - ✅ Solo agregar filtrado visual encima de lo existente

### 2. **Compatibilidad con modo instructor**
   - ✅ Instructores en modo impersonación también verán los filtros
   - ✅ Los filtros funcionan igual independientemente del usuario

### 3. **Performance**
   - ✅ Usar `useMemo` para evitar recalcular en cada render
   - ✅ El filtrado es solo en memoria (no requiere API calls)
   - ✅ Muy rápido incluso con 50+ feedbacks

### 4. **Edge Cases**
   - Si solo hay 1 materia → NO mostrar filtros (no tiene sentido)
   - Si no hay feedbacks → NO mostrar filtros (empty state normal)
   - Si feedbacks están cargando → NO mostrar filtros (loading state normal)

---

## 📊 ESTIMACIÓN DE TIEMPO

| Fase | Tiempo Estimado | Complejidad |
|------|----------------|-------------|
| Fase 1: Preparación | 5 min | Baja |
| Fase 2: Estado y Lógica | 10 min | Media |
| Fase 3: UI de Filtros | 15 min | Media |
| Fase 4: Integrar Filtrado | 10 min | Baja |
| Fase 5: Empty States | 5 min | Baja |
| Fase 6: Responsive | 5 min | Baja |
| Fase 7: Pruebas | 10 min | Media |
| **TOTAL** | **60 min** | **Media** |

---

## ✅ CRITERIOS DE ÉXITO

La implementación será exitosa cuando:

1. ✅ **Filtros visibles**: Se muestran botones de filtro cuando hay >1 materia
2. ✅ **Filtro "Todas" funciona**: Muestra todas las retroalimentaciones por defecto
3. ✅ **Filtros por materia funcionan**: Cada botón filtra correctamente
4. ✅ **Contadores precisos**: Los badges numéricos son correctos
5. ✅ **Estilo activo**: El botón seleccionado se ve diferente
6. ✅ **Funcionalidad existente intacta**: Carga, modal, orden por fecha funcionan igual
7. ✅ **Responsive**: Funciona bien en móvil y desktop
8. ✅ **Sin errores**: No hay errores en consola
9. ✅ **Performance**: Filtrado es instantáneo

---

## 🔗 ARCHIVOS AFECTADOS

Solo se modifica **1 archivo**:

```
src/app/dashboard/student/page.tsx
  - Línea ~75: Agregar estado selectedSubjectFilter
  - Línea ~131: Agregar useMemo para uniqueSubjects
  - Línea ~135: Agregar useMemo para feedbackCountBySubject
  - Línea ~139: Agregar useMemo para filteredFeedbacks
  - Línea ~716: Insertar componente de filtros
  - Línea ~741: Cambiar allFeedbacks.map → filteredFeedbacks.map
```

**NO se modifican**:
- ❌ Base de datos
- ❌ APIs
- ❌ Componente FeedbackViewer
- ❌ Otros componentes
- ❌ Estilos globales

---

## 📝 EJEMPLO DE CÓDIGO COMPLETO

### Estado (agregar cerca de línea 75):

```typescript
// Filter state for feedbacks tab
const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null)
```

### Lógica de filtrado (agregar después del useEffect de feedbacks):

```typescript
// Get unique subjects from feedbacks
const uniqueSubjects = useMemo(() =>
  Array.from(new Set(allFeedbacks.map(f => f.subject))),
  [allFeedbacks]
)

// Count feedbacks per subject
const feedbackCountBySubject = useMemo(() => {
  const counts: Record<string, number> = {}
  uniqueSubjects.forEach(subject => {
    counts[subject] = allFeedbacks.filter(f => f.subject === subject).length
  })
  return counts
}, [allFeedbacks, uniqueSubjects])

// Filter feedbacks based on selected subject
const filteredFeedbacks = useMemo(() =>
  selectedSubjectFilter
    ? allFeedbacks.filter(f => f.subject === selectedSubjectFilter)
    : allFeedbacks,
  [allFeedbacks, selectedSubjectFilter]
)
```

### UI de filtros (insertar después del header, línea ~716):

```tsx
{/* Subject Filter Buttons - Only show if there are multiple subjects */}
{!isFeedbacksLoading && allFeedbacks.length > 0 && uniqueSubjects.length > 1 && (
  <div className="bg-white rounded-lg shadow-lg p-4">
    <div className="flex flex-wrap gap-2">
      {/* All subjects button */}
      <button
        onClick={() => setSelectedSubjectFilter(null)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          selectedSubjectFilter === null
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Todas
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          selectedSubjectFilter === null
            ? 'bg-white/20'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {allFeedbacks.length}
        </span>
      </button>

      {/* Individual subject buttons */}
      {uniqueSubjects.sort().map(subject => (
        <button
          key={subject}
          onClick={() => setSelectedSubjectFilter(subject)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedSubjectFilter === subject
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {subject}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            selectedSubjectFilter === subject
              ? 'bg-white/20'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {feedbackCountBySubject[subject]}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
```

### Cambio en lista (línea ~741):

```tsx
{/* ANTES */}
{!isFeedbacksLoading && allFeedbacks.length > 0 && (
  <div className="space-y-4">
    {allFeedbacks.map((feedback) => {
      // ...
    })}
  </div>
)}

{/* DESPUÉS */}
{!isFeedbacksLoading && filteredFeedbacks.length > 0 && (
  <div className="space-y-4">
    {filteredFeedbacks.map((feedback) => {
      // ... código sin cambios
    })}
  </div>
)}
```

---

## 🚀 COMMIT SUGERIDO

```bash
git add src/app/dashboard/student/page.tsx
git commit -m "Mejora: Agregar filtros por materia en retroalimentaciones

Cambios realizados:
- Agregado sistema de filtros por materia en tab 'Retroalimentaciones'
- Botones dinámicos para cada materia del estudiante
- Botón 'Todas' para ver todas las retroalimentaciones
- Contadores de retroalimentaciones por materia (badges)
- Filtrado en memoria (instantáneo, sin API calls)
- Responsive design para móvil y desktop

Mejoras de UX:
- Fácil navegación cuando hay muchas retroalimentaciones
- Filtrado visual sin afectar carga de datos
- Mantiene orden cronológico en cada vista

Ref: reforma_2025/PLAN_FILTROS_MATERIA.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
"
```

---

## 📸 ANTES Y DESPUÉS

### ANTES:
```
┌─────────────────────────────────────────┐
│ 💬 Retroalimentaciones Recibidas        │
│ Todas las devoluciones...               │
└─────────────────────────────────────────┘

Física - Semana del 13/10/2025    73/100
Química - Semana del 13/10/2025   69/100
Física - Semana del 06/10/2025    80/100
Química - Semana del 06/10/2025   75/100
... (todas mezcladas, scroll largo)
```

### DESPUÉS:
```
┌─────────────────────────────────────────┐
│ 💬 Retroalimentaciones Recibidas        │
│ Todas las devoluciones...               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Todas (12)] [Física (7)] [Química (5)] │
│              ^active                    │
└─────────────────────────────────────────┘

Física - Semana del 13/10/2025    73/100
Física - Semana del 06/10/2025    80/100
Física - Semana del 29/09/2025    85/100
... (solo Física, más fácil de revisar)
```

---

## 🔄 ROLLBACK PLAN

Si algo sale mal:

1. **Git rollback**:
   ```bash
   git log --oneline  # Ver commits
   git reset --hard [COMMIT_SHA]  # Volver al commit anterior
   ```

2. **El código anterior sigue funcionando**:
   - Los filtros son SOLO visuales
   - Si se eliminan, vuelve al comportamiento anterior
   - NO hay cambios en base de datos o APIs

---

**Última actualización**: 22 de octubre de 2025
**Autor**: Claude Code (con supervisión de Rodrigo Di Bernardo)
**Relacionado con**: Reforma 2025 (retroalimentaciones)
