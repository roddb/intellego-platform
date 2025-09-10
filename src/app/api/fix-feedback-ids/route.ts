import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all feedback records with user IDs instead of student IDs
    const feedbackRecords = await query(`
      SELECT f.id, f.studentId, u.studentId as correctStudentId, u.name, u.email
      FROM Feedback f
      JOIN User u ON f.studentId = u.id
      WHERE f.studentId NOT LIKE 'EST-%'
    `);

    console.log('Found feedback records to fix:', feedbackRecords.rows.length);

    let fixedCount = 0;
    
    for (const record of feedbackRecords.rows) {
      if (record.correctStudentId) {
        console.log(`Fixing feedback ${record.id}: ${record.studentId} -> ${record.correctStudentId}`);
        
        await query(`
          UPDATE Feedback 
          SET studentId = ? 
          WHERE id = ?
        `, [record.correctStudentId, record.id]);
        
        fixedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${fixedCount} feedback records`,
      details: feedbackRecords.rows.map(r => ({
        feedbackId: r.id,
        from: r.studentId,
        to: r.correctStudentId,
        user: r.name
      }))
    });

  } catch (error) {
    console.error('Error fixing feedback IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fix feedback IDs' },
      { status: 500 }
    );
  }
}