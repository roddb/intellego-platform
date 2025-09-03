# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intellego Platform** - A student progress management platform that replaces Google Forms with a dedicated web application for tracking weekly student progress reports.

### Core Features
- Student authentication with academic profiles
- Weekly progress reporting system with calendar view
- Dual storage system (SQLite database + JSON file organization)
- Smart organizador inteligente with schedule management
- Mac-style UI design with calming aesthetics

### Target Users
- Students (complete weekly progress reports, manage schedule)
- Instructors (view and manage student progress data)

## Technology Stack

**Frontend**: Next.js 14+ with TypeScript
**Styling**: Tailwind CSS with Mac-style design
**Authentication**: NextAuth.js (credentials provider)
**Database**: Turso libSQL (serverless SQLite)
**File System**: Automated JSON export by student folders
**Deployment**: Vercel with automatic GitHub integration

## Database Schema (Current - libSQL)

```sql
-- Tabla de usuarios
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'STUDENT',
  studentId TEXT UNIQUE,
  sede TEXT,
  academicYear TEXT,
  division TEXT,
  subjects TEXT, -- JSON string de materias
  status TEXT DEFAULT 'ACTIVE',
  emailVerified TEXT,
  image TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Tabla de reportes de progreso
CREATE TABLE ProgressReport (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  weekStart TEXT NOT NULL,
  weekEnd TEXT NOT NULL,
  subject TEXT,
  submittedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Tabla de respuestas a reportes
CREATE TABLE Answer (
  id TEXT PRIMARY KEY,
  questionId TEXT NOT NULL,
  progressReportId TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (progressReportId) REFERENCES ProgressReport(id)
);

-- Tabla de eventos de calendario
CREATE TABLE CalendarEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  startTime TEXT,
  endTime TEXT,
  type TEXT DEFAULT 'personal',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Tabla de tareas
CREATE TABLE Task (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  subject TEXT,
  estimatedHours INTEGER,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database
# Local: Uses SQLite (./prisma/data/intellego.db)
# Production: Uses Turso libSQL (automatic connection)
# No additional commands needed - libSQL client handles everything
```

## Demo Credentials

- **Student**: `estudiante@demo.com` / `Estudiante123!!!`
- **Instructor**: `instructor@demo.com` / `123456` (local only)
- **Instructor Production**: `rdb@intellego.com` / `02R07d91!` (Turso)
- **Registration**: Available at `/auth/signup`

## Current System Status

### Core Functionality (100% Operational)
- ✅ Turso libSQL database with direct SQL queries
- ✅ User registration with automatic `studentId` generation
- ✅ Weekly progress reports with calendar view
- ✅ Dual file storage (database + JSON folders)
- ✅ Student organizer with calendar and tasks
- ✅ Academic hierarchy: sede/año/división/materia/estudiante
- ✅ Instructor hierarchical dashboard: materias→año→curso→estudiantes→semanas
- ✅ JSON export functionality for individual reports
- ✅ Serverless deployment on Vercel
- ✅ Automatic CI/CD pipeline
- ✅ AI functionality completely removed (2025-01-13)

### File Organization
```
data/student-reports/
├── [sede]/
│   ├── [año]/
│   │   ├── [division]/
│   │   │   ├── [materia]/
│   │   │   │   └── EST-2025-XXX_nombre/
│   │   │   │       └── YYYY-MM-DD_materia_reporte.json
```

### Database Location
- **Development**: `prisma/data/intellego.db` (Local SQLite)
- **Production**: Turso Cloud Database (libSQL) - 140 users, 176 reports (2025-01-13)
- **Management**: https://app.turso.tech/roddb/databases/intellego-production

## 🤖 SPECIALIZED AGENT SYSTEM

⚠️ **AGENT SYSTEM COMPLETELY TRANSFORMED (August 2025)**

The platform now uses a **specialized agent architecture** that replaced the previous generic agents, achieving **88% reduction in destructive actions** and **100% problem understanding before execution**.

### 🎯 Active Specialized Agents (12)

**CRITICAL**: Always use **diagnosis-specialist FIRST** before any development task.

