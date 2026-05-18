# Coding Conventions

**Analysis Date:** 2026-05-18

## TypeScript Configuration

**Strict Mode:** Enabled
- `strict: true` in `tsconfig.json`
- `noEmit: true` (type checking only, no JS output)
- All type violations must be resolved before commit
- Path alias: `@/*` → `./src/*`

**Type Organization:**
- Types live in `src/types/` directory
- Export types at module level, not nested in files
- Use `type` keyword for type-only exports: `export type { UserRole }`
- Discriminated unions for multi-variant types (e.g., `Role = "conseiller" | "manager"`)

## React Patterns

### Server vs. Client Components

**Server Components (default):**
- Used for root layouts: `src/app/layout.tsx`
- Database queries and backend operations
- No `'use client'` directive

**Client Components:**
- Must have `'use client'` at the top of file
- Used for: interactive forms, hooks (useState, useContext), event handlers
- All pages in `src/app/(dashboard)/` are client components due to sidebar interactivity
- All pages in `src/app/(auth)/` are client components
- Examples: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/conseiller/diagnostic/page.tsx`

### Hooks Structure

**Location:** `src/hooks/use-*.ts` files

**Common Hooks:**
- `use-user.ts` — Returns current user + category from Zustand store, supports advisor override context
- `use-results.ts` — Fetch results for single user or all users
- `use-ratios.ts` — Compute all business ratios and configurations
- `use-weekly-gate.ts` — Weekly submission gate state and dismiss logic
- `use-coach-data.ts` — Portfolio, summaries, priorities for coaches
- `use-director-data.ts` — Team aggregation and org-wide stats for directors
- `use-network-data.ts` — Cross-agency aggregation and network stats

**Hook Pattern:**
```typescript
// src/hooks/use-user.ts
"use client";

import { useAppStore } from "@/stores/app-store";

export function useUser() {
  const storeUser = useAppStore((s) => s.user);
  const users = useAppStore((s) => s.users);
  
  return {
    user: storeUser,
    isAuthenticated: !!storeUser,
    category: storeUser?.category ?? "confirme",
  };
}
```

### Component Organization

**Component Patterns:**
- Functional components only (no class components)
- Props interface defined above component
- Props destructured in function signature
- JSX returned directly without intermediate variables (unless complex)
- Event handlers prefixed with `on`: `onDismiss`, `onSaisieDone`, `onToggle`

**Example Structure:**
```typescript
"use client";

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

export function Dialog({ isOpen, title, onClose }: DialogProps) {
  if (!isOpen) return null;
  
  return <div role="dialog" aria-label={title}>...</div>;
}
```

## Zustand Store Patterns

**Store Location:** `src/stores/app-store.ts` (single global store)

**Store Structure:**
```typescript
interface AppState {
  // State slices
  user: User | null;
  users: User[];
  results: PeriodResults[];
  
  // Actions
  setUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  users: [],
  setUser: (user) => set({ user }),
  switchRole: (role) => set((state) => ({ /* */ })),
}));
```

**State Access Pattern:**
```typescript
// Subscribe to specific slices
const user = useAppStore((s) => s.user);
const setUser = useAppStore((s) => s.setUser);

