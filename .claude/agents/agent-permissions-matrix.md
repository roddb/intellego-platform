# AGENT PERMISSIONS MATRIX

This document defines the tool access permissions for each specialized agent, implementing the principle of least privilege.

## PERMISSION LEVELS

### 🔍 READ-ONLY AGENTS
**Philosophy**: Analysis and reporting only, no modifications

| Agent | Allowed Tools | Restrictions | Rationale |
|-------|---------------|--------------|-----------|
| `diagnosis-specialist` | Read, Grep, Glob, LS, WebFetch, mcp__context7__*, mcp__ide__getDiagnostics | No write operations, no bash execution | Only needs to analyze and report |
| `security-validator` | Read, Grep, Glob, mcp__context7__*, mcp__ide__getDiagnostics | No modifications, no deployments | Security analysis only |
| `testing-validator` | Bash (test commands only), Read, Grep, mcp__context7__*, mcp__ide__getDiagnostics | No file modifications, no production access | Testing and validation only |

### ⚙️ MODIFICATION AGENTS  
**Philosophy**: Specific modification capabilities with clear boundaries

| Agent | Allowed Tools | Restrictions | Rationale |
|-------|---------------|--------------|-----------|
| `component-builder` | Read, Edit, MultiEdit, mcp__context7__*, mcp__ide__getDiagnostics | No deployment, no API routes, no database | Component development only |
| `css-specialist` | Read, Edit, MultiEdit, Bash (build only), Glob, Grep | No deployment, no database, no API | Styling and CSS only |
| `api-endpoint-creator` | Read, Write, Edit, MultiEdit, mcp__context7__*, Bash (dev server) | No deployment, no database schema | API routes only |
| `page-architect` | Read, Write, Edit, MultiEdit, LS, mcp__context7__* | No deployment, no database, no bash | Page structure only |
| `database-query-optimizer` | Read, Edit, Grep, Bash (limited), mcp__context7__* | No schema changes, no deployments | Query optimization only |
| `file-system-manager` | Read, Write, Edit, MultiEdit, Bash, LS, Glob | No database, no API, no deployment | File operations only |

### 🚀 INFRASTRUCTURE AGENTS
**Philosophy**: Infrastructure management with production access

| Agent | Allowed Tools | Restrictions | Rationale |
|-------|---------------|--------------|-----------|
| `build-optimizer` | Read, Edit, Bash, Glob, mcp__context7__* | No deployment, no feature development | Build process only |
| `deployment-specialist` | Bash (git/vercel), Read, WebFetch, mcp__context7__* | No code editing, no database | Deployment only |

### 🆘 EMERGENCY ACCESS
**Philosophy**: Full access for critical production issues only

| Agent | Allowed Tools | Restrictions | Rationale |
|-------|---------------|--------------|-----------|
| `emergency-responder` | ALL TOOLS | Requires explicit user confirmation | Production emergencies only |

## TOOL RESTRICTION IMPLEMENTATION

### Bash Command Restrictions
```yaml
diagnosis-specialist:
  bash: BLOCKED
  rationale: "Read-only analysis, no execution needed"

css-specialist:
  bash:
    allowed: ["npm run build", "npm run dev", "npm run lint"]
    blocked: ["git", "rm", "delete", "deploy"]
    rationale: "Only build and development commands"

api-endpoint-creator:
  bash:
    allowed: ["npm run dev", "npm run type-check"]
    blocked: ["git push", "vercel", "database commands"]
    rationale: "Local development only"

deployment-specialist:
  bash:
    allowed: ["git*", "vercel*", "curl", "time", "ps", "kill"]
    blocked: ["npm install", "rm -rf", "database queries"]
    rationale: "Deployment and monitoring only"
```

### File System Restrictions
```yaml
component-builder:
  read: "src/components/**/*.tsx, src/lib/**/*.ts"
  write: "src/components/**/*.tsx"
  blocked: "src/app/api/**, prisma/**, data/**"
  rationale: "Component files only"

css-specialist:
  read: "src/app/globals.css, tailwind.config.js, **/*.css"
  write: "src/app/globals.css, **/*.css"
  blocked: "src/app/api/**, src/components/**/*.tsx"
  rationale: "Styling files only"

file-system-manager:
  read: "data/**, src/lib/file-operations.ts"
  write: "data/**/*.json"
  blocked: "src/app/**, database files"
  rationale: "File system operations only"
```

### Database Access Restrictions
```yaml
database-query-optimizer:
  read: "src/lib/db-operations.ts, prisma/schema.prisma"
  write: "src/lib/db-operations.ts (queries only)"
  blocked: "schema modifications, data migrations"
  rationale: "Query optimization only"

api-endpoint-creator:
  database: "via db-operations.ts functions only"
  blocked: "direct SQL, schema changes"
  rationale: "Use existing database abstraction"

ALL_OTHER_AGENTS:
  database: BLOCKED
  rationale: "Database access only via specialized agents"
```

