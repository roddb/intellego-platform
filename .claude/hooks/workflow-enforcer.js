#!/usr/bin/env node

/**
 * CLAUDE CODE WORKFLOW ENFORCEMENT HOOKS
 * This implements the diagnosis-first methodology as automatic hooks
 */

const fs = require('fs');
const path = require('path');

// Workflow state tracking
let workflowState = {
  diagnosisCompleted: false,
  currentProblem: null,
  selectedAgent: null,
  lastDiagnosisTime: null
};

/**
 * USER PROMPT SUBMIT HOOK
 * Intercepts every user request and enforces diagnosis-first workflow
 */
function userPromptSubmitHook(prompt, context) {
  console.log("🔒 WORKFLOW HOOK: Intercepting user prompt");
  
  // Check if this is a new problem that requires diagnosis
  if (isNewProblemRequest(prompt)) {
    // Reset workflow state for new problem
    resetWorkflowState();
    
    // Inject diagnosis requirement
    const enhancedPrompt = injectDiagnosisRequirement(prompt);
    
    return {
      decision: 'allow',
      prompt: enhancedPrompt,
      context: {
        ...context,
        workflowState: 'diagnosis_required',
        originalPrompt: prompt
      }
    };
  }
  
  // If diagnosis not completed and this is an action request, block it
  if (isActionRequest(prompt) && !workflowState.diagnosisCompleted) {
    return {
      decision: 'deny',
      reason: `
🚨 WORKFLOW VIOLATION: Diagnosis Required First

Your request: "${prompt}"

This appears to be an action request, but no diagnosis has been completed.

REQUIRED WORKFLOW:
1. First request: Diagnose and understand the problem
2. Then request: Take specific action based on diagnosis

Please start with: "Diagnose the issue with [describe problem]"
      `
    };
  }
  
  return { decision: 'allow' };
}

/**
 * TOOL CALL HOOK
 * Validates agent selection and enforces permissions
 */
function toolCallHook(toolName, parameters, context) {
  console.log(`🔍 TOOL HOOK: Validating ${toolName} call`);
  
  // If Task tool is being used, validate agent selection
  if (toolName === 'Task') {
    const agentType = parameters.subagent_type;
    const expectedAgent = determineExpectedAgent(context.workflowState);
    
    if (expectedAgent && agentType !== expectedAgent) {
      return {
        decision: 'ask',
        prompt: `
🤔 AGENT SELECTION REVIEW

Requested agent: ${agentType}
Recommended agent: ${expectedAgent}

Based on the diagnosis, ${expectedAgent} seems more appropriate because:
${getAgentSelectionReasoning(expectedAgent, context)}

Proceed with ${agentType}? (yes/no)
        `
      };
    }
  }
  
  // Validate permissions for specific operations
  if (isRestrictedOperation(toolName, parameters)) {
    return {
      decision: 'ask',
      prompt: `
⚠️ HIGH-RISK OPERATION DETECTED

Tool: ${toolName}
Operation: ${parameters.operation || 'Not specified'}
Risk Level: ${assessRiskLevel(toolName, parameters)}

This operation could affect:
${listAffectedSystems(toolName, parameters)}

Continue with this operation? (yes/no)
      `
    };
  }
  
  return { decision: 'allow' };
}

/**
 * SESSION START HOOK
 * Initialize workflow enforcement system
 */
function sessionStartHook() {
  console.log("🚀 WORKFLOW SYSTEM: Initializing diagnosis-first methodology");
  
  // Load workflow templates
  loadWorkflowTemplates();
  
  // Reset workflow state
  resetWorkflowState();
  
  // Display methodology reminder
  return {
    message: `
🎯 INTELLEGO PLATFORM WORKFLOW SYSTEM ACTIVE

This session enforces the diagnosis-first methodology:

1. 🔍 DIAGNOSIS: Every problem starts with analysis
2. 🎯 PLANNING: Select appropriate specialist based on diagnosis  
3. ⚙️ EXECUTION: Supervised action with checkpoints
4. ✅ VALIDATION: Verify solution works correctly

The system will guide you through this workflow automatically.
    `
  };
}

