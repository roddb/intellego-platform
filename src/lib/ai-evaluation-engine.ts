/**
 * AI Evaluation Engine for Intellego Platform
 * 
 * Implements a sophisticated AI-powered assessment system using OpenAI's GPT models
 * with the custom rubrics and prompt templates designed for the platform's specific
 * weekly reflection questions.
 */

import { 
  QuestionRubric, 
  CompositeScore, 
  allRubrics, 
  getRubricById, 
  calculateCompositeScore 
} from './ai-assessment-rubrics';
import { 
  EvaluationContext, 
  generateEvaluationPrompt, 
  generateComprehensiveEvaluationPrompt,
  generateFeedbackReportPrompt
} from './ai-prompt-templates';

// OpenAI API types (would typically import from openai package)
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration interfaces
export interface AIEvaluationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  retries: number;
  timeout: number;
}

export interface EvaluationResult {
  questionId: string;
  score: CompositeScore;
  rawResponse: string;
  processingTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  errors?: string[];
}

export interface ComprehensiveEvaluationResult {
  studentInfo: EvaluationContext['studentInfo'];
  subject: string;
  weekInfo: EvaluationContext['weekInfo'];
  individualResults: EvaluationResult[];
  overallAnalysis: {
    averageScore: number;
    engagementLevel: 'high' | 'medium' | 'low';
    learningTrajectory: 'improving' | 'stable' | 'concerning';
    recommendedInterventions: string[];
  };
  comprehensiveFeedback: string;
  processingTime: number;
  totalTokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * AI EVALUATION ENGINE CLASS
 */
export class AIEvaluationEngine {
  private config: AIEvaluationConfig;
  private evaluationHistory: Map<string, EvaluationResult[]> = new Map();

  constructor(config: Partial<AIEvaluationConfig> = {}) {
    this.config = {
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 0.1, // Low temperature for consistency
      maxTokens: config.maxTokens || 2000,
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      retries: config.retries || 3,
      timeout: config.timeout || 30000
    };
  }

  /**
   * SINGLE QUESTION EVALUATION
   * Evaluates a single student response against its specific rubric
   */
  async evaluateResponse(context: EvaluationContext): Promise<EvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Get the appropriate rubric
      const rubric = getRubricById(context.questionId);
      if (!rubric) {
        throw new Error(`No rubric found for question ID: ${context.questionId}`);
      }

      // Generate evaluation prompt
      const prompt = generateEvaluationPrompt(context, rubric);
      
      // Call AI model with retry logic
      let rawResponse: string;
      let tokenUsage: any;
      
