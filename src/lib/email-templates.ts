/**
 * FASE 6: Professional Email Templates for Student Feedback
 * 
 * This module provides HTML and plain-text email templates for delivering
 * AI-generated feedback to students in the Intellego Platform.
 * 
 * Templates are designed with:
 * - Professional educational styling
 * - Mobile-responsive design
 * - Accessibility compliance
 * - Spanish language support
 * - Intellego Platform branding
 */

export interface EmailTemplateVariables {
  studentName: string;
  studentId: string;
  instructorName: string;
  subject: string;
  weekStart: string;
  weekEnd: string;
  progressScore: number;
  feedbackContent: string;
  achievements: string;
  improvements: string;
  recommendations: string;
  nextSteps: string;
  platformUrl: string;
  unsubscribeUrl?: string;
}

export interface EmailTemplate {
  name: string;
  version: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

/**
 * Main student feedback email template
 * Professional, educational design with clear hierarchy
 */
export const STUDENT_FEEDBACK_TEMPLATE: EmailTemplate = {
  name: 'student_feedback',
  version: 'v1.0',
  subject: 'Retroalimentación Semanal - {{subject}} - Semana del {{weekStart}}',
  variables: [
    'studentName', 'studentId', 'instructorName', 'subject', 
    'weekStart', 'weekEnd', 'progressScore', 'feedbackContent',
    'achievements', 'improvements', 'recommendations', 'nextSteps',
    'platformUrl', 'unsubscribeUrl'
  ],
  htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retroalimentación Semanal - Intellego Platform</title>
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Base styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
        }

