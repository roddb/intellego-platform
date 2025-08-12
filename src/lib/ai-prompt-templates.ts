/**
 * AI Prompt Templates for Automated Assessment
 * 
 * These templates use the latest prompt engineering best practices from the LM Evaluation Harness
 * and educational assessment literature to create consistent, reliable AI evaluations.
 */

import { QuestionRubric, CompositeScore, AssessmentCriteria } from './ai-assessment-rubrics';

export interface EvaluationContext {
  studentResponse: string;
  questionId: string;
  subject: string;
  studentInfo: {
    name: string;
    academicYear: string;
    division: string;
    sede: string;
  };
  weekInfo: {
    start: string;
    end: string;
  };
}

export interface AIEvaluationPrompt {
  systemPrompt: string;
  userPrompt: string;
  expectedOutputFormat: string;
}

/**
 * SYSTEM PROMPT TEMPLATE
 * Based on best practices from Context7 educational assessment systems
 */
const SYSTEM_PROMPT_BASE = `You are an expert educational assessment specialist for the Intellego Platform, a student progress tracking system in Argentina. Your role is to evaluate weekly student reflection reports using scientifically-validated rubrics.

## Core Assessment Principles:
1. **Objectivity**: Base evaluations strictly on observable evidence in student responses
2. **Consistency**: Apply rubric criteria uniformly across all assessments
3. **Growth-Oriented**: Focus on learning progress and constructive feedback
4. **Cultural Context**: Consider Argentine educational context and Spanish language nuances
5. **Subject Specificity**: Adapt evaluations to the specific academic subject

## Assessment Methodology:
- Use the provided rubric dimensions and scoring criteria exactly as specified
- Provide evidence-based justification for all scores assigned
- Generate actionable feedback that promotes student learning
- Identify specific areas for improvement with concrete suggestions
- Maintain appropriate academic level expectations for the student's grade

## Output Requirements:
- Assign scores (1-4) for each rubric dimension with detailed justification
- Calculate weighted composite scores accurately
- Provide specific, actionable feedback in Spanish
- Generate concrete recommendations for learning improvement
- Indicate confidence level (0-1) in the assessment accuracy

You must evaluate responses fairly regardless of length, focusing on quality of content rather than quantity of text.`;

/**
 * QUESTION-SPECIFIC PROMPT TEMPLATES
 */

