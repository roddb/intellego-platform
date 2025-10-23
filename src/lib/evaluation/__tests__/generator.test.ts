import { describe, it, expect } from "@jest/globals";
import { generateFeedback } from "../generator";
import type { AIAnalysis, Student, ExamMetadata, Grading } from "../types";

describe("Generator - generateFeedback", () => {
  const mockStudent: Student = {
    id: "u_123",
    name: "González, Juan",
    academicYear: "5to Año",
    division: "A",
  };

  const mockMetadata: ExamMetadata = {
    subject: "Física",
    examTopic: "Tiro Oblicuo",
    examDate: "2025-10-15",
    instructorId: "inst_456",
  };

  const mockAnalysis: AIAnalysis = {
    scores: {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 2, puntaje: 62 },
    },
    exerciseAnalysis: [
      {
        exerciseNumber: 1,
        strengths: ["Identificó correctamente las variables", "Usó la fórmula apropiada"],
        weaknesses: ["No verificó el resultado", "Error en unidades"],
        specificFeedback: "Tu desarrollo muestra comprensión sólida del concepto.",
        phaseEvaluations: {
          F1: { nivel: 3, comment: "Identificaste los datos correctamente" },
          F2: { nivel: 4, comment: "Excelente identificación de variables" },
          F3: { nivel: 3, comment: "Fórmulas correctas" },
          F4: { nivel: 4, comment: "Desarrollo claro" },
          F5: { nivel: 2, comment: "Faltó verificación" },
        },
      },
    ],
    recommendations: [
      {
        priority: "alta",
        title: "Mejorar verificación de resultados",
        reason: "Es crucial validar tus respuestas antes de finalizar.",
        steps: [
          "Siempre verifica dimensionalmente",
          "Pregúntate si el valor tiene sentido",
          "Compara con casos conocidos",
        ],
        suggestedResources: "Capítulo 1 del libro",
      },
    ],
  };

  const mockGrading: Grading = {
    score: 77,
  };

  const instructorName = "Prof. Rodríguez";

  it("debería generar feedback completo en Markdown", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("# RETROALIMENTACIÓN - González, Juan");
    expect(feedback).toContain("## Examen: Física - Tiro Oblicuo");
    expect(feedback).toContain("### Nota: 77/100");
  });

  it("debería incluir tabla de distribución por fases", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("### Distribución por Fases");
    expect(feedback).toContain("| Fase | Descripción | Nivel | Puntaje | Peso |");
    expect(feedback).toContain("| F1 | Comprensión del Problema | 3 | 77/100 | 15% |");
    expect(feedback).toContain("| F4 | Ejecución y Cálculos | 4 | 92.5/100 | 30% |");
  });

  it("debería incluir análisis de ejercicios", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("## 🎯 Análisis Ejercicio por Ejercicio");
    expect(feedback).toContain("### Ejercicio 1");
    expect(feedback).toContain("**Fortalezas:**");
    expect(feedback).toContain("- Identificó correctamente las variables");
    expect(feedback).toContain("**Áreas de Mejora:**");
    expect(feedback).toContain("- No verificó el resultado");
    expect(feedback).toContain("**Retroalimentación Específica:**");
  });

  it("debería incluir recomendaciones priorizadas", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("## 💡 Recomendaciones para Mejorar");
    expect(feedback).toContain("### 🔴 Mejorar verificación de resultados");
    expect(feedback).toContain("**Por qué es importante:**");
    expect(feedback).toContain("**Cómo implementarlo:**");
    expect(feedback).toContain("- Siempre verifica dimensionalmente");
  });

  it("debería incluir plan de acción", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("## 📈 Próximos Pasos");
    expect(feedback).toContain("### Plan de Acción Inmediato:");
    expect(feedback).toContain("### Enfócate en:");
  });

  it("debería incluir mensaje final apropiado según score", () => {
    // Score alto (85+)
    const highGrading: Grading = { score: 90 };
    const highFeedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      highGrading,
      instructorName
    );
    expect(highFeedback).toContain("Excelente trabajo");

    // Score medio (70-84)
    const mediumGrading: Grading = { score: 75 };
    const mediumFeedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mediumGrading,
      instructorName
    );
    expect(mediumFeedback).toContain("Buen trabajo");

    // Score bajo (<55)
    const lowGrading: Grading = { score: 45 };
    const lowFeedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      lowGrading,
      instructorName
    );
    expect(lowFeedback).toContain("apoyo adicional");
  });

  it("debería incluir metadatos al final", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("**Corrección realizada por:** Prof. Rodríguez");
    expect(feedback).toContain("**Sistema:** Intellego Platform");
    expect(feedback).toContain("**Método:** Evaluación con Rúbrica 5-FASE");
  });

  it("debería formatear fechas correctamente", () => {
    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      mockAnalysis,
      mockGrading,
      instructorName
    );

    // Debería contener fecha formateada en español
    expect(feedback).toContain("### Fecha:");
    // La fecha exacta puede variar según locale, pero debe estar presente
  });

  it("debería manejar múltiples ejercicios", () => {
    const multiExerciseAnalysis: AIAnalysis = {
      ...mockAnalysis,
      exerciseAnalysis: [
        mockAnalysis.exerciseAnalysis[0],
        {
          ...mockAnalysis.exerciseAnalysis[0],
          exerciseNumber: 2,
        },
        {
          ...mockAnalysis.exerciseAnalysis[0],
          exerciseNumber: 3,
        },
      ],
    };

    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      multiExerciseAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("### Ejercicio 1");
    expect(feedback).toContain("### Ejercicio 2");
    expect(feedback).toContain("### Ejercicio 3");
  });

  it("debería manejar múltiples recomendaciones", () => {
    const multiRecAnalysis: AIAnalysis = {
      ...mockAnalysis,
      recommendations: [
        mockAnalysis.recommendations[0],
        {
          priority: "media",
          title: "Mejorar identificación de variables",
          reason: "Fortalecerá tu análisis",
          steps: ["Crear tabla de variables", "Usar símbolos consistentes"],
        },
      ],
    };

    const feedback = generateFeedback(
      mockStudent,
      mockMetadata,
      multiRecAnalysis,
      mockGrading,
      instructorName
    );

    expect(feedback).toContain("🔴 Mejorar verificación");
    expect(feedback).toContain("🟡 Mejorar identificación");
  });
});
