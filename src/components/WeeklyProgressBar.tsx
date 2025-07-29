"use client"

import { useState, useEffect } from 'react'

interface WeekProgress {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
  hasSubmitted: boolean
  canSubmit: boolean
  isPast: boolean
  isCurrent: boolean
  isFuture: boolean
}

interface WeeklyProgressBarProps {
  className?: string
}

export default function WeeklyProgressBar({ className }: WeeklyProgressBarProps) {
  const [progress, setProgress] = useState<{
    weekProgress: WeekProgress[]
    monthName: string
    submittedWeeks: number
    totalWeeks: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const fetchProgress = async (year: number, month: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/weekly-reports/progress?year=${year}&month=${month}`)
      if (response.ok) {
        const data = await response.json()
        setProgress(data)
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className={`mac-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-12 h-12 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className={`mac-card p-6 ${className}`}>
        <p className="text-red-600">Error cargando el progreso</p>
      </div>
    )
  }

  return (
    <div className={`mac-card p-6 ${className}`}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 capitalize">
            {progress.monthName} {currentYear}
          </h3>
          <p className="text-sm text-gray-600">
            {progress.submittedWeeks} de {progress.totalWeeks} entregas completadas
          </p>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress LEDs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {progress.weekProgress.map((week, index) => {
          let ledColor = 'bg-gray-300' // Default (future/unavailable)
          let shadowColor = 'shadow-gray-300/50'
          let statusText = 'Próxima'

          if (week.hasSubmitted) {
            ledColor = 'bg-green-500'
            shadowColor = 'shadow-green-500/50'
            statusText = 'Entregado'
          } else if (week.canSubmit) {
            ledColor = 'bg-yellow-500'
            shadowColor = 'shadow-yellow-500/50'
            statusText = 'Disponible'
          } else if (week.isPast) {
            ledColor = 'bg-red-500'
            shadowColor = 'shadow-red-500/50'
            statusText = 'No entregado'
          }

          return (
            <div key={index} className="flex flex-col items-center group">
              {/* LED */}
              <div
                className={`w-12 h-12 rounded-full ${ledColor} ${shadowColor} shadow-lg 
                         flex items-center justify-center text-white font-bold text-sm
                         transition-all duration-300 group-hover:scale-110`}
                title={`Semana ${week.weekNumber}: ${formatDate(week.weekStart.toString())} - ${formatDate(week.weekEnd.toString())}`}
              >
                {week.weekNumber}
              </div>
              
              {/* Status */}
              <span className="text-xs text-gray-600 mt-1 text-center">
                {statusText}
              </span>

              {/* Date range */}
              <span className="text-xs text-gray-400 text-center">
                {formatDate(week.weekStart.toString())} - {formatDate(week.weekEnd.toString())}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Entregado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">No entregado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-gray-600">Próxima</span>
        </div>
      </div>
    </div>
  )
}