# Intellego Platform

Guidance for Claude Code when working with the Intellego Platform repository.

## Overview

Student progress management system for weekly academic reports. Production application with 169+ active students and instructors.

- Production: https://intellego-platform.vercel.app
- Zero downtime tolerance - real users active 24/7
- Auto-deploy on push to main via GitHub → Vercel pipeline

## Tech Stack

- Framework: Next.js 15.3.4 (App Router, React Server Components)
- Language: TypeScript 5.8.3 (strict mode enabled)
- Runtime: React 19.1.0
- Database: Turso libSQL via @libsql/client 0.8.1
- ORM: None (direct SQL via Turso client)
- Auth: NextAuth 5.0.0-beta.29 (credentials provider)
- Styling: Tailwind CSS 3.4.17 (utility-first, dark mode via next-themes 0.4.6)
- UI Components: Headless UI 2.2.9, Heroicons 2.2.0, Lucide React 0.523.0
- AI: Anthropic SDK 0.67.0 (Claude Haiku for automated feedback)
- Email: Nodemailer 6.10.1
- Testing: Manual testing (no automated test runner configured)
- Package Manager: npm (NOT pnpm or yarn)

## Project Structure

- `src/app/`: Next.js 15 App Router routes
  - `page.tsx`: Route pages (Server Components by default)
  - `route.ts`: API route handlers (NOT routes.ts - singular)
  - `layout.tsx`: Shared layouts
  - `api/`: API routes (auth(), must export const runtime = 'nodejs')
- `src/components/`: React components organized by feature
  - `instructor/`: Instructor-specific UI components
  - `student/`: Student-specific UI components
  - `evaluation/`: Exam evaluation UI components
  - `ui/`: Shared UI primitives (buttons, cards, modals)
- `src/lib/`: Business logic and utilities (NO UI components)
  - `auth.ts`: NextAuth configuration and session management
  - `db.ts`: Turso database client singleton
  - `evaluation/`: Exam evaluation system (complex, modular)
    - `__tests__/`: Colocated unit tests
    - `prompts/`: Claude AI prompt templates
- `src/services/`: External service integrations
  - `ai/claude/`: Claude AI integration for feedback generation
  - `ai/monitoring/`: AI usage tracking and cost monitoring
- `src/types/`: TypeScript type definitions and interfaces
- `documentation/`: All project documentation (NOT in root)
  - `CLAUDE-WORKFLOW.md`: Complete workflow procedures
  - `PROJECT-HISTORY.md`: Full development history

## Commands

```bash
# Development
npm run dev              # Start dev server on port 3000
npm run build            # Production build (generates .next/)
npm start                # Run production build (requires build first)
npm run lint             # ESLint check (auto-fix enabled)
npm run type-check       # TypeScript check without emitting files

# Session Management (Claude Code)
claude --continue        # Resume last Claude Code session
claude --resume          # Pick specific session to resume
```

## Code Style & Conventions

### Naming
- PascalCase: Components, Types, Interfaces (`UserCard`, `ApiResponse`, `Student`)
- camelCase: variables, functions, methods (`getUserData`, `isActive`, `fetchReport`)
- kebab-case: files, directories (`user-profile/`, `api-client.ts`, `weekly-reports.tsx`)
- UPPER_SNAKE_CASE: constants (`API_BASE_URL`, `MAX_RETRIES`, `DEFAULT_ROLE`)
- Boolean prefixes: is/has/should (`isLoading`, `hasPermission`, `shouldRefresh`)

### Imports
- Use path aliases: `@/*` for `src/*`, `@/auth` for root `auth.ts`
- Import order: external deps → internal modules → types
- Alphabetical within each group
- ES modules only (import/export, NEVER require())
- Destructure imports: `import { useState } from 'react'` not `import React from 'react'`

### TypeScript
- Strict mode: ALWAYS enabled (configured in tsconfig.json)
- NEVER use `any` type → use `unknown` or specific union types
- Catch blocks: error must be typed as `unknown`, then check `instanceof Error`
- All public functions: explicit return types required (no type inference)
- Prefer `interface` over `type` for object shapes (better error messages)
- Use `type` for unions, intersections, and utility types
- Type guards required when narrowing from `unknown`

