/**
 * WORKFLOW ENFORCEMENT SYSTEM
 * This would need to be integrated into Claude Code's system to actually enforce the methodology
 */

class WorkflowEnforcer {
  constructor() {
    this.currentWorkflow = null;
    this.diagnosticCompleted = false;
    this.agentSelected = false;
    this.checkpointsEnabled = true;
  }

  /**
   * MANDATORY WORKFLOW INTERCEPTOR
   * This would intercept every Task tool call and enforce the diagnosis-first pattern
   */
  interceptTaskExecution(taskRequest) {
    console.log("🔒 WORKFLOW ENFORCER: Intercepting task request");
    
    // STEP 1: Force diagnosis if not completed
    if (!this.diagnosticCompleted) {
      throw new WorkflowViolationError(
        "DIAGNOSIS REQUIRED: No task can be executed without prior diagnosis. " +
        "Use diagnosis-specialist first to understand the problem."
      );
    }

    // STEP 2: Validate agent selection
    if (!this.agentSelected) {
      throw new WorkflowViolationError(
        "AGENT SELECTION REQUIRED: Diagnosis must inform agent selection. " +
        "Review diagnosis report and select appropriate specialist."
      );
    }

    // STEP 3: Enforce checkpoints for risky operations
    if (this.isHighRiskOperation(taskRequest)) {
      const checkpoint = this.createCheckpoint(taskRequest);
      const approved = this.executeCheckpoint(checkpoint);
      
      if (!approved) {
        throw new WorkflowViolationError(
          "CHECKPOINT FAILED: High-risk operation not approved by user."
        );
      }
    }

    // STEP 4: Execute with monitoring
    return this.executeWithMonitoring(taskRequest);
  }

  /**
   * DIAGNOSIS REQUIREMENT ENFORCER
   * This ensures every workflow starts with diagnosis
   */
  requireDiagnosis(userRequest) {
    console.log("🔍 ENFORCING DIAGNOSIS REQUIREMENT");
    
    const diagnosisPrompt = `
    MANDATORY DIAGNOSIS REQUIRED
    
    User Request: "${userRequest}"
    
    Before any agent can work on this task, you MUST:
    1. Use diagnosis-specialist to analyze the problem
    2. Identify root cause and affected systems
    3. Provide detailed diagnosis report
    4. Only then can appropriate specialist be selected
    
    NO EXCEPTIONS: This workflow is mandatory for all tasks.
    `;
    
    return this.executeDiagnosis(diagnosisPrompt);
  }

  /**
   * AGENT SELECTION VALIDATOR
   * This ensures the right specialist is chosen based on diagnosis
   */
  validateAgentSelection(diagnosisReport, selectedAgent) {
    const appropriateAgent = this.selectAppropriateAgent(diagnosisReport);
    
    if (selectedAgent !== appropriateAgent) {
      throw new WorkflowViolationError(
        `INCORRECT AGENT SELECTION: 
        Based on diagnosis, should use: ${appropriateAgent}
        Attempted to use: ${selectedAgent}
        
        Diagnosis shows: ${diagnosisReport.rootCause}
        Affected systems: ${diagnosisReport.affectedSystems.join(', ')}`
      );
    }
    
    this.agentSelected = true;
    return true;
  }

  /**
   * CHECKPOINT SYSTEM ENFORCER
   * This creates mandatory approval gates for risky operations
   */
  createCheckpoint(operation) {
    const riskLevel = this.assessRiskLevel(operation);
    
    return {
      id: `checkpoint_${Date.now()}`,
      operation: operation.description,
      riskLevel: riskLevel,
      agent: operation.agent,
      requiresApproval: riskLevel !== 'LOW',
      details: {
        affectedFiles: operation.affectedFiles || [],
        potentialImpact: this.assessImpact(operation),
        rollbackPlan: this.generateRollbackPlan(operation)
      }
    };
  }
}

/**
 * WORKFLOW VIOLATION ERROR
 * Custom error type for workflow enforcement violations
 */
class WorkflowViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkflowViolationError';
    this.isEnforcementError = true;
  }
}

/**
 * AUTOMATIC WORKFLOW WRAPPER
 * This would wrap every user request to enforce the methodology
 */
function enforceWorkflowMethodology(userRequest) {
  const enforcer = new WorkflowEnforcer();
  
  try {
    // MANDATORY STEP 1: Diagnosis
    console.log("🔍 STEP 1: MANDATORY DIAGNOSIS");
    const diagnosisResult = enforcer.requireDiagnosis(userRequest);
    
    // MANDATORY STEP 2: Agent Selection  
    console.log("🎯 STEP 2: SPECIALIST SELECTION");
    const selectedAgent = enforcer.selectAppropriateAgent(diagnosisResult);
    enforcer.validateAgentSelection(diagnosisResult, selectedAgent);
    
    // MANDATORY STEP 3: Supervised Execution
    console.log("⚙️ STEP 3: SUPERVISED EXECUTION");
    const executionResult = enforcer.executeWithCheckpoints(selectedAgent, diagnosisResult);
    
    // MANDATORY STEP 4: Validation
    console.log("✅ STEP 4: VALIDATION");
    const validationResult = enforcer.validateResults(executionResult);
    
    return {
      success: true,
      workflow: 'diagnosis_first_enforced',
      diagnosis: diagnosisResult,
      execution: executionResult,
      validation: validationResult
    };
    
  } catch (error) {
    if (error.isEnforcementError) {
      console.error("🚨 WORKFLOW VIOLATION:", error.message);
      throw error;
    }
    throw error;
  }
}

module.exports = {
  WorkflowEnforcer,
  WorkflowViolationError,
  enforceWorkflowMethodology
};