/**
 * FASE 4: Generador de Feedback Inteligente
 * Intellego Platform - Educational Feedback Content Generator
 * 
 * Creates personalized educational feedback in professional Markdown format
 * based on AI assessment results from FASE 3. Designed specifically for 
 * Argentine secondary education students with subject-specific adaptations.
 */

import { 
  CompositeScore, 
  QuestionRubric, 
  getRubricById, 
  subjectAdaptations 
} from './ai-assessment-rubrics';
import { ComprehensiveEvaluationResult, EvaluationResult } from './ai-evaluation-engine';

// Core interfaces for feedback generation
export interface FeedbackContext {
  student: {
    name: string;
    studentId: string;
    email: string;
  };
  academic: {
    sede: string;
    academicYear: string;
    division: string;
    subject: string;
  };
  week: {
    start: string;
    end: string;
    weekNumber?: number;
  };
  submittedAt: string;
}

export interface ProgressCalculation {
  weeklyProgress: number; // Percentage 0-100
  justification: string; // Clear explanation of calculation
  comparisonText: string; // Human-readable comparison
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  previousScore?: number;
  scoreChange?: number;
}

export interface PersonalizedRecommendations {
  strengths: string[];
  areasForImprovement: string[];
  specificActions: string[];
  studyStrategies: string[];
  subjectSpecific: string[];
  nextWeekFocus: string[];
}

export interface MarkdownFeedback {
  content: string; // Complete Markdown content
  metadata: {
    generatedAt: string;
    studentInfo: FeedbackContext['student'];
    academicInfo: FeedbackContext['academic'];
    weekInfo: FeedbackContext['week'];
    progressScore: number;
    overallLevel: string;
    wordCount: number;
    instructorReviewRequired: boolean;
  };
}

/**
 * EDUCATIONAL FEEDBACK CONTENT GENERATOR
 * Main class for generating personalized educational feedback
 */
export class FeedbackContentGenerator {
  private evaluationHistory: Map<string, EvaluationResult[]> = new Map();
  private subjectTemplates: Map<string, SubjectTemplate>;

  constructor() {
    this.subjectTemplates = this.initializeSubjectTemplates();
  }

  /**
   * MAIN FEEDBACK GENERATION METHOD
   * Generates complete personalized feedback from evaluation results
   */
  async generateCompleteFeedback(
    evaluationResults: EvaluationResult[],
    context: FeedbackContext,
    previousWeekResults?: EvaluationResult[]
  ): Promise<MarkdownFeedback> {
    try {
      // Calculate progress metrics
      const progress = this.calculateWeeklyProgress(evaluationResults, previousWeekResults);
      
      // Generate personalized recommendations
      const recommendations = this.generatePersonalizedRecommendations(
        evaluationResults, 
        context.academic.subject,
        context.academic.academicYear
      );
      
      // Create structured feedback sections
      const feedbackSections = this.createFeedbackSections(
        evaluationResults,
        progress,
        recommendations,
        context
      );
      
      // Generate final Markdown content
      const markdownContent = this.assembleMarkdownFeedback(
        feedbackSections,
        context,
        progress
      );
      
      // Calculate metadata
      const metadata = this.generateFeedbackMetadata(
        markdownContent,
        context,
        evaluationResults,
        progress
      );
      
      return {
        content: markdownContent,
        metadata
      };
      
    } catch (error) {
      console.error('Error generating feedback:', error);
      return this.generateErrorFeedback(context, error);
    }
  }

