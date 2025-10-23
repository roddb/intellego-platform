import { describe, it, expect } from "@jest/globals";
import {
  calculateScore,
  validateScores,
  getScoreMessage,
  getPriorityIcon,
  calculateStatistics,
} from "../calculator";
import type { PhaseScores } from "../types";

describe("Calculator - calculateScore", () => {
  it("debería calcular score para todos niveles 4", () => {
    const scores: PhaseScores = {
      F1: { nivel: 4, puntaje: 92.5 },
      F2: { nivel: 4, puntaje: 92.5 },
      F3: { nivel: 4, puntaje: 92.5 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 4, puntaje: 92.5 },
    };

    const result = calculateScore(scores);

    expect(result.score).toBe(93); // Redondeado de 92.5
  });

  it("debería calcular score para todos niveles 3", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 3, puntaje: 77 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 3, puntaje: 77 },
      F5: { nivel: 3, puntaje: 77 },
    };

    const result = calculateScore(scores);

    expect(result.score).toBe(77);
  });

  it("debería calcular score mixto correctamente", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 }, // ×0.15 = 11.55
      F2: { nivel: 2, puntaje: 62 }, // ×0.20 = 12.4
      F3: { nivel: 3, puntaje: 77 }, // ×0.25 = 19.25
      F4: { nivel: 4, puntaje: 92.5 }, // ×0.30 = 27.75
      F5: { nivel: 2, puntaje: 62 }, // ×0.10 = 6.2
    };

    const result = calculateScore(scores);

    // 11.55 + 12.4 + 19.25 + 27.75 + 6.2 = 77.15 → 77
    expect(result.score).toBe(77);
  });

  it("debería limitar score al rango [0, 100]", () => {
    // Score muy alto (teórico, no debería pasar)
    const highScores: PhaseScores = {
      F1: { nivel: 4, puntaje: 100 },
      F2: { nivel: 4, puntaje: 100 },
      F3: { nivel: 4, puntaje: 100 },
      F4: { nivel: 4, puntaje: 100 },
      F5: { nivel: 4, puntaje: 100 },
    };

    const highResult = calculateScore(highScores);
    expect(highResult.score).toBeLessThanOrEqual(100);

    // Score muy bajo
    const lowScores: PhaseScores = {
      F1: { nivel: 1, puntaje: 27 },
      F2: { nivel: 1, puntaje: 27 },
      F3: { nivel: 1, puntaje: 27 },
      F4: { nivel: 1, puntaje: 27 },
      F5: { nivel: 1, puntaje: 27 },
    };

    const lowResult = calculateScore(lowScores);
    expect(lowResult.score).toBeGreaterThanOrEqual(0);
    expect(lowResult.score).toBe(27);
  });

  it("debería ponderar correctamente las fases", () => {
    // F4 (Ejecución) tiene más peso (30%)
    const scores1: PhaseScores = {
      F1: { nivel: 2, puntaje: 62 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 2, puntaje: 62 },
      F4: { nivel: 4, puntaje: 92.5 }, // Alto en F4
      F5: { nivel: 2, puntaje: 62 },
    };

    const result1 = calculateScore(scores1);

    // F5 (Verificación) tiene menos peso (10%)
    const scores2: PhaseScores = {
      F1: { nivel: 2, puntaje: 62 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 2, puntaje: 62 },
      F4: { nivel: 2, puntaje: 62 },
      F5: { nivel: 4, puntaje: 92.5 }, // Alto en F5
    };

    const result2 = calculateScore(scores2);

    // result1 debería ser mayor que result2 (F4 pesa más)
    expect(result1.score).toBeGreaterThan(result2.score);
  });
});

