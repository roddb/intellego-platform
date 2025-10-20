/**
 * Email Notification System
 *
 * Sistema de notificaciones por email para el batch processing de feedback AI
 *
 * NOTA: Implementación actual usa logging a consola
 * TODO: Integrar con servicio real (Resend, SendGrid, etc.)
 */

export type BatchResultEmailData = {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ reportId: string; error: string }>;
  totalCost: number;
  latencyMs: number;
  triggeredBy: 'cron' | 'manual';
  criticalError?: boolean;
};

/**
 * Envía notificación de resultados de batch processing
 *
 * @param data - Datos del resultado del batch processing
 *
 * Implementación actual: Console logging
 * Producción: Descomentar integración con servicio de email
 */
export async function sendBatchResultEmail(data: BatchResultEmailData): Promise<void> {
  try {
    const timestamp = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    // Determinar asunto y emoji según resultado
    const emoji = data.criticalError ? '🚨' :
                  data.failed > 0 ? '⚠️' :
                  '✅';

    const subject = data.criticalError
      ? `${emoji} ERROR CRÍTICO en Auto-Feedback AI`
      : data.failed > 0
      ? `${emoji} Auto-Feedback AI: ${data.successful}/${data.total} exitosos (${data.failed} fallidos)`
      : `${emoji} Auto-Feedback AI: ${data.successful}/${data.total} procesados exitosamente`;

    // Construir cuerpo del email
    const body = `
================================================================================
                    REPORTE DE BATCH PROCESSING - FEEDBACK AI
================================================================================

Triggered by: ${data.triggeredBy === 'cron' ? '🤖 Cron Job Nocturno (Automático)' : '👤 Instructor (Manual)'}
Fecha: ${timestamp}

================================================================================
RESULTADOS
================================================================================

Total reportes procesados: ${data.total}
✅ Exitosos: ${data.successful}
❌ Fallidos: ${data.failed}
Tasa de éxito: ${((data.successful / data.total) * 100).toFixed(1)}%

================================================================================
MÉTRICAS
================================================================================

💰 Costo total: $${data.totalCost.toFixed(4)}
💵 Costo promedio: $${(data.totalCost / data.total).toFixed(6)} por reporte

⏱️ Tiempo total: ${(data.latencyMs / 1000).toFixed(1)}s (${(data.latencyMs / 1000 / 60).toFixed(1)} minutos)
⚡ Velocidad: ${(data.latencyMs / data.total / 1000).toFixed(1)}s por reporte

${data.failed > 0 ? `
================================================================================
ERRORES DETECTADOS
================================================================================

Se encontraron ${data.failed} error(es) durante el procesamiento:

${data.errors.map((e, idx) => `${idx + 1}. Reporte: ${e.reportId}
   Error: ${e.error}
`).join('\n')}

📋 ACCIÓN REQUERIDA:
- Revisar los reportes fallidos manualmente
- Verificar si es necesario re-procesar
- Contactar a soporte si el error persiste

` : ''}${data.criticalError ? `
================================================================================
⚠️⚠️⚠️ ERROR CRÍTICO DETECTADO ⚠️⚠️⚠️
================================================================================

El sistema de auto-feedback ha fallado completamente.

ACCIONES INMEDIATAS NECESARIAS:
1. Revisar logs del servidor inmediatamente
2. Verificar conectividad con Claude API
3. Verificar conectividad con base de datos
4. Verificar variables de entorno (ANTHROPIC_API_KEY)

El procesamiento automático puede estar comprometido.
Considere usar el sistema manual de backup mientras se resuelve.

` : ''}
================================================================================
INFORMACIÓN DEL SISTEMA
================================================================================

Endpoint: ${data.triggeredBy === 'cron' ? '/api/cron/auto-feedback' : '/api/instructor/feedback/batch-generate'}
Ambiente: Production
Plataforma: Intellego Platform
Sistema: Auto-Feedback AI con Claude Haiku 4.5

${data.triggeredBy === 'cron' ? `
Próxima ejecución: Mañana a las 02:00 ART
` : ''}
================================================================================

Este es un email automático del sistema de feedback AI.
No responder a este mensaje.

Para más información, revisar dashboard de instructor en:
https://intellego-platform.vercel.app/instructor/dashboard

================================================================================
    `.trim();

    // ======================================================================
    // LOGGING (Implementación actual)
    // ======================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL NOTIFICATION SENT (simulated)');
    console.log('='.repeat(80));
    console.log(`To: ${process.env.ADMIN_EMAIL || 'instructor@intellego.com'}`);
    console.log(`Subject: ${subject}`);
    console.log('='.repeat(80));
    console.log(body);
    console.log('='.repeat(80) + '\n');

    // ======================================================================
    // TODO: INTEGRACIÓN CON SERVICIO REAL
    // ======================================================================

    /*
    // OPCIÓN 1: Resend (Recomendado)
    // ------------------------------
    // npm install resend

    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Intellego Platform <noreply@intellego.com>',
      to: [process.env.ADMIN_EMAIL || 'instructor@intellego.com'],
      subject,
      text: body,
      // Opcional: HTML version
      // html: `<pre>${body}</pre>`
    });

    // OPCIÓN 2: SendGrid
    // ------------------
    // npm install @sendgrid/mail

    import sgMail from '@sendgrid/mail';
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    await sgMail.send({
      to: process.env.ADMIN_EMAIL || 'instructor@intellego.com',
      from: 'noreply@intellego.com',
      subject,
      text: body
    });

    // OPCIÓN 3: Nodemailer (SMTP genérico)
    // -------------------------------------
    // npm install nodemailer

    import nodemailer from 'nodemailer';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: 'Intellego Platform <noreply@intellego.com>',
      to: process.env.ADMIN_EMAIL || 'instructor@intellego.com',
      subject,
      text: body
    });
    */

  } catch (error: any) {
    console.error('❌ Error sending email notification:', error.message);

    // Email failures shouldn't break the batch process
    // Just log the error and continue
    console.error('⚠️ Batch processing succeeded but notification failed');
    console.error('   This is not critical - check email configuration');
  }
}

/**
 * Envía notificación de alerta crítica
 * Usado para errores que requieren atención inmediata
 *
 * @param title - Título de la alerta
 * @param message - Mensaje detallado
 * @param data - Datos adicionales opcionales
 */
export async function sendCriticalAlert(
  title: string,
  message: string,
  data?: any
): Promise<void> {
  await sendBatchResultEmail({
    total: 0,
    successful: 0,
    failed: 0,
    errors: [{ reportId: 'SYSTEM', error: message }],
    totalCost: 0,
    latencyMs: 0,
    triggeredBy: 'cron',
    criticalError: true
  });
}

/**
 * Formatea un mensaje de error para logging
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  return String(error);
}
