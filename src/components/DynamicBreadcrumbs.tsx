'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  isActive: boolean
}

interface DynamicBreadcrumbsProps {
  className?: string
}

export default function DynamicBreadcrumbs({ className = '' }: DynamicBreadcrumbsProps) {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment !== '')
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with home
    breadcrumbs.push({
      label: 'Inicio',
      href: '/',
      isActive: pathname === '/'
    })

    // Generate breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1

      let label = segment
      
      // Custom labels for known routes
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard'
          break
        case 'student':
          label = 'Estudiante'
          break
        case 'instructor':
          label = 'Instructor'
          break
        case 'auth':
          label = 'Autenticación'
          break
        case 'signin':
          label = 'Iniciar Sesión'
          break
        case 'signup':
          label = 'Registrarse'
          break
        case 'reports':
          label = 'Reportes'
          break
        case 'analytics':
          label = 'Analytics'
          break
        case 'settings':
          label = 'Configuración'
          break
        case 'profile':
          label = 'Perfil'
          break
        default:
          // Capitalize first letter and replace hyphens with spaces
          label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className={`breadcrumbs text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-base-content/40 mx-2" />
            )}
            
            {breadcrumb.isActive ? (
              <span className="flex items-center gap-1 text-base-content/60 font-medium">
                {index === 0 && <Home className="w-4 h-4" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="flex items-center gap-1 text-primary hover:text-primary-focus transition-colors"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}