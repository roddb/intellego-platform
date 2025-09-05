# CLAUDE-WORKFLOW.md

Essential workflow guide for Claude Code on the Intellego Platform.

## 🚀 Quick Start

**Platform**: Student progress management system replacing Google Forms  
**Production URL**: https://intellego-platform.vercel.app  
**Stack**: Next.js 14, TypeScript, Tailwind CSS, Turso libSQL, Vercel

## 🔌 MCP Configuration (MANDATORY)

| MCP | Purpose | Primary Commands |
|-----|---------|-----------------|
| **turso-intellego** | Production DB (169+ users, 710+ reports) | `query_database`, `describe_table`, `list_tables` |
| **github** | Version control & PRs | `create_pull_request`, `search_code`, `create_branch` |
| **vercel** | Deployment & monitoring | `list_deployments`, `get_deployment`, `get_deployment_build_logs` |
| **context7** | Library documentation | `resolve-library-id`, `get-library-docs` |

### MCP Usage Rules

✅ **ALWAYS USE MCP for:**
- Database queries → turso-intellego (NEVER use curl/bash)
- Pull requests → github MCP
- Deployment checks → vercel MCP  
- Documentation → context7 MCP

❌ **NEVER:**
- Use curl for DB queries
- Create PRs manually
- Use WebSearch for technical docs
- Skip deployment verification

## 🤖 Specialized Agent System

**MANDATORY**: Always start with `diagnosis-specialist` for ANY development task.

### Agent Workflow Pattern
```
1. DIAGNOSIS → diagnosis-specialist (analyze problem)
2. PLANNING → Claude primary (select specialist)
3. EXECUTION → Specialized agent (implement)
4. VALIDATION → testing-validator (verify)
```

### Key Agents
- `diagnosis-specialist` - Problem analysis (READ-ONLY)
- `component-builder` - React components
- `api-endpoint-creator` - API routes
- `page-architect` - Next.js pages/routing
- `css-specialist` - Styling/UI
- `deployment-specialist` - Production deploys
- `emergency-responder` - Critical issues (requires authorization)

## 🔒 Development Protocol

### Pre-Development Checklist
```bash
# 1. Verify environment
npm run dev
npm run build
npm run lint
npm run type-check

# 2. Health check
curl -s http://localhost:3000/api/auth/providers
curl -s http://localhost:3000/api/test-libsql
```

### Commit Standards
```
FEAT: New feature
FIX: Bug fix
REFACTOR: Code restructuring
SECURITY: Security fixes
HOTFIX: Emergency fixes
```

### Production Deployment
1. Test locally completely
2. Commit to main branch
3. Auto-deploy to Vercel
4. Verify with vercel MCP
5. Test production endpoints

## 🚨 Emergency Procedures

### Quick Rollback
```bash
git log --oneline -10
git revert [BREAKING_COMMIT]
git push
```

### Emergency Authorization
```
SEVERITY: CRITICAL
USERS AFFECTED: [number]
Type "EMERGENCY AUTHORIZED" to activate emergency-responder
```

## 📊 Database Schema

```sql
-- Core tables
User (id, name, email, password, role, studentId, sede, division, subjects)
ProgressReport (id, userId, weekStart, weekEnd, subject, submittedAt)
Answer (id, questionId, progressReportId, answer)
CalendarEvent (id, userId, title, date, startTime, endTime)
Task (id, userId, title, dueDate, priority, status)
Feedback (id, studentId, weekStart, subject, skillsMetrics)
```

## 📁 Project Structure

```
/src/
  /app/           # Next.js App Router
  /components/    # React components
  /lib/           # Utilities & DB operations
/documentation/   # All docs & reports
/prisma/         # Database schema
```

## 🔧 Essential Commands

```bash
# Development
npm run dev
npm run build
npm run lint
npm run type-check

# MCP Management
claude mcp list
claude mcp remove [name]
claude mcp add [name] -- [command]

# Session Management  
claude --continue    # Resume last session
claude --resume      # Pick specific session
```

## ⚡ Quick Decision Matrix

| Task | Primary MCP | Secondary |
|------|------------|-----------|
| "How many reports?" | turso-intellego | - |
| "Production error" | vercel | turso-intellego |
| "New feature" | context7 | github |
| "User can't login" | turso-intellego | vercel |
| "Create PR" | github | - |

## 🎯 Workflow Rules

1. **Always use MCPs** - No manual operations when MCP available
2. **Diagnosis first** - Start every task with diagnosis-specialist
3. **Test locally** - Complete local testing before deployment
4. **Verify deployment** - Check Vercel after every push
5. **Document changes** - Update relevant docs after major changes

## 🔑 Critical Reminders

- Platform serves REAL students/instructors
- Zero downtime tolerance
- All DB queries via turso-intellego MCP
- Skill metrics in Feedback table (not SkillsProgress)
- TypeScript error checking in catch blocks
- Runtime config needed for auth() routes

## 📞 Support Resources

- Vercel Status: https://vercel.com/status
- Turso Status: https://turso.tech/status
- GitHub Status: https://githubstatus.com
- Production: https://intellego-platform.vercel.app