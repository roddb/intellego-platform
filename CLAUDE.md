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
**Database**: SQLite with Prisma ORM
**File System**: Automated JSON export by student folders

## Database Schema (Current)

```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  role        String   @default("student")
  studentId   String?  @unique
  sede        String?
  año         String?
  division    String?
  materias    String?  // JSON array of subjects
  program     String?
  phoneNumber String?
  dateOfBirth DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProgressReport {
  id          String   @id @default(cuid())
  userId      String
  weekStart   DateTime
  weekEnd     DateTime
  subject     String?
  submittedAt DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  answers     Answer[]
}

model CalendarEvent {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  date        DateTime
  startTime   String?
  endTime     String?
  type        String   @default("personal")
  createdAt   DateTime @default(now())
}

model Task {
  id            String   @id @default(cuid())
  userId        String
  title         String
  description   String?
  dueDate       DateTime?
  priority      String   @default("medium")
  status        String   @default("pending")
  subject       String?
  estimatedHours Int?
  createdAt     DateTime @default(now())
}
```

## Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio (http://localhost:5555)
```

## Demo Credentials

- **Student**: `estudiante@demo.com` / `Estudiante123!!!`
- **Instructor**: `instructor@demo.com` / `123456`
- **Registration**: Available at `/auth/signup`

## Current System Status

### Core Functionality (100% Operational)
- ✅ SQLite database with Prisma ORM
- ✅ User registration with automatic `studentId` generation
- ✅ Weekly progress reports with calendar view
- ✅ Dual file storage (database + JSON folders)
- ✅ Student organizer with calendar and tasks
- ✅ Academic hierarchy: sede/año/división/materia/estudiante

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
- **File**: `prisma/data/intellego.db` (SQLite)
- **Studio**: `npx prisma studio` → `http://localhost:5555`

## Server Restart Protocol

⚠️ **ALWAYS restart after major changes:**

```bash
# Quick restart
pkill -f "npm run dev" || true
npm run dev

# Health check
curl -s http://localhost:3000/api/auth/providers > /dev/null && echo "✅ Server OK"
```

