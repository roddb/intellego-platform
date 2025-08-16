#!/usr/bin/env node

/**
 * PROBLEM TYPE DETECTION AND WORKFLOW ROUTING
 * Automatically detects problem types and routes to appropriate workflows
 */

const workflowTemplates = {
  'bug_fix': {
    keywords: ['bug', 'broken', 'error', 'not working', 'failing', 'crash'],
    workflow: 'bug_fix_workflow',
    firstAgent: 'diagnosis-specialist',
    description: 'Systematic bug identification and resolution'
  },
  
  'feature_development': {
    keywords: ['implement', 'create', 'add', 'build', 'develop', 'new feature'],
    workflow: 'feature_development_workflow', 
    firstAgent: 'diagnosis-specialist',
    description: 'Feature planning, development, and integration'
  },
  
  'performance_issue': {
    keywords: ['slow', 'performance', 'timeout', 'lag', 'optimization', 'speed'],
    workflow: 'performance_optimization_workflow',
    firstAgent: 'diagnosis-specialist', 
    description: 'Performance analysis and optimization'
  },
  
  'security_issue': {
    keywords: ['security', 'vulnerability', 'exposed', 'breach', 'hack', 'credentials'],
    workflow: 'security_issue_workflow',
    firstAgent: 'security-validator',
    description: 'Security vulnerability assessment and remediation'
  },
  
  'deployment': {
    keywords: ['deploy', 'production', 'release', 'publish', 'go live'],
    workflow: 'deployment_workflow',
    firstAgent: 'diagnosis-specialist',
    description: 'Safe production deployment process'
  },
  
  'ui_issue': {
    keywords: ['UI', 'styling', 'CSS', 'layout', 'design', 'visual', 'appearance'],
    workflow: 'ui_fix_workflow',
    firstAgent: 'diagnosis-specialist',
    description: 'User interface and styling issue resolution'
  },
  
  'database_issue': {
    keywords: ['database', 'query', 'SQL', 'data', 'connection', 'migration'],
    workflow: 'database_workflow',
    firstAgent: 'diagnosis-specialist',
    description: 'Database operation and optimization'
  }
};

/**
 * AUTOMATIC PROBLEM TYPE DETECTION
 */
function detectProblemType(userPrompt) {
  const prompt = userPrompt.toLowerCase();
  
  // Score each problem type based on keyword matches
  const scores = Object.entries(workflowTemplates).map(([type, template]) => {
    const matchScore = template.keywords.filter(keyword => 
      prompt.includes(keyword.toLowerCase())
    ).length;
    
    return {
      type,
      score: matchScore,
      template: template
    };
  });
  
  // Return highest scoring type (or null if no matches)
  const bestMatch = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  return bestMatch.score > 0 ? bestMatch : null;
}

/**
 * WORKFLOW INSTRUCTION GENERATOR
 */
function generateWorkflowInstructions(problemType, originalPrompt) {
  const template = workflowTemplates[problemType.type];
  
  return `
🎯 AUTOMATIC WORKFLOW DETECTION

Problem Type: ${problemType.type.toUpperCase()}
Description: ${template.description}
Detected Keywords: ${template.keywords.filter(k => 
  originalPrompt.toLowerCase().includes(k.toLowerCase())
).join(', ')}

📋 WORKFLOW INSTRUCTIONS

Following ${template.workflow} methodology:

STEP 1: DIAGNOSIS (MANDATORY)
Agent: ${template.firstAgent}
Task: Analyze and understand the specific problem
Required: Root cause identification, affected systems, impact assessment

STEP 2: PLANNING
Based on diagnosis results, select appropriate specialist
Define exact scope and approach
Identify risks and mitigation strategies

STEP 3: SUPERVISED EXECUTION
Execute with appropriate checkpoints
Monitor for unintended consequences
Apply safety measures based on risk level

STEP 4: VALIDATION
Verify solution resolves original problem
Test for regressions and side effects
Document resolution for future reference

🚀 STARTING WORKFLOW

Original Request: "${originalPrompt}"
Beginning with STEP 1: DIAGNOSIS using ${template.firstAgent}
  `;
}

/**
 * SPECIALIZED WORKFLOW PATTERNS
 */
