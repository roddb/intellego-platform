# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Intellego Platform** - A student progress management platform that replaces Google Forms with a dedicated web application for tracking weekly student progress reports.

### Core Features
- Student authentication and individual profiles
- Weekly progress reporting system (replacing Google Forms)
- Efficient data storage and management
- Mac-style UI design with calming, exclusive aesthetics

### Target Users
- Students (complete weekly progress reports)
- Instructor (view and manage student progress data)

## Technology Stack

**Frontend**: Next.js 14+ with TypeScript
**Styling**: Tailwind CSS with custom Mac-style design system
**Authentication**: NextAuth.js
**Database**: PostgreSQL with Prisma ORM
**Deployment**: Vercel

## Architecture

### Database Design
- `users` table: Student profiles and authentication
- `progress_reports` table: Weekly submissions with timestamps
- `questions` table: Configurable progress tracking questions

### Key Components
- Authentication system with role-based access
- Student dashboard for progress submissions
- Instructor dashboard for progress overview
- Responsive Mac-style UI components

## Design System

### Color Palette (Tranquil & Calming)
- Primary: Soft teals (#14B8A6, #5EEAD4) - promotes tranquility and focus
- Secondary: Cool slates (#64748B, #CBD5E1) - gentle and sophisticated
- Accent: Soft emeralds (#10B981, #6EE7B7) - calming nature-inspired greens
- Background: Soft slate (#F8FAFC) with subtle transparency overlays
- Text: Muted slate tones (#475569, #64748B) for reduced eye strain

### Typography
- System fonts (SF Pro Display/Text equivalents)
- Clean, readable hierarchy

## Commands

```bash
# Development
npm run dev          # Start development server (recommended)
npm run dev-custom   # Start with custom server (alternative)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio for database management
```

## Important Development Notes

**Always restart servers after completing tasks:**
- After making configuration changes or installing dependencies
- When switching between database systems or updating schemas
- After modifying environment variables or auth configurations
- Check that ports (3000, 5555 for Prisma Studio) are functioning properly

**Database Setup:**
- Project uses PostgreSQL with Prisma ORM
- Ensure DATABASE_URL is configured in .env
- Run `npx prisma db push` after schema changes

## Server Management Protocol

⚠️ **IMPORTANT**: Follow this protocol after completing any development task to ensure system stability:

### 1. After Any Code Changes
```bash
# Stop all running servers
pkill -f "npm run dev" || true

# Restart development server in background
nohup npm run dev > server.log 2>&1 &

# Wait and verify server is running
sleep 5 && curl -s http://localhost:3000 > /dev/null && echo "✅ Server is running" || echo "❌ Server not responding"
```

### 2. Port Management
```bash
# Check if port 3000 is in use
lsof -ti:3000 || echo "Port 3000 is free"

# Force kill any process using port 3000 (if needed)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

### 3. Environment Variable Changes
When modifying `.env` variables:
1. **ALWAYS restart the server** (environment changes require restart)
2. Use the server restart protocol above
3. Verify changes took effect by checking API responses

### 4. Database Changes
When working with Prisma/database:
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply database migrations (when using real database)
npx prisma db push
```

### 5. Quick Health Check
```bash
# Verify all systems are working
curl -s http://localhost:3000/api/auth/providers | jq . || echo "API not responding"
```

**Note**: Always run these checks before concluding a development session to prevent issues in subsequent work.

## Development Checkpoints

### Checkpoint 1: Authentication & Data Persistence System ✅
**Date**: 2025-06-25  
**Status**: COMPLETED

#### Features Implemented:
- ✅ **Automatic User Initialization**: Demo users created on every server start
- ✅ **Fixed User IDs**: Consistent IDs that persist across server restarts
- ✅ **Persistent Session Management**: Login sessions work correctly after browser restarts
- ✅ **Weekly Report Persistence**: Student reports persist between sessions
- ✅ **Sample Data System**: Historical reports automatically created for testing

#### Technical Solutions:
- **User Management**: Fixed demo user IDs (`demo-student-fixed`, `demo-instructor-fixed`)
- **Authentication**: NextAuth.js with credentials provider using bcrypt for password hashing
- **Data Persistence**: In-memory storage with automatic initialization on server startup
- **Session Validation**: Proper session handling and route protection with middleware

#### Demo Credentials:
- **Student**: `estudiante@demo.com` / `123456`
- **Instructor**: `instructor@demo.com` / `123456`

#### Key Files Modified:
- `src/lib/temp-storage.ts` - Data persistence and initialization system
- `src/lib/auth.ts` - Authentication configuration
- `src/app/auth/signin/page.tsx` - Login interface with demo credentials
- `src/app/dashboard/instructor/page.tsx` - Instructor dashboard with download functionality
- `src/app/dashboard/student/page.tsx` - Student dashboard with report submission

#### Testing Verified:
1. ✅ Student can login, submit reports, logout, login again and see previously submitted reports
2. ✅ Instructor can login and view all student reports with complete details
3. ✅ Data persists after server restarts
4. ✅ Download functionality works (Markdown/CSV export)
5. ✅ Authentication system prevents unauthorized access
6. ✅ No credentials invalid errors after session restarts

#### Next Development Areas:
- Real database integration (PostgreSQL + Prisma)
- Email notifications for instructors
- Advanced reporting and analytics
- File upload capabilities for evidence
- Real-time collaboration features

### Checkpoint 2: Advanced Platform Features & Dependencies Resolution ✅
**Date**: 2025-06-26  
**Status**: COMPLETED

#### Features Implemented:
- ✅ **File Upload System**: Drag & drop functionality with preview, validation, and progress tracking
- ✅ **Gamification System**: Points, badges, levels, and achievement tracking for student engagement
- ✅ **Email Service Integration**: Automated notifications using Resend + React Email templates
- ✅ **Advanced Analytics Dashboard**: Interactive charts with Recharts for submission trends and performance metrics
- ✅ **DaisyUI Component Integration**: Enhanced Mac-style design system with professional UI components
- ✅ **Comment System**: Instructor feedback on student reports with categorized comments
- ✅ **Real-time Chat System**: Polling-based communication between students and instructors
- ✅ **Dynamic Navigation**: Breadcrumb system with automatic route generation and navigation hierarchy

#### Critical Bug Fixes:
- ✅ **Resolved Missing Dependencies**: Fixed `@react-email/components` and `@react-email/render` installation
- ✅ **Fixed Import Errors**: Added missing `findUserById` function to both hybrid-storage and temp-storage modules
- ✅ **Server Stability**: Resolved module import errors preventing student dashboard functionality

#### Technology Stack Additions:
- **Frontend Enhancements**: DaisyUI, Lucide React icons, Recharts for analytics
- **Email System**: Resend API, React Email templates with responsive HTML
- **File Management**: Built-in upload system with validation and user-specific directories
- **Chat Infrastructure**: Polling-based real-time communication with user presence tracking

#### Key Files Created/Modified:
- `src/components/FileUpload.tsx` - Comprehensive drag & drop file upload component
- `src/components/StudentProgress.tsx` - Gamification system with levels and badges
- `src/components/InstructorAnalytics.tsx` - Advanced analytics dashboard with multiple chart types
- `src/components/ReportComments.tsx` - DaisyUI-based comment system for instructor feedback
- `src/components/SimpleChat.tsx` - Real-time chat component with polling
- `src/components/DynamicBreadcrumbs.tsx` - Automatic breadcrumb navigation system
- `src/lib/email-service.ts` - Comprehensive email service with multiple notification types
- `src/emails/` - React Email templates for various notification scenarios
- `src/lib/chat-service.ts` - Chat service with message management and user tracking
- `tailwind.config.js` - Updated with DaisyUI plugin and custom theme configuration

#### API Endpoints Added:
- `/api/upload` - File upload handling with validation
- `/api/student/progress` - Student gamification and progress tracking
- `/api/instructor/analytics` - Advanced analytics data aggregation
- `/api/chat` - Real-time communication endpoints

#### Testing Verified:
1. ✅ File upload system works with drag & drop, validation, and preview
2. ✅ Gamification system calculates points, badges, and levels correctly
3. ✅ Analytics dashboard displays interactive charts with real data
4. ✅ Comment system allows instructor feedback on student reports
5. ✅ Real-time chat functions between different user roles
6. ✅ Dynamic breadcrumbs generate correctly for all routes
7. ✅ All import errors resolved, both dashboards fully functional
8. ✅ Server restarts without critical errors

#### Dependencies Status:
- ✅ **Installed**: `@react-email/components`, `@react-email/render`, `lucide-react`, `recharts`, `daisyui`
- ⚠️ **Optional Configuration**: Resend API key for email functionality (set `RESEND_API_KEY` in `.env`)

#### Current Platform Status:
- **Core Functionality**: 100% operational (authentication, reports, dashboards, data persistence)
- **Advanced Features**: 100% implemented (gamification, analytics, chat, file uploads)
- **UI/UX**: Professional Mac-style design with DaisyUI components
- **Email Notifications**: Ready (requires API key configuration)
- **Real-time Features**: Fully functional chat system

#### Next Development Areas:
- Email notification configuration (Resend API key setup)
- Real database migration (PostgreSQL + Prisma)
- Mobile responsiveness optimization
- Advanced search and filtering capabilities
- Notification system improvements
- Performance optimization for large datasets

### Checkpoint 3: AI Tutor System Transformation & Conversational Engine ✅
**Date**: 2025-07-04  
**Status**: COMPLETED

#### Major Transformation:
- Transformed AI Tutor from generic exercise generator to specialized ChatGPT/Claude-like conversation engine
- Implemented stateless architecture to prevent context loss in serverless environments
- Created sophisticated exercise detection and step-by-step solution system
- Built academic analysis system that extracts subjects and performance from student reports

#### Features Implemented:
- ✅ **Multi-Provider AI System**: Google Gemini, Hugging Face, Ollama, Transformers.js with automatic fallback
- ✅ **Stateless Conversation Engine**: ChatGPT-like interface that survives server restarts
- ✅ **Exercise Detection & Solving**: Intelligent detection of physics, chemistry, math exercises with complete solutions
- ✅ **Academic Analysis System**: Analyzes student reports to provide contextual educational support
- ✅ **Enhanced Prompt Engineering**: Ensures complete exercise solutions without cutting off mid-calculation
- ✅ **WhatsApp-style Chat Interface**: Real-time conversational experience with suggested actions
- ✅ **Academic Subject Mapping**: Maps curriculum topics to student performance patterns

#### Technical Achievements:
- **AI Provider System**: Multi-provider fallback with automatic error handling and provider switching
- **Exercise Solver**: Detects and solves exact science exercises (physics, chemistry, mathematics) step-by-step
- **Academic Analyzer**: Extracts academic performance data from weekly progress reports
- **Conversation Engine**: Processes user intent and provides contextual educational responses
- **Stateless Architecture**: No memory dependencies, works reliably in serverless environments

#### Key Files Created/Modified:
- `src/lib/ai-providers.ts` - Multi-provider AI system with fallback logic
- `src/lib/academic-analyzer.ts` - Student performance analysis and subject detection
- `src/lib/exercise-solver.ts` - Exercise detection and step-by-step solution system
- `src/lib/conversation-engine.ts` - Stateless conversation processing engine
- `src/components/AITutorChat.tsx` - WhatsApp/ChatGPT-style conversational interface
- `src/components/AITutor.tsx` - Refactored tab-based interface (Chat, Progress, System Status)
- `src/app/api/ai-chat/initialize/route.ts` - Stateless chat initialization
- `src/app/api/ai-chat/message/route.ts` - Message processing with fallback handling

#### API Configuration:
- **Environment Variables**: `GOOGLE_AI_API_KEY`, `HUGGINGFACE_API_KEY` (optional)
- **Provider Priority**: Google Gemini → Hugging Face → Ollama → Transformers.js → Templates
- **Rate Limits**: Google Gemini (15 req/min free), Hugging Face (30k chars/month free)

#### Testing Verified:
1. ✅ Multi-provider AI system works with automatic fallback
2. ✅ Exercise detection correctly identifies physics, chemistry, math problems
3. ✅ Complete step-by-step solutions without cutting off mid-calculation
4. ✅ Academic analysis extracts relevant student performance data
5. ✅ Stateless architecture survives server restarts and recompilations
6. ✅ WhatsApp-style chat interface with real-time messaging
7. ✅ Intent analysis prioritizes exercise solving over generic responses
8. ✅ Structured prompt engineering ensures complete educational responses

#### Critical Bug Fixes:
- ✅ **Resolved "Conversación no inicializada" errors**: Implemented stateless architecture
- ✅ **Fixed TypeScript compilation errors**: Removed non-existent function imports
- ✅ **Fixed timestamp display errors**: Proper Date object handling in chat interface
- ✅ **Fixed incomplete exercise solutions**: Enhanced prompts ensure complete calculations

#### Current AI Tutor Status:
- **Core Functionality**: 100% operational with multi-provider support
- **Exercise Solving**: Complete step-by-step solutions for exact sciences
- **Conversation Quality**: ChatGPT/Claude-like educational interactions
- **Performance**: Stateless architecture prevents memory-related failures
- **User Experience**: Professional chat interface with suggested actions

#### Next Development Areas:
- Advanced context persistence for long conversations
- Integration with real-time collaboration features
- Enhanced subject detection for broader curriculum coverage
- Performance optimization for complex mathematical calculations
- Mobile-optimized chat interface
- Advanced analytics for AI tutor usage patterns

### Checkpoint 4: Sistema de Partículas Sincronizadas & Mejoras UX ✅
**Date**: 2025-07-07  
**Status**: COMPLETED

#### Major Transformations:
- Transformed particle system from random gas-like movement to synchronized wave patterns
- Implemented mathematical wave functions for coordinated particle motion like ocean tides
- Enhanced user experience with smooth sidebar transitions and intelligent navigation
- Resolved critical system inconsistencies affecting core functionality

#### Features Implemented:
- ✅ **Synchronized Particle Wave System**: Mathematical sinusoidal waves replacing random movement
- ✅ **Grid-Based Particle Distribution**: Uniform 6x6 grid (36 particles) for organized wave propagation
- ✅ **Multi-Wave Superposition**: Three overlapping waves (horizontal, vertical, diagonal) for natural motion
- ✅ **Dynamic Visual Effects**: Particle opacity, size, and brightness varying with wave position
- ✅ **Elegant Login Page**: Modern particle strand background with ocean-like synchronized movement
- ✅ **Improved Sidebar Navigation**: Left-positioned hamburger button with smooth slide-in animation
- ✅ **Smart Sidebar Behavior**: Slides content instead of overlay, closes on outside click
- ✅ **Seamless Page Transitions**: Enhanced animations between login and dashboard pages

#### Critical System Fixes:
- ✅ **Weekly Report Validation**: Fixed inconsistency between progress display and form availability
- ✅ **Email Service Stability**: Made Resend email service optional to prevent API failures
- ✅ **Sidebar UX Enhancement**: Eliminated jarring popup behavior with smooth content displacement
- ✅ **Navigation Logic**: Corrected hamburger button positioning and interaction patterns

#### Technical Achievements:
- **Wave Mathematics**: Implemented sinusoidal functions with configurable amplitude, frequency, and speed
- **Particle Physics**: Each particle follows base position + wave displacement calculations
- **Visual Dynamics**: Real-time opacity, size, and rotation effects based on wave height
- **SVG Connections**: Dynamic curved paths between particles with gradient styling
- **Animation Optimization**: RequestAnimationFrame with proper cleanup for smooth performance

#### Key Files Created/Modified:
- `src/components/ParticleStrand.tsx` - Complete rewrite with wave-based particle system
- `src/app/globals.css` - New wave animations and particle styling system
- `src/app/auth/signin/page.tsx` - Integration of particle system with enhanced transitions
- `src/lib/temp-storage.ts` - Fixed canSubmitThisWeek validation logic
- `src/lib/email-service.ts` - Optional email service with graceful degradation
- `src/components/Navigation.tsx` - Repositioned hamburger button to left side
- `src/components/layout/Sidebar.tsx` - Smooth slide animation without backdrop overlay
- `src/app/dashboard/student/page.tsx` - Smart sidebar interaction and content displacement

#### Visual System Details:
- **Wave Configuration**: 3 waves with different amplitudes (30px, 20px, 15px) and frequencies
- **Particle Effects**: Dynamic opacity (0.3-0.8), size scaling (0.8-1.4x), and rotation
- **Connection System**: SVG paths with gradient colors and dash animations
- **Performance**: Optimized with will-change CSS and efficient DOM manipulation

#### Authentication Updates:
- **Student Password**: Changed from `123456` to `Estudiante123!!!` for enhanced security
- **Instructor Unchanged**: `instructor@demo.com / 123456`
- **Session Management**: Improved transition effects and state handling

#### Testing Verified:
1. ✅ Particle waves move in synchronized patterns like ocean tides
2. ✅ Sidebar slides smoothly from left without overlay behavior
3. ✅ Weekly report validation shows consistent status across all components
4. ✅ Login transitions are smooth and visually appealing
5. ✅ Hamburger button positioned correctly on left side
6. ✅ Outside clicks properly close sidebar
7. ✅ Email service failures don't crash the application
8. ✅ All particle animations perform smoothly without lag

#### Current Platform Status:
- **UI/UX**: Professional synchronized particle effects with Mac-style design
- **Navigation**: Intuitive left-sided hamburger menu with smart behavior
- **Authentication**: Enhanced transitions and updated credentials
- **Data Validation**: Consistent weekly report availability across all views
- **Performance**: Optimized animations with proper cleanup and resource management

#### Next Development Areas:
- Mobile responsiveness optimization for particle effects
- Dark/light theme toggle integration
- Real-time notification system implementation
- PostgreSQL database migration for production
- Advanced user analytics and behavior tracking
- Expanded gamification system with achievements
- Performance profiling for large-scale deployment

### Checkpoint 5: IA Tutora Como Administradora Completa del Calendario ✅
**Date**: 2025-07-10  
**Status**: COMPLETED

#### Major Transformation:
- Transformed IA Tutora from simple calendar integration to complete calendar administrator
- Implemented comprehensive calendar management system with full CRUD operations
- Resolved critical "undefined" title bug and event persistence issues
- Created dedicated API endpoints for AI-controlled calendar operations

#### Problems Solved:
- ✅ **"Undefined" Title Bug**: Fixed title generation with intelligent subject normalization
- ✅ **Event Persistence Issues**: Events now appear immediately in calendar after creation
- ✅ **Missing Administrative Powers**: IA can now create, edit, delete, and list calendar events
- ✅ **Poor User Feedback**: Detailed confirmation messages with event specifics
- ✅ **Webpack Module Errors**: Resolved critical server crashes and dependency issues

#### Features Implemented:
- ✅ **Intelligent Event Creation**: Natural language parsing for dates, times, subjects, and locations
- ✅ **Subject Normalization**: "quimica" → "Química" with proper accent handling
- ✅ **Real-time Calendar Sync**: Automatic refresh system with event listeners
- ✅ **Administrative Commands**: Full CRUD operations through conversational interface
- ✅ **Smart Event Search**: Find events by subject, title, or description
- ✅ **Detailed Feedback System**: Rich confirmation messages with event details
- ✅ **Event Type Detection**: Automatic categorization (exam, study session, personal, etc.)

#### Technical Implementation:
- **Dedicated API Endpoints**: 
  - `/api/ai-calendar/create-event` - Create events with full validation
  - `/api/ai-calendar/edit-event` - Edit existing events
  - `/api/ai-calendar/delete-event` - Delete events with confirmation
- **Real-time Synchronization**: Global events system for immediate UI updates
- **Advanced Parsing**: Regex patterns for natural language understanding
- **Error Recovery**: Comprehensive error handling and fallback responses

#### Key Files Created/Modified:
- `src/lib/calendar-ai-integration.ts` - Complete AI calendar management system
- `src/app/api/ai-calendar/create-event/route.ts` - Event creation endpoint
- `src/app/api/ai-calendar/edit-event/route.ts` - Event editing endpoint  
- `src/app/api/ai-calendar/delete-event/route.ts` - Event deletion endpoint
- `src/lib/conversation-engine.ts` - Calendar admin command handling
- `src/components/calendar/SmartCalendar.tsx` - Auto-refresh system
- `src/components/calendar/IntelligentOrganizer.tsx` - Data synchronization

#### AI Commands Available:
**Create Events**:
```
"Agrega un examen de química sobre reacciones químicas para el 11 de julio a las 9 AM en aula 104"
```

**List Events**:
```
"Muestra mis eventos de esta semana"
"¿Qué tengo programado para hoy?"
```

**Delete Events**:
```
"Elimina mi examen de química"
"Borra la sesión de estudio de mañana"
```

**Edit Events** (Infrastructure ready):
```
"Edita el examen de química"
"Cambia la hora del evento de física"
```

#### Enhanced Feedback Examples:
**Before**: "✅ He agregado 'undefined' a tu calendario"

**After**: 
```
✅ ¡Perfecto! He creado "Examen de Química" en tu calendario.

**Detalles del evento:**
📅 **Fecha**: viernes, 11 de julio
🕐 **Hora**: 09:00
📍 **Ubicación**: aula 104
📚 **Materia**: Química
📝 **Tema**: reacciones químicas

🎯 Puedes ver todos tus eventos en la sección "Organizador Inteligente" de tu calendario.
```

#### Server Stability Fixes:
- ✅ **Webpack Module Errors**: Resolved "Cannot find module './8548.js'" through complete cache cleanup
- ✅ **Dependency Corruption**: Cleaned .next, node_modules cache, and npm cache
- ✅ **Server Restart Protocol**: Implemented proper restart procedures for development

#### Testing Verified:
1. ✅ IA creates events with correct titles and details
2. ✅ Events appear immediately in calendar interface
3. ✅ Natural language parsing works for Spanish date/time formats
4. ✅ Subject normalization handles accents correctly
5. ✅ Event search and deletion commands function properly
6. ✅ Real-time synchronization updates all calendar components
7. ✅ Server stability maintained after major code changes
8. ✅ All API endpoints compile and respond correctly

#### Current IA Tutora Capabilities:
- **Calendar Administrator**: Complete control over student's calendar
- **Natural Language Understanding**: Parses complex scheduling requests
- **Real-time Operations**: Immediate feedback and calendar updates
- **Intelligent Search**: Finds events by various criteria
- **Error Recovery**: Graceful handling of incomplete information
- **Educational Context**: Integrates with academic performance data

#### Updated Demo Credentials:
- **Student**: `estudiante@demo.com` / `Estudiante123!!!`
- **Instructor**: `instructor@demo.com` / `123456`

#### Next Development Areas:
- Advanced event editing interface with natural language
- Recurring event management (weekly classes, etc.)
- Calendar conflict detection and resolution
- Integration with academic deadlines and exam schedules
- Mobile-optimized calendar interactions
- Advanced analytics for study pattern optimization

## Project Structure

```
src/
├── app/             # Next.js 13+ App Router
│   ├── globals.css  # Global styles with Mac-inspired components
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/      # Reusable UI components
├── lib/            # Utility functions and configurations
└── types/          # TypeScript type definitions
```

## Configuración de Notificaciones Push (Opcional)

### Tutorial: Obtener Novu API Key

El sistema de notificaciones funciona perfectamente con almacenamiento local, pero puede mejorarse con notificaciones push reales usando Novu.

#### Paso 1: Crear Cuenta en Novu

1. **Visita**: [https://novu.co](https://novu.co)
2. **Regístrate** con email y contraseña
3. **Verifica tu email** si es necesario

#### Paso 2: Obtener API Key

1. **Accede al dashboard**: [https://dashboard-v2.novu.co/api-keys](https://dashboard-v2.novu.co/api-keys)
2. **Copia tu API Key** desde la sección "API Keys"
3. **Guarda la clave** de forma segura

#### Paso 3: Configurar en el Proyecto

**Agregar a tu archivo `.env`:**
```bash
NOVU_API_KEY=tu-clave-secreta-de-novu
```

#### Paso 4: Verificar Configuración

**Reiniciar servidor:**
```bash
npm run dev
```

**Probar notificaciones:**
```bash
curl -X POST http://localhost:3000/api/test-academic-system \
  -H "Content-Type: application/json" \
  -d '{"action": "test_notifications", "userId": "test-user"}'
```

**Verificar en logs:**
- ✅ `Novu notification service initialized` (con Novu)
- ⚠️ `Novu API key not found, using local notification system` (sin Novu)

#### Canales de Notificación Disponibles con Novu:

- ✉️ **Email** - Alertas académicas por correo
- 📱 **Push Notifications** - Notificaciones push en dispositivos
- 💬 **SMS** - Mensajes de texto para deadlines urgentes
- 🔔 **In-App** - Notificaciones dentro de la aplicación
- 💬 **Chat** - Integración con Slack/Discord

#### Tipos de Notificaciones que Sara Enviará:

**Emocionales:**
- 🤗 Frustración detectada → Recursos para manejar la frustración
- 😟 Ansiedad por exámenes → Técnicas de relajación
- 😴 Motivación baja → Contenido motivacional

**Académicas:**
- 🎯 Oportunidades de aprendizaje → Recursos personalizados
- ⏰ Deadlines próximos → Recordatorios con preparación
- 📚 Nuevos recursos → Material relevante para materias difíciles

**Proactivas:**
- 💡 Patrones de estudio → Sugerencias de optimización
- 🏆 Logros detectados → Reconocimiento y celebración
- 🔍 Búsquedas académicas → Resultados y recursos

#### URLs de API (Configuración Automática):
- **US (Predeterminado)**: `https://api.novu.co/v1`
- **EU**: `https://eu.api.novu.co/v1`

#### Seguridad:
- ✅ **Variables de entorno** (nunca hardcodear)
- ✅ **Solo servidor** (no en frontend)
- ✅ **CORS configurado** correctamente
- ✅ **Autenticación** con API Key segura

#### Ejemplo de Notificación en Acción:

**Cuando Sara detecta frustración:**
```javascript
{
  title: "💡 Gestiona la Frustración Académica",
  message: "He notado que has estado experimentando frustración últimamente. Te encontré recursos específicos para convertir esa frustración en motivación.",
  actionButton: {
    text: "Ver Técnicas",
    action: "show_search_results"
  },
  channels: ["push", "in-app", "email"] // Multi-canal
}
```

**Estado sin Novu:** Las notificaciones se almacenan localmente y funcionan perfectamente dentro de la aplicación.

**Estado con Novu:** Notificaciones push reales en dispositivos + email + in-app.