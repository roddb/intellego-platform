// Script to add sample feedback with skills metrics
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function addSampleFeedback() {
  try {
    // First, find the progress reports for RDB@test.com
    const reportsResult = await client.execute({
      sql: `SELECT pr.id, pr.userId, pr.weekStart, pr.subject 
            FROM ProgressReport pr 
            JOIN User u ON pr.userId = u.id 
            WHERE u.email = ? 
            ORDER BY pr.weekStart`,
      args: ['RDB@test.com']
    });
    
    if (reportsResult.rows.length === 0) {
      console.log('No progress reports found for RDB@test.com');
      return;
    }
    
    console.log(`Found ${reportsResult.rows.length} progress reports`);
    
    for (const report of reportsResult.rows) {
      const skillsMetrics = {
        comprehension: 85 + Math.floor(Math.random() * 10),
        criticalThinking: 80 + Math.floor(Math.random() * 10),
        selfRegulation: 78 + Math.floor(Math.random() * 12),
        practicalApplication: 82 + Math.floor(Math.random() * 10),
        metacognition: 83 + Math.floor(Math.random() * 10)
      };
      
      const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Adding feedback for ${report.subject} (Week: ${new Date(report.weekStart as string).toLocaleDateString()})...`);
      
      await client.execute({
        sql: `INSERT OR REPLACE INTO Feedback (
          id, studentId, progressReportId, weekStart, subject,
          score, generalComments, strengths, improvements, skillsMetrics,
          createdBy, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          feedbackId,
          report.userId,
          report.id,
          report.weekStart,
          report.subject,
          Math.floor((Object.values(skillsMetrics).reduce((a, b) => a + b, 0) / 5)), // Average score
          `Buen trabajo en ${report.subject}. Tu progreso es consistente.`,
          JSON.stringify([
            'Comprensión clara de los conceptos fundamentales',
            'Buena aplicación práctica de la teoría'
          ]),
          JSON.stringify([
            'Profundizar en el análisis crítico',
            'Mejorar la autorregulación del aprendizaje'
          ]),
          JSON.stringify(skillsMetrics),
          '3d47c07d-3785-493a-b07b-ee34da1113b4', // Valid instructor ID from production
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });
      
      console.log(`✓ Feedback added with skills: ${JSON.stringify(skillsMetrics)}`);
    }
    
    console.log('\nAll sample feedback added successfully!');
    
    // Verify the feedback
    const verifyResult = await client.execute({
      sql: `SELECT f.subject, f.weekStart, f.score, f.skillsMetrics 
            FROM Feedback f 
            JOIN User u ON f.studentId = u.id 
            WHERE u.email = ?`,
      args: ['RDB@test.com']
    });
    
    console.log('\nVerification - Feedback entries with skills metrics:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.subject} (${new Date(row.weekStart as string).toLocaleDateString()}) - Score: ${row.score}`);
      if (row.skillsMetrics) {
        const metrics = JSON.parse(row.skillsMetrics as string);
        console.log(`  Skills: C:${metrics.comprehension} CT:${metrics.criticalThinking} SR:${metrics.selfRegulation} PA:${metrics.practicalApplication} M:${metrics.metacognition}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
addSampleFeedback();