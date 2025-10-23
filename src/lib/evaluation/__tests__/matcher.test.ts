import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { matchStudent, validateStudent } from "../matcher";
import { ErrorCodes } from "../types";
import { db } from "@/lib/db";

// Mock de la DB
jest.mock("@/lib/db", () => ({
  db: {
    selectFrom: jest.fn(),
  },
}));

describe("Matcher - matchStudent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería encontrar match exacto (100%)", async () => {
    const mockStudents = [
      {
        id: "u_123",
        name: "González, Juan",
        academicYear: "5to Año",
        division: "A",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    const result = await matchStudent("Gonzalez");

    expect(result.student.id).toBe("u_123");
    expect(result.student.name).toBe("González, Juan");
    expect(result.matchConfidence).toBe(100);
  });

  it("debería encontrar match con tildes", async () => {
    const mockStudents = [
      {
        id: "u_123",
        name: "García, María",
        academicYear: "5to Año",
        division: "B",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    const result = await matchStudent("Garcia");

    expect(result.student.id).toBe("u_123");
    expect(result.matchConfidence).toBe(100);
  });

  it("debería encontrar match con apellido compuesto", async () => {
    const mockStudents = [
      {
        id: "u_456",
        name: "Di Bernardo, Rodrigo",
        academicYear: "5to Año",
        division: "A",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    const result = await matchStudent("Di Bernardo");

    expect(result.student.id).toBe("u_456");
    expect(result.matchConfidence).toBeGreaterThanOrEqual(90);
  });

  it("debería tolerar errores de tipeo (fuzzy matching)", async () => {
    const mockStudents = [
      {
        id: "u_789",
        name: "González, Pedro",
        academicYear: "4to Año",
        division: "C",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    // "Gonzales" vs "González" (error de tipeo)
    const result = await matchStudent("Gonzales", 85);

    expect(result.student.id).toBe("u_789");
    expect(result.matchConfidence).toBeGreaterThanOrEqual(85);
  });

  it("debería lanzar error si similitud < threshold", async () => {
    const mockStudents = [
      {
        id: "u_123",
        name: "Pérez, Juan",
        academicYear: "5to Año",
        division: "A",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    // "Gonzalez" vs "Pérez" (muy diferente)
    await expect(matchStudent("Gonzalez", 90)).rejects.toThrow(
      ErrorCodes.STUDENT_NOT_FOUND
    );
  });

  it("debería lanzar error si no hay estudiantes activos", async () => {
    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    });

    await expect(matchStudent("Gonzalez")).rejects.toThrow(
      ErrorCodes.STUDENT_NOT_FOUND
    );
  });

  it("debería seleccionar el mejor match cuando hay múltiples", async () => {
    const mockStudents = [
      {
        id: "u_111",
        name: "García, María", // Similitud ~50%
        academicYear: "5to Año",
        division: "A",
      },
      {
        id: "u_222",
        name: "González, Juan", // Similitud ~100%
        academicYear: "5to Año",
        division: "B",
      },
      {
        id: "u_333",
        name: "Pérez, Pedro", // Similitud ~0%
        academicYear: "4to Año",
        division: "C",
      },
    ];

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(mockStudents),
    });

    const result = await matchStudent("Gonzalez");

    expect(result.student.id).toBe("u_222");
    expect(result.student.name).toBe("González, Juan");
  });
});

describe("Matcher - validateStudent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería validar estudiante existente y activo", async () => {
    const mockStudent = {
      id: "u_123",
      name: "González, Juan",
      academicYear: "5to Año",
      division: "A",
    };

    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn().mockResolvedValue(mockStudent),
    });

    const result = await validateStudent("u_123");

    expect(result.student.id).toBe("u_123");
    expect(result.matchConfidence).toBe(100);
  });

  it("debería lanzar error si estudiante no existe", async () => {
    (db.selectFrom as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      executeTakeFirst: jest.fn().mockResolvedValue(undefined),
    });

    await expect(validateStudent("u_999")).rejects.toThrow(
      ErrorCodes.STUDENT_NOT_FOUND
    );
  });
});
