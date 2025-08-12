# FASE 6: Sistema de Notificaciones por Email - Guía de Implementación

## Resumen

FASE 6 implementa un sistema completo de notificaciones por email que permite a los instructores enviar retroalimentación personalizada de IA a los estudiantes mediante Gmail API. El sistema incluye:

- **Gmail API v1 Integration**: Envío profesional de emails
- **Email Templates**: Plantillas HTML responsivas y accesibles
- **Queue Management**: Sistema de colas con reintentos automáticos
- **Delivery Tracking**: Seguimiento completo de entregas
- **Instructor Interface**: Botones integrados para envío individual y masivo
- **Comprehensive Testing**: Suite de pruebas completa

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FASE 6: EMAIL SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────┐ │
│  │   Instructor    │    │   Gmail Service  │    │  Database  │ │
│  │   Dashboard     │───▶│   + Templates    │───▶│  Tracking  │ │
│  │                 │    │   + Queue Mgmt   │    │            │ │
│  └─────────────────┘    └──────────────────┘    └────────────┘ │
│           │                        │                           │
│           ▼                        ▼                           │
│  ┌─────────────────┐    ┌──────────────────┐                  │
│  │   Email APIs    │    │   Student Email  │                  │
│  │   - Send        │    │   Notification   │                  │
│  │   - Bulk        │    │                  │                  │
│  │   - Status      │    │                  │                  │
│  │   - Queue       │    │                  │                  │
│  └─────────────────┘    └──────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Implementados

### 1. **Database Schema** (`/src/lib/db-operations.ts`)
- `EmailDelivery` table: Tracking de emails enviados
- `EmailTemplate` table: Gestión de plantillas
- Operaciones CRUD completas
- Índices optimizados para rendimiento

### 2. **Gmail Service** (`/src/lib/gmail-service.ts`)
- OAuth 2.0 authentication
- Rate limiting inteligente
- Queue processing con exponential backoff
- Error handling profesional
- Bulk sending capabilities

### 3. **Email Templates** (`/src/lib/email-templates.ts`)
- HTML responsivo con diseño profesional
- Plain text fallbacks
- Variable replacement system
- Spanish language support
- Intellego Platform branding

### 4. **API Endpoints**
- `/api/email/send` - Envío individual
- `/api/email/send-bulk` - Envío masivo
- `/api/email/status` - Estado y reenvío
- `/api/email/queue` - Procesamiento de cola
- `/api/email/test` - Suite de pruebas

### 5. **Instructor Interface Integration**
- Botones "Enviar Email" en reportes aprobados
- Bulk email button para envío masivo
- Email status tracking
- Resend functionality
- Loading states y feedback visual

## Configuración Requerida

### 1. **Gmail API Setup**

#### Paso 1: Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Habilita la **Gmail API**
4. Configura OAuth2 consent screen
5. Crea credenciales OAuth 2.0

#### Paso 2: OAuth2 Credentials
Las credenciales ya están configuradas en `.env`:
```env
GOOGLE_CLIENT_ID="[CONFIGURED]"
GOOGLE_CLIENT_SECRET="[CONFIGURED]"
```

#### Paso 3: Obtener Refresh Token
**IMPORTANTE**: Necesitas obtener un refresh token para enviar emails.

**Opción A: Usando el sistema de testing integrado**
```javascript
// 1. Ejecuta el servidor
npm run dev

// 2. Ve a la consola del navegador en /dashboard/instructor
// 3. Ejecuta:
const service = new (await import('/src/lib/gmail-service.ts')).GmailService({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET
});

console.log('Autorización URL:', service.generateAuthUrl());
// Sigue el URL, autoriza, y obtén el código
// Luego intercambia por tokens:
const tokens = await service.getAccessToken('AUTHORIZATION_CODE_HERE');
console.log('Refresh Token:', tokens.refresh_token);
```

**Opción B: Script de configuración manual**
1. Crea `setup-gmail.js`:
```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'TU_CLIENT_ID',
  'TU_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('Ve a este URL y autoriza:', url);
```

#### Paso 4: Configurar Refresh Token
Agrega el refresh token a `.env`:
```env
GOOGLE_REFRESH_TOKEN="tu_refresh_token_aqui"
```

### 2. **Database Initialization**
El sistema inicializa automáticamente las tablas y plantillas:
```typescript
// Se ejecuta automáticamente en el primer uso
await initializeEmailTables();
await initializeDefaultEmailTemplates();
```

## Uso del Sistema

### 1. **Envío Individual**
```typescript
// Desde el dashboard del instructor
const sendEmail = async (reportId: string) => {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      reportId,
      priority: 'medium'
    })
  });
};
```

### 2. **Envío Masivo**
```typescript
// Enviar a todos los reportes aprobados
const sendBulkEmails = async (reportIds: string[]) => {
  const response = await fetch('/api/email/send-bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      reportIds,
      priority: 'medium'
    })
  });
};
```

### 3. **Seguimiento de Estado**
```typescript
// Ver estado de entrega
const checkStatus = async (reportId: string) => {
  const response = await fetch(`/api/email/status?reportId=${reportId}`);
  const data = await response.json();
  // data.deliveryRecords contiene el historial completo
};
```

