import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface ScoreUpdate {
  id: string;
  studentName: string;
  subject: string;
  oldScore: number;
  newScore: number;
}

async function updateExamScores() {
  console.log('🔄 Iniciando actualización de notas...\n');

  // Definir todas las actualizaciones necesarias
  const updates: ScoreUpdate[] = [
    // 5to A - Química (12 estudiantes)
    { id: 'eval_f4d7b503254d6643', studentName: 'Bianca Nazareth Picone', subject: 'Química 5to A', oldScore: 76, newScore: 86 },
    { id: 'eval_c69c0d86bbb53705', studentName: 'Candela Greco', subject: 'Química 5to A', oldScore: 59, newScore: 60 },
    { id: 'eval_3aebf27bdb07a53d', studentName: 'Catalina Varrente', subject: 'Química 5to A', oldScore: 72, newScore: 82 },
    { id: 'eval_2f4054d9c6fc2a24', studentName: 'Felipe Muttini Pagadizabal', subject: 'Química 5to A', oldScore: 64, newScore: 74 },
    { id: 'eval_9e77404dc94c6446', studentName: 'Helena Machado', subject: 'Química 5to A', oldScore: 77, newScore: 87 },
    { id: 'eval_4e3c0097c47edfde', studentName: 'Josefina Sesé Frers', subject: 'Química 5to A', oldScore: 64, newScore: 74 },
    { id: 'eval_e4e729b40a3bb972', studentName: 'Juan Pablo Oviedo Goite', subject: 'Química 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_7bfbe41be9d0a7da', studentName: 'Martina Yablonovich', subject: 'Química 5to A', oldScore: 69, newScore: 79 },
    { id: 'eval_f0ecb67d9973b30e', studentName: 'María Josefina Suarez', subject: 'Química 5to A', oldScore: 68, newScore: 78 },
    { id: 'eval_eca8150f857b6411', studentName: 'Nicolás Cartasegna', subject: 'Química 5to A', oldScore: 69, newScore: 79 },
    { id: 'eval_650c0885f9ac9257', studentName: 'Tiziana Zapozko', subject: 'Química 5to A', oldScore: 59, newScore: 60 },
    { id: 'eval_c421179aeab1975f', studentName: 'Tomas Garay', subject: 'Química 5to A', oldScore: 68, newScore: 78 },

    // 5to B - Química (15 estudiantes)
    { id: 'eval_bdcfa3d8eb223412', studentName: 'Agustina Sansalone', subject: 'Química 5to B', oldScore: 68, newScore: 78 },
    { id: 'eval_421ca14038cb5ec8', studentName: 'Andrés Francisco Ruffino', subject: 'Química 5to B', oldScore: 69, newScore: 79 },
    { id: 'eval_b8f3a54dc6d77e7b', studentName: 'Bautista Pergolesi', subject: 'Química 5to B', oldScore: 76, newScore: 86 },
    { id: 'eval_5e389182704c36b8', studentName: 'Constanza Mac Donald', subject: 'Química 5to B', oldScore: 71, newScore: 81 },
    { id: 'eval_169ad19267c5800d', studentName: 'Fabrizio Sabino', subject: 'Química 5to B', oldScore: 68, newScore: 78 },
    { id: 'eval_2faef0ef053e4fdb', studentName: 'Milagros Zacharec', subject: 'Química 5to B', oldScore: 64, newScore: 74 },
    { id: 'eval_eedc9616f8666808', studentName: 'Paulina Caviglia', subject: 'Química 5to B', oldScore: 61, newScore: 71 },
    { id: 'eval_59676407f44249f4', studentName: 'Sofia Veliz', subject: 'Química 5to B', oldScore: 65, newScore: 75 },
    { id: 'eval_3c4741461d44bb54', studentName: 'Sofía Arévalo', subject: 'Química 5to B', oldScore: 59, newScore: 60 },
    { id: 'eval_ab5dd32245086cba', studentName: 'Sol María Forlano', subject: 'Química 5to B', oldScore: 66, newScore: 76 },
    { id: 'eval_2aa016985c4baec0', studentName: 'Victoria lavarello', subject: 'Química 5to B', oldScore: 59, newScore: 60 },
    { id: 'eval_341b51d54ef75763', studentName: 'agustina trillo', subject: 'Química 5to B', oldScore: 63, newScore: 73 },
    { id: 'eval_ce8f70e7db903ff0', studentName: 'juana giurovich', subject: 'Química 5to B', oldScore: 68, newScore: 78 },
    { id: 'eval_c0498df0d28d90aa', studentName: 'maria sanz', subject: 'Química 5to B', oldScore: 50, newScore: 60 },
    { id: 'eval_5e44ec235c83858a', studentName: 'victoria cerredo', subject: 'Química 5to B', oldScore: 64, newScore: 74 },

    // 5to A - Física (10 estudiantes)
    { id: 'eval_67e1433e7b2d10d5', studentName: 'Bianca Nazareth Picone', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_47b870cbfaddc097', studentName: 'Helena Machado', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_44ab2bdc7d64c74f', studentName: 'Josefina Sesé Frers', subject: 'Física 5to A', oldScore: 68, newScore: 78 },
    { id: 'eval_96560cf5638506ec', studentName: 'Josefina Verdier', subject: 'Física 5to A', oldScore: 62, newScore: 72 },
    { id: 'eval_39e3638d06ba6426', studentName: 'Juan Pablo Oviedo Goite', subject: 'Física 5to A', oldScore: 59, newScore: 60 },
    { id: 'eval_4a3aa9ab34515d48', studentName: 'Martina Yablonovich', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_5edc5a45de55b47d', studentName: 'María Josefina Suarez', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_841fde62f69153fb', studentName: 'Tiziana Zapozko', subject: 'Física 5to A', oldScore: 62, newScore: 72 },
    { id: 'eval_1bf75a0544729a99', studentName: 'Tomas Garay', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
    { id: 'eval_2be42a587d69768e', studentName: 'Victoria Patiño', subject: 'Física 5to A', oldScore: 65, newScore: 75 },
  ];

  let successCount = 0;
  let errorCount = 0;

  // Ejecutar actualizaciones en transacción
  try {
    for (const update of updates) {
      try {
        // Verificar nota actual antes de actualizar
        const current = await db.execute({
          sql: 'SELECT score FROM Evaluation WHERE id = ?',
          args: [update.id]
        });

        if (current.rows.length === 0) {
          console.log(`❌ No se encontró la evaluación ${update.id} para ${update.studentName}`);
          errorCount++;
          continue;
        }

        const currentScore = current.rows[0].score as number;

        if (currentScore !== update.oldScore) {
          console.log(`⚠️  ADVERTENCIA: ${update.studentName} - Nota actual (${currentScore}) no coincide con la esperada (${update.oldScore})`);
        }

        // Actualizar la nota
        await db.execute({
          sql: `UPDATE Evaluation
                SET score = ?,
                    updatedAt = datetime('now')
                WHERE id = ?`,
          args: [update.newScore, update.id]
        });

        console.log(`✅ ${update.studentName} (${update.subject}): ${update.oldScore} → ${update.newScore}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error actualizando ${update.studentName}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de actualización:');
    console.log(`   ✅ Exitosas: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total: ${updates.length}`);

  } catch (error) {
    console.error('❌ Error general en la actualización:', error);
    throw error;
  }
}

// Ejecutar script
updateExamScores()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
