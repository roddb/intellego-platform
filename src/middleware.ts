import { auth } from "@/lib/auth"
import { NextResponse } from 'next/server'

// Export the auth middleware directly
export default auth((req) => {
  const pathname = req.nextUrl.pathname
  const isAuthenticated = !!req.auth

  console.log(`🔍 Middleware: ${pathname} - Authenticated: ${isAuthenticated}`)

  // Allow all API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Allow auth pages
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }
  
  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }
  
  // Allow test-password page for testing
  if (pathname === '/test-password') {
    console.log('🧪 TESTING MODE: Allowing access to /test-password')
    return NextResponse.next()
  }
  
  // Protect dashboard routes - redirect to signin if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log('🔒 Redirecting unauthenticated user to signin')
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Allow instructors to access student dashboard when impersonating
    if (pathname.startsWith('/dashboard/student')) {
      const isInstructor = req.auth?.user?.role === 'INSTRUCTOR'
      const isImpersonating = req.auth?.user?.isImpersonating === true
      const isStudent = req.auth?.user?.role === 'STUDENT'

      if (!isStudent && (!isInstructor || !isImpersonating)) {
        console.log('🔒 Non-student attempted to access student dashboard without impersonation')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }
  
  // Protect instructor routes
  if (pathname.startsWith('/instructor')) {
    if (!isAuthenticated) {
      console.log('🔒 Redirecting unauthenticated user to signin')
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Check if user has instructor role
    if (req.auth?.user?.role !== 'INSTRUCTOR') {
      console.log('🔒 Non-instructor user attempted to access instructor route')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}