import { NextResponse } from "next/server";
import { validateUserPassword, findUserByEmail } from "@/lib/db-operations";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password required" 
      }, { status: 400 });
    }

    console.log(`🔍 Testing authentication for: ${email}`);
    
    // Find user first
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found",
        userExists: false
      });
    }

    // Test password validation
    const validUser = await validateUserPassword(email, password);
    
    return NextResponse.json({
      success: !!validUser,
      userExists: true,
      userInfo: validUser ? {
        id: validUser.id,
        name: validUser.name,
        email: validUser.email,
        role: validUser.role,
        studentId: validUser.studentId,
        sede: validUser.sede,
        academicYear: validUser.academicYear,
        division: validUser.division
      } : null,
      authenticationWorking: !!validUser,
      bcryptWorking: true,
      message: validUser ? "Authentication successful" : "Invalid credentials"
    });

  } catch (error) {
    console.error("❌ Test user auth error:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Authentication test failed"
    }, { status: 500 });
  }
}