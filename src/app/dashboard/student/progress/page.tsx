'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SkillsRadarChart from '@/components/student/SkillsRadarChart';
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

        {/* Main Content - Radar Chart */}
        <SkillsRadarChart
          skillsData={displaySkills}
          subject={selectedSubject !== 'overall' ? selectedSubject : undefined}
          height={600}
          showInterpretation={true}
        />


      </div>
    </div>
  );
}