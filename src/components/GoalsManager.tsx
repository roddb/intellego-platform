'use client'

import { useState, useEffect } from 'react'
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock, Edit2, Trash2, Star, Award } from 'lucide-react'

export enum GoalType {
  ACADEMIC = 'academic',
  SKILL = 'skill',
  HABIT = 'habit',
  PROJECT = 'project'
}

export enum GoalPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export interface Goal {
  id: string
  title: string
  description: string
  type: GoalType
  priority: GoalPriority
  status: GoalStatus
  targetDate: Date
  createdAt: Date
  completedAt?: Date
  progress: number // 0-100
  milestones: Milestone[]
  tags: string[]
  estimatedHours?: number
  actualHours?: number
}

export interface Milestone {
  id: string
  title: string
  description?: string
  completed: boolean
  completedAt?: Date
  dueDate?: Date
}

interface GoalsManagerProps {
  userId: string
  className?: string
}

export default function GoalsManager({ userId, className = '' }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active')
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: GoalType.ACADEMIC,
    priority: GoalPriority.MEDIUM,
    targetDate: '',
    estimatedHours: '',
    tags: '',
    milestones: [{ title: '', description: '' }]
  })

  useEffect(() => {
    loadGoals()
  }, [userId])

  const loadGoals = async () => {
    try {
      // For now, we'll use localStorage to simulate goal persistence
      const savedGoals = localStorage.getItem(`goals_${userId}`)
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals).map((goal: any) => ({
          ...goal,
          targetDate: new Date(goal.targetDate),
          createdAt: new Date(goal.createdAt),
          completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined
        }))
        setGoals(parsed)
      } else {
        // Initialize with sample goals
        initializeSampleGoals()
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeSampleGoals = () => {
    const sampleGoals: Goal[] = [
      {
        id: 'goal_1',
        title: 'Mejorar en Matemáticas',
        description: 'Subir mi nota promedio en matemáticas de 7 a 8.5',
        type: GoalType.ACADEMIC,
        priority: GoalPriority.HIGH,
        status: GoalStatus.IN_PROGRESS,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        progress: 35,
        estimatedHours: 40,
        actualHours: 14,
        milestones: [
          { id: 'm1', title: 'Completar ejercicios de álgebra', completed: true, completedAt: new Date() },
          { id: 'm2', title: 'Aprobar examen parcial', completed: false },
          { id: 'm3', title: 'Dominar geometría básica', completed: false }
        ],
        tags: ['matemáticas', 'álgebra', 'geometría']
      },
      {
        id: 'goal_2',
        title: 'Aprender Programación Web',
        description: 'Crear mi primera aplicación web completa',
        type: GoalType.SKILL,
        priority: GoalPriority.MEDIUM,
        status: GoalStatus.IN_PROGRESS,
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        progress: 20,
        estimatedHours: 80,
        actualHours: 16,
        milestones: [
          { id: 'm4', title: 'Aprender HTML y CSS', completed: true, completedAt: new Date() },
          { id: 'm5', title: 'Dominar JavaScript básico', completed: false },
          { id: 'm6', title: 'Crear proyecto final', completed: false }
        ],
        tags: ['programación', 'web', 'javascript']
      },
      {
        id: 'goal_3',
        title: 'Hábito de Lectura Diaria',
        description: 'Leer 30 minutos todos los días durante 2 meses',
        type: GoalType.HABIT,
        priority: GoalPriority.LOW,
        status: GoalStatus.IN_PROGRESS,
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        progress: 65,
        milestones: [
          { id: 'm7', title: 'Leer 1 semana consecutiva', completed: true, completedAt: new Date() },
          { id: 'm8', title: 'Leer 1 mes consecutivo', completed: false },
          { id: 'm9', title: 'Completar 2 meses', completed: false }
        ],
        tags: ['lectura', 'hábito', 'crecimiento personal']
      }
    ]

    setGoals(sampleGoals)
    localStorage.setItem(`goals_${userId}`, JSON.stringify(sampleGoals))
  }

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals)
    localStorage.setItem(`goals_${userId}`, JSON.stringify(updatedGoals))
  }

  const createGoal = () => {
    if (!newGoal.title.trim()) return

    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      priority: newGoal.priority,
      status: GoalStatus.NOT_STARTED,
      targetDate: new Date(newGoal.targetDate),
      createdAt: new Date(),
      progress: 0,
      estimatedHours: newGoal.estimatedHours ? parseInt(newGoal.estimatedHours) : undefined,
      milestones: newGoal.milestones
        .filter(m => m.title.trim())
        .map((m, index) => ({
          id: `milestone_${Date.now()}_${index}`,
          title: m.title,
          description: m.description,
          completed: false
        })),
      tags: newGoal.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    const updatedGoals = [...goals, goal]
    saveGoals(updatedGoals)
    setShowNewGoalForm(false)
    resetNewGoalForm()
  }

  const resetNewGoalForm = () => {
    setNewGoal({
      title: '',
      description: '',
      type: GoalType.ACADEMIC,
      priority: GoalPriority.MEDIUM,
      targetDate: '',
      estimatedHours: '',
      tags: '',
      milestones: [{ title: '', description: '' }]
    })
  }

  const updateGoalProgress = (goalId: string, progress: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, progress }
        if (progress >= 100 && goal.status !== GoalStatus.COMPLETED) {
          updatedGoal.status = GoalStatus.COMPLETED
          updatedGoal.completedAt = new Date()
        }
        return updatedGoal
      }
      return goal
    })
    saveGoals(updatedGoals)
  }

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone => {
          if (milestone.id === milestoneId) {
            return {
              ...milestone,
              completed: !milestone.completed,
              completedAt: !milestone.completed ? new Date() : undefined
            }
          }
          return milestone
        })

        // Auto-update progress based on milestones
        const completedMilestones = updatedMilestones.filter(m => m.completed).length
        const totalMilestones = updatedMilestones.length
        const autoProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

        return {
          ...goal,
          milestones: updatedMilestones,
          progress: Math.max(goal.progress, autoProgress)
        }
      }
      return goal
    })
    saveGoals(updatedGoals)
  }

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId)
    saveGoals(updatedGoals)
  }

  const getFilteredGoals = () => {
    switch (activeTab) {
      case 'active':
        return goals.filter(goal => goal.status === GoalStatus.IN_PROGRESS || goal.status === GoalStatus.NOT_STARTED)
      case 'completed':
        return goals.filter(goal => goal.status === GoalStatus.COMPLETED)
      case 'all':
      default:
        return goals
    }
  }

  const getGoalTypeColor = (type: GoalType) => {
    switch (type) {
      case GoalType.ACADEMIC: return 'bg-blue-100 text-blue-800'
      case GoalType.SKILL: return 'bg-purple-100 text-purple-800'
      case GoalType.HABIT: return 'bg-green-100 text-green-800'
      case GoalType.PROJECT: return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.LOW: return 'text-gray-500'
      case GoalPriority.MEDIUM: return 'text-yellow-500'
      case GoalPriority.HIGH: return 'text-orange-500'
      case GoalPriority.CRITICAL: return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getDaysRemaining = (targetDate: Date) => {
    const now = new Date()
    const diffTime = targetDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Mis Objetivos
              </h3>
              <p className="text-sm text-slate-600">
                Define y sigue tus metas académicas y personales
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewGoalForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Objetivo</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'active', label: 'Activos', count: goals.filter(g => g.status === GoalStatus.IN_PROGRESS || g.status === GoalStatus.NOT_STARTED).length },
            { id: 'completed', label: 'Completados', count: goals.filter(g => g.status === GoalStatus.COMPLETED).length },
            { id: 'all', label: 'Todos', count: goals.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showNewGoalForm ? (
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <h4 className="font-semibold text-slate-900 mb-4">Crear Nuevo Objetivo</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Mejorar en matemáticas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha objetivo *
                </label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe tu objetivo en detalle..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as GoalType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={GoalType.ACADEMIC}>Académico</option>
                  <option value={GoalType.SKILL}>Habilidad</option>
                  <option value={GoalType.HABIT}>Hábito</option>
                  <option value={GoalType.PROJECT}>Proyecto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) as GoalPriority })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={GoalPriority.LOW}>Baja</option>
                  <option value={GoalPriority.MEDIUM}>Media</option>
                  <option value={GoalPriority.HIGH}>Alta</option>
                  <option value={GoalPriority.CRITICAL}>Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Horas estimadas
                </label>
                <input
                  type="number"
                  value={newGoal.estimatedHours}
                  onChange={(e) => setNewGoal({ ...newGoal, estimatedHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="40"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tags (separados por comas)
              </label>
              <input
                type="text"
                value={newGoal.tags}
                onChange={(e) => setNewGoal({ ...newGoal, tags: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="matemáticas, álgebra, estudio"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createGoal}
                disabled={!newGoal.title.trim() || !newGoal.targetDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Crear Objetivo
              </button>
              <button
                onClick={() => {
                  setShowNewGoalForm(false)
                  resetNewGoalForm()
                }}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {/* Goals List */}
        <div className="space-y-4">
          {getFilteredGoals().map((goal) => {
            const daysRemaining = getDaysRemaining(goal.targetDate)
            const isOverdue = daysRemaining < 0
            const completedMilestones = goal.milestones.filter(m => m.completed).length

            return (
              <div key={goal.id} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{goal.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGoalTypeColor(goal.type)}`}>
                        {goal.type}
                      </span>
                      <Star className={`h-4 w-4 ${getPriorityColor(goal.priority)}`} />
                    </div>
                    
                    {goal.description && (
                      <p className="text-sm text-slate-600 mb-2">{goal.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue ? `Vencido hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días restantes`}
                        </span>
                      </div>
                      
                      {goal.estimatedHours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{goal.actualHours || 0}/{goal.estimatedHours}h</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>{completedMilestones}/{goal.milestones.length} hitos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">Progreso</span>
                    <span className="text-sm text-slate-600">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.progress >= 100 ? 'bg-green-500' : 
                        goal.progress >= 75 ? 'bg-blue-500' :
                        goal.progress >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    ></div>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                    className="w-full mt-2 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Hitos</h5>
                    <div className="space-y-1">
                      {goal.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleMilestone(goal.id, milestone.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              milestone.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-slate-300 hover:border-green-400'
                            }`}
                          >
                            {milestone.completed && <CheckCircle className="h-3 w-3" />}
                          </button>
                          <span className={`text-sm ${
                            milestone.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                          }`}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {goal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {goal.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {goal.status === GoalStatus.COMPLETED && (
                  <div className="mt-3 flex items-center space-x-2 text-green-600">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      ¡Objetivo completado el {goal.completedAt?.toLocaleDateString()}!
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {getFilteredGoals().length === 0 && (
            <div className="text-center py-8">
              <Target className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 mb-2">
                {activeTab === 'completed' ? 'No hay objetivos completados' : 'No hay objetivos activos'}
              </h4>
              <p className="text-slate-600 mb-4">
                {activeTab === 'completed' 
                  ? 'Completa tus primeros objetivos para verlos aquí'
                  : 'Crea tu primer objetivo para comenzar tu progreso'
                }
              </p>
              {activeTab !== 'completed' && (
                <button
                  onClick={() => setShowNewGoalForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Primer Objetivo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}