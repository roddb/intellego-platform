import { NextResponse } from "next/server"
import { getAllUsers } from "@/lib/hybrid-storage"

export async function GET() {
  try {
    const users = await getAllUsers()
    
    // Remove passwords for security
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user
      return safeUser
    })
    
    return NextResponse.json({
      count: safeUsers.length,
      users: safeUsers
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}