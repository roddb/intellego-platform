// Academic Data Models and Management System

export interface Subject {
  id: string
  name: string
  code: string // e.g., "QUI-101"
  semester: 1 | 2 // Cuatrimestre
  bimester: 1 | 2 | 3 | 4 // Bimestre dentro del año
  credits: number
  instructor: string
  color: string // Para visualización en calendario
  description?: string
  prerequisites?: string[]
}

export interface Exam {
  id: string
  subjectId: string
  title: string
  type: 'parcial' | 'final' | 'recuperatorio' | 'integrador'
  date: Date
  duration: number // en minutos
  topics: string[]
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface StudyMaterial {
  id: string
  subjectId: string
  examId?: string
  userId: string
  title: string
  type: 'pdf' | 'doc' | 'image' | 'video' | 'audio' | 'link'
  url: string
  uploadedAt: Date
  size: number
  tags: string[]
  analyzed: boolean // Si ya fue analizado por IA
  keyTopics?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  estimatedStudyTime?: number // en minutos
}

export interface StudySession {
  id: string
  userId: string
  examId: string
  title: string
  scheduledDate: Date
  duration: number // en minutos
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  topics: string[]
  materials: string[] // IDs de materiales
  completed: boolean
  completedAt?: Date
  notes?: string
  effectiveness?: number // 1-5 rating
  createdAt: Date
  updatedAt: Date
}

export interface StudyProgress {
  id: string
  userId: string
  examId: string
  subjectId: string
  totalSessions: number
  completedSessions: number
  totalStudyTime: number // en minutos
  averageEffectiveness: number
  topicsProgress: {
    [topic: string]: {
      completedSessions: number
      totalSessions: number
      lastStudied: Date
      masteryLevel: number // 0-100%
    }
  }
  simulationResults: {
    date: Date
    score: number
    topics: string[]
    strengths: string[]
    weaknesses: string[]
  }[]
  predictedReadiness: number // 0-100%
  estimatedSuccessRate: number // 0-100%
  lastUpdated: Date
}

export interface AcademicSchedule {
  id: string
  userId: string
  year: number
  semester: number
  subjects: Subject[]
  exams: Exam[]
  personalEvents: {
    id: string
    title: string
    date: Date
    duration: number
    type: 'extracurricular' | 'personal' | 'work'
    recurring?: {
      frequency: 'weekly' | 'monthly'
      days: number[]
    }
  }[]
  preferences: {
    studyTimePreference: 'morning' | 'afternoon' | 'evening' | 'flexible'
    dailyStudyHours: number
    weekendStudyHours: number
    breakDuration: number
    maxSessionDuration: number
  }
}

// Temporary storage for academic data
const globalForAcademicData = globalThis as unknown as {
  tempSubjects: Subject[] | undefined
  tempExams: Exam[] | undefined
  tempStudyMaterials: StudyMaterial[] | undefined
  tempStudySessions: StudySession[] | undefined
  tempStudyProgress: StudyProgress[] | undefined
  tempAcademicSchedules: AcademicSchedule[] | undefined
}

export const tempSubjects: Subject[] = globalForAcademicData.tempSubjects ?? []
export const tempExams: Exam[] = globalForAcademicData.tempExams ?? []
export const tempStudyMaterials: StudyMaterial[] = globalForAcademicData.tempStudyMaterials ?? []
export const tempStudySessions: StudySession[] = globalForAcademicData.tempStudySessions ?? []
export const tempStudyProgress: StudyProgress[] = globalForAcademicData.tempStudyProgress ?? []
export const tempAcademicSchedules: AcademicSchedule[] = globalForAcademicData.tempAcademicSchedules ?? []

// Assign to globalThis to persist across requests
globalForAcademicData.tempSubjects = tempSubjects
globalForAcademicData.tempExams = tempExams
globalForAcademicData.tempStudyMaterials = tempStudyMaterials
globalForAcademicData.tempStudySessions = tempStudySessions
globalForAcademicData.tempStudyProgress = tempStudyProgress
globalForAcademicData.tempAcademicSchedules = tempAcademicSchedules

// Subject Management Functions
export function addSubject(subject: Subject) {
  tempSubjects.push(subject)
}

export function getSubjectById(id: string): Subject | undefined {
  return tempSubjects.find(subject => subject.id === id)
}

export function getSubjectsBySemester(semester: number): Subject[] {
  return tempSubjects.filter(subject => subject.semester === semester)
}

export function getAllSubjects(): Subject[] {
  return tempSubjects
}

// Exam Management Functions
export function addExam(exam: Exam) {
  tempExams.push(exam)
}

export function getExamById(id: string): Exam | undefined {
  return tempExams.find(exam => exam.id === id)
}

export function getExamsBySubject(subjectId: string): Exam[] {
  return tempExams.filter(exam => exam.subjectId === subjectId)
}

export function getUpcomingExams(userId: string, days: number = 30): Exam[] {
  const now = new Date()
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
  
  return tempExams.filter(exam => 
    exam.isActive && 
    exam.date >= now && 
    exam.date <= futureDate
  ).sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Study Material Management Functions
export function addStudyMaterial(material: StudyMaterial) {
  tempStudyMaterials.push(material)
}

export function getStudyMaterialsBySubject(subjectId: string): StudyMaterial[] {
  return tempStudyMaterials.filter(material => material.subjectId === subjectId)
}

export function getStudyMaterialsByExam(examId: string): StudyMaterial[] {
  return tempStudyMaterials.filter(material => material.examId === examId)
}

export function getStudyMaterialsByUser(userId: string): StudyMaterial[] {
  return tempStudyMaterials.filter(material => material.userId === userId)
}

// Study Session Management Functions
export function addStudySession(session: StudySession) {
  tempStudySessions.push(session)
}

export function getStudySessionsByUser(userId: string): StudySession[] {
  return tempStudySessions.filter(session => session.userId === userId)
}

export function getStudySessionsByExam(examId: string): StudySession[] {
  return tempStudySessions.filter(session => session.examId === examId)
}

export function updateStudySession(sessionId: string, updates: Partial<StudySession>) {
  const sessionIndex = tempStudySessions.findIndex(session => session.id === sessionId)
  if (sessionIndex !== -1) {
    tempStudySessions[sessionIndex] = {
      ...tempStudySessions[sessionIndex],
      ...updates,
      updatedAt: new Date()
    }
    return tempStudySessions[sessionIndex]
  }
  return null
}

export function getUpcomingStudySessions(userId: string, days: number = 7): StudySession[] {
  const now = new Date()
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
  
  return tempStudySessions.filter(session => 
    session.userId === userId &&
    session.status === 'pending' &&
    session.scheduledDate >= now && 
    session.scheduledDate <= futureDate
  ).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
}

// Study Progress Management Functions
export function addStudyProgress(progress: StudyProgress) {
  tempStudyProgress.push(progress)
}

export function getStudyProgressByUserAndExam(userId: string, examId: string): StudyProgress | undefined {
  return tempStudyProgress.find(progress => 
    progress.userId === userId && progress.examId === examId
  )
}

export function updateStudyProgress(userId: string, examId: string, updates: Partial<StudyProgress>) {
  const progressIndex = tempStudyProgress.findIndex(progress => 
    progress.userId === userId && progress.examId === examId
  )
  
  if (progressIndex !== -1) {
    tempStudyProgress[progressIndex] = {
      ...tempStudyProgress[progressIndex],
      ...updates,
      lastUpdated: new Date()
    }
    return tempStudyProgress[progressIndex]
  }
  return null
}

// Academic Schedule Management Functions
export function addAcademicSchedule(schedule: AcademicSchedule) {
  tempAcademicSchedules.push(schedule)
}

export function getAcademicScheduleByUser(userId: string): AcademicSchedule | undefined {
  return tempAcademicSchedules.find(schedule => schedule.userId === userId)
}

export function updateAcademicSchedule(userId: string, updates: Partial<AcademicSchedule>) {
  const scheduleIndex = tempAcademicSchedules.findIndex(schedule => schedule.userId === userId)
  
  if (scheduleIndex !== -1) {
    tempAcademicSchedules[scheduleIndex] = {
      ...tempAcademicSchedules[scheduleIndex],
      ...updates
    }
    return tempAcademicSchedules[scheduleIndex]
  }
  return null
}

// Utility functions
export function generateSubjectColor(index: number): string {
  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'
  ]
  return colors[index % colors.length]
}

export function calculateStudyEffectiveness(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0
  
  const completedSessions = sessions.filter(s => s.completed && s.effectiveness)
  if (completedSessions.length === 0) return 0
  
  const totalEffectiveness = completedSessions.reduce((sum, s) => sum + (s.effectiveness || 0), 0)
  return Math.round(totalEffectiveness / completedSessions.length)
}

export function estimateStudyTime(material: StudyMaterial): number {
  // Estimación básica basada en tipo de material
  const baseTimeByType = {
    'pdf': 30, // 30 min por PDF
    'doc': 20, // 20 min por documento
    'image': 5, // 5 min por imagen
    'video': 1, // 1 min por min de video (asumiendo 1:1)
    'audio': 1, // 1 min por min de audio
    'link': 15 // 15 min por enlace
  }
  
  return baseTimeByType[material.type] || 20
}

// Initialize demo data
function initAcademicDemoData() {
  const demoUserId = "demo-student-fixed"
  
  if (tempSubjects.length === 0) {
    console.log("📚 Inicializando datos académicos demo...")
    
    // Demo subjects for 5th year student
    const demoSubjects: Subject[] = [
      {
        id: 'sub-1',
        name: 'Química Orgánica',
        code: 'QUI-501',
        semester: 1,
        bimester: 1,
        credits: 4,
        instructor: 'Dr. García',
        color: '#EF4444',
        description: 'Estudio de compuestos orgánicos y reacciones'
      },
      {
        id: 'sub-2',
        name: 'Matemáticas Aplicadas',
        code: 'MAT-502',
        semester: 1,
        bimester: 1,
        credits: 5,
        instructor: 'Prof. López',
        color: '#3B82F6',
        description: 'Cálculo diferencial e integral aplicado'
      },
      {
        id: 'sub-3',
        name: 'Física Nuclear',
        code: 'FIS-503',
        semester: 1,
        bimester: 1,
        credits: 4,
        instructor: 'Dr. Rodríguez',
        color: '#10B981',
        description: 'Principios de física nuclear y radiactividad'
      },
      {
        id: 'sub-4',
        name: 'Historia Argentina',
        code: 'HIS-504',
        semester: 1,
        bimester: 1,
        credits: 3,
        instructor: 'Prof. Martínez',
        color: '#8B5CF6',
        description: 'Historia argentina desde la independencia'
      },
      {
        id: 'sub-5',
        name: 'Biología Molecular',
        code: 'BIO-505',
        semester: 1,
        bimester: 1,
        credits: 4,
        instructor: 'Dra. Fernández',
        color: '#EC4899',
        description: 'Estructura y función de biomoléculas'
      }
    ]
    
    demoSubjects.forEach(subject => addSubject(subject))
    
    // Demo exams
    const now = new Date()
    const demoExams: Exam[] = [
      {
        id: 'exam-1',
        subjectId: 'sub-1',
        title: 'Examen Parcial - Reacciones Químicas',
        type: 'parcial',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // en 7 días
        duration: 120,
        topics: ['Reacciones de sustitución', 'Mecanismos de reacción', 'Catálisis'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'exam-2',
        subjectId: 'sub-2',
        title: 'Examen Final - Cálculo Integral',
        type: 'final',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // en 14 días
        duration: 180,
        topics: ['Integrales definidas', 'Aplicaciones del cálculo', 'Series'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'exam-3',
        subjectId: 'sub-3',
        title: 'Examen Parcial - Radiactividad',
        type: 'parcial',
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // en 10 días
        duration: 120,
        topics: ['Tipos de radiación', 'Decaimiento radioactivo', 'Aplicaciones'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'exam-4',
        subjectId: 'sub-5',
        title: 'Examen Parcial - ADN y ARN',
        type: 'parcial',
        date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // en 20 días
        duration: 120,
        topics: ['Estructura del ADN', 'Replicación', 'Transcripción'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    demoExams.forEach(exam => addExam(exam))
    
    // Demo study materials
    const demoMaterials: StudyMaterial[] = [
      {
        id: 'mat-1',
        subjectId: 'sub-1',
        examId: 'exam-1',
        userId: demoUserId,
        title: 'Apuntes Reacciones Orgánicas',
        type: 'pdf',
        url: '/demo/quimica-apuntes.pdf',
        uploadedAt: new Date(),
        size: 2048576,
        tags: ['reacciones', 'orgánica', 'mecanismos'],
        analyzed: true,
        keyTopics: ['Reacciones de sustitución nucleofílica', 'Eliminación', 'Adición'],
        difficulty: 'medium',
        estimatedStudyTime: 45
      },
      {
        id: 'mat-2',
        subjectId: 'sub-2',
        examId: 'exam-2',
        userId: demoUserId,
        title: 'Ejercicios Cálculo Integral',
        type: 'pdf',
        url: '/demo/calculo-ejercicios.pdf',
        uploadedAt: new Date(),
        size: 1536000,
        tags: ['integrales', 'cálculo', 'ejercicios'],
        analyzed: true,
        keyTopics: ['Integrales por partes', 'Sustitución trigonométrica', 'Aplicaciones'],
        difficulty: 'hard',
        estimatedStudyTime: 60
      }
    ]
    
    demoMaterials.forEach(material => addStudyMaterial(material))
    
    // Demo academic schedule
    const demoSchedule: AcademicSchedule = {
      id: 'schedule-1',
      userId: demoUserId,
      year: 2025,
      semester: 1,
      subjects: demoSubjects,
      exams: demoExams,
      personalEvents: [
        {
          id: 'event-1',
          title: 'Entrenamiento Fútbol',
          date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          duration: 120,
          type: 'extracurricular',
          recurring: {
            frequency: 'weekly',
            days: [2, 4] // Martes y Jueves
          }
        }
      ],
      preferences: {
        studyTimePreference: 'afternoon',
        dailyStudyHours: 3,
        weekendStudyHours: 5,
        breakDuration: 15,
        maxSessionDuration: 90
      }
    }
    
    addAcademicSchedule(demoSchedule)
    
    console.log("✅ Datos académicos demo inicializados")
  } else {
    console.log("✅ Datos académicos demo ya existen")
  }
}

// Initialize demo data on module load
initAcademicDemoData()