// Calendar Data Models for Smart Calendar

export interface TimeSlot {
  start: string // "08:00"
  end: string   // "09:30"
  subject: string
  location?: string
  color?: string
}

export interface SchoolSchedule {
  monday: TimeSlot[]
  tuesday: TimeSlot[]
  wednesday: TimeSlot[]
  thursday: TimeSlot[]
  friday: TimeSlot[]
  saturday?: TimeSlot[]
}

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  startTime?: string
  endTime?: string
  type: 'exam' | 'study_session' | 'class' | 'personal' | 'extracurricular'
  color: string
  description?: string
  subject?: string
  location?: string
  priority?: 'high' | 'medium' | 'low'
  duration?: number // in minutes
  isRecurring?: boolean
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    days?: number[] // 0=Sunday, 1=Monday, etc.
    endDate?: Date
  }
}

export interface StudyPreferences {
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'flexible'
  dailyStudyHours: number
  maxSessionDuration: number
  breakBetweenSessions: number
  weekendStudyHours: number
  noStudyDays: number[] // Days of week to avoid studying
}

export interface UserCalendarData {
  userId: string
  schoolSchedule: SchoolSchedule
  studyPreferences: StudyPreferences
  events: CalendarEvent[]
  isSetupComplete: boolean
  lastUpdated: Date
}

// Temporary storage for calendar data
const globalForCalendarData = globalThis as unknown as {
  tempCalendarData: UserCalendarData[] | undefined
}

export const tempCalendarData: UserCalendarData[] = globalForCalendarData.tempCalendarData ?? []
globalForCalendarData.tempCalendarData = tempCalendarData

// Calendar Data Management Functions
export function getUserCalendarData(userId: string): UserCalendarData | undefined {
  return tempCalendarData.find(data => data.userId === userId)
}

export function createUserCalendarData(userId: string): UserCalendarData {
  const newData: UserCalendarData = {
    userId,
    schoolSchedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: []
    },
    studyPreferences: {
      preferredStudyTime: 'afternoon',
      dailyStudyHours: 3,
      maxSessionDuration: 90,
      breakBetweenSessions: 15,
      weekendStudyHours: 4,
      noStudyDays: [0] // Sunday
    },
    events: [],
    isSetupComplete: false,
    lastUpdated: new Date()
  }
  
  tempCalendarData.push(newData)
  return newData
}

export function updateUserCalendarData(userId: string, updates: Partial<UserCalendarData>): boolean {
  const index = tempCalendarData.findIndex(data => data.userId === userId)
  if (index !== -1) {
    tempCalendarData[index] = {
      ...tempCalendarData[index],
      ...updates,
      lastUpdated: new Date()
    }
    return true
  }
  return false
}

export function addCalendarEvent(userId: string, event: CalendarEvent): boolean {
  const userData = getUserCalendarData(userId)
  if (userData) {
    userData.events.push(event)
    userData.lastUpdated = new Date()
    
    // Force update in global storage
    const index = tempCalendarData.findIndex(data => data.userId === userId)
    if (index !== -1) {
      tempCalendarData[index] = userData
    }
    
    console.log(`📅 Evento agregado: ${event.title} - Total eventos: ${userData.events.length}`)
    return true
  }
  return false
}

export function updateCalendarEvent(userId: string, eventId: string, updates: Partial<CalendarEvent>): boolean {
  const userData = getUserCalendarData(userId)
  if (userData) {
    const eventIndex = userData.events.findIndex(e => e.id === eventId)
    if (eventIndex !== -1) {
      userData.events[eventIndex] = {
        ...userData.events[eventIndex],
        ...updates
      }
      userData.lastUpdated = new Date()
      
      // Force update in global storage
      const index = tempCalendarData.findIndex(data => data.userId === userId)
      if (index !== -1) {
        tempCalendarData[index] = userData
      }
      
      console.log(`📅 Evento actualizado: ${userData.events[eventIndex].title}`)
      return true
    }
  }
  return false
}

