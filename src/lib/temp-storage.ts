// Temporary user storage - replace with database later
interface TempUser {
  id: string
  name: string
  email: string
  password: string
  studentId?: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  image?: string
  // Academic fields
  program?: string // Carrera/programa de estudios
  academicYear?: string // Año académico (ej: "2024-2025")
  enrollmentYear?: number // Año de ingreso
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" // Estado del estudiante
  phoneNumber?: string
  dateOfBirth?: Date
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    emailNotifications: boolean
    pushNotifications: boolean
    weeklyReminders: boolean
    progressReports: boolean
  }
}

interface AttachedFile {
  filename: string
  originalName: string
  size: number
  type: string
  url: string
}

interface WeeklyReport {
  id: string
  userId: string
  weekStart: Date
  weekEnd: Date
  submittedAt: Date
  responses: {
    temasYDominio: string // Pregunta 1
    evidenciaAprendizaje: string // Pregunta 2
    dificultadesEstrategias: string // Pregunta 3
    conexionesAplicacion: string // Pregunta 4
    comentariosAdicionales?: string // Pregunta 5 (opcional)
  }
  attachments?: AttachedFile[] // Archivos adjuntos
}

// Singleton pattern to persist data across requests
const globalForStorage = globalThis as unknown as {
  tempUsers: TempUser[] | undefined
  tempWeeklyReports: WeeklyReport[] | undefined
}

export const tempUsers: TempUser[] = globalForStorage.tempUsers ?? []
export const tempWeeklyReports: WeeklyReport[] = globalForStorage.tempWeeklyReports ?? []

// Assign to globalThis to persist across requests
globalForStorage.tempUsers = tempUsers
globalForStorage.tempWeeklyReports = tempWeeklyReports

export function addUser(user: TempUser) {
  tempUsers.push(user)
}

export function findUserByEmail(email: string) {
  return tempUsers.find(user => user.email === email)
}

export function findUserByStudentId(studentId: string) {
  return tempUsers.find(user => user.studentId === studentId)
}

export function findUserById(id: string) {
  return tempUsers.find(user => user.id === id)
}

export function getAllUsers() {
  return tempUsers
}

export function findUsersByRole(role: string) {
  return tempUsers.filter(user => user.role === role)
}

export function findUsersByProgram(program: string) {
  return tempUsers.filter(user => user.program === program)
}

export function findUsersByStatus(status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
  return tempUsers.filter(user => user.status === status)
}

export function updateUser(id: string, updates: Partial<TempUser>) {
  const userIndex = tempUsers.findIndex(user => user.id === id)
  if (userIndex !== -1) {
    tempUsers[userIndex] = {
      ...tempUsers[userIndex],
      ...updates,
      updatedAt: new Date()
    }
    return tempUsers[userIndex]
  }
  return null
}

export function deleteUser(id: string) {
  const userIndex = tempUsers.findIndex(user => user.id === id)
  if (userIndex !== -1) {
    return tempUsers.splice(userIndex, 1)[0]
  }
  return null
}

export function validateStudentId(studentId: string): boolean {
  // Formato sugerido: EST-YYYY-XXX (ej: EST-2024-001)
  const studentIdRegex = /^EST-\d{4}-\d{3}$/
  return studentIdRegex.test(studentId)
}