### Formatting
- Indentation: 2 spaces (configured in tsconfig.json)
- Semicolons: required (enforced by ESLint)
- Quotes: single for strings, double for JSX attributes
- Line length: 100 characters recommended
- Trailing commas: always in multiline objects/arrays
- Arrow functions: always use parentheses `(x) => x` not `x => x`

## Critical Rules (DO NOT)

<critical_notes>

### Code Restrictions
- ❌ NEVER use `any` type → use `unknown` or specific union types
- ❌ NEVER query production DB without turso-intellego MCP tool
- ❌ NEVER use `db push` in production → use migrations only
- ❌ NEVER skip role-based authorization in API routes
- ❌ NEVER commit .env files, secrets, or API keys
- ❌ NEVER use class components → functional components with hooks only
- ❌ NEVER modify `Feedback.skillsMetrics` directly → read-only calculated field
- ❌ NEVER use inline styles → Tailwind utility classes only
- ❌ NEVER create files >400 lines → split into smaller modules
- ❌ NEVER use console.log in production → use winston logger

### API Route Restrictions
- ❌ NEVER forget `export const runtime = 'nodejs'` when using auth()
- ❌ NEVER return 200 for errors → use appropriate HTTP status codes
- ❌ NEVER skip authentication check with `await auth()`
- ❌ NEVER expose stack traces in production error responses
- ❌ NEVER trust client-provided user IDs → always use session.user.id
- ❌ NEVER make DB queries without proper parameterization (SQL injection)

### Database Restrictions
- ❌ NEVER query SkillsProgress table → data moved to Feedback.skillsMetrics
- ❌ NEVER use curl or bash for DB queries → use turso-intellego MCP
- ❌ NEVER commit schema changes without migration script
- ❌ NEVER expose raw SQL errors to client

### Workflow Restrictions
- ❌ NEVER commit directly to main → create feature branch + PR
- ❌ NEVER deploy without local testing
- ❌ NEVER skip diagnosis-specialist agent before starting task
- ❌ NEVER modify production DB without backup
- ❌ NEVER push breaking changes during active user hours (8am-11pm ART)

</critical_notes>

## MCP Usage (MANDATORY)

<paved_path>

ALWAYS use MCPs for their designated purposes. NO exceptions.

| MCP | Purpose | Never Use Instead |
|-----|---------|-------------------|
| **turso-intellego** | All production DB queries | curl, bash, local SQL clients |
| **github** | PRs, branches, code search | git CLI commands, GitHub web UI |
| **vercel** | Deployments, monitoring, logs | Vercel dashboard, curl to API |
| **context7** | Library documentation lookup | WebSearch, blog posts, Stack Overflow |

**Why:** MCPs provide authenticated access, proper error handling, and consistent interfaces.

</paved_path>

## Development Workflow

<workflow>

**MANDATORY SEQUENCE for every task:**

1. **DIAGNOSE** → Launch `diagnosis-specialist` agent first
   - Analyze current state and identify specific problem
   - No modifications, only analysis and reporting

2. **PLAN** → Select appropriate specialist agent based on diagnosis
   - `api-endpoint-creator`: API routes only
   - `Explore`: Codebase exploration and search
   - `general-purpose`: Complex multi-step tasks

3. **EXECUTE** → Implement changes with selected specialist agent
   - Follow diagnosis recommendations
   - Apply code style conventions
   - Respect critical rules

4. **VALIDATE** → Test changes before deployment
   - Run `npm run type-check` for TypeScript errors
   - Run `npm run lint` for linting issues
   - Test locally with `npm run dev`
   - Verify in production after auto-deploy

</workflow>

## Common Patterns

### Next.js 15 App Router

**✅ Correct: Server Component (default)**
```typescript
// src/app/dashboard/student/page.tsx
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  // Fetch data directly in component (no useEffect)
  const reports = await db.execute({
    sql: 'SELECT * FROM ProgressReport WHERE userId = ?',
    args: [session.user.id]
  });

  return <div>{/* Render */}</div>;
}
```

**❌ Incorrect: Client Component for server data**
```typescript
'use client';
import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // ❌ Don't fetch from client when server component can do it
    fetch('/api/student/reports').then(/* ... */);
  }, []);
}
```

**When to use 'use client':**
- React hooks (useState, useEffect, useContext)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window, document)
- Third-party libraries requiring browser (charts, animations)

