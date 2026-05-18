# External Integrations

**Analysis Date:** 2026-05-18

## APIs & External Services

**Backend Database:**
- Supabase (PostgreSQL) - Core authentication, user profiles, results storage, team management
  - SDK: `@supabase/supabase-js` 2.98.0, `@supabase/ssr` 0.8.0
  - Auth: Environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Image CDN: Remote patterns configured in `next.config.ts` for `whxkxztcfkrjqkdenufn.supabase.co`
  - Usage locations: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/middleware.ts`

**Transcription:**
- Groq Whisper API (free tier) - Audio-to-text transcription for vocal coaching
  - Client: OpenAI SDK wrapper (compatibility mode)
  - Model: whisper-large-v3 (French language)
  - Auth: `GROQ_API_KEY` (environment variable)
  - Base URL: `https://api.groq.com/openai/v1`
  - Usage: `src/app/api/vocal/route.ts` (vocal section extraction)

**LLM & Chat:**
- OpenRouter (proxy) - LLM routing for chat, embeddings, and extraction
  - SDK: OpenAI SDK with custom baseURL
  - Auth: `OPENROUTER_API_KEY` (environment variable)
  - Base URL: `https://openrouter.ai/api/v1`
  - Models accessed:
    - `anthropic/claude-sonnet-4-5` (default, configurable via `COACH_RAG_DEFAULT_MODEL`)
    - `anthropic/claude-3.5-haiku` (vocal extraction, lightweight)
    - `openai/text-embedding-3-small` (embeddings, 1536 dims, proxied via OpenRouter)
  - Usage locations:
    - Chat: `src/app/api/coach-brain/chat/route.ts` (Coach RAG system)
    - Embeddings: `src/lib/server/coach-rag/openai-embed.ts` (retrieval augmentation)
    - Vocal: `src/app/api/vocal/route.ts` (extraction step)
  - Fallback history: Previously used Voyage AI (deprecated, rate-limited), then direct OpenAI (payment issue)

**Voice & Audio:**
- Google Gemini Live API - Real-time voice conversation with audio streaming
  - SDK: `@google/genai` 1.48.0
  - Model: `gemini-2.5-flash-native-audio-preview-12-2025`
  - Auth: `GEMINI_API_KEY` (server-side, never exposed to client)
  - Session: Ephemeral token generation via `/api/voice/session`
  - Modalities: Audio request/response with persona-based voice selection
  - Usage: `src/app/api/voice/session/route.ts`, `src/hooks/use-gemini-live.ts`
  - WebSocket endpoint: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`

- ElevenLabs - Text-to-speech voice synthesis
  - Auth: `ELEVENLABS_API_KEY` (server-side, never exposed to client)
  - Default voice: `ELEVENLABS_VOICE_ID` (env var, fallback: "JBFqnCBsd6RMkjVDRZzb")
  - Persona-specific voices: `ELEVENLABS_WARRIOR_VOICE_ID` and others (see `src/lib/personas.ts`)
  - API: Streaming audio/mpeg
  - Usage: `src/app/api/voice/tts/route.ts`
  - Fallback: Browser Web Speech API if ElevenLabs unavailable

**Presentation Generation:**
- Gamma API - AI-powered presentation builder
  - Base URL: `https://public-api.gamma.app/v1.0`
  - Auth: `GAMMA_API_KEY` (X-API-KEY header, server-side)
  - Endpoints: POST `/generations` (create), GET `/generations/{id}` (status)
  - Formats: presentation, document, social
  - Export: PDF or PPTX (async polling model)
  - Usage: `src/lib/server/gamma/gamma-client.ts`, `src/app/api/manager/gamma/generate/route.ts`
  - Timeout: 30 seconds per request

## Data Storage

**Databases:**
- Supabase PostgreSQL - All persistent data
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (server)
  - Client libraries: `createClient()` for browser, `createServerSupabaseClient()` for API routes
  - Cookie-based session persistence (via `@supabase/ssr` middleware)

**Vector Store:**
- Supabase pgvector extension - Embedding-based retrieval for Coach RAG
  - Embeddings dimension: 1536 (openai/text-embedding-3-small)
  - Retrieval: Hybrid search combining BM25 + vector similarity

**File Storage:**
- Supabase Storage - Avatar images, document uploads
  - Accessible via HTTPS CDN: `https://whxkxztcfkrjqkdenufn.supabase.co/storage/v1/object/public/**`

