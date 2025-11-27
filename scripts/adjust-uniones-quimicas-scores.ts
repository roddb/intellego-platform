import { db } from '../src/lib/db';

async function adjustScores() {
  try {
    console.log('🔧 Ajustando notas de Uniones Químicas...\n');

    // Ajustes específicos
    const specificAdjustments = [
      { name: 'Angelines Wu', newScore: 72, evalId: 'eval_df109907aa78db95' },
      { name: 'Francisco Amato', newScore: 60, evalId: 'eval_40e14a39724f466f' },
      { name: 'Violeta Legname', newScore: 66, evalId: 'eval_d5da3698c45b4c6f' }
    ];

    // Ajustes masivos (+15 puntos para usuarios 9-14)
    const massAdjustments = [
      { name: 'Ignacio Ortiz Gagliano', currentScore: 52, evalId: 'eval_336a37ca0d9d54f0' },
      { name: 'Isabella Fantin', currentScore: 52, evalId: 'eval_9225ee9af6cdd06e' },
      { name: 'Juan Bautista Medriano', currentScore: 58, evalId: 'eval_b81130c7582439ce' },
      { name: 'Lourdes Chouela', currentScore: 52, evalId: 'eval_099e874d0c50fafa' },
      { name: 'Sebastián José López Milano', currentScore: 52, evalId: 'eval_a0fead77aee11ba3' },
      { name: 'Paloma Castro', currentScore: 58, evalId: 'eval_48983bebff1b8211' }
    ];

    // Aplicar ajustes específicos
    console.log('📝 Ajustes específicos:');
    for (const adj of specificAdjustments) {
      await db().execute({
        sql: 'UPDATE Evaluation SET score = ? WHERE id = ?',
        args: [adj.newScore, adj.evalId]
      });
      console.log(`  ✅ ${adj.name}: → ${adj.newScore}/100`);
    }

    console.log('\n📝 Ajustes masivos (+15 puntos):');
    for (const adj of massAdjustments) {
      const newScore = adj.currentScore + 15;
      await db().execute({
        sql: 'UPDATE Evaluation SET score = ? WHERE id = ?',
        args: [newScore, adj.evalId]
      });
      console.log(`  ✅ ${adj.name}: ${adj.currentScore} → ${newScore}/100`);
    }

    // Verificar resultados
    console.log('\n🔍 Verificando actualizaciones...\n');
    const allEvals = await db().execute({
      sql: `
        SELECT
          u.name as studentName,
          e.score,
          e.id as evaluationId
        FROM Evaluation e
        JOIN User u ON e.studentId = u.id
        WHERE e.subject = 'Química 4to E'
          AND e.examTopic LIKE '%Uniones%'
          AND u.role = 'STUDENT'
        ORDER BY u.name ASC
      `,
      args: []
    });

    console.log('📊 Notas actualizadas:');
    for (const row of allEvals.rows as any[]) {
      console.log(`  ${row.studentName}: ${row.score}/100`);
    }

    // Calcular nuevo promedio
    const scores = (allEvals.rows as any[]).map((r: any) => r.score);
    const average = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
    console.log(`\n📈 Nuevo promedio del curso: ${average.toFixed(1)}/100`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

adjustScores();
