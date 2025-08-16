# DIAGNOSIS-FIRST WORKFLOW TEMPLATES

This document defines the mandatory workflow patterns that implement the diagnosis-first approach, addressing the 40% problem of immediate task delegation without understanding.

## CORE WORKFLOW PRINCIPLE

**NEVER delegate a task without diagnosis first.**

Every request must follow this pattern:
1. **DIAGNOSIS** (Always mandatory)
2. **PLANNING** (Based on diagnosis)
3. **EXECUTION** (Supervised)
4. **VALIDATION** (Verify success)

## WORKFLOW TEMPLATE LIBRARY

### 1. BUG FIX WORKFLOW

```yaml
workflow_type: bug_fix
trigger: "User reports UI/functionality issue"

step_1_diagnosis:
  agent: diagnosis-specialist
  required_actions:
    - Read affected components/files
    - Use Grep to find related code patterns
    - Analyze error logs or browser console
    - Identify root cause and affected systems
    - Test reproduction steps locally
  deliverable: "Bug diagnosis report with root cause"

step_2_planning:
  orchestrator: claude_primary
  required_inputs: [diagnosis_report]
  actions:
    - Select appropriate specialist agent based on root cause
    - Define exact scope of fix needed
    - Plan testing and verification steps
    - Identify potential side effects
  deliverable: "Fix implementation plan"

step_3_execution:
  agent: [selected_specialist]
  required_inputs: [diagnosis_report, implementation_plan]  
  checkpoint: "Review proposed changes before execution"
  
step_4_validation:
  agent: testing-validator
  required_actions:
    - Verify fix resolves original issue
    - Run regression tests
    - Confirm no new issues introduced
  deliverable: "Validation report"

example_usage:
  user_request: "The login page shows a giant circle blocking everything"
  workflow_execution:
    diagnosis: "Giant SVG icons due to missing size constraints in CSS"
    specialist: "css-specialist"
    fix: "Add SVG size constraints to globals.css"
    validation: "Login page UI restored, no regressions"
```

### 2. FEATURE DEVELOPMENT WORKFLOW

```yaml
workflow_type: feature_development
trigger: "User requests new functionality"

step_1_diagnosis:
  agent: diagnosis-specialist
  required_actions:
    - Analyze existing codebase for similar features
    - Identify integration points and dependencies
    - Review current architecture patterns
    - Assess impact on existing functionality
  deliverable: "Feature feasibility and integration analysis"

step_2_planning:
  orchestrator: claude_primary
  required_inputs: [feasibility_analysis]
  actions:
    - Break feature into specialized tasks
    - Select appropriate agents for each task
    - Plan implementation order and dependencies
    - Design testing strategy
  deliverable: "Feature implementation roadmap"

step_3_execution:
  pattern: "Sequential agent execution with checkpoints"
  agents: [multiple_specialists_as_needed]
  checkpoint_frequency: "After each major component"
  
step_4_validation:
  agent: testing-validator
  required_actions:
    - Test new feature functionality
    - Verify integration with existing features
    - Performance testing
    - User acceptance criteria validation
  deliverable: "Feature validation report"

example_usage:
  user_request: "Add AI assessment rubric builder"
  workflow_execution:
    diagnosis: "Requires database schema, API endpoints, UI components"
    roadmap: "1) DB schema, 2) API routes, 3) UI components, 4) integration"
    agents: ["database-query-optimizer", "api-endpoint-creator", "component-builder"]
    validation: "Full feature working end-to-end"
```

### 3. PERFORMANCE OPTIMIZATION WORKFLOW

```yaml
workflow_type: performance_optimization
trigger: "User reports slow performance or performance metrics indicate issues"

step_1_diagnosis:
  agent: diagnosis-specialist
  required_actions:
    - Analyze performance metrics and bottlenecks
    - Identify slow queries, large bundles, or inefficient components
    - Review network requests and database operations
    - Determine primary performance impact areas
  deliverable: "Performance analysis report with bottlenecks identified"

step_2_planning:
  orchestrator: claude_primary
  required_inputs: [performance_analysis]
  actions:
    - Prioritize optimizations by impact
    - Select specialized agents for different optimization areas
    - Plan staged optimization approach
    - Define success metrics
  deliverable: "Performance optimization strategy"

step_3_execution:
  pattern: "Parallel optimization by specialized agents"
  agents: 
    - build-optimizer: "Bundle size, build performance"
    - database-query-optimizer: "Query performance, indexing"
    - component-builder: "Component efficiency, re-render reduction"
  checkpoint: "Measure performance impact after each optimization"
  
step_4_validation:
  agent: testing-validator  
  required_actions:
    - Benchmark performance improvements
    - Verify no functionality regressions
    - Test under load conditions
    - Monitor production metrics
  deliverable: "Performance improvement validation"

example_usage:
  user_request: "Dashboard loading very slowly"
  workflow_execution:
    diagnosis: "Inefficient database queries and large component re-renders"
    strategy: "Optimize queries + memoize components"
    agents: ["database-query-optimizer", "component-builder"]
    validation: "Dashboard load time reduced from 5s to 1.2s"
```

