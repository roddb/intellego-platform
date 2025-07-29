import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/providers/session-provider'
import LightParticles from '@/components/LightParticles'
import GradientOverlay from '@/components/GradientOverlay'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Intellego Platform',
  description: 'Student progress management platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="es">
      <body className="min-h-screen">
        <AuthProvider session={session}>
          <GradientOverlay />
          <LightParticles />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}