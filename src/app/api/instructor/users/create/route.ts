import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createUser, generateStudentId } from '@/lib/db-operations';
import { z } from 'zod';

export const runtime = 'nodejs';

// Validation schema
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
  sede: z.string().optional(),
  academicYear: z.string().optional(),
  division: z.string().optional(),
  subjects: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Authorization check - only INSTRUCTOR and ADMIN can create users
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - instructor or admin access only' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Additional authorization: INSTRUCTOR cannot create ADMIN users
    if (session.user.role === 'INSTRUCTOR' && userData.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - instructors cannot create admin users' },
        { status: 403 }
      );
    }

    // Generate studentId automatically for STUDENT role
    let studentId: string | undefined = undefined;
    if (userData.role === 'STUDENT') {
      studentId = await generateStudentId();
      console.log('Generated student ID:', studentId);
    }

    // Convert subjects array to JSON string for database
    const subjectsString = userData.subjects
      ? JSON.stringify(userData.subjects)
      : undefined;

    // Create user in database
    const newUser = await createUser({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      studentId: studentId,
      sede: userData.sede,
      academicYear: userData.academicYear,
      division: userData.division,
      subjects: subjectsString,
    });

    // Check if user was created successfully
    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Log creation action for audit trail
    console.log(`User created by ${session.user.email}:`, {
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      newUserRole: newUser.role,
      createdBy: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser as any;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'User created successfully',
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating user:', error);

    if (error instanceof Error) {
      // Handle unique constraint violation (duplicate email)
      if (error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
