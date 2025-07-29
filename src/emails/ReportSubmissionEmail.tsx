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
  Img,
} from '@react-email/components'

interface ReportSubmissionEmailProps {
  studentName: string
  instructorName: string
  weekStart: string
  weekEnd: string
  submittedAt: string
  reportUrl: string
}

export default function ReportSubmissionEmail({
  studentName,
  instructorName,
  weekStart,
  weekEnd,
  submittedAt,
  reportUrl
}: ReportSubmissionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo reporte semanal de {studentName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>Intellego Platform</Text>
          </Section>

          <Section style={content}>
            <Text style={title}>
              📚 Nuevo Reporte Semanal Enviado
            </Text>

            <Text style={text}>
              Estimado/a {instructorName},
            </Text>

            <Text style={text}>
              El estudiante <strong>{studentName}</strong> ha enviado su reporte semanal 
              correspondiente al período del <strong>{weekStart}</strong> al <strong>{weekEnd}</strong>.
            </Text>

            <Section style={reportDetails}>
              <Text style={detailTitle}>Detalles del envío:</Text>
              <Text style={detail}>📅 Período: {weekStart} - {weekEnd}</Text>
              <Text style={detail}>👤 Estudiante: {studentName}</Text>
              <Text style={detail}>⏰ Enviado: {submittedAt}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={reportUrl}>
                Ver Reporte Completo
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Este es un correo automático de Intellego Platform. 
              Para revisar todos los reportes de tus estudiantes, accede a tu dashboard de instructor.
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

const reportDetails = {
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