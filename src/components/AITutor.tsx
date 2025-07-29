'use client'

import { useState, useEffect } from 'react'
import { Brain, MessageSquare, BarChart3, Sparkles, TrendingUp, Award, CheckCircle, Target } from 'lucide-react'
import EnhancedAITutorChat from './EnhancedAITutorChat'
import AIStatus from './AIStatus'

interface StudentAnalysis {
  userId: string
  subjects: SubjectAnalysis[]
  overallPerformance: number
  strugglingAreas: string[]
  strengths: string[]
  recommendedTopics: string[]
  learningPattern: string
  progressTrend: 'improving' | 'stable' | 'declining'
}

interface SubjectAnalysis {
  subject: string
  subjectName: string
  performance: number
  needsAttention: boolean
  recentMentions: number
}

export default function AITutor() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'status'>('chat')
  const [analysis, setAnalysis] = useState<StudentAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch initial analytics data
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalysis()
    }
  }, [activeTab])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-tutor?action=analyze')
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyName = (performance: number) => {
    if (performance >= 80) return 'Avanzado'
    if (performance >= 60) return 'Intermedio'
    return 'Principiante'
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return 'text-green-600 bg-green-100'
    if (performance >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Sara - Asistente Personal Académico
            </h3>
            <p className="text-sm text-slate-600">
              Tu compañera inteligente para organización, planificación y tutoría académica
            </p>
          </div>
        </div>

        {/* New Tab System */}
        <div className="flex space-x-1">
          {[
            { id: 'chat', label: 'Chat con Sara', icon: MessageSquare },
            { id: 'analytics', label: 'Mi Progreso', icon: BarChart3 },
            { id: 'status', label: 'Estado del Sistema', icon: Sparkles }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'chat' && (
          <div className="-m-6">
            <EnhancedAITutorChat />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            ) : analysis ? (
              <>
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Rendimiento General</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{analysis.overallPerformance}%</p>
                    <p className="text-sm text-blue-700 capitalize">Tendencia: {analysis.progressTrend}</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-800">Nivel Actual</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-1">
                      {getDifficultyName(analysis.overallPerformance)}
                    </p>
                    <p className="text-sm text-purple-700">Recomendado para ti</p>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800">Estilo de Aprendizaje</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-900 mt-1 capitalize">
                      {analysis.learningPattern}
                    </p>
                    <p className="text-sm text-emerald-700">Patrón detectado</p>
                  </div>
                </div>

                {/* Subject Performance */}
                {analysis.subjects.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Rendimiento por Materia</h4>
                    <div className="space-y-3">
                      {analysis.subjects.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-slate-700">{subject.subjectName}</span>
                            {subject.needsAttention && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Necesita atención
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(subject.performance)}`}>
                              {subject.performance}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths and Areas for Improvement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Fortalezas Detectadas
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      Áreas de Mejora
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strugglingAreas.map((area, index) => (
                        <li key={index} className="text-sm text-amber-700 flex items-start">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Temas Recomendados para Practicar</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommendedTopics.map((topic, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800">
                      💡 <strong>Consejo:</strong> Usa el Chat con Sara para practicar estos temas de manera interactiva.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  Sin datos de análisis
                </h4>
                <p className="text-slate-600">
                  Completa algunos reportes semanales para ver tu progreso académico
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                Estado del Sistema de IA
              </h4>
              <p className="text-slate-600">
                Monitoreo de proveedores de IA y configuración del sistema
              </p>
            </div>
            <AIStatus />
          </div>
        )}
      </div>
    </div>
  )
}