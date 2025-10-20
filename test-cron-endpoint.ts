/**
 * Test del Cron Endpoint - Auto Feedback
 *
 * Simula una llamada al endpoint del cron job para validar:
 * - Autenticación con CRON_SECRET
 * - Procesamiento de reportes pendientes
 * - Email notifications
 * - Manejo de errores
 *
 * NOTA: Este script simula la llamada que haría Vercel Cron Scheduler
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Test del Cron Endpoint - Auto Feedback\n');
console.log('=' .repeat(80));

async function testCronEndpoint() {
  try {
    // Verificar que CRON_SECRET esté configurado
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('\n❌ ERROR: CRON_SECRET no está configurado en .env');
      console.error('   Agrega CRON_SECRET="tu-secret-aqui" al archivo .env');
      return;
    }

    console.log('\n✅ CRON_SECRET configurado');
    console.log(`   Value: ${cronSecret.substring(0, 10)}...${cronSecret.substring(cronSecret.length - 5)}`);

    // Construir URL del endpoint
    // En local: http://localhost:3000/api/cron/auto-feedback
    // En producción: https://intellego-platform.vercel.app/api/cron/auto-feedback
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/cron/auto-feedback`;

    console.log(`\n📍 Testing endpoint: ${url}`);
    console.log('   Method: GET');
    console.log('   Auth: Bearer token');

    // ========================================================================
    // TEST 1: Intentar sin autenticación (debe fallar)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 1: Sin autenticación (debe retornar 401)');
    console.log('='.repeat(80));

    try {
      const response1 = await fetch(url, {
        method: 'GET'
      });

      console.log(`Status: ${response1.status}`);
      const data1 = await response1.json();
      console.log('Response:', JSON.stringify(data1, null, 2));

      if (response1.status === 401) {
        console.log('✅ Test 1 PASSED: Correctamente rechaza sin autenticación');
      } else {
        console.log('❌ Test 1 FAILED: Debería retornar 401');
      }
    } catch (error: any) {
      console.log(`⚠️ Test 1 ERROR: ${error.message}`);
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.log('\n💡 NOTA: El servidor Next.js no está corriendo');
        console.log('   Para testear localmente, ejecuta:');
        console.log('   1. npm run dev (en otra terminal)');
        console.log('   2. Vuelve a ejecutar este script\n');
        return;
      }
    }

    // ========================================================================
    // TEST 2: Con autenticación incorrecta (debe fallar)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 2: Con autenticación incorrecta (debe retornar 401)');
    console.log('='.repeat(80));

    try {
      const response2 = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer wrong-secret'
        }
      });

      console.log(`Status: ${response2.status}`);
      const data2 = await response2.json();
      console.log('Response:', JSON.stringify(data2, null, 2));

      if (response2.status === 401) {
        console.log('✅ Test 2 PASSED: Correctamente rechaza autenticación incorrecta');
      } else {
        console.log('❌ Test 2 FAILED: Debería retornar 401');
      }
    } catch (error: any) {
      console.log(`⚠️ Test 2 ERROR: ${error.message}`);
    }

    // ========================================================================
    // TEST 3: Con autenticación correcta (debe procesar)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST 3: Con autenticación correcta (debe procesar reportes)');
    console.log('='.repeat(80));

    try {
      console.log('\n🚀 Ejecutando cron job...');
      console.log('   (Esto puede tardar varios minutos si hay muchos reportes pendientes)\n');

      const startTime = Date.now();

      const response3 = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`
        }
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`\nStatus: ${response3.status}`);
      console.log(`Duration: ${duration.toFixed(1)}s`);

      const data3 = await response3.json();
      console.log('\nResponse:', JSON.stringify(data3, null, 2));

      if (response3.status === 200) {
        console.log('\n✅ Test 3 PASSED: Cron job ejecutado correctamente');

        if (data3.result) {
          console.log('\n📊 Resultados del procesamiento:');
          console.log(`   Total: ${data3.result.total}`);
          console.log(`   ✅ Exitosos: ${data3.result.successful}`);
          console.log(`   ❌ Fallidos: ${data3.result.failed}`);
          console.log(`   💰 Costo total: $${data3.result.totalCost?.toFixed(4) || '0.0000'}`);
          console.log(`   ⏱️ Tiempo total: ${(data3.result.totalTimeMs / 1000).toFixed(1)}s`);

          if (data3.result.failed > 0) {
            console.log('\n⚠️ Reportes fallidos:');
            data3.result.failedReports?.forEach((id: string) => {
              console.log(`   - ${id}`);
            });
          }
        }
      } else {
        console.log('❌ Test 3 FAILED: Cron job falló');
      }
    } catch (error: any) {
      console.log(`❌ Test 3 ERROR: ${error.message}`);
      console.log('Stack:', error.stack);
    }

    // ========================================================================
    // RESUMEN
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('RESUMEN DEL TESTING');
    console.log('='.repeat(80));
    console.log('\n✅ Tests completados');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Si todos los tests pasaron, el endpoint está listo');
    console.log('   2. Hacer commit y push para deploy');
    console.log('   3. Configurar CRON_SECRET en Vercel Dashboard');
    console.log('   4. El cron se ejecutará automáticamente a las 2 AM ART');
    console.log('\n💡 Para testing manual en producción:');
    console.log(`   curl -X GET https://intellego-platform.vercel.app/api/cron/auto-feedback \\`);
    console.log(`     -H "Authorization: Bearer ${cronSecret.substring(0, 10)}..."`);
    console.log('='.repeat(80) + '\n');

  } catch (error: any) {
    console.error('\n❌ ERROR EN EL TEST:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Ejecutar test
testCronEndpoint()
  .then(() => {
    console.log('✅ Script de test finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ El test falló:', error);
    process.exit(1);
  });
