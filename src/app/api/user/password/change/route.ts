import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';import { changeUserPassword } from "@/lib/db-operations";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiting configuration - stricter for password changes
const passwordChangeLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    try {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
      await passwordChangeLimit.check(5, ip); // 5 attempts per minute
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          message: "Demasiados intentos de cambio de contraseña. Inténtalo de nuevo en unos minutos.",
          error: "RATE_LIMIT_EXCEEDED" 
        },
        { status: 429 }
      );
    }

    // Get session to verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "No autenticado. Inicia sesión para cambiar tu contraseña.",
          error: "UNAUTHORIZED" 
        },
        { status: 401 }
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

    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Todos los campos son obligatorios: contraseña actual, nueva contraseña y confirmación.",
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

    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: "La nueva contraseña debe ser diferente a la actual.",
          error: "SAME_PASSWORD" 
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

    console.log(`🔐 Password change attempt for user: ${session.user.email}`);
    console.log(`📍 Security context:`, {
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent?.substring(0, 100) + "...",
      location: securityContext.location
    });

    // Attempt to change password using db-operations
    const result = await changeUserPassword(
      session.user.id,
      currentPassword,
      newPassword,
      securityContext,
      "User-initiated password change via web interface"
    );

    if (result.success) {
      console.log(`✅ Password changed successfully for user: ${session.user.email} (Audit ID: ${result.auditId})`);
      
      return NextResponse.json({
        success: true,
        message: "Contraseña cambiada exitosamente. Tu sesión se mantendrá activa.",
        auditId: result.auditId
      });
    } else {
      console.log(`❌ Password change failed for user: ${session.user.email} - ${result.message} (Audit ID: ${result.auditId})`);
      
      // Map internal error messages to user-friendly Spanish messages
      let userMessage = result.message;
      if (result.message === "User not found") {
        userMessage = "Usuario no encontrado en el sistema.";
      } else if (result.message === "Current password is incorrect") {
        userMessage = "La contraseña actual es incorrecta.";
      } else if (result.message.includes("Password does not meet requirements")) {
        userMessage = result.message.replace("Password does not meet requirements:", "La contraseña no cumple con los requisitos:");
      } else if (result.message.includes("Password was recently used")) {
        userMessage = "Esta contraseña fue utilizada recientemente. Por favor, elige una contraseña diferente.";
      }
      
      return NextResponse.json({
        success: false,
        message: userMessage,
        error: "PASSWORD_CHANGE_FAILED",
        auditId: result.auditId
      }, { 
        status: 400 
      });
    }

  } catch (error) {
    console.error("❌ Error in password change endpoint:", error);
    
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

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para cambiar contraseña.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para cambiar contraseña.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para cambiar contraseña.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}