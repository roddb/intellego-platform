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
- **Instructor**: `instructor@demo.com` / `123456`
- **Registration**: Available at `/auth/signup`

## Current System Status

### Core Functionality (100% Operational)
- ✅ Turso libSQL database with direct SQL queries
- ✅ User registration with automatic `studentId` generation
- ✅ Weekly progress reports with calendar view
- ✅ Dual file storage (database + JSON folders)
- ✅ Student organizer with calendar and tasks
- ✅ Academic hierarchy: sede/año/división/materia/estudiante
- ✅ Serverless deployment on Vercel
- ✅ Automatic CI/CD pipeline

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
- **Production**: Turso Cloud Database (libSQL)
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