/**
 * HELPER FUNCTIONS
 */

function isNewProblemRequest(prompt) {
  const problemKeywords = [
    'fix', 'broken', 'error', 'issue', 'problem', 'bug', 
    'not working', 'failing', 'crash', 'slow', 'implement',
    'create', 'add', 'build', 'develop'
  ];
  
  return problemKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
}

function isActionRequest(prompt) {
  const actionKeywords = [
    'deploy', 'commit', 'push', 'delete', 'remove', 
    'modify', 'change', 'update', 'install', 'run'
  ];
  
  return actionKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
}

function injectDiagnosisRequirement(originalPrompt) {
  return `
WORKFLOW ENFORCEMENT: Diagnosis-First Methodology Required

User Request: "${originalPrompt}"

Before taking any action, you MUST first:

1. 🔍 ANALYZE the problem thoroughly
   - Read relevant files to understand current state
   - Identify root cause and affected systems
   - Determine scope and complexity

2. 📋 PLAN the approach
   - Select appropriate specialist agent
   - Define exact scope of work needed
   - Identify potential risks and mitigation

3. ⚙️ EXECUTE with supervision
   - Use targeted, specific instructions
   - Apply appropriate checkpoints
   - Monitor for unintended consequences

4. ✅ VALIDATE the solution
   - Test that problem is resolved
   - Verify no regressions introduced
   - Document the resolution

Start with Step 1: Comprehensive diagnosis of the problem.

Original request: ${originalPrompt}
  `;
}

function determineExpectedAgent(workflowState) {
  // This would analyze the diagnosis to recommend appropriate agent
  if (!workflowState || !workflowState.diagnosisResult) return null;
  
  const diagnosis = workflowState.diagnosisResult;
  
  if (diagnosis.includes('CSS') || diagnosis.includes('styling')) {
    return 'css-specialist';
  }
  if (diagnosis.includes('component') || diagnosis.includes('React')) {
    return 'component-builder';
  }
  if (diagnosis.includes('API') || diagnosis.includes('endpoint')) {
    return 'api-endpoint-creator';
  }
  if (diagnosis.includes('database') || diagnosis.includes('query')) {
    return 'database-query-optimizer';
  }
  
  return null;
}

function isRestrictedOperation(toolName, parameters) {
  const highRiskOperations = [
    { tool: 'Bash', patterns: ['rm -rf', 'git push', 'npm install'] },
    { tool: 'Edit', patterns: ['DELETE', 'DROP TABLE'] },
    { tool: 'Write', patterns: ['production', 'deploy'] }
  ];
  
  return highRiskOperations.some(restriction => {
    if (restriction.tool !== toolName) return false;
    
    const paramString = JSON.stringify(parameters).toLowerCase();
    return restriction.patterns.some(pattern => 
      paramString.includes(pattern.toLowerCase())
    );
  });
}

function assessRiskLevel(toolName, parameters) {
  if (toolName === 'Bash' && JSON.stringify(parameters).includes('rm')) {
    return 'CRITICAL';
  }
  if (toolName === 'Edit' && JSON.stringify(parameters).includes('production')) {
    return 'HIGH';
  }
  return 'MEDIUM';
}

function resetWorkflowState() {
  workflowState = {
    diagnosisCompleted: false,
    currentProblem: null,
    selectedAgent: null,
    lastDiagnosisTime: Date.now()
  };
}

function loadWorkflowTemplates() {
  const templatesPath = path.join(__dirname, '../workflow-templates.md');
  if (fs.existsSync(templatesPath)) {
    console.log("✅ Workflow templates loaded");
  } else {
    console.warn("⚠️ Workflow templates not found");
  }
}

// Export hooks for Claude Code
module.exports = {
  'user-prompt-submit': userPromptSubmitHook,
  'tool-call': toolCallHook,
  'session-start': sessionStartHook
};