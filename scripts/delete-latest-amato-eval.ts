import { db } from '../src/lib/db';

async function deleteLatestEvaluation() {
  try {
    console.log('🔍 Buscando última evaluación de Amato...');

    // Find latest evaluation
    const findResult = await db().execute({
      sql: `SELECT id, subject, examTopic, score, createdAt
            FROM Evaluation
            WHERE studentId = (SELECT id FROM User WHERE email = 'fran.amato09@gmail.com')
            ORDER BY createdAt DESC
            LIMIT 1`,
      args: []
    });

    if (findResult.rows.length === 0) {
      console.log('ℹ️  No se encontraron evaluaciones de Amato');
      process.exit(0);
    }

    const evaluation = findResult.rows[0] as any;
    console.log('📄 Evaluación encontrada:', {
      id: evaluation.id,
      subject: evaluation.subject,
      examTopic: evaluation.examTopic,
      score: evaluation.score,
      createdAt: evaluation.createdAt
    });

    console.log('🗑️  Eliminando evaluación...');

    const deleteResult = await db().execute({
      sql: 'DELETE FROM Evaluation WHERE id = ?',
      args: [evaluation.id]
    });

    console.log('✅ Evaluación eliminada exitosamente');
    console.log('Rows affected:', deleteResult.rowsAffected);

    // Verificar
    const checkResult = await db().execute({
      sql: 'SELECT COUNT(*) as count FROM Evaluation WHERE id = ?',
      args: [evaluation.id]
    });

    console.log('Verificación - Count después del delete:', checkResult.rows[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteLatestEvaluation();