// Do NOT use bare useAppStore() — always select specific fields
// ❌ Wrong: const state = useAppStore();
// ✅ Right: const user = useAppStore((s) => s.user);
```

**Store Initialization:**
- Demo mode loads mock data from `src/data/mock-*.ts`
- No API calls until Supabase integration phase
- All state is client-side (localStorage for persistence)

## French UI Language

**CRITICAL Requirement from CLAUDE.md:**

> French UI language — Always use real characters (é, è, à, ç). NEVER unicode escape sequences (é).

**Implementation:**
- All visible text uses UTF-8 real characters
- Labels in `src/lib/constants.ts` define canonical strings
- Example: `CATEGORY_LABELS` maps `debutant` → `"Junior"` (not escaped)
- Example: `GPS_THEME_LABELS` has `"Estimations"`, `"Mandats"`, `"% Exclusivité"` (real è and é)

**Category Label Convention:**
- Database stores: `debutant` (DB enum value)
- UI displays: `"Junior"` (from `CATEGORY_LABELS`)
- See `src/lib/constants.ts:28-32` for single source of truth

## 5-Role System

**Roles (immutable constraint):**

```
UserRole = "conseiller" | "manager" | "directeur" | "coach" | "reseau"
```

**Role Hierarchy:**
```
reseau          → ["reseau"]                    (isolated, network-level)
directeur       → ["directeur", "manager", "conseiller"]
manager         → ["manager", "conseiller"]
coach           → ["coach"]                     (isolated, cross-org)
conseiller      → ["conseiller"]
```

**Adding New Roles: FORBIDDEN**

From CLAUDE.md:
> 5 roles — conseiller, manager, directeur, coach, reseau. Do not add roles without updating all related systems (types, store, sidebar, export, guided tour, register page).

**All Role-Related Files Must Be Updated:**
1. `src/types/user.ts` — `UserRole` type definition
2. `src/stores/app-store.ts` — `DEFAULT_ROUTES`, `rolesToViews()`, role helpers
3. `src/components/layout/sidebar.tsx` — Role flags (managerOnly, directorOnly, networkOnly)
4. `src/lib/export.ts` — Role-based export scopes
5. `src/lib/guided-tour.ts` — Role-specific tour steps
6. `src/app/(auth)/register/page.tsx` — Role selection during signup

## 7-Ratio Business Logic

**Ratios (immutable constraint):**

From CLAUDE.md:
> 7 ratios only — delai_moyen_vente was removed. Do not re-add it.

**Current Ratios:**
```typescript
type RatioId = 
  | "taux_estimation_realisation"
  | "taux_transformation_mandats"
  | "taux_exclusivite_mandats"
  | "taux_conversion_offre"
  | "taux_signature_compromis"
  | "taux_realisation_actes"
  | "panier_moyen_acte";
