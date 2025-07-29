import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // You can add custom logic here if needed
    console.log("Middleware executing for:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages when not authenticated
        if (pathname.startsWith("/auth/")) {
          return true
        }

        // Require authentication for dashboard routes
        if (pathname.startsWith("/dashboard/")) {
          return !!token
        }

        // Allow access to public routes
        if (pathname === "/" || pathname.startsWith("/api/auth/")) {
          return true
        }

        // Default: require authentication for other protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}