### 4. SECURITY ISSUE WORKFLOW

```yaml
workflow_type: security_issue  
trigger: "Security vulnerability reported or discovered"

step_1_diagnosis:
  agent: security-validator
  required_actions:
    - Identify vulnerability type and severity
    - Assess potential impact and exploitability
    - Map affected systems and data exposure
    - Determine urgency level
  deliverable: "Security vulnerability assessment"

step_2_planning:
  orchestrator: claude_primary
  required_inputs: [vulnerability_assessment]
  actions:
    - Classify severity (CRITICAL/HIGH/MEDIUM/LOW)
    - Select appropriate fix agent
    - Plan security implementation
    - Prepare rollback strategy
  deliverable: "Security remediation plan"

step_3_execution:
  urgency_based:
    CRITICAL:
      agent: emergency-responder
      approval: "Immediate user confirmation required"
    HIGH:
      agent: [selected_specialist]
      checkpoint: "Review security fix before deployment"
    MEDIUM/LOW:
      agent: [selected_specialist]
      checkpoint: "Standard review process"
      
step_4_validation:
  agent: security-validator
  required_actions:
    - Verify vulnerability is patched
    - Confirm no new security issues introduced
    - Test attack vectors are blocked
    - Document security improvement
  deliverable: "Security fix validation report"

example_usage:
  user_request: "Found exposed production credentials in repository"
  workflow_execution:
    diagnosis: "CRITICAL - Database credentials in .env.production file"
    plan: "Immediate credential removal and rotation"
    agent: "emergency-responder"
    validation: "Credentials removed, new tokens generated, no data breach"
```

### 5. DEPLOYMENT WORKFLOW

```yaml
workflow_type: deployment
trigger: "User requests deployment to production"

step_1_diagnosis:
  agent: diagnosis-specialist
  required_actions:
    - Review all changes since last deployment
    - Identify potential breaking changes
    - Check dependency updates and compatibility
    - Assess deployment risk level
  deliverable: "Deployment readiness assessment"

step_2_planning:
  orchestrator: claude_primary
  required_inputs: [readiness_assessment]
  actions:
    - Verify all pre-deployment checks completed
    - Plan deployment strategy (gradual/immediate)
    - Prepare rollback procedures
    - Schedule deployment window
  deliverable: "Deployment execution plan"

step_3_execution:
  agent: deployment-specialist
  required_inputs: [execution_plan]
  pre_flight_checks:
    - Build success locally
    - All tests passing
    - No TypeScript errors
    - Security validation passed
  checkpoint: "Confirm all checks passed before production push"
  
step_4_validation:
  agent: deployment-specialist
  required_actions:
    - Monitor deployment success in Vercel
    - Test production endpoints
    - Verify user flows working
    - Monitor error rates and performance
  deliverable: "Deployment success confirmation"

example_usage:
  user_request: "Deploy the new rubric builder feature"
  workflow_execution:
    diagnosis: "Major feature with database changes - HIGH risk"
    plan: "Staged deployment with extra monitoring"
    execution: "Deploy with 15-minute monitoring window"
    validation: "All systems operational, feature working correctly"
```

## MANDATORY ORCHESTRATION PATTERNS

