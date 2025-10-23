import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Intellego Platform',
  description: 'Student progress management platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Providers>
          <SessionProvider session={session}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  )
}