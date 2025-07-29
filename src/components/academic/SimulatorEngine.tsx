'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayIcon, PauseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { 
  simulationEngine,
  SimulationSession,
  SimulationResult,
  SimulationQuestion
} from '@/lib/simulation-engine'
import { getUpcomingExams, Exam } from '@/lib/academic-data'

interface SimulatorEngineProps {
  userId: string
  className?: string
}

interface SimulationSettings {
  questionCount: number
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard'
  timeLimit: number
  adaptiveDifficulty: boolean
  showExplanations: boolean
}

export default function SimulatorEngine({ userId, className = '' }: SimulatorEngineProps) {
  const [availableExams, setAvailableExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<SimulationQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [explanation, setExplanation] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [sessionResult, setSessionResult] = useState<SimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [settings, setSettings] = useState<SimulationSettings>({
    questionCount: 10,
    difficulty: 'mixed',
    timeLimit: 20,
    adaptiveDifficulty: true,
    showExplanations: true
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTime = useRef<number>(0)

  useEffect(() => {
    loadAvailableExams()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (currentSession && currentSession.status === 'in_progress' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentSession, timeLeft])

  const loadAvailableExams = () => {
    const exams = getUpcomingExams(userId, 30)
    setAvailableExams(exams)
    if (exams.length > 0 && !selectedExam) {
      setSelectedExam(exams[0])
    }
  }

  const createSimulation = async () => {
    if (!selectedExam) return

    setIsLoading(true)
    try {
      const session = await simulationEngine.createSimulation(userId, selectedExam.id, {
        questionCount: settings.questionCount,
        difficulty: settings.difficulty,
        timeLimit: settings.timeLimit,
        adaptiveDifficulty: settings.adaptiveDifficulty
      })

      setCurrentSession(session)
      setQuestionIndex(0)
      setSessionResult(null)
    } catch (error) {
      console.error('Error creating simulation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startSimulation = () => {
    if (!currentSession) return

    const session = simulationEngine.startSimulation(currentSession.id)
    if (session) {
      setCurrentSession(session)
      setCurrentQuestion(session.questions[0])
      setTimeLeft(settings.timeLimit * 60) // Convert to seconds
      questionStartTime.current = Date.now()
      setQuestionIndex(0)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const submitAnswer = async () => {
    if (!currentSession || !currentQuestion || selectedAnswer === null) return

    const timeSpent = (Date.now() - questionStartTime.current) / 1000

    try {
      const result = await simulationEngine.submitAnswer(
        currentSession.id,
        currentQuestion.id,
        selectedAnswer,
        timeSpent
      )

      setIsCorrect(result.isCorrect)
      setExplanation(result.explanation || '')
      setShowResult(true)

      if (result.sessionComplete) {
        setTimeout(() => {
          handleSessionComplete()
        }, 3000)
      } else if (result.nextQuestion) {
        setTimeout(() => {
          setCurrentQuestion(result.nextQuestion!)
          setQuestionIndex(prev => prev + 1)
          setSelectedAnswer(null)
          setShowResult(false)
          setIsCorrect(null)
          setExplanation('')
          questionStartTime.current = Date.now()
        }, 3000)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const handleSessionComplete = async () => {
    if (!currentSession) return

    try {
      const result = await simulationEngine.completeSimulation(currentSession.id)
      setSessionResult(result)
      setCurrentSession(null)
      setCurrentQuestion(null)
    } catch (error) {
      console.error('Error completing simulation:', error)
    }
  }

  const handleTimeUp = () => {
    if (currentSession && currentQuestion) {
      // Auto submit current answer or skip
      submitAnswer()
    }
  }

  const resetSimulation = () => {
    setCurrentSession(null)
    setCurrentQuestion(null)
    setSessionResult(null)
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(null)
    setExplanation('')
    setTimeLeft(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Motor de Simulacros</h2>
          <p className="text-slate-600 mt-1">
            Evaluaciones progresivas adaptativas con IA
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-100">
          <LightBulbIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Results View */}
      {sessionResult && (
        <div className="mac-card p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-slate-800 mb-2">
              Simulacro Completado
            </h3>
            <div className={`text-4xl font-bold mb-4 ${getScoreColor(sessionResult.score)}`}>
              {sessionResult.score}%
            </div>
            <p className="text-slate-600">
              {sessionResult.correctAnswers} de {sessionResult.totalQuestions} respuestas correctas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Performance by Topic */}
            <div className="mac-card p-4">
              <h4 className="font-medium text-slate-800 mb-3">Performance por Tema</h4>
              <div className="space-y-2">
                {Object.entries(sessionResult.topicPerformance).map(([topic, perf]: [string, any]) => (
                  <div key={topic} className="flex justify-between items-center">
                    <span className="text-sm text-slate-700">{topic}</span>
                    <span className={`text-sm font-medium ${perf.accuracy >= 70 ? 'text-green-600' : perf.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(perf.accuracy)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="mac-card p-4">
              <h4 className="font-medium text-slate-800 mb-3">Fortalezas</h4>
              <div className="space-y-1">
                {sessionResult.strengths.length > 0 ? (
                  sessionResult.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center text-sm text-green-700">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      {strength}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Continúa practicando</p>
                )}
              </div>
              
              {sessionResult.weaknesses.length > 0 && (
                <>
                  <h4 className="font-medium text-slate-800 mt-4 mb-3">Áreas de Mejora</h4>
                  <div className="space-y-1">
                    {sessionResult.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-center text-sm text-red-700">
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        {weakness}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Readiness Level */}
            <div className="mac-card p-4">
              <h4 className="font-medium text-slate-800 mb-3">Nivel de Preparación</h4>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(sessionResult.readinessLevel)}`}>
                  {sessionResult.readinessLevel}%
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      sessionResult.readinessLevel >= 80 ? 'bg-green-500' :
                      sessionResult.readinessLevel >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${sessionResult.readinessLevel}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  Tiempo invertido: {Math.round(sessionResult.timeSpent)} min
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {sessionResult.recommendations.length > 0 && (
            <div className="mac-card p-4 mb-6">
              <h4 className="font-medium text-slate-800 mb-3">Recomendaciones</h4>
              <div className="space-y-3">
                {sessionResult.recommendations.map((rec, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-medium text-slate-800">{rec.title}</h5>
                    <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                    <ul className="text-sm text-slate-700">
                      {rec.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="ml-4">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={resetSimulation}
              className="mac-button-secondary"
            >
              Nuevo Simulacro
            </button>
          </div>
        </div>
      )}

      {/* Question View */}
      {currentSession && currentQuestion && !sessionResult && (
        <div className="mac-card p-6">
          {/* Progress and Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-600">
                Pregunta {questionIndex + 1} de {currentSession.questions.length}
              </span>
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((questionIndex + 1) / currentSession.questions.length) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-700">
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-lg">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-800 flex-1">
                {currentQuestion.question}
              </h3>
              <div className="ml-4 flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? 'Fácil' :
                   currentQuestion.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                </span>
                <span className="text-xs text-slate-500">
                  {currentQuestion.points} pts
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`
                    w-full p-4 text-left border-2 rounded-lg transition-all
                    ${selectedAnswer === index
                      ? showResult
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                      : showResult && index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                    ${showResult ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-slate-700 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-slate-800">{option}</span>
                    {showResult && selectedAnswer === index && (
                      <div className="ml-auto">
                        {isCorrect ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                    {showResult && index === currentQuestion.correctAnswer && selectedAnswer !== index && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Explanation */}
            {showResult && explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Explicación:</h4>
                <p className="text-blue-700">{explanation}</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {!showResult && (
            <div className="flex justify-center">
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-colors
                  ${selectedAnswer !== null
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                Confirmar Respuesta
              </button>
            </div>
          )}
        </div>
      )}

      {/* Setup View */}
      {!currentSession && !sessionResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exam Selection */}
          <div className="mac-card p-6">
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              Seleccionar Examen
            </h3>
            
            <div className="space-y-3">
              {availableExams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`
                    w-full p-4 text-left border-2 rounded-lg transition-all
                    ${selectedExam?.id === exam.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <h4 className="font-medium text-slate-800">{exam.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {exam.topics.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mac-card p-6">
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              Configuración del Simulacro
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de preguntas
                </label>
                <select
                  value={settings.questionCount}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    questionCount: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 preguntas</option>
                  <option value={10}>10 preguntas</option>
                  <option value={15}>15 preguntas</option>
                  <option value={20}>20 preguntas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dificultad
                </label>
                <select
                  value={settings.difficulty}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    difficulty: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mixed">Mixta</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Medio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tiempo límite (minutos)
                </label>
                <select
                  value={settings.timeLimit}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.adaptiveDifficulty}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      adaptiveDifficulty: e.target.checked 
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Dificultad adaptativa
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.showExplanations}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      showExplanations: e.target.checked 
                    }))}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Mostrar explicaciones
                  </span>
                </label>
              </div>

              <button
                onClick={createSimulation}
                disabled={!selectedExam || isLoading}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium transition-colors
                  ${selectedExam && !isLoading
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? 'Creando Simulacro...' : 'Crear Simulacro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Simulation */}
      {currentSession && currentSession.status === 'not_started' && (
        <div className="mac-card p-6 text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Simulacro Listo
          </h3>
          <p className="text-slate-600 mb-6">
            {currentSession.questions.length} preguntas • {settings.timeLimit} minutos
          </p>
          <button
            onClick={startSimulation}
            className="mac-button-primary inline-flex items-center"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Comenzar Simulacro
          </button>
        </div>
      )}
    </div>
  )
}