import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fix feedback student IDs...');
    
    // First check current state
    const beforeResult = await query(`
      SELECT COUNT(*) as count 
      FROM Feedback 
      WHERE studentId = 'u_5inzfd9ncmdyhzank'
    `);
    
    const countBefore = beforeResult.rows[0]?.count || 0;
    console.log(`Found ${countBefore} feedbacks to fix`);
    
    if (countBefore > 0) {
      // Update feedbacks where studentId contains userId instead of studentId
      const result = await execute(`
        UPDATE Feedback 
        SET studentId = 'EST-2025-002'
        WHERE studentId = 'u_5inzfd9ncmdyhzank'
      `);
      
      console.log(`Update executed`);
    }
    
    // Verify the update
    const verifyResult = await query(`
      SELECT id, studentId, progressReportId, subject, weekStart 
      FROM Feedback 
      WHERE studentId = 'EST-2025-002'
      ORDER BY weekStart
    `);
    
    const feedbacks = verifyResult.rows.map((row: any) => ({
      id: row.id,
      studentId: row.studentId,
      progressReportId: row.progressReportId,
      subject: row.subject,
      weekStart: row.weekStart
    }));
    
    return NextResponse.json({
      success: true,
      fixed: countBefore,
      totalFeedbacks: feedbacks.length,
      feedbacks: feedbacks,
      message: `Successfully fixed ${countBefore} feedback records. Total feedbacks for EST-2025-002: ${feedbacks.length}`
    });
    
  } catch (error) {
    console.error('Error fixing feedback student IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fix feedback student IDs', details: String(error) },
      { status: 500 }
    );
  }
}