export function generateEvaluationPrompt(
  context: EvaluationContext,
  rubric: QuestionRubric
): AIEvaluationPrompt {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

## Current Assessment Context:
- **Subject**: ${context.subject}
- **Student**: ${context.studentInfo.name} (${context.studentInfo.academicYear}, División ${context.studentInfo.division}, Sede ${context.studentInfo.sede})
- **Week**: ${context.weekInfo.start} to ${context.weekInfo.end}
- **Question**: ${rubric.questionText}

## Learning Objectives for This Question:
${rubric.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Evaluation Rubric:
${formatRubricForPrompt(rubric)}

## Subject-Specific Considerations for ${context.subject}:
${getSubjectSpecificGuidance(context.subject, rubric.questionId)}`;

  const userPrompt = `Please evaluate the following student response using the provided rubric:

**Question**: ${rubric.questionText}
**Student Response**: "${context.studentResponse}"

**Required Analysis**:
1. Analyze the response against each rubric dimension
2. Assign scores (1-4) with detailed justification
3. Identify specific strengths and areas for improvement
4. Consider the academic level appropriate for ${context.studentInfo.academicYear}
5. Provide constructive feedback in Spanish
6. Generate specific recommendations for learning growth

**Important Evaluation Guidelines**:
- Base scores ONLY on observable evidence in the student's response
- Do not penalize for brevity if quality is present
- Do not assume knowledge not explicitly demonstrated
- Consider effort and engagement even if technical accuracy is limited
- Provide encouraging feedback that motivates continued learning

Please provide your assessment in the specified JSON format.`;

  const expectedOutputFormat = `{
  "questionId": "${rubric.questionId}",
  "dimensionScores": {
    ${rubric.criteria.map(c => `"${c.dimension}": <score_1_to_4>`).join(',\n    ')}
  },
  "dimensionJustifications": {
    ${rubric.criteria.map(c => `"${c.dimension}": "<detailed_justification_in_spanish>"`).join(',\n    ')}
  },
  "overallAnalysis": "<comprehensive_analysis_in_spanish>",
  "strengths": ["<strength_1>", "<strength_2>"],
  "improvements": ["<improvement_area_1>", "<improvement_area_2>"],
  "specificFeedback": "<personalized_feedback_in_spanish>",
  "recommendations": ["<concrete_recommendation_1>", "<concrete_recommendation_2>"],
  "confidenceScore": <0_to_1_confidence_level>,
  "evaluationNotes": "<any_special_considerations_or_notes>"
}`;

  return {
    systemPrompt,
    userPrompt,
    expectedOutputFormat
  };
}

/**
 * RUBRIC FORMATTING FOR PROMPTS
 */
function formatRubricForPrompt(rubric: QuestionRubric): string {
  return rubric.criteria.map(criterion => `
### ${criterion.dimension.toUpperCase()} (Weight: ${criterion.weight * 100}%)
**Description**: ${criterion.description}

**Scoring Levels**:
- **4 (Excellent)**: ${criterion.rubric.excellent.description}
  ${criterion.rubric.excellent.indicators.map(i => `  • ${i}`).join('\n')}
- **3 (Proficient)**: ${criterion.rubric.proficient.description}
  ${criterion.rubric.proficient.indicators.map(i => `  • ${i}`).join('\n')}
- **2 (Developing)**: ${criterion.rubric.developing.description}
  ${criterion.rubric.developing.indicators.map(i => `  • ${i}`).join('\n')}
- **1 (Insufficient)**: ${criterion.rubric.insufficient.description}
  ${criterion.rubric.insufficient.indicators.map(i => `  • ${i}`).join('\n')}
`).join('\n');
}

/**
 * SUBJECT-SPECIFIC GUIDANCE
 */
function getSubjectSpecificGuidance(subject: string, questionId: string): string {
  const guidanceMap: { [key: string]: { [key: string]: string } } = {
    'Matemáticas': {
      'temasYDominio': `
- Look for specific mathematical concepts, formulas, or procedures mentioned
- Evaluate understanding of mathematical reasoning and problem-solving methods
- Consider computational accuracy and mathematical language use
- Assess awareness of conceptual vs. procedural knowledge`,
      
      'evidenciaAprendizaje': `
- Expect numerical examples, calculations, or specific problem solutions
- Look for step-by-step mathematical reasoning
- Evaluate correctness of mathematical procedures used
- Consider mathematical communication clarity`,
      
      'dificultadesEstrategias': `
- Focus on specific mathematical concepts causing difficulty
- Look for problem-solving strategy identification
- Evaluate awareness of mathematical thinking processes
- Consider computational vs. conceptual difficulties`,
      
      'conexionesAplicacion': `
- Look for connections between mathematical topics
- Evaluate transfer to real-world applications
- Consider integration of mathematical concepts
- Assess systems thinking in mathematical contexts`,
      
      'comentariosAdicionales': `
- Consider mathematical mindset and attitudes
- Look for mathematical curiosity or questions
- Evaluate mathematical communication skills
- Consider suggestions for mathematical learning`
    },
    
    'Física': {
      'temasYDominio': `
- Look for specific physics principles, laws, or phenomena mentioned
- Evaluate understanding of experimental vs. theoretical concepts
- Consider use of physics terminology and measurement units
- Assess awareness of mathematical applications in physics`,
      
      'evidenciaAprendizaje': `
- Expect experimental examples, observations, or calculations
- Look for application of physics principles to specific situations
- Evaluate understanding of cause-and-effect relationships
- Consider real-world physics applications`,
      
      'dificultadesEstrategias': `
- Focus on conceptual vs. mathematical difficulties in physics
- Look for experimental design or measurement challenges
- Evaluate awareness of abstract concept comprehension
- Consider visualization and modeling difficulties`,
      
      'conexionesAplicacion': `
- Look for connections between physics and mathematics
- Evaluate transfer to everyday phenomena
- Consider integration with other sciences
- Assess understanding of physics in technology`,
      
      'comentariosAdicionales': `
- Consider scientific curiosity and inquiry attitudes
- Look for questions about natural phenomena
- Evaluate scientific communication skills
- Consider interest in experimental work`
    },
    
    'Química': {
      'temasYDominio': `
- Look for specific chemical concepts, reactions, or compounds mentioned
- Evaluate understanding of molecular vs. macroscopic perspectives
- Consider use of chemical terminology and safety awareness
- Assess laboratory technique understanding`,
      
      'evidenciaAprendizaje': `
- Expect chemical reaction examples, laboratory procedures, or calculations
- Look for molecular-level explanations of chemical phenomena
- Evaluate safety protocol awareness
- Consider quantitative chemistry applications`,
      
      'dificultadesEstrategias': `
- Focus on abstract molecular concepts vs. observable phenomena
- Look for laboratory technique or safety challenges
- Evaluate mathematical applications in chemistry
- Consider visualization of molecular processes`,
      
      'conexionesAplicacion': `
- Look for connections between chemistry and daily life
- Evaluate transfer to environmental or health contexts
- Consider integration with biology or physics
- Assess understanding of chemistry in industry`,
      
      'comentariosAdicionales': `
- Consider scientific inquiry and experimental curiosity
- Look for questions about chemical processes
- Evaluate scientific communication and safety awareness
- Consider interest in real-world chemistry applications`
    }
  };

  return guidanceMap[subject]?.[questionId] || `
- Apply general academic assessment principles
- Consider subject-specific vocabulary and concepts
- Evaluate depth of understanding appropriate for the academic level
- Look for evidence of engaged learning in this subject area`;
}

/**
 * MULTI-STEP EVALUATION PROMPT
 * For comprehensive assessment across all questions in a weekly report
 */
export function generateComprehensiveEvaluationPrompt(
  responses: { [questionId: string]: string },
  context: Omit<EvaluationContext, 'studentResponse' | 'questionId'>,
  rubrics: QuestionRubric[]
): AIEvaluationPrompt {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

## Comprehensive Weekly Report Assessment
You are evaluating a complete weekly learning reflection report with multiple questions. Assess each response independently using its specific rubric, then provide an overall learning trajectory analysis.

## Assessment Context:
- **Subject**: ${context.subject}
- **Student**: ${context.studentInfo.name} (${context.studentInfo.academicYear}, División ${context.studentInfo.division})
- **Week**: ${context.weekInfo.start} to ${context.weekInfo.end}

## Complete Rubric Set:
${rubrics.map(rubric => `
### ${rubric.questionText} (${rubric.questionId})
${formatRubricForPrompt(rubric)}
`).join('\n')}`;

  const userPrompt = `Please evaluate this complete weekly reflection report:

${Object.entries(responses).map(([questionId, response], index) => `
**Question ${index + 1}**: ${rubrics.find(r => r.questionId === questionId)?.questionText}
**Student Response**: "${response}"
`).join('\n')}

**Required Comprehensive Analysis**:
1. Evaluate each response against its specific rubric
2. Identify learning patterns across all responses
3. Assess overall engagement and reflection quality
4. Provide integrated feedback considering all responses
5. Generate holistic recommendations for continued learning
6. Note any concerning patterns or exceptional insights

Focus on the student's learning journey and growth trajectory.`;

  const expectedOutputFormat = `{
  "individualAssessments": {
    ${Object.keys(responses).map(qId => `"${qId}": {
      "dimensionScores": { /* scores for each dimension */ },
      "dimensionJustifications": { /* justifications in Spanish */ },
      "specificFeedback": "<feedback_for_this_question>"
    }`).join(',\n    ')}
  },
  "comprehensiveAnalysis": {
    "overallEngagement": "<analysis_of_student_engagement>",
    "learningPatterns": ["<pattern_1>", "<pattern_2>"],
    "strengthsAcrossQuestions": ["<strength_1>", "<strength_2>"],
    "improvementAreasAcrossQuestions": ["<area_1>", "<area_2>"],
    "metacognitiveEvidence": "<evidence_of_self_reflection>",
    "subjectSpecificInsights": "<insights_specific_to_${context.subject}>"
  },
  "integratedFeedback": "<comprehensive_feedback_in_spanish>",
  "holisticRecommendations": ["<recommendation_1>", "<recommendation_2>"],
  "confidenceScore": <0_to_1_confidence_level>,
  "teacherNotifications": ["<any_concerns_or_highlights_for_instructor>"]
}`;

  return {
    systemPrompt,
    userPrompt,
    expectedOutputFormat
  };
}

/**
 * CALIBRATION AND VALIDATION PROMPTS
 * For ensuring assessment quality and consistency
 */
export function generateCalibrationPrompt(
  sampleResponses: Array<{
    response: string;
    expertScore: CompositeScore;
    questionId: string;
  }>,
  rubric: QuestionRubric
): AIEvaluationPrompt {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

## Calibration Mode
You are in calibration mode to ensure consistent assessment quality. Compare your evaluations with expert scores to identify any systematic biases or inconsistencies in your assessment approach.

## Calibration Rubric:
${formatRubricForPrompt(rubric)}`;

  const userPrompt = `Please evaluate these sample responses and compare your assessments with the provided expert scores:

${sampleResponses.map((sample, index) => `
**Sample ${index + 1}**:
Response: "${sample.response}"
Expert Score: ${sample.expertScore.totalScore} (${sample.expertScore.overallLevel})
Expert Dimension Scores: ${JSON.stringify(sample.expertScore.dimensionScores, null, 2)}

Your Assessment:
`).join('\n')}

Analyze any differences between your scores and the expert scores. Identify patterns in your assessment that might need calibration.`;

  const expectedOutputFormat = `{
  "assessments": [
    {
      "sampleNumber": 1,
      "yourScores": { /* your dimension scores */ },
      "expertScores": { /* expert dimension scores */ },
      "differences": { /* score differences by dimension */ },
      "analysis": "<analysis_of_differences>"
    }
  ],
  "calibrationAnalysis": "<overall_pattern_analysis>",
  "identifiedBiases": ["<bias_1>", "<bias_2>"],
  "adjustmentStrategies": ["<strategy_1>", "<strategy_2>"],
  "confidenceInCalibration": <0_to_1_confidence_level>
}`;

  return {
    systemPrompt,
    userPrompt,
    expectedOutputFormat
  };
}

/**
 * FEEDBACK GENERATION PROMPTS
 * For generating student-facing feedback reports
 */
export function generateFeedbackReportPrompt(
  assessments: CompositeScore[],
  studentInfo: EvaluationContext['studentInfo'],
  subject: string
): AIEvaluationPrompt {
  const systemPrompt = `You are generating a comprehensive, encouraging feedback report for a student based on their weekly reflection assessments. The feedback should be:

1. **Encouraging and Growth-Oriented**: Focus on progress and potential
2. **Specific and Actionable**: Provide concrete next steps
3. **Culturally Appropriate**: Use appropriate Spanish and Argentine educational context
4. **Age-Appropriate**: Match the student's academic level (${studentInfo.academicYear})
5. **Balanced**: Acknowledge both strengths and growth areas

The report should motivate continued learning and self-reflection.`;

  const userPrompt = `Generate a comprehensive feedback report for:
**Student**: ${studentInfo.name}
**Course**: ${subject}
**Academic Level**: ${studentInfo.academicYear}, División ${studentInfo.division}

**Assessment Results**:
${assessments.map(assessment => `
- ${assessment.questionId}: ${assessment.totalScore}/4 (${assessment.overallLevel})
  Strengths: ${assessment.feedback.filter(f => f.includes('fortaleza') || f.includes('bien')).join(', ')}
  Growth Areas: ${assessment.recommendations.join(', ')}
`).join('\n')}

Generate an inspiring, personalized feedback report that celebrates learning progress and provides clear guidance for continued growth.`;

  const expectedOutputFormat = `{
  "reportTitle": "Reporte de Progreso - ${subject}",
  "personalizedGreeting": "<warm_greeting_with_student_name>",
  "overallProgress": "<summary_of_learning_progress>",
  "strengthsHighlight": "<celebration_of_key_strengths>",
  "growthAreas": "<encouraging_description_of_improvement_areas>",
  "specificRecommendations": ["<actionable_recommendation_1>", "<actionable_recommendation_2>"],
  "encouragingMessage": "<motivational_closing_message>",
  "nextStepsFocus": "<clear_focus_areas_for_next_week>",
  "metacognitiveDevelopment": "<feedback_on_self_reflection_skills>"
}`;

  return {
    systemPrompt,
    userPrompt,
    expectedOutputFormat
  };
}

/**
 * PROMPT VALIDATION AND TESTING
 */
export interface PromptValidationTest {
  testName: string;
  context: EvaluationContext;
  expectedBehavior: string;
  validationCriteria: string[];
}

export const promptValidationTests: PromptValidationTest[] = [
  {
    testName: 'Short Response Handling',
    context: {
      studentResponse: 'No entendí nada.',
      questionId: 'temasYDominio',
      subject: 'Matemáticas',
      studentInfo: { name: 'Test Student', academicYear: '4to Año', division: 'A', sede: 'Centro' },
      weekInfo: { start: '2025-01-01', end: '2025-01-07' }
    },
    expectedBehavior: 'Should provide constructive feedback without penalizing brevity',
    validationCriteria: [
      'Does not assign lowest scores solely due to brevity',
      'Provides encouraging feedback',
      'Focuses on helping student overcome confusion',
      'Suggests specific next steps'
    ]
  },
  {
    testName: 'Excellent Response Recognition',
    context: {
      studentResponse: 'Esta semana trabajamos ecuaciones cuadráticas y su aplicación en problemas de física. Mi nivel de dominio es alto (4/5) porque puedo resolver la mayoría de los problemas usando la fórmula general y factorización. Sin embargo, aún me confundo cuando hay aplicaciones en movimiento parabólico, especialmente al identificar qué variable representa qué parámetro físico.',
      questionId: 'temasYDominio',
      subject: 'Matemáticas',
      studentInfo: { name: 'Test Student', academicYear: '4to Año', division: 'A', sede: 'Centro' },
      weekInfo: { start: '2025-01-01', end: '2025-01-07' }
    },
    expectedBehavior: 'Should recognize high-quality self-assessment and provide advanced feedback',
    validationCriteria: [
      'Assigns appropriate high scores for demonstrated mastery',
      'Recognizes specific terminology usage',
      'Acknowledges metacognitive awareness',
      'Provides feedback appropriate for advanced students'
    ]
  }
];

/**
 * EXPORT ALL TEMPLATES
 */
export const promptTemplates = {
  generateEvaluationPrompt,
  generateComprehensiveEvaluationPrompt,
  generateCalibrationPrompt,
  generateFeedbackReportPrompt,
  promptValidationTests
};