import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Intellego Platform',
  description: 'Student progress management platform',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="es">
      <body className="min-h-screen">
        <SessionProvider session={session}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  )
}