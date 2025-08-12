/**
 * FASE 4: Test Suite for Feedback Generation System
 * Comprehensive tests for the educational feedback content generator
 */

import { 
  FeedbackContentGenerator,
  createFeedbackGenerator,
  validateFeedbackContent
} from '../feedback-content-generator';
import { 
  FeedbackIntegrationEngine,
  createFeedbackIntegrationEngine
} from '../feedback-integration-engine';
import { 
  CompositeScore,
  calculateCompositeScore
} from '../ai-assessment-rubrics';

// Mock evaluation results for testing
const mockEvaluationResults = [
  {
    questionId: 'temasYDominio',
    score: {
      questionId: 'temasYDominio',
      totalScore: 3.2,
      dimensionScores: {
        topic_identification: 3,
        self_assessment_accuracy: 3.5,
        depth_of_reflection: 3
      },
      overallLevel: 'proficient' as const,
      confidenceScore: 0.85,
      feedback: ['Good topic identification', 'Strong self-assessment'],
      recommendations: ['Continue developing reflection depth']
    },
    rawResponse: 'Mock AI response',
    processingTime: 1500,
    tokenUsage: { promptTokens: 100, completionTokens: 150, totalTokens: 250 }
  },
  {
    questionId: 'evidenciaAprendizaje',
    score: {
      questionId: 'evidenciaAprendizaje',
      totalScore: 2.8,
      dimensionScores: {
        example_specificity: 3,
        solution_process: 2.5,
        learning_demonstration: 3
      },
      overallLevel: 'proficient' as const,
      confidenceScore: 0.8,
      feedback: ['Good examples provided', 'Solution process could be clearer'],
      recommendations: ['Include more step-by-step details']
    },
    rawResponse: 'Mock AI response',
    processingTime: 1200,
    tokenUsage: { promptTokens: 120, completionTokens: 180, totalTokens: 300 }
  }
];

const mockFeedbackContext = {
  student: {
    name: 'María González',
    studentId: 'EST-2025-001',
    email: 'maria.gonzalez@estudiante.com'
  },
  academic: {
    sede: 'Congreso',
    academicYear: '4to Año',
    division: 'A',
    subject: 'Física'
  },
  week: {
    start: '2025-01-13',
    end: '2025-01-19'
  },
  submittedAt: '2025-01-19T15:30:00Z'
};