| Agent | Responsibility | Restrictions |
|-------|----------------|--------------|
| **diagnosis-specialist** | Problem analysis & root cause identification | ❌ NO modifications, ONLY analysis |
| **component-builder** | Individual React component development | ❌ NO pages/routing/deployment |
| **css-specialist** | Styling, design system, Mac-style UI fixes | ❌ NO components/deployment |
| **api-endpoint-creator** | API routes and backend logic only | ❌ NO database schema/auth changes |
| **page-architect** | Next.js App Router pages, layouts, routing | ❌ NO components/database |
| **database-query-optimizer** | Query optimization, indexing, performance | ❌ NO schema changes/migrations |
| **file-system-manager** | JSON exports, file operations, dual storage | ❌ NO database/API operations |
| **security-validator** | Security analysis & vulnerability assessment | ❌ NO implementations, ONLY reports |
| **build-optimizer** | Bundle analysis, build performance tuning | ❌ NO features/deployment |
| **deployment-specialist** | Production deployments, Vercel monitoring | ❌ NO code editing/database |
| **testing-validator** | Quality assurance, test execution, validation | ❌ NO modifications, ONLY testing |
| **emergency-responder** | Critical production emergencies ONLY | ⚠️ Requires explicit user authorization |

### 🔄 Mandatory Workflow Pattern

**EVERY development task MUST follow this sequence:**

```
1. DIAGNOSIS → diagnosis-specialist (ALWAYS FIRST)
   ↓ Analyze problem, understand requirements
2. PLANNING → Claude primary agent
   ↓ Select appropriate specialist, plan approach  
3. EXECUTION → Selected specialist agent
   ↓ Implement with restricted permissions
4. VALIDATION → testing-validator
   ↓ Verify functionality, run tests
```

### 🔒 Permission Matrix

**READ-ONLY AGENTS** (Analysis only):
- `diagnosis-specialist`, `security-validator`, `testing-validator`

**MODIFICATION AGENTS** (Specific changes):
- `component-builder`, `css-specialist`, `api-endpoint-creator`, `page-architect`, `database-query-optimizer`, `file-system-manager`

**INFRASTRUCTURE AGENTS** (Deployment/Build):
- `build-optimizer`, `deployment-specialist`

**EMERGENCY ACCESS** (Requires authorization):
- `emergency-responder` (ALL tools, explicit approval required)

### 🆘 Emergency Response Protocol

The `emergency-responder` agent is ONLY activated for:
- Production platform outages affecting real users
- Data corruption or security breaches
- Critical system failures requiring immediate intervention

**Activation requires explicit user authorization:**
```
EMERGENCY AUTHORIZATION REQUEST
SEVERITY: [CRITICAL/HIGH]
USERS AFFECTED: [Number]
AUTHORIZATION: Type "EMERGENCY AUTHORIZED" to proceed
```

## 📁 PROJECT FILE ORGANIZATION

⚠️ **PROJECT STRUCTURE COMPLETELY REORGANIZED (August 2025)**

The project has been transformed from **60+ scattered files** in the root to a **professional, categorized structure**.

### 📊 Directory Structure

```
📁 /documentation/              # All project documentation
├── 📁 /reports/               # Generated reports and analysis
│   ├── 📁 /analysis/          # Data analysis and investigations (8 files)
│   ├── 📁 /production/        # Production deployment reports (9 files)
│   ├── 📁 /testing/           # Test reports and checklists (8 files)
│   ├── 📁 /migration/         # Database migration reports (4 files)
│   └── 📁 /security/          # Security audits and configurations (4 files)
├── 📁 /deployment/            # Deployment procedures and safety protocols
├── 📁 /setup-guides/          # Configuration guides (OAuth, passwords, etc.)
└── 📁 /project-docs/          # Core project documentation

📁 /backups/                   # Database backups and sync files (gitignored)
📁 /temp-scripts/              # Temporary testing scripts (gitignored)
📁 /logs/                      # System logs and debug files (gitignored)
```

### 🧹 Clean Root Policy

**ROOT DIRECTORY NOW CONTAINS ONLY:**
- Essential config files: `package.json`, `tsconfig.json`, `tailwind.config.js`
- Critical documentation: `CLAUDE.md`, `vercel.json`
- Core project folders: `src/`, `prisma/`, `public/`, `node_modules/`

**ALL OTHER FILES ORGANIZED INTO:**
- Documentation → `/documentation/` with proper categorization
- Scripts → `/temp-scripts/` for development utilities
- Backups → `/backups/` for database and sync files
- Logs → `/logs/` for debugging and audit trails

### 🔄 File Organization Benefits

- ✅ **Professional Structure**: Easy navigation and collaboration
- ✅ **Version Control**: Clean .gitignore for organized repositories
- ✅ **Scalability**: Structure prepared for project growth
- ✅ **Documentation Access**: Quick location of specific reports
- ✅ **Development Efficiency**: Separated code from documentation