  /**
   * PROGRESS CALCULATION WITH JUSTIFICATION
   * Calculates meaningful weekly progress with clear mathematical reasoning
   */
  private calculateWeeklyProgress(
    currentResults: EvaluationResult[],
    previousResults?: EvaluationResult[]
  ): ProgressCalculation {
    // Calculate current week average score
    const currentAverage = currentResults.reduce((sum, result) => 
      sum + result.score.totalScore, 0) / currentResults.length;
    const currentPercentage = Math.round((currentAverage / 4) * 100);

    // Handle first week scenario
    if (!previousResults || previousResults.length === 0) {
      return {
        weeklyProgress: currentPercentage,
        justification: `Progreso inicial basado en ${currentResults.length} respuestas evaluadas. ` +
          `Puntaje promedio: ${currentAverage.toFixed(2)}/4.0 puntos (${currentPercentage}%)`,
        comparisonText: 'Primera semana de evaluación - estableciendo línea de base',
        trend: 'insufficient_data'
      };
    }

    // Calculate previous week average
    const previousAverage = previousResults.reduce((sum, result) => 
      sum + result.score.totalScore, 0) / previousResults.length;
    const previousPercentage = Math.round((previousAverage / 4) * 100);
    
    const scoreChange = currentAverage - previousAverage;
    const percentageChange = currentPercentage - previousPercentage;
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    if (Math.abs(scoreChange) < 0.2) trend = 'stable';
    else if (scoreChange > 0) trend = 'improving';
    else trend = 'declining';

    // Generate detailed justification
    const justification = this.generateProgressJustification(
      currentResults.length,
      currentAverage,
      currentPercentage,
      previousAverage,
      previousPercentage,
      scoreChange,
      trend
    );

    // Generate comparison text
    const comparisonText = this.generateProgressComparison(
      percentageChange,
      trend,
      currentPercentage,
      previousPercentage
    );

    return {
      weeklyProgress: currentPercentage,
      justification,
      comparisonText,
      trend,
      previousScore: previousPercentage,
      scoreChange: percentageChange
    };
  }

  /**
   * PERSONALIZED RECOMMENDATIONS GENERATOR
   * Creates specific, actionable recommendations based on evaluation results
   */
  private generatePersonalizedRecommendations(
    results: EvaluationResult[],
    subject: string,
    academicYear: string
  ): PersonalizedRecommendations {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const specificActions: string[] = [];
    const studyStrategies: string[] = [];
    const subjectSpecific: string[] = [];
    const nextWeekFocus: string[] = [];

    // Analyze each evaluation result
    results.forEach(result => {
      const rubric = getRubricById(result.questionId);
      if (!rubric) return;

      // Identify strengths (scores >= 3.0)
      if (result.score.totalScore >= 3.0) {
        strengths.push(...this.generateStrengthFeedback(result, rubric));
      }

      // Identify improvement areas (scores < 2.5)
      if (result.score.totalScore < 2.5) {
        areasForImprovement.push(...this.generateImprovementFeedback(result, rubric));
      }

      // Generate specific actions based on dimension scores
      specificActions.push(...this.generateSpecificActions(result, rubric));
    });

    // Add subject-specific recommendations
    subjectSpecific.push(...this.generateSubjectSpecificRecommendations(results, subject));
    
    // Add study strategies appropriate for academic level
    studyStrategies.push(...this.generateStudyStrategies(results, academicYear));
    
    // Generate next week focus areas
    nextWeekFocus.push(...this.generateNextWeekFocus(results));

    return {
      strengths: this.deduplicateAndLimit(strengths, 4),
      areasForImprovement: this.deduplicateAndLimit(areasForImprovement, 4),
      specificActions: this.deduplicateAndLimit(specificActions, 5),
      studyStrategies: this.deduplicateAndLimit(studyStrategies, 4),
      subjectSpecific: this.deduplicateAndLimit(subjectSpecific, 3),
      nextWeekFocus: this.deduplicateAndLimit(nextWeekFocus, 3)
    };
  }

  /**
   * FEEDBACK SECTIONS CREATOR
   * Creates structured sections for the Markdown feedback
   */
  private createFeedbackSections(
    results: EvaluationResult[],
    progress: ProgressCalculation,
    recommendations: PersonalizedRecommendations,
    context: FeedbackContext
  ): FeedbackSections {
    return {
      header: this.createFeedbackHeader(context, progress),
      summary: this.createExecutiveSummary(results, progress, context),
      achievements: this.createAchievementsSection(recommendations.strengths),
      improvements: this.createImprovementsSection(recommendations.areasForImprovement),
      recommendations: this.createRecommendationsSection(recommendations),
      nextSteps: this.createNextStepsSection(recommendations.nextWeekFocus),
      footer: this.createFeedbackFooter(context)
    };
  }

  /**
   * MARKDOWN ASSEMBLY
   * Assembles all sections into final Markdown content
   */
  private assembleMarkdownFeedback(
    sections: FeedbackSections,
    context: FeedbackContext,
    progress: ProgressCalculation
  ): string {
    return `${sections.header}

${sections.summary}

## 🎯 Logros Destacados

${sections.achievements}

## 📈 Áreas de Crecimiento

${sections.improvements}

## 💡 Recomendaciones Personalizadas

${sections.recommendations}

## 🚀 Próximos Pasos

${sections.nextSteps}

---

${sections.footer}`;
  }