describe("Calculator - validateScores", () => {
  it("debería validar scores correctos", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 4, puntaje: 92.5 },
      F4: { nivel: 3, puntaje: 77 },
      F5: { nivel: 1, puntaje: 27 },
    };

    expect(validateScores(scores)).toBe(true);
  });

  it("debería rechazar nivel inválido (<1)", () => {
    const scores: PhaseScores = {
      F1: { nivel: 0 as 1, puntaje: 0 }, // Inválido
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 2, puntaje: 62 },
    };

    expect(validateScores(scores)).toBe(false);
  });

  it("debería rechazar nivel inválido (>4)", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 5 as 4, puntaje: 100 }, // Inválido
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 2, puntaje: 62 },
    };

    expect(validateScores(scores)).toBe(false);
  });

  it("debería rechazar puntaje inválido (<0)", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 2, puntaje: -10 }, // Inválido
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 2, puntaje: 62 },
    };

    expect(validateScores(scores)).toBe(false);
  });

  it("debería rechazar puntaje inválido (>100)", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 120 }, // Inválido
      F5: { nivel: 2, puntaje: 62 },
    };

    expect(validateScores(scores)).toBe(false);
  });
});

describe("Calculator - getScoreMessage", () => {
  it("debería retornar mensaje excelente para score ≥85", () => {
    expect(getScoreMessage(85)).toContain("Excelente");
    expect(getScoreMessage(90)).toContain("Excelente");
    expect(getScoreMessage(100)).toContain("Excelente");
  });

  it("debería retornar mensaje bueno para score 70-84", () => {
    expect(getScoreMessage(70)).toContain("Buen trabajo");
    expect(getScoreMessage(75)).toContain("Buen trabajo");
    expect(getScoreMessage(84)).toContain("Buen trabajo");
  });

  it("debería retornar mensaje en desarrollo para score 55-69", () => {
    expect(getScoreMessage(55)).toContain("esfuerzo");
    expect(getScoreMessage(60)).toContain("esfuerzo");
    expect(getScoreMessage(69)).toContain("esfuerzo");
  });

  it("debería retornar mensaje inicial para score <55", () => {
    expect(getScoreMessage(54)).toContain("apoyo adicional");
    expect(getScoreMessage(40)).toContain("apoyo adicional");
    expect(getScoreMessage(20)).toContain("apoyo adicional");
  });
});

describe("Calculator - getPriorityIcon", () => {
  it("debería retornar íconos correctos por nivel", () => {
    expect(getPriorityIcon(1)).toBe("🔴"); // Alta
    expect(getPriorityIcon(2)).toBe("🟡"); // Media
    expect(getPriorityIcon(3)).toBe("🟢"); // Baja
    expect(getPriorityIcon(4)).toBe(""); // Sin recomendación
  });
});

describe("Calculator - calculateStatistics", () => {
  it("debería calcular estadísticas correctamente", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 2, puntaje: 62 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 4, puntaje: 92.5 },
      F5: { nivel: 2, puntaje: 62 },
    };

    const stats = calculateStatistics(scores);

    // Promedio: (77 + 62 + 77 + 92.5 + 62) / 5 = 74.1 → 74
    expect(stats.promedio).toBe(74);

    // Fase más alta: F4 (92.5)
    expect(stats.faseMasAlta).toBe("F4");

    // Fase más baja: F2 o F5 (ambos 62), depende del orden
    expect(["F2", "F5"]).toContain(stats.faseMasBaja);

    // Nivel promedio: (3 + 2 + 3 + 4 + 2) / 5 = 2.8
    expect(stats.nivelPromedio).toBe(2.8);
  });

  it("debería manejar todos niveles iguales", () => {
    const scores: PhaseScores = {
      F1: { nivel: 3, puntaje: 77 },
      F2: { nivel: 3, puntaje: 77 },
      F3: { nivel: 3, puntaje: 77 },
      F4: { nivel: 3, puntaje: 77 },
      F5: { nivel: 3, puntaje: 77 },
    };

    const stats = calculateStatistics(scores);

    expect(stats.promedio).toBe(77);
    expect(stats.nivelPromedio).toBe(3);
  });
});
