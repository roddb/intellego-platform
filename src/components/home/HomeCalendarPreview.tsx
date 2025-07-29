'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CalendarEvent {
  id: string
  title: string
  date: number
  type: 'exam' | 'study' | 'assignment'
  subject: string
  priority: 'high' | 'medium' | 'low'
}

interface HomeCalendarPreviewProps {
  className?: string
}

export default function HomeCalendarPreview({ className = '' }: HomeCalendarPreviewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Demo data - próximos eventos académicos
  const demoEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Examen Química Orgánica',
      date: 15,
      type: 'exam',
      subject: 'Química',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Sesión de Estudio - Matemáticas',
      date: 12,
      type: 'study',
      subject: 'Matemáticas',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Entrega Proyecto Física',
      date: 18,
      type: 'assignment',
      subject: 'Física',
      priority: 'high'
    },
    {
      id: '4',
      title: 'Sesión de Estudio - Historia',
      date: 14,
      type: 'study',
      subject: 'Historia',
      priority: 'low'
    },
    {
      id: '5',
      title: 'Examen Parcial Biología',
      date: 22,
      type: 'exam',
      subject: 'Biología',
      priority: 'high'
    }
  ]

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días del mes anterior para completar la primera semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
      const dayEvents = demoEvents.filter(event => event.date === day)
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      })
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-red-500'
      case 'study':
        return 'bg-blue-500'
      case 'assignment':
        return 'bg-emerald-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getEventTypeBorder = (type: string) => {
    switch (type) {
      case 'exam':
        return 'border-red-200 bg-red-50'
      case 'study':
        return 'border-blue-200 bg-blue-50'
      case 'assignment':
        return 'border-emerald-200 bg-emerald-50'
      default:
        return 'border-slate-200 bg-slate-50'
    }
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className={`mac-card p-6 ${className}`}>
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-slate-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              relative h-20 p-1 rounded-lg border transition-all duration-200
              ${day.isCurrentMonth 
                ? 'bg-white border-slate-200 hover:border-slate-300' 
                : 'bg-slate-50 border-slate-100 text-slate-400'
              }
              ${day.isToday 
                ? 'ring-2 ring-teal-500 border-teal-500' 
                : ''
              }
            `}
          >
            {/* Número del día */}
            <div className={`
              text-sm font-medium
              ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
              ${day.isToday ? 'text-teal-700' : ''}
            `}>
              {day.date}
            </div>

            {/* Eventos del día */}
            <div className="mt-1 space-y-1">
              {day.events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={`
                    text-xs px-2 py-1 rounded-md border truncate
                    ${getEventTypeBorder(event.type)}
                    hover:shadow-sm transition-shadow cursor-pointer
                  `}
                  title={`${event.title} - ${event.subject}`}
                >
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`} />
                    <span className="text-slate-700 font-medium truncate">
                      {event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title}
                    </span>
                  </div>
                </div>
              ))}
              
              {day.events.length > 2 && (
                <div className="text-xs text-slate-500 pl-2">
                  +{day.events.length - 2} más
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Exámenes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-600">Estudio</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Entregas</span>
        </div>
      </div>
    </div>
  )
}