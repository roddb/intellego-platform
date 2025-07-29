import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { findUserById, tempUsers } from '@/lib/temp-storage'

// GET - Obtener perfil del estudiante
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Verificar que el usuario puede acceder a este perfil
    if (session.user.role !== 'INSTRUCTOR' && session.user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const user = findUserById(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Estructurar el perfil con valores por defecto
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      program: user.program || '',
      academicYear: user.academicYear || '',
      enrollmentYear: user.enrollmentYear,
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
      address: user.address || '',
      status: user.status || 'ACTIVE',
      image: user.image || '',
      emergencyContact: user.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReminders: true,
        progressReports: true,
        ...user.preferences
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar perfil del estudiante
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const userId = body.id

    // Verificar que el usuario puede actualizar este perfil
    if (session.user.role !== 'INSTRUCTOR' && session.user.id !== userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const userIndex = tempUsers.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Validaciones básicas
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingUser = tempUsers.find(user => user.email === body.email && user.id !== userId)
    if (existingUser) {
      return NextResponse.json({ error: 'Este email ya está en uso' }, { status: 400 })
    }

    // Actualizar los datos del usuario
    const updatedUser = {
      ...tempUsers[userIndex],
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber || '',
      program: body.program || '',
      academicYear: body.academicYear || '',
      enrollmentYear: body.enrollmentYear || undefined,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      address: body.address || '',
      image: body.image || '',
      emergencyContact: body.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      preferences: body.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReminders: true,
        progressReports: true
      },
      updatedAt: new Date()
    }

    tempUsers[userIndex] = updatedUser

    // Retornar el perfil actualizado en el mismo formato que GET
    const profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      studentId: updatedUser.studentId,
      program: updatedUser.program || '',
      academicYear: updatedUser.academicYear || '',
      enrollmentYear: updatedUser.enrollmentYear,
      phoneNumber: updatedUser.phoneNumber || '',
      dateOfBirth: updatedUser.dateOfBirth ? updatedUser.dateOfBirth.toISOString().split('T')[0] : '',
      address: updatedUser.address || '',
      status: updatedUser.status || 'ACTIVE',
      image: updatedUser.image || '',
      emergencyContact: updatedUser.emergencyContact,
      preferences: updatedUser.preferences
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}