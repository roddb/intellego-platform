'use client'

import { useState, useEffect } from 'react'
import { Trophy, Target, Flame, Star, Award, Calendar, TrendingUp } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earned: boolean
  earnedAt?: Date
}

interface StudentStats {
  totalPoints: number
  weeklyStreak: number
  reportsSubmitted: number
  totalWeeks: number
  completionRate: number
  badges: Badge[]
  level: number
  pointsToNextLevel: number
  currentLevelPoints: number
  nextLevelPoints: number
}

interface StudentProgressProps {
  userId: string
  className?: string
}

export default function StudentProgress({ userId, className = '' }: StudentProgressProps) {
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStudentStats()
  }, [userId])

  const fetchStudentStats = async () => {
    try {
      const response = await fetch(`/api/student/progress?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching student stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLevelInfo = (points: number) => {
    // Cada nivel requiere más puntos (100, 250, 450, 700, etc.)
    const levels = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]
    
    let level = 1
    let currentLevelPoints = 0
    let nextLevelPoints = 100
    
    for (let i = 0; i < levels.length - 1; i++) {
      if (points >= levels[i] && points < levels[i + 1]) {
        level = i + 1
        currentLevelPoints = levels[i]
        nextLevelPoints = levels[i + 1]
        break
      }
    }
    
    if (points >= levels[levels.length - 1]) {
      level = levels.length
      currentLevelPoints = levels[levels.length - 1]
      nextLevelPoints = levels[levels.length - 1]
    }
    
    return { level, currentLevelPoints, nextLevelPoints }
  }

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "¡Comienza tu racha enviando un reporte!"
    if (streak === 1) return "¡Buen comienzo! Continúa la semana que viene"
    if (streak <= 4) return `¡${streak} semanas seguidas! ¡Vas muy bien!`
    if (streak <= 8) return `¡Increíble! ${streak} semanas de constancia`
    return `¡Eres una máquina! ${streak} semanas consecutivas 🔥`
  }

  const getBadgeIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'trophy': Trophy,
      'target': Target,
      'flame': Flame,
      'star': Star,
      'award': Award,
      'calendar': Calendar,
      'trending': TrendingUp
    }
    return icons[iconName] || Star
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center ${className}`}>
        <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar las estadísticas</p>
      </div>
    )
  }

  const levelInfo = getLevelInfo(stats.totalPoints)
  const progressPercentage = levelInfo.nextLevelPoints > levelInfo.currentLevelPoints 
    ? ((stats.totalPoints - levelInfo.currentLevelPoints) / (levelInfo.nextLevelPoints - levelInfo.currentLevelPoints)) * 100
    : 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Nivel y Puntos */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-teal-800 dark:text-teal-200">
              Nivel {levelInfo.level}
            </h3>
            <p className="text-sm text-teal-600 dark:text-teal-400">
              {stats.totalPoints} puntos totales
            </p>
          </div>
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Barra de progreso del nivel */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-teal-700 dark:text-teal-300">
            <span>Progreso al siguiente nivel</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-teal-600 dark:text-teal-400">
            {levelInfo.nextLevelPoints > levelInfo.currentLevelPoints 
              ? `Faltan ${levelInfo.nextLevelPoints - stats.totalPoints} puntos para el nivel ${levelInfo.level + 1}`
              : "¡Nivel máximo alcanzado!"
            }
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Racha semanal */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {stats.weeklyStreak}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Semanas seguidas</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getStreakMessage(stats.weeklyStreak)}
          </p>
        </div>

        {/* Tasa de completitud */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {stats.completionRate}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completitud</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {stats.reportsSubmitted} de {stats.totalWeeks} reportes enviados
          </p>
        </div>

        {/* Insignias ganadas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {stats.badges.filter(b => b.earned).length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Insignias</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            De {stats.badges.length} disponibles
          </p>
        </div>
      </div>

      {/* Insignias */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Insignias y Logros
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.badges.map((badge) => {
            const IconComponent = getBadgeIcon(badge.icon)
            return (
              <div
                key={badge.id}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all duration-300
                  ${badge.earned 
                    ? `bg-gradient-to-br ${badge.color} border-opacity-50 scale-105 shadow-lg` 
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-60 grayscale'
                  }
                `}
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  badge.earned ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
                }`}>
                  <IconComponent className={`w-6 h-6 ${
                    badge.earned ? 'text-white' : 'text-slate-400'
                  }`} />
                </div>
                
                <h5 className={`text-sm font-medium mb-1 ${
                  badge.earned ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {badge.name}
                </h5>
                
                <p className={`text-xs ${
                  badge.earned ? 'text-white/80' : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {badge.description}
                </p>
                
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-white/60 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}