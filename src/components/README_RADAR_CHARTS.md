# Componentes de Gráficos de Radar

Componentes para visualizar métricas de habilidades evaluadas por IA mediante gráficos de radar interactivos.

## 📊 Componentes Disponibles

### 1. SkillsRadarChart
**Ubicación:** `src/components/student/SkillsRadarChart.tsx`

Visualiza las 5 habilidades evaluadas en reportes semanales por el sistema de IA.

**Fuente de datos:** `Feedback.skillsMetrics` (JSON)

**5 Habilidades:**
1. **Comprensión Conceptual** (comprehension)
2. **Pensamiento Crítico** (criticalThinking)
3. **Autorregulación** (selfRegulation)
4. **Aplicación Práctica** (practicalApplication)
5. **Reflexión Metacognitiva** (metacognition)

**Ejemplo de uso:**
```tsx
import SkillsRadarChart from '@/components/student/SkillsRadarChart';

// Obtener datos de la base de datos
const feedback = await db.execute({
  sql: 'SELECT skillsMetrics FROM Feedback WHERE id = ?',
  args: [feedbackId]
});

const skillsData = JSON.parse(feedback.rows[0].skillsMetrics);

// Renderizar componente
<SkillsRadarChart
  skillsData={skillsData}
  subject="Física"
  height={450}
  showInterpretation={true}
/>
```

**Props:**
```typescript
interface SkillsRadarChartProps {
  skillsData: {
    comprehension: number;
    criticalThinking: number;
    selfRegulation: number;
    practicalApplication: number;
    metacognition: number;
  };
  subject?: string;
  className?: string;
  height?: number;
  showInterpretation?: boolean;
}
```

### 2. ExamRadarChart
**Ubicación:** `src/components/evaluation/ExamRadarChart.tsx`

Visualiza las 5 fases de la rúbrica de evaluación de exámenes.

**Fuente de datos:** `Evaluation.feedback` (Markdown - requiere parsing)

**5 Fases de la Rúbrica:**
1. **Fase 1: Comprensión del Problema** (15% peso)
2. **Fase 2: Identificación de Variables** (20% peso)
3. **Fase 3: Selección de Herramientas** (25% peso)
4. **Fase 4: Ejecución y Cálculos** (30% peso)
5. **Fase 5: Verificación y Análisis Crítico** (10% peso)

**Ejemplo de uso:**
```tsx
import ExamRadarChart from '@/components/evaluation/ExamRadarChart';

// Los datos deben extraerse del feedback markdown
// Por ejemplo, parseando la sección "Puntuación por Fase"
const phaseScores = {
  fase1: 77,
  fase2: 62,
  fase3: 92.5,
  fase4: 77,
  fase5: 62
};

// Renderizar componente
<ExamRadarChart
  phaseScores={phaseScores}
  examTopic="Tiro Oblicuo"
  subject="Física 4to C"
  finalScore={58}
  height={450}
  showInterpretation={true}
/>
```

**Props:**
```typescript
interface ExamRadarChartProps {
  phaseScores: {
    fase1: number;
    fase2: number;
    fase3: number;
    fase4: number;
    fase5: number;
  };
  examTopic?: string;
  subject?: string;
  finalScore?: number;
  className?: string;
  height?: number;
  showInterpretation?: boolean;
}
```

## 🎨 Características Visuales

Ambos componentes incluyen:

### Gráfico de Radar
- Rejilla polar con líneas de guía
- Área rellena con opacidad 50%
- Línea de contorno de 2px
- 5 ejes radiales (uno por habilidad/fase)
- Escala 0-100 en cada eje

### Tooltip Interactivo
- Aparece al pasar el mouse sobre el gráfico
- Muestra nombre de la habilidad/fase
- Descripción detallada
- Puntuación numérica

### Indicadores de Rendimiento
- **Promedio/Final:** Puntuación destacada con color según nivel
- **Fortaleza Principal:** Habilidad/fase con mayor puntuación (fondo verde)
- **Área de Mejora:** Habilidad/fase con menor puntuación (fondo amarillo)

### Interpretación
- Guía de interpretación del gráfico
- Explicación de la escala
- Contexto sobre cómo se calculan las métricas

## 🎯 Página de Demostración

**URL:** `http://localhost:3000/demo/radar-charts`

**Ubicación:** `src/app/demo/radar-charts/page.tsx`

La página de demo incluye:
1. Ejemplos de reportes semanales (rendimiento promedio y bajo)
2. Ejemplos de exámenes (rendimiento mixto y alto)
3. Comparación lado a lado de ambos sistemas
4. Información técnica sobre los componentes

## 🔄 Integración en Producción

### Para Reportes Semanales

**Dónde integrar:** Dashboard de estudiante, sección de feedback semanal

```tsx
// src/app/dashboard/student/feedback/[id]/page.tsx

import SkillsRadarChart from '@/components/student/SkillsRadarChart';
import { db } from '@/lib/db';

export default async function FeedbackDetailPage({ params }) {
  const { id } = await params;

  const feedback = await db.execute({
    sql: `
      SELECT
        f.skillsMetrics,
        f.subject,
        pr.weekStart
      FROM Feedback f
      JOIN ProgressReport pr ON f.progressReportId = pr.id
      WHERE f.id = ?
    `,
    args: [id]
  });

  if (!feedback.rows[0]?.skillsMetrics) {
    return <div>No hay métricas disponibles</div>;
  }

  const skillsData = JSON.parse(feedback.rows[0].skillsMetrics);

  return (
    <div className="p-6">
      <h1>Feedback Semanal</h1>

      <SkillsRadarChart
        skillsData={skillsData}
        subject={feedback.rows[0].subject}
        height={500}
      />

      {/* Resto del feedback... */}
    </div>
  );
}
```