  // ===== PRIVATE HELPER METHODS =====

  private generateProgressJustification(
    responseCount: number,
    currentAverage: number,
    currentPercentage: number,
    previousAverage: number,
    previousPercentage: number,
    scoreChange: number,
    trend: string
  ): string {
    let justification = `Progreso calculado basado en ${responseCount} respuestas evaluadas. `;
    justification += `Puntaje promedio actual: ${currentAverage.toFixed(2)}/4.0 puntos (${currentPercentage}%). `;
    
    if (trend !== 'insufficient_data') {
      justification += `Semana anterior: ${previousAverage.toFixed(2)}/4.0 puntos (${previousPercentage}%). `;
      
      const changeDirection = scoreChange > 0 ? 'mejora' : 'disminución';
      const changeAmount = Math.abs(scoreChange).toFixed(2);
      justification += `${changeDirection.charAt(0).toUpperCase() + changeDirection.slice(1)} de ${changeAmount} puntos desde la semana anterior.`;
    }
    
    return justification;
  }

  private generateProgressComparison(
    percentageChange: number,
    trend: string,
    currentPercentage: number,
    previousPercentage: number
  ): string {
    switch (trend) {
      case 'improving':
        return `📈 Progreso positivo: ${Math.abs(percentageChange)}% de mejora respecto a la semana anterior (${previousPercentage}% → ${currentPercentage}%)`;
      case 'declining':
        return `📉 Área de atención: ${Math.abs(percentageChange)}% de disminución respecto a la semana anterior (${previousPercentage}% → ${currentPercentage}%)`;
      case 'stable':
        return `📊 Desempeño estable: variación mínima respecto a la semana anterior (${currentPercentage}%)`;
      default:
        return `📊 Evaluación inicial establecida en ${currentPercentage}%`;
    }
  }

  private generateStrengthFeedback(result: EvaluationResult, rubric: QuestionRubric): string[] {
    const strengths: string[] = [];
    const questionLabel = this.getQuestionLabel(rubric.questionId);
    
    if (result.score.overallLevel === 'excellent') {
      strengths.push(`Excelente reflexión en **${questionLabel}** - demuestra comprensión profunda y metacognición avanzada`);
    } else if (result.score.overallLevel === 'proficient') {
      strengths.push(`Buena capacidad de reflexión en **${questionLabel}** - muestra comprensión sólida del tema`);
    }
    
    return strengths;
  }

  private generateImprovementFeedback(result: EvaluationResult, rubric: QuestionRubric): string[] {
    const improvements: string[] = [];
    const questionLabel = this.getQuestionLabel(rubric.questionId);
    
    if (result.score.overallLevel === 'insufficient') {
      improvements.push(`**${questionLabel}** requiere mayor desarrollo - necesita respuestas más específicas y detalladas`);
    } else if (result.score.overallLevel === 'developing') {
      improvements.push(`**${questionLabel}** tiene potencial de mejora - agregar más ejemplos concretos y análisis profundo`);
    }
    
    return improvements;
  }

  private generateSpecificActions(result: EvaluationResult, rubric: QuestionRubric): string[] {
    const actions: string[] = [];
    const questionLabel = this.getQuestionLabel(rubric.questionId);
    
    // Analyze dimension scores for specific recommendations
    Object.entries(result.score.dimensionScores).forEach(([dimension, score]) => {
      if (score < 2.0) {
        switch (dimension) {
          case 'topic_identification':
            actions.push(`Mejorar la identificación específica de temas en ${questionLabel} usando terminología técnica correcta`);
            break;
          case 'example_specificity':
            actions.push(`Incluir ejemplos más detallados y específicos en ${questionLabel} con números, fórmulas o procedimientos`);
            break;
          case 'difficulty_identification':
            actions.push(`Ser más específico al identificar dificultades reales de aprendizaje en ${questionLabel}`);
            break;
          case 'connection_quality':
            actions.push(`Desarrollar conexiones más profundas entre conceptos en ${questionLabel}`);
            break;
        }
      }
    });
    
    return actions;
  }