      for (let attempt = 1; attempt <= this.config.retries; attempt++) {
        try {
          const aiResponse = await this.callOpenAI([
            { role: 'system', content: prompt.systemPrompt },
            { role: 'user', content: prompt.userPrompt }
          ]);
          
          rawResponse = aiResponse.choices[0].message.content;
          tokenUsage = aiResponse.usage;
          break;
        } catch (error) {
          if (attempt === this.config.retries) {
            throw error;
          }
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }

      // Parse and validate response
      const parsedResult = this.parseEvaluationResponse(rawResponse!, context.questionId);
      
      // Calculate composite score
      const compositeScore = this.calculateCompositeScoreFromAI(parsedResult, rubric);

      const result: EvaluationResult = {
        questionId: context.questionId,
        score: compositeScore,
        rawResponse: rawResponse!,
        processingTime: Date.now() - startTime,
        tokenUsage,
        errors: parsedResult.errors
      };

      // Store in evaluation history
      this.storeEvaluationHistory(context, result);

      return result;

    } catch (error) {
      return {
        questionId: context.questionId,
        score: this.createErrorScore(context.questionId),
        rawResponse: '',
        processingTime: Date.now() - startTime,
        errors: [`Evaluation failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * COMPREHENSIVE WEEKLY REPORT EVALUATION
   * Evaluates all questions in a weekly report and provides holistic analysis
   */
  async evaluateWeeklyReport(
    responses: { [questionId: string]: string },
    context: Omit<EvaluationContext, 'studentResponse' | 'questionId'>
  ): Promise<ComprehensiveEvaluationResult> {
    const startTime = Date.now();
    let totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      // Evaluate each question individually
      const individualResults: EvaluationResult[] = [];
      
      for (const [questionId, response] of Object.entries(responses)) {
        const evaluationContext: EvaluationContext = {
          ...context,
          questionId,
          studentResponse: response
        };
        
        const result = await this.evaluateResponse(evaluationContext);
        individualResults.push(result);
        
        // Accumulate token usage
        if (result.tokenUsage) {
          totalTokenUsage.promptTokens += result.tokenUsage.promptTokens;
          totalTokenUsage.completionTokens += result.tokenUsage.completionTokens;
          totalTokenUsage.totalTokens += result.tokenUsage.totalTokens;
        }
      }

      // Generate comprehensive analysis
      const relevantRubrics = allRubrics.filter(rubric => 
        Object.keys(responses).includes(rubric.questionId)
      );
      
      const comprehensivePrompt = generateComprehensiveEvaluationPrompt(
        responses, 
        context, 
        relevantRubrics
      );

      // Get holistic analysis from AI
      const holisticResponse = await this.callOpenAI([
        { role: 'system', content: comprehensivePrompt.systemPrompt },
        { role: 'user', content: comprehensivePrompt.userPrompt }
      ]);

      const holisticAnalysis = this.parseComprehensiveResponse(holisticResponse.choices[0].message.content);
      
      if (holisticResponse.usage) {
        totalTokenUsage.promptTokens += holisticResponse.usage.prompt_tokens;
        totalTokenUsage.completionTokens += holisticResponse.usage.completion_tokens;
        totalTokenUsage.totalTokens += holisticResponse.usage.total_tokens;
      }

      // Generate student feedback report
      const feedbackPrompt = generateFeedbackReportPrompt(
        individualResults.map(r => r.score),
        context.studentInfo,
        context.subject
      );

      const feedbackResponse = await this.callOpenAI([
        { role: 'system', content: feedbackPrompt.systemPrompt },
        { role: 'user', content: feedbackPrompt.userPrompt }
      ]);

      const feedbackReport = this.parseFeedbackResponse(feedbackResponse.choices[0].message.content);

      if (feedbackResponse.usage) {
        totalTokenUsage.promptTokens += feedbackResponse.usage.prompt_tokens;
        totalTokenUsage.completionTokens += feedbackResponse.usage.completion_tokens;
        totalTokenUsage.totalTokens += feedbackResponse.usage.total_tokens;
      }

      // Calculate overall analysis
      const averageScore = individualResults.reduce((sum, result) => sum + result.score.totalScore, 0) / individualResults.length;
      const overallAnalysis = {
        averageScore,
        engagementLevel: this.calculateEngagementLevel(individualResults),
        learningTrajectory: this.assessLearningTrajectory(context.studentInfo.name, individualResults),
        recommendedInterventions: this.generateInterventionRecommendations(individualResults, holisticAnalysis)
      };

      return {
        studentInfo: context.studentInfo,
        subject: context.subject,
        weekInfo: context.weekInfo,
        individualResults,
        overallAnalysis,
        comprehensiveFeedback: feedbackReport.integratedFeedback,
        processingTime: Date.now() - startTime,
        totalTokenUsage
      };

    } catch (error) {
      throw new Error(`Comprehensive evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * BATCH PROCESSING FOR MULTIPLE STUDENTS
   */
  async evaluateMultipleStudents(
    studentReports: Array<{
      studentInfo: EvaluationContext['studentInfo'];
      subject: string;
      weekInfo: EvaluationContext['weekInfo'];
      responses: { [questionId: string]: string };
    }>
  ): Promise<ComprehensiveEvaluationResult[]> {
    const results: ComprehensiveEvaluationResult[] = [];
    
    // Process students in batches to avoid rate limiting
    const batchSize = 3; // Adjust based on API limits
    
    for (let i = 0; i < studentReports.length; i += batchSize) {
      const batch = studentReports.slice(i, i + batchSize);
      
      const batchPromises = batch.map(report => 
        this.evaluateWeeklyReport(report.responses, {
          studentInfo: report.studentInfo,
          subject: report.subject,
          weekInfo: report.weekInfo
        })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to evaluate student ${batch[index].studentInfo.name}:`, result.reason);
        }
      });
      
      // Delay between batches to respect rate limits
      if (i + batchSize < studentReports.length) {
        await this.delay(2000);
      }
    }
    
    return results;
  }

  /**
   * QUALITY ASSURANCE AND CALIBRATION
   */
  async calibrateModel(
    calibrationData: Array<{
      context: EvaluationContext;
      expertScore: CompositeScore;
    }>
  ): Promise<{
    accuracy: number;
    biasAnalysis: string;
    recommendedAdjustments: string[];
  }> {
    const calibrationResults = [];
    
    for (const sample of calibrationData) {
      const aiResult = await this.evaluateResponse(sample.context);
      
      calibrationResults.push({
        aiScore: aiResult.score,
        expertScore: sample.expertScore,
        difference: Math.abs(aiResult.score.totalScore - sample.expertScore.totalScore)
      });
    }
    
    const averageDifference = calibrationResults.reduce((sum, result) => sum + result.difference, 0) / calibrationResults.length;
    const accuracy = Math.max(0, 1 - (averageDifference / 4)); // Normalize to 0-1
    
    return {
      accuracy,
      biasAnalysis: this.analyzeBias(calibrationResults),
      recommendedAdjustments: this.generateCalibrationAdjustments(calibrationResults)
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */
  private async callOpenAI(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    // This would normally use the OpenAI SDK
    // For now, this is a placeholder that would need to be implemented
    // with proper error handling, rate limiting, etc.
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  private parseEvaluationResponse(rawResponse: string, questionId: string): any {
    try {
      // Clean the response (remove markdown formatting if present)
      const cleanResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      return {
        questionId,
        dimensionScores: {},
        errors: [`Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  private calculateCompositeScoreFromAI(parsedResult: any, rubric: QuestionRubric): CompositeScore {
    if (parsedResult.errors?.length > 0) {
      return this.createErrorScore(rubric.questionId);
    }

    try {
      return {
        questionId: rubric.questionId,
        totalScore: this.calculateWeightedScore(parsedResult.dimensionScores, rubric),
        dimensionScores: parsedResult.dimensionScores,
        overallLevel: this.determineOverallLevel(parsedResult.dimensionScores, rubric),
        confidenceScore: parsedResult.confidenceScore || 0.8,
        feedback: Array.isArray(parsedResult.specificFeedback) ? parsedResult.specificFeedback : [parsedResult.specificFeedback || ''],
        recommendations: parsedResult.recommendations || []
      };
    } catch (error) {
      return this.createErrorScore(rubric.questionId);
    }
  }

  private calculateWeightedScore(dimensionScores: { [key: string]: number }, rubric: QuestionRubric): number {
    let totalScore = 0;
    let totalWeight = 0;

    rubric.criteria.forEach(criterion => {
      const score = dimensionScores[criterion.dimension];
      if (score !== undefined && score >= 1 && score <= 4) {
        totalScore += score * criterion.weight;
        totalWeight += criterion.weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private determineOverallLevel(dimensionScores: { [key: string]: number }, rubric: QuestionRubric): 'excellent' | 'proficient' | 'developing' | 'insufficient' {
    const weightedScore = this.calculateWeightedScore(dimensionScores, rubric);
    
    if (weightedScore >= 3.5) return 'excellent';
    if (weightedScore >= 2.5) return 'proficient';
    if (weightedScore >= 1.5) return 'developing';
    return 'insufficient';
  }

  private createErrorScore(questionId: string): CompositeScore {
    return {
      questionId,
      totalScore: 0,
      dimensionScores: {},
      overallLevel: 'insufficient',
      confidenceScore: 0,
      feedback: ['Error occurred during evaluation'],
      recommendations: ['Please review the response and try again']
    };
  }

  private parseComprehensiveResponse(rawResponse: string): any {
    try {
      const cleanResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      return {
        comprehensiveAnalysis: {},
        integratedFeedback: 'Error processing comprehensive analysis',
        holisticRecommendations: []
      };
    }
  }

  private parseFeedbackResponse(rawResponse: string): any {
    try {
      const cleanResponse = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      return {
        integratedFeedback: 'Error generating feedback report'
      };
    }
  }

  private calculateEngagementLevel(results: EvaluationResult[]): 'high' | 'medium' | 'low' {
    const averageScore = results.reduce((sum, result) => sum + result.score.totalScore, 0) / results.length;
    const averageConfidence = results.reduce((sum, result) => sum + result.score.confidenceScore, 0) / results.length;
    
    // Consider both score and confidence
    const engagementMetric = (averageScore * 0.7) + (averageConfidence * 0.3 * 4);
    
    if (engagementMetric >= 3) return 'high';
    if (engagementMetric >= 2) return 'medium';
    return 'low';
  }

  private assessLearningTrajectory(studentName: string, currentResults: EvaluationResult[]): 'improving' | 'stable' | 'concerning' {
    const previousResults = this.evaluationHistory.get(studentName);
    
    if (!previousResults || previousResults.length === 0) {
      return 'stable'; // No history to compare
    }
    
    const currentAverage = currentResults.reduce((sum, result) => sum + result.score.totalScore, 0) / currentResults.length;
    const previousAverage = previousResults.reduce((sum, result) => sum + result.score.totalScore, 0) / previousResults.length;
    
    const difference = currentAverage - previousAverage;
    
    if (difference > 0.3) return 'improving';
    if (difference < -0.5) return 'concerning';
    return 'stable';
  }

  private generateInterventionRecommendations(
    results: EvaluationResult[], 
    holisticAnalysis: any
  ): string[] {
    const recommendations = [];
    
    // Check for low scores
    const lowScores = results.filter(r => r.score.totalScore < 2);
    if (lowScores.length > 1) {
      recommendations.push('Consider providing additional support for reflection skills');
    }
    
    // Check for inconsistent performance
    const scores = results.map(r => r.score.totalScore);
    const variance = this.calculateVariance(scores);
    if (variance > 1) {
      recommendations.push('Address inconsistent engagement across different reflection areas');
    }
    
    // Add holistic analysis recommendations if available
    if (holisticAnalysis?.teacherNotifications) {
      recommendations.push(...holisticAnalysis.teacherNotifications);
    }
    
    return recommendations;
  }

  private storeEvaluationHistory(context: EvaluationContext, result: EvaluationResult): void {
    const studentKey = `${context.studentInfo.name}_${context.subject}`;
    const history = this.evaluationHistory.get(studentKey) || [];
    
    // Keep only last 10 evaluations
    history.push(result);
    if (history.length > 10) {
      history.shift();
    }
    
    this.evaluationHistory.set(studentKey, history);
  }

  private analyzeBias(calibrationResults: any[]): string {
    const overestimations = calibrationResults.filter(r => r.aiScore.totalScore > r.expertScore.totalScore).length;
    const underestimations = calibrationResults.filter(r => r.aiScore.totalScore < r.expertScore.totalScore).length;
    
    if (overestimations > underestimations * 1.5) {
      return 'Model tends to overestimate student performance';
    } else if (underestimations > overestimations * 1.5) {
      return 'Model tends to underestimate student performance';
    }
    
    return 'Model shows balanced assessment patterns';
  }

  private generateCalibrationAdjustments(calibrationResults: any[]): string[] {
    const adjustments = [];
    const averageDifference = calibrationResults.reduce((sum, result) => sum + result.difference, 0) / calibrationResults.length;
    
    if (averageDifference > 0.5) {
      adjustments.push('Consider adjusting temperature parameter for more consistent scoring');
      adjustments.push('Review rubric interpretation in system prompts');
    }
    
    return adjustments;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * UTILITY FUNCTIONS AND EXPORTS
 */
export function createEvaluationEngine(config?: Partial<AIEvaluationConfig>): AIEvaluationEngine {
  return new AIEvaluationEngine(config);
}

export function validateEvaluationResult(result: EvaluationResult): boolean {
  return (
    result.score.totalScore >= 1 && result.score.totalScore <= 4 &&
    result.score.confidenceScore >= 0 && result.score.confidenceScore <= 1 &&
    Object.keys(result.score.dimensionScores).length > 0
  );
}

export function aggregateClassResults(results: ComprehensiveEvaluationResult[]): {
  classAverage: number;
  subjectDistribution: { [subject: string]: number };
  engagementSummary: { high: number; medium: number; low: number };
  commonGrowthAreas: string[];
} {
  const averageScores = results.map(r => r.overallAnalysis.averageScore);
  const classAverage = averageScores.reduce((sum, score) => sum + score, 0) / averageScores.length;

  const subjectDistribution: { [subject: string]: number } = {};
  const engagementSummary = { high: 0, medium: 0, low: 0 };
  const allRecommendations: string[] = [];

  results.forEach(result => {
    if (subjectDistribution[result.subject]) {
      subjectDistribution[result.subject]++;
    } else {
      subjectDistribution[result.subject] = 1;
    }

    engagementSummary[result.overallAnalysis.engagementLevel]++;
    allRecommendations.push(...result.overallAnalysis.recommendedInterventions);
  });

  // Find most common recommendations
  const recommendationCounts: { [key: string]: number } = {};
  allRecommendations.forEach(rec => {
    recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
  });

  const commonGrowthAreas = Object.entries(recommendationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([rec]) => rec);

  return {
    classAverage,
    subjectDistribution,
    engagementSummary,
    commonGrowthAreas
  };
}

// Export the main engine and utilities
export default AIEvaluationEngine;