### Para Exámenes

**Dónde integrar:** Dashboard de estudiante, sección de resultados de exámenes

**⚠️ IMPORTANTE:** Las puntuaciones por fase NO están almacenadas directamente en la BD.
Se deben extraer parseando el campo `Evaluation.feedback` (markdown).

```tsx
// src/app/dashboard/student/evaluations/[id]/page.tsx

import ExamRadarChart from '@/components/evaluation/ExamRadarChart';
import { db } from '@/lib/db';

export default async function EvaluationDetailPage({ params }) {
  const { id } = await params;

  const evaluation = await db.execute({
    sql: `
      SELECT
        e.feedback,
        e.score,
        e.subject,
        e.examTopic
      FROM Evaluation e
      WHERE e.id = ?
    `,
    args: [id]
  });

  // TODO: Implementar parser del markdown feedback
  // Buscar la sección "Puntuación por Fase:" y extraer valores
  const phaseScores = parsePhaseScoresFromMarkdown(
    evaluation.rows[0].feedback
  );

  return (
    <div className="p-6">
      <h1>Resultado del Examen</h1>

      <ExamRadarChart
        phaseScores={phaseScores}
        examTopic={evaluation.rows[0].examTopic}
        subject={evaluation.rows[0].subject}
        finalScore={evaluation.rows[0].score}
        height={500}
      />

      {/* Feedback completo en markdown... */}
    </div>
  );
}

// Helper function (implementar)
function parsePhaseScoresFromMarkdown(markdown: string) {
  // Regex para extraer puntuaciones de cada fase del markdown
  // Ejemplo: "**Fase 1**: 77/100"
  // Retornar: { fase1: 77, fase2: 62, ... }
}
```

## 📦 Dependencias

Los componentes usan **Recharts 3.3.0** (ya instalado en el proyecto).

```json
{
  "dependencies": {
    "recharts": "^3.3.0"
  }
}
```

## 🎨 Soporte de Dark Mode

Ambos componentes incluyen soporte completo para modo oscuro usando `dark:` variants de Tailwind CSS.

El tema se adapta automáticamente según la configuración del usuario (next-themes).

## 📐 Personalización

### Colores
```tsx
// Modificar stroke y fill en el componente Radar
<Radar
  stroke="#6366f1"  // Color del borde
  fill="#6366f1"    // Color del relleno
  fillOpacity={0.5} // Opacidad del relleno
/>
```

### Altura
```tsx
// Ajustar prop height según el espacio disponible
<SkillsRadarChart height={600} />
```

### Ocultar interpretación
```tsx
// Solo mostrar el gráfico, sin análisis
<SkillsRadarChart showInterpretation={false} />
```

## 🔍 Estructura de Datos

### Feedback.skillsMetrics (JSON)
```json
{
  "comprehension": 66,
  "criticalThinking": 65,
  "selfRegulation": 68,
  "practicalApplication": 70,
  "metacognition": 69
}
```

### Evaluation.feedback (Markdown - extracto)
```markdown
## Puntuación por Fase

**Fase 1 - Comprensión del Problema**: 77/100
**Fase 2 - Identificación de Variables**: 62/100
**Fase 3 - Selección de Herramientas**: 92.5/100
**Fase 4 - Ejecución y Cálculos**: 77/100
**Fase 5 - Verificación y Análisis Crítico**: 62/100

**Puntuación Final Ponderada**: 58/100
```

## 🚀 Próximos Pasos

1. **Integrar SkillsRadarChart** en dashboard de estudiante (reportes semanales)
2. **Implementar parser** para extraer phaseScores del markdown de Evaluation
3. **Integrar ExamRadarChart** en dashboard de estudiante (exámenes)
4. **Opcional:** Crear versión comparativa que muestre evolución temporal
5. **Opcional:** Añadir exportación del gráfico como imagen PNG

## 📝 Notas Técnicas

- Los componentes son **'use client'** porque usan Recharts (interactividad)
- Ambos son **Server Components compatibles**: se pueden usar en páginas Server Component pasando props
- **TypeScript strict mode**: Todos los tipos están correctamente definidos
- **Accesibilidad**: Los gráficos incluyen labels descriptivos y tooltips informativos
- **Responsive**: Los componentes se adaptan al ancho del contenedor (ResponsiveContainer)

## 🐛 Solución de Problemas

### Error: "recharts is not defined"
**Solución:** Verificar que recharts está instalado: `npm install recharts`

### Gráfico no se renderiza
**Solución:** Verificar que el componente padre tiene un ancho definido (no puede ser 0)

### Dark mode no funciona
**Solución:** Verificar que next-themes está configurado en layout.tsx

### Datos no aparecen
**Solución:** Verificar que los datos tienen el formato correcto (objeto con 5 propiedades numéricas)

---

**Creado:** 2025-01-12
**Autor:** Claude Code
**Versión:** 1.0.0
