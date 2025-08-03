import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      studentId?: string
      sede?: string
      academicYear?: string
      division?: string
      subjects?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    studentId?: string
    sede?: string
    academicYear?: string
    division?: string
    subjects?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    studentId?: string
    sede?: string
    academicYear?: string
    division?: string
    subjects?: string
  }
}