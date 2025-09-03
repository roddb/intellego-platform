'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProgressRadarChart from '@/components/student/ProgressRadarChart';
import { ArrowLeft, TrendingUp, Award, Target, BookOpen } from 'lucide-react';

interface SkillsData {
  comprehension: number;
  criticalThinking: number;
  selfRegulation: number;
  practicalApplication: number;
  metacognition: number;
}

interface SubjectProgress {
  subject: string;
  skills: SkillsData;
  totalFeedbacks: number;
}

export default function StudentProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overallSkills, setOverallSkills] = useState<SkillsData | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('overall');
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user) {
      if (session.user.role !== 'STUDENT') {
        router.push('/dashboard');
      } else {
        fetchSkillsProgress();
      }
    }
  }, [status, session, router]);

  const fetchSkillsProgress = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/student/skills-progress?userId=${session.user.id}`);
      
      if (!response.ok) throw new Error('Failed to fetch progress');
      
      const data = await response.json();
      
      if (data.overall) {
        setOverallSkills(data.overall.skills);
        setTotalFeedbacks(data.overall.totalFeedbacks);
        setSubjectProgress(data.bySubject || []);
      } else {
        // No progress yet
        setOverallSkills({
          comprehension: 0,
          criticalThinking: 0,
          selfRegulation: 0,
          practicalApplication: 0,
          metacognition: 0
        });
        setTotalFeedbacks(0);
      }
    } catch (error) {
      console.error('Error fetching skills progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplaySkills = (): SkillsData => {
    if (selectedSubject === 'overall') {
      return overallSkills || {
        comprehension: 0,
        criticalThinking: 0,
        selfRegulation: 0,
        practicalApplication: 0,
        metacognition: 0
      };
    }
    
    const subject = subjectProgress.find(s => s.subject === selectedSubject);
    return subject?.skills || {
      comprehension: 0,
      criticalThinking: 0,
      selfRegulation: 0,
      practicalApplication: 0,
      metacognition: 0
    };
  };

  const getProgressMessage = (avgScore: number) => {
    if (avgScore >= 90) return "¡Excelente! Estás demostrando un dominio excepcional.";
    if (avgScore >= 75) return "¡Muy bien! Tu progreso es consistente y sólido.";
    if (avgScore >= 60) return "Buen trabajo. Continúa esforzándote para mejorar.";
    if (avgScore >= 40) return "Sigue adelante. Con práctica mejorarás tus habilidades.";
    return "Es momento de reforzar los conceptos básicos.";
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null;
  }

  const displaySkills = getDisplaySkills();
  const avgScore = Math.round(
    Object.values(displaySkills).reduce((a, b) => a + b, 0) / 5
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/student')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mi Progreso Académico</h1>
                <p className="text-gray-600 mt-1">
                  Visualiza tu desarrollo en las diferentes habilidades académicas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                {totalFeedbacks} evaluaciones recibidas
              </span>
            </div>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Ver progreso en:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedSubject('overall')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubject === 'overall'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                General
              </button>
              {subjectProgress.map(sp => (
                <button
                  key={sp.subject}
                  onClick={() => setSelectedSubject(sp.subject)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSubject === sp.subject
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sp.subject}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div>
            <ProgressRadarChart 
              skillsData={displaySkills}
              subject={selectedSubject !== 'overall' ? selectedSubject : undefined}
            />
          </div>

          {/* Progress Info */}
          <div className="space-y-6">
            {/* Overall Score Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Puntuación General
                  </h3>
                  <p className="text-3xl font-bold text-purple-600 mt-1">
                    {avgScore}%
                  </p>
                </div>
              </div>
              <p className="text-gray-600">
                {getProgressMessage(avgScore)}
              </p>
            </div>

            {/* Skills Explanation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Descripción de Habilidades
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-700">Comprensión Conceptual:</strong>
                  <p className="text-gray-600">
                    Tu capacidad para entender y dominar los conceptos fundamentales de la materia.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Pensamiento Crítico:</strong>
                  <p className="text-gray-600">
                    Habilidad para analizar, evaluar y sintetizar información de manera reflexiva.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Autorregulación:</strong>
                  <p className="text-gray-600">
                    Capacidad de gestionar tu propio aprendizaje y estrategias de estudio.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Aplicación Práctica:</strong>
                  <p className="text-gray-600">
                    Destreza para transferir el conocimiento a situaciones reales y resolver problemas.
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Reflexión Metacognitiva:</strong>
                  <p className="text-gray-600">
                    Conciencia y comprensión sobre tu propio proceso de aprendizaje.
                  </p>
                </div>
              </div>
            </div>

            {/* Goals and Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Objetivos y Recomendaciones
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Enfócate en mejorar tu habilidad más baja para un desarrollo equilibrado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Mantén consistencia en tus entregas semanales para un mejor seguimiento.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Revisa las devoluciones de tus instructores para identificar áreas de mejora.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Establece metas específicas para cada habilidad y monitorea tu progreso.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}