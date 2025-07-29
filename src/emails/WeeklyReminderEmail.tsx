import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from '@react-email/components'

interface WeeklyReminderEmailProps {
  studentName: string
  weekStart: string
  weekEnd: string
  daysLeft: number
  dashboardUrl: string
}

export default function WeeklyReminderEmail({
  studentName,
  weekStart,
  weekEnd,
  daysLeft,
  dashboardUrl
}: WeeklyReminderEmailProps) {
  const isUrgent = daysLeft <= 1

  return (
    <Html>
      <Head />
      <Preview>
        {isUrgent 
          ? `⚠️ Recordatorio urgente: Reporte semanal vence pronto`
          : `📝 Recordatorio: Reporte semanal pendiente`
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>Intellego Platform</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>
              {isUrgent ? '⚠️ Recordatorio Urgente' : '📝 Recordatorio Semanal'}
            </Text>

            <Text style={text}>
              Hola {studentName},
            </Text>

            <Text style={text}>
              {isUrgent 
                ? `Tu reporte semanal vence muy pronto. Solo tienes ${daysLeft === 0 ? 'hoy' : `${daysLeft} día${daysLeft === 1 ? '' : 's'}`} para enviarlo.`
                : `Te recordamos que tienes pendiente el envío de tu reporte semanal correspondiente al período del ${weekStart} al ${weekEnd}.`
              }
            </Text>

            <Section style={reminderDetails}>
              <Text style={detailTitle}>Detalles del reporte:</Text>
              <Text style={detail}>📅 Período: {weekStart} - {weekEnd}</Text>
              <Text style={detail}>
                ⏰ Tiempo restante: {
                  daysLeft === 0 
                    ? 'Vence hoy' 
                    : `${daysLeft} día${daysLeft === 1 ? '' : 's'}`
                }
              </Text>
              <Text style={detail}>📋 Estado: Pendiente de envío</Text>
            </Section>

            {isUrgent && (
              <Section style={urgentMessage}>
                <Text style={urgentText}>
                  ⚠️ No olvides que es importante mantener la consistencia en tus reportes semanales 
                  para un mejor seguimiento de tu progreso académico.
                </Text>
              </Section>
            )}

            <Section style={buttonContainer}>
              <Button style={isUrgent ? buttonUrgent : button} href={dashboardUrl}>
                Enviar Reporte Ahora
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Este es un recordatorio automático de Intellego Platform. 
              Si ya enviaste tu reporte, puedes ignorar este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  backgroundColor: '#14b8a6',
  padding: '24px',
  textAlign: 'center' as const,
}

const headerText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '32px',
}

const title = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const reminderDetails = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const detailTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const detail = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
}

const urgentMessage = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const urgentText = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '20px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#14b8a6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const buttonUrgent = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
}