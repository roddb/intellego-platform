import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { validateUserPassword } from "./db-operations"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Validate user credentials using database
        const user = await validateUserPassword(credentials.email, credentials.password)

        if (!user) {
          return null
        }

        return {
          id: String(user.id),
          email: String(user.email),
          name: String(user.name),
          role: String(user.role),
          studentId: user.studentId ? String(user.studentId) : undefined,
          sede: user.sede ? String(user.sede) : undefined,
          academicYear: user.academicYear ? String(user.academicYear) : undefined,
          division: user.division ? String(user.division) : undefined,
          subjects: user.subjects ? String(user.subjects) : undefined,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (reasonable for educational platform)
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Set user data on first sign in
      if (user) {
        token.role = user.role
        token.studentId = user.studentId
        token.sede = user.sede
        token.academicYear = user.academicYear
        token.division = user.division
        token.subjects = user.subjects
        token.lastActivity = Date.now()
      }
      
      // Check token expiration and activity
      const now = Date.now()
      const maxInactivity = 4 * 60 * 60 * 1000 // 4 hours of inactivity
      
      if (token.lastActivity && (now - (token.lastActivity as number)) > maxInactivity) {
        console.log(`🔒 Token expired due to inactivity - User: ${token.email}`)
        // Return a minimal token that will cause re-authentication
        return { expired: true } as any
      }
      
      // Update last activity on each token refresh
      token.lastActivity = now
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.studentId = token.studentId as string
        session.user.sede = token.sede as string
        session.user.academicYear = token.academicYear as string
        session.user.division = token.division as string
        session.user.subjects = token.subjects as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle internal redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      
      // Default to home page for external redirects
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      return true
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
}