export function deleteCalendarEvent(userId: string, eventId: string): boolean {
  const userData = getUserCalendarData(userId)
  if (userData) {
    const eventIndex = userData.events.findIndex(e => e.id === eventId)
    if (eventIndex !== -1) {
      const deletedEvent = userData.events[eventIndex]
      userData.events.splice(eventIndex, 1)
      userData.lastUpdated = new Date()
      
      // Force update in global storage
      const index = tempCalendarData.findIndex(data => data.userId === userId)
      if (index !== -1) {
        tempCalendarData[index] = userData
      }
      
      console.log(`📅 Evento eliminado: ${deletedEvent.title} - Total eventos: ${userData.events.length}`)
      return true
    }
  }
  return false
}

export function getEventsForDate(userId: string, date: Date): CalendarEvent[] {
  const userData = getUserCalendarData(userId)
  if (!userData) return []
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  return userData.events.filter(event => {
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate.getTime() === targetDate.getTime()
  })
}

export function getEventsForDateRange(userId: string, startDate: Date, endDate: Date): CalendarEvent[] {
  const userData = getUserCalendarData(userId)
  if (!userData) return []
  
  return userData.events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= startDate && eventDate <= endDate
  })
}

// Utility functions for calendar operations
export function isTimeSlotAvailable(
  userId: string, 
  date: Date, 
  startTime: string, 
  endTime: string
): boolean {
  const userData = getUserCalendarData(userId)
  if (!userData) return true
  
  const dayName = getDayName(date.getDay())
  const schoolSlots = userData.schoolSchedule[dayName] || []
  
  // Check school schedule conflicts
  for (const slot of schoolSlots) {
    if (timeOverlaps(startTime, endTime, slot.start, slot.end)) {
      return false
    }
  }
  
  // Check existing events
  const dayEvents = getEventsForDate(userId, date)
  for (const event of dayEvents) {
    if (event.startTime && event.endTime) {
      if (timeOverlaps(startTime, endTime, event.startTime, event.endTime)) {
        return false
      }
    }
  }
  
  return true
}

export function findAvailableTimeSlots(
  userId: string,
  date: Date,
  duration: number, // in minutes
  preferredTime?: 'morning' | 'afternoon' | 'evening'
): { start: string; end: string }[] {
  const userData = getUserCalendarData(userId)
  if (!userData) return []
  
  const slots: { start: string; end: string }[] = []
  
  // Define time ranges based on preference
  const timeRanges = {
    morning: ['08:00', '12:00'],
    afternoon: ['14:00', '18:00'],
    evening: ['19:00', '22:00']
  }
  
  const searchRange = preferredTime ? timeRanges[preferredTime] : ['08:00', '22:00']
  const [searchStart, searchEnd] = searchRange
  
  // Generate potential slots every 30 minutes
  const startMinutes = timeToMinutes(searchStart)
  const endMinutes = timeToMinutes(searchEnd)
  
  for (let minutes = startMinutes; minutes <= endMinutes - duration; minutes += 30) {
    const slotStart = minutesToTime(minutes)
    const slotEnd = minutesToTime(minutes + duration)
    
    if (isTimeSlotAvailable(userId, date, slotStart, slotEnd)) {
      slots.push({ start: slotStart, end: slotEnd })
    }
  }
  
  return slots
}

export function getEventTypeColor(type: CalendarEvent['type']): string {
  const colors = {
    exam: '#EF4444',          // Red
    study_session: '#3B82F6', // Blue
    class: '#10B981',         // Green
    personal: '#8B5CF6',      // Purple
    extracurricular: '#F59E0B' // Orange
  }
  return colors[type] || '#64748B'
}

export function getEventTypeIcon(type: CalendarEvent['type']): string {
  const icons = {
    exam: '📝',
    study_session: '📚',
    class: '🎓',
    personal: '👤',
    extracurricular: '🏃‍♀️'
  }
  return icons[type] || '📅'
}

// Helper functions
function getDayName(dayIndex: number): keyof SchoolSchedule {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[dayIndex] as keyof SchoolSchedule
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes
}

// Initialize demo data
function initDemoCalendarData() {
  const demoUserId = "demo-student-fixed"
  
  if (!getUserCalendarData(demoUserId)) {
    console.log("📅 Inicializando datos de calendario demo...")
    
    const demoData = createUserCalendarData(demoUserId)
    
    // Demo school schedule
    demoData.schoolSchedule = {
      monday: [
        { start: '08:00', end: '09:30', subject: 'Matemáticas', location: 'Aula 201', color: '#3B82F6' },
        { start: '09:45', end: '11:15', subject: 'Química', location: 'Laboratorio A', color: '#EF4444' },
        { start: '11:30', end: '13:00', subject: 'Historia', location: 'Aula 105', color: '#8B5CF6' }
      ],
      tuesday: [
        { start: '08:00', end: '09:30', subject: 'Física', location: 'Laboratorio B', color: '#10B981' },
        { start: '09:45', end: '11:15', subject: 'Literatura', location: 'Aula 203', color: '#F59E0B' },
        { start: '11:30', end: '13:00', subject: 'Biología', location: 'Laboratorio C', color: '#EC4899' }
      ],
      wednesday: [
        { start: '08:00', end: '09:30', subject: 'Matemáticas', location: 'Aula 201', color: '#3B82F6' },
        { start: '09:45', end: '11:15', subject: 'Educación Física', location: 'Gimnasio', color: '#06B6D4' },
        { start: '11:30', end: '13:00', subject: 'Arte', location: 'Taller', color: '#F97316' }
      ],
      thursday: [
        { start: '08:00', end: '09:30', subject: 'Química', location: 'Laboratorio A', color: '#EF4444' },
        { start: '09:45', end: '11:15', subject: 'Física', location: 'Laboratorio B', color: '#10B981' },
        { start: '11:30', end: '13:00', subject: 'Historia', location: 'Aula 105', color: '#8B5CF6' }
      ],
      friday: [
        { start: '08:00', end: '09:30', subject: 'Biología', location: 'Laboratorio C', color: '#EC4899' },
        { start: '09:45', end: '11:15', subject: 'Literatura', location: 'Aula 203', color: '#F59E0B' },
        { start: '11:30', end: '13:00', subject: 'Matemáticas', location: 'Aula 201', color: '#3B82F6' }
      ]
    }
    
    // Demo events
    const now = new Date()
    const demoEvents: CalendarEvent[] = [
      {
        id: 'exam-1',
        title: 'Examen Química Orgánica',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '12:00',
        type: 'exam',
        color: getEventTypeColor('exam'),
        description: 'Examen parcial de química orgánica',
        subject: 'Química',
        location: 'Laboratorio A'
      },
      {
        id: 'study-1',
        title: 'Sesión de Estudio - Matemáticas',
        date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        startTime: '15:00',
        endTime: '16:30',
        type: 'study_session',
        color: getEventTypeColor('study_session'),
        description: 'Repaso de cálculo integral',
        subject: 'Matemáticas'
      },
      {
        id: 'personal-1',
        title: 'Entrenamiento Fútbol',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        startTime: '17:00',
        endTime: '18:30',
        type: 'extracurricular',
        color: getEventTypeColor('extracurricular'),
        description: 'Entrenamiento de fútbol',
        location: 'Campo deportivo'
      }
    ]
    
    demoEvents.forEach(event => {
      demoData.events.push(event)
    })
    
    demoData.isSetupComplete = true
    demoData.lastUpdated = new Date()
    
    console.log("✅ Datos de calendario demo inicializados")
  } else {
    console.log("✅ Datos de calendario demo ya existen")
  }
}

// Initialize demo data on module load
initDemoCalendarData()