  private generateSubjectSpecificRecommendations(results: EvaluationResult[], subject: string): string[] {
    const adaptations = subjectAdaptations[subject as keyof typeof subjectAdaptations];
    if (!adaptations) return [];
    
    const recommendations: string[] = [];
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    
    if (averageScore < 2.5) {
      switch (subject) {
        case 'Matemáticas':
          recommendations.push('Practicar la resolución paso a paso de problemas matemáticos');
          recommendations.push('Revisar conceptos fundamentales y fórmulas antes de resolver ejercicios');
          break;
        case 'Física':
          recommendations.push('Relacionar fenómenos físicos observados con principios teóricos estudiados');
          recommendations.push('Practicar la aplicación de fórmulas físicas en problemas reales');
          break;
        case 'Química':
          recommendations.push('Visualizar reacciones químicas mediante diagramas y ecuaciones balanceadas');
          recommendations.push('Conectar conceptos moleculares con observaciones de laboratorio');
          break;
      }
    }
    
    return recommendations;
  }

  private generateStudyStrategies(results: EvaluationResult[], academicYear: string): string[] {
    const strategies: string[] = [];
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    
    // Strategies based on academic level
    const isAdvancedLevel = academicYear.includes('5to') || academicYear.includes('6to');
    
    if (averageScore < 2.0) {
      strategies.push('Crear resúmenes semanales con los conceptos principales estudiados');
      strategies.push('Establecer un horario fijo de estudio diario de 30-45 minutos');
      
      if (isAdvancedLevel) {
        strategies.push('Formar grupos de estudio con compañeros para discutir conceptos complejos');
        strategies.push('Utilizar mapas conceptuales para visualizar relaciones entre temas');
      } else {
        strategies.push('Repasar apuntes inmediatamente después de cada clase');
        strategies.push('Hacer preguntas específicas al docente sobre dudas concretas');
      }
    } else if (averageScore < 3.0) {
      strategies.push('Profundizar en ejercicios de aplicación práctica');
      strategies.push('Buscar ejemplos adicionales en libros de texto o recursos en línea');
    }
    
    return strategies;
  }

  private generateNextWeekFocus(results: EvaluationResult[]): string[] {
    const focus: string[] = [];
    
    // Find the lowest scoring area for focused improvement
    const lowestScore = Math.min(...results.map(r => r.score.totalScore));
    const lowestResult = results.find(r => r.score.totalScore === lowestScore);
    
    if (lowestResult) {
      const questionLabel = this.getQuestionLabel(lowestResult.questionId);
      focus.push(`Concentrarse en mejorar la calidad de respuesta en **${questionLabel}**`);
    }
    
    // General focus areas based on overall performance
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    
    if (averageScore < 2.5) {
      focus.push('Dedicar más tiempo a la reflexión antes de escribir las respuestas');
      focus.push('Incluir ejemplos específicos y detalles concretos en cada respuesta');
    } else if (averageScore < 3.5) {
      focus.push('Buscar conexiones más profundas entre diferentes conceptos aprendidos');
    }
    
    return focus;
  }

  private createFeedbackHeader(context: FeedbackContext, progress: ProgressCalculation): string {
    const weekRange = this.formatWeekRange(context.week.start, context.week.end);
    const progressEmoji = this.getProgressEmoji(progress.trend);
    
    return `# 📋 Reporte de Progreso Semanal

**Estudiante:** ${context.student.name}  
**Materia:** ${context.academic.subject}  
**Período:** ${weekRange}  
**Sede:** ${context.academic.sede} - ${context.academic.academicYear} "${context.academic.division}"

---

## ${progressEmoji} Progreso Semanal: ${progress.weeklyProgress}%

${progress.comparisonText}

**Justificación:** ${progress.justification}`;
  }

  private createExecutiveSummary(results: EvaluationResult[], progress: ProgressCalculation, context: FeedbackContext): string {
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    const performanceLevel = this.getPerformanceLevelText(averageScore);
    const engagementLevel = this.getEngagementLevel(results);
    
    return `## 📊 Resumen Ejecutivo

Tu nivel de reflexión esta semana se encuentra en **${performanceLevel}** con un promedio de ${averageScore.toFixed(2)}/4.0 puntos. ${this.getEngagementText(engagementLevel)} Las respuestas muestran ${this.getSummaryText(averageScore, context.academic.subject)}.`;
  }