### 🔍 Finding Files

**For specific documentation:**
- Analysis reports → `/documentation/reports/analysis/`
- Production issues → `/documentation/reports/production/`
- Security audits → `/documentation/reports/security/`
- Setup instructions → `/documentation/setup-guides/`
- Deployment procedures → `/documentation/deployment/`

**For development files:**
- Temporary scripts → `/temp-scripts/`
- System logs → `/logs/`
- Database backups → `/backups/`

## 💾 CLAUDE CODE SESSION MANAGEMENT

### 🔄 Resuming Work Sessions

```bash
# Continue most recent conversation immediately
claude --continue

# Show interactive picker to select specific session
claude --resume
```

**Session Features:**
- Entire message history preserved
- Tool usage and results restored
- Original model and configuration maintained
- Todo lists and context carried forward

### 📝 Managing Session Context

**Within Claude Code:**
```
/memory         # Edit this CLAUDE.md file to preserve context
/compact        # Condense long conversations for efficiency
/todo           # View and manage task tracking
```

### 💡 Session Continuity Best Practices

1. **Document Progress**: Use `/memory` to update CLAUDE.md with current status
2. **Track Tasks**: Maintain todos throughout development sessions
3. **Quick Resume**: Use `--continue` for immediate pickup where left off
4. **Specific Sessions**: Use `--resume` when you need a particular past conversation
5. **Context Preservation**: Key decisions and configurations persist via CLAUDE.md

**Example Workflow:**
```bash
# End of work session
/memory    # Document current progress in CLAUDE.md
# Exit Claude Code

# Next day
claude --continue    # Pick up exactly where you left off
```

## Server Restart Protocol

⚠️ **ALWAYS restart after major changes:**

```bash
# Quick restart
pkill -f "npm run dev" || true
npm run dev

# Health check
curl -s http://localhost:3000/api/auth/providers > /dev/null && echo "✅ Server OK"
```

## Modalidades de Trabajo para Desarrollo Futuro

### 🤖 Specialized Agent Workflow (MANDATORY)

**NEW DEVELOPMENT PROTOCOL**: All development MUST use specialized agents following diagnosis-first workflow.

### 🚨 **PRODUCTION-FIRST PROTOCOL FOR BUG FIXES**

**For production issues affecting real users, use REFINED Production Bug Fix Workflow:**

```bash
# 1. CONTEXT VERIFICATION (Always first for production issues)
"User reports production issue" 
→ diagnosis-specialist verifies: Is this affecting production users?
→ Test exact user scenario in production environment
→ Confirm business impact and urgency

# 2. COMPREHENSIVE DIAGNOSIS (NEVER stop at first issue found)
→ diagnosis-specialist identifies ALL root causes
→ Maps complete failure chain and dependencies
→ Tests every suspected issue in production
→ Creates complete inventory of problems

# 3. SEQUENTIAL PLANNING
→ Claude primary agent orders fixes by dependency
→ Plans Fix → Deploy → Validate → Next Fix cycle
→ Defines specific validation for each change

# 4. INCREMENTAL IMPLEMENTATION
→ Fix ONE issue → Commit/Push → Deploy → Validate in production
→ IF validation fails: STOP and re-diagnose
→ IF validation succeeds: Continue to next issue
→ NEVER implement multiple fixes before validating

# 5. PRODUCTION VALIDATION (NEW - Mandatory)
→ production-validator tests exact user scenario
→ Verifies no regressions in related functionality
→ Confirms system performance and stability
→ Must PASS before declaring resolved

# 6. USER CONFIRMATION
→ Provide evidence of successful fix
→ Include test results and validation proof
→ ONLY declare "resolved" after production validation
```

### 🎯 **Standard Development Cycle (Non-production issues):**
```bash
# 1. DIAGNOSIS PHASE (Always first)
"I need to implement [feature]" 
→ Claude activates diagnosis-specialist
→ Problem analysis and requirements gathering
→ Technical feasibility assessment

# 2. PLANNING PHASE 
→ Claude primary agent selects appropriate specialist
→ Creates implementation plan
→ Defines success criteria

# 3. EXECUTION PHASE
→ Specialist agent (component-builder, api-endpoint-creator, etc.)
→ Implements with restricted permissions
→ Follows platform patterns and conventions

# 4. VALIDATION PHASE
→ testing-validator runs comprehensive tests
→ Verifies functionality and performance
→ Ensures no regressions

# 5. DEPLOYMENT PHASE (if needed)
→ deployment-specialist handles production deployment
→ Monitors deployment success
→ Executes rollback if issues arise
```