### Agent Selection Logic
```typescript
interface AgentSelectionCriteria {
  problemType: string;
  affectedSystems: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
}

function selectAppropriateAgent(diagnosis: DiagnosisReport): string {
  const { rootCause, affectedSystems, severity } = diagnosis;
  
  // Emergency conditions - bypass specialization
  if (severity === 'CRITICAL' && diagnosis.urgency === 'EMERGENCY') {
    return 'emergency-responder';
  }
  
  // Primary system affected determines agent
  if (affectedSystems.includes('CSS') || affectedSystems.includes('styling')) {
    return 'css-specialist';
  }
  
  if (affectedSystems.includes('database') && rootCause.includes('query')) {
    return 'database-query-optimizer';  
  }
  
  if (affectedSystems.includes('API') || rootCause.includes('endpoint')) {
    return 'api-endpoint-creator';
  }
  
  if (affectedSystems.includes('component') || affectedSystems.includes('UI')) {
    return 'component-builder';
  }
  
  if (affectedSystems.includes('routing') || affectedSystems.includes('page')) {
    return 'page-architect';
  }
  
  // Default to diagnosis if unclear
  return 'diagnosis-specialist';
}
```

### Checkpoint Implementation
```typescript
interface CheckpointApproval {
  checkpoint: string;
  agent: string;
  proposedAction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredApproval: boolean;
}

async function executeCheckpoint(checkpoint: CheckpointApproval): Promise<boolean> {
  console.log(`🚨 CHECKPOINT: ${checkpoint.checkpoint}`);
  console.log(`Agent: ${checkpoint.agent}`);
  console.log(`Proposed Action: ${checkpoint.proposedAction}`);
  console.log(`Risk Level: ${checkpoint.riskLevel}`);
  
  if (checkpoint.riskLevel === 'HIGH' || checkpoint.requiredApproval) {
    const approval = await getUserApproval(
      `Approve ${checkpoint.agent} to execute: ${checkpoint.proposedAction}? (yes/no)`
    );
    return approval === 'yes';
  }
  
  // Auto-approve low risk actions with notification
  console.log(`✅ Auto-approved (${checkpoint.riskLevel} risk)`);
  return true;
}
```

## WORKFLOW EXECUTION ENGINE

### Main Orchestration Function
```typescript
async function executeWorkflow(
  userRequest: string, 
  workflowType: string
): Promise<WorkflowResult> {
  
  console.log(`🎯 Executing ${workflowType} workflow for: "${userRequest}"`);
  
  // STEP 1: Mandatory Diagnosis
  console.log("🔍 STEP 1: DIAGNOSIS");
  const diagnosisAgent = workflowType === 'security_issue' ? 
    'security-validator' : 'diagnosis-specialist';
    
  const diagnosisResult = await executeAgent(diagnosisAgent, {
    task: `Diagnose the following issue: ${userRequest}`,
    expectedOutput: "Detailed diagnosis report with root cause analysis"
  });
  
  if (!diagnosisResult.success) {
    throw new Error("Diagnosis failed - cannot proceed with workflow");
  }
  
  // STEP 2: Planning Based on Diagnosis
  console.log("📋 STEP 2: PLANNING");
  const selectedAgent = selectAppropriateAgent(diagnosisResult.report);
  const executionPlan = createExecutionPlan(diagnosisResult.report, selectedAgent);
  
  // STEP 3: Supervised Execution
  console.log("⚙️ STEP 3: EXECUTION");
  const approved = await executeCheckpoint({
    checkpoint: "Pre-execution approval",
    agent: selectedAgent,
    proposedAction: executionPlan.actions.join(", "),
    riskLevel: executionPlan.riskLevel,
    requiredApproval: executionPlan.riskLevel !== 'LOW'
  });
  
  if (!approved) {
    throw new Error("Execution not approved - workflow cancelled");
  }
  
  const executionResult = await executeAgent(selectedAgent, {
    task: executionPlan.task,
    context: diagnosisResult.report,
    constraints: executionPlan.constraints
  });
  
  // STEP 4: Validation
  console.log("✅ STEP 4: VALIDATION");
  const validationResult = await executeAgent('testing-validator', {
    task: `Validate that the following has been resolved: ${userRequest}`,
    context: executionResult,
    validationCriteria: executionPlan.successCriteria
  });
  
  return {
    success: validationResult.success,
    workflow: workflowType,
    diagnosis: diagnosisResult.report,
    execution: executionResult,
    validation: validationResult,
    agentsUsed: [diagnosisAgent, selectedAgent, 'testing-validator']
  };
}
```

This diagnosis-first workflow system ensures that every task begins with proper analysis, uses the right specialist, and includes validation - eliminating the destructive pattern of immediate action without understanding.