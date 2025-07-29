import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// User management functions
export async function createUser(userData: {
  name: string
  email: string
  password: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  studentId?: string
  program?: string
  academicYear?: string
  enrollmentYear?: number
  phoneNumber?: string
  dateOfBirth?: Date
  address?: string
  emergencyContact?: any
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 12)
  
  return await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  })
}

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

export async function findUserByStudentId(studentId: string) {
  return await prisma.user.findUnique({
    where: { studentId },
  })
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function findUsersByRole(role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN') {
  return await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateUser(id: string, updates: any) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date(),
    },
  })
}

export async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
  })
}

// Weekly Reports / Progress Reports functions
export async function createProgressReport(data: {
  userId: string
  weekStart: Date
  weekEnd: Date
  responses: {
    temasYDominio: string
    evidenciaAprendizaje: string
    dificultadesEstrategias: string
    conexionesAplicacion: string
    comentariosAdicionales?: string
  }
}) {
  // First, ensure default questions exist
  await ensureDefaultQuestions()

  // Get all questions to create corresponding answers
  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })

  // Create the progress report
  const progressReport = await prisma.progressReport.create({
    data: {
      userId: data.userId,
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
    },
  })

  // Create answers for each question
  const questionMap = {
    'Temas y Dominio': data.responses.temasYDominio,
    'Evidencia de Aprendizaje': data.responses.evidenciaAprendizaje,
    'Dificultades y Estrategias': data.responses.dificultadesEstrategias,
    'Conexiones y Aplicación': data.responses.conexionesAplicacion,
    'Comentarios Adicionales': data.responses.comentariosAdicionales || '',
  }

  for (const question of questions) {
    const answer = questionMap[question.text as keyof typeof questionMap] || ''
    
    await prisma.answer.create({
      data: {
        questionId: question.id,
        progressReportId: progressReport.id,
        answer,
      },
    })
  }

  return progressReport
}

export async function findProgressReportsByUser(userId: string) {
  return await prisma.progressReport.findMany({
    where: { userId },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          studentId: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })
}

export async function findProgressReportByUserAndWeek(userId: string, weekStart: Date) {
  return await prisma.progressReport.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart,
      },
    },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
    },
  })
}

export async function getAllProgressReports() {
  return await prisma.progressReport.findMany({
    include: {
      answers: {
        include: {
          question: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          studentId: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })
}

// Questions management
export async function ensureDefaultQuestions() {
  const existingQuestions = await prisma.question.count()
  
  if (existingQuestions === 0) {
    const defaultQuestions = [
      {
        text: 'Temas y Dominio',
        type: 'TEXTAREA' as const,
        order: 1,
        required: true,
      },
      {
        text: 'Evidencia de Aprendizaje',
        type: 'TEXTAREA' as const,
        order: 2,
        required: true,
      },
      {
        text: 'Dificultades y Estrategias',
        type: 'TEXTAREA' as const,
        order: 3,
        required: true,
      },
      {
        text: 'Conexiones y Aplicación',
        type: 'TEXTAREA' as const,
        order: 4,
        required: true,
      },
      {
        text: 'Comentarios Adicionales',
        type: 'TEXTAREA' as const,
        order: 5,
        required: false,
      },
    ]

    for (const question of defaultQuestions) {
      await prisma.question.create({
        data: question,
      })
    }
  }
}

// Utility functions (same as temp-storage)
export function getCurrentWeekStart(): Date {
  const now = new Date()
  const monday = new Date(now)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
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

export async function canSubmitThisWeek(userId: string): Promise<boolean> {
  const weekStart = getCurrentWeekStart()
  const existingReport = await findProgressReportByUserAndWeek(userId, weekStart)
  return !existingReport
}

export function validateStudentId(studentId: string): boolean {
  const studentIdRegex = /^EST-\d{4}-\d{3}$/
  return studentIdRegex.test(studentId)
}

export async function generateStudentId(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const existingUsers = await prisma.user.findMany({
    where: {
      studentId: {
        startsWith: `EST-${currentYear}`,
      },
    },
    select: { studentId: true },
  })

  const existingIds = existingUsers
    .map(user => user.studentId!)
    .filter(Boolean)
    .sort()

  let nextNumber = 1
  if (existingIds.length > 0) {
    const lastId = existingIds[existingIds.length - 1]
    const lastNumber = parseInt(lastId.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `EST-${currentYear}-${nextNumber.toString().padStart(3, '0')}`
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

// Initialize default data
export async function initializeDefaultData() {
  try {
    // Check if demo users already exist
    const studentExists = await findUserByEmail('estudiante@demo.com')
    const instructorExists = await findUserByEmail('instructor@demo.com')
    
    if (!studentExists) {
      await createUser({
        name: 'Estudiante Demo',
        email: 'estudiante@demo.com',
        password: '123456',
        role: 'STUDENT',
        studentId: 'EST-2025-001',
        program: 'Ingeniería en Sistemas',
        academicYear: '2025-2026',
        enrollmentYear: 2025,
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('2000-01-01'),
        address: 'Demo Address 123',
        emergencyContact: {
          name: 'Contacto Demo',
          phone: '+0987654321',
          relationship: 'Padre'
        },
      })
      console.log('✅ Demo student created')
    }
    
    if (!instructorExists) {
      await createUser({
        name: 'Instructor Demo',
        email: 'instructor@demo.com',
        password: '123456',
        role: 'INSTRUCTOR',
        academicYear: '2025-2026',
        enrollmentYear: 2025,
      })
      console.log('✅ Demo instructor created')
    }

    // Initialize default questions
    await ensureDefaultQuestions()
    console.log('✅ Default questions ensured')

    // Create sample reports if needed
    if (studentExists) {
      await createSampleReports(studentExists.id)
    }
    
  } catch (error) {
    console.error('❌ Error initializing default data:', error)
  }
}

async function createSampleReports(userId: string) {
  const currentWeekStart = getCurrentWeekStart()
  
  // Check if sample reports already exist
  const existingReports = await findProgressReportsByUser(userId)
  if (existingReports.length > 0) {
    return // Sample reports already exist
  }

  // Previous week sample report
  const prevWeek = new Date(currentWeekStart)
  prevWeek.setDate(prevWeek.getDate() - 7)
  const prevWeekEnd = new Date(prevWeek)
  prevWeekEnd.setDate(prevWeekEnd.getDate() + 6)
  prevWeekEnd.setHours(23, 59, 59, 999)

  await createProgressReport({
    userId,
    weekStart: prevWeek,
    weekEnd: prevWeekEnd,
    responses: {
      temasYDominio: 'Esta semana trabajamos con JavaScript básico - Nivel 3: Domino funciones y arrays, y estoy aprendiendo objetos complejos.',
      evidenciaAprendizaje: 'Completé un proyecto de To-Do List usando JavaScript vanilla. Implementé funciones para agregar, editar y eliminar tareas usando arrays y objetos.',
      dificultadesEstrategias: 'Tuve dificultades con el manejo de eventos en JavaScript. Lo resolví practicando con ejemplos y consultando documentación de MDN.',
      conexionesAplicacion: 'Los conceptos de eventos se conectan con la interactividad en aplicaciones web. Puedo aplicarlo para crear interfaces más dinámicas.',
      comentariosAdicionales: 'Me siento más confiado con JavaScript. Quiero seguir practicando con proyectos más complejos.'
    }
  })

  console.log('✅ Sample reports created')
}