const workflowPatterns = {
  
  bug_fix_workflow: {
    steps: [
      {
        phase: 'diagnosis',
        agent: 'diagnosis-specialist',
        focus: 'Root cause identification',
        deliverable: 'Bug diagnosis report with reproduction steps'
      },
      {
        phase: 'planning',
        agent: 'claude_primary',
        focus: 'Fix strategy selection',
        deliverable: 'Implementation plan with risk assessment'
      },
      {
        phase: 'execution',
        agent: 'selected_specialist',
        focus: 'Targeted fix implementation',
        deliverable: 'Bug fix with minimal side effects'
      },
      {
        phase: 'validation',
        agent: 'testing-validator', 
        focus: 'Fix verification and regression testing',
        deliverable: 'Validation report confirming resolution'
      }
    ]
  },
  
  security_issue_workflow: {
    steps: [
      {
        phase: 'assessment',
        agent: 'security-validator',
        focus: 'Vulnerability analysis and severity assessment',
        deliverable: 'Security risk assessment report'
      },
      {
        phase: 'containment',
        agent: 'emergency-responder',
        focus: 'Immediate threat mitigation',
        deliverable: 'Security incident contained'
      },
      {
        phase: 'remediation',
        agent: 'selected_specialist',
        focus: 'Vulnerability fix implementation',
        deliverable: 'Security patch deployed'
      },
      {
        phase: 'verification',
        agent: 'security-validator',
        focus: 'Security validation and audit',
        deliverable: 'Security clearance confirmation'
      }
    ]
  },
  
  performance_optimization_workflow: {
    steps: [
      {
        phase: 'analysis',
        agent: 'diagnosis-specialist',
        focus: 'Performance bottleneck identification',
        deliverable: 'Performance analysis with metrics'
      },
      {
        phase: 'strategy',
        agent: 'claude_primary',
        focus: 'Optimization approach selection',
        deliverable: 'Performance improvement strategy'
      },
      {
        phase: 'optimization',
        agent: 'multiple_specialists',
        focus: 'Targeted performance improvements',
        deliverable: 'Optimizations implemented'
      },
      {
        phase: 'measurement',
        agent: 'testing-validator',
        focus: 'Performance validation and benchmarking',
        deliverable: 'Performance improvement metrics'
      }
    ]
  }
};

/**
 * WORKFLOW EXECUTION COORDINATOR
 */
function coordinateWorkflow(problemType, userPrompt) {
  const pattern = workflowPatterns[problemType.template.workflow];
  
  if (!pattern) {
    return generateWorkflowInstructions(problemType, userPrompt);
  }
  
  return `
🎯 ${problemType.type.toUpperCase()} WORKFLOW ACTIVATED

Problem: "${userPrompt}"

📋 WORKFLOW STEPS:

${pattern.steps.map((step, index) => `
${index + 1}. ${step.phase.toUpperCase()}
   Agent: ${step.agent}
   Focus: ${step.focus}
   Expected: ${step.deliverable}
`).join('')}

🚀 EXECUTION STARTING

Beginning with Step 1: ${pattern.steps[0].phase.toUpperCase()}
Agent: ${pattern.steps[0].agent}
Task: ${pattern.steps[0].focus}
  `;
}

/**
 * MAIN HOOK FUNCTION
 */
function problemTypeDetectionHook(prompt, context) {
  console.log("🔍 PROBLEM TYPE DETECTION: Analyzing user request");
  
  const detectedProblem = detectProblemType(prompt);
  
  if (detectedProblem) {
    const workflowInstructions = coordinateWorkflow(detectedProblem, prompt);
    
    return {
      decision: 'allow',
      prompt: workflowInstructions,
      context: {
        ...context,
        detectedProblemType: detectedProblem.type,
        workflowTemplate: detectedProblem.template.workflow,
        originalPrompt: prompt
      }
    };
  }
  
  // No specific problem type detected - use general workflow
  return {
    decision: 'allow',
    prompt: `
🔍 GENERAL PROBLEM ANALYSIS REQUIRED

Request: "${prompt}"

No specific problem type detected. Applying general diagnosis-first methodology:

1. DIAGNOSIS: Analyze request and identify problem category
2. PLANNING: Select appropriate workflow based on analysis
3. EXECUTION: Apply specialized workflow methodology
4. VALIDATION: Verify successful resolution

Starting with comprehensive analysis to determine problem type and approach.
    `
  };
}

module.exports = {
  'user-prompt-submit': problemTypeDetectionHook,
  detectProblemType,
  generateWorkflowInstructions,
  workflowTemplates,
  workflowPatterns
};