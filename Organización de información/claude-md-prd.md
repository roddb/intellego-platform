# PRD: Sistema de Configuración Claude.md para Nuevos Proyectos

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Propósito:** Documento de referencia para estructurar correctamente archivos Claude.md en proyectos de desarrollo con Claude Code

---

## 1. RESUMEN EJECUTIVO

### 1.1 Propósito del Documento
Este PRD establece las especificaciones completas para crear y mantener archivos Claude.md efectivos en proyectos de desarrollo. Sirve como referencia técnica para que Claude estructure correctamente la configuración inicial de cualquier nuevo proyecto.

### 1.2 Definición de Claude.md
Claude.md es el archivo de configuración central de Claude Code que:
- Actúa como "memoria permanente" del asistente IA
- Se carga automáticamente en cada sesión
- Proporciona contexto sobre estándares, comandos y convenciones
- Tiene supremacía sobre prompts conversacionales del usuario

### 1.3 Impacto Documentado
- **Reducción de tiempo de desarrollo:** 40-78%
- **Disminución de errores de configuración:** 91%
- **Consumo de tokens:** Cada palabra cuenta contra el context window

### 1.4 Principio Fundamental
**"Mantener conciso pero completo: priorizar viñetas declarativas sobre narrativa, incluir solo reglas activamente necesarias, tratar como documentación viva."**

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Jerarquía de Archivos Claude.md

Claude Code soporta cuatro niveles jerárquicos que se cargan en orden de precedencia:

#### Nivel 1: Memoria Global de Usuario
**Ubicación:** `~/.claude/CLAUDE.md`

**Propósito:** Preferencias personales universales aplicables a todos los proyectos

**Contenido Típico:**
- Estilo de comunicación preferido con Claude
- Convenciones de naming personales
- Instrucciones sobre manejo de ambigüedad
- Preferencias de formato de código

**Versionamiento:** No versionado (personal)

#### Nivel 2: Memoria Compartida de Proyecto
**Ubicación:** `./CLAUDE.md` o `./.claude/CLAUDE.md`

**Propósito:** Estándares del equipo y convenciones del proyecto

**Contenido Típico:**
- Convenciones de código del proyecto
- Estructura de directorios
- Comandos de desarrollo
- Patrones arquitectónicos del equipo

**Versionamiento:** SÍ - versionado en Git (crítico)

#### Nivel 3: Memoria Local de Proyecto
**Ubicación:** `./.claude/CLAUDE.local.md`

**Propósito:** Preferencias personales no versionadas

**Contenido Típico:**
- Experimentación personal
- Preferencias individuales no compartidas
- Overrides temporales

**Versionamiento:** NO - añadir a .gitignore

**Nota:** Anthropic ahora recomienda usar imports en lugar de este archivo

#### Nivel 4: Memoria Empresarial
**Ubicación:** 
- macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
- Linux/WSL: `/etc/claude-code/CLAUDE.md`

**Propósito:** Políticas organizacionales aplicables a todos usuarios/proyectos

**Contenido Típico:**
- Estándares de seguridad corporativos
- Requisitos de compliance
- Herramientas corporativas obligatorias

**Versionamiento:** Controlado por administración IT

### 2.2 Sistema de Precedencia
Los archivos se cargan jerárquicamente con los más específicos teniendo precedencia:
```
Empresarial (base) → Global Usuario → Compartido Proyecto → Local Proyecto (más específico)
```

Esta cascada permite:
- Reglas globales aplicables a todo
- Sobrescritas por estándares de equipo
- Refinadas por contexto de módulo específico
- Personalizadas por preferencias individuales

---

## 3. ESPECIFICACIONES TÉCNICAS

### 3.1 Limitaciones y Restricciones

#### Tamaño de Archivo
- **Recomendado:** <150 líneas para la mayoría de proyectos
- **Máximo recomendado:** 50KB para rendimiento óptimo
- **Límite duro:** No existe, pero cada byte consume tokens

#### Formato
- **Tipo de archivo:** Markdown (.md)
- **Encoding:** UTF-8
- **Nombre de archivo:** 
  - `CLAUDE.md` (case-insensitive)
  - `.claude/CLAUDE.md`
  - `CLAUDE.local.md`

#### Características del Lenguaje
- Markdown estándar (CommonMark)
- XML tags opcionales para estructura avanzada
- Sistema de imports con sintaxis `@path/to/file`
- Límite de recursión en imports: 5 niveles

### 3.2 Sistema de Imports

#### Sintaxis
```markdown
@path/to/file
@~/relative/from/home
@./relative/from/current
```

#### Características
- Soporta rutas relativas y absolutas
- Incluye directorio home del usuario
- Recursivo hasta profundidad de 5
- No se evalúa dentro de code spans/blocks
- Reemplaza efectivamente CLAUDE.local.md

#### Casos de Uso
```markdown
# Import documentación existente
@README.md

# Import arquitectura detallada
@docs/architecture.md

# Import preferencias personales
@~/.claude/my-preferences.md

# Import specs de API
@docs/api-reference.md
```

**Ventaja Principal:** Actualizaciones en archivos fuente se reflejan automáticamente sin sincronización manual

---

## 4. ESTRUCTURA CANÓNICA DEL ARCHIVO

### 4.1 Secciones Obligatorias (Núcleo Mínimo)

#### Section 1: Project Overview
**Propósito:** Contexto inmediato en 1-2 oraciones

**Especificación:**
```markdown
# [NOMBRE DEL PROYECTO]

## Overview
[1-2 oraciones describiendo qué hace el proyecto y su objetivo principal]
```

**✅ Correcto:**
```markdown
## Overview
Esta es una aplicación de chat nativa para Mac que permite comparar respuestas de múltiples modelos de IA simultáneamente.
```

**❌ Incorrecto:**
```markdown
## Overview
Este proyecto surgió de la necesidad de tener una mejor forma de trabajar con IA. Después de meses de investigación y considerando diferentes opciones, decidimos crear una aplicación que permitiera... [continúa 10 líneas más]
```

#### Section 2: Tech Stack
**Propósito:** Tecnologías y versiones específicas

**Especificación:**
```markdown
## Tech Stack
- Framework: [nombre + versión específica]
- Language: [nombre + versión específica]
- Database: [sistema + versión]
- Styling: [herramienta]
- Testing: [framework]
- Package Manager: [npm/pnpm/yarn con versión]
- [Otros componentes críticos]
```

**Regla Crítica:** SIEMPRE incluir números de versión para prevenir confusión sobre features disponibles

**Ejemplo:**
```markdown
## Tech Stack
- Framework: Next.js 14.2.1 (App Router)
- Language: TypeScript 5.2.2
- Database: PostgreSQL 15.3
- ORM: Prisma 5.8.0
- Styling: Tailwind CSS 3.4.0
- Testing: Vitest 1.2.0 + React Testing Library
- Package Manager: pnpm 8.15.0
```

#### Section 3: Project Structure
**Propósito:** Mapeo de directorios con reglas no obvias

**Especificación:**
```markdown
## Project Structure
- `directorio/`: [Descripción ultra-concisa con reglas específicas]
- `directorio/`: [Enfocarse en lo NO obvio del nombre]
```

**Regla de Oro:** Si Claude puede inferir del nombre, no explicar. Solo añadir información no obvia.

**✅ Correcto:**
```markdown
## Project Structure
- `src/components/`: Componentes funcionales con tests colocados, interfaces TypeScript requeridas
- `src/lib/`: Funciones de negocio, no UI. Cada módulo debe exportar tipos
- `src/app/`: Next.js App Router. Cada ruta requiere loading.tsx y error.tsx
- `prisma/`: Schemas de DB. Migrations automáticas en dev, manuales en prod
```

**❌ Incorrecto:**
```markdown
## Project Structure
- `src/components/`: Esta carpeta contiene los componentes de React
- `src/lib/`: Aquí van las librerías
```

#### Section 4: Commands
**Propósito:** Comandos de desarrollo con flags específicos

**ROI:** Extremadamente alto - previene ejecuciones incorrectas

**Especificación:**
```markdown
## Commands
- `comando subcmd flags`: Descripción de qué hace y cuándo usarlo
```

