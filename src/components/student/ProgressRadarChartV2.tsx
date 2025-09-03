'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface SkillsData {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface ProgressRadarChartProps {
  skillsData: SkillsData;
  subject?: string;
  className?: string;
}

export default function ProgressRadarChartV2({ 
  skillsData, 
  subject,
  className = "" 
}: ProgressRadarChartProps) {
  
  // Transform data for Recharts format
  const data = [
    {
      skill: 'Comprensión',
      fullName: 'Comprensión Conceptual',
      value: skillsData.comprehension,
      fullMark: 100
    },
    {
      skill: 'Pensamiento',
      fullName: 'Pensamiento Crítico',
      value: skillsData.criticalThinking,
      fullMark: 100
    },
    {
      skill: 'Autorregulación',
      fullName: 'Autorregulación',
      value: skillsData.selfRegulation,
      fullMark: 100
    },
    {
      skill: 'Aplicación',
      fullName: 'Aplicación Práctica',
      value: skillsData.practicalApplication,
      fullMark: 100
    },
    {
      skill: 'Reflexión',
      fullName: 'Reflexión Metacognitiva',
      value: skillsData.metacognition,
      fullMark: 100
    }
  ];

  // Calculate average score
  const avgScore = Math.round(
    (skillsData.comprehension + 
     skillsData.criticalThinking + 
     skillsData.selfRegulation + 
     skillsData.practicalApplication + 
     skillsData.metacognition) / 5
  );
  
  // Find strength and weakness
  const skills = [
    skillsData.comprehension,
    skillsData.criticalThinking,
    skillsData.selfRegulation,
    skillsData.practicalApplication,
    skillsData.metacognition
  ];
  
  const skillNames = [
    'Comprensión Conceptual',
    'Pensamiento Crítico',
    'Autorregulación',
    'Aplicación Práctica',
    'Reflexión Metacognitiva'
  ];
  
  const maxSkillIndex = skills.indexOf(Math.max(...skills));
  const minSkillIndex = skills.indexOf(Math.min(...skills));
  const strength = skillNames[maxSkillIndex];
  const weakness = skillNames[minSkillIndex];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.fullName}
          </p>
          <p className="text-lg font-bold text-purple-600">
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for PolarAngleAxis
  const renderPolarAngleAxisLabel = (props: any) => {
    const { payload, x, y, cx, cy } = props;
    const radius = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const adjustedRadius = radius + 35; // Move labels outside the chart
    const angle = Math.atan2(y - cy, x - cx);
    const adjustedX = cx + adjustedRadius * Math.cos(angle);
    const adjustedY = cy + adjustedRadius * Math.sin(angle);
    
    // Determine text anchor based on position
    let textAnchor = 'middle';
    if (adjustedX > cx + 10) textAnchor = 'start';
    if (adjustedX < cx - 10) textAnchor = 'end';
    
    return (
      <text
        x={adjustedX}
        y={adjustedY}
        textAnchor={textAnchor}
        className="fill-gray-700 text-base font-semibold"
        dominantBaseline="central"
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {subject && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Progreso en {subject}
        </h3>
      )}
      
      <div className="flex flex-col items-center">
        <div className="w-full" style={{ minHeight: '500px' }}>
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={data} margin={{ top: 60, right: 80, bottom: 60, left: 80 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              
              <PolarGrid 
                gridType="polygon"
                radialLines={true}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              
              <PolarAngleAxis
                dataKey="skill"
                tick={renderPolarAngleAxisLabel}
                className="text-sm"
              />
              
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                outerRadius={150}
              />
              
              <Radar
                name="Habilidades"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#colorGradient)"
                fillOpacity={0.6}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 w-full max-w-md">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold mb-2">{avgScore}%</div>
            <div className="text-sm opacity-90">Puntuación Promedio</div>
            <div className="mt-3 text-xs">
              <div className="flex justify-between px-4">
                <span>
                  <strong>Fortaleza:</strong> {strength}
                </span>
                <span>
                  <strong>A mejorar:</strong> {weakness}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 w-full bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Detalle de Habilidades
          </h4>
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.skill} className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">{item.fullName}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-white rounded-full h-2.5 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${
                    item.value >= 80 ? 'text-green-600' : 
                    item.value >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}