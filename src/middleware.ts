import { withAuth } from "next-auth/middleware"
import { NextRequest } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Security logging for protected routes
    if (pathname.startsWith("/dashboard/") || pathname.startsWith("/api/instructor/")) {
      console.log(`🔐 Security check: ${pathname}`)
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages when not authenticated
        if (pathname.startsWith("/auth/")) {
          return true
        }

        // Allow access to public routes and general API auth routes
        if (pathname === "/" || pathname.startsWith("/api/auth/") || pathname.startsWith("/api/health-check") || pathname.startsWith("/api/test-libsql")) {
          return true
        }

        // Require authentication for all other routes
        if (!token) {
          console.log(`❌ Unauthorized access attempt to: ${pathname}`)
          return false
        }

        // Role-based access control for instructor routes
        if (pathname.startsWith("/dashboard/instructor") || pathname.startsWith("/api/instructor/")) {
          const isInstructor = token.role === 'INSTRUCTOR'
          if (!isInstructor) {
            console.log(`❌ Non-instructor attempted access to instructor route: ${pathname} - User: ${token.email} - Role: ${token.role}`)
          }
          return isInstructor
        }

        // Role-based access control for student routes
        if (pathname.startsWith("/dashboard/student") || pathname.startsWith("/api/student/")) {
          const isStudent = token.role === 'STUDENT'
          if (!isStudent) {
            console.log(`❌ Non-student attempted access to student route: ${pathname} - User: ${token.email} - Role: ${token.role}`)
          }
          return isStudent
        }

        // Admin routes (future-proofing)
        if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin/")) {
          const isAdmin = token.role === 'ADMIN' || token.role === 'COORDINATOR'
          if (!isAdmin) {
            console.log(`❌ Non-admin attempted access to admin route: ${pathname} - User: ${token.email} - Role: ${token.role}`)
          }
          return isAdmin
        }

        // Default: require authentication for other protected routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes - must be excluded!)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}