**Ejemplo Completo:**
```markdown
## Commands
- `pnpm dev`: Start dev server en port 3000 (hot reload habilitado)
- `pnpm build`: Build para producción (genera en .next/)
- `pnpm start`: Run producción build (requiere build previo)
- `pnpm test`: Run todos los tests con Vitest
- `pnpm test:watch`: Tests en modo watch (útil durante desarrollo)
- `pnpm test:ui`: Open Vitest UI en browser
- `pnpm lint`: ESLint sobre src/ con autofix
- `pnpm lint:strict`: ESLint sin autofix (para CI)
- `pnpm typecheck`: TypeScript check sin emitir archivos
- `pnpm format`: Prettier sobre proyecto completo
- `pnpm format:check`: Check formato sin modificar (para CI)
- `pnpm db:push`: Push schema de Prisma a DB (solo dev)
- `pnpm db:migrate`: Create y aplica migration (staging/prod)
- `pnpm db:studio`: Open Prisma Studio en browser
- `pnpm deploy`: Deploy a Vercel (requiere auth)
```

#### Section 5: Code Style & Conventions
**Propósito:** Patrones específicos del proyecto que guían cada línea de código

**Sub-secciones Obligatorias:**

##### 5.1 Imports
```markdown
### Imports
- Use ES modules (import/export), never require()
- Destructure imports cuando posible: `import { useState } from 'react'`
- Use path aliases: `@/components`, `@/lib`, `@/utils`
- Group order: external deps → internal modules → types
- Ordenar alfabéticamente dentro de cada grupo
```

##### 5.2 Naming
```markdown
### Naming
- PascalCase: Components, Types, Interfaces (`UserCard`, `ApiResponse`)
- camelCase: variables, functions, methods (`getUserData`, `isActive`)
- UPPER_SNAKE_CASE: constants globales (`API_BASE_URL`, `MAX_RETRIES`)
- kebab-case: archivos, directorios (`user-profile/`, `api-client.ts`)
- Prefijos booleanos: is/has/should (`isLoading`, `hasPermission`)
```

##### 5.3 TypeScript
```markdown
### TypeScript
- Strict mode: SIEMPRE habilitado
- NEVER use `any` → use `unknown` o tipos específicos de unión
- Prefer `interface` over `type` para objetos (mejor error messages)
- Use `type` para uniones, intersecciones, y utilities
- Use `as const` para literal types inmutables
- Type guards requeridos cuando narrowing de `unknown`
- Todos los public APIs requieren tipos explícitos (no inferencia)
```

##### 5.4 Formatting
```markdown
### Formatting
- Indentation: 2 espacios (configurado en .editorconfig)
- Semicolons: requeridos (configurado en ESLint)
- Line length: 100 caracteres (Prettier)
- Trailing commas: always (Prettier)
- Quotes: single para strings, double para JSX (Prettier)
- Arrow functions: siempre usar paréntesis `(x) => x` no `x => x`
```

#### Section 6: Critical Rules (DO NOT)
**Propósito:** Restricciones absolutas - la sección MÁS IMPORTANTE

**Especificación:**
```markdown
## Critical Rules (DO NOT)

### Code Restrictions
- ❌ [Restricción específica con razón si no es obvia]

### Workflow Restrictions
- ❌ [Restricción de proceso con consecuencia]

### Performance Rules
- ❌ [Restricción de rendimiento con umbral]
```

**Ejemplo Completo:**
```markdown
## Critical Rules (DO NOT)

### Code Restrictions
- ❌ Do NOT edit files in `src/legacy/` (scheduled for removal Q2)
- ❌ Do NOT use `any` type in TypeScript (breaks type safety)
- ❌ Do NOT use class components in React (functional only per team standard)
- ❌ Do NOT skip accessibility checks (WCAG 2.1 AA requerido)
- ❌ Do NOT hardcode API keys or secrets (use env vars)
- ❌ Do NOT use inline styles (Tailwind classes only)
- ❌ Do NOT create files >400 lines (split into modules)

### Workflow Restrictions
- ❌ Do NOT commit directly to `main` or `develop` (PR requerido)
- ❌ Do NOT merge without 2 approvals (configurado en GitHub)
- ❌ Do NOT deploy without passing CI (build + tests + lint)
- ❌ Do NOT skip code review checklist (template en PR)
- ❌ Do NOT modify database schema sin migration
- ❌ Do NOT push sin ejecutar tests localmente primero

### Performance Rules
- ❌ Do NOT add dependencies sin justification (cada dep aumenta bundle)
- ❌ Do NOT commit files >1MB a Git (usar LFS o S3)
- ❌ Do NOT crear circular dependencies (build fallará)
- ❌ Do NOT hacer operaciones heavy en main thread (usar Web Workers)
- ❌ Do NOT cargar todas las imágenes sin lazy loading
```

### 4.2 Secciones Recomendadas (Alto Valor)

#### Development Workflow
```markdown
## Development Workflow

### Git Branching
- Branch naming: `[type]/[ticket]-[description]`
  - Types: feature, bugfix, hotfix, refactor, docs, test, chore
  - Example: `feature/AUTH-123-oauth-google`
  - Example: `bugfix/PERF-456-memory-leak-fix`

### Commit Messages
Format: Conventional Commits
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato (no afectan lógica)
- `refactor:` refactorización de código
- `perf:` mejora de performance
- `test:` añadir o corregir tests
- `chore:` mantenimiento (deps, config)

Examples:
- `feat(auth): add Google OAuth integration`
- `fix(api): resolve race condition in user fetch`
- `docs(readme): update installation instructions`

### Pull Request Requirements
- ✅ All tests passing (local + CI)
- ✅ No linter errors or warnings
- ✅ Minimum 80% test coverage maintained
- ✅ 2 approvals required (1 from tech lead)
- ✅ PR template completado
- ✅ Squash merge to main (linear history)
- ✅ Delete branch después de merge
```

#### Testing Strategy
```markdown
## Testing Strategy

### Framework & Tools
- Unit tests: Vitest 1.2.0
- Component tests: React Testing Library 14.0
- E2E tests: Playwright 1.40
- Coverage: Vitest coverage (v8 provider)
- Minimum coverage: 80% lines, 75% branches

### Test Organization
- Unit tests: Colocados con source `Component.test.tsx`
- Integration tests: `/tests/integration/`
- E2E tests: `/tests/e2e/`
- Test utils: `/tests/utils/`
- Mock data: `/tests/fixtures/`

### Testing Rules
- Todos los nuevos features REQUIEREN tests
- Test naming: `describe('ComponentName', () => { it('should behavior when condition') })`
- Mock external dependencies (APIs, database, third-party services)
- NO testear implementation details (internals, private methods)
- Focus en user behavior y output observables
- Prefer integration tests sobre unit tests cuando posible
- E2E tests solo para critical paths del usuario

### Running Tests
```bash
# Run todos los tests
pnpm test

# Run específico
pnpm test path/to/test

# Watch mode (desarrollo)
pnpm test:watch

# Coverage report
pnpm test:coverage

# UI mode (debugging)
pnpm test:ui

# E2E tests
pnpm test:e2e

# E2E con UI (headed mode)
pnpm test:e2e:ui
```
```

#### Common Patterns
**Propósito:** Ejemplos de código correcto vs incorrecto para patrones complejos

```markdown
## Common Patterns

### Error Handling
**✅ Correcto: Specific error handling**
```typescript
try {
  const data = await fetchUser(id);
  return data;
} catch (error) {
  if (error instanceof NotFoundError) {
    throw new UserNotFoundError(id);
  }
  if (error instanceof ValidationError) {
    throw new InvalidUserDataError(error.details);
  }
  // Re-throw unexpected errors
  throw error;
}
```

**❌ Incorrecto: Silent failures**
```typescript
try {
  const data = await fetchUser(id);
  return data;
} catch {
  return null; // Hides errors, hard to debug
}
```

### API Response Format
**✅ Correcto: Consistent error structure**
```typescript
// Success
return res.status(200).json({ data: user });

// Error
return res.status(404).json({
  error: {
    code: 'USER_NOT_FOUND',
    message: 'User with provided ID does not exist',
    details: { userId: id }
  }
});
```

**❌ Incorrecto: Inconsistent responses**
```typescript
// Sometimes string
return res.status(500).json({ error: 'Error' });

