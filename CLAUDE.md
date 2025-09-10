# CLAUDE.md

Guidance for Claude Code when working with the Intellego Platform repository.

## Project Overview

**Intellego Platform** - Student progress management system for weekly academic reports.

- **Production**: https://intellego-platform.vercel.app
- **Stack**: Next.js 14, TypeScript, Tailwind CSS, Turso libSQL, Vercel
- **Users**: 169+ students/instructors actively using the platform

## 🔌 MCP Usage (MANDATORY)

**ALWAYS use MCPs for their designated purposes:**

| MCP | Purpose | Never Use |
|-----|---------|-----------|
| **turso-intellego** | All production DB queries | curl, bash, local SQL |
| **github** | PRs, branches, code search | git CLI, web UI |
| **vercel** | Deployments, monitoring | dashboard, curl |
| **context7** | Library documentation | WebSearch, blogs |

## 🤖 Development Workflow

**MANDATORY SEQUENCE:**
1. **DIAGNOSE** → Use `diagnosis-specialist` agent first
2. **PLAN** → Select appropriate specialist agent
3. **EXECUTE** → Implement with specialized agent
4. **VALIDATE** → Test with `testing-validator`

## 📊 Database Schema

Core tables: `User`, `ProgressReport`, `Answer`, `CalendarEvent`, `Task`, `Feedback`

**Critical**: Skills metrics stored in `Feedback.skillsMetrics` (JSON column)

## 🚀 Commands

```bash
# Development
npm run dev
npm run build
npm run lint
npm run type-check

# Session Management
claude --continue  # Resume last session
claude --resume    # Pick specific session
```

## 🔒 Production Safety

- **Zero downtime tolerance** - Real users active 24/7
- **Test locally first** - Complete testing before deployment
- **Auto-deploy on push** - GitHub → Vercel pipeline
- **Immediate rollback** - `git revert` within 5 minutes if needed

## 📁 Project Structure

```
/src/              # Application code
/documentation/    # All docs and reports
  CLAUDE-WORKFLOW.md  # Essential workflow guide
  PROJECT-HISTORY.md  # Complete development history
```

## 🚨 Emergency Protocol

For critical production issues:
1. Use `emergency-responder` agent (requires "EMERGENCY AUTHORIZED")
2. Quick rollback: `git revert [COMMIT] && git push`
3. Monitor: Vercel dashboard for deployment status

## 🔑 Critical Reminders

- Use MCP for ALL designated operations (no exceptions)
- Start EVERY task with diagnosis-specialist
- TypeScript error checking required in catch blocks
- Runtime config needed for auth() API routes
- Skills data in Feedback table, not SkillsProgress

---

## 📖 Auto-Context Loading

**IMPORTANT**: When user requests `@CLAUDE.md`, automatically also read:
- `/documentation/CLAUDE-WORKFLOW.md` - Complete workflow procedures
- `/documentation/PROJECT-HISTORY.md` - Full development history

This ensures complete context for any development task.

**For complete workflow details**: See `/documentation/CLAUDE-WORKFLOW.md`  
**For project history**: See `/documentation/PROJECT-HISTORY.md`