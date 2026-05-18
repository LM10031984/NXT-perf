# Technology Stack

**Analysis Date:** 2026-05-18

## Languages

**Primary:**
- TypeScript 5.x - Full codebase (strict mode enabled), all app logic and components

**Secondary:**
- JavaScript (ESM) - Build config files (`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`)
- HTML/CSS - Next.js pages and Tailwind-generated styles

## Runtime

**Environment:**
- Node.js 20.x
- Next.js 16.1.6 (App Router with Turbopack)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with API routes, middleware, SSR
- React 19.2.3 - UI component library
- TypeScript 5.x - Type safety

**State Management:**
- Zustand 5.0.11 - Global state store at `src/stores/app-store.ts`

**UI Components & Styling:**
- Radix UI 1.4.3 - Unstyled accessible component library
- Tailwind CSS 4 (with @tailwindcss/postcss) - OKLCH color space for design tokens
- Lucide React 0.575.0 - Icon library
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional class merging
- tailwind-merge 3.5.0 - Merge conflicting Tailwind classes
- next-themes 0.4.6 - Theme switching (light/dark mode)

**Forms:**
- React Hook Form 7.71.2 - Form state and validation
- @hookform/resolvers 5.2.2 - Validation schema adapters
- Zod 4.3.6 - TypeScript-first schema validation

**Data Visualization:**
- Recharts 3.7 (via Chart.js 4.5.1 + react-chartjs-2 5.3.1) - Performance charts and metrics
- react-tooltip 5.30.0 - Interactive tooltips
- colorthief 3.3.1 - Dominant color extraction from images

**File Processing:**
- xlsx 0.18.5 - Excel file parsing and generation (import/export)
- jspdf 4.2.1 - PDF generation
- pdf-lib 1.17.1 - PDF manipulation
- pdf-parse 2.4.5 - PDF text extraction
- mammoth 1.12.0 - DOCX file parsing
- html-to-image 1.11.13 - DOM-to-image conversion
- react-avatar-editor 15.1.0 - Avatar/image cropping

**Date & Time:**
- date-fns 4.1.0 - Date utilities and formatting

## Testing & Development

**Test Runner:**
- Vitest 4.1.2 - Unit test framework (config: `vitest.config.ts`)
- @playwright/test 1.59.1 - E2E testing (config: `playwright.config.ts`)

**Linting & Formatting:**
- ESLint 9.x - Code quality rules
- eslint-config-next 16.1.6 - Next.js-specific rules with core-web-vitals and TypeScript support
- (Prettier config: implicit via next/eslint defaults)

**Type Checking:**
- TypeScript 5.x strict mode - Full compiler checks enabled

## Key Dependencies

**Critical (Business Logic):**
- @supabase/supabase-js 2.98.0 - PostgreSQL backend client (auth, database, storage)
- @supabase/ssr 0.8.0 - Server-side cookie management for Supabase auth
- zustand 5.0.11 - Global performance/user state management

**AI/LLM Integration:**
- openai 6.33.0 - Groq Whisper API (wrapper), OpenRouter proxy, OpenAI SDK compatibility
- @google/genai 1.48.0 - Google Gemini Live API with audio modalities

**Infrastructure & Build:**
- tsx 4.20.0 - TypeScript execution for scripts
- better-sqlite3 12.9.0 - SQLite for local development/scripts
- googleapis 144.0.0 - Google Drive/Sheets API (for coach brain ingestion scripts)
- dotenv 17.4.0 - Environment variable loading
- shadcn 3.8.5 - Component copy-paste library CLI

## Configuration Files

**Build:**
- `next.config.ts` - Next.js configuration (image remotePatterns for Supabase CDN, redirects for legacy URLs)
- `tsconfig.json` - TypeScript compiler (target: ES2017, strict: true, path alias `@/*` → `./src/*`)
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin

**Development:**
- `eslint.config.mjs` - ESLint 9.x flat config with Next.js presets + legacy identifier guards
- `playwright.config.ts` - Playwright E2E config
- `vitest.config.ts` - Vitest unit test config

**Environment:**
- `.env.local.example` - Template for required variables (Supabase, Groq, OpenRouter, ElevenLabs, Gamma, Gemini)
- `.nvmrc` - Not present; node version specified in `package.json` engines (20.x)

## Deployment

**Platform:**
- Vercel (implied by Next.js 16, references in comments `https://nxt-perf.vercel.app`)

**Build Output:**
- `.next/` - Compiled Next.js build
- `out/` - Optional static export (ignored by `.next`)

## Browser Support

**Target:**
- Modern browsers (ES2017 target, React 19)
- Responsive design with Tailwind CSS 4 (mobile-first)
- WebSocket support for Gemini Live API (`wss://generativelanguage.googleapis.com`)

---

*Stack analysis: 2026-05-18*
