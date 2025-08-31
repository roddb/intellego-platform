import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  validatePasswordAgainstPolicy, 
  getActivePasswordPolicy, 
  checkPasswordReuse,
  calculatePasswordStrength,
  calculatePasswordEntropy
} from "@/lib/db-operations";
import { rateLimit } from "@/lib/rate-limit";

// Configure to use Node.js runtime instead of Edge Runtime
// This is necessary because auth() uses bcryptjs which requires Node.js APIs
export const runtime = 'nodejs';

// Rate limiting configuration - moderate for password validation
const passwordValidationLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    try {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
      await passwordValidationLimit.check(30, ip); // 30 validations per minute
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          message: "Demasiadas validaciones de contraseña. Inténtalo de nuevo en unos minutos.",
          error: "RATE_LIMIT_EXCEEDED" 
        },
        { status: 429 }
      );
    }

    // Parse request body
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

    const { password, userId, checkReuse = false } = body;

    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { 
          success: false, 
          message: "La contraseña es requerida para validación.",
          error: "MISSING_PASSWORD" 
        },
        { status: 400 }
      );
    }

    // If checkReuse is true, we need authentication and userId
    let authenticatedUserId = userId;
    if (checkReuse || userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Autenticación requerida para verificación completa.",
            error: "AUTHENTICATION_REQUIRED" 
          },
          { status: 401 }
        );
      }
      // Use the authenticated user's ID if not provided or if it doesn't match
      authenticatedUserId = session.user.id;
    }

    console.log(`🔍 Password validation request for user: ${authenticatedUserId || 'anonymous'}`);

    // Get active password policy
    const policy = await getActivePasswordPolicy();
    
    // Validate password against policy
    const validationResult = validatePasswordAgainstPolicy(password, policy);
    
    // Check password reuse if requested and user is authenticated
    let isReused = false;
    if (checkReuse && authenticatedUserId) {
      try {
        isReused = await checkPasswordReuse(authenticatedUserId, password, policy.preventReuse);
      } catch (error) {
        console.warn("⚠️ Error checking password reuse:", error);
        // Continue without reuse check rather than failing the validation
      }
    }

    // Calculate additional metrics
    const strengthScore = calculatePasswordStrength(password);
    const entropyScore = Math.round(calculatePasswordEntropy(password));
    
    // Create detailed feedback
    const feedback = {
      strength: {
        score: strengthScore,
        level: getStrengthLevel(strengthScore),
        description: getStrengthDescription(strengthScore)
      },
      entropy: {
        score: entropyScore,
        level: getEntropyLevel(entropyScore),
        description: getEntropyDescription(entropyScore)
      },
      requirements: {
        minLength: {
          required: policy.minLength,
          current: password.length,
          meets: validationResult.complianceFlags.meetsMinLength,
          message: validationResult.complianceFlags.meetsMinLength 
            ? `Longitud adecuada (${password.length} caracteres)` 
            : `Debe tener al menos ${policy.minLength} caracteres (actual: ${password.length})`
        },
        maxLength: {
          required: policy.maxLength,
          current: password.length,
          meets: password.length <= policy.maxLength,
          message: password.length <= policy.maxLength 
            ? `Dentro del límite máximo (${password.length}/${policy.maxLength})` 
            : `Excede el límite máximo de ${policy.maxLength} caracteres`
        },
        uppercase: {
          required: policy.requireUppercase,
          meets: validationResult.complianceFlags.hasUppercase,
          message: policy.requireUppercase 
            ? (validationResult.complianceFlags.hasUppercase ? "Contiene mayúsculas ✓" : "Debe contener al menos una letra mayúscula") 
            : "No requerido"
        },
        lowercase: {
          required: policy.requireLowercase,
          meets: validationResult.complianceFlags.hasLowercase,
          message: policy.requireLowercase 
            ? (validationResult.complianceFlags.hasLowercase ? "Contiene minúsculas ✓" : "Debe contener al menos una letra minúscula") 
            : "No requerido"
        },
        numbers: {
          required: policy.requireNumbers,
          meets: validationResult.complianceFlags.hasNumbers,
          message: policy.requireNumbers 
            ? (validationResult.complianceFlags.hasNumbers ? "Contiene números ✓" : "Debe contener al menos un número") 
            : "No requerido"
        },
        specialChars: {
          required: policy.requireSpecialChars,
          meets: validationResult.complianceFlags.hasSpecialChars,
          message: policy.requireSpecialChars 
            ? (validationResult.complianceFlags.hasSpecialChars ? "Contiene caracteres especiales ✓" : `Debe contener al menos un carácter especial (${policy.allowedSpecialChars})`) 
            : "No requerido",
          allowedChars: policy.allowedSpecialChars
        }
      },
      reuse: checkReuse ? {
        checked: true,
        isReused,
        message: isReused 
          ? `Esta contraseña fue utilizada recientemente. No se puede reutilizar las últimas ${policy.preventReuse} contraseñas.`
          : "La contraseña no ha sido utilizada recientemente ✓"
      } : {
        checked: false,
        message: "Verificación de reutilización no solicitada"
      },
      recommendations: generatePasswordRecommendations(password, validationResult, policy)
    };

    // Determine overall validity
    const isValid = validationResult.isValid && !isReused;
    
    console.log(`🔍 Password validation completed - Valid: ${isValid}, Strength: ${strengthScore}/5, Entropy: ${entropyScore}`);

    return NextResponse.json({
      success: true,
      isValid,
      feedback,
      policy: {
        name: policy.policyName,
        description: policy.description,
        requirements: {
          minLength: policy.minLength,
          maxLength: policy.maxLength,
          requireUppercase: policy.requireUppercase,
          requireLowercase: policy.requireLowercase,
          requireNumbers: policy.requireNumbers,
          requireSpecialChars: policy.requireSpecialChars,
          preventReuse: policy.preventReuse
        }
      },
      errors: validationResult.errors.concat(isReused ? ["La contraseña fue utilizada recientemente"] : [])
    });

  } catch (error) {
    console.error("❌ Error in password validation endpoint:", error);
    
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
        message: "Error interno del servidor durante la validación.",
        error: "INTERNAL_SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current password policy
export async function GET() {
  try {
    const policy = await getActivePasswordPolicy();
    
    return NextResponse.json({
      success: true,
      policy: {
        name: policy.policyName,
        description: policy.description,
        requirements: {
          minLength: policy.minLength,
          maxLength: policy.maxLength,
          requireUppercase: policy.requireUppercase,
          requireLowercase: policy.requireLowercase,
          requireNumbers: policy.requireNumbers,
          requireSpecialChars: policy.requireSpecialChars,
          allowedSpecialChars: policy.allowedSpecialChars,
          preventReuse: policy.preventReuse
        },
        security: {
          lockoutAttempts: policy.lockoutAttempts,
          lockoutDuration: policy.lockoutDuration,
          expirationDays: policy.expirationDays
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching password policy:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error obteniendo política de contraseñas.",
        error: "INTERNAL_SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}

// Utility functions for password strength assessment

function getStrengthLevel(score: number): string {
  if (score <= 1) return "Muy débil";
  if (score <= 2) return "Débil";
  if (score <= 3) return "Regular";
  if (score <= 4) return "Fuerte";
  return "Muy fuerte";
}

function getStrengthDescription(score: number): string {
  const descriptions = {
    1: "Esta contraseña es muy vulnerable a ataques. Se recomienda cambiarla inmediatamente.",
    2: "Esta contraseña es débil y puede ser comprometida fácilmente. Agrégale más caracteres y variedad.",
    3: "Esta contraseña es aceptable pero puede mejorarse. Considera agregar más tipos de caracteres.",
    4: "Esta contraseña es fuerte y proporciona buena seguridad.",
    5: "Excelente contraseña. Proporciona una seguridad muy alta."
  };
  
  return descriptions[Math.min(5, Math.max(1, score)) as keyof typeof descriptions];
}

function getEntropyLevel(entropy: number): string {
  if (entropy < 25) return "Muy baja";
  if (entropy < 35) return "Baja";
  if (entropy < 50) return "Media";
  if (entropy < 65) return "Alta";
  return "Muy alta";
}

function getEntropyDescription(entropy: number): string {
  if (entropy < 25) return "La entropía es muy baja. La contraseña es predecible.";
  if (entropy < 35) return "La entropía es baja. La contraseña puede ser adivinada.";
  if (entropy < 50) return "La entropía es media. Seguridad aceptable pero mejorable.";
  if (entropy < 65) return "La entropía es alta. Buena seguridad.";
  return "La entropía es muy alta. Excelente seguridad.";
}

function generatePasswordRecommendations(
  password: string, 
  validationResult: any, 
  policy: any
): string[] {
  const recommendations: string[] = [];
  
  if (password.length < policy.minLength) {
    recommendations.push(`Aumenta la longitud a al menos ${policy.minLength} caracteres`);
  }
  
  if (policy.requireUppercase && !validationResult.complianceFlags.hasUppercase) {
    recommendations.push("Agrega al menos una letra mayúscula (A-Z)");
  }
  
  if (policy.requireLowercase && !validationResult.complianceFlags.hasLowercase) {
    recommendations.push("Agrega al menos una letra minúscula (a-z)");
  }
  
  if (policy.requireNumbers && !validationResult.complianceFlags.hasNumbers) {
    recommendations.push("Agrega al menos un número (0-9)");
  }
  
  if (policy.requireSpecialChars && !validationResult.complianceFlags.hasSpecialChars) {
    recommendations.push(`Agrega al menos un carácter especial (${policy.allowedSpecialChars})`);
  }
  
  if (validationResult.strengthScore < 3) {
    recommendations.push("Considera usar una frase de contraseña larga en lugar de caracteres aleatorios");
    recommendations.push("Evita patrones predecibles como '123' o 'abc'");
  }
  
  if (validationResult.complianceFlags.entropyScore < 35) {
    recommendations.push("Aumenta la complejidad combinando diferentes tipos de caracteres");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("¡Excelente contraseña! Cumple con todos los requisitos de seguridad.");
  }
  
  return recommendations;
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para validar contraseña o GET para obtener política.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Método no permitido. Usa POST para validar contraseña o GET para obtener política.",
      error: "METHOD_NOT_ALLOWED" 
    },
    { status: 405 }
  );
}