  private createAchievementsSection(strengths: string[]): string {
    if (strengths.length === 0) {
      return 'Esta semana es una oportunidad para establecer bases sólidas en tu proceso de reflexión. ¡Cada pequeño paso cuenta!';
    }
    
    return strengths.map(strength => `- ${strength}`).join('\n');
  }

  private createImprovementsSection(improvements: string[]): string {
    if (improvements.length === 0) {
      return '¡Excelente trabajo! Tu nivel de reflexión está bien desarrollado en todas las áreas evaluadas.';
    }
    
    return improvements.map(improvement => `- ${improvement}`).join('\n');
  }

  private createRecommendationsSection(recommendations: PersonalizedRecommendations): string {
    let content = '';
    
    if (recommendations.specificActions.length > 0) {
      content += '### 🎯 Acciones Específicas\n\n';
      content += recommendations.specificActions.map(action => `- ${action}`).join('\n') + '\n\n';
    }
    
    if (recommendations.studyStrategies.length > 0) {
      content += '### 📚 Estrategias de Estudio\n\n';
      content += recommendations.studyStrategies.map(strategy => `- ${strategy}`).join('\n') + '\n\n';
    }
    
    if (recommendations.subjectSpecific.length > 0) {
      content += '### 🔬 Recomendaciones Específicas de Materia\n\n';
      content += recommendations.subjectSpecific.map(rec => `- ${rec}`).join('\n');
    }
    
    return content || 'Continúa con tu excelente trabajo manteniendo la calidad de tus reflexiones.';
  }

  private createNextStepsSection(nextWeekFocus: string[]): string {
    if (nextWeekFocus.length === 0) {
      return '- Mantener el nivel actual de reflexión\n- Continuar desarrollando la capacidad de autoevaluación\n- Buscar nuevas conexiones entre los conceptos aprendidos';
    }
    
    return nextWeekFocus.map(step => `- ${step}`).join('\n');
  }

  private createFeedbackFooter(context: FeedbackContext): string {
    const generatedAt = new Date().toLocaleString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `*Reporte generado automáticamente el ${generatedAt}*  
*Sistema de Evaluación Inteligente - Plataforma Intellego*

> **Nota para instructores:** Este reporte ha sido generado mediante inteligencia artificial basada en rúbricas educativas específicas. Se recomienda revisión antes del envío final al estudiante.`;
  }

  // ===== UTILITY METHODS =====

  private getQuestionLabel(questionId: string): string {
    const labels: { [key: string]: string } = {
      'temasYDominio': 'Temas y Dominio',
      'evidenciaAprendizaje': 'Evidencia de Aprendizaje',
      'dificultadesEstrategias': 'Dificultades y Estrategias',
      'conexionesAplicacion': 'Conexiones y Aplicación',
      'comentariosAdicionales': 'Comentarios Adicionales'
    };
    return labels[questionId] || questionId;
  }

