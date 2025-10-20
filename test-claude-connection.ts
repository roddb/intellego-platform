/**
 * Script de validación de conexión con Claude Haiku 4.5
 *
 * Uso: npx tsx test-claude-connection.ts
 *
 * Este script valida:
 * - API Key configurada correctamente
 * - Cliente Claude funcional
 * - Primera llamada exitosa a la API
 * - Tokens reportados correctamente
 * - Latencia aceptable
 */

// IMPORTANTE: Cargar dotenv ANTES de importar cualquier módulo que use process.env
import dotenv from 'dotenv';
dotenv.config();

// Ahora sí importar el cliente (después de cargar .env)
import claudeClient from './src/services/ai/claude/client';

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Testing Claude Haiku 4.5 API Connection...');
  console.log('='.repeat(60) + '\n');

  // Verificar que la API key existe
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY no encontrada en .env');
    console.error('   Por favor agrega: ANTHROPIC_API_KEY=sk-ant-api03-...\n');
    process.exit(1);
  }

  console.log('✅ API Key encontrada en .env');
  console.log('📝 Configuración del cliente:');
  console.log('   Model: claude-haiku-4-5');
  console.log('   Temperature: 0.1');
  console.log('   Max tokens: 1500\n');

  // Test simple: solicitar confirmación de conexión
  console.log('🚀 Ejecutando primera llamada a Claude API...\n');

  const response = await claudeClient.createMessage({
    messages: [{
      role: 'user',
      content: 'Responde con exactamente: "Conexión exitosa"'
    }],
    max_tokens: 50
  });

  console.log('\n' + '-'.repeat(60));

  if (response.success) {
    console.log('✅ SUCCESS!');
    console.log('-'.repeat(60));
    console.log('\n📝 Respuesta de Claude:');
    console.log('   "' + response.content + '"');
    console.log('\n📊 Uso de tokens:');
    console.log('   Input:  ' + response.usage?.input_tokens + ' tokens');
    console.log('   Output: ' + response.usage?.output_tokens + ' tokens');
    console.log('\n⏱️  Performance:');
    console.log('   Latencia: ' + response.latency + 'ms');
    console.log('   Request ID: ' + response.requestId);

    // Calcular costo aproximado
    const inputCost = ((response.usage?.input_tokens ?? 0) / 1_000_000) * 1.00;
    const outputCost = ((response.usage?.output_tokens ?? 0) / 1_000_000) * 5.00;
    const totalCost = inputCost + outputCost;

    console.log('\n💰 Costo estimado:');
    console.log('   Input:  $' + inputCost.toFixed(6));
    console.log('   Output: $' + outputCost.toFixed(6));
    console.log('   Total:  $' + totalCost.toFixed(6));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Claude Haiku 4.5 está listo para usar!');
    console.log('='.repeat(60) + '\n');

    console.log('📋 Próximos pasos:');
    console.log('   1. La conexión está validada ✅');
    console.log('   2. Puedes eliminar este script: rm test-claude-connection.ts');
    console.log('   3. Continuar con Fase 2: Implementar analyzer.ts\n');

  } else {
    console.log('❌ FAILED!');
    console.log('-'.repeat(60));
    console.log('\n🔴 Error:');
    console.log('   Mensaje: ' + response.error?.message);
    console.log('   Status:  ' + (response.error?.status ?? 'N/A'));
    console.log('   Type:    ' + (response.error?.type ?? 'N/A'));

    console.log('\n' + '='.repeat(60));
    console.log('❌ Fix el error antes de continuar');
    console.log('='.repeat(60) + '\n');

    console.log('💡 Troubleshooting:');
    console.log('   - Verificar API Key en .env');
    console.log('   - Revisar créditos en console.anthropic.com');
    console.log('   - Verificar conexión a internet\n');

    process.exit(1);
  }
}

// Ejecutar test
testConnection().catch((error) => {
  console.error('\n❌ Error inesperado:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
});
