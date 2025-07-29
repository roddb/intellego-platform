'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, BookOpenIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { 
  getUpcomingExams, 
  getExamById, 
  Exam,
  StudySession,
  StudyPlanRequest
} from '@/lib/academic-data'
import { StudyPlanResult, intelligentStudyPlanner } from '@/lib/study-planner'

interface StudyPlannerProps {
  userId: string
  className?: string
}

export default function StudyPlanner({ userId, className = '' }: StudyPlannerProps) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])
  const [studyPlan, setStudyPlan] = useState<StudyPlanResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planRequest, setPlanRequest] = useState<StudyPlanRequest>({
    userId,
    examId: '',
    availableTime: 3,
    studyPreference: 'afternoon',
    intensity: 'moderate',
    existingCommitments: []
  })

  useEffect(() => {
    loadUpcomingExams()
  }, [])

  const loadUpcomingExams = () => {
    const exams = getUpcomingExams(userId, 30)
    setUpcomingExams(exams)
    if (exams.length > 0 && !selectedExam) {
      setSelectedExam(exams[0])
      setPlanRequest(prev => ({ ...prev, examId: exams[0].id }))
    }
  }

  const handleExamSelect = (examId: string) => {
    const exam = getExamById(examId)
    if (exam) {
      setSelectedExam(exam)
      setPlanRequest(prev => ({ ...prev, examId }))
      setStudyPlan(null)
    }
  }

  const generateStudyPlan = async () => {
    if (!selectedExam) return
    
    setIsGenerating(true)
    try {
      const result = await intelligentStudyPlanner.generateStudyPlan(planRequest, selectedExam)
      setStudyPlan(result)
    } catch (error) {
      console.error('Error generando plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'final':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'parcial':
        return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'recuperatorio':
        return 'text-orange-700 bg-orange-100 border-orange-200'
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200'
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-700'
    if (rate >= 60) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Planificador de Estudio</h2>
          <p className="text-slate-600 mt-1">
            Genera cronogramas personalizados con IA para tus exámenes
          </p>
        </div>
        <div className="p-3 rounded-lg bg-teal-100">
          <LightBulbIcon className="w-6 h-6 text-teal-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left side - Configuration */}
        <div className="space-y-6">
          
          {/* Exam Selection */}
          <div className="mac-card p-6">
            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
              Seleccionar Examen
            </h3>
            
            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  No hay exámenes próximos registrados
                </p>
              ) : (
                upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => handleExamSelect(exam.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedExam?.id === exam.id 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{exam.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{formatDate(exam.date)}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getExamTypeColor(exam.type)}`}>
                            {exam.type.charAt(0).toUpperCase() + exam.type.slice(1)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {exam.duration} min
                          </span>
                        </div>
                      </div>
                      <ClockIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Study Preferences */}
          {selectedExam && (
            <div className="mac-card p-6">
              <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
                Preferencias de Estudio
              </h3>

              <div className="space-y-4">
                {/* Available time */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horas disponibles por día
                  </label>
                  <select
                    value={planRequest.availableTime}
                    onChange={(e) => setPlanRequest(prev => ({ 
                      ...prev, 
                      availableTime: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value={1}>1 hora</option>
                    <option value={2}>2 horas</option>
                    <option value={3}>3 horas</option>
                    <option value={4}>4 horas</option>
                    <option value={5}>5 horas</option>
                    <option value={6}>6 horas</option>
                  </select>
                </div>

                {/* Study preference */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Horario preferido
                  </label>
                  <select
                    value={planRequest.studyPreference}
                    onChange={(e) => setPlanRequest(prev => ({ 
                      ...prev, 
                      studyPreference: e.target.value as any
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="morning">Mañana (8-12h)</option>
                    <option value="afternoon">Tarde (14-18h)</option>
                    <option value="evening">Noche (19-23h)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                {/* Intensity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Intensidad
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['light', 'moderate', 'intensive'].map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setPlanRequest(prev => ({ 
                          ...prev, 
                          intensity: intensity as any
                        }))}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-colors
                          ${planRequest.intensity === intensity
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }
                        `}
                      >
                        {intensity === 'light' ? 'Ligera' : 
                         intensity === 'moderate' ? 'Moderada' : 'Intensiva'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateStudyPlan}
                  disabled={isGenerating || !selectedExam}
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium transition-colors
                    ${isGenerating || !selectedExam
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                    }
                  `}
                >
                  {isGenerating ? 'Generando Plan...' : 'Generar Plan de Estudio'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Results */}
        <div className="space-y-6">
          
          {/* Study Plan Results */}
          {studyPlan && (
            <>
              {/* Success Rate */}
              <div className="mac-card p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Probabilidad de Éxito
                </h3>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getSuccessRateColor(studyPlan.estimatedSuccessRate)}`}>
                    {studyPlan.estimatedSuccessRate}%
                  </div>
                  <p className="text-slate-600">
                    Basado en tiempo disponible y material de estudio
                  </p>
                </div>

                <div className="mt-4 bg-slate-100 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      studyPlan.estimatedSuccessRate >= 80 ? 'bg-green-500' :
                      studyPlan.estimatedSuccessRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${studyPlan.estimatedSuccessRate}%` }}
                  />
                </div>
              </div>

              {/* Study Sessions */}
              <div className="mac-card p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Sesiones de Estudio ({studyPlan.sessions.length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {studyPlan.sessions.slice(0, 5).map((session, index) => (
                    <div key={session.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 text-sm">
                            {session.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {formatDate(session.scheduledDate)} a las {formatTime(session.scheduledDate)}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs bg-white px-2 py-1 rounded border">
                              {session.duration} min
                            </span>
                            <span className="text-xs text-slate-500">
                              {session.topics.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {studyPlan.sessions.length > 5 && (
                    <div className="text-center">
                      <span className="text-sm text-slate-500">
                        y {studyPlan.sessions.length - 5} sesiones más...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="mac-card p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Recomendaciones
                </h3>

                <div className="space-y-2">
                  {studyPlan.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>

                {studyPlan.conflictsDetected.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Conflictos Detectados:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {studyPlan.conflictsDetected.map((conflict, index) => (
                        <li key={index}>• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Placeholder when no plan */}
          {!studyPlan && selectedExam && (
            <div className="mac-card p-6">
              <div className="text-center py-8">
                <LightBulbIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Plan de Estudio Inteligente
                </h3>
                <p className="text-slate-600 mb-4">
                  Configura tus preferencias y genera un cronograma personalizado
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}