'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { 
  getUserCalendarData, 
  getEventsForDate, 
  CalendarEvent, 
  getEventTypeColor,
  getEventTypeIcon 
} from '@/lib/calendar-data'

interface SmartCalendarProps {
  userId: string
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onAddEvent?: () => void
  className?: string
}

export default function SmartCalendar({ 
  userId, 
  onEventClick, 
  onDateClick, 
  onAddEvent,
  className = '' 
}: SmartCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [calendarData, setCalendarData] = useState(getUserCalendarData(userId))

  useEffect(() => {
    const data = getUserCalendarData(userId)
    setCalendarData(data)
  }, [userId])
  
  // Sistema de refresh automático para detectar cambios
  useEffect(() => {
    const refreshCalendar = () => {
      const updatedData = getUserCalendarData(userId)
      if (updatedData && updatedData.lastUpdated.getTime() !== calendarData?.lastUpdated.getTime()) {
        console.log('📅 Calendario actualizado automáticamente')
        setCalendarData(updatedData)
      }
    }
    
    // Verificar cada 2 segundos si hay cambios
    const interval = setInterval(refreshCalendar, 2000)
    
    return () => clearInterval(interval)
  }, [userId, calendarData?.lastUpdated])
  
  // Función para forzar refresh manual (para usar desde componentes padre)
  const refreshCalendarData = () => {
    const data = getUserCalendarData(userId)
    setCalendarData(data)
    console.log('📅 Calendario refrescado manualmente')
  }
  
  // Exponer función refresh al componente padre
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshCalendar = refreshCalendarData
    }
  }, [])
  
  // Listener para eventos de calendario creados por IA
  useEffect(() => {
    const handleCalendarEventCreated = (event: CustomEvent) => {
      console.log('📅 Evento detectado por SmartCalendar:', event.detail)
      refreshCalendarData()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('calendarEventCreated', handleCalendarEventCreated)
      
      return () => {
        window.removeEventListener('calendarEventCreated', handleCalendarEventCreated)
      }
    }
  }, [])

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
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({
        date: prevDate.getDate(),
        fullDate: prevDate,
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day)
      const isToday = new Date().toDateString() === dayDate.toDateString()
      const dayEvents = getEventsForDate(userId, dayDate)
      
      days.push({
        date: day,
        fullDate: dayDate,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextDate,
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }
    
    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + i)
      
      const isToday = new Date().toDateString() === dayDate.toDateString()
      const dayEvents = getEventsForDate(userId, dayDate)
      
      days.push({
        date: dayDate.getDate(),
        fullDate: dayDate,
        isCurrentMonth: dayDate.getMonth() === date.getMonth(),
        isToday,
        events: dayEvents
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventClick?.(event)
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header days */}
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-slate-600 py-3 bg-slate-50 rounded-t-lg"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => handleDateClick(day.fullDate)}
            className={`
              relative min-h-[120px] p-2 border border-slate-200 cursor-pointer transition-all duration-200
              ${day.isCurrentMonth 
                ? 'bg-white hover:bg-slate-50' 
                : 'bg-slate-50 text-slate-400'
              }
              ${day.isToday 
                ? 'ring-2 ring-teal-500 border-teal-500' 
                : ''
              }
              ${selectedDate && selectedDate.toDateString() === day.fullDate.toDateString()
                ? 'bg-teal-50 border-teal-300'
                : ''
              }
            `}
          >
            {/* Day number */}
            <div className={`
              text-sm font-medium mb-1
              ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
              ${day.isToday ? 'text-teal-700' : ''}
            `}>
              {day.date}
            </div>

            {/* Events */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  onClick={(e) => handleEventClick(event, e)}
                  className={`
                    text-xs px-2 py-1 rounded-md cursor-pointer
                    hover:shadow-sm transition-shadow
                    text-white font-medium
                  `}
                  style={{ backgroundColor: event.color }}
                  title={`${event.title} - ${event.startTime || 'Todo el día'}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{getEventTypeIcon(event.type)}</span>
                    <span className="truncate">
                      {event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title}
                    </span>
                  </div>
                </div>
              ))}
              
              {day.events.length > 3 && (
                <div className="text-xs text-slate-500 pl-2">
                  +{day.events.length - 3} más
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const days = getWeekDays(currentDate)
    const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 10 PM

    return (
      <div className="flex flex-col">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="text-center text-sm font-medium text-slate-600 py-3">
            Hora
          </div>
          {days.map((day, index) => (
            <div
              key={index}
              className={`
                text-center text-sm font-medium py-3 rounded-lg cursor-pointer
                ${day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                ${day.isToday ? 'bg-teal-100 text-teal-700' : 'bg-slate-50'}
              `}
              onClick={() => handleDateClick(day.fullDate)}
            >
              <div>{daysOfWeek[day.fullDate.getDay()]}</div>
              <div className="text-lg font-semibold">{day.date}</div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-8 gap-1 max-h-96 overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              {/* Hour label */}
              <div className="text-xs text-slate-500 text-center py-2 border-r border-slate-200">
                {hour}:00
              </div>
              
              {/* Day cells */}
              {days.map((day, dayIndex) => {
                const hourEvents = day.events.filter(event => {
                  if (!event.startTime) return false
                  const eventHour = parseInt(event.startTime.split(':')[0])
                  return eventHour === hour
                })

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`
                      relative min-h-[60px] p-1 border border-slate-200 cursor-pointer
                      ${day.isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'}
                    `}
                    onClick={() => handleDateClick(day.fullDate)}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`
                          text-xs px-2 py-1 rounded-md cursor-pointer mb-1
                          text-white font-medium
                          hover:shadow-sm transition-shadow
                        `}
                        style={{ backgroundColor: event.color }}
                        title={`${event.title} - ${event.startTime}-${event.endTime}`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{getEventTypeIcon(event.type)}</span>
                          <span className="truncate">
                            {event.title.length > 10 ? event.title.substring(0, 10) + '...' : event.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${view === 'month' 
                  ? 'bg-white text-slate-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              Mes
            </button>
            <button
              onClick={() => setView('week')}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${view === 'week' 
                  ? 'bg-white text-slate-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              Semana
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation */}
          <button
            onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          
          <button
            onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
          
          {/* Today button */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Hoy
          </button>
          
          {/* Add Event Button */}
          <button
            onClick={onAddEvent}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Agregar Evento</span>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {view === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">Exámenes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">Sesiones de Estudio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">Clases</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">Actividades</span>
          </div>
        </div>
      </div>
    </div>
  )
}