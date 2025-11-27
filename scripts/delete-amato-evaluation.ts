import { db } from '../src/lib/db';

async function deleteEvaluation() {
  try {
    console.log('🗑️  Eliminando evaluación de Amato (Uniones Químicas)...');

    const result = await db().execute({
      sql: 'DELETE FROM Evaluation WHERE id = ?',
      args: ['eval_f223181f01d89fb4']
    });

    console.log('✅ Evaluación eliminada exitosamente');
    console.log('Rows affected:', result.rowsAffected);

    // Verificar
    const check = await db().execute({
      sql: 'SELECT COUNT(*) as count FROM Evaluation WHERE id = ?',
      args: ['eval_f223181f01d89fb4']
    });

    console.log('Verificación - Count después del delete:', check.rows[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteEvaluation();
