import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { validateUserPassword } from "./db-operations"

console.log('🔍 AUTH CONFIG V5: validateUserPassword function imported:', typeof validateUserPassword);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔍 AUTH V5 AUTHORIZE FUNCTION CALLED!');
        console.log('🔍 Credentials received:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password');
          return null;
        }

        try {
          console.log('🔍 Validating user:', credentials.email);
          const user = await validateUserPassword(credentials.email as string, credentials.password as string);
          
          if (!user) {
            console.log('❌ User validation failed');
            return null;
          }

          console.log('✅ User validated successfully');
          
          // Return user object in correct format for NextAuth v5
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
          };
        } catch (error) {
          console.error('❌ Error in authorize function:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (reasonable for educational platform)
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔍 JWT callback called:', { hasUser: !!user, tokenEmail: token.email });
      
      // Set user data on first sign in
      if (user) {
        console.log('✅ JWT callback - Setting user data on token:', user);
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
      console.log('🔍 Session callback called:', { hasToken: !!token, tokenEmail: token?.email });
      
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
      console.log('🔍 Redirect callback called:', { url, baseUrl });
      
      // Handle internal redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      
      // Default to home page for external redirects
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn callback called:', { 
        hasUser: !!user, 
        userEmail: user?.email,
        accountType: account?.type 
      });
      return true
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
})

// Export authOptions for compatibility with existing code
export const authOptions = {
  providers: [],
  session: { strategy: "jwt" as const },
  callbacks: {},
  pages: { signIn: "/auth/signin" }
}