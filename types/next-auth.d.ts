import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique ID */
      id: string
      /** The user's role (STUDENT, INSTRUCTOR, ADMIN) */
      role: string
      /** Student ID for student users */
      studentId?: string
      /** School location/campus */
      sede?: string
      /** Academic year */
      academicYear?: string
      /** Class division */
      division?: string
      /** JSON string of subjects */
      subjects?: string
    } & DefaultSession["user"]
  }

  interface User {
    /** The user's role (STUDENT, INSTRUCTOR, ADMIN) */
    role: string
    /** Student ID for student users */
    studentId?: string
    /** School location/campus */
    sede?: string
    /** Academic year */
    academicYear?: string
    /** Class division */
    division?: string
    /** JSON string of subjects */
    subjects?: string
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's role */
    role?: string
    /** Student ID for student users */
    studentId?: string
    /** School location/campus */
    sede?: string
    /** Academic year */
    academicYear?: string
    /** Class division */
    division?: string
    /** JSON string of subjects */
    subjects?: string
    /** Last activity timestamp for session timeout */
    lastActivity?: number
    /** Flag to indicate expired token */
    expired?: boolean
  }
}