### API Route Authentication

**✅ Correct: Proper auth check with role validation**
```typescript
// src/app/api/student/reports/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for auth()

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  if (session.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: 'Forbidden - student access only' },
      { status: 403 }
    );
  }

  // Use session.user.id, NEVER trust client-provided ID
  const userId = session.user.id;

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM ProgressReport WHERE userId = ?',
      args: [userId]
    });

    return NextResponse.json({ success: true, reports: result.rows });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('DB error:', error.message);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**❌ Incorrect: Multiple violations**
```typescript
// ❌ Missing runtime export
// ❌ No auth check
// ❌ Trusting client ID
// ❌ Untyped error handling
// ❌ Wrong status code

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // ❌ Never trust client

  try {
    const result = await db.execute({
      sql: `SELECT * FROM ProgressReport WHERE userId = ${userId}` // ❌ SQL injection
    });
    return NextResponse.json(result.rows); // ❌ Inconsistent response format
  } catch (error) { // ❌ Untyped error
    return NextResponse.json({ error: error.message }, { status: 200 }); // ❌ Wrong status
  }
}
```

### Error Handling Pattern

**✅ Correct: Typed error handling**
```typescript
try {
  const data = await riskyOperation();
  return data;
} catch (error: unknown) {
  // Type guard required for unknown
  if (error instanceof Error) {
    console.error('Operation failed:', error.message);

    // Handle specific error types
    if (error.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Record already exists' },
        { status: 409 }
      );
    }
  }

  // Generic fallback for unexpected errors
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

**❌ Incorrect: Silent failure or untyped errors**
```typescript
try {
  const data = await riskyOperation();
  return data;
} catch (error) { // ❌ Not typed as unknown
  console.log(error.message); // ❌ TypeScript error if not Error type
  return { success: true }; // ❌ Silent failure, hides error
}
```

### Database Query Pattern (Turso)

**✅ Correct: Parameterized queries with MCP**
```typescript
// Use turso-intellego MCP for production queries
// In code, use parameterized queries:

const result = await db.execute({
  sql: 'SELECT * FROM User WHERE email = ? AND role = ?',
  args: [email, role] // ✅ Safe parameterization
});

const users = result.rows as User[];
```

**❌ Incorrect: String interpolation (SQL injection)**
```typescript
const result = await db.execute({
  sql: `SELECT * FROM User WHERE email = '${email}'` // ❌ SQL INJECTION
});
```

## API Response Format

All API routes must follow consistent response structure:

### Success Responses

```typescript
// Single resource
return NextResponse.json({
  success: true,
  data: { id: '123', name: 'John' }
});

// Collection
return NextResponse.json({
  success: true,
  students: [...],
  count: 25
});

// Operation confirmation
return NextResponse.json({
  success: true,
  message: 'Report submitted successfully'
});
```

### Error Responses

```typescript
return NextResponse.json(
  { error: 'Descriptive error message for client' },
  { status: 400 | 401 | 403 | 404 | 409 | 500 }
);
```

### HTTP Status Code Usage

| Code | Usage | Example |
|------|-------|---------|
| 200 | Successful GET/PUT/PATCH/DELETE | Fetched reports successfully |
| 201 | Successful POST (resource created) | User registered successfully |
| 400 | Bad request (validation error) | Missing required field 'email' |
| 401 | Not authenticated (no session) | User must log in |
| 403 | Forbidden (wrong role/permission) | Admin access required |
| 404 | Resource not found | Report with ID not found |
| 409 | Conflict (duplicate/constraint) | Email already registered |
| 500 | Internal server error | Database connection failed |

## Database Schema

Core tables (Turso libSQL):

- `User`: Students, instructors, admins (auth + profile)
- `ProgressReport`: Weekly student reports (one per student per week)
- `Answer`: Individual question responses within reports
- `Feedback`: AI-generated feedback per report
  - `skillsMetrics`: JSON column with calculated skill scores (READ-ONLY)
- `CalendarEvent`: Weekly deadlines and events
- `Task`: Student-created tasks and goals

**CRITICAL:**
- Skills data stored in `Feedback.skillsMetrics` (JSON column)
- SkillsProgress table is DEPRECATED - do not query
- Use turso-intellego MCP for ALL production DB queries

