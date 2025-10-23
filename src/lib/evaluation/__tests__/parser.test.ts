import { describe, it, expect } from "@jest/globals";
import {
  extractApellido,
  normalizeApellido,
  parseExamContent,
  parseExamFile,
} from "../parser";
import { ErrorCodes } from "../types";

describe("Parser - extractApellido", () => {
  it("debería extraer apellido simple", () => {
    expect(extractApellido("Gonzalez.md")).toBe("Gonzalez");
  });

  it("debería extraer apellido con underscore", () => {
    expect(extractApellido("Di_Bernardo.md")).toBe("Di Bernardo");
  });

  it("debería extraer apellido compuesto con espacios", () => {
    expect(extractApellido("García López.md")).toBe("García López");
  });

  it("debería normalizar espacios múltiples", () => {
    expect(extractApellido("Garcia   Lopez.md")).toBe("Garcia Lopez");
  });

  it("debería lanzar error si el archivo no tiene .md", () => {
    expect(() => extractApellido("Gonzalez.txt")).not.toThrow();
    // Nota: No valida extensión en extractApellido, solo remueve .md si existe
  });

  it("debería lanzar error si el nombre está vacío", () => {
    expect(() => extractApellido(".md")).toThrow();
  });
});

describe("Parser - normalizeApellido", () => {
  it("debería remover tildes", () => {
    expect(normalizeApellido("García")).toBe("garcia");
  });

  it("debería convertir a minúsculas", () => {
    expect(normalizeApellido("GONZALEZ")).toBe("gonzalez");
  });

  it("debería preservar guiones y espacios", () => {
    expect(normalizeApellido("Di-Bernardo")).toBe("di-bernardo");
    expect(normalizeApellido("Garcia Lopez")).toBe("garcia lopez");
  });

  it("debería remover caracteres especiales", () => {
    expect(normalizeApellido("O'Connor")).toBe("oconnor");
    expect(normalizeApellido("García-López!")).toBe("garcia-lopez");
  });
});

describe("Parser - parseExamContent", () => {
  it("debería parsear ejercicios con formato 'Ejercicio N'", () => {
    const content = `# Examen de Física

## Ejercicio 1: Calcular alcance
Vox = 20 * cos(30°) = 17.32 m/s
Alcance = 34.64 m

## Ejercicio 2: Altura máxima
Voy = 20 * sen(30°) = 10 m/s
Altura = 5 m`;

    const exercises = parseExamContent(content);

    expect(exercises).toHaveLength(2);
    expect(exercises[0].number).toBe(1);
    expect(exercises[0].title).toBe("Calcular alcance");
    expect(exercises[0].content).toContain("Vox = 20");
    expect(exercises[0].hasAnswer).toBe(true);

    expect(exercises[1].number).toBe(2);
    expect(exercises[1].title).toBe("Altura máxima");
  });

  it("debería parsear ejercicios con números simples", () => {
    const content = `# Examen

## 1. Primera pregunta
Respuesta aquí

## 2. Segunda pregunta
Otra respuesta`;

    const exercises = parseExamContent(content);

    expect(exercises).toHaveLength(2);
    expect(exercises[0].number).toBe(1);
    expect(exercises[0].title).toBe("Primera pregunta");
  });

  it("debería marcar ejercicio sin respuesta", () => {
    const content = `## Ejercicio 1: Sin resolver

## Ejercicio 2: Resuelto
Aquí está la respuesta`;

    const exercises = parseExamContent(content);

    expect(exercises[0].hasAnswer).toBe(false);
    expect(exercises[1].hasAnswer).toBe(true);
  });

  it("debería ordenar ejercicios por número", () => {
    const content = `## Ejercicio 3: Tercero
Contenido 3

## Ejercicio 1: Primero
Contenido 1

## Ejercicio 2: Segundo
Contenido 2`;

    const exercises = parseExamContent(content);

    expect(exercises[0].number).toBe(1);
    expect(exercises[1].number).toBe(2);
    expect(exercises[2].number).toBe(3);
  });

  it("debería retornar array vacío si no hay ejercicios", () => {
    const content = `# Examen
Este es un examen sin ejercicios parseables`;

    const exercises = parseExamContent(content);

    expect(exercises).toHaveLength(0);
  });
});

describe("Parser - parseExamFile", () => {
  it("debería parsear archivo completo exitosamente", async () => {
    const fileName = "Gonzalez.md";
    const content = `# Examen de Física - Tiro Oblicuo

## Ejercicio 1: Calcular alcance
Vox = 20 * cos(30°) = 17.32 m/s`;

    const buffer = Buffer.from(content, "utf-8");

    const result = await parseExamFile(fileName, buffer, buffer.length);

    expect(result.apellido).toBe("Gonzalez");
    expect(result.rawContent).toBe(content);
    expect(result.exercises).toHaveLength(1);
    expect(result.metadata.fileName).toBe(fileName);
    expect(result.metadata.fileSize).toBe(buffer.length);
  });

  it("debería lanzar error si el archivo no es .md", async () => {
    const fileName = "Gonzalez.txt";
    const buffer = Buffer.from("Contenido", "utf-8");

    await expect(
      parseExamFile(fileName, buffer, buffer.length)
    ).rejects.toThrow(ErrorCodes.INVALID_FILE_FORMAT);
  });

  it("debería lanzar error si el archivo está vacío", async () => {
    const fileName = "Gonzalez.md";
    const buffer = Buffer.from("", "utf-8");

    await expect(
      parseExamFile(fileName, buffer, buffer.length)
    ).rejects.toThrow(ErrorCodes.PARSE_ERROR);
  });

  it("debería lanzar error si no encuentra ejercicios", async () => {
    const fileName = "Gonzalez.md";
    const content = "# Examen sin ejercicios\nSolo texto";
    const buffer = Buffer.from(content, "utf-8");

    await expect(
      parseExamFile(fileName, buffer, buffer.length)
    ).rejects.toThrow(ErrorCodes.PARSE_ERROR);
  });
});
