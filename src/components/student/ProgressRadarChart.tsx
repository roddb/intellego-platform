'use client';

import React, { useEffect, useRef } from 'react';

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

export default function ProgressRadarChart({ 
  skillsData, 
  subject,
  className = "" 
}: ProgressRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Skills labels in Spanish
  const skillLabels = [
    'Comprensión Conceptual',
    'Pensamiento Crítico',
    'Autorregulación',
    'Aplicación Práctica',
    'Reflexión Metacognitiva'
  ];
  
  // Convert skills data to array for easier processing
  const skills = [
    skillsData.comprehension,
    skillsData.criticalThinking,
    skillsData.selfRegulation,
    skillsData.practicalApplication,
    skillsData.metacognition
  ];

  useEffect(() => {
    if (!svgRef.current) return;
    drawRadarChart();
  }, [skillsData]);

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const drawRadarChart = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = 400;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 160;
    const numAxes = 5;
    const angleStep = 360 / numAxes;

    // Clear existing content
    svg.innerHTML = '';

    // Draw grid circles
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('id', 'grid');
    
    for (let i = 1; i <= 4; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', (maxRadius * i / 4).toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#e0e0e0');
      circle.setAttribute('stroke-width', '1');
      gridGroup.appendChild(circle);
    }
    svg.appendChild(gridGroup);

    // Draw axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('id', 'axes');
    axesGroup.setAttribute('stroke', '#ccc');
    axesGroup.setAttribute('stroke-width', '1');
    
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep;
      const endPoint = polarToCartesian(centerX, centerY, maxRadius, angle);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', endPoint.x.toString());
      line.setAttribute('y2', endPoint.y.toString());
      axesGroup.appendChild(line);
    }
    svg.appendChild(axesGroup);

    // Draw data polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('id', 'dataPolygon');
    polygon.setAttribute('fill', 'rgba(102, 126, 234, 0.3)');
    polygon.setAttribute('stroke', '#667eea');
    polygon.setAttribute('stroke-width', '3');
    
    const points: string[] = [];
    const dataPoints = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dataPoints.setAttribute('id', 'dataPoints');
    
    for (let i = 0; i < numAxes; i++) {
      const value = skills[i];
      const radius = (value / 100) * maxRadius;
      const angle = i * angleStep;
      const point = polarToCartesian(centerX, centerY, radius, angle);
      points.push(`${point.x},${point.y}`);
      
      // Add data point circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x.toString());
      circle.setAttribute('cy', point.y.toString());
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', '#667eea');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      dataPoints.appendChild(circle);
    }
    
    polygon.setAttribute('points', points.join(' '));
    svg.appendChild(polygon);
    svg.appendChild(dataPoints);

    // Draw labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('id', 'labels');
    labelsGroup.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    labelsGroup.setAttribute('font-size', '12');
    labelsGroup.setAttribute('font-weight', 'bold');
    labelsGroup.setAttribute('fill', '#2c3e50');
    
    const labelPositions = [
      { x: centerX, y: 30, anchor: 'middle' },           // Top
      { x: 375, y: centerY + 5, anchor: 'start' },       // Right
      { x: 340, y: 340, anchor: 'start' },               // Bottom-right
      { x: 60, y: 340, anchor: 'end' },                  // Bottom-left
      { x: 60, y: 85, anchor: 'end' }                    // Top-left
    ];
    
    for (let i = 0; i < numAxes; i++) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelPositions[i].x.toString());
      text.setAttribute('y', labelPositions[i].y.toString());
      text.setAttribute('text-anchor', labelPositions[i].anchor);
      text.textContent = skillLabels[i];
      labelsGroup.appendChild(text);
    }
    svg.appendChild(labelsGroup);

    // Draw scale labels
    const scaleLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    scaleLabels.setAttribute('id', 'scaleLabels');
    scaleLabels.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    scaleLabels.setAttribute('font-size', '10');
    scaleLabels.setAttribute('fill', '#666');
    
    const scaleValues = [100, 75, 50, 25];
    const scalePositions = [40, 80, 120, 160];
    
    for (let i = 0; i < scaleValues.length; i++) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (centerX + 10).toString());
      text.setAttribute('y', (centerY - scalePositions[i] + 5).toString());
      text.setAttribute('text-anchor', 'start');
      text.textContent = scaleValues[i].toString();
      scaleLabels.appendChild(text);
    }
    svg.appendChild(scaleLabels);
  };

  // Calculate average score
  const avgScore = Math.round(
    (skills.reduce((a, b) => a + b, 0) / skills.length)
  );
  
  // Find strength and weakness
  const maxSkillIndex = skills.indexOf(Math.max(...skills));
  const minSkillIndex = skills.indexOf(Math.min(...skills));
  const strength = skillLabels[maxSkillIndex];
  const weakness = skillLabels[minSkillIndex];

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {subject && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Progreso en {subject}
        </h3>
      )}
      
      <div className="flex flex-col items-center">
        <svg 
          ref={svgRef}
          width="400" 
          height="400" 
          viewBox="0 0 400 400"
          className="max-w-full h-auto"
        />
        
        <div className="mt-6 w-full max-w-md">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-4 text-center">
            <div className="text-3xl font-bold mb-2">{avgScore}%</div>
            <div className="text-sm opacity-90">Puntuación Promedio</div>
            <div className="mt-3 text-xs">
              <div className="flex justify-between">
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
        
        <div className="mt-6 w-full bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">📊 Detalle de Habilidades:</h4>
          <div className="space-y-2">
            {skillLabels.map((label, index) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{label}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${skills[index]}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-10 text-right">
                    {skills[index]}%
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