describe('FeedbackContentGenerator', () => {
  let generator: FeedbackContentGenerator;

  beforeEach(() => {
    generator = createFeedbackGenerator();
  });

  describe('Progress Calculation', () => {
    test('should calculate correct progress percentage for current week', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      // Expected: (3.2 + 2.8) / 2 = 3.0, which is 75%
      expect(feedback.metadata.progressScore).toBe(75);
    });

    test('should handle first week scenario correctly', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext,
        undefined // No previous week data
      );

      expect(feedback.content).toContain('Primera semana de evaluación');
      expect(feedback.content).toContain('estableciendo línea de base');
    });

    test('should calculate trend when previous week data is available', async () => {
      const previousResults = [
        {
          ...mockEvaluationResults[0],
          score: {
            ...mockEvaluationResults[0].score,
            totalScore: 2.5
          }
        },
        {
          ...mockEvaluationResults[1],
          score: {
            ...mockEvaluationResults[1].score,
            totalScore: 2.0
          }
        }
      ];

      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext,
        previousResults
      );

      expect(feedback.content).toContain('📈 Progreso positivo');
      expect(feedback.content).toContain('mejora');
    });
  });

  describe('Personalized Recommendations', () => {
    test('should generate subject-specific recommendations for Física', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      expect(feedback.content).toContain('fenómenos físicos');
      expect(feedback.content).toContain('principios teóricos');
    });

    test('should adapt recommendations based on academic year', async () => {
      const context4to = {
        ...mockFeedbackContext,
        academic: {
          ...mockFeedbackContext.academic,
          academicYear: '4to Año'
        }
      };

      const feedback4to = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        context4to
      );

      const context5to = {
        ...mockFeedbackContext,
        academic: {
          ...mockFeedbackContext.academic,
          academicYear: '5to Año'
        }
      };

      const feedback5to = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        context5to
      );

      // 5to año should have more advanced recommendations
      expect(feedback5to.content).toContain('grupos de estudio');
    });

    test('should provide different recommendations based on performance level', async () => {
      // Low performance scenario
      const lowResults = mockEvaluationResults.map(result => ({
        ...result,
        score: {
          ...result.score,
          totalScore: 1.5,
          overallLevel: 'developing' as const
        }
      }));

      const lowFeedback = await generator.generateCompleteFeedback(
        lowResults,
        mockFeedbackContext
      );

      // High performance scenario
      const highResults = mockEvaluationResults.map(result => ({
        ...result,
        score: {
          ...result.score,
          totalScore: 3.8,
          overallLevel: 'excellent' as const
        }
      }));

      const highFeedback = await generator.generateCompleteFeedback(
        highResults,
        mockFeedbackContext
      );

      expect(lowFeedback.content).toContain('fortalecer la comprensión');
      expect(highFeedback.content).toContain('comprensión sólida');
      expect(lowFeedback.metadata.instructorReviewRequired).toBe(true);
      expect(highFeedback.metadata.instructorReviewRequired).toBe(false);
    });
  });

  describe('Markdown Structure', () => {
    test('should generate well-structured Markdown content', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      // Check for required sections
      expect(feedback.content).toContain('# 📋 Reporte de Progreso Semanal');
      expect(feedback.content).toContain('## 📊 Resumen Ejecutivo');
      expect(feedback.content).toContain('## 🎯 Logros Destacados');
      expect(feedback.content).toContain('## 📈 Áreas de Crecimiento');
      expect(feedback.content).toContain('## 💡 Recomendaciones Personalizadas');
      expect(feedback.content).toContain('## 🚀 Próximos Pasos');
    });

    test('should include student and academic information', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      expect(feedback.content).toContain('María González');
      expect(feedback.content).toContain('Física');
      expect(feedback.content).toContain('Congreso');
      expect(feedback.content).toContain('4to Año');
    });

    test('should include progress justification', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      expect(feedback.content).toContain('Justificación:');
      expect(feedback.content).toContain('respuestas evaluadas');
      expect(feedback.content).toContain('Puntaje promedio');
    });
  });

  describe('Feedback Validation', () => {
    test('should validate feedback content successfully', async () => {
      const feedback = await generator.generateCompleteFeedback(
        mockEvaluationResults,
        mockFeedbackContext
      );

      const validation = validateFeedbackContent(feedback);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(validation.score).toBeGreaterThan(80);
    });

    test('should flag issues with insufficient content', async () => {
      const shortFeedback = {
        content: '# Short Report\nThis is too short.',
        metadata: {
          generatedAt: new Date().toISOString(),
          studentInfo: mockFeedbackContext.student,
          academicInfo: mockFeedbackContext.academic,
          weekInfo: mockFeedbackContext.week,
          progressScore: 75,
          overallLevel: 'Competente',
          wordCount: 10,
          instructorReviewRequired: false
        }
      };

      const validation = validateFeedbackContent(shortFeedback);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Feedback content too short - minimum 200 words required');
      expect(validation.score).toBeLessThan(80);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty evaluation results gracefully', async () => {
      const feedback = await generator.generateCompleteFeedback(
        [],
        mockFeedbackContext
      );

      expect(feedback.content).toContain('Error');
      expect(feedback.metadata.instructorReviewRequired).toBe(true);
    });

    test('should handle evaluation errors in results', async () => {
      const errorResults = [
        {
          ...mockEvaluationResults[0],
          errors: ['AI evaluation failed'],
          score: {
            ...mockEvaluationResults[0].score,
            totalScore: 0,
            overallLevel: 'insufficient' as const
          }
        }
      ];

      const feedback = await generator.generateCompleteFeedback(
        errorResults,
        mockFeedbackContext
      );

      expect(feedback.metadata.instructorReviewRequired).toBe(true);
    });
  });
});