### 🔍 **Workflow Selection Criteria**

**Use PRODUCTION-FIRST workflow when:**
- User reports error affecting production platform
- Real users cannot complete their tasks
- Production data or functionality is impacted
- Error messages or failures occur in live environment

**Use STANDARD workflow when:**
- Implementing new features
- Enhancement requests
- Local development issues
- Non-urgent improvements

### 🎯 **WORKFLOW SELECTOR RÁPIDO**

**Para activar workflows específicos, usa estas frases:**

| Situación | Frase de Activación | Workflow Ejecutado |
|-----------|-------------------|-------------------|
| **Nueva funcionalidad** | "Necesito implementar [descripción]" | Feature Development Workflow |
| **Error o bug** | "Hay un problema con [descripción]" | Bug Fix Workflow |
| **Lentitud del sistema** | "El sistema va lento en [área]" | Performance Optimization Workflow |
| **Cambio visual/UI** | "Quiero cambiar el diseño de [componente]" | UI/UX Design Workflow |
| **Problema de seguridad** | "Encontré un problema de seguridad" | Security Issue Workflow |
| **Desplegar a producción** | "Quiero desplegar [cambios]" | Deployment Workflow |
| **Emergencia en producción** | "EMERGENCIA: [descripción crítica]" | Emergency Response Workflow |

**Workflows Detallados**: Ver `.claude/agents/workflow-templates.md` para especificaciones técnicas completas.

### 🔄 Traditional Development Pipeline

**GitHub → Vercel Pipeline** (unchanged):
1. Commits a `main` branch → Despliegue automático
2. Testing automático en Vercel
3. Rollback automático si fallan los builds
4. Monitoreo de errores en tiempo real

**Process with Agent Integration:**
```bash
# 1. Local development with specialized agents
diagnosis-specialist → analyze requirements
[specialist-agent] → implement solution
testing-validator → verify functionality

# 2. Commit and deploy
git add .
git commit -m "FEAT: [Agent-implemented feature]"
git push

# 3. Monitor deployment
deployment-specialist → verify production health
# 4. Verify in: https://intellego-platform.vercel.app
```

### 🛠️ Tipos de Modificaciones y Agentes Requeridos

#### **Nuevas Funcionalidades**
- **APIs**: `api-endpoint-creator` → Crear en `/src/app/api/[nombre]/route.ts`
- **Páginas**: `page-architect` → Agregar en `/src/app/[ruta]/page.tsx`  
- **Componentes**: `component-builder` → Añadir en `/src/components/`
- **Consultas DB**: `database-query-optimizer` → Modificar `/src/lib/db-operations.ts`
- **Archivos JSON**: `file-system-manager` → Gestionar dual storage system

#### **Modificaciones de UI/UX**
- **Estilos Mac**: `css-specialist` → Editar `/src/app/globals.css` o componentes
- **Layout**: `page-architect` → Modificar `/src/app/layout.tsx`
- **Navegación**: `component-builder` → Actualizar `/src/components/Navigation.tsx`
- **Diseño responsivo**: `css-specialist` → Ajustes Tailwind y breakpoints

#### **Performance y Optimización**
- **Build optimization**: `build-optimizer` → Webpack, bundle analysis
- **Query performance**: `database-query-optimizer` → Índices, optimización SQL
- **Deployment**: `deployment-specialist` → Vercel configuration, monitoring

#### **Seguridad y Testing**
- **Security analysis**: `security-validator` → Vulnerability assessment (read-only)
- **Quality assurance**: `testing-validator` → Test execution and validation
- **Emergency fixes**: `emergency-responder` → Critical production issues ONLY

### 🎯 Protocolo para No-Programadores

#### **Solicitar Modificaciones**
**Información mínima requerida:**
1. **Descripción exacta** del cambio deseado
2. **Pantallas afectadas** (URLs específicas)
3. **Comportamiento esperado** (paso a paso)
4. **Casos edge** o consideraciones especiales

#### **Ejemplo de Solicitud Correcta:**
```
SOLICITUD: Agregar campo "Teléfono de emergencia" al registro
UBICACIÓN: /auth/signup
COMPORTAMIENTO: 
- Campo opcional después del teléfono normal
- Validación: solo números y guiones
- Guardar en base de datos User.emergencyPhone
- Mostrar en perfil de estudiante
```

#### **Proceso de Implementación:**
1. **Análisis** → Claude evalúa factibilidad
2. **Desarrollo** → Implementación automática
3. **Testing** → Verificación local + producción
4. **Despliegue** → Push automático a Vercel
5. **Validación** → Confirmar funcionamiento

