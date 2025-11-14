'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

/**
 * ExamRadarChart Component
 *
 * Visualiza las 5 fases de la rúbrica de evaluación de exámenes mediante un gráfico de radar.
 * Los datos deben extraerse del análisis de la IA (campo feedback en tabla Evaluation).
 *
 * Rúbrica de 5 Fases:
 * - Fase 1: Comprensión del Problema (15% peso)
 * - Fase 2: Identificación de Variables (20% peso)
 * - Fase 3: Selección de Herramientas (25% peso)
 * - Fase 4: Ejecución y Cálculos (30% peso)
 * - Fase 5: Verificación y Análisis Crítico (10% peso)
 *
 * @example
 * ```tsx
 * <ExamRadarChart
 *   phaseScores={{
 *     fase1: 77,
 *     fase2: 62,
 *     fase3: 92.5,
 *     fase4: 77,
 *     fase5: 62
 *   }}
 *   examTopic="Tiro Oblicuo"
 *   subject="Física"
 * />
 * ```
 */

interface ExamRadarChartProps {
  /** Puntuaciones de las 5 fases de la rúbrica (0-100 cada una) */
  phaseScores: {
    fase1: number; // Comprensión del Problema
    fase2: number; // Identificación de Variables
    fase3: number; // Selección de Herramientas
    fase4: number; // Ejecución y Cálculos
    fase5: number; // Verificación y Análisis Crítico
  };
  /** Tema del examen */
  examTopic?: string;
  /** Materia */
  subject?: string;
  /** Puntuación final calculada (0-100) */
  finalScore?: number;
  /** Clases CSS adicionales */
  className?: string;
  /** Altura del gráfico en píxeles */
  height?: number;
  /** Mostrar interpretación detallada */
  showInterpretation?: boolean;
}

interface RadarDataPoint {
  phase: string;
  score: number;
  fullMark: 100;
  weight: number;
  description: string;
}

