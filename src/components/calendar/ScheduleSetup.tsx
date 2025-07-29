'use client'

import { useState } from 'react'
import { ClockIcon, PlusIcon, TrashIcon, DocumentCheckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { 
  SchoolSchedule, 
  TimeSlot, 
  getUserCalendarData, 
  updateUserCalendarData 
} from '@/lib/calendar-data'

interface ScheduleSetupProps {
  userId: string
  onSetupComplete?: () => void
  className?: string
}

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' }
]

const predefinedSubjects = [
  { name: 'Matemáticas', color: '#3B82F6' },
  { name: 'Química', color: '#EF4444' },
  { name: 'Física', color: '#10B981' },
  { name: 'Biología', color: '#EC4899' },
  { name: 'Historia', color: '#8B5CF6' },
  { name: 'Literatura', color: '#F59E0B' },
  { name: 'Inglés', color: '#06B6D4' },
  { name: 'Educación Física', color: '#84CC16' },
  { name: 'Arte', color: '#F97316' },
  { name: 'Filosofía', color: '#64748B' },
  { name: 'Geografía', color: '#0EA5E9' },
  { name: 'Informática', color: '#6366F1' }
]

export default function ScheduleSetup({ userId, onSetupComplete, className = '' }: ScheduleSetupProps) {
  const [schedule, setSchedule] = useState<SchoolSchedule>(() => {
    const userData = getUserCalendarData(userId)
    return userData?.schoolSchedule || {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [editingSlot, setEditingSlot] = useState<{
    day: keyof SchoolSchedule
    index: number
  } | null>(null)

  const [newSlot, setNewSlot] = useState<TimeSlot>({
    start: '08:00',
    end: '09:30',
    subject: '',
    location: '',
    color: '#3B82F6'
  })

  const addTimeSlot = (day: keyof SchoolSchedule) => {
    if (!newSlot.subject.trim()) return

    const updatedSchedule = {
      ...schedule,
      [day]: [...schedule[day], { ...newSlot }]
    }

    setSchedule(updatedSchedule)
    setNewSlot({
      start: '08:00',
      end: '09:30',
      subject: '',
      location: '',
      color: '#3B82F6'
    })
  }

  const removeTimeSlot = (day: keyof SchoolSchedule, index: number) => {
    const updatedSchedule = {
      ...schedule,
      [day]: schedule[day].filter((_, i) => i !== index)
    }
    setSchedule(updatedSchedule)
  }

  const updateTimeSlot = (day: keyof SchoolSchedule, index: number, updates: Partial<TimeSlot>) => {
    const updatedSchedule = {
      ...schedule,
      [day]: schedule[day].map((slot, i) => 
        i === index ? { ...slot, ...updates } : slot
      )
    }
    setSchedule(updatedSchedule)
  }

  const saveSchedule = async () => {
    setIsSaving(true)
    
    try {
      const success = updateUserCalendarData(userId, {
        schoolSchedule: schedule,
        isSetupComplete: true
      })
      
      if (success) {
        onSetupComplete?.()
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getSubjectColor = (subject: string) => {
    const predefined = predefinedSubjects.find(s => s.name === subject)
    return predefined?.color || '#64748B'
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 7; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(time)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  const isValidTimeSlot = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    return startTime < endTime
  }

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
          <ClockIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Configuración de Horarios</span>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900">
          Configura tu Horario Escolar
        </h2>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Define tu horario semanal de clases para que el sistema pueda programar 
          sesiones de estudio inteligentes sin conflictos.
        </p>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {daysOfWeek.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Day Header */}
            <div className="px-6 py-4 bg-slate-50 rounded-t-xl border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
              <p className="text-sm text-slate-600">
                {schedule[key as keyof SchoolSchedule]?.length || 0} clases
              </p>
            </div>

            {/* Time Slots */}
            <div className="p-6 space-y-3">
              {(schedule[key as keyof SchoolSchedule] || []).map((slot, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  {editingSlot?.day === key && editingSlot?.index === index ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(key as keyof SchoolSchedule, index, { start: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <select
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(key as keyof SchoolSchedule, index, { end: e.target.value })}
                          className="px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      
                      <select
                        value={slot.subject}
                        onChange={(e) => updateTimeSlot(key as keyof SchoolSchedule, index, { 
                          subject: e.target.value,
                          color: getSubjectColor(e.target.value)
                        })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      >
                        <option value="">Seleccionar materia</option>
                        {predefinedSubjects.map(subject => (
                          <option key={subject.name} value={subject.name}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="text"
                        value={slot.location || ''}
                        onChange={(e) => updateTimeSlot(key as keyof SchoolSchedule, index, { location: e.target.value })}
                        placeholder="Ubicación (opcional)"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setEditingSlot({ day: key as keyof SchoolSchedule, index })}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: slot.color }}
                          />
                          <span className="font-medium text-slate-800 text-sm">
                            {slot.subject}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {slot.start} - {slot.end}
                          {slot.location && ` • ${slot.location}`}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTimeSlot(key as keyof SchoolSchedule, index)
                        }}
                        className="p-1 text-red-600 hover:text-red-700 ml-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Slot */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newSlot.start}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, start: e.target.value }))}
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <select
                    value={newSlot.end}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, end: e.target.value }))}
                    className="px-2 py-1 border border-slate-300 rounded text-sm"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <select
                  value={newSlot.subject}
                  onChange={(e) => setNewSlot(prev => ({ 
                    ...prev, 
                    subject: e.target.value,
                    color: getSubjectColor(e.target.value)
                  }))}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  <option value="">Seleccionar materia</option>
                  {predefinedSubjects.map(subject => (
                    <option key={subject.name} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={newSlot.location || ''}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ubicación (opcional)"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                />
                
                <button
                  onClick={() => addTimeSlot(key as keyof SchoolSchedule)}
                  disabled={!newSlot.subject.trim() || !isValidTimeSlot(newSlot.start, newSlot.end)}
                  className="w-full py-2 px-3 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Agregar Clase</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="text-center">
        <button
          onClick={saveSchedule}
          disabled={isSaving}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          <DocumentCheckIcon className="w-5 h-5" />
          <span>{isSaving ? 'Guardando...' : 'Guardar Horario'}</span>
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para configurar tu horario:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Incluye todas tus clases regulares para evitar conflictos</li>
          <li>• Agrega la ubicación para recordatorios más útiles</li>
          <li>• Puedes editar cualquier clase haciendo clic sobre ella</li>
          <li>• El sistema usará esta información para programar sesiones de estudio</li>
        </ul>
      </div>
    </div>
  )
}