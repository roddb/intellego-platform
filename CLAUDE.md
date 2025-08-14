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

### 🔄 Flujo de Desarrollo Automático

**GitHub → Vercel Pipeline:**
1. Commits a `main` branch → Despliegue automático
2. Testing automático en Vercel
3. Rollback automático si fallan los builds
4. Monitoreo de errores en tiempo real

**Proceso estándar para modificaciones:**
```bash
# 1. Hacer cambios localmente
git add .
git commit -m "Descripción del cambio"
git push

# 2. Vercel detecta automáticamente y despliega
# 3. Verificar en: https://intellego-platform.vercel.app
```

### 🛠️ Tipos de Modificaciones Comunes

#### **Nuevas Funcionalidades**
- **APIs**: Crear en `/src/app/api/[nombre]/route.ts`
- **Páginas**: Agregar en `/src/app/[ruta]/page.tsx`
- **Componentes**: Añadir en `/src/components/`
- **Base de datos**: Modificar `/src/lib/db-operations.ts`

#### **Modificaciones de UI/UX**
- **Estilos**: Editar `/src/app/globals.css` o componentes
- **Layout**: Modificar `/src/app/layout.tsx`
- **Navegación**: Actualizar `/src/components/Navigation.tsx`

#### **Expansión de Base de Datos**
- **Nuevas tablas**: Agregar queries en `db-operations.ts`
- **Campos nuevos**: Actualizar tipos y operaciones CRUD
- **Migraciones**: Ejecutar directamente en Turso console

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

**If production breaks:**

```bash
# Immediate rollback (execute within 5 minutes)
git log --oneline -10                    # Find last working commit
git revert [BREAKING_COMMIT_HASH]        # Create revert commit
git push                                 # Auto-deploy rollback

# Alternative: Hard reset (use only if revert fails)
git reset --hard [LAST_WORKING_COMMIT]
git push --force-with-lease
```

**Emergency Contacts:**
- Vercel Status: https://vercel.com/status
- Turso Status: https://turso.tech/status
- GitHub Status: https://githubstatus.com

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

**⚠️ CRITICAL REMINDER**: This platform serves real students and instructors. Every commit affects their academic progress tracking. When in doubt, test more. Better to be slow and stable than fast and broken.

