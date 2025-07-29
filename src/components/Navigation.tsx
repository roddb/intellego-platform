"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"
import DynamicBreadcrumbs from "./DynamicBreadcrumbs"
import { useLayout } from "./layout/LayoutProvider"

interface NavigationProps {
  className?: string
}

export default function Navigation({ className }: NavigationProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toggleSidebar, sidebarOpen, setSidebarOpen } = useLayout()

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    // Home
    breadcrumbs.push({
      label: 'Inicio',
      href: '/',
      isActive: pathname === '/'
    })

    // Dashboard
    if (pathSegments.includes('dashboard')) {
      const dashboardType = session?.user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'
      breadcrumbs.push({
        label: session?.user?.role === 'INSTRUCTOR' ? 'Dashboard Instructor' : 'Dashboard Estudiante',
        href: `/dashboard/${dashboardType}`,
        isActive: pathname === `/dashboard/${dashboardType}`
      })
    }

    // Auth pages
    if (pathSegments.includes('auth')) {
      breadcrumbs.push({
        label: 'Autenticación',
        href: '/auth',
        isActive: false
      })

      if (pathSegments.includes('signin')) {
        breadcrumbs.push({
          label: 'Iniciar Sesión',
          href: '/auth/signin',
          isActive: pathname === '/auth/signin'
        })
      }

      if (pathSegments.includes('signup')) {
        breadcrumbs.push({
          label: 'Registrarse',
          href: '/auth/signup',
          isActive: pathname === '/auth/signup'
        })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav 
      className={`bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50 ${className}`}
      onClick={() => {
        if (sidebarOpen) {
          setSidebarOpen(false)
        }
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button - Moved to left side */}
            {session && pathname.includes('/dashboard') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSidebar()
                }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200 mr-2"
                title="Abrir panel de herramientas"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center border border-teal-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Intellego Platform</h1>
            </Link>

            {/* Quick Navigation Links */}
            {session && (
              <div className="hidden md:flex items-center gap-4 ml-8">
                {session.user.role === 'STUDENT' && (
                  <>
                    <Link 
                      href="/dashboard/student" 
                      className={`text-sm px-3 py-1 rounded-lg transition-colors duration-200 ${
                        pathname === '/dashboard/student' 
                          ? 'bg-teal-100 text-teal-800' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                
                {session.user.role === 'INSTRUCTOR' && (
                  <>
                    <Link 
                      href="/dashboard/instructor" 
                      className={`text-sm px-3 py-1 rounded-lg transition-colors duration-200 ${
                        pathname === '/dashboard/instructor' 
                          ? 'bg-teal-100 text-teal-800' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          
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
                  className="mac-button-secondary text-sm py-2 px-4"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/auth/signup"
                  className="mac-button-primary text-sm py-2 px-4"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Breadcrumbs */}
        <div className="text-slate-500">
          <DynamicBreadcrumbs />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden absolute right-4 top-4">
          <button className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}