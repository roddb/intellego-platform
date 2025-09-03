// Script to add sample skills metrics to production database
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function addSampleSkillsData() {
  try {
    // Get RDB@test.com user
    const userResult = await client.execute({
      sql: 'SELECT id FROM User WHERE email = ?',
      args: ['RDB@test.com']
    });
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const userId = userResult.rows[0].id as string;
    console.log('User ID:', userId);
    
    // Add sample feedback with skills metrics for Week 1 (August 4)
    const feedback1 = {
      id: `fb_${Date.now()}_1`,
      studentId: userId,
      studentName: 'RDB',
      studentEmail: 'RDB@test.com',
      weekStart: '2025-08-04T03:00:00.000Z',
      subject: 'Física',
      score: 85,
      generalComments: 'Excelente trabajo en los conceptos fundamentales de mecánica.',
      strengths: JSON.stringify([
        'Comprensión clara de las leyes de Newton',
        'Buena aplicación de fórmulas en problemas prácticos'
      ]),
      improvements: JSON.stringify([
        'Mejorar el análisis dimensional en problemas complejos',
        'Practicar más diagramas de cuerpo libre'
      ]),
      skillsMetrics: JSON.stringify({
        comprehension: 88,
        criticalThinking: 82,
        selfRegulation: 79,
        practicalApplication: 90,
        metacognition: 85
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructorId: 'instructor_001',
      instructorName: 'Prof. González',
      instructorEmail: 'gonzalez@intellego.com'
    };
    
    // Add sample feedback for Week 5 (August 25)
    const feedback2 = {
      id: `fb_${Date.now()}_2`,
      studentId: userId,
      studentName: 'RDB',
      studentEmail: 'RDB@test.com',
      weekStart: '2025-08-25T03:00:00.000Z',
      subject: 'Química',
      score: 92,
      generalComments: 'Mejora notable en el entendimiento de enlaces químicos.',
      strengths: JSON.stringify([
        'Excelente manejo de nomenclatura química',
        'Comprensión profunda de reacciones redox'
      ]),
      improvements: JSON.stringify([
        'Reforzar estequiometría en reacciones limitantes'
      ]),
      skillsMetrics: JSON.stringify({
        comprehension: 95,
        criticalThinking: 90,
        selfRegulation: 88,
        practicalApplication: 93,
        metacognition: 91
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      instructorId: 'instructor_002',
      instructorName: 'Prof. Martínez',
      instructorEmail: 'martinez@intellego.com'
    };
    
    // Insert feedback entries
    console.log('Inserting feedback for Week 1 (Física)...');
    await client.execute({
      sql: `INSERT OR REPLACE INTO Feedback (
        id, studentId, studentName, studentEmail, weekStart, subject,
        score, generalComments, strengths, improvements, skillsMetrics,
        createdAt, updatedAt, instructorId, instructorName, instructorEmail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        feedback1.id, feedback1.studentId, feedback1.studentName, feedback1.studentEmail,
        feedback1.weekStart, feedback1.subject, feedback1.score, feedback1.generalComments,
        feedback1.strengths, feedback1.improvements, feedback1.skillsMetrics,
        feedback1.createdAt, feedback1.updatedAt, feedback1.instructorId,
        feedback1.instructorName, feedback1.instructorEmail
      ]
    });
    
    console.log('Inserting feedback for Week 5 (Química)...');
    await client.execute({
      sql: `INSERT OR REPLACE INTO Feedback (
        id, studentId, studentName, studentEmail, weekStart, subject,
        score, generalComments, strengths, improvements, skillsMetrics,
        createdAt, updatedAt, instructorId, instructorName, instructorEmail
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        feedback2.id, feedback2.studentId, feedback2.studentName, feedback2.studentEmail,
        feedback2.weekStart, feedback2.subject, feedback2.score, feedback2.generalComments,
        feedback2.strengths, feedback2.improvements, feedback2.skillsMetrics,
        feedback2.createdAt, feedback2.updatedAt, feedback2.instructorId,
        feedback2.instructorName, feedback2.instructorEmail
      ]
    });
    
    console.log('Sample feedback with skills metrics added successfully!');
    
    // Verify the data
    const verifyResult = await client.execute({
      sql: 'SELECT subject, weekStart, score, skillsMetrics FROM Feedback WHERE studentId = ?',
      args: [userId]
    });
    
    console.log('\nVerification - Feedback entries:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.subject} (Week: ${new Date(row.weekStart as string).toLocaleDateString()}) - Score: ${row.score}`);
      if (row.skillsMetrics) {
        const metrics = JSON.parse(row.skillsMetrics as string);
        console.log('  Skills:', metrics);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
addSampleSkillsData();