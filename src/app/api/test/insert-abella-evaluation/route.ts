import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createEvaluation } from '@/lib/db-operations';

// Temporary endpoint for testing - INSERT Abella evaluation for RDB user
export async function POST() {
  try {
    // Read the Abella markdown file
    const filePath = join(process.cwd(), 'Retroalimentaciones 4to C', 'Abella_Martin_retroalimentacion_17092025.md');
    const feedback = await readFile(filePath, 'utf-8');

    const result = await createEvaluation({
      studentId: 'u_5inzfd9ncmdyhzank', // RDB test user
      subject: 'Física',
      examDate: '2025-09-02', // From file content: 2/9/2025
      examTopic: 'Tiro Oblicuo',
      score: 58, // Extracted from markdown
      feedback,
      createdBy: '3d47c07d-3785-493a-b07b-ee34da1113b4' // Instructor ID
    });

    return NextResponse.json({
      success: true,
      evaluationId: result.id,
      message: 'Abella evaluation inserted successfully for RDB@test.com',
      data: {
        student: 'RDB@test.com',
        subject: 'Física',
        examTopic: 'Tiro Oblicuo',
        score: 58,
        examDate: '2025-09-02'
      }
    });
  } catch (error) {
    console.error('Error creating Abella evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