  private getProgressEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '📊';
      default: return '📋';
    }
  }

  private getPerformanceLevelText(score: number): string {
    if (score >= 3.5) return 'Excelente';
    if (score >= 2.5) return 'Competente';
    if (score >= 1.5) return 'En Desarrollo';
    return 'Requiere Atención';
  }

  private getEngagementLevel(results: EvaluationResult[]): 'high' | 'medium' | 'low' {
    const averageConfidence = results.reduce((sum, r) => sum + r.score.confidenceScore, 0) / results.length;
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    
    const engagementMetric = (averageScore * 0.7) + (averageConfidence * 0.3 * 4);
    
    if (engagementMetric >= 3) return 'high';
    if (engagementMetric >= 2) return 'medium';
    return 'low';
  }

  private getEngagementText(level: string): string {
    switch (level) {
      case 'high': return 'Se observa un alto nivel de compromiso con el proceso de reflexión.';
      case 'medium': return 'Se muestra un compromiso adecuado con las actividades reflexivas.';
      case 'low': return 'Hay oportunidades para aumentar el compromiso con la reflexión semanal.';
      default: return '';
    }
  }

  private getSummaryText(score: number, subject: string): string {
    if (score >= 3.0) {
      return `una comprensión sólida de los conceptos de ${subject} y capacidad reflexiva bien desarrollada`;
    } else if (score >= 2.0) {
      return `un entendimiento básico de ${subject} con potencial para profundizar la reflexión`;
    } else {
      return `necesidad de fortalecer la comprensión conceptual y desarrollar habilidades de autorreflexión`;
    }
  }

  private formatWeekRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const startFormatted = startDate.toLocaleDateString('es-AR', options);
    const endFormatted = endDate.toLocaleDateString('es-AR', options);
    
    return `${startFormatted} - ${endFormatted}`;
  }

  private deduplicateAndLimit(items: string[], limit: number): string[] {
    const unique = Array.from(new Set(items));
    return unique.slice(0, limit);
  }

  private generateFeedbackMetadata(
    content: string,
    context: FeedbackContext,
    results: EvaluationResult[],
    progress: ProgressCalculation
  ) {
    const averageScore = results.reduce((sum, r) => sum + r.score.totalScore, 0) / results.length;
    const overallLevel = this.getPerformanceLevelText(averageScore);
    const wordCount = content.split(/\s+/).length;
    
    return {
      generatedAt: new Date().toISOString(),
      studentInfo: context.student,
      academicInfo: context.academic,
      weekInfo: context.week,
      progressScore: progress.weeklyProgress,
      overallLevel,
      wordCount,
      instructorReviewRequired: averageScore < 2.0 || progress.trend === 'declining'
    };
  }

  private generateErrorFeedback(context: FeedbackContext, error: any): MarkdownFeedback {
    const errorContent = `# ⚠️ Error en Generación de Feedback

**Estudiante:** ${context.student.name}  
**Materia:** ${context.academic.subject}  

Lo sentimos, hubo un problema al generar tu reporte de feedback personalizado.  
Por favor, contacta a tu instructor para obtener asistencia.

**Error técnico:** ${error.message || 'Error desconocido'}`;

    return {
      content: errorContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        studentInfo: context.student,
        academicInfo: context.academic,
        weekInfo: context.week,
        progressScore: 0,
        overallLevel: 'Error',
        wordCount: errorContent.split(/\s+/).length,
        instructorReviewRequired: true
      }
    };
  }

  private initializeSubjectTemplates(): Map<string, SubjectTemplate> {
    // This would contain subject-specific templates and adaptations
    // Implementation details would depend on specific subject requirements
    return new Map();
  }
}

// ===== SUPPORTING INTERFACES =====

interface FeedbackSections {
  header: string;
  summary: string;
  achievements: string;
  improvements: string;
  recommendations: string;
  nextSteps: string;
  footer: string;
}

interface SubjectTemplate {
  name: string;
  adaptations: string[];
  vocabularyExpectations: string[];
  recommendationTemplates: string[];
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a new FeedbackContentGenerator instance
 */
export function createFeedbackGenerator(): FeedbackContentGenerator {
  return new FeedbackContentGenerator();
}

/**
 * Validates feedback content for quality and completeness
 */
export function validateFeedbackContent(feedback: MarkdownFeedback): {
  isValid: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 100;
  
  // Check minimum word count
  if (feedback.metadata.wordCount < 200) {
    issues.push('Feedback content too short - minimum 200 words required');
    score -= 20;
  }
  
  // Check for required sections
  const requiredSections = ['Logros', 'Áreas de Crecimiento', 'Recomendaciones', 'Próximos Pasos'];
  requiredSections.forEach(section => {
    if (!feedback.content.includes(section)) {
      issues.push(`Missing required section: ${section}`);
      score -= 15;
    }
  });
  
  // Check progress justification
  if (!feedback.content.includes('Justificación:')) {
    issues.push('Missing progress justification');
    score -= 10;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Exports feedback content to different formats
 */
export function exportFeedbackContent(feedback: MarkdownFeedback, format: 'html' | 'pdf' | 'json'): string {
  switch (format) {
    case 'html':
      // Convert Markdown to HTML (would need markdown parser)
      return feedback.content; // Placeholder
    case 'pdf':
      // Convert to PDF format (would need PDF generator)
      return feedback.content; // Placeholder
    case 'json':
      return JSON.stringify({
        content: feedback.content,
        metadata: feedback.metadata
      }, null, 2);
    default:
      return feedback.content;
  }
}

export default FeedbackContentGenerator;