## Testing Strategy

### Current State
- No automated test runner configured
- Manual testing required for all changes
- Test files exist in `src/lib/__tests__/` and `src/lib/evaluation/__tests__/`

### Testing Process
1. Make changes locally
2. Run `npm run type-check` to catch TypeScript errors
3. Run `npm run lint` to catch code style issues
4. Test manually with `npm run dev`
5. Verify specific user flows affected by changes
6. Monitor production after auto-deploy for errors

### Critical Test Scenarios
- Authentication flows (all three roles)
- API route authorization checks
- Database query results and error handling
- Feedback generation accuracy
- Email sending functionality

## Production Safety

<critical_notes>

**Zero downtime tolerance** - 169+ users active 24/7

### Pre-Deployment Checklist
- ✅ Tested locally with `npm run dev`
- ✅ TypeScript check passed (`npm run type-check`)
- ✅ Linting passed (`npm run lint`)
- ✅ Verified auth flows still work
- ✅ Confirmed no breaking changes to API contracts
- ✅ Checked Turso DB connection still valid

### Auto-Deploy Pipeline
- Push to `main` branch triggers automatic Vercel deployment
- Build time: ~2-3 minutes
- No manual deploy step required
- Monitor Vercel dashboard during deployment

### Emergency Rollback Protocol
If critical production issue occurs:

1. **Immediate rollback:**
   ```bash
   git revert <COMMIT_SHA>
   git push origin main
   ```
   Auto-deploy will restore previous version in ~3 minutes

2. **Monitor recovery:**
   - Check Vercel deployment status
   - Verify https://intellego-platform.vercel.app loads
   - Test critical user flows (login, report submission)

3. **Document incident:**
   - Record what went wrong in `/documentation/`
   - Add prevention rule to this CLAUDE.md if applicable

</critical_notes>

## Auto-Context Loading

When user requests `@CLAUDE.md`, automatically also read:
- `/documentation/CLAUDE-WORKFLOW.md` - Complete workflow procedures
- `/documentation/PROJECT-HISTORY.md` - Full development history

This ensures complete context for any development task.

## Documentation Updates

**MANDATORY:** When completing ANY significant task, you MUST update `/documentation/PROJECT-HISTORY.md`.

### What Requires Documentation

Update PROJECT-HISTORY.md for:
- ✅ New features or functionality
- ✅ Bug fixes (especially critical/production bugs)
- ✅ Database schema changes
- ✅ API endpoint additions/modifications
- ✅ Dependency updates or migrations
- ✅ Configuration changes
- ✅ Architecture decisions

### Documentation Format

Add entries at the TOP of PROJECT-HISTORY.md under `## 📅 Development Timeline`:

```markdown
### [Date] - [Brief Feature/Fix Title]

#### [Detailed Section Title]
- ✅ **Feature/Fix Name**: Description of what was done
- ✅ **Technical Detail**: Implementation specifics
- ⚠️ **Pending**: Any incomplete work or future tasks

**Technical Implementation:**
- Architecture and design decisions
- Key patterns or approaches used
- Performance considerations

**Files Created:**
- `/path/to/new/file.tsx` (lines) - Purpose

**Files Modified:**
- `/path/to/modified/file.tsx` - Changes made

**Bug Fixes (if applicable):**
1. **Fix #1**: Problem → Solution
2. **Fix #2**: Problem → Solution

**Testing Status:**
- ✅ Passing tests
- ⚠️ Pending validations

**Pending:**
- ⚠️ **Item 1**: Description
- ⚠️ **Item 2**: Description
```

### When to Document

- **Immediately after** completing a feature/fix
- **Before** marking task as complete in todo list
- **Before** creating a PR or committing to main
- **Never** skip documentation "to do it later"

### Workflow Integration

The updated workflow with documentation:

1. **DIAGNOSE** → Analyze problem
2. **PLAN** → Create implementation plan
3. **EXECUTE** → Implement changes
4. **VALIDATE** → Test and verify
5. **DOCUMENT** → Update PROJECT-HISTORY.md ← **NEW MANDATORY STEP**
6. **COMMIT** → Push changes to repository

---

**Last Updated:** 2025-01-07
**Lines:** 281
**PRD Compliance:** 100%