describe('FeedbackIntegrationEngine', () => {
  let engine: FeedbackIntegrationEngine;

  beforeEach(() => {
    engine = createFeedbackIntegrationEngine({
      openaiApiKey: 'test-key',
      evaluationModel: 'gpt-4-turbo-preview'
    });
  });

  describe('Complete Workflow', () => {
    test('should orchestrate complete feedback generation', async () => {
      // Mock the AI evaluation and storage operations
      jest.spyOn(engine as any, 'runAIEvaluation').mockResolvedValue(mockEvaluationResults);
      jest.spyOn(engine as any, 'analyzeProgressHistory').mockResolvedValue({
        currentWeekScore: 3.0,
        weeklyTrend: 'stable',
        historicalComparison: 'Desempeño consistente',
        flaggedForAttention: false
      });
      jest.spyOn(engine as any, 'storeResultsComprehensively').mockResolvedValue({
        reportId: 'test-report-id',
        feedbackStored: true,
        jsonExported: true,
        filePath: '/test/path',
        errors: []
      });

      const request = {
        student: mockFeedbackContext.student,
        academic: mockFeedbackContext.academic,
        week: mockFeedbackContext.week,
        responses: {
          temasYDominio: 'Estudiamos cinemática y las leyes de Newton.',
          evidenciaAprendizaje: 'Resolví un problema de movimiento uniformemente acelerado.',
          dificultadesEstrategias: 'Tuve dificultad con la segunda ley de Newton.',
          conexionesAplicacion: 'Relacioné la física con situaciones cotidianas.',
          comentariosAdicionales: 'Me gustó mucho la clase práctica.'
        },
        submittedAt: mockFeedbackContext.submittedAt
      };

      const result = await engine.generateCompleteFeedback(request);

      expect(result.feedbackContent).toBeDefined();
      expect(result.evaluationResults).toHaveLength(2);
      expect(result.progressAnalysis).toBeDefined();
      expect(result.storageResult.reportId).toBe('test-report-id');
      expect(result.emailData).toBeDefined();
      expect(result.instructorNotification).toBeDefined();
    });
  });

  describe('Email Generation', () => {
    test('should generate appropriate email content', async () => {
      const emailData = (engine as any).prepareEmailContent(
        {
          student: mockFeedbackContext.student,
          academic: mockFeedbackContext.academic,
          responses: {},
          submittedAt: mockFeedbackContext.submittedAt
        },
        {
          content: '# Test Feedback',
          metadata: {
            progressScore: 75,
            instructorReviewRequired: false
          }
        },
        {
          flaggedForAttention: false
        }
      );

      expect(emailData.to).toBe('maria.gonzalez@estudiante.com');
      expect(emailData.subject).toContain('Reporte de Progreso Semanal');
      expect(emailData.subject).toContain('Física');
      expect(emailData.htmlContent).toContain('María González');
      expect(emailData.priority).toBe('normal');
    });

    test('should set high priority for concerning progress', async () => {
      const emailData = (engine as any).prepareEmailContent(
        {
          student: mockFeedbackContext.student,
          academic: mockFeedbackContext.academic,
          responses: {},
          submittedAt: mockFeedbackContext.submittedAt
        },
        {
          content: '# Test Feedback',
          metadata: {
            progressScore: 45,
            instructorReviewRequired: true
          }
        },
        {
          flaggedForAttention: true
        }
      );

      expect(emailData.priority).toBe('high');
    });
  });

  describe('Instructor Notifications', () => {
    test('should create appropriate instructor notification', async () => {
      const notification = (engine as any).createInstructorNotification(
        {
          student: mockFeedbackContext.student,
          academic: mockFeedbackContext.academic
        },
        mockEvaluationResults,
        {
          currentWeekScore: 3.0,
          weeklyTrend: 'stable',
          flaggedForAttention: false
        },
        {
          metadata: {
            instructorReviewRequired: false
          }
        }
      );

      expect(notification.studentName).toBe('María González');
      expect(notification.subject).toBe('Física');
      expect(notification.alertLevel).toBe('info');
      expect(notification.requiresReview).toBe(false);
    });

    test('should flag urgent notifications for low performance', async () => {
      const lowResults = mockEvaluationResults.map(r => ({
        ...r,
        score: { ...r.score, totalScore: 1.2 }
      }));

      const notification = (engine as any).createInstructorNotification(
        {
          student: mockFeedbackContext.student,
          academic: mockFeedbackContext.academic
        },
        lowResults,
        {
          currentWeekScore: 1.2,
          weeklyTrend: 'declining',
          flaggedForAttention: true
        },
        {
          metadata: {
            instructorReviewRequired: true
          }
        }
      );

      expect(notification.alertLevel).toBe('urgent');
      expect(notification.requiresReview).toBe(true);
      expect(notification.recommendedActions).toContain('Contacto inmediato');
      expect(notification.flaggedConcerns).toContain('muy por debajo del nivel');
    });
  });
});