// Sometimes object
return res.status(404).json({ message: 'Not found' });
```

### Component Structure
**✅ Correcto: Single Responsibility**
```typescript
// UserProfile.tsx - Solo display
export function UserProfile({ user }: Props) {
  return (
    <div className="profile">
      <Avatar src={user.avatar} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
}

// UserProfileContainer.tsx - Solo data fetching
export function UserProfileContainer({ userId }: Props) {
  const { data: user, isLoading } = useUser(userId);
  
  if (isLoading) return <Spinner />;
  if (!user) return <NotFound />;
  
  return <UserProfile user={user} />;
}
```

**❌ Incorrecto: Mixed concerns**
```typescript
export function UserProfile({ userId }: Props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Data fetching mixed with presentation
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>...</div>; // Presentation logic here
}
```
```

### 4.3 Secciones Opcionales (Contexto Específico)

#### Environment Setup
Solo incluir si setup es complejo o no estándar

```markdown
## Environment Setup

### Prerequisites
- Node.js: 18.17.0 o superior (usar nvm)
- pnpm: 8.15.0 o superior
- PostgreSQL: 15.3 (Docker recomendado)
- Redis: 7.0 (solo para staging/prod)

### Initial Setup
```bash
# Clone repositorio
git clone https://github.com/org/project.git
cd project

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Editar .env con valores locales

# Setup database
docker-compose up -d postgres
pnpm db:push

# Seed data inicial (opcional)
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables
Ver `.env.example` para todas las variables requeridas.

**Críticas (requeridas para iniciar):**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Auth secret (generar con `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL de la app (http://localhost:3000 en dev)

**Opcionales (features específicos):**
- `GOOGLE_CLIENT_ID`: Para OAuth de Google
- `GOOGLE_CLIENT_SECRET`: Para OAuth de Google
- `STRIPE_SECRET_KEY`: Para pagos (solo staging/prod)
- `REDIS_URL`: Para rate limiting (solo staging/prod)

**NUNCA commitear `.env` a Git. Ya está en .gitignore.**
```
```

#### Terminology
Solo si hay términos específicos del dominio que causan confusión

```markdown
## Terminology & Context

### Project-Specific Terms
- **Service**: En este proyecto se refiere a endpoints backend, NO servicios frontend
- **Module**: Pipelines de procesamiento de datos en `src/modules/`, NO módulos JavaScript
- **Widget**: Componentes drag-and-drop en dashboard, NO componentes generales
- **Agent**: Workers que procesan jobs en background, NO agentes de usuario

### Avoid Confusion
- Usar "Component" para UI elements de React
- Usar "API Endpoint" en lugar de "Service" cuando ambiguo
- Usar "Background Worker" en lugar de "Agent" en contexto de deployment
```

---

## 5. MEJORES PRÁCTICAS DE REDACCIÓN

### 5.1 Principios de Escritura Efectiva

#### Principio 1: Presupuesto de Tokens
**Regla:** Cada palabra consume tokens valiosos en cada sesión

**Aplicación:**
- ✅ Eliminar explicaciones de conceptos generales
- ✅ Evitar documentación que existe en docs oficiales
- ✅ Omitir comentarios narrativos y contexto histórico
- ❌ No escribir párrafos cuando viñeta funciona
- ❌ No explicar por qué framework X fue elegido

**Ejemplo:**

❌ **Verbose (consume 45 tokens):**
```markdown
Nuestra aplicación utiliza React, que es una biblioteca JavaScript popular desarrollada por Facebook para construir interfaces de usuario. React usa un Virtual DOM para mejorar el rendimiento y permite crear componentes reutilizables.
```

✅ **Conciso (consume 8 tokens):**
```markdown
Framework: React 18.2
```

#### Principio 2: Viñetas Declarativas > Párrafos Narrativos
**Regla:** Claude ya conoce programación - escribir para Claude, no para junior developer

**Aplicación:**
```markdown
❌ Incorrecto (narrativo):
En este proyecto, hemos decidido usar TypeScript en modo estricto porque proporciona mejor type safety y catch de errores durante desarrollo. También ayuda con autocompletado en el IDE.

✅ Correcto (declarativo):
- TypeScript: Strict mode habilitado
- Never use `any` (use `unknown` o union types)
```

#### Principio 3: Especificidad en Lugar de Generalidad
**Regla:** Proporcionar detalles accionables, no principios abstractos

**Aplicación:**
```markdown
❌ Vago:
- Seguir mejores prácticas de React
- Escribir código limpio y mantenible

✅ Específico:
- Componentes: Funcionales con hooks (no class components)
- Max 200 líneas por componente (split si es más largo)
- Props: TypeScript interfaces requeridas para todas las props
- State: Colocar en nivel más bajo posible del árbol
```

#### Principio 4: Front-Load Contexto Completo
**Regla:** Es más efectivo proporcionar contexto exhaustivo por adelantado que añadirlo gradualmente

**Razón:** El costo inicial de tokens se compensa con menos iteraciones y correcciones

**Aplicación:**
- ✅ Incluir múltiples ejemplos de patrones deseados desde el inicio
- ✅ Documentar edge cases y excepciones upfront
- ❌ No dosificar información esperando que Claude pregunte

#### Principio 5: Imperativo para Reglas Críticas
**Regla:** Usar lenguaje fuerte para instrucciones que NO pueden violarse

**Niveles de Énfasis:**
```markdown
# Nivel 1: Sugerencia
- Prefer functional components

# Nivel 2: Recomendación fuerte  
- Use functional components (not class components)

# Nivel 3: Requisito
- MUST use functional components
- NEVER use class components

# Nivel 4: Crítico con consecuencia
- CRITICAL: NEVER commit directly to main branch
- Violation will fail CI and block deployment
```

### 5.2 Patrones de Escritura Anti-Patrones

#### Anti-Pattern 1: Explicar lo Obvio
```markdown
❌ Incorrecto:
- `src/components/`: Esta carpeta contiene componentes de React
- `package.json`: Archivo que gestiona dependencias del proyecto

✅ Correcto:
- `src/components/`: Functional components con tests colocados
- `package.json`: Mantener deps actualizadas, verificar semanalmente
```

#### Anti-Pattern 2: Instrucciones Negativas sin Alternativas
```markdown
❌ Incorrecto:
- Never use any types
- Don't use inline styles

✅ Correcto:
- Use `unknown` o union types específicos en lugar de `any`
- Use Tailwind utility classes en lugar de inline styles
```

#### Anti-Pattern 3: Incluir Documentación Externa Completa
```markdown
❌ Incorrecto:
@docs/complete-api-reference.md (50KB de docs completas)

✅ Correcto:
API Documentation: Ver `docs/api-reference.md` para endpoints completos
Key endpoints:
- POST /api/auth/login - Authentication
- GET /api/users/:id - Fetch user
- POST /api/data/sync - Trigger sync job
```

#### Anti-Pattern 4: Redundancia con Código Existente
```markdown
❌ Incorrecto:
Dependencies:
- react: 18.2.0
- next: 14.0.0
- typescript: 5.2.2
[... 30 dependencias más listadas manualmente]

✅ Correcto:
Dependencies: Ver package.json
Key dependencies: Next.js 14 (App Router), TypeScript 5.2 (strict mode)
```

### 5.3 Técnicas Avanzadas de Formateo

#### Técnica 1: XML Tags para Parseo Semántico
**Cuándo usar:** Para secciones críticas que necesitan reconocimiento especial

```markdown
<critical_notes>
- NEVER modify files in src/legacy/
- ALWAYS run tests before committing
- MUST have 2 code reviews before merging
</critical_notes>

<paved_path>
Arquitectura canónica para nuevos features:
1. Create feature branch: feature/TICKET-description
2. Implement in src/features/[feature-name]/
3. Add tests with >80% coverage
4. Update docs/CHANGELOG.md
5. Create PR with filled template
6. Address review comments
7. Squash merge to main
</paved_path>

<workflow>
Daily development loop:
1. Pull latest from main: `git pull origin main`
2. Create feature branch: `git checkout -b feature/[ticket]`
3. Develop with TDD: write test → implement → refactor
4. Commit frequently: conventional commits format
5. Push to remote: `git push origin [branch]`
6. Create PR when feature complete
</workflow>
```

**Aproximadamente 40% de archivos Claude.md avanzados usan XML tags**

#### Técnica 2: Jerarquía Visual Clara
```markdown
# Nivel 1: Categoría Principal
## Nivel 2: Sub-categoría
### Nivel 3: Detalle Específico

Usar consistentemente:
- H1 (#): Título del documento
- H2 (##): Secciones principales
- H3 (###): Sub-secciones
- H4 (####): Raramente (solo si estructura muy compleja)
```

#### Técnica 3: Tablas para Comparaciones
**Cuándo usar:** Para comparar opciones o mostrar mappings

```markdown
### HTTP Status Codes

| Code | Uso | Response Format |
|------|-----|----------------|
| 200 | Éxito general | `{ data: T }` |
| 201 | Recurso creado | `{ data: T, id: string }` |
| 400 | Bad request | `{ error: { code, message } }` |
| 401 | No autenticado | `{ error: { code: 'UNAUTHORIZED' } }` |
| 403 | Sin permisos | `{ error: { code: 'FORBIDDEN' } }` |
| 404 | No encontrado | `{ error: { code: 'NOT_FOUND' } }` |
| 500 | Server error | `{ error: { code, message, trace? } }` |
```

---

## 6. TÉCNICAS DE MANTENIMIENTO

### 6.1 Métodos de Actualización Durante Desarrollo

#### Método 1: Tecla `#` (Rápido y Orgánico)
**Uso:** Durante sesión, iniciar mensaje con `#`

**Comportamiento:** Claude pedirá seleccionar en qué archivo de memoria guardarlo

**Ejemplo de flujo:**
```
Usuario: # Always use descriptive variable names in utility functions

Claude: I'll add that to your memory. Which file should I update?
1. ~/.claude/CLAUDE.md (global preferences)
2. ./CLAUDE.md (project standards)
3. ./.claude/CLAUDE.local.md (local preferences)

Usuario: 2

Claude: ✓ Added to ./CLAUDE.md under Code Style & Conventions
```

**Cuándo usar:**
- ✅ Descubres un patrón que debe documentarse
- ✅ Claude comete un error que debe prevenirse
- ✅ Identificas una convención no documentada

#### Método 2: Comando `/memory` (Ediciones Extensivas)
**Uso:** `/memory` abre archivos de memoria en editor del sistema

**Cuándo usar:**
- ✅ Reestructurar secciones completas
- ✅ Añadir múltiples reglas simultáneamente
- ✅ Consolidar y limpiar el archivo
- ✅ Reorganizar estructura

**Workflow:**
```bash
# En Claude Code
/memory

# Sistema abre editor con archivos disponibles
# Editar y guardar
# Claude recarga automáticamente
```

#### Método 3: Comando `/init` (Generación Base)
**Uso:** `/init` genera Claude.md base desde contexto del proyecto

**Cuándo usar:**
- ✅ Iniciar nuevo proyecto sin Claude.md existente
- ✅ Regenerar estructura base para reestructuración
- ✅ Obtener sugerencias basadas en código actual

**Workflow:**
```bash
# En raíz del proyecto
/init

# Claude analiza:
# - package.json
# - tsconfig.json
# - Estructura de directorios
# - README existente
# - Código fuente

# Genera Claude.md base
# Revisar, personalizar, y guardar
```

**Nota:** Output de `/init` es punto de partida - siempre personalizar según este PRD

### 6.2 Patrón "Document & Clear"

**Problema:** Conversaciones largas causan que contexto inicial (Claude.md) pierda importancia

**Síntomas:**
- Claude olvida convenciones después de 50+ mensajes
- Gastas ~50% de tokens recordándole reglas
- Errores repetitivos que deberían estar prevenidos

**Solución: Document & Clear Loop**

```markdown
**Paso 1: Documentar Progreso**
Usuario: Claude, antes de continuar, documenta el progreso actual:
- Qué hemos completado
- Estado actual del código
- Próximos pasos planificados
- Cualquier decisión importante tomada

Guarda esto en progress.md

**Paso 2: Clear**
/clear

**Paso 3: Recargar Contexto**
Usuario: Lee progress.md y continuemos desde donde lo dejamos.

[Claude lee progress.md con Claude.md fresco en contexto]
```

**Frecuencia recomendada:**
- Cada 30-50 mensajes en sesión activa
- Al cambiar de feature o módulo
- Cuando notes que Claude ignora convenciones
- Antes de tareas críticas (deployment, refactoring grande)

### 6.3 Versionamiento y Code Review

#### Git Workflow para Claude.md

```bash
# Tratamiento como código fuente
git add CLAUDE.md

# Commit con conventional commit
git commit -m "docs(claude): add API error handling patterns"

# Include en PR reviews
# Reviewers deben verificar:
# - Consistencia con estándares del equipo
# - Claridad de nuevas reglas
# - No conflicto con reglas existentes
# - Justificación de cambios
```

#### PR Review Checklist para Claude.md

```markdown
## Claude.md Review Checklist

### Clarity
- [ ] Nuevas reglas son específicas y accionables
- [ ] No hay ambigüedad en interpretación
- [ ] Ejemplos incluidos para patrones complejos

### Consistency
- [ ] No contradice reglas existentes
- [ ] Sigue estructura estándar del proyecto
- [ ] Formateo consistente (viñetas, headers)

### Completeness
- [ ] Alternativas proporcionadas para restricciones
- [ ] Contexto suficiente para aplicar regla
- [ ] Edge cases considerados si relevante

### Impact
- [ ] Cambio beneficia a todo el equipo
- [ ] No aumenta complejidad innecesariamente
- [ ] Documentación de razón para el cambio
```

### 6.4 Auditoría y Consolidación Periódica

**Frecuencia:** Mensual o al finalizar cada sprint

**Proceso:**

```markdown
## Auditoría Mensual de Claude.md

### 1. Revisar Obsolescencia
- [ ] Identificar reglas que ya no aplican
- [ ] Remover referencias a código/tools deprecados
- [ ] Actualizar versiones de dependencias

### 2. Identificar Redundancia
- [ ] Buscar reglas duplicadas
- [ ] Consolidar secciones similares
- [ ] Eliminar información inferible del código

### 3. Verificar Efectividad
- [ ] ¿Claude sigue estas reglas consistentemente?
- [ ] ¿Qué errores aún ocurren repetidamente?
- [ ] ¿Qué nuevas reglas deben añadirse?

### 4. Optimizar Tamaño
- [ ] Tamaño actual: [X] líneas / [Y] KB
- [ ] Target: <150 líneas para proyectos medianos
- [ ] Eliminar verbosidad sin perder claridad

### 5. Mejorar Claridad
- [ ] Aplicar feedback de errores de Claude
- [ ] Añadir ejemplos donde hubo confusión
- [ ] Refinar lenguaje de reglas ambiguas
```

### 6.5 Patrón de Actualización Después de Errores

**Trigger:** Claude comete el mismo error 2+ veces

**Workflow:**

```markdown
## Error Repetitivo → Actualización de Claude.md

**Ejemplo de Situación:**
Claude añade `console.log()` statements en producción a pesar de instrucciones

**Paso 1: Identificar el Patrón**
¿Qué exactamente está haciendo mal?
¿Por qué la instrucción actual no es efectiva?

**Paso 2: Solicitar Sugerencia a Claude**
Usuario: "Has añadido console.log en producción 3 veces. Nuestra regla actual dice 'No debug code en producción'. ¿Cómo deberíamos mejorar Claude.md para prevenir esto?"

Claude puede sugerir:
- Regla más específica
- Ejemplo de patrón correcto
- Hook de pre-commit
- Herramienta de validación

**Paso 3: Implementar Mejora**
Añadir a Claude.md:

```markdown
## Critical Rules (DO NOT)

### Debug & Logging
- ❌ NEVER use `console.log()`, `console.warn()`, or `console.error()` in src/
- ✅ USE logger from `@/lib/logger` with appropriate log levels
- ❌ NEVER commit debug code (debugger statements, console.*)
- PreCommit hook will REJECT commits with console.* in src/

**Correct pattern:**
```typescript
import { logger } from '@/lib/logger';

// Development
logger.debug('User data:', user);

// Production  
logger.info('User logged in', { userId: user.id });
logger.error('Auth failed', { error });
```
```

**Paso 4: Verificar Efectividad**
Monitorear próximas sesiones para confirmar que error no se repite
```

---

## 7. PATRONES AVANZADOS

### 7.1 Comandos Slash Personalizados

**Ubicación:** `.claude/commands/[nombre].md`

**Propósito:** Workflows repetibles con templates reutilizables

#### Ejemplo 1: Comando /test
**Archivo:** `.claude/commands/test.md`

```markdown
Create comprehensive tests for: $ARGUMENTS

Requirements:
- Framework: Vitest + React Testing Library
- Location: Place in `__tests__/` directory next to source file
- Coverage: Aim for 90%+ line coverage
- Structure:
  ```typescript
  describe('$ARGUMENTS', () => {
    describe('Happy Path', () => {
      it('should [behavior] when [condition]', () => {
        // Arrange
        // Act
        // Assert
      });
    });
    
    describe('Edge Cases', () => {
      it('should handle [edge case]', () => {
        // Test edge case
      });
    });
    
    describe('Error Handling', () => {
      it('should throw when [invalid input]', () => {
        // Test error case
      });
    });
  });
  ```

Mocking:
- Mock external dependencies (API calls, database)
- Use MSW for HTTP mocking
- Use vi.mock() for module mocking

Assertions:
- Use expect() from Vitest
- Prefer specific matchers: toEqual, toContain, toThrow
- Test user-visible behavior, not implementation
```

**Uso:**
```bash
/test UserProfile component
/test api/users endpoint
/test lib/calculations utility
```

#### Ejemplo 2: Comando /review
**Archivo:** `.claude/commands/review.md`

```markdown
Perform comprehensive code review on: $ARGUMENTS

Review checklist:

1. **Code Quality**
   - [ ] Follows project conventions from CLAUDE.md
   - [ ] No unnecessary complexity
   - [ ] Functions are single-purpose (<50 lines)
   - [ ] No code duplication (DRY principle)

2. **Type Safety**
   - [ ] TypeScript types are specific (no `any`)
   - [ ] All public APIs have explicit types
   - [ ] Type guards used for narrowing
   - [ ] No type assertions (`as`) unless justified

3. **Error Handling**
   - [ ] All async operations have error handling
   - [ ] Errors are specific, not generic
   - [ ] User-facing errors are helpful
   - [ ] No silent failures (catch without re-throw)

4. **Performance**
   - [ ] No unnecessary re-renders (React)
   - [ ] Expensive operations are memoized
   - [ ] Database queries are optimized
   - [ ] No blocking operations on main thread

5. **Testing**
   - [ ] Has corresponding tests
   - [ ] Tests cover happy path + edge cases
   - [ ] Tests are maintainable (not brittle)

6. **Security**
   - [ ] No hardcoded secrets
   - [ ] Input validation present
   - [ ] SQL injection prevention (parameterized queries)
   - [ ] XSS prevention (sanitization)

7. **Accessibility** (if UI)
   - [ ] Semantic HTML used
   - [ ] ARIA labels where needed
   - [ ] Keyboard navigation works
   - [ ] Color contrast meets WCAG AA

Provide:
1. Summary of findings
2. Critical issues (MUST fix)
3. Suggestions (SHOULD fix)
4. Praise for good patterns
```

**Uso:**
```bash
/review src/components/UserDashboard.tsx
/review changes in current branch
```

#### Ejemplo 3: Comando /optimize
**Archivo:** `.claude/commands/optimize.md`

```markdown
Analyze and optimize: $ARGUMENTS

Optimization areas:

1. **Bundle Size** (if frontend)
   - Analyze import statements
   - Identify unused dependencies
   - Suggest code splitting opportunities
   - Check for duplicate dependencies

2. **Runtime Performance**
   - Identify expensive operations
   - Suggest memoization opportunities (useMemo, useCallback)
   - Check for unnecessary re-renders
   - Analyze algorithm complexity

3. **Database Queries** (if backend)
   - Check for N+1 queries
   - Suggest indexes
   - Analyze query complexity
   - Recommend eager/lazy loading

4. **Network Performance**
   - Check for over-fetching
   - Suggest caching strategies
   - Recommend compression
   - Analyze API call patterns

Provide:
- Current performance baseline
- Specific optimization recommendations
- Expected impact of each optimization
- Priority order (high/medium/low impact)
```

**Uso:**
```bash
/optimize src/pages/Dashboard.tsx
/optimize api/users/route.ts
```

### 7.2 Hooks para Control de Calidad Automatizado

**Ubicación:** `.claude/hooks/` (si soportado por configuración)

**Tipos de Hooks:**

#### PreToolUse Hook
**Propósito:** Ejecutar checks antes de aceptar cambios de Claude

```bash
# .claude/hooks/pre-tool-use.sh
#!/bin/bash

# Run linter
echo "Running linter..."
pnpm lint --quiet || {
  echo "❌ Lint errors found. Fix before applying changes."
  exit 1
}

# Run type check
echo "Running TypeScript check..."
pnpm typecheck || {
  echo "❌ Type errors found. Fix before applying changes."
  exit 1
}

# Run tests affected by changes
echo "Running affected tests..."
pnpm test --changed || {
  echo "❌ Tests failing. Fix before applying changes."
  exit 1
}

echo "✅ All pre-checks passed"
exit 0
```

#### PostToolUse Hook
**Propósito:** Auto-formatear después de cambios

```bash
# .claude/hooks/post-tool-use.sh
#!/bin/bash

# Auto-format con Prettier
echo "Auto-formatting code..."
pnpm format

# Auto-organize imports
echo "Organizing imports..."
pnpm organize-imports

# Update documentation
echo "Updating docs..."
pnpm docs:generate

echo "✅ Post-processing complete"
exit 0
```

#### Stop Hook
**Propósito:** Actualizar documentación al finalizar tarea

```bash
# .claude/hooks/stop.sh
#!/bin/bash

# Update CHANGELOG
echo "Update CHANGELOG.md? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
  # Prompt for changelog entry
  echo "Changes made:"
  # Add to CHANGELOG
fi

# Commit changes
echo "Commit changes? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
  git add .
  echo "Commit message:"
  read -r message
  git commit -m "$message"
fi

exit 0
```

### 7.3 Subagentes Especializados

**Propósito:** Segregar contexto para roles específicos

**Estructura:**
```
.claude/
  agents/
    code-reviewer/
      CLAUDE.md          # Context para code review
    test-engineer/
      CLAUDE.md          # Context para testing
    doc-writer/
      CLAUDE.md          # Context para documentación
```

#### Ejemplo: Code Reviewer Agent
**Archivo:** `.claude/agents/code-reviewer/CLAUDE.md`

```markdown
# Code Reviewer Agent

## Role
You are a senior code reviewer focused on quality, maintainability, and security.

## Responsibilities
- Review code changes for adherence to standards
- Identify potential bugs and security issues
- Suggest improvements for readability and performance
- Ensure tests are comprehensive

## Review Criteria

### Critical (Must Fix)
- Security vulnerabilities
- Data races and concurrency issues
- Memory leaks
- Breaking changes without migration path

### High Priority (Should Fix)
- Logic errors
- Missing error handling
- Insufficient test coverage (<80%)
- Performance issues (O(n²) or worse)

### Medium Priority (Consider)
- Code duplication (DRY violations)
- Poor naming or unclear logic
- Missing documentation for complex code
- Potential future maintainability issues

### Low Priority (Nice to Have)
- Code style inconsistencies
- Minor optimizations
- Additional test cases for edge cases

## Tone
- Be constructive and specific
- Explain WHY changes are suggested
- Praise good patterns
- Provide code examples for suggestions
```

**Uso:**
```bash
# Switch to code reviewer agent
/agent code-reviewer

# Review current changes
Review the changes in src/api/users.ts

# Switch back to default agent
/agent default
```

### 7.4 Patrón "Recursive Rules"

**Propósito:** Forzar a Claude a recordar reglas críticas indefinidamente

**Técnica:** Auto-referencia en las reglas

```markdown
<law>
## Principios Inmutables

Principio 1: Claude MUST obtener confirmación y/n antes de operaciones de archivos

Principio 2: Claude CANNOT cambiar planes sin nueva aprobación explícita

Principio 3: Claude MUST ejecutar tests después de cada cambio de código

Principio 4: Claude CANNOT commitear sin revisar diff completo

Principio 5: Claude MUST mostrar TODOS los principios (1-5) al inicio de cada respuesta

</law>
```

**Mecanismo:** El Principio 5 se auto-referencia, creando loop infinito de recordatorio

**Cuándo usar:**
- ⚠️ Solo para reglas absolutamente críticas
- ⚠️ Reglas que NO pueden violarse bajo ninguna circunstancia
- ⚠️ Cuando errores tienen consecuencias graves

**Advertencia:** Controversial y puede ser verboso. Usar con moderación.

---

## 8. PERSONALIZACIÓN POR TIPO DE PROYECTO

### 8.1 Frontend Web (React/Next.js/Vue)

**Énfasis Especial:**
- Componentes y estructura de UI
- State management patterns
- Styling conventions
- Responsive design requirements
- Accessibility standards (WCAG)
- Performance budgets

**Secciones Adicionales Requeridas:**

```markdown
## Component Architecture

### Component Types
- **Page Components** (`src/app/[route]/page.tsx`): Route-level components
- **Layout Components** (`src/app/[route]/layout.tsx`): Shared layouts
- **Feature Components** (`src/features/[feature]/components/`): Feature-specific
- **Shared Components** (`src/components/`): Used by 2+ features
- **UI Components** (`src/components/ui/`): Pure presentation (no business logic)

### Component Rules
- Functional components with hooks ONLY (no class components)
- Max 200 lines per component (split if larger)
- Props: TypeScript interfaces for ALL props
- State: Place at lowest possible tree level
- Side effects: useEffect with explicit dependencies
- Performance: memo() for expensive renders, useMemo/useCallback judiciously

### State Management
- **Local state:** useState for component-scoped
- **Shared state:** Zustand for cross-component (not Context API)
- **Server state:** TanStack Query for API data
- **Form state:** React Hook Form + Zod validation
- **URL state:** Next.js searchParams for filters/pagination

## Styling

### Approach
- **Framework:** Tailwind CSS 3.4 (utility-first)
- **Custom CSS:** NEVER use (Tailwind only)
- **Inline styles:** NEVER use (Tailwind classes only)
- **CSS Modules:** NO (Tailwind only)

### Conventions
- Mobile-first responsive design
- Use Tailwind breakpoints: sm, md, lg, xl, 2xl
- Dark mode: Use `dark:` prefix with `next-themes`
- Colors: Use design system tokens from `tailwind.config.ts`
- Spacing: Use Tailwind spacing scale (4px increments)

### Component Styling Pattern
```typescript
// ✅ Correct
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">

// ❌ Incorrect  
<button style={{ padding: '8px 16px', background: '#2563eb' }}>
```

## Performance

### Budgets
- Initial bundle: <150KB gzipped
- Per-route bundle: <50KB gzipped
- Time to Interactive: <3s on 3G
- Lighthouse Score: >90

### Optimization Techniques
- Code splitting: Dynamic imports for routes
- Image optimization: Next.js Image component with blur placeholders
- Font optimization: next/font with font-display: swap
- Lazy loading: React.lazy for below-fold components
- Tree shaking: Import only what's needed

## Accessibility

### Requirements (WCAG 2.1 Level AA)
- Semantic HTML: Use proper elements (<button> not <div onClick>)
- ARIA labels: Required for icon-only buttons and complex widgets
- Keyboard navigation: All interactive elements accessible via keyboard
- Focus indicators: Visible focus states for all interactive elements
- Color contrast: Minimum 4.5:1 for text, 3:1 for UI components
- Alt text: All images must have descriptive alt attributes

### Testing
- Run axe-core in tests
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver/NVDA)
```

### 8.2 Backend/API

**Énfasis Especial:**
- API design patterns (REST/GraphQL)
- Error handling y status codes
- Authentication/Authorization flows
- Database patterns y queries
- Logging y monitoring
- Rate limiting y security

**Secciones Adicionales Requeridas:**

```markdown
## API Design

### Endpoint Patterns
- **RESTful naming:** `/resources` NOT `/getResources` or `/resourceList`
- **Resource nesting:** Max 2 levels (`/users/123/posts/456`)
- **Versioning:** `/api/v1/` prefix for all endpoints
- **Plural nouns:** `/users` not `/user`

### HTTP Methods
- **GET:** Retrieve resources (idempotent, no body)
- **POST:** Create new resource (non-idempotent, body required)
- **PUT:** Replace entire resource (idempotent, body required)
- **PATCH:** Partial update (idempotent, body required)
- **DELETE:** Remove resource (idempotent, no body)

### Response Format

**Success Responses:**
```typescript
// Single resource
{ data: { id: "123", name: "John" } }

// Collection
{ 
  data: [{ id: "1" }, { id: "2" }],
  meta: { 
    total: 100, 
    page: 1, 
    pageSize: 20 
  }
}
```

**Error Responses:**
```typescript
{
  error: {
    code: "RESOURCE_NOT_FOUND",
    message: "User with ID 123 does not exist",
    details: { 
      userId: "123",
      resource: "user" 
    }
  }
}
```

### Status Codes
| Code | Usage | Response |
|------|-------|----------|
| 200 | Successful GET, PUT, PATCH, DELETE | `{ data: T }` |
| 201 | Successful POST (created) | `{ data: T }` |
| 204 | Successful DELETE (no content) | Empty body |
| 400 | Bad request (validation error) | `{ error: {...} }` |
| 401 | Not authenticated | `{ error: { code: 'UNAUTHORIZED' } }` |
| 403 | Forbidden (authenticated but no permission) | `{ error: { code: 'FORBIDDEN' } }` |
| 404 | Resource not found | `{ error: { code: 'NOT_FOUND' } }` |
| 409 | Conflict (duplicate, constraint violation) | `{ error: {...} }` |
| 422 | Unprocessable entity (business logic error) | `{ error: {...} }` |
| 429 | Too many requests (rate limit) | `{ error: { code: 'RATE_LIMIT_EXCEEDED' } }` |
| 500 | Internal server error | `{ error: {...} }` |

## Authentication & Authorization

### Strategy
- **Authentication:** JWT tokens with refresh tokens
- **Authorization:** Role-Based Access Control (RBAC)
- **Token storage:** HTTP-only cookies (not localStorage)
- **Token expiry:** Access token 15min, refresh token 7 days

### Middleware Order
```typescript
app.use(cors());
app.use(helmet());
app.use(rateLimit());
app.use(authenticate);  // Verify JWT
app.use(authorize);     // Check permissions
app.use(routes);
app.use(errorHandler);
```

## Database

### ORM
- **Tool:** Prisma 5.8
- **Location:** `prisma/schema.prisma`
- **Migrations:** Always use migrations, NEVER `db push` in prod

### Query Patterns

**✅ Correct: Avoid N+1 queries**
```typescript
// Include related data in single query
const posts = await prisma.post.findMany({
  include: {
    author: true,
    comments: true
  }
});
```

**❌ Incorrect: N+1 query**
```typescript
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ 
    where: { id: post.authorId } 
  });
}
```

### Transaction Guidelines
- Use transactions for multi-step operations
- Keep transactions short
- Handle deadlocks with retry logic
- Never nest transactions

## Error Handling

### Custom Error Classes
```typescript
// Base error
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// Specific errors
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(
      'NOT_FOUND',
      404,
      `${resource} with ID ${id} not found`,
      { resource, id }
    );
  }
}
```

### Error Handling Middleware
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }
  
  // Unexpected errors
  logger.error('Unexpected error', { error: err });
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});
```

## Logging & Monitoring

### Logger
- **Tool:** Winston or Pino
- **Levels:** error, warn, info, debug
- **Format:** JSON in production, pretty in development

### What to Log
- All errors with stack traces
- Authentication events (login, logout, failures)
- Authorization failures
- Database queries (in debug mode)
- External API calls
- Performance metrics (slow queries >100ms)

### What NOT to Log
- Passwords or secrets
- Full credit card numbers
- Personal identification numbers
- Session tokens
```

### 8.3 Full-Stack / Monorepo

**Énfasis Especial:**
- Separación frontend/backend clara
- Shared types y contracts
- API integration patterns
- Testing multi-nivel
- Deployment pipeline
- Environment management

**Secciones Adicionales Requeridas:**

```markdown
## Monorepo Structure

### Package Organization
```
project-root/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── mobile/           # React Native (if applicable)
│   └── api/              # Backend API
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   ├── config/           # Shared configs (eslint, ts)
│   └── utils/            # Shared utilities
├── tools/
│   ├── scripts/          # Build/deploy scripts
│   └── generators/       # Code generators
└── docs/
    └── architecture/     # Architecture docs
```

### Package Manager
- **Tool:** pnpm workspaces (NOT npm or yarn)
- **Reason:** Fast, disk-efficient, strict peer deps

### Dependencies

**Shared Dependencies:**
Add to root `package.json`:
- TypeScript
- ESLint
- Prettier
- Testing tools

**Package-Specific Dependencies:**
Add to package's own `package.json`:
- React (apps/web)
- Express (apps/api)
- UI library (packages/ui)

### Shared Code Rules

**When to Share (move to packages/):**
- Used by 2+ apps/packages
- Stable API (not changing frequently)
- Well-tested (>90% coverage)
- Documented (README + examples)

**When NOT to Share:**
- Used by only 1 app
- Experimental or rapidly changing
- Tightly coupled to specific app

## Type Safety Across Stack

### Shared Types Package

**Location:** `packages/types/src/`

**Structure:**
```typescript
// packages/types/src/api/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}
```

**API Contract:**
```typescript
// packages/types/src/api/endpoints.ts
export interface ApiEndpoints {
  'GET /api/users/:id': {
    params: { id: string };
    response: { data: User };
  };
  'POST /api/users': {
    body: CreateUserDto;
    response: { data: User };
  };
  'PATCH /api/users/:id': {
    params: { id: string };
    body: UpdateUserDto;
    response: { data: User };
  };
}
```

**Usage in Frontend:**
```typescript
import type { ApiEndpoints, User } from '@repo/types';

const response = await fetch('/api/users/123');
const data: ApiEndpoints['GET /api/users/:id']['response'] = await response.json();
const user: User = data.data;
```

## Cross-Package Development

### Turborepo Configuration

**File:** `turbo.json`
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Development Workflow

**Start all apps:**
```bash
pnpm dev
# Runs dev script for all packages in parallel
```

**Work on specific app:**
```bash
pnpm --filter web dev
pnpm --filter api dev
```

**Build all:**
```bash
pnpm build
# Turborepo builds in correct order based on dependencies
```

**Test affected:**
```bash
pnpm test --filter=[origin/main]
# Only test packages affected by changes
```

## Deployment

### Environment Variables

**Per-app .env files:**
```
apps/web/.env
apps/api/.env
```

**Shared variables:** Use packages/config

**Loading:**
```typescript
// packages/config/src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'staging', 'production'])
});

export const env = envSchema.parse(process.env);
```

### CI/CD Pipeline

**GitHub Actions workflow:**
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: pnpm deploy:web
      - run: pnpm deploy:api
```
```

### 8.4 Data Science / ML

**Énfasis Especial:**
- Notebook conventions
- Data pipeline patterns
- Model versioning
- Experiment tracking
- Reproducibility requirements

**Secciones Adicionales Requeridas:**

```markdown
## Project Structure

```
project-root/
├── data/
│   ├── raw/              # Original, immutable data
│   ├── processed/        # Cleaned, transformed data
│   └── features/         # Feature-engineered data
├── notebooks/
│   ├── exploratory/      # EDA notebooks (keep messy)
│   └── analysis/         # Final analysis (clean, documented)
├── src/
│   ├── data/             # Data loading and processing
│   ├── features/         # Feature engineering
│   ├── models/           # Model implementations
│   └── visualization/    # Plotting utilities
├── models/               # Trained model artifacts
├── experiments/          # MLflow experiment tracking
└── tests/
```

## Notebook Conventions

### Exploratory Notebooks
- **Purpose:** Initial data exploration, hypothesis testing
- **Location:** `notebooks/exploratory/`
- **Naming:** `YYYY-MM-DD-initials-description.ipynb`
- **Example:** `2024-11-07-rd-customer-segmentation-eda.ipynb`
- **Git:** Commit with outputs cleared
- **Quality:** Can be messy, document key findings

### Analysis Notebooks
- **Purpose:** Final, reproducible analysis for reports
- **Location:** `notebooks/analysis/`
- **Quality:** Clean, well-documented, reproducible
- **Git:** Commit with outputs (for record)
- **Requirements:**
  - Clear markdown explanations
  - Well-organized sections
  - Reproducible (set random seeds)
  - No hardcoded paths

### Notebook Rules
```python
# ✅ Correct: At top of every notebook
import numpy as np
import pandas as pd

# Set random seeds for reproducibility
np.random.seed(42)
pd.set_option('display.max_columns', None)

# Use environment variables for paths
from pathlib import Path
DATA_DIR = Path(os.getenv('DATA_DIR', './data'))
```

## Data Management

### Data Paths
- **NEVER hardcode paths:** Use environment variables or config
- **Version data:** Use DVC (Data Version Control)
- **Document sources:** README in data/ with provenance
- **Validate data:** Schema checks on load

### Data Loading Pattern
```python
# src/data/loader.py
from pathlib import Path
import pandas as pd
from typing import Literal

DataSplit = Literal['train', 'test', 'val']

def load_data(
    split: DataSplit,
    data_dir: Path = Path('./data')
) -> pd.DataFrame:
    """Load and validate dataset.
    
    Args:
        split: Which data split to load
        data_dir: Root data directory
        
    Returns:
        Validated DataFrame
        
    Raises:
        ValueError: If data fails validation
    """
    path = data_dir / 'processed' / f'{split}.parquet'
    df = pd.read_parquet(path)
    
    # Validate schema
    validate_schema(df)
    
    return df
```

## Model Development

### Experimentation
- **Tool:** MLflow for experiment tracking
- **Track:** Parameters, metrics, artifacts, model
- **Naming:** Descriptive experiment names

```python
import mlflow

# Start experiment
mlflow.set_experiment("customer-churn-prediction")

with mlflow.start_run(run_name="random-forest-v1"):
    # Log parameters
    mlflow.log_params({
        "n_estimators": 100,
        "max_depth": 10,
        "min_samples_split": 5
    })
    
    # Train model
    model = train_model(X_train, y_train)
    
    # Log metrics
    mlflow.log_metrics({
        "train_accuracy": train_acc,
        "val_accuracy": val_acc,
        "f1_score": f1
    })
    
    # Log model
    mlflow.sklearn.log_model(model, "model")
```

### Model Versioning
- **Tool:** MLflow Model Registry
- **Stages:** None → Staging → Production → Archived
- **Naming:** Semantic versioning (v1.0.0, v1.1.0, v2.0.0)

### Model Requirements
- **Reproducibility:** ALWAYS set random seeds
- **Documentation:** Model card documenting:
  - Purpose and intended use
  - Training data and features
  - Performance metrics
  - Limitations and biases
  - Ethical considerations

## Code Quality

### Moving to Production
**When to move from notebook to .py:**
- Function used in 3+ places
- Part of data pipeline
- Needs unit tests
- Will be scheduled job

**Pattern:**
```python
# 1. Develop in notebook
def preprocess_data(df):
    # Implementation
    return processed_df

# 2. Once stable, move to src/
# src/data/preprocessing.py
def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess raw data.
    
    Args:
        df: Raw DataFrame
        
    Returns:
        Processed DataFrame with engineered features
    """
    # Implementation with type hints
    # Proper error handling
    # Comprehensive docstring
    return processed_df

# 3. Add tests
# tests/test_preprocessing.py
def test_preprocess_data():
    # Test implementation
    pass

# 4. Import in notebook
from src.data.preprocessing import preprocess_data
```

## Testing

### What to Test
- **Data validation:** Schema, ranges, distributions
- **Feature engineering:** Correctness of transformations
- **Model training:** Reproducibility (same seed → same model)
- **Model inference:** Output shape, range, type

```python
# tests/test_model.py
import pytest
import numpy as np
from src.models import ChurnModel

@pytest.fixture
def sample_data():
    return np.random.rand(100, 10)

def test_model_reproducibility(sample_data):
    """Test that model training is reproducible."""
    model1 = ChurnModel(random_state=42)
    model1.fit(sample_data)
    
    model2 = ChurnModel(random_state=42)
    model2.fit(sample_data)
    
    np.testing.assert_array_equal(
        model1.predict(sample_data),
        model2.predict(sample_data)
    )

def test_model_output_shape(sample_data):
    """Test that model output has correct shape."""
    model = ChurnModel()
    model.fit(sample_data)
    
    predictions = model.predict(sample_data)
    assert predictions.shape == (100,)
    assert predictions.dtype == np.float64
```

## Reproducibility Checklist

Before any experiment or analysis:
- [ ] Set all random seeds (numpy, sklearn, tensorflow, torch)
- [ ] Document package versions (requirements.txt or environment.yml)
- [ ] Use version-controlled data (DVC)
- [ ] Log all hyperparameters (MLflow)
- [ ] Document hardware (GPU type, RAM)
- [ ] Clear notebook outputs before commit (except final analysis)
```

---

## 9. CRITERIOS DE ÉXITO

### 9.1 Métricas de Efectividad del Archivo Claude.md

#### Indicadores Cuantitativos

**Reducción de Errores:**
- ✅ Target: 90%+ reducción en errores repetitivos
- Método de medición: Tracking de errores similares antes/después de añadir regla

**Adherencia a Convenciones:**
- ✅ Target: 95%+ del código generado sigue convenciones
- Método de medición: Code review checklist score

**Velocidad de Desarrollo:**
- ✅ Target: 40-60% reducción en tiempo para tareas similares
- Método de medición: Time tracking en tareas equivalentes

**Consumo de Tokens:**
- ✅ Target: <50KB total size de Claude.md
- ✅ Target: <30% del context window en sesión típica
- Método de medición: Análisis de token usage en Claude Code

#### Indicadores Cualitativos

**Claridad de Instrucciones:**
- ✅ Claude puede aplicar regla sin preguntar clarificaciones
- ✅ Miembros del equipo entienden reglas al leer archivo

**Completitud:**
- ✅ Responde a todos los patrones comunes del proyecto
- ✅ Cubre todos los "Do Not" críticos identificados

**Mantenibilidad:**
- ✅ Fácil de actualizar cuando surgen nuevos patrones
- ✅ No requiere re-educación de Claude en cada sesión

### 9.2 Checklist de Validación Pre-Deploy

Antes de considerar Claude.md completo para un proyecto:

```markdown
## Pre-Deploy Validation Checklist

### Estructura
- [ ] Tiene las 6 secciones obligatorias del núcleo mínimo
- [ ] Usa jerarquía clara de headers (H1, H2, H3)
- [ ] Mantiene formateo consistente (viñetas, code blocks)

### Contenido
- [ ] Tech stack incluye versiones específicas
- [ ] Commands incluyen flags y contexto de uso
- [ ] Critical Rules (DO NOT) está completa y específica
- [ ] Ejemplos de código incluidos para patrones complejos
- [ ] Sin redundancia con código existente

### Claridad
- [ ] Instrucciones son específicas y accionables
- [ ] No hay ambigüedad en interpretación
- [ ] Restricciones incluyen alternativas correctas
- [ ] Términos del dominio están definidos

### Tamaño
- [ ] Archivo es <150 líneas (o justificado si más grande)
- [ ] Total <50KB para rendimiento óptimo
- [ ] Cada sección justifica su presencia

### Pruebas
- [ ] Claude puede seguir instrucciones sin clarificación
- [ ] No genera errores que las reglas deberían prevenir
- [ ] Respeta todas las restricciones del "Do Not"
- [ ] Implementa patrones comunes correctamente

### Versionamiento
- [ ] Archivo commiteado a Git
- [ ] Incluido en .gitignore si es .local.md
- [ ] Documentado en README del proyecto

### Mantenimiento
- [ ] Proceso de actualización documentado
- [ ] Responsable de actualizaciones definido
- [ ] Cadencia de revisión establecida (mensual recomendado)
```

### 9.3 Señales de que Claude.md Necesita Mejora

**Señales de Alerta:**

❌ **Claude pregunta lo mismo repetidamente**
→ Falta claridad o información en Claude.md

❌ **Errores recurrentes en patrones específicos**
→ Necesita añadir restricción o ejemplo en Claude.md

❌ **Claude ignora convenciones después de 50+ mensajes**
→ Archivo puede ser muy largo o necesita XML tags para énfasis

❌ **Miembros del equipo reportan que Claude no sigue estándares**
→ Reglas pueden ser ambiguas o contradictorias

❌ **Alta tasa de cambios rechazados en code review**
→ Disconnect entre Claude.md y expectativas del equipo

❌ **Sesiones requieren re-explicar contexto frecuentemente**
→ Información crítica no está en Claude.md

**Acciones Correctivas:**

Para cada señal de alerta, ejecutar:
1. Identificar patrón específico del problema
2. Solicitar a Claude que sugiera mejora a Claude.md
3. Implementar mejora y probar en próxima sesión
4. Monitorear si problema persiste
5. Iterar si es necesario

---

## 10. IMPLEMENTACIÓN: WORKFLOW INICIAL

### 10.1 Proceso para Nuevo Proyecto

**Fase 1: Análisis (5-10 minutos)**
1. Identificar tipo de proyecto (frontend/backend/fullstack/ML)
2. Listar tech stack con versiones
3. Identificar restricciones críticas conocidas
4. Revisar si hay Claude.md de proyecto similar para usar como base

**Fase 2: Generación Base (5 minutos)**
```bash
# En raíz del proyecto
/init

# Claude analiza:
# - package.json
# - Estructura de directorios
# - README existente
# - Archivos de configuración

# Genera Claude.md base
```

**Fase 3: Personalización (15-30 minutos)**
1. Abrir Claude.md generado
2. Comparar con template de este PRD para tipo de proyecto
3. Completar secciones faltantes o débiles
4. Añadir restricciones críticas específicas del proyecto
5. Añadir ejemplos de patrones complejos
6. Eliminar verbosidad y redundancia

**Fase 4: Validación (10 minutos)**
```bash
# Test con Claude Code
# Pedir a Claude que:
# 1. Lea Claude.md y resuma entendimiento
# 2. Implemente un componente/módulo típico
# 3. Verificar que sigue todas las convenciones

# Ajustar Claude.md basado en results
```

**Fase 5: Commit Inicial**
```bash
git add CLAUDE.md
git commit -m "docs: add initial CLAUDE.md with project standards"
git push
```

**Tiempo Total Estimado:** 35-55 minutos

### 10.2 Template de Prompt Inicial

Al comenzar trabajo en proyecto con Claude Code:

```markdown
Hola Claude. Estoy comenzando a trabajar en un proyecto [TIPO: web app/API/ML/etc].

Primero, por favor:

1. Lee el archivo CLAUDE.md en la raíz del proyecto
2. Resume tu entendimiento de:
   - Tipo de proyecto y tech stack
   - Convenciones de código principales
   - Restricciones críticas (Do Not)
   - Comandos de desarrollo
   - Proceso de testing

3. Confirma que entiendes todas las reglas antes de proceder.

Una vez confirmado, procederemos con [TAREA ESPECÍFICA].

---

Para asegurar calidad, recuerda durante todo el desarrollo:
- Ejecutar tests después de cada cambio significativo
- Seguir convenciones de naming del proyecto
- Pedir confirmación antes de operaciones de archivos
- Mostrar diff antes de commits
```

---

## 11. REFERENCIAS Y RECURSOS

### 11.1 Documentación Oficial
- Claude Code Documentation: https://docs.claude.com/en/docs/claude-code
- Prompt Engineering Guide: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering
- Model Context Protocol (MCP): [URL si disponible]

### 11.2 Comunidad y Ejemplos
- GitHub: Buscar "claude.md examples" para ver archivos reales
- Discord de Anthropic: Discussions sobre mejores prácticas
- Reddit r/ClaudeAI: Community tips y experiencias

### 11.3 Herramientas Complementarias
- Prompt Improver: Optimiza prompts y Claude.md
- Token Counter: Mide tamaño de contexto
- Diff Checker: Valida cambios en Claude.md

---

## 12. CHANGELOG DE ESTE PRD

### Versión 1.0 (Noviembre 2025)
- Documento inicial basado en investigación comprehensiva
- Incluye todas las mejores prácticas documentadas
- Template completo para 4 tipos de proyecto
- Guías de implementación y mantenimiento

### Futuras Actualizaciones
Este PRD debe actualizarse cuando:
- Anthropic publique nuevas features de Claude Code
- Cambien recomendaciones oficiales sobre Claude.md
- La comunidad identifique nuevos patrones efectivos
- Se descubran anti-patterns adicionales

---

## APÉNDICE A: GLOSARIO

**Claude.md** - Archivo de configuración Markdown que Claude Code lee automáticamente en cada sesión

**Context Window** - Límite de tokens que Claude puede procesar en una conversación

**Token** - Unidad básica de texto procesada por Claude (aprox 4 caracteres)

**MCP** - Model Context Protocol, sistema para conectar herramientas externas

**Presupuesto de Tokens** - Cantidad limitada de tokens disponibles en context window

**Memoria Jerárquica** - Sistema de múltiples niveles de archivos Claude.md

**Imports** - Sistema para referenciar archivos externos desde Claude.md

**Hooks** - Scripts que se ejecutan en momentos específicos del ciclo de vida

**Subagentes** - Instancias especializadas de Claude con contexto específico

**Document & Clear** - Patrón de guardar progreso antes de resetear conversación

---

## APÉNDICE B: FAQ

**P: ¿Cuánto debería medir mi Claude.md?**
R: Para proyectos pequeños-medianos: <150 líneas. Para proyectos grandes/complejos: hasta 300 líneas justificadas. Target universal: <50KB.

**P: ¿Debo incluir toda la documentación del proyecto?**
R: NO. Claude.md es para instrucciones operacionales. Usa imports (@) para referenciar docs extensas.

**P: ¿Con qué frecuencia actualizar Claude.md?**
R: Añade reglas orgánicamente cuando descubres patrones (tecla #). Revisa y consolida mensualmente.

**P: ¿Versionamiento de Claude.md en Git?**
R: SÍ para CLAUDE.md compartido. NO para CLAUDE.local.md (añadir a .gitignore).

**P: ¿Claude olvida las reglas después de muchos mensajes?**
R: Sí, es normal. Usa /clear frecuentemente y el patrón "Document & Clear".

**P: ¿Puedo tener diferentes Claude.md en subdirectorios?**
R: Sí, Claude lee todos en la jerarquía y los combina.

**P: ¿Cómo enfatizar reglas críticas?**
R: Usa mayúsculas (MUST, NEVER), XML tags (<critical_notes>), o patrón recursive rules.

**P: ¿imports vs copiar contenido directamente?**
R: Usa imports para documentación que cambia frecuentemente. Copia para reglas estables.

---

**FIN DEL PRD**

Este documento debe tratarse como especificación técnica viva. Actualizar según evolucionen las mejores prácticas y capacidades de Claude Code.