import { NextResponse } from "next/server"
import { getAllUsers } from "@/lib/temp-storage"

export async function GET() {
  try {
    const users = getAllUsers()
    return NextResponse.json({
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        status: user.status
      }))
    })
  } catch (error) {
    console.error("Debug users error:", error)
    return NextResponse.json(
      { error: "Error getting users" },
      { status: 500 }
    )
  }
}