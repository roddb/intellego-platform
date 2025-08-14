import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminResetPassword, findUserById } from "@/lib/db-operations";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiting configuration - very strict for admin password resets
const adminPasswordResetLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check - even stricter for admin operations
    try {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
      await adminPasswordResetLimit.check(3, ip); // 3 attempts per minute
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          message: "Demasiados intentos de restablecimiento de contraseña. Inténtalo de nuevo en unos minutos.",
          error: "RATE_LIMIT_EXCEEDED" 
        },
        { status: 429 }
      );
    }

    // Get session to verify authentication and admin role
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No autenticado. Inicia sesión para acceder a esta función.",
          error: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    // Verify admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
      console.log(`🔒 Unauthorized password reset attempt by user: ${session.user.email} (Role: ${session.user.role})`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Permisos insuficientes. Solo los administradores e instructores pueden restablecer contraseñas.",
          error: "FORBIDDEN" 
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Datos de solicitud inválidos.",
          error: "INVALID_REQUEST_BODY" 
        },
        { status: 400 }
      );
    }

    const { targetUserId, newPassword, confirmPassword, resetReason } = body;

    // Validate required fields
    if (!targetUserId || !newPassword || !confirmPassword || !resetReason) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Todos los campos son obligatorios: ID del usuario, nueva contraseña, confirmación y motivo del restablecimiento.",
          error: "MISSING_REQUIRED_FIELDS" 
        },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: "La nueva contraseña y la confirmación no coinciden.",
          error: "PASSWORD_CONFIRMATION_MISMATCH" 
        },
        { status: 400 }
      );
    }

    // Validate reset reason
    if (resetReason.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: "El motivo del restablecimiento debe tener al menos 10 caracteres.",
          error: "INVALID_RESET_REASON" 
        },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Usuario objetivo no encontrado.",
          error: "TARGET_USER_NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    // Prevent instructors from resetting admin passwords
    if (session.user.role === 'INSTRUCTOR' && targetUser.role === 'ADMIN') {
      console.log(`🔒 Instructor ${session.user.email} attempted to reset admin password for ${targetUser.email}`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Los instructores no pueden restablecer contraseñas de administradores.",
          error: "INSUFFICIENT_PRIVILEGES" 
        },
        { status: 403 }
      );
    }

    // Prevent self password reset through admin endpoint (they should use the regular change endpoint)
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No puedes restablecer tu propia contraseña aquí. Usa la función de cambio de contraseña.",
          error: "SELF_RESET_NOT_ALLOWED" 
        },
        { status: 400 }
      );
    }

    // Build security context from request
    const securityContext = {
      ipAddress: request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || 
                "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      sessionId: session?.user?.id,
      location: request.headers.get("cf-ipcountry") || 
               request.headers.get("x-vercel-ip-country") || 
               "unknown",
      deviceInfo: request.headers.get("sec-ch-ua") || "unknown"
    };

    console.log(`🔐 Admin password reset initiated by: ${session.user.email} (${session.user.role}) for target: ${targetUser.email}`);
    console.log(`📍 Security context:`, {
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent?.substring(0, 100) + "...",
      location: securityContext.location
    });
    console.log(`📝 Reset reason: ${resetReason}`);

    // Attempt to reset password using db-operations
    const result = await adminResetPassword(
      session.user.id,
      targetUserId,
      newPassword,
      securityContext,
      `Admin reset by ${session.user.email} (${session.user.role}): ${resetReason}`
    );

    if (result.success) {
      console.log(`✅ Admin password reset successful for user: ${targetUser.email} by admin: ${session.user.email} (Audit ID: ${result.auditId})`);
      
      return NextResponse.json({
        success: true,
        message: `Contraseña restablecida exitosamente para ${targetUser.name} (${targetUser.email})`,
        auditId: result.auditId,
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      });
    } else {
      console.log(`❌ Admin password reset failed for user: ${targetUser.email} by admin: ${session.user.email} - ${result.message} (Audit ID: ${result.auditId})`);
      
      // Map internal error messages to user-friendly Spanish messages
      let userMessage = result.message;
      if (result.message === "Target user not found") {
        userMessage = "Usuario objetivo no encontrado en el sistema.";
      } else if (result.message === "Insufficient permissions for password reset") {
        userMessage = "Permisos insuficientes para restablecer contraseñas.";
      } else if (result.message.includes("Password does not meet requirements")) {
        userMessage = result.message.replace("Password does not meet requirements:", "La contraseña no cumple con los requisitos:");
      }
      
      return NextResponse.json({
        success: false,
        message: userMessage,
        error: "PASSWORD_RESET_FAILED",
        auditId: result.auditId
      }, { 
        status: 400 
      });
    }

  } catch (error) {
    console.error("❌ Error in admin password reset endpoint:", error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error("📝 Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 1000) + "..."
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        message: "Error interno del servidor. Inténtalo de nuevo más tarde.",
        error: "INTERNAL_SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user information for admin reset interface
export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication and admin role
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No autenticado.",
          error: "UNAUTHORIZED" 
        },
        { status: 401 }
      );
    }

    // Verify admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Permisos insuficientes.",
          error: "FORBIDDEN" 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "ID de usuario requerido.",
          error: "MISSING_USER_ID" 
        },
        { status: 400 }
      );
    }

    const targetUser = await findUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Usuario no encontrado.",
          error: "USER_NOT_FOUND" 
        },
        { status: 404 }
      );
    }

    // Return user information (without password)
    const { password: _, ...userInfo } = targetUser;
    
    return NextResponse.json({
      success: true,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,
        studentId: userInfo.studentId,
        sede: userInfo.sede,
        academicYear: userInfo.academicYear,
        division: userInfo.division
      }
    });

  } catch (error) {
    console.error("❌ Error in admin password reset GET endpoint:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error interno del servidor.",
        error: "INTERNAL_SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para restablecer contraseña.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para restablecer contraseña.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}