export default function ExamRadarChart({
  phaseScores,
  examTopic,
  subject,
  finalScore,
  className = '',
  height = 400,
  showInterpretation = true,
}: ExamRadarChartProps): React.ReactElement {

  // Configuración de las 5 fases con nombres, descripciones y pesos
  const phaseConfig = {
    fase1: {
      name: 'Fase 1: Comprensión',
      shortName: 'Comprensión',
      description: 'Comprensión del problema, identificación de datos relevantes',
      weight: 15,
    },
    fase2: {
      name: 'Fase 2: Variables',
      shortName: 'Variables',
      description: 'Identificación correcta de variables, unidades y organización',
      weight: 20,
    },
    fase3: {
      name: 'Fase 3: Herramientas',
      shortName: 'Herramientas',
      description: 'Selección de fórmulas y herramientas matemáticas apropiadas',
      weight: 25,
    },
    fase4: {
      name: 'Fase 4: Ejecución',
      shortName: 'Ejecución',
      description: 'Desarrollo de cálculos paso a paso con unidades correctas',
      weight: 30,
    },
    fase5: {
      name: 'Fase 5: Verificación',
      shortName: 'Verificación',
      description: 'Verificación de resultados y análisis crítico de la solución',
      weight: 10,
    },
  };

  // Transformar datos para Recharts
  const radarData: RadarDataPoint[] = Object.entries(phaseScores).map(([key, score]) => {
    const config = phaseConfig[key as keyof typeof phaseScores];
    return {
      phase: config.shortName,
      score: Math.round(score * 10) / 10, // Redondear a 1 decimal
      fullMark: 100,
      weight: config.weight,
      description: config.description,
    };
  });

  // Calcular puntuación final si no se proporciona
  const calculatedFinalScore = finalScore ?? Math.round(
    (phaseScores.fase1 * 0.15) +
    (phaseScores.fase2 * 0.20) +
    (phaseScores.fase3 * 0.25) +
    (phaseScores.fase4 * 0.30) +
    (phaseScores.fase5 * 0.10)
  );

  // Determinar color según puntuación final
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Determinar mensaje según puntuación
  const getPerformanceMessage = (score: number): string => {
    if (score >= 80) return 'Excelente - Dominio completo';
    if (score >= 60) return 'Bueno - Conocimiento sólido';
    if (score >= 40) return 'Aceptable - Necesita refuerzo';
    return 'Insuficiente - Requiere estudio intensivo';
  };

  // Identificar fase más fuerte
  const strongestPhase = Object.entries(phaseScores).reduce((max, [key, score]) =>
    score > max.score ? { key, score } : max,
    { key: '', score: 0 }
  );

  // Identificar fase más débil
  const weakestPhase = Object.entries(phaseScores).reduce((min, [key, score]) =>
    score < min.score ? { key, score } : min,
    { key: '', score: 100 }
  );

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RadarDataPoint;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border-2 border-indigo-500 dark:border-indigo-400">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {data.phase}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {data.description}
          </p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {data.score}/100
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Peso: {data.weight}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Análisis por Rúbrica de 5 Fases
          </h2>
          {(subject || examTopic) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subject && <span className="font-semibold">{subject}</span>}
              {subject && examTopic && ' - '}
              {examTopic && <span>{examTopic}</span>}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Evaluación automática con IA - Rúbrica RUBRICA_5_FASES
          </p>
        </div>

        {/* Puntuación final destacada */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Puntuación Final Ponderada
              </p>
              <p className={`text-3xl font-bold ${getScoreColor(calculatedFinalScore)}`}>
                {calculatedFinalScore}/100
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getPerformanceMessage(calculatedFinalScore)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calculado con pesos de rúbrica
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Radar */}
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData}>
            <PolarGrid
              stroke="#cbd5e1"
              strokeDasharray="3 3"
              className="dark:stroke-gray-600"
            />
            <PolarAngleAxis
              dataKey="phase"
              tick={{
                fill: '#475569',
                fontSize: 12,
                fontWeight: 600,
              }}
              className="dark:fill-gray-300"
            />
            <PolarRadiusAxis
              angle={72}
              domain={[0, 100]}
              tick={{
                fill: '#94a3b8',
                fontSize: 11,
              }}
              className="dark:fill-gray-400"
              tickCount={6}
            />
            <Radar
              name="Puntuación"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Desglose de pesos */}
        {showInterpretation && (
          <div className="mt-6 space-y-3">
            {/* Distribución de pesos */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                ⚖️ Distribución de Pesos en Rúbrica
              </p>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {Object.entries(phaseConfig).map(([key, config]) => (
                  <div key={key} className="text-center">
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {config.shortName}
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {config.weight}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fortaleza */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                💪 Fase Más Fuerte
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                <strong>{phaseConfig[strongestPhase.key as keyof typeof phaseScores].name}</strong>
                {' '}({Math.round(strongestPhase.score * 10) / 10}/100) - {' '}
                {phaseConfig[strongestPhase.key as keyof typeof phaseScores].description}
              </p>
            </div>

            {/* Área de mejora */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                🎯 Fase a Mejorar
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{phaseConfig[weakestPhase.key as keyof typeof phaseScores].name}</strong>
                {' '}({Math.round(weakestPhase.score * 10) / 10}/100) - Requiere práctica y refuerzo
              </p>
            </div>

            {/* Guía de interpretación */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                📊 Cómo se calcula la puntuación
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Cada fase se evalúa en 4 niveles: Nivel 4 (92.5), Nivel 3 (77), Nivel 2 (62), Nivel 1 (27)</li>
                <li>• La puntuación final es el promedio ponderado según los pesos de cada fase</li>
                <li>• Las fases con mayor peso (Ejecución 30%, Herramientas 25%) impactan más el resultado</li>
                <li>• La IA analiza cada ejercicio usando criterios específicos de la rúbrica</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
