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
 * SkillsRadarChart Component
 *
 * Visualiza las 5 habilidades evaluadas por la IA mediante un gráfico de radar.
 * Los datos provienen de Feedback.skillsMetrics (JSON) que contiene las métricas
 * calculadas automáticamente por el sistema de corrección con IA.
 *
 * @example
 * ```tsx
 * <SkillsRadarChart
 *   skillsData={{
 *     comprehension: 66,
 *     criticalThinking: 65,
 *     selfRegulation: 68,
 *     practicalApplication: 70,
 *     metacognition: 69
 *   }}
 *   subject="Física"
 * />
 * ```
 */

interface SkillsRadarChartProps {
  /** Métricas de habilidades calculadas por IA (0-100 para cada habilidad) */
  skillsData: {
    comprehension: number;
    criticalThinking: number;
    selfRegulation: number;
    practicalApplication: number;
    metacognition: number;
  };
  /** Materia opcional para contexto en el título */
  subject?: string;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Altura del gráfico en píxeles */
  height?: number;
  /** Mostrar interpretación detallada */
  showInterpretation?: boolean;
}

interface RadarDataPoint {
  skill: string;
  score: number;
  fullMark: 100;
  description: string;
}

export default function SkillsRadarChart({
  skillsData,
  subject,
  className = '',
  height = 400,
  showInterpretation = true,
}: SkillsRadarChartProps): React.ReactElement {

  // Mapeo de habilidades con nombres en español y descripciones
  const skillLabels: Record<keyof typeof skillsData, { name: string; description: string }> = {
    comprehension: {
      name: 'Comprensión Conceptual',
      description: 'Entendimiento de conceptos fundamentales y su aplicación',
    },
    criticalThinking: {
      name: 'Pensamiento Crítico',
      description: 'Capacidad de análisis, evaluación y síntesis de información',
    },
    selfRegulation: {
      name: 'Autorregulación',
      description: 'Gestión autónoma del proceso de aprendizaje',
    },
    practicalApplication: {
      name: 'Aplicación Práctica',
      description: 'Transferencia de conocimientos a situaciones reales',
    },
    metacognition: {
      name: 'Reflexión Metacognitiva',
      description: 'Conciencia y análisis del propio proceso de aprendizaje',
    },
  };

  // Transformar datos para Recharts - solo incluir claves válidas
  const radarData: RadarDataPoint[] = Object.entries(skillsData)
    .filter(([key]) => key in skillLabels) // Filtrar solo claves que existen en skillLabels
    .map(([key, score]) => {
      const skillKey = key as keyof typeof skillLabels;
      return {
        skill: skillLabels[skillKey].name,
        score: Math.round(score), // Redondear para mejor visualización
        fullMark: 100,
        description: skillLabels[skillKey].description,
      };
    });

  // Calcular promedio de habilidades - solo usar claves válidas
  const validSkillsData = Object.entries(skillsData)
    .filter(([key]) => key in skillLabels)
    .map(([, score]) => score);

  const averageScore = validSkillsData.length > 0
    ? Math.round(validSkillsData.reduce((acc, val) => acc + val, 0) / validSkillsData.length)
    : 0;

  // Determinar color según promedio
  const getAverageColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Determinar mensaje según promedio
  const getPerformanceMessage = (score: number): string => {
    if (score >= 80) return 'Excelente desempeño';
    if (score >= 60) return 'Buen desempeño';
    if (score >= 40) return 'Desempeño aceptable';
    return 'Necesita mejorar';
  };

  // Identificar fortaleza (habilidad con mayor puntuación) - solo claves válidas
  const validSkillEntries = Object.entries(skillsData).filter(([key]) => key in skillLabels);

  const strongestSkill = validSkillEntries.reduce(
    (max, [key, score]) => (score > max.score ? { key, score } : max),
    { key: '', score: 0 }
  );

  // Identificar área de mejora (habilidad con menor puntuación) - solo claves válidas
  const weakestSkill = validSkillEntries.reduce(
    (min, [key, score]) => (score < min.score ? { key, score } : min),
    { key: '', score: 100 }
  );

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RadarDataPoint;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border-2 border-blue-500 dark:border-blue-400">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {data.skill}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {data.description}
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Puntuación: {data.score}/100
          </p>
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
            Evaluación de Competencias{subject ? ` - ${subject}` : ''}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Análisis automático generado por IA con rúbrica de 4 fases
          </p>
        </div>

        {/* Promedio destacado */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Promedio General
              </p>
              <p className={`text-3xl font-bold ${getAverageColor(averageScore)}`}>
                {averageScore}/100
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getPerformanceMessage(averageScore)}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de Radar */}
        <div className="w-full flex justify-center my-8">
          <div style={{ width: '1000px', height: '750px' }}>
            <RadarChart width={1000} height={750} data={radarData}>
              <PolarGrid
                stroke="#cbd5e1"
                strokeDasharray="3 3"
                className="dark:stroke-gray-600"
              />
              <PolarAngleAxis
                dataKey="skill"
                tick={{
                  fill: '#475569',
                  fontSize: 12,
                  fontWeight: 600,
                }}
                className="dark:fill-gray-300"
              />
              <PolarRadiusAxis
                angle={90}
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
                stroke="#3b82f6"
                fill="#3b82f6"
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
          </div>
        </div>

        {/* Interpretación */}
        {showInterpretation && validSkillEntries.length > 0 && (
          <div className="mt-6 space-y-3">
            {/* Fortaleza */}
            {strongestSkill.key && strongestSkill.key in skillLabels && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                  💪 Fortaleza Principal
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  <strong>{skillLabels[strongestSkill.key as keyof typeof skillLabels].name}</strong>
                  {' '}({Math.round(strongestSkill.score)}/100) - {' '}
                  {skillLabels[strongestSkill.key as keyof typeof skillLabels].description}
                </p>
              </div>
            )}

            {/* Área de mejora */}
            {weakestSkill.key && weakestSkill.key in skillLabels && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  🎯 Área de Mejora
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>{skillLabels[weakestSkill.key as keyof typeof skillLabels].name}</strong>
                  {' '}({Math.round(weakestSkill.score)}/100) - Requiere atención y práctica adicional
                </p>
              </div>
            )}

            {/* Guía de interpretación */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                📊 Cómo interpretar este gráfico
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Las áreas más alejadas del centro indican mayor dominio</li>
                <li>• Cada habilidad se evalúa en escala 0-100</li>
                <li>• Los valores se calculan automáticamente según tus respuestas</li>
                <li>• La IA analiza patrones en tus respuestas usando una rúbrica de 4 fases</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
