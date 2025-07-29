"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <nav className={`bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Intellego Platform</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="text-sm text-slate-700">
                  <span className="font-medium">{session.user.name}</span>
                  {session.user.studentId && (
                    <span className="ml-2 text-slate-500">({session.user.studentId})</span>
                  )}
                </div>
                
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/signin"
                  className="text-sm py-2 px-4 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/auth/signup"
                  className="text-sm py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}