## PERMISSION ENFORCEMENT

### Tool Access Validation
Before any tool execution, validate agent permissions:

```typescript
interface AgentPermissions {
  agent: string;
  allowedTools: string[];
  restrictedPaths?: string[];
  allowedBashCommands?: string[];
  blockedOperations?: string[];
}

function validateToolAccess(agent: string, tool: string, parameters: any): boolean {
  const permissions = getAgentPermissions(agent);
  
  // Check if tool is allowed
  if (!permissions.allowedTools.includes(tool)) {
    throw new Error(`Agent ${agent} does not have access to tool ${tool}`);
  }
  
  // Additional parameter validation
  if (tool === 'Bash') {
    return validateBashCommand(agent, parameters.command);
  }
  
  if (tool === 'Edit' || tool === 'Write') {
    return validateFileAccess(agent, parameters.file_path);
  }
  
  return true;
}
```

### Permission Violation Handling
```typescript
class PermissionViolationError extends Error {
  constructor(agent: string, tool: string, reason: string) {
    super(`Permission denied: ${agent} cannot use ${tool} - ${reason}`);
  }
}

function handlePermissionViolation(agent: string, tool: string, reason: string) {
  // Log the violation
  console.error(`🚫 Permission violation: ${agent} attempted to use ${tool}`);
  
  // Suggest alternative agent
  const suggestion = suggestAlternativeAgent(tool, reason);
  
  throw new PermissionViolationError(agent, tool, 
    `${reason}. Consider using ${suggestion} instead.`);
}
```

## AGENT INTERACTION PROTOCOLS

### Cross-Agent Communication
When agents need capabilities outside their permissions:

```yaml
component-builder:
  needs_database: "Request database-query-optimizer"
  needs_deployment: "Request deployment-specialist"  
  needs_styling: "Request css-specialist"

css-specialist:
  needs_component_logic: "Request component-builder"
  needs_deployment: "Request deployment-specialist"
  
api-endpoint-creator:
  needs_database_schema: "Request database-query-optimizer"
  needs_frontend: "Request component-builder"
```

### Handoff Procedures
```typescript
interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  task: string;
  context: string;
  requiredPermissions: string[];
}

function requestAgentHandoff(handoff: AgentHandoff): void {
  // Validate the receiving agent has required permissions
  const targetPermissions = getAgentPermissions(handoff.toAgent);
  
  const hasRequiredPerms = handoff.requiredPermissions.every(perm => 
    targetPermissions.allowedTools.includes(perm)
  );
  
  if (!hasRequiredPerms) {
    throw new Error(`Agent ${handoff.toAgent} lacks required permissions`);
  }
  
  // Execute handoff
  console.log(`🔄 Handing off from ${handoff.fromAgent} to ${handoff.toAgent}`);
  console.log(`Task: ${handoff.task}`);
  console.log(`Context: ${handoff.context}`);
}
```

## EMERGENCY OVERRIDE PROTOCOL

### Critical Production Issues
For CRITICAL production emergencies only:

```typescript
interface EmergencyOverride {
  severity: 'CRITICAL' | 'HIGH';
  justification: string;
  affectedUsers: number;
  businessImpact: string;
  requiredActions: string[];
}

function requestEmergencyOverride(override: EmergencyOverride): boolean {
  if (override.severity !== 'CRITICAL') {
    return false; // No override for non-critical issues
  }
  
  // Require explicit user confirmation
  const confirmation = await getUserConfirmation(
    `EMERGENCY OVERRIDE REQUEST
    Severity: ${override.severity}
    Impact: ${override.businessImpact}
    Users Affected: ${override.affectedUsers}
    
    Grant emergency access to all tools? (yes/no)`
  );
  
  if (confirmation === 'yes') {
    // Grant temporary full access
    console.log('🆘 EMERGENCY OVERRIDE GRANTED - ALL RESTRICTIONS LIFTED');
    return true;
  }
  
  return false;
}
```

## MONITORING AND AUDITING

### Permission Usage Tracking
```typescript
interface PermissionAuditLog {
  timestamp: Date;
  agent: string;
  tool: string;
  parameters: any;
  allowed: boolean;
  violationReason?: string;
}

function logPermissionUsage(log: PermissionAuditLog): void {
  // Store in audit log
  const logEntry = {
    ...log,
    timestamp: new Date().toISOString()
  };
  
  // In production, this would go to a proper logging service
  console.log(`🔍 Permission audit: ${JSON.stringify(logEntry)}`);
}
```

This permission matrix ensures each agent operates within its specialized domain, reducing the risk of destructive actions and improving overall system reliability.