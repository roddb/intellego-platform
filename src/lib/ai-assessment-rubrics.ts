/**
 * AI Assessment Rubrics for Intellego Platform
 * 
 * Question-specific evaluation criteria based on actual student weekly report questions.
 * Each rubric is tailored to the specific learning objectives and expected response types
 * of the five core questions in the WeeklyReportForm component.
 */

export interface AssessmentCriteria {
  dimension: string;
  weight: number; // 0-1, sum should equal 1 for each question
  description: string;
  rubric: {
    excellent: { score: 4; description: string; indicators: string[] };
    proficient: { score: 3; description: string; indicators: string[] };
    developing: { score: 2; description: string; indicators: string[] };
    insufficient: { score: 1; description: string; indicators: string[] };
  };
}

export interface QuestionRubric {
  questionId: string;
  questionText: string;
  learningObjectives: string[];
  criteria: AssessmentCriteria[];
  subjectAdaptations?: {
    [subject: string]: {
      criteria: Partial<AssessmentCriteria>[];
      specificIndicators: string[];
    };
  };
}

/**
 * RUBRIC 1: TEMAS Y DOMINIO 
 * Evaluates self-assessment accuracy and topic comprehension
 */
export const temasYDominioRubric: QuestionRubric = {
  questionId: 'temasYDominio',
  questionText: 'Temas trabajados y nivel de dominio',
  learningObjectives: [
    'Self-assessment of learning progress',
    'Topic identification and comprehension',
    'Metacognitive awareness of knowledge gaps'
  ],
  criteria: [
    {
      dimension: 'topic_identification',
      weight: 0.3,
      description: 'Accuracy and completeness in identifying specific topics covered',
      rubric: {
        excellent: {
          score: 4,
          description: 'Identifies all major topics with precise terminology',
          indicators: [
            'Uses subject-specific vocabulary correctly',
            'Mentions all key concepts from the week',
            'Demonstrates clear understanding of topic boundaries'
          ]
        },
        proficient: {
          score: 3,
          description: 'Identifies most topics with appropriate terminology',
          indicators: [
            'Uses mostly correct terminology',
            'Mentions most key concepts',
            'Shows good grasp of main topics'
          ]
        },
        developing: {
          score: 2,
          description: 'Identifies some topics but lacks precision or completeness',
          indicators: [
            'Uses general or vague terminology',
            'Missing some important concepts',
            'Partial understanding evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'Fails to identify topics clearly or uses incorrect terminology',
          indicators: [
            'Incorrect or very vague descriptions',
            'Missing most key concepts',
            'No evidence of topic understanding'
          ]
        }
      }
    },
    {
      dimension: 'self_assessment_accuracy',
      weight: 0.4,
      description: 'Realistic evaluation of personal mastery level',
      rubric: {
        excellent: {
          score: 4,
          description: 'Provides nuanced, realistic self-assessment with specific evidence',
          indicators: [
            'Uses specific examples to justify mastery level',
            'Acknowledges both strengths and limitations',
            'Demonstrates metacognitive awareness'
          ]
        },
        proficient: {
          score: 3,
          description: 'Provides generally accurate self-assessment',
          indicators: [
            'Some evidence to support claims',
            'Realistic about abilities',
            'Shows self-awareness'
          ]
        },
        developing: {
          score: 2,
          description: 'Self-assessment present but lacks depth or accuracy',
          indicators: [
            'Overly confident or overly modest',
            'Limited justification for claims',
            'Basic self-reflection'
          ]
        },
        insufficient: {
          score: 1,
          description: 'Little to no meaningful self-assessment',
          indicators: [
            'No evidence of reflection',
            'Unrealistic claims',
            'Minimal engagement with the question'
          ]
        }
      }
    },
    {
      dimension: 'depth_of_reflection',
      weight: 0.3,
      description: 'Depth and quality of learning reflection',
      rubric: {
        excellent: {
          score: 4,
          description: 'Deep reflection showing understanding of learning process',
          indicators: [
            'Explains what facilitated or hindered learning',
            'Makes connections between concepts',
            'Shows awareness of learning strategies'
          ]
        },
        proficient: {
          score: 3,
          description: 'Good reflection on learning experience',
          indicators: [
            'Some insight into learning process',
            'Basic connections made',
            'Awareness of own learning'
          ]
        },
        developing: {
          score: 2,
          description: 'Surface-level reflection',
          indicators: [
            'Limited insight',
            'Few connections made',
            'Basic awareness only'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful reflection evident',
          indicators: [
            'Superficial responses',
            'No self-analysis',
            'Minimal effort visible'
          ]
        }
      }
    }
  ],
  subjectAdaptations: {
    'Matemáticas': {
      criteria: [],
      specificIndicators: [
        'References specific mathematical concepts (equations, theorems, procedures)',
        'Discusses problem-solving approaches',
        'Mentions computational skills or reasoning strategies'
      ]
    },
    'Física': {
      criteria: [],
      specificIndicators: [
        'References physical laws, principles, or phenomena',
        'Discusses experimental methods or observations',
        'Mentions mathematical applications in physics'
      ]
    },
    'Química': {
      criteria: [],
      specificIndicators: [
        'References chemical reactions, compounds, or principles',
        'Discusses laboratory techniques or safety',
        'Mentions molecular or atomic concepts'
      ]
    }
  }
};

/**
 * RUBRIC 2: EVIDENCIA DE APRENDIZAJE
 * Evaluates concrete demonstration of learning through specific examples
 */
export const evidenciaAprendizajeRubric: QuestionRubric = {
  questionId: 'evidenciaAprendizaje',
  questionText: 'Evidencia de aprendizaje',
  learningObjectives: [
    'Concrete demonstration of skill application',
    'Problem-solving capability documentation',
    'Transfer of knowledge to specific contexts'
  ],
  criteria: [
    {
      dimension: 'example_specificity',
      weight: 0.4,
      description: 'Specificity and relevance of learning example provided',
      rubric: {
        excellent: {
          score: 4,
          description: 'Provides detailed, specific example with clear context',
          indicators: [
            'Includes specific numbers, formulas, or procedures',
            'Clearly describes the problem setup',
            'Provides sufficient detail for understanding'
          ]
        },
        proficient: {
          score: 3,
          description: 'Provides good example with adequate detail',
          indicators: [
            'Example is clear and relevant',
            'Adequate detail provided',
            'Context is understandable'
          ]
        },
        developing: {
          score: 2,
          description: 'Example provided but lacks detail or clarity',
          indicators: [
            'Vague or general example',
            'Limited context provided',
            'Some relevant content present'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful example or extremely vague',
          indicators: [
            'No specific example given',
            'Irrelevant or incorrect content',
            'No evidence of learning'
          ]
        }
      }
    },
    {
      dimension: 'solution_process',
      weight: 0.35,
      description: 'Clarity and accuracy of solution approach described',
      rubric: {
        excellent: {
          score: 4,
          description: 'Clear, logical solution process with all key steps',
          indicators: [
            'Step-by-step explanation provided',
            'Correct methodology used',
            'Shows understanding of underlying concepts'
          ]
        },
        proficient: {
          score: 3,
          description: 'Good solution process with most key steps',
          indicators: [
            'Generally correct approach',
            'Most important steps included',
            'Sound reasoning evident'
          ]
        },
        developing: {
          score: 2,
          description: 'Solution process present but incomplete or unclear',
          indicators: [
            'Some steps missing or unclear',
            'Partially correct approach',
            'Basic understanding shown'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No clear solution process or incorrect approach',
          indicators: [
            'No coherent solution described',
            'Incorrect methodology',
            'No evidence of understanding'
          ]
        }
      }
    },
    {
      dimension: 'learning_demonstration',
      weight: 0.25,
      description: 'Evidence that genuine learning occurred',
      rubric: {
        excellent: {
          score: 4,
          description: 'Clear evidence of skill development and understanding',
          indicators: [
            'Describes what was learned through the process',
            'Shows improvement from previous attempts',
            'Demonstrates mastery of concept'
          ]
        },
        proficient: {
          score: 3,
          description: 'Good evidence of learning and skill application',
          indicators: [
            'Shows understanding of key concepts',
            'Evidence of skill development',
            'Reasonable mastery demonstrated'
          ]
        },
        developing: {
          score: 2,
          description: 'Some evidence of learning but limited',
          indicators: [
            'Basic understanding evident',
            'Limited skill demonstration',
            'Partial learning shown'
          ]
        },
        insufficient: {
          score: 1,
          description: 'Little to no evidence of learning',
          indicators: [
            'No clear learning demonstrated',
            'Minimal understanding',
            'No skill development evident'
          ]
        }
      }
    }
  ]
};

/**
 * RUBRIC 3: DIFICULTADES Y ESTRATEGIAS
 * Evaluates problem identification and strategic thinking
 */
export const dificultadesEstrategiasRubric: QuestionRubric = {
  questionId: 'dificultadesEstrategias',
  questionText: 'Dificultades y estrategias',
  learningObjectives: [
    'Accurate identification of learning challenges',
    'Development of problem-solving strategies',
    'Metacognitive awareness of learning obstacles'
  ],
  criteria: [
    {
      dimension: 'difficulty_identification',
      weight: 0.4,
      description: 'Accuracy and specificity in identifying learning difficulties',
      rubric: {
        excellent: {
          score: 4,
          description: 'Identifies specific, relevant difficulties with clear explanation',
          indicators: [
            'Pinpoints exact concepts that are challenging',
            'Explains why these concepts are difficult',
            'Shows deep self-awareness of learning gaps'
          ]
        },
        proficient: {
          score: 3,
          description: 'Identifies relevant difficulties with adequate explanation',
          indicators: [
            'Identifies important challenging areas',
            'Some explanation of difficulties',
            'Good self-awareness evident'
          ]
        },
        developing: {
          score: 2,
          description: 'Identifies some difficulties but lacks specificity',
          indicators: [
            'General or vague difficulty identification',
            'Limited explanation provided',
            'Basic self-awareness shown'
          ]
        },
        insufficient: {
          score: 1,
          description: 'Fails to identify meaningful difficulties',
          indicators: [
            'No specific difficulties mentioned',
            'Irrelevant or trivial concerns',
            'No evidence of self-reflection'
          ]
        }
      }
    },
    {
      dimension: 'strategy_development',
      weight: 0.4,
      description: 'Quality and appropriateness of learning strategies proposed',
      rubric: {
        excellent: {
          score: 4,
          description: 'Develops specific, appropriate strategies with clear rationale',
          indicators: [
            'Strategies directly address identified difficulties',
            'Shows understanding of effective learning techniques',
            'Plans are realistic and actionable'
          ]
        },
        proficient: {
          score: 3,
          description: 'Develops good strategies that address difficulties',
          indicators: [
            'Strategies are relevant to difficulties',
            'Shows some knowledge of learning techniques',
            'Plans are generally realistic'
          ]
        },
        developing: {
          score: 2,
          description: 'Some strategies mentioned but limited effectiveness',
          indicators: [
            'Basic or generic strategies proposed',
            'Limited connection to difficulties',
            'Minimal strategic thinking evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful strategies or inappropriate approaches',
          indicators: [
            'No strategies mentioned',
            'Ineffective or incorrect approaches',
            'No evidence of strategic thinking'
          ]
        }
      }
    },
    {
      dimension: 'metacognitive_awareness',
      weight: 0.2,
      description: 'Demonstration of awareness about own learning process',
      rubric: {
        excellent: {
          score: 4,
          description: 'Shows sophisticated understanding of personal learning patterns',
          indicators: [
            'Reflects on how they learn best',
            'Identifies personal learning preferences',
            'Shows awareness of cognitive processes'
          ]
        },
        proficient: {
          score: 3,
          description: 'Shows good awareness of learning patterns',
          indicators: [
            'Some insight into personal learning',
            'Recognizes what helps or hinders learning',
            'Basic metacognitive awareness'
          ]
        },
        developing: {
          score: 2,
          description: 'Limited metacognitive awareness evident',
          indicators: [
            'Minimal insight into learning patterns',
            'Little awareness of learning process',
            'Basic self-knowledge only'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No metacognitive awareness demonstrated',
          indicators: [
            'No reflection on learning process',
            'No self-awareness evident',
            'Minimal engagement with question'
          ]
        }
      }
    }
  ]
};

/**
 * RUBRIC 4: CONEXIONES Y APLICACIÓN
 * Evaluates higher-order thinking and knowledge synthesis
 */
export const conexionesAplicacionRubric: QuestionRubric = {
  questionId: 'conexionesAplicacion',
  questionText: 'Conexiones y aplicación avanzada',
  learningObjectives: [
    'Integration of knowledge across topics/subjects',
    'Higher-order thinking and synthesis',
    'Transfer of learning to new contexts'
  ],
  criteria: [
    {
      dimension: 'connection_quality',
      weight: 0.5,
      description: 'Quality and accuracy of connections made between topics/subjects',
      rubric: {
        excellent: {
          score: 4,
          description: 'Makes sophisticated, accurate connections with clear explanations',
          indicators: [
            'Identifies multiple meaningful connections',
            'Explains how concepts relate to each other',
            'Shows deep understanding of relationships'
          ]
        },
        proficient: {
          score: 3,
          description: 'Makes good connections with adequate explanation',
          indicators: [
            'Identifies relevant connections',
            'Some explanation of relationships',
            'Shows understanding of concept links'
          ]
        },
        developing: {
          score: 2,
          description: 'Makes basic connections but lacks depth',
          indicators: [
            'Superficial or obvious connections only',
            'Limited explanation of relationships',
            'Basic pattern recognition'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful connections or incorrect relationships',
          indicators: [
            'No connections identified',
            'Incorrect or irrelevant links made',
            'No evidence of synthesized thinking'
          ]
        }
      }
    },
    {
      dimension: 'transfer_application',
      weight: 0.3,
      description: 'Evidence of knowledge transfer to new contexts or applications',
      rubric: {
        excellent: {
          score: 4,
          description: 'Demonstrates clear transfer to new contexts with innovative applications',
          indicators: [
            'Applies concepts to novel situations',
            'Shows creative or innovative thinking',
            'Demonstrates flexible use of knowledge'
          ]
        },
        proficient: {
          score: 3,
          description: 'Shows good evidence of knowledge transfer',
          indicators: [
            'Applies concepts appropriately',
            'Shows some flexibility in thinking',
            'Makes relevant applications'
          ]
        },
        developing: {
          score: 2,
          description: 'Limited evidence of transfer or application',
          indicators: [
            'Basic applications only',
            'Limited flexibility shown',
            'Minimal transfer evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No evidence of transfer or inappropriate applications',
          indicators: [
            'No transfer demonstrated',
            'Incorrect applications made',
            'Isolated thinking only'
          ]
        }
      }
    },
    {
      dimension: 'synthesis_depth',
      weight: 0.2,
      description: 'Depth of synthesis and integrated understanding',
      rubric: {
        excellent: {
          score: 4,
          description: 'Demonstrates sophisticated synthesis of multiple concepts',
          indicators: [
            'Integrates concepts from multiple sources',
            'Creates new understanding from connections',
            'Shows systems thinking'
          ]
        },
        proficient: {
          score: 3,
          description: 'Shows good synthesis of related concepts',
          indicators: [
            'Combines concepts meaningfully',
            'Shows integrated understanding',
            'Makes coherent connections'
          ]
        },
        developing: {
          score: 2,
          description: 'Basic synthesis with limited integration',
          indicators: [
            'Simple combinations of concepts',
            'Limited integration shown',
            'Basic connecting evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No synthesis or integration demonstrated',
          indicators: [
            'No integration of concepts',
            'Compartmentalized thinking',
            'No evidence of synthesis'
          ]
        }
      }
    }
  ]
};

/**
 * RUBRIC 5: COMENTARIOS ADICIONALES
 * Evaluates additional insights and overall engagement (Optional field)
 */
export const comentariosAdicionalesRubric: QuestionRubric = {
  questionId: 'comentariosAdicionales',
  questionText: 'Comentarios adicionales',
  learningObjectives: [
    'Additional learning insights and reflections',
    'Engagement with learning process',
    'Communication of concerns or suggestions'
  ],
  criteria: [
    {
      dimension: 'insight_value',
      weight: 0.4,
      description: 'Value and relevance of additional insights provided',
      rubric: {
        excellent: {
          score: 4,
          description: 'Provides valuable insights that enhance understanding of learning',
          indicators: [
            'Offers unique perspectives or observations',
            'Contributes meaningfully to learning narrative',
            'Shows deep engagement with subject'
          ]
        },
        proficient: {
          score: 3,
          description: 'Provides relevant additional information',
          indicators: [
            'Adds useful context or information',
            'Shows good engagement',
            'Relevant to learning process'
          ]
        },
        developing: {
          score: 2,
          description: 'Some additional information but limited value',
          indicators: [
            'Basic additional comments',
            'Limited insight provided',
            'Some engagement evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful additional information or completely off-topic',
          indicators: [
            'No additional insights',
            'Irrelevant comments',
            'Minimal engagement shown'
          ]
        }
      }
    },
    {
      dimension: 'communication_quality',
      weight: 0.35,
      description: 'Clarity and quality of communication in additional comments',
      rubric: {
        excellent: {
          score: 4,
          description: 'Clear, articulate communication with good organization',
          indicators: [
            'Well-structured thoughts',
            'Clear expression of ideas',
            'Good use of language'
          ]
        },
        proficient: {
          score: 3,
          description: 'Generally clear communication',
          indicators: [
            'Ideas expressed clearly',
            'Adequate organization',
            'Appropriate language use'
          ]
        },
        developing: {
          score: 2,
          description: 'Communication present but lacks clarity or organization',
          indicators: [
            'Some unclear expression',
            'Limited organization',
            'Basic language use'
          ]
        },
        insufficient: {
          score: 1,
          description: 'Poor communication or no meaningful content',
          indicators: [
            'Very unclear expression',
            'No organization evident',
            'Inadequate language use'
          ]
        }
      }
    },
    {
      dimension: 'constructive_feedback',
      weight: 0.25,
      description: 'Quality of suggestions, concerns, or feedback provided',
      rubric: {
        excellent: {
          score: 4,
          description: 'Provides constructive, actionable feedback or suggestions',
          indicators: [
            'Specific, actionable suggestions',
            'Constructive criticism or concerns',
            'Shows thoughtful consideration'
          ]
        },
        proficient: {
          score: 3,
          description: 'Provides useful feedback or suggestions',
          indicators: [
            'Relevant suggestions made',
            'Appropriate concerns raised',
            'Good critical thinking'
          ]
        },
        developing: {
          score: 2,
          description: 'Some feedback provided but limited usefulness',
          indicators: [
            'Basic feedback given',
            'Limited actionability',
            'Some critical thinking evident'
          ]
        },
        insufficient: {
          score: 1,
          description: 'No meaningful feedback or inappropriate comments',
          indicators: [
            'No constructive feedback',
            'Inappropriate or irrelevant comments',
            'No evidence of critical thinking'
          ]
        }
      }
    }
  ]
};

/**
 * COMPOSITE SCORING SYSTEM
 */
export interface CompositeScore {
  questionId: string;
  totalScore: number; // 1-4 scale
  dimensionScores: { [dimension: string]: number };
  overallLevel: 'excellent' | 'proficient' | 'developing' | 'insufficient';
  confidenceScore: number; // 0-1, how confident the AI is in the assessment
  feedback: string[];
  recommendations: string[];
}

/**
 * SUBJECT-SPECIFIC ADAPTATIONS
 * These modify the base rubrics based on the specific subject context
 */
export const subjectAdaptations = {
  'Matemáticas': {
    emphasisAreas: ['problem_solving_methods', 'mathematical_reasoning', 'computational_accuracy'],
    vocabularyExpectations: ['mathematical_terms', 'formula_usage', 'theorem_references'],
    exampleRequirements: ['numerical_examples', 'step_by_step_solutions', 'proof_elements']
  },
  'Física': {
    emphasisAreas: ['conceptual_understanding', 'experimental_design', 'real_world_applications'],
    vocabularyExpectations: ['physics_principles', 'measurement_units', 'scientific_terminology'],
    exampleRequirements: ['experimental_examples', 'calculation_examples', 'phenomenon_explanations']
  },
  'Química': {
    emphasisAreas: ['chemical_processes', 'safety_awareness', 'molecular_understanding'],
    vocabularyExpectations: ['chemical_terminology', 'reaction_descriptions', 'compound_names'],
    exampleRequirements: ['reaction_examples', 'laboratory_procedures', 'molecular_explanations']
  }
};

/**
 * ALL RUBRICS COLLECTION
 */
export const allRubrics: QuestionRubric[] = [
  temasYDominioRubric,
  evidenciaAprendizajeRubric,
  dificultadesEstrategiasRubric,
  conexionesAplicacionRubric,
  comentariosAdicionalesRubric
];

/**
 * RUBRIC LOOKUP FUNCTION
 */
export function getRubricById(questionId: string): QuestionRubric | undefined {
  return allRubrics.find(rubric => rubric.questionId === questionId);
}

/**
 * SCORING CALCULATION UTILITIES
 */
export function calculateCompositeScore(
  questionId: string,
  dimensionScores: { [dimension: string]: number }
): CompositeScore {
  const rubric = getRubricById(questionId);
  if (!rubric) {
    throw new Error(`No rubric found for question ID: ${questionId}`);
  }

  // Calculate weighted total score
  let totalScore = 0;
  const validDimensionScores: { [dimension: string]: number } = {};

  rubric.criteria.forEach(criterion => {
    const score = dimensionScores[criterion.dimension];
    if (score !== undefined && score >= 1 && score <= 4) {
      totalScore += score * criterion.weight;
      validDimensionScores[criterion.dimension] = score;
    }
  });

  // Determine overall level
  let overallLevel: 'excellent' | 'proficient' | 'developing' | 'insufficient';
  if (totalScore >= 3.5) overallLevel = 'excellent';
  else if (totalScore >= 2.5) overallLevel = 'proficient';
  else if (totalScore >= 1.5) overallLevel = 'developing';
  else overallLevel = 'insufficient';

  return {
    questionId,
    totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    dimensionScores: validDimensionScores,
    overallLevel,
    confidenceScore: 0.85, // This would be determined by the AI model
    feedback: [], // Would be populated by the AI evaluation
    recommendations: [] // Would be populated by the AI evaluation
  };
}