### 📊 Gestión de Datos y Escalabilidad

#### **Monitoreo de Límites Turso (Plan Gratuito)**
- **Lecturas**: 500M/mes (actual: ~1M)
- **Escrituras**: 10M/mes (actual: ~1K)
- **Almacenamiento**: 5GB (actual: ~50MB)

#### **Señales de Upgrade Necesario:**
- \> 1000 usuarios activos/mes
- \> 50K reportes semanales/mes
- Errores de `BLOCKED` en logs de Vercel

#### **Estrategias de Optimización:**
```sql
-- Crear índices para queries frecuentes
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_reports_user_week ON ProgressReport(userId, weekStart);
```

#### **Plan de Crecimiento:**
- **0-100 usuarios**: Plan gratuito Turso
- **100-1000 usuarios**: Developer Plan ($5/mes)
- **1000+ usuarios**: Scaler Plan ($25/mes)

### 🔧 Comandos de Diagnóstico

#### **Verificar Conexión Database:**
```bash
curl https://intellego-platform.vercel.app/api/test-libsql
```

#### **Verificar Autenticación:**
```bash
curl https://intellego-platform.vercel.app/api/auth/providers
```

#### **Monitorear Logs de Producción:**
1. Ir a https://vercel.com/dashboard
2. Seleccionar `intellego-platform`
3. Tab "Functions" → Ver logs en tiempo real

### 📝 Documentación de Decisiones

**Registro de cambios importantes:**
- Migración Prisma → libSQL (Agosto 2025): Solución a errores serverless
- Implementación lazy loading: Optimización para Vercel
- Sistema dual storage: Database + JSON para análisis offline

**Próximas consideraciones:**
- Implementar caching para queries frecuentes
- Agregar analytics de uso
- Sistema de notificaciones push
- Exportación avanzada de datos

## 🚨 NEW DEVELOPMENT WORKFLOW PROTOCOL (CRITICAL)

⚠️ **PRODUCTION PLATFORM IN USE - ZERO DOWNTIME TOLERANCE**

The Intellego Platform is currently being used by real students and instructors in production. Any breaking change could disrupt their academic workflow and progress tracking.

### 🔒 MANDATORY SECURITY WORKFLOW

**ALL DEVELOPMENT MUST FOLLOW THIS PROTOCOL:**

1. **LOCAL-FIRST DEVELOPMENT**
   - ALL changes must be developed and tested locally first
   - NO direct commits to main without local testing
   - Use `npm run dev` for local development server
   - Test ALL functionality before considering deployment

2. **COMPREHENSIVE LOCAL TESTING**
   - Authentication flows (login/logout/signup)
   - Progress report submission and persistence
   - Calendar functionality
   - Database operations (read/write)
   - User role permissions
   - File system operations (JSON exports)

3. **DEPLOYMENT SAFETY**
   - Only commit after 100% local verification
   - GitHub auto-deploys to Vercel (NO manual intervention)
   - Monitor Vercel deployment logs immediately after push
   - Have rollback plan ready if issues arise

4. **ROLLBACK PROTOCOL**
   ```bash
   # If deployment breaks production:
   git log --oneline -5  # Find last working commit
   git revert [COMMIT_HASH]  # Revert breaking change
   git push  # Auto-deploy fix
   ```

### ⚡ DEVELOPMENT COMMANDS

```bash
# MANDATORY before any commit:
npm run dev              # Start local server
npm run build           # Test production build
npm run lint            # Check code quality
npm run type-check      # Verify TypeScript

# Health verification:
curl -s http://localhost:3000/api/auth/providers > /dev/null && echo "✅ Auth OK"
curl -s http://localhost:3000/api/test-libsql > /dev/null && echo "✅ DB OK"
```

## 🎯 COMPLETE AI ASSESSMENT SYSTEM ROADMAP

**APPROVED PROJECT**: Comprehensive AI-powered assessment and rubric system for the Intellego Platform.

### 📋 IMPLEMENTATION PHASES

#### **PHASE 1: Foundation Setup (Infrastructure Agent)**
**Status**: Ready to Begin  
**Agent**: DevOps/System Administration Expert  
**Duration**: 2-3 days

**Tasks:**
- [ ] Create database schema for rubrics, criteria, and assessments
- [ ] Set up subject-specific configuration management
- [ ] Implement sede-specific rubric variations
- [ ] Create AI assessment service foundation
- [ ] Configure environment variables for AI services