        /* Container styles */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }

        /* Header styles */
        .header {
            background: linear-gradient(135deg, #0f766e, #14b8a6);
            color: white;
            padding: 32px 24px;
            text-align: center;
        }

        .header h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
        }

        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }

        /* Content styles */
        .content {
            padding: 32px 24px;
        }

        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
        }

        .info-card {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #14b8a6;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-weight: 600;
            color: #475569;
        }

        .info-value {
            color: #1e293b;
        }

        /* Progress score styles */
        .progress-section {
            text-align: center;
            margin: 32px 0;
            padding: 24px;
            background: linear-gradient(135deg, #fef3c7, #fbbf24);
            border-radius: 12px;
        }

        .progress-score {
            font-size: 48px;
            font-weight: 700;
            color: #92400e;
            margin: 0;
            line-height: 1;
        }

        .progress-label {
            font-size: 16px;
            color: #92400e;
            margin: 8px 0 0 0;
        }

        /* Feedback sections */
        .feedback-section {
            margin: 32px 0;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }

        .achievements {
            border-left: 4px solid #10b981;
            background-color: #ecfdf5;
        }

        .improvements {
            border-left: 4px solid #f59e0b;
            background-color: #fffbeb;
        }

        .recommendations {
            border-left: 4px solid #3b82f6;
            background-color: #eff6ff;
        }

        .next-steps {
            border-left: 4px solid #8b5cf6;
            background-color: #f5f3ff;
        }

        .feedback-content {
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        /* CTA section */
        .cta-section {
            text-align: center;
            margin: 32px 0;
            padding: 24px;
            background-color: #f8fafc;
            border-radius: 8px;
        }

        .cta-button {
            display: inline-block;
            padding: 12px 32px;
            background: linear-gradient(135deg, #0f766e, #14b8a6);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .cta-button:hover {
            background: linear-gradient(135deg, #0d5b5b, #0f9b96);
            transform: translateY(-2px);
        }

        /* Footer styles */
        .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }

        .footer a {
            color: #14b8a6;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px 16px;
            }
            
            .progress-score {
                font-size: 36px;
            }
            
            .info-row {
                flex-direction: column;
                gap: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>Intellego Platform</h1>
            <p>Retroalimentación de Progreso Académico</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="greeting">
                Hola {{studentName}},
            </div>

            <p>Tu instructor <strong>{{instructorName}}</strong> ha revisado tu reporte semanal y ha preparado retroalimentación personalizada para ayudarte en tu progreso académico.</p>

            <!-- Report Information -->
            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">Estudiante:</span>
                    <span class="info-value">{{studentName}} ({{studentId}})</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Materia:</span>
                    <span class="info-value">{{subject}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Período:</span>
                    <span class="info-value">{{weekStart}} - {{weekEnd}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Instructor:</span>
                    <span class="info-value">{{instructorName}}</span>
                </div>
            </div>

            <!-- Progress Score -->
            <div class="progress-section">
                <div class="progress-score">{{progressScore}}/4.0</div>
                <div class="progress-label">Puntaje de Progreso Semanal</div>
            </div>

            <!-- Achievements Section -->
            <div class="feedback-section">
                <div class="section-title">🎉 Logros de la Semana</div>
                <div class="feedback-content achievements">
                    {{achievements}}
                </div>
            </div>

            <!-- Areas for Improvement -->
            <div class="feedback-section">
                <div class="section-title">🎯 Áreas de Mejora</div>
                <div class="feedback-content improvements">
                    {{improvements}}
                </div>
            </div>

            <!-- Recommendations -->
            <div class="feedback-section">
                <div class="section-title">💡 Recomendaciones</div>
                <div class="feedback-content recommendations">
                    {{recommendations}}
                </div>
            </div>

            <!-- Next Steps -->
            <div class="feedback-section">
                <div class="section-title">🚀 Próximos Pasos</div>
                <div class="feedback-content next-steps">
                    {{nextSteps}}
                </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
                <p>Accede a tu dashboard para ver más detalles y herramientas de seguimiento:</p>
                <a href="{{platformUrl}}/dashboard/student" class="cta-button">
                    Ver Dashboard Completo
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                <strong>Intellego Platform</strong><br>
                Plataforma de Gestión de Progreso Estudiantil
            </p>
            <p>
                Este correo fue enviado porque estás registrado como estudiante en Intellego Platform.<br>
                Si tienes preguntas, contacta a tu instructor o al soporte técnico.
            </p>
            {{#if unsubscribeUrl}}
            <p>
                <a href="{{unsubscribeUrl}}">Configurar preferencias de notificaciones</a>
            </p>
            {{/if}}
        </div>
    </div>
</body>
</html>`,
  textContent: `
INTELLEGO PLATFORM - RETROALIMENTACIÓN SEMANAL
=============================================

Hola {{studentName}},

Tu instructor {{instructorName}} ha revisado tu reporte semanal y ha preparado retroalimentación personalizada para ayudarte en tu progreso académico.

INFORMACIÓN DEL REPORTE
-----------------------
Estudiante: {{studentName}} ({{studentId}})
Materia: {{subject}}
Período: {{weekStart}} - {{weekEnd}}
Instructor: {{instructorName}}

PUNTAJE DE PROGRESO
------------------
{{progressScore}}/4.0

LOGROS DE LA SEMANA 🎉
---------------------
{{achievements}}

ÁREAS DE MEJORA 🎯
------------------
{{improvements}}

RECOMENDACIONES 💡
------------------
{{recommendations}}

PRÓXIMOS PASOS 🚀
-----------------
{{nextSteps}}

ACCIONES RECOMENDADAS
--------------------
Accede a tu dashboard para ver más detalles y herramientas de seguimiento:
{{platformUrl}}/dashboard/student

---

INTELLEGO PLATFORM
Plataforma de Gestión de Progreso Estudiantil

Este correo fue enviado porque estás registrado como estudiante en Intellego Platform.
Si tienes preguntas, contacta a tu instructor o al soporte técnico.

{{#if unsubscribeUrl}}
Configurar preferencias: {{unsubscribeUrl}}
{{/if}}
`
};

/**
 * Email template for delivery notifications to instructors
 */
export const INSTRUCTOR_DELIVERY_NOTIFICATION: EmailTemplate = {
  name: 'instructor_delivery_notification',
  version: 'v1.0',
  subject: 'Feedback enviado exitosamente - {{studentName}} - {{subject}}',
  variables: [
    'instructorName', 'studentName', 'studentId', 'subject',
    'weekStart', 'weekEnd', 'sentAt', 'deliveryStatus', 'platformUrl'
  ],
  htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Entrega - Intellego Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
        }
        .info-grid {
            display: grid;
            gap: 8px;
            margin: 16px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
        }
        .label {
            font-weight: 600;
            color: #475569;
        }
        .cta {
            text-align: center;
            margin: 24px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #14b8a6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1 class="title">Feedback Enviado Exitosamente</h1>
        </div>
        
        <p>Hola {{instructorName}},</p>
        
        <p>Te confirmamos que el feedback para el estudiante ha sido enviado exitosamente.</p>
        
        <div class="info-grid">
            <div class="info-row">
                <span class="label">Estudiante:</span>
                <span>{{studentName}} ({{studentId}})</span>
            </div>
            <div class="info-row">
                <span class="label">Materia:</span>
                <span>{{subject}}</span>
            </div>
            <div class="info-row">
                <span class="label">Período:</span>
                <span>{{weekStart}} - {{weekEnd}}</span>
            </div>
            <div class="info-row">
                <span class="label">Enviado:</span>
                <span>{{sentAt}}</span>
            </div>
        </div>
        
        <div class="cta">
            <a href="{{platformUrl}}/dashboard/instructor" class="button">
                Ver Dashboard
            </a>
        </div>
    </div>
</body>
</html>`,
  textContent: `
INTELLEGO PLATFORM - NOTIFICACIÓN DE ENTREGA
============================================

Hola {{instructorName}},

Te confirmamos que el feedback para el estudiante ha sido enviado exitosamente.

DETALLES DEL ENVÍO:
------------------
Estudiante: {{studentName}} ({{studentId}})
Materia: {{subject}}
Período: {{weekStart}} - {{weekEnd}}
Enviado: {{sentAt}}

Dashboard: {{platformUrl}}/dashboard/instructor

Intellego Platform
`
};

/**
 * Template for email delivery failure notifications
 */
export const EMAIL_FAILURE_NOTIFICATION: EmailTemplate = {
  name: 'email_failure_notification',
  version: 'v1.0',
  subject: 'Error al enviar feedback - {{studentName}} - {{subject}}',
  variables: [
    'instructorName', 'studentName', 'studentId', 'subject',
    'weekStart', 'weekEnd', 'failureReason', 'retryCount', 'platformUrl'
  ],
  htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error de Entrega - Intellego Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #fecaca;
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #dc2626;
            margin: 0;
        }
        .error-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
        }
        .info-grid {
            display: grid;
            gap: 8px;
            margin: 16px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
        }
        .label {
            font-weight: 600;
            color: #475569;
        }
        .cta {
            text-align: center;
            margin: 24px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #dc2626;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="error-icon">⚠️</div>
            <h1 class="title">Error al Enviar Feedback</h1>
        </div>
        
        <p>Hola {{instructorName}},</p>
        
        <p>Hubo un problema al enviar el feedback al estudiante. El sistema intentará reenviar automáticamente.</p>
        
        <div class="error-box">
            <strong>Razón del fallo:</strong><br>
            {{failureReason}}
        </div>
        
        <div class="info-grid">
            <div class="info-row">
                <span class="label">Estudiante:</span>
                <span>{{studentName}} ({{studentId}})</span>
            </div>
            <div class="info-row">
                <span class="label">Materia:</span>
                <span>{{subject}}</span>
            </div>
            <div class="info-row">
                <span class="label">Período:</span>
                <span>{{weekStart}} - {{weekEnd}}</span>
            </div>
            <div class="info-row">
                <span class="label">Intentos:</span>
                <span>{{retryCount}}/3</span>
            </div>
        </div>
        
        <p>Si el problema persiste después de 3 intentos, por favor contacta al soporte técnico o intenta enviar el feedback manualmente desde el dashboard.</p>
        
        <div class="cta">
            <a href="{{platformUrl}}/dashboard/instructor" class="button">
                Ver Dashboard
            </a>
        </div>
    </div>
</body>
</html>`,
  textContent: `
INTELLEGO PLATFORM - ERROR DE ENTREGA
=====================================

Hola {{instructorName}},

Hubo un problema al enviar el feedback al estudiante. El sistema intentará reenviar automáticamente.

DETALLES DEL ERROR:
------------------
Estudiante: {{studentName}} ({{studentId}})
Materia: {{subject}}
Período: {{weekStart}} - {{weekEnd}}
Intentos: {{retryCount}}/3

Razón del fallo:
{{failureReason}}

Si el problema persiste después de 3 intentos, por favor contacta al soporte técnico o intenta enviar el feedback manualmente desde el dashboard.

Dashboard: {{platformUrl}}/dashboard/instructor

Intellego Platform
`
};

/**
 * Template variable replacement utility
 */
export function replaceTemplateVariables(
  template: string,
  variables: Partial<EmailTemplateVariables>
): string {
  let result = template;
  
  // Replace Handlebars-style variables {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
  });
  
  // Handle conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
    const value = variables[variable as keyof EmailTemplateVariables];
    return (value && value !== '' && value !== null && value !== undefined) ? content : '';
  });
  
  return result;
}

/**
 * Format date for display in emails
 */
export function formatEmailDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date and time for display in emails
 */
export function formatEmailDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get all available email templates
 */
export function getAllEmailTemplates(): EmailTemplate[] {
  return [
    STUDENT_FEEDBACK_TEMPLATE,
    INSTRUCTOR_DELIVERY_NOTIFICATION,
    EMAIL_FAILURE_NOTIFICATION
  ];
}

/**
 * Get email template by name
 */
export function getEmailTemplateByName(name: string): EmailTemplate | null {
  const templates = getAllEmailTemplates();
  return templates.find(t => t.name === name) || null;
}

/**
 * Initialize default email templates in database
 */
export async function initializeDefaultEmailTemplates() {
  const { upsertEmailTemplate } = await import('./db-operations');
  
  try {
    const templates = getAllEmailTemplates();
    
    for (const template of templates) {
      await upsertEmailTemplate({
        name: template.name,
        version: template.version,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables
      });
    }
    
    console.log('✅ Default email templates initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing default email templates:', error);
    throw error;
  }
}