describe('Integration with AI Assessment System', () => {
  test('should properly integrate with CompositeScore calculation', () => {
    const dimensionScores = {
      topic_identification: 3,
      self_assessment_accuracy: 3.5,
      depth_of_reflection: 3
    };

    const score = calculateCompositeScore('temasYDominio', dimensionScores);
    
    expect(score.totalScore).toBeCloseTo(3.15, 1); // Weighted average
    expect(score.overallLevel).toBe('proficient');
    expect(score.questionId).toBe('temasYDominio');
  });

  test('should handle various performance levels correctly', () => {
    const excellentScores = { dim1: 4, dim2: 3.8, dim3: 4 };
    const insufficientScores = { dim1: 1, dim2: 1.2, dim3: 1.5 };
    
    const excellentResult = calculateCompositeScore('test', excellentScores);
    const insufficientResult = calculateCompositeScore('test', insufficientScores);
    
    expect(excellentResult.overallLevel).toBe('excellent');
    expect(insufficientResult.overallLevel).toBe('insufficient');
  });
});

describe('Performance and Quality Tests', () => {
  test('should generate feedback within reasonable time limits', async () => {
    const generator = createFeedbackGenerator();
    const startTime = Date.now();
    
    await generator.generateCompleteFeedback(
      mockEvaluationResults,
      mockFeedbackContext
    );
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  test('should generate feedback with appropriate length', async () => {
    const generator = createFeedbackGenerator();
    
    const feedback = await generator.generateCompleteFeedback(
      mockEvaluationResults,
      mockFeedbackContext
    );
    
    expect(feedback.metadata.wordCount).toBeGreaterThan(200);
    expect(feedback.metadata.wordCount).toBeLessThan(2000);
  });

  test('should handle concurrent feedback generation', async () => {
    const generator = createFeedbackGenerator();
    
    const promises = Array.from({ length: 3 }, (_, i) => 
      generator.generateCompleteFeedback(
        mockEvaluationResults,
        {
          ...mockFeedbackContext,
          student: {
            ...mockFeedbackContext.student,
            name: `Student ${i + 1}`
          }
        }
      )
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.content).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });
  });
});

// Mock implementations for testing
jest.mock('../ai-evaluation-engine', () => ({
  createEvaluationEngine: jest.fn(() => ({
    evaluateResponse: jest.fn().mockResolvedValue(mockEvaluationResults[0])
  }))
}));

jest.mock('../db-operations', () => ({
  createProgressReport: jest.fn().mockResolvedValue('test-report-id'),
  getProgressReportsByUser: jest.fn().mockResolvedValue([]),
  storeFeedbackData: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../data-organization', () => ({
  exportReportToJSON: jest.fn().mockResolvedValue('/test/path/report.json'),
  getStudentReportPath: jest.fn().mockReturnValue('/test/path')
}));