**Local Development Only:**
- SQLite (better-sqlite3 12.9.0) - Local scripts for coach brain ingestion and batch processing

**Client-Side State:**
- localStorage - Theme preference, guided tour completion, view preferences
- Zustand store - In-memory application state (users, results, ratios, institutions, coach data)

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication (email/password, magic links)
  - Implementation: Server-side session via cookies (middleware + SSR)
  - Routes: `src/app/(auth)/login`, `src/app/(auth)/register`, `src/app/(auth)/forgot-password`, `src/app/(auth)/reset-password`
  - Callback handler: `src/app/auth/callback/route.ts` (OAuth redirect)
  - Middleware: `src/middleware.ts` (session refresh, auth guard)

**Authorization:**
- Role-based access control (RBAC)
  - Roles: conseiller, manager, directeur, coach, reseau (stored in user profile)
  - Role hierarchy enforced in API routes (`src/lib/api-auth.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected - Errors logged to console (development) or silently in production

**Logs:**
- Client: browser console (development)
- Server: Node.js stdout/stderr (captured by Vercel/deployment logs)
- Rate limiting logs: `src/lib/rate-limit.ts` (basic request tracking)

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from references in code: `https://nxt-perf.vercel.app`)

**Environment Deployment:**
- Vercel environment variables for all secrets (see `.env.local.example`)

**CI Pipeline:**
- GitHub Actions (inferred from coach brain ingestion runner comments `PR-D`)
- No explicit workflow files observed (likely using Vercel's built-in CI)

## Environment Configuration

**Required env vars (production):**

| Variable | Service | Purpose | Example |
|----------|---------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Database connection URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Client auth token | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server auth token (privileged) | `eyJ...` |
| `GROQ_API_KEY` | Groq | Whisper API key | `gsk_...` |
| `OPENROUTER_API_KEY` | OpenRouter | LLM routing key | `sk-or-v1-...` |
| `GEMINI_API_KEY` | Google | Gemini Live API key | `AIza...` |
| `ELEVENLABS_API_KEY` | ElevenLabs | Voice synthesis key | `sk_...` |
| `ELEVENLABS_VOICE_ID` | ElevenLabs | Default voice ID | `JBFqnCBsd6RMkjVDRZzb` |
| `ELEVENLABS_WARRIOR_VOICE_ID` | ElevenLabs | Persona voice (optional) | `voiceId` |
| `GAMMA_API_KEY` | Gamma | Presentation API key | `gamma_...` |
| `OPENAI_EMBED_MODEL` | OpenRouter | Embeddings model override (optional) | `openai/text-embedding-3-small` |
| `COACH_RAG_DEFAULT_MODEL` | OpenRouter | Chat model override (optional) | `anthropic/claude-sonnet-4-5` |
| `NODE_ENV` | Environment | Build target | `production`, `development` |

**Secrets location:**
- `.env.local` (local development, `.gitignore`d)
- Vercel environment variables panel (production)
- GitHub Secrets (coach brain ingestion script in Actions)

## Webhooks & Callbacks

**Incoming:**
- Supabase auth callback: `/auth/callback` (OAuth redirect handler)
- API routes accepting POST:
  - `/api/vocal` - Vocal section submission
  - `/api/voice/session` - Gemini session token request
  - `/api/voice/tts` - Text-to-speech request
  - `/api/coach-brain/chat` - Coach RAG chat messages
  - `/api/manager/gamma/generate` - Gamma presentation generation
  - `/api/import-performance` - Excel/PDF import

**Outgoing:**
- Supabase → Postgres triggers (server-side, not exposed)
- Gamma → Webhook polling (client polls `/api/manager/gamma/generate/{id}` for status)
- No explicit webhook subscriptions to external services

## Rate Limiting

**Protection:**
- Basic in-memory rate limiter: `src/lib/rate-limit.ts`
  - Vocal endpoint: 30 requests per 60 seconds
  - Voice session endpoint: 5 requests per 60 seconds
- Per-user keying (user ID tracked)

## Data Privacy & Security

**Secrets Management:**
- All API keys server-side only (never exposed in client bundles)
- Environment variables validated at startup (`src/lib/api-auth.ts`)
- Placeholder clients used when env vars missing (demo mode fallback)

**User Data:**
- Supabase Row Level Security (RLS) for data isolation
- Multi-tenant: institution-based data separation
- Audit: Supabase activity logs (not consumed by app)

---

*Integration audit: 2026-05-18*