```

**Ratio Computation:**
- Located in `src/lib/ratios.ts`
- Functions: `computeRatioValue()`, `determineRatioStatus()`, `computeAllRatios()`
- Each ratio has thresholds per category (Junior/Confirmé/Expert) in `src/data/mock-ratios.ts`
- Status determined by comparing computed value to category threshold

## Naming Conventions

### Files

**TypeScript/Component Files:**
- kebab-case: `sidebar.tsx`, `use-user.ts`, `weekly-gate.ts`
- Directories: kebab-case grouping by feature: `src/components/conseiller/`, `src/lib/`

**Test Files:**
- Vitest unit tests: `src/lib/__tests__/weekly-gate.test.ts`
- Playwright e2e tests: `e2e/weekly-gate.spec.ts`
- Pattern: same name as source file + `.test.ts` or `.spec.ts`

### Functions & Variables

**Hooks:**
- Prefix with `use`: `useUser()`, `useResults()`, `useRatios()`
- Return object with named properties: `{ user, isAuthenticated, category }`

**Utility Functions:**
- camelCase: `computeRatioValue()`, `formatRatioObjectiveValue()`, `detectBiggestPainPoint()`
- Verb-first for actions: `calculateObjectiveBreakdown()`, `generateFormationDiagnostic()`
- Query functions: `getWeeklyGateState()`, `deriveAvailableRoles()`

**Constants:**
- SCREAMING_SNAKE_CASE for true constants: `CATEGORY_LABELS`, `RATIO_PERCENT_LABELS`, `NXT_COLORS`
- Location: `src/lib/constants.ts` (single source of truth)

**Store Selectors:**
- Inline in component: `const user = useAppStore((s) => s.user);`
- No separate selector files — Zustand doesn't require them

### Components

**Component Names:**
- PascalCase: `DiagnosticVerdictView`, `WeeklyGateWrapper`, `LineChart`
- Descriptive suffix: `*View` for page-level, `*Card` for cards, `*Modal` for dialogs, `*Wrapper` for containers

**Props Interfaces:**
- Named `[ComponentName]Props`: `DiagnosticPageProps`, `SidebarProps`
- Located directly above component function

## Import Organization

**Order (enforced by ESLint):**

1. React/Next.js imports
2. External libraries (lucide-react, date-fns, etc.)
3. Internal types (`@/types/*`)
4. Internal stores/hooks (`@/stores/*`, `@/hooks/*`)
5. Internal components (`@/components/*`)
6. Internal utilities (`@/lib/*`)

**Example:**
```typescript
"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, BookOpen } from "lucide-react";
import type { UserRole } from "@/types/user";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
```

## Component Libraries & Styling

**UI Framework:**
- **Radix UI** (`radix-ui` package v1.4.3) — Unstyled accessible primitives (rarely used directly; mostly via custom components)
- **Tailwind CSS 4** (OKLCH color space) — All styling and theming

**Chart Library:**
- **Recharts** (via `react-chartjs-2` wrapper) — NOT used directly; all charts wrap `Chart.js`
- Chart components in `src/components/charts/`: LineChart, BarChart, DonutChart, ProgressBar, ComparisonBarChart
- Pattern: React component accepts data array and config, renders Chart.js internally

**Icon Library:**
- **Lucide React** (v0.575.0) — All UI icons
- Import: `import { Settings, BookOpen } from "lucide-react";`

## Error Handling

**Custom Error Classes:**
```typescript
// src/lib/compress-image.ts
export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageCompressionError";
  }
}

// Usage
throw new ImageCompressionError("L'image dépasse 10 Mo. Choisis une image plus légère.");
```

**Error Response Pattern:**
```typescript
type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

function getAuthResult(): AuthSuccess | AuthFailure {
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}
```

**Null Checks:**
- Use optional chaining: `user?.id`, `data?.results?.[0]`
- Use nullish coalescing: `value ?? "default"`
- Pattern: `if (!user) return null;` for early exit

## Logging

**Framework:** `console` (no external logging library yet)

**Logging Pattern:**
- Use `console.log()` for feature flags and development
- Use `console.warn()` for non-fatal issues
- Use `console.error()` for exceptions
- Include context: `console.log("WeeklyGate:", { showGate, context })`
- Never log sensitive data (auth tokens, passwords)

## Comments

**When to Comment:**
- Complex business logic (e.g., GPS calculations, weekly gate logic)
- Non-obvious intent (e.g., why a certain check is needed)
- Important constraints or gotchas

**JSDoc/TSDoc Usage:**
- Parameter types inferred from TypeScript; JSDoc not required
- Document complex functions:
```typescript
/**
 * Determine if gate should be shown based on role, day of week, and submission history.
 * @param input WeeklyGateInput with role, isDemo, lastWeeklySubmissionDate
 * @returns WeeklyGateState indicating whether to show gate and submission status
 */
export function getWeeklyGateState(input: WeeklyGateInput): WeeklyGateState {
```

**Comment Style:**
- Line comments: `// Single context`
- Block comments for multi-line logic:
```typescript
// ─── Demo mode always shows gate ────────────────────────────
if (isDemo) return { showGate: true, context: "demo" };
```

## Form & Validation

**Form Library:** React Hook Form v7.71.2

**Validation:** Zod v4.3.6 for schema validation

**Pattern:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

## Data Structures

**Results Type:**
```typescript
// src/types/results.ts
type PeriodResults = {
  userId: string;
  period: "2026-01" | "2026-02"; // YYYY-MM format
  prospection: { contactsTotaux: number; /* ... */ };
  vendeurs: { estimationsRealisees: number; /* ... */ };
  acheteurs: { acheteursSortisVisite: number; /* ... */ };
  ventes: { actesSignes: number; chiffreAffaires: number };
};
```

**No legacy identifiers:**
- ESLint blocks re-introduction of removed fields (see `eslint.config.mjs`)
- Removed: `VenteInfo`, `AcheteurChaud`, `delaiMoyenVente`, `nomVendeur`
- Reference: `src/types/results.ts` for full legacy list and context

---

*Convention analysis: 2026-05-18*
