import React from 'react';
import SkillsRadarChart from '@/components/student/SkillsRadarChart';
import ExamRadarChart from '@/components/evaluation/ExamRadarChart';

/**
 * Demo Page - Radar Charts
 *
 * Página de demostración para visualizar los dos tipos de RadarCharts:
 * 1. SkillsRadarChart: Para reportes semanales (5 habilidades)
 * 2. ExamRadarChart: Para exámenes (5 fases de rúbrica)
 *
 * Acceso: http://localhost:3000/demo/radar-charts
 */

export default function RadarChartsDemo(): React.ReactElement {
  // Datos reales de ejemplo de Feedback.skillsMetrics (de producción)
  const weeklyReportSkills = {
    comprehension: 66,
    criticalThinking: 65,
    selfRegulation: 68,
    practicalApplication: 70,
    metacognition: 69,
  };

  // Datos de ejemplo para examen (simulando análisis de IA)
  const examPhaseScores = {
    fase1: 77, // Comprensión del Problema
    fase2: 62, // Identificación de Variables
    fase3: 92.5, // Selección de Herramientas
    fase4: 77, // Ejecución y Cálculos
    fase5: 62, // Verificación y Análisis Crítico
  };

  // Otro ejemplo: estudiante con bajo rendimiento
  const lowPerformanceSkills = {
    comprehension: 42,
    criticalThinking: 38,
    selfRegulation: 45,
    practicalApplication: 40,
    metacognition: 35,
  };

  // Otro ejemplo: estudiante con alto rendimiento
  const highPerformancePhases = {
    fase1: 92.5,
    fase2: 92.5,
    fase3: 92.5,
    fase4: 92.5,
    fase5: 77,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Gráficos de Radar - Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Visualización de métricas de IA con rúbricas educativas
          </p>
        </div>

        {/* Sección 1: Reportes Semanales */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              1. Reportes Semanales - 5 Habilidades
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Visualiza las métricas calculadas por IA almacenadas en{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                Feedback.skillsMetrics
              </code>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ejemplo 1: Rendimiento promedio */}
            <SkillsRadarChart
              skillsData={weeklyReportSkills}
              subject="Física"
              height={450}
            />

            {/* Ejemplo 2: Bajo rendimiento */}
            <SkillsRadarChart
              skillsData={lowPerformanceSkills}
              subject="Matemática"
              height={450}
            />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t-2 border-gray-300 dark:border-gray-700 my-12"></div>

        {/* Sección 2: Exámenes */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              2. Exámenes - 5 Fases de Rúbrica
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Visualiza el análisis por fases almacenado en la tabla{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                Evaluation
              </code>
              {' '}usando la rúbrica RUBRICA_5_FASES
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ejemplo 1: Rendimiento mixto */}
            <ExamRadarChart
              phaseScores={examPhaseScores}
              examTopic="Tiro Oblicuo"
              subject="Física 4to C"
              height={450}
            />

            {/* Ejemplo 2: Alto rendimiento */}
            <ExamRadarChart
              phaseScores={highPerformancePhases}
              examTopic="Cinemática Avanzada"
              subject="Física 5to B"
              finalScore={91}
              height={450}
            />
          </div>
        </section>

        {/* Divider */}
        <div className="border-t-2 border-gray-300 dark:border-gray-700 my-12"></div>

        {/* Sección 3: Comparación Lado a Lado */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              3. Comparación: Habilidades vs Fases
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ambos sistemas usan IA pero con diferentes rúbricas y propósitos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Reportes Semanales */}
            <div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  📝 Reportes Semanales
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Evalúa 5 preguntas reflexivas</li>
                  <li>• Rúbrica de 4 fases de pensamiento crítico</li>
                  <li>• Genera 5 métricas de habilidades</li>
                  <li>• Almacena en: Feedback.skillsMetrics (JSON)</li>
                </ul>
              </div>
              <SkillsRadarChart
                skillsData={weeklyReportSkills}
                subject="Física"
                height={400}
                showInterpretation={false}
              />
            </div>

            {/* Exámenes */}
            <div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
                  📊 Exámenes
                </h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Evalúa ejercicios de examen (Markdown)</li>
                  <li>• Rúbrica de 5 fases de resolución de problemas</li>
                  <li>• Genera puntuación ponderada por fase</li>
                  <li>• Almacena en: Evaluation.feedback (Markdown)</li>
                </ul>
              </div>
              <ExamRadarChart
                phaseScores={examPhaseScores}
                examTopic="Tiro Oblicuo"
                subject="Física 4to C"
                height={400}
                showInterpretation={false}
              />
            </div>
          </div>
        </section>

        {/* Información técnica */}
        <section className="mt-12">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-indigo-200 dark:border-indigo-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              💡 Información Técnica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  SkillsRadarChart
                </h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Archivo: <code className="text-xs">src/components/student/SkillsRadarChart.tsx</code></li>
                  <li>• Props: skillsData (5 habilidades 0-100)</li>
                  <li>• Fuente de datos: Feedback.skillsMetrics</li>
                  <li>• Calcula promedio y identifica fortalezas/debilidades</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ExamRadarChart
                </h3>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Archivo: <code className="text-xs">src/components/evaluation/ExamRadarChart.tsx</code></li>
                  <li>• Props: phaseScores (5 fases 0-100)</li>
                  <li>• Fuente de datos: Evaluation (extraer de feedback)</li>
                  <li>• Calcula puntuación ponderada según pesos de rúbrica</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🔗 Uso en Producción
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Para integrar estos componentes en páginas reales:
              </p>
              <ol className="text-gray-600 dark:text-gray-400 text-sm list-decimal list-inside space-y-1 mt-2">
                <li>Obtén los datos de la base de datos (Feedback o Evaluation)</li>
                <li>Parsea el JSON (skillsMetrics) o extrae las puntuaciones del markdown (feedback)</li>
                <li>Pasa los datos al componente correspondiente</li>
                <li>Personaliza con subject, examTopic, height según necesites</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 pb-8">
          <p>Intellego Platform - Sistema de Evaluación con IA</p>
          <p className="mt-2">
            Componentes creados con Recharts 3.3.0 | Next.js 15.3.4 | React 19.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
