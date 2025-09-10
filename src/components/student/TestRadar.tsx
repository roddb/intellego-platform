'use client';

import React from 'react';
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from 'recharts';

export default function TestRadar() {
  // Fixed test data to debug
  const testData = [
    { skill: 'Comprensión', value: 75 },
    { skill: 'Pensamiento', value: 65 },
    { skill: 'Autorregulación', value: 80 },
    { skill: 'Aplicación', value: 70 },
    { skill: 'Reflexión', value: 85 }
  ];

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Test Radar - Valores Fijos</h2>
      
      {/* Test 1: Fixed pixel size */}
      <div className="bg-blue-50 p-4 mb-4">
        <p className="text-sm mb-2">Test 1: Tamaño fijo 800x800px</p>
        <div style={{ width: '800px', height: '800px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={testData} outerRadius={350}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test 2: Percentage based */}
      <div className="bg-green-50 p-4 mb-4">
        <p className="text-sm mb-2">Test 2: OuterRadius 95%</p>
        <div className="w-full h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={testData} outerRadius="95%">
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test 3: No container restrictions */}
      <div className="bg-yellow-50 p-4">
        <p className="text-sm mb-2">Test 3: Sin ResponsiveContainer</p>
        <RadarChart width={800} height={800} data={testData} outerRadius={350}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
        </RadarChart>
      </div>
    </div>
  );
}