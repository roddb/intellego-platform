import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixFeedbackStudentIds() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('Starting to fix feedback student IDs...');
    
    // Update feedbacks where studentId contains 'u_' (which means it's a userId)
    const result = await client.execute(`
      UPDATE Feedback 
      SET studentId = 'EST-2025-002'
      WHERE studentId = 'u_5inzfd9ncmdyhzank'
    `);
    
    console.log(`Updated ${result.rowsAffected} feedback records`);
    
    // Verify the update
    const verifyResult = await client.execute(`
      SELECT id, studentId, progressReportId, subject, weekStart 
      FROM Feedback 
      WHERE studentId = 'EST-2025-002'
    `);
    
    console.log('Verification - Feedbacks with corrected studentId:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.id}: ${row.subject} (Week: ${row.weekStart})`);
    });
    
    console.log('\nFix completed successfully!');
  } catch (error) {
    console.error('Error fixing feedback student IDs:', error);
  } finally {
    client.close();
  }
}

// Run the fix
fixFeedbackStudentIds();