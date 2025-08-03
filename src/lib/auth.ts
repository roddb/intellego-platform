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
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId || undefined,
          sede: user.sede || undefined,
          academicYear: user.academicYear || undefined,
          division: user.division || undefined,
          subjects: user.subjects || undefined,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.studentId = user.studentId
        token.sede = user.sede
        token.academicYear = user.academicYear
        token.division = user.division
        token.subjects = user.subjects
      }
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