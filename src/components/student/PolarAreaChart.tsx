'use client';

import React from 'react';
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface SkillsData {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface PolarAreaChartProps {
  skillsData: SkillsData;
  subject?: string;
  className?: string;
}

export default function PolarAreaChart({ 
  skillsData, 
  subject,
  className = "" 
}: PolarAreaChartProps) {
  
  // Debug: Log the data we're receiving
  console.log('PolarAreaChart received skillsData:', skillsData);
  
  // Transform data for Recharts format
  // Add minimum value of 5 to show structure even with 0% data
  const data = [
    {
      skill: 'Comprensión',
      fullName: 'Comprensión Conceptual',
      value: skillsData.comprehension || 5,
      actualValue: skillsData.comprehension
    },
    {
      skill: 'Pensamiento',
      fullName: 'Pensamiento Crítico',
      value: skillsData.criticalThinking || 5,
      actualValue: skillsData.criticalThinking
    },
    {
      skill: 'Autorregulación',
      fullName: 'Autorregulación',
      value: skillsData.selfRegulation || 5,
      actualValue: skillsData.selfRegulation
    },
    {
      skill: 'Aplicación',
      fullName: 'Aplicación Práctica',
      value: skillsData.practicalApplication || 5,
      actualValue: skillsData.practicalApplication
    },
    {
      skill: 'Reflexión',
      fullName: 'Reflexión Metacognitiva',
      value: skillsData.metacognition || 5,
      actualValue: skillsData.metacognition
    }
  ];

  // Custom tooltip - Show actual value, not the minimum display value
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

  // Custom label renderer for better positioning
  const renderPolarAngleAxisTick = ({ payload, x, y, cx, cy, ...rest }: any) => {
    return (
      <text
        {...rest}
        x={x}
        y={y}
        className="fill-gray-700 text-sm font-semibold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {subject && (
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Progreso en {subject}
        </h3>
      )}
      
      {/* Main Chart - Clean without duplicated elements */}
      <div className="w-full h-[700px] bg-white rounded-xl shadow-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius={280} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="polarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
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
              tick={renderPolarAngleAxisTick}
              className="text-sm"
            />
            
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              tick={{ fontSize: 14, fill: '#6b7280' }}
              axisLine={false}
            />
            
            <Radar
              name="Habilidades"
              dataKey="value"
              stroke="#8b5cf6"
              fill="url(#polarGradient)"
              fillOpacity={0.7}
              strokeWidth={2}
              dot={{ r: 6, fill: '#6366f1' }}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}