**Database Extensions:**
```sql
-- Rubrics table
CREATE TABLE Rubric (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  sede TEXT NOT NULL,
  academicYear TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  totalPoints INTEGER NOT NULL,
  criteria TEXT, -- JSON array of criteria
  aiPromptTemplate TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES User(id)
);

-- Assessment table
CREATE TABLE Assessment (
  id TEXT PRIMARY KEY,
  rubricId TEXT NOT NULL,
  progressReportId TEXT NOT NULL,
  userId TEXT NOT NULL,
  aiScore INTEGER,
  aiAnalysis TEXT, -- JSON with detailed breakdown
  instructorOverride INTEGER,
  instructorComments TEXT,
  status TEXT DEFAULT 'PENDING',
  assessedAt TEXT,
  FOREIGN KEY (rubricId) REFERENCES Rubric(id),
  FOREIGN KEY (progressReportId) REFERENCES ProgressReport(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

#### **PHASE 2: Rubric Management System (Frontend Specialist)**
**Status**: Pending Phase 1  
**Agent**: React/Next.js Frontend Expert  
**Duration**: 3-4 days

**Tasks:**
- [ ] Create rubric builder interface for instructors
- [ ] Implement subject-specific rubric templates
- [ ] Build criteria management system
- [ ] Create rubric preview and testing interface
- [ ] Implement rubric versioning system

**Key Components:**
- `/admin/rubrics` - Rubric management dashboard
- `/admin/rubrics/new` - Rubric builder
- `/admin/rubrics/[id]/edit` - Rubric editor
- `RubricBuilder.tsx` - Drag-and-drop rubric creator
- `CriteriaManager.tsx` - Individual criteria configuration

#### **PHASE 3: AI Integration Core (AI/ML Specialist)**
**Status**: Pending Phase 2  
**Agent**: AI/ML Integration Expert  
**Duration**: 4-5 days

**Tasks:**
- [ ] Integrate OpenAI/Claude API for assessment
- [ ] Create prompt engineering system
- [ ] Implement assessment scoring algorithms
- [ ] Build assessment result processing
- [ ] Create feedback generation system

**AI Services:**
- Assessment service with configurable prompts
- Rubric-aware scoring system
- Natural language feedback generation
- Confidence scoring for AI assessments
- Fallback mechanisms for API failures

#### **PHASE 4: Assessment Dashboard (Data Visualization Expert)**
**Status**: Pending Phase 3  
**Agent**: Dashboard/Analytics Specialist  
**Duration**: 3-4 days

**Tasks:**
- [ ] Create instructor assessment dashboard
- [ ] Build student progress visualization
- [ ] Implement assessment history tracking
- [ ] Create comparative analytics
- [ ] Build assessment export system

**Dashboard Features:**
- Real-time assessment results
- Student progress trending
- Rubric effectiveness metrics
- Batch assessment processing
- Assessment override interface

#### **PHASE 5: Student Feedback Interface (UX/UI Specialist)**
**Status**: Pending Phase 4  
**Agent**: User Experience Expert  
**Duration**: 2-3 days

**Tasks:**
- [ ] Design student assessment results view
- [ ] Create progress tracking interface
- [ ] Implement improvement suggestions
- [ ] Build assessment history for students
- [ ] Create goal-setting interface

**Student Features:**
- Personalized assessment feedback
- Progress visualization
- Improvement recommendations
- Goal tracking system
- Historical performance analysis

#### **PHASE 6: Advanced Analytics (Data Analytics Expert)**
**Status**: Pending Phase 5  
**Agent**: Data Analytics Specialist  
**Duration**: 3-4 days

**Tasks:**
- [ ] Implement learning analytics
- [ ] Create predictive modeling
- [ ] Build instructor insights dashboard
- [ ] Develop sede-wide reporting
- [ ] Create academic performance trends

**Analytics Features:**
- Learning pattern recognition
- At-risk student identification
- Subject-specific performance insights
- Sede comparative analysis
- Predictive academic outcomes

#### **PHASE 7: System Integration & Testing (QA/Integration Specialist)**
**Status**: Pending Phase 6  
**Agent**: Quality Assurance Expert  
**Duration**: 2-3 days

**Tasks:**
- [ ] Comprehensive system testing
- [ ] Performance optimization
- [ ] Security audit and hardening
- [ ] Documentation completion
- [ ] Production deployment verification

**Final Deliverables:**
- Complete AI assessment system
- User training documentation
- Admin configuration guides
- Performance monitoring setup
- Maintenance procedures

### 🔄 DEVELOPMENT PROTOCOL FOR EACH PHASE

**Phase Initiation:**
1. Create feature branch: `feature/phase-[X]-[description]`
2. Complete local development following security workflow
3. Comprehensive testing with real data scenarios
4. Peer review with previous phase deliverables
5. Integration testing with existing system
6. Documentation update
7. Production deployment via main branch

**Quality Gates:**
- [ ] All tests passing locally
- [ ] No breaking changes to existing functionality
- [ ] Database migrations tested
- [ ] User role permissions verified
- [ ] Performance benchmarks met
- [ ] Security audit completed

## ✅ DEPLOYMENT SAFETY CHECKLIST

**MANDATORY CHECKLIST BEFORE ANY COMMIT/PUSH:**

### 🔍 PRE-COMMIT VERIFICATION

- [ ] **Local Development Server Running**: `npm run dev` successful
- [ ] **Authentication Working**: Login/logout flows tested
- [ ] **Database Connection**: Local and production DB accessible
- [ ] **Core Features**: Progress reports, calendar, tasks functional
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Type Safety**: `npm run type-check` passes
- [ ] **Code Quality**: `npm run lint` passes with no critical issues

### 🧪 FUNCTIONAL TESTING

- [ ] **User Registration**: New user signup works
- [ ] **User Login**: Existing user authentication works
- [ ] **Progress Reports**: Report submission and persistence
- [ ] **Calendar Integration**: Events creation and display
- [ ] **File System**: JSON export functionality
- [ ] **Role Permissions**: Student/Instructor access controls
- [ ] **Database Operations**: CRUD operations functioning

### 🚀 DEPLOYMENT READINESS

- [ ] **Environment Variables**: All required vars configured
- [ ] **Dependencies**: No missing or conflicting packages
- [ ] **API Endpoints**: All routes responding correctly
- [ ] **Error Handling**: Graceful error recovery implemented
- [ ] **Performance**: No significant performance degradation
- [ ] **Security**: No exposed credentials or vulnerabilities

### 📊 POST-DEPLOYMENT MONITORING

**IMMEDIATELY after push to main:**

1. **Vercel Dashboard Check** (< 2 minutes)
   - Deployment status: Success
   - Build logs: No errors
   - Function status: All healthy

2. **Production Health Check** (< 5 minutes)
   ```bash
   curl https://intellego-platform.vercel.app/api/auth/providers
   curl https://intellego-platform.vercel.app/api/test-libsql
   ```

3. **User Flow Verification** (< 10 minutes)
   - Test login with demo account
   - Submit test progress report
   - Verify data persistence
   - Check JSON file generation

### 🆘 EMERGENCY ROLLBACK PROCEDURE

**For CRITICAL production emergencies affecting real users:**

#### **Standard Emergency Response**
```bash
# Immediate rollback (execute within 5 minutes)
git log --oneline -10                    # Find last working commit
git revert [BREAKING_COMMIT_HASH]        # Create revert commit
git push                                 # Auto-deploy rollback

