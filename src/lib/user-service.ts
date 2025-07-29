import { prisma } from './prisma'
import { User, UserRole, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

export interface CreateUserData {
  name: string
  email: string
  password?: string
  role: UserRole
  program?: string
  academicYear?: string
  enrollmentYear?: number
  phoneNumber?: string
  dateOfBirth?: Date
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  image?: string
}

export async function createUser(data: CreateUserData): Promise<User> {
  const hashedPassword = data.password ? await hash(data.password, 12) : null
  
  const studentId = data.role === 'STUDENT' ? await generateStudentId() : null
  
  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      studentId,
      program: data.program,
      academicYear: data.academicYear,
      enrollmentYear: data.enrollmentYear,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      emergencyContact: data.emergencyContact,
      image: data.image,
      status: 'ACTIVE'
    }
  })
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email }
  })
}

export async function findUserByStudentId(studentId: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { studentId }
  })
}

export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id }
  })
}

export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function findUsersByRole(role: UserRole): Promise<User[]> {
  return await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: 'desc' }
  })
}

export async function findUsersByProgram(program: string): Promise<User[]> {
  return await prisma.user.findMany({
    where: { program },
    orderBy: { createdAt: 'desc' }
  })
}

export async function findUsersByStatus(status: UserStatus): Promise<User[]> {
  return await prisma.user.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateUser(id: string, updates: Partial<CreateUserData>): Promise<User | null> {
  try {
    const updateData: any = { ...updates }
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hash(updateData.password, 12)
    }
    
    return await prisma.user.update({
      where: { id },
      data: updateData
    })
  } catch (error) {
    return null
  }
}

export async function deleteUser(id: string): Promise<User | null> {
  try {
    return await prisma.user.delete({
      where: { id }
    })
  } catch (error) {
    return null
  }
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
        startsWith: `EST-${currentYear}`
      }
    },
    orderBy: {
      studentId: 'desc'
    },
    take: 1
  })

  let nextNumber = 1
  if (existingUsers.length > 0 && existingUsers[0].studentId) {
    const lastNumber = parseInt(existingUsers[0].studentId.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `EST-${currentYear}-${nextNumber.toString().padStart(3, '0')}`
}