### 4. **Procesamiento de Cola**
```typescript
// Procesar emails pendientes (automático o manual)
const processQueue = async () => {
  const response = await fetch('/api/email/queue', {
    method: 'POST'
  });
};
```

## Testing del Sistema

### 1. **Suite de Pruebas Integrada**
```typescript
// Test completo del sistema
const testResponse = await fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    testType: 'full-suite',
    testEmail: 'tu-email@ejemplo.com'
  })
});
```

### 2. **Tipos de Test Disponibles**
- `connectivity`: Test de conexión con Gmail API
- `template`: Renderizado de plantillas
- `send`: Envío real de email de prueba
- `database`: Operaciones de base de datos
- `full-suite`: Todos los tests

### 3. **Comandos de Testing Manual**
```bash
# En la consola del navegador (/dashboard/instructor)
// Test de conectividad
const result = await fetch('/api/email/test', {
  method: 'POST',
  body: JSON.stringify({ testType: 'connectivity' }),
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json());

console.log('Test Result:', result);
```

## Características del Sistema

### 1. **Plantillas Profesionales**
- Diseño responsivo y accesible
- Branding de Intellego Platform
- Soporte para variables dinámicas
- HTML + texto plano
- Optimizado para todos los clientes de email

### 2. **Queue Management**
- Reintentos automáticos con exponential backoff
- Rate limiting para respetar límites de Gmail API
- Priorización de emails (high/medium/low)
- Procesamiento en segundo plano
- Tracking completo de intentos

### 3. **Error Handling**
- Detección de errores temporales vs permanentes
- Mensajes de error descriptivos en español
- Logging comprehensivo
- Fallback mechanisms
- Notificaciones a instructores sobre fallos

### 4. **Security & Compliance**
- OAuth 2.0 authentication
- Secure credential management
- Data protection for student emails
- Audit trail completo
- Rate limiting contra abuso

## Monitoreo y Mantenimiento

### 1. **Logs del Sistema**
```bash
# Verifica logs del servidor
tail -f server.log | grep -E "(📧|❌|✅)"
```

### 2. **Estadísticas de Entrega**
```typescript
// API para estadísticas
const stats = await fetch('/api/email/send').then(r => r.json());
// Retorna: total, sent, failed, pending, bounced, avgDeliveryTimeMinutes
```

### 3. **Mantenimiento de Cola**
```typescript
// Limpiar emails fallidos permanentemente
await fetch('/api/email/queue?action=clear-failed', { method: 'DELETE' });

// Reset reintentos para emails fallidos
await fetch('/api/email/queue?action=reset-retries', { method: 'DELETE' });
```

## Limitaciones y Consideraciones

### 1. **Gmail API Limits**
- 1 billón de API calls per day (plenty for educational use)
- 250 quota units per user per 100 seconds
- Sistema implementa rate limiting automático

### 2. **Email Deliverability**
- Depende de la reputación del dominio Gmail autorizado
- Emails pueden ir a spam si el volumen es muy alto
- Recomendado: empezar con volumen bajo

### 3. **Costos**
- Gmail API es gratuita dentro de los límites
- Google Cloud Console puede requerir billing account para producción
- Monitorear usage en Google Cloud Console

## Troubleshooting

### 1. **"Gmail API connection failed"**
- Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
- Confirmar que Gmail API está habilitada
- Revisar OAuth consent screen configuration

### 2. **"No refresh token"**
- Seguir proceso de obtención de refresh token
- Asegurar que consent screen permite external users
- Usar `prompt: 'consent'` en authorization URL

### 3. **"Rate limit exceeded"**
- Sistema maneja automáticamente
- Verificar logs para excessive usage
- Considerar reducir frequencia de envíos

### 4. **"Email sending failed"**
- Revisar email addresses validity
- Confirmar feedback está approved
- Verificar template rendering

## Next Steps y Mejoras Futuras

### 1. **Posibles Mejoras**
- Email scheduling (envío programado)
- A/B testing de plantillas  
- Advanced analytics dashboard
- Integration con calendar para recordatorios
- Student email preferences management

### 2. **Escalabilidad**
- Background job processing con workers
- Email service switching (SendGrid, AWS SES)
- Distributed queue management
- CDN para assets de email

### 3. **Features Avanzados**
- Email read receipts tracking
- Interactive emails con AMP
- Automated follow-up sequences  
- Personalization engine
- Multi-language template support

## Conclusión

FASE 6 implementa un sistema de notificaciones por email completamente funcional y profesional que:

✅ **Envía emails automáticamente** cuando los instructores aprueban feedback  
✅ **Usa plantillas profesionales** con branding de Intellego Platform  
✅ **Maneja errores gracefully** con reintentos automáticos  
✅ **Proporciona tracking completo** de entregas  
✅ **Integra perfectamente** con el workflow existente  
✅ **Incluye testing comprehensivo** para garantizar calidad  

El sistema está listo para producción y puede manejar el volumen típico de una institución educativa. La implementación sigue best practices de seguridad, performance y user experience.

**IMPORTANTE**: Asegúrate de completar la configuración del refresh token antes de usar el sistema en producción.

---

**Desarrollado como parte del Intellego Platform - FASE 6: Sistema de Notificaciones**  
**Fecha**: Agosto 2025  
**Estado**: Implementación Completa ✅