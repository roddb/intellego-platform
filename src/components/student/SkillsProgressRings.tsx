'use client';

import React from 'react';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Wrench, 
  Eye 
} from 'lucide-react';

interface SkillsData {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface SkillsProgressRingsProps {
  skillsData: SkillsData;
  subject?: string;
  className?: string;
}

export default function SkillsProgressRings({ 
  skillsData, 
  subject,
  className = "" 
}: SkillsProgressRingsProps) {
  
  const skills = [
    {
      name: 'Comprensión Conceptual',
      description: 'Tu capacidad para entender y dominar los conceptos fundamentales de la materia',
      value: skillsData.comprehension,
      icon: Brain,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Pensamiento Crítico',
      description: 'Habilidad para analizar, evaluar y sintetizar información de manera reflexiva',
      value: skillsData.criticalThinking,
      icon: Lightbulb,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      name: 'Autorregulación',
      description: 'Capacidad de gestionar tu propio aprendizaje y estrategias de estudio',
      value: skillsData.selfRegulation,
      icon: Target,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Aplicación Práctica',
      description: 'Destreza para transferir el conocimiento a situaciones reales y resolver problemas',
      value: skillsData.practicalApplication,
      icon: Wrench,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      name: 'Reflexión Metacognitiva',
      description: 'Conciencia y comprensión sobre tu propio proceso de aprendizaje',
      value: skillsData.metacognition,
      icon: Eye,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    }
  ];

  const CircularProgress = ({ skill }: { skill: typeof skills[0] }) => {
    const radius = 70;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (skill.value / 100) * circumference;
    const Icon = skill.icon;

    return (
      <div className={`${skill.bgColor} ${skill.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group relative`}>
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 min-w-[250px] max-w-xs whitespace-normal">
          <div className="font-bold mb-1">{skill.name}</div>
          <div className="text-xs leading-relaxed">{skill.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              {/* Background Circle */}
              <circle
                stroke="#e5e7eb"
                fill="#f9fafb"
                strokeWidth={2}
                r={normalizedRadius + 2}
                cx={radius}
                cy={radius}
                opacity="0.3"
              />
              {/* Progress Fill Background */}
              <circle
                fill="url(#fill-gradient-${skill.name})"
                r={normalizedRadius - 2}
                cx={radius}
                cy={radius}
                opacity="0.15"
              />
              {/* Progress Fill - using another circle with strokeDasharray for fill effect */}
              <circle
                className="transition-all duration-1000 ease-out"
                stroke="url(#fill-gradient-${skill.name})"
                fill="transparent"
                strokeWidth={normalizedRadius * 2}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius / 2}
                cx={radius}
                cy={radius}
                opacity="0.1"
              />
              {/* Progress Circle Border */}
              <circle
                className="transition-all duration-1000 ease-out"
                stroke="url(#gradient-${skill.name})"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Gradient Definitions */}
              <defs>
                <linearGradient id={`gradient-${skill.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${skill.color.split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
                  <stop offset="100%" className={`${skill.color.split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
                </linearGradient>
                <radialGradient id={`fill-gradient-${skill.name}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" className={`${skill.color.split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" stopOpacity="0.6" />
                  <stop offset="100%" className={`${skill.color.split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" stopOpacity="0.8" />
                </radialGradient>
              </defs>
            </svg>
            
            {/* Center Content with better spacing */}
            <div className="absolute inset-4 flex flex-col items-center justify-center">
              <Icon className="w-6 h-6 text-gray-700 mb-2" />
              <div className="text-xl font-bold text-gray-800">{skill.value}%</div>
            </div>
          </div>
          
          {/* Skill Name */}
          <h3 className="mt-4 text-sm font-semibold text-gray-700 text-center">
            {skill.name}
          </h3>
        </div>
      </div>
    );
  };

  // Calculate average
  const avgScore = Math.round(
    Object.values(skillsData).reduce((a, b) => a + b, 0) / 5
  );

  return (
    <div className={`w-full ${className}`}>
      {subject && (
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Progreso en {subject}
        </h3>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {skills.map((skill) => (
          <CircularProgress key={skill.name} skill={skill} />
        ))}
      </div>

      {/* Average Score Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Promedio General</h3>
            <p className="text-4xl font-bold mt-2">{avgScore}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Mejor habilidad</p>
            <p className="text-lg font-semibold">
              {skills.reduce((prev, current) => prev.value > current.value ? prev : current).name}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}