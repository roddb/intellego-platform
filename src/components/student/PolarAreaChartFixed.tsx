'use client';

import React from 'react';
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip
} from 'recharts';

interface SkillsData {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface PolarAreaChartFixedProps {
  skillsData: SkillsData;
  subject?: string;
  className?: string;
}

export default function PolarAreaChartFixed({ 
  skillsData, 
  subject,
  className = "" 
}: PolarAreaChartFixedProps) {
  
  // Transform data - keep minimum 5 to show structure
  const data = [
    {
      skill: 'Comprensión',
      fullName: 'Comprensión Conceptual',
      value: Math.max(skillsData.comprehension, 5),
      actualValue: skillsData.comprehension
    },
    {
      skill: 'Pensamiento',
      fullName: 'Pensamiento Crítico',
      value: Math.max(skillsData.criticalThinking, 5),
      actualValue: skillsData.criticalThinking
    },
    {
      skill: 'Autorregulación',
      fullName: 'Autorregulación',
      value: Math.max(skillsData.selfRegulation, 5),
      actualValue: skillsData.selfRegulation
    },
    {
      skill: 'Aplicación',
      fullName: 'Aplicación Práctica',
      value: Math.max(skillsData.practicalApplication, 5),
      actualValue: skillsData.practicalApplication
    },
    {
      skill: 'Reflexión',
      fullName: 'Reflexión Metacognitiva',
      value: Math.max(skillsData.metacognition, 5),
      actualValue: skillsData.metacognition
    }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-xl rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.fullName}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {payload[0].payload.actualValue}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      {subject && (
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Progreso en {subject}
        </h3>
      )}
      
      {/* Chart without ResponsiveContainer - Fixed size */}
      <div className="w-full bg-white rounded-xl shadow-lg p-8 flex justify-center items-center overflow-auto">
        <RadarChart 
          width={900} 
          height={900} 
          data={data}
          style={{ transform: 'scale(1.2)' }}
        >
          <defs>
            <linearGradient id="polarGradientFixed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          
          <PolarGrid 
            gridType="polygon"
            radialLines={true}
            stroke="#e5e7eb"
            strokeWidth={1}
            radialLines={false}
          />
          
          <PolarAngleAxis 
            dataKey="skill"
            tick={{ fontSize: 18, fill: '#374151', fontWeight: 'bold' }}
          />
          
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={6}
            tick={{ fontSize: 16, fill: '#6b7280' }}
            axisLine={false}
          />
          
          <Radar
            name="Habilidades"
            dataKey="value"
            stroke="#8b5cf6"
            fill="url(#polarGradientFixed)"
            fillOpacity={0.7}
            strokeWidth={3}
            dot={{ r: 8, fill: '#6366f1' }}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 5' }}
          />
        </RadarChart>
      </div>
    </div>
  );
}