# Alternative: Hard reset (use only if revert fails)
git reset --hard [LAST_WORKING_COMMIT]
git push --force-with-lease
```

#### **Emergency-Responder Activation**
**For complex emergencies requiring full tool access:**

```
EMERGENCY AUTHORIZATION REQUEST
SEVERITY: CRITICAL
ISSUE: [Platform outage/data corruption/security breach]
USERS AFFECTED: [Number of students/instructors impacted]
BUSINESS IMPACT: [Academic disruption details]
AUTHORIZATION: Type "EMERGENCY AUTHORIZED" to proceed
```

**Emergency-Responder Capabilities:**
- Full tool access for rapid diagnosis and repair
- Direct database operations for data recovery
- Emergency deployment and rollback procedures
- System-wide diagnostics and monitoring
- Real-time incident coordination

**Activation Criteria:**
- Production platform completely inaccessible
- Student data corruption or loss
- Security breach affecting user data
- System failures disrupting academic workflow
- Standard agents cannot resolve the issue

#### **Emergency Contacts**
- Vercel Status: https://vercel.com/status
- Turso Status: https://turso.tech/status
- GitHub Status: https://githubstatus.com

#### **Post-Emergency Protocol**
After resolution, emergency-responder provides:
- Complete incident timeline
- Root cause analysis
- Data integrity verification
- Prevention recommendations

### 📝 COMMIT MESSAGE STANDARDS

**Format**: `[TYPE]: [Brief description]`

**Types:**
- `FEAT`: New feature implementation
- `FIX`: Bug fix or error correction
- `REFACTOR`: Code restructuring without functionality change
- `CONFIG`: Configuration or environment changes
- `DOCS`: Documentation updates
- `SECURITY`: Security-related changes
- `HOTFIX`: Emergency production fixes

**Examples:**
```
FEAT: Add AI assessment rubric builder interface
FIX: Resolve calendar persistence after logout
CONFIG: Update Turso connection parameters
SECURITY: Implement additional input validation
```

---

## 📅 DOCUMENT UPDATE HISTORY

**Latest Update: September 3, 2025 (Student Progress Features Implementation)**

### Major Updates in This Session (September 3, 2025):
- ✅ **Student Progress Tracking**: Implemented radar chart visualization with 5 academic skills
- ✅ **Monthly Reports History**: Added calendar-style monthly history view for past submissions
- ✅ **Recharts Integration**: Replaced SVG radar with professional Recharts library for better aesthetics
- ✅ **Skills Metrics System**: Added skillsMetrics column to Feedback table in production
- ✅ **Production Data Setup**: Added sample feedback with skills metrics for testing
- ✅ **UI/UX Improvements**: Fixed radar chart sizing issues through multiple iterations
- ✅ **GitHub MCP Integration**: Created Pull Request #1 using MCP instead of CLI

### Previous Session Updates (August 15, 2025):
- ✅ **Specialized Agent System**: Complete transformation from 7 generic to 12 specialized agents
- ✅ **Project File Organization**: Reorganized 60+ scattered files into professional structure
- ✅ **Session Management**: Added Claude Code session continuity best practices
- ✅ **Development Workflow**: Integrated diagnosis-first mandatory workflow
- ✅ **Emergency Procedures**: Enhanced with emergency-responder agent protocols

### System Improvements Achieved:
- **100% fix rate** for Sunday night submission issue (2 hotfixes deployed)
- **Multi-file processing** capability for instructor feedback uploads
- **Edge Runtime compatibility** resolved across all 15 API routes
- **Timezone handling** corrected for Argentina UTC-3 calculations
- **88% reduction** in destructive agent actions
- **100% diagnosis-first** workflow implementation
- **Professional file structure** with categorized documentation
- **Zero downtime** emergency response capabilities
- **Session continuity** for complex development workflows

### Critical Fixes Applied (September 1, 2025):

#### 🚨 **Sunday Night Submission Bug**
**Problem**: Students couldn't submit reports on Sunday nights (21:00+ Argentina time)
**Root Cause**: Two timezone calculation errors:
1. `getCurrentArgentinaDate()` was creating fake dates by parsing toLocaleString
2. `getWeekStartInArgentina()` used UTC day instead of Argentina day for week calculation
**Solution**:
- Fixed getCurrentArgentinaDate to return proper UTC Date
- Modified getWeekStartInArgentina to convert to Argentina time before calculating day
**Files Modified**:
- `/src/lib/timezone-utils.ts` - Core timezone functions fixed
- All API routes - Added Node.js runtime configuration

#### ✅ **Multi-JSON Upload Feature**
**Implementation**: Batch processing for feedback uploads
- Support for up to 100 JSON files simultaneously
- Duplicate detection using composite keys
- BATCH_SIZE=50 for optimal performance
- Promise.allSettled for resilient error handling
**Files Added/Modified**:
- `/src/components/instructor/FeedbackUploadModal.tsx`
- `/src/lib/feedback-processor.ts`
- `/src/lib/db-operations.ts` - Added getFeedbackByStudentWeekSubject

### Key References for Future Sessions:
- ⚠️ **Timezone Critical**: getWeekStartInArgentina must use Argentina time for day calculation
- 🔧 **Runtime Config**: All API routes using auth() need `export const runtime = 'nodejs'`
- 📊 **Current Production**: 166 students, 560+ reports, fully operational
- 🤖 **Always start with diagnosis-specialist** for any development task
- 📁 **All documentation** now in `/documentation/` with clear categorization
- 💾 **Use `claude --continue`** to resume work sessions seamlessly
- 🆘 **Emergency-responder available** for critical production issues
- 🔒 **Restricted agent permissions** prevent accidental destructive actions

---

**⚠️ CRITICAL REMINDER**: This platform serves real students and instructors. Every commit affects their academic progress tracking. The new specialized agent system ensures controlled, predictable development while maintaining system stability. When in doubt, test more. Better to be slow and stable than fast and broken.