export function generateStudentId(): string {
  const currentYear = new Date().getFullYear()
  const existingIds = tempUsers
    .filter(user => user.studentId && user.studentId.startsWith(`EST-${currentYear}`))
    .map(user => user.studentId!)
    .sort()

  let nextNumber = 1
  if (existingIds.length > 0) {
    const lastId = existingIds[existingIds.length - 1]
    const lastNumber = parseInt(lastId.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `EST-${currentYear}-${nextNumber.toString().padStart(3, '0')}`
}

// Weekly Reports Functions
export function addWeeklyReport(report: WeeklyReport) {
  tempWeeklyReports.push(report)
}

export function findWeeklyReportsByUser(userId: string): WeeklyReport[] {
  return tempWeeklyReports.filter(report => report.userId === userId)
}

export function findWeeklyReportByUserAndWeek(userId: string, weekStart: Date): WeeklyReport | undefined {
  return tempWeeklyReports.find(report => 
    report.userId === userId && 
    report.weekStart.getTime() === weekStart.getTime()
  )
}

export function getAllWeeklyReports(): WeeklyReport[] {
  return tempWeeklyReports
}

export function getWeeklyReportsByDateRange(startDate: Date, endDate: Date): WeeklyReport[] {
  return tempWeeklyReports.filter(report => 
    report.weekStart >= startDate && report.weekEnd <= endDate
  )
}

// Date utility functions
export function getCurrentWeekStart(): Date {
  const now = new Date()
  const monday = new Date(now)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

export function canSubmitThisWeek(userId: string): boolean {
  const weekStart = getCurrentWeekStart()
  const weekEnd = getCurrentWeekEnd()
  const currentDate = new Date()
  const existingReport = findWeeklyReportByUserAndWeek(userId, weekStart)
  
  // Can submit if:
  // 1. We are currently in this week (currentDate is between weekStart and weekEnd)
  // 2. No report exists for this week
  const isCurrentWeek = currentDate >= weekStart && currentDate <= weekEnd
  
  console.log(`🔍 Debug canSubmitThisWeek for user ${userId}:`)
  console.log(`  Current date: ${currentDate.toISOString()}`)
  console.log(`  Week start: ${weekStart.toISOString()}`)
  console.log(`  Week end: ${weekEnd.toISOString()}`)
  console.log(`  Is current week: ${isCurrentWeek}`)
  console.log(`  Existing report: ${existingReport ? 'YES' : 'NO'}`)
  console.log(`  Can submit: ${isCurrentWeek && !existingReport}`)
  
  return isCurrentWeek && !existingReport
}

export function getWeekDates(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

export function getMonthWeeks(year: number, month: number): Array<{ start: Date; end: Date }> {
  const weeks = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let current = new Date(firstDay)
  
  // Adjust to start from Monday of first week
  const dayOfWeek = current.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  current.setDate(current.getDate() - daysToSubtract)
  
  while (current <= lastDay) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    weeks.push({ start: weekStart, end: weekEnd })
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}

// ===== CALENDAR FUNCTIONS =====
// These functions integrate with the calendar system for Sara AI

export function getEvents(userId: string): any[] {
  // Import calendar data functions
  try {
    const { getUserCalendarData } = require('./calendar-data')
    const userData = getUserCalendarData(userId)
    return userData?.events || []
  } catch (error) {
    console.error('Error getting calendar events:', error)
    return []
  }
}

export function getAllCalendarEvents(userId: string): any[] {
  // Alias for getEvents for compatibility
  return getEvents(userId)
}

export function getUpcomingEvents(userId: string, days: number = 30): any[] {
  try {
    const allEvents = getEvents(userId)
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= futureDate
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error('Error getting upcoming events:', error)
    return []
  }
}

export function getEventsForDateRange(userId: string, startDate: Date, endDate: Date): any[] {
  try {
    const allEvents = getEvents(userId)
    return allEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= startDate && eventDate <= endDate
    })
  } catch (error) {
    console.error('Error getting events for date range:', error)
    return []
  }
}

export function findEventById(userId: string, eventId: string): any | null {
  try {
    const allEvents = getEvents(userId)
    return allEvents.find(event => event.id === eventId) || null
  } catch (error) {
    console.error('Error finding event by ID:', error)
    return null
  }
}

// ===== CONVERSATION MEMORY FUNCTIONS =====
// Persistent conversation storage for Sara AI

interface ConversationTurn {
  id: string
  timestamp: Date
  role: 'user' | 'assistant'
  content: string
  metadata: {
    subject?: string
    topic?: string
    intention?: string
    taskCompleted?: boolean
    eventCreated?: boolean
  }
}

interface ConversationSession {
  userId: string
  sessionId: string
  turns: ConversationTurn[]
  currentTopic?: string
  currentSubject?: string
  pendingTasks: Array<{
    id: string
    type: 'calendar_event' | 'academic_search' | 'reminder'
    description: string
    data: any
    completed: boolean
    createdAt: Date
  }>
  lastUpdate: Date
}

// Global storage for conversations
const globalForConversations = globalThis as unknown as {
  tempConversations: ConversationSession[] | undefined
}

export const tempConversations: ConversationSession[] = globalForConversations.tempConversations ?? []
globalForConversations.tempConversations = tempConversations

export function getConversationSession(userId: string, sessionId: string): ConversationSession | null {
  return tempConversations.find(session => 
    session.userId === userId && session.sessionId === sessionId
  ) || null
}

export function createConversationSession(userId: string, sessionId: string): ConversationSession {
  // First remove any old session for the same user/sessionId
  const existingIndex = tempConversations.findIndex(session => 
    session.userId === userId && session.sessionId === sessionId
  )
  if (existingIndex !== -1) {
    tempConversations.splice(existingIndex, 1)
  }

  const newSession: ConversationSession = {
    userId,
    sessionId,
    turns: [],
    currentTopic: undefined,
    currentSubject: undefined,
    pendingTasks: [],
    lastUpdate: new Date()
  }
  
  tempConversations.push(newSession)
  console.log(`💬 Created conversation session ${sessionId} for user ${userId}`)
  return newSession
}

export function updateConversationSession(session: ConversationSession): ConversationSession {
  const index = tempConversations.findIndex(s => 
    s.userId === session.userId && s.sessionId === session.sessionId
  )
  
  if (index !== -1) {
    tempConversations[index] = { ...session, lastUpdate: new Date() }
    console.log(`💬 Updated session ${session.sessionId} - ${session.turns.length} turns`)
  } else {
    tempConversations.push({ ...session, lastUpdate: new Date() })
    console.log(`💬 Created new session ${session.sessionId} during update`)
  }
  
  return session
}

export function addConversationTurn(
  userId: string, 
  sessionId: string, 
  role: 'user' | 'assistant', 
  content: string,
  metadata: ConversationTurn['metadata'] = {}
): ConversationSession {
  let session = getConversationSession(userId, sessionId)
  if (!session) {
    session = createConversationSession(userId, sessionId)
  }
  
  const turn: ConversationTurn = {
    id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    role,
    content,
    metadata
  }
  
  session.turns.push(turn)
  
  // Keep only last 20 turns per session
  if (session.turns.length > 20) {
    session.turns = session.turns.slice(-20)
  }
  
  return updateConversationSession(session)
}

export function addPendingTask(
  userId: string,
  sessionId: string,
  type: 'calendar_event' | 'academic_search' | 'reminder',
  description: string,
  data: any
): void {
  let session = getConversationSession(userId, sessionId)
  if (!session) {
    session = createConversationSession(userId, sessionId)
  }
  
  const task = {
    id: `task_${Date.now()}`,
    type,
    description,
    data,
    completed: false,
    createdAt: new Date()
  }
  
  session.pendingTasks.push(task)
  console.log(`📋 Added pending task: ${description}`)
  
  updateConversationSession(session)
}

export function markTaskCompleted(
  userId: string,
  sessionId: string,
  taskId: string,
  result?: any
): boolean {
  const session = getConversationSession(userId, sessionId)
  if (!session) return false
  
  const task = session.pendingTasks.find(t => t.id === taskId)
  if (!task) return false
  
  task.completed = true
  if (result) {
    task.data.result = result
  }
  
  console.log(`✅ Completed task: ${task.description}`)
  updateConversationSession(session)
  return true
}

export function getPendingTasks(userId: string, sessionId: string): Array<{
  id: string
  type: 'calendar_event' | 'academic_search' | 'reminder'
  description: string
  data: any
  completed: boolean
  createdAt: Date
}> {
  const session = getConversationSession(userId, sessionId)
  if (!session) return []
  
  return session.pendingTasks.filter(task => !task.completed)
}

export function getConversationHistory(userId: string, sessionId: string, limit: number = 10): ConversationTurn[] {
  const session = getConversationSession(userId, sessionId)
  if (!session) return []
  
  return session.turns.slice(-limit)
}

export function getUserActiveSessions(userId: string): ConversationSession[] {
  const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000))
  return tempConversations.filter(session => 
    session.userId === userId && session.lastUpdate > oneHourAgo
  )
}

export function cleanupOldConversations(): void {
  const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000))
  const before = tempConversations.length
  
  // Remove conversations older than 6 hours
  for (let i = tempConversations.length - 1; i >= 0; i--) {
    if (tempConversations[i].lastUpdate < sixHoursAgo) {
      tempConversations.splice(i, 1)
    }
  }
  
  const after = tempConversations.length
  if (before !== after) {
    console.log(`🧹 Cleaned up ${before - after} old conversation sessions`)
  }
}

// Initialize default users automatically
import bcrypt from "bcryptjs"

function initDefaultUsers() {
  // Check if demo users already exist to avoid duplicates
  const studentExists = findUserByEmail("estudiante@demo.com")
  const instructorExists = findUserByEmail("instructor@demo.com")
  
  if (!studentExists || !instructorExists) {
    console.log("🔧 Inicializando usuarios por defecto...")
    
    try {
      const hashedPassword = bcrypt.hashSync("Estudiante123!!!", 12)
      
      // Only add student if doesn't exist
      if (!studentExists) {
        addUser({
          id: "demo-student-fixed",
          name: "Estudiante Demo",
          email: "estudiante@demo.com",
          password: hashedPassword,
          role: "STUDENT",
          studentId: "EST-2025-001",
          status: "ACTIVE",
          enrollmentYear: 2025,
          academicYear: "2025-2026",
          program: "Ingeniería en Sistemas",
          phoneNumber: "+1234567890",
          dateOfBirth: new Date("2000-01-01"),
          address: "Demo Address 123",
          emergencyContact: {
            name: "Contacto Demo",
            phone: "+0987654321",
            relationship: "Padre"
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log("✅ Usuario estudiante demo creado")
      }
      
      // Only add instructor if doesn't exist
      if (!instructorExists) {
        addUser({
          id: "demo-instructor-fixed",
          name: "Instructor Demo",
          email: "instructor@demo.com",
          password: hashedPassword,
          role: "INSTRUCTOR",
          studentId: null,
          status: "ACTIVE",
          enrollmentYear: 2025,
          academicYear: "2025-2026",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log("✅ Usuario instructor demo creado")
      }
      
      console.log("✅ Verificación de usuarios por defecto completada")
      
    } catch (error) {
      console.error("❌ Error creando usuarios por defecto:", error)
    }
  } else {
    console.log("✅ Usuarios demo ya existen, no se reinicializan")
  }
  
  // Always check and initialize sample reports
  initSampleReports()
}

function initSampleReports() {
  // Check if sample reports already exist for demo student
  const existingSampleReports = tempWeeklyReports.filter(report => report.userId === "demo-student-fixed")
  
  if (existingSampleReports.length === 0) {
    console.log("📝 Inicializando reportes de muestra...")
    
    try {
      // Get current week dates
      const now = new Date()
      const currentWeek = getCurrentWeekStart()
      const currentWeekEnd = getCurrentWeekEnd()
      
      // Previous week
      const prevWeek = new Date(currentWeek)
      prevWeek.setDate(prevWeek.getDate() - 7)
      const prevWeekEnd = new Date(currentWeekEnd)
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 7)
      
      // Sample report from previous week
      addWeeklyReport({
        id: "sample-report-1",
        userId: "demo-student-fixed",
        weekStart: prevWeek,
        weekEnd: prevWeekEnd,
        submittedAt: new Date(prevWeekEnd.getTime() - 24 * 60 * 60 * 1000), // 1 day before week end
        responses: {
          temasYDominio: "Esta semana trabajamos con JavaScript básico - Nivel 3: Domino funciones y arrays, y estoy aprendiendo objetos complejos.",
          evidenciaAprendizaje: "Completé un proyecto de To-Do List usando JavaScript vanilla. Implementé funciones para agregar, editar y eliminar tareas usando arrays y objetos.",
          dificultadesEstrategias: "Tuve dificultades con el manejo de eventos en JavaScript. Lo resolví practicando con ejemplos y consultando documentación de MDN.",
          conexionesAplicacion: "Los conceptos de eventos se conectan con la interactividad en aplicaciones web. Puedo aplicarlo para crear interfaces más dinámicas.",
          comentariosAdicionales: "Me siento más confiado con JavaScript. Quiero seguir practicando con proyectos más complejos."
        }
      })
      
      // Two weeks ago report  
      const twoWeeksAgo = new Date(currentWeek)
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const twoWeeksAgoEnd = new Date(currentWeekEnd)
      twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 14)
      
      addWeeklyReport({
        id: "sample-report-2",
        userId: "demo-student-fixed", 
        weekStart: twoWeeksAgo,
        weekEnd: twoWeeksAgoEnd,
        submittedAt: new Date(twoWeeksAgoEnd.getTime() - 12 * 60 * 60 * 1000), // 12 hours before week end
        responses: {
          temasYDominio: "Esta semana estudiamos CSS Grid y Flexbox - Nivel 2: Entiendo los conceptos básicos pero aún tengo dudas con layouts complejos.",
          evidenciaAprendizaje: "Recreé el layout de una página web usando CSS Grid. Logré hacer una estructura responsive con header, sidebar y main content.",
          dificultadesEstrategias: "Me confundí con las propiedades grid-template-areas. Resolví el problema dibujando el layout en papel primero.",
          conexionesAplicacion: "CSS Grid es perfecto para crear layouts de páginas web modernas. Lo usaré en mi proyecto final de página portfolio.",
          comentariosAdicionales: "CSS es más divertido de lo que pensaba. Me gusta ver los resultados visuales inmediatos."
        }
      })
      
      console.log("✅ Reportes de muestra creados exitosamente")
    } catch (error) {
      console.error("❌ Error creando reportes de muestra:", error)
    }
  } else {
    console.log("✅ Reportes de muestra ya existen, no se reinicializan")
  }
}

// Initialize on module load
initDefaultUsers()

// Start conversation cleanup interval
setInterval(cleanupOldConversations, 30 * 60 * 1000) // Every 30 minutes