# Testing Patterns

**Analysis Date:** 2026-05-18

## Test Framework Setup

**Test Runners:**
- **E2E Testing:** Playwright v1.59.1 (`@playwright/test`)
  - Config: `playwright.config.ts`
  - Test directory: `e2e/`
  - Test files: `*.spec.ts`

- **Unit/Integration Testing:** Vitest v4.1.2
  - Config: `vitest.config.ts`
  - Test directory: `src/lib/__tests__/`
  - Test files: `*.test.ts`

**Assertion Library:**
- Playwright: Built-in `expect()` from `@playwright/test`
- Vitest: Built-in `expect()` from `vitest`

**Run Commands:**
```bash
npx playwright test              # Run all E2E tests
npx playwright test --ui         # Run E2E tests with UI
npx vitest                       # Run unit tests (watch mode by default)
npx vitest run                   # Run unit tests once
```

## Playwright E2E Testing

**Configuration:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    acceptDownloads: true,
  },
});
```

**Test Directory:** `e2e/`

**Test File Naming:** `[feature].spec.ts`
- Examples: `weekly-gate.spec.ts`, `badge-celebration.spec.ts`, `guided-tour.spec.ts`

### E2E Test Structure

**Basic Pattern:**
```typescript
import { test, expect, type Page } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: navigate to app, login, etc.
    await page.goto("/demo");
    await page.locator("input[type='password']").fill("DEMO2024");
    await page.getByRole("button", { name: /Démarrer la démo/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });
  });

  test("1 — specific behavior verified", async ({ page }) => {
    // Act
    await page.getByRole("button", { name: "Action" }).click();
    
    // Assert
    await expect(page.getByText("Expected Result")).toBeVisible();
    expect(page.url()).toContain("/expected-route");
  });

  test("2 — another scenario", async ({ page }) => {
    // Arrange, Act, Assert
  });
});
```

### E2E Locator Patterns

**Preferred Locators (in order of reliability):**

1. **By Accessible Role:** `page.getByRole()`
   ```typescript
   await page.getByRole("button", { name: "Démarrer" }).click();
   await page.getByRole("heading", { name: "Résultats" });
   ```

2. **By Test ID:** `page.locator("[data-testid='...']")`
   ```typescript
   await page.locator("[data-testid='submit-button']").click();
   ```

3. **By Text Content:** `page.getByText()`
   ```typescript
   await page.getByText("Passer cette étape").click();
   ```

4. **By Placeholder:** `page.getByPlaceholder()`
   ```typescript
   await page.getByPlaceholder("Email").fill("user@example.com");
   ```

5. **CSS Selector (last resort):** `page.locator("selector")`
   ```typescript
   await page.locator("input[type='password']").fill("password");
   ```

### E2E Common Patterns

**Navigation & Wait for Page Load:**
```typescript
await page.goto("/demo");
await page.waitForURL("**/dashboard**", { timeout: 15_000 });
await page.waitForNavigation();
```

**Form Interaction:**
```typescript
// Fill input
await page.locator("input").fill("35");

// Press Enter to submit
await page.locator("input").press("Enter");

// Checkbox
await page.locator("input[type='checkbox']").check();
```

**Modal/Dialog Handling:**
```typescript
// Dismiss with button
await page.getByRole("button", { name: "Confirmer" }).click();

// Confirm modal content
await expect(page.getByText("Are you sure?")).toBeVisible();
```

**Multiple Elements:**
```typescript
// Find first input
const inputs = await page.locator("input").all();
for (const input of inputs) {
  await input.fill("value");
  await input.press("Enter");
}
```

**Conditional Waiting (with fallback):**
```typescript
const skipBtn = page.getByRole("button", { name: "Passer" });
if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  await skipBtn.click();
}
```

**Screenshot Artifacts:**
- Saved to `test-results/` (timestamped YAML format)
- Also: `.playwright-mcp/` folder contains console logs and page snapshots
- Manual screenshots can be captured: `await page.screenshot({ path: 'screenshot.png' });`

### E2E Test Examples

**Example 1: Weekly Gate Logic** (`e2e/weekly-gate.spec.ts`)
```typescript
test("Import stays inline on /dashboard", async ({ page }) => {
  // Setup: navigate to gate
  await page.getByRole("button", { name: "Démarrer mon bilan" }).click();
  
  // Act: click import button
  await page.getByRole("button", { name: /Importer un fichier/i }).click();
  
  // Assert: stays on dashboard, doesn't navigate to /saisie
  expect(page.url()).toContain("/dashboard");
  expect(page.url()).not.toContain("/saisie");
});
```

**Example 2: UI Component Validation** (`e2e/badge-celebration.spec.ts`)
```typescript
test("BadgeCelebration component exists", async () => {
  const filePath = path.join(__dirname, "..", "src", "components", "badges", "badge-celebration.tsx");
  expect(fs.existsSync(filePath)).toBe(true);
  
  const content = fs.readFileSync(filePath, "utf-8");
  expect(content).toContain("Nouveau badge débloqué");
  expect(content).toContain("animate-bounce");
});
```

**Example 3: Guided Tour Data Attributes** (`e2e/guided-tour.spec.ts`)
```typescript
test("3 — data-tour='parametres-link' présent dans sidebar", async ({ page }) => {
  await enterDemo(page);
  await expect(page.locator("[data-tour='parametres-link']")).toBeAttached();
});
```

## Vitest Unit Testing

**Configuration:** `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

**Test Directory:** `src/lib/__tests__/`

**Test File Naming:** `[module].test.ts`
- Examples: `weekly-gate.test.ts`, `saisie-parser.test.ts`, `coaching-ai-client.test.ts`

### Unit Test Structure

**Basic Pattern:**
```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../my-module";

describe("myFunction", () => {
  it("returns expected value", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  describe("edge cases", () => {
    it("handles null input", () => {
      expect(myFunction(null)).toBe(null);
    });

    it("throws on invalid input", () => {
      expect(() => myFunction("invalid")).toThrow();
    });
  });
});
```

### Unit Test Examples

**Example 1: Business Logic with Date Helpers** (`src/lib/__tests__/weekly-gate.test.ts`)
```typescript
describe("getWeeklyGateState", () => {
  // Helper functions
  function makeDate(dayOfWeek: number, weekOffset = 0): Date {
    const base = new Date("2026-03-30T10:00:00");
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    base.setDate(base.getDate() + diff + weekOffset * 7);
    return base;
  }

  function friday(weekOffset = 0) { return makeDate(5, weekOffset); }

  // Tests
  it("demo mode → gate always shown regardless of day", () => {
    const result = getWeeklyGateState({ 
      isDemo: true, 
      today: friday() 
    });
    expect(result.showGate).toBe(true);
    expect(result.context).toBe("demo");
  });

  it("Friday without submission → gate shown", () => {
    const result = getWeeklyGateState({ 
      isDemo: false,
      lastWeeklySubmissionDate: null, 
      today: friday() 
    });
    expect(result.showGate).toBe(true);
    expect(result.context).toBe("friday_required");
  });
});
```

**Example 2: Parsing with Safety** (`src/lib/__tests__/saisie-parser.test.ts`)
```typescript
describe("parseCountField — accepted (single numeric intent)", () => {
  it('"0" => 0', () => expect(parseCountField("0")).toBe(0));
  it('"un" => 1', () => expect(parseCountField("un")).toBe(1));
  it('"35" => 35', () => expect(parseCountField("35")).toBe(35));
  it('"rien" => 0', () => expect(parseCountField("rien")).toBe(0));
  it('"zéro" => 0', () => expect(parseCountField("zéro")).toBe(0));
});

describe("parseCountField — safety (must NOT confuse)", () => {
  it('"aucune" => 0 (not 1)', () => expect(parseCountField("aucune")).toBe(0));
  it('"de" => null (not 2)', () => expect(parseCountField("de")).toBe(null));
  it('"demain" => null (not 2)', () => expect(parseCountField("demain")).toBe(null));
});

describe("parseCountField — ambiguous (rejected)", () => {
  it('"1 ou 2" => null', () => expect(parseCountField("1 ou 2")).toBe(null));
  it('"peut-être 3" => null', () => expect(parseCountField("peut-être 3")).toBe(null));
});
```

**Example 3: Decision Tracing** (`src/lib/__tests__/saisie-parser.test.ts`)
```typescript
describe("parseNumericResponse — decision tracing", () => {
  it('"3" → accepted', () => {
    const r = parseNumericResponse("3");
    expect(r.decision).toBe("accepted");
    expect(r.type).toBe("number");
  });

  it('"1 ou 2" → ambiguous', () => {
    const r = parseNumericResponse("1 ou 2");
    expect(r.decision).toBe("ambiguous");
  });

  it('"oui" → rejected', () => {
    const r = parseNumericResponse("oui");
    expect(r.decision).toBe("rejected");
  });
});
```

### Unit Test Patterns

**Arrange-Act-Assert (AAA):**
```typescript
it("calculates ratio correctly", () => {
  // Arrange
  const input: RatioInput = { estimations: 10, mandats: 5 };
  
  // Act
  const ratio = computeRatio(input);
  
  // Assert
  expect(ratio).toBe(0.5);
});
```

**Testing Error Cases:**
```typescript
it("throws on invalid input", () => {
  expect(() => {
    computeRatio({ estimations: -1, mandats: 5 });
  }).toThrow("Invalid input");
});

it("handles edge case gracefully", () => {
  const result = computeRatio({ estimations: 0, mandats: 0 });
  expect(result).toBe(0);
});
```

**Testing with Multiple Scenarios:**
```typescript
describe.each([
  { input: "un", expected: 1 },
  { input: "deux", expected: 2 },
  { input: "trois", expected: 3 },
])("parseCountField with French numbers", ({ input, expected }) => {
  it(`"${input}" => ${expected}`, () => {
    expect(parseCountField(input)).toBe(expected);
  });
});
```

## Test Coverage

**Coverage Target:** Not formally enforced, but encouraged for business logic

**Coverage Areas:**
- All utility functions in `src/lib/` (parsing, ratio computation, date logic)
- Complex state transitions (weekly gate logic, coaching decisions)
- Error handling (custom error classes, edge cases)

**View Coverage:**
```bash
npx vitest --coverage        # Generate coverage report
```

## Test Data & Fixtures

**Mock Data Location:** `src/data/mock-*.ts`
- `mock-users.ts` — 12 test users (1 directeur, 2 managers, 8 agents, 1 coach)
- `mock-results.ts` — Feb 2026 + Jan 2026 results
- `mock-ratios.ts` — Default ratio thresholds per category
- `mock-finance.ts` — Financial input data
- `mock-coach.ts` — Coach assignments, actions, plans, notes
- `mock-network.ts` — Network users (7 Lyon users), institutions, results

**Demo Mode:**
- All E2E tests run against demo mode at `http://localhost:3000`
- Demo password: `DEMO2024`
- Standard demo entry: `await page.goto("/demo")` → fill password → click "Démarrer la démo"

**Using Mock Data in Tests:**
```typescript
import { mockUsers } from "@/data/mock-users";

it("loads user data", () => {
  const testUser = mockUsers.find(u => u.role === "conseiller");
  expect(testUser).toBeDefined();
});
```

## Mocking

**What to Mock:**
- External APIs (Supabase, OpenAI, Google)
- Browser APIs (localStorage, sessionStorage)
- File system operations (in unit tests only)

**What NOT to Mock:**
- Business logic (pure functions should be tested directly)
- Data structures and types (test with real shapes)
- Store/hook interactions (use actual hooks in component tests)

**Mocking Pattern (Vitest):**
```typescript
import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: "123", name: "Test" }),
}));

it("loads user on mount", async () => {
  const result = await fetchUser("123");
  expect(result.name).toBe("Test");
});
```

**Mocking localStorage:**
```typescript
beforeEach(() => {
  const store: Record<string, string> = {};
  
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => store[key] ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    store[key] = value.toString();
  });
});
```

## Testing Asynchronous Code

**Pattern with Async/Await:**
```typescript
it("fetches data", async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

**Playwright Waiting Patterns:**
```typescript
// Wait for element to appear
await expect(page.getByText("Loading...")).toBeVisible();

// Wait for specific URL
await page.waitForURL("**/dashboard**", { timeout: 15_000 });

// Wait for navigation
await page.waitForNavigation();

// Manual timeout
await page.waitForTimeout(300);
```

## Test Organization

**Directory Structure:**
```
src/
├── lib/
│   ├── __tests__/
│   │   ├── weekly-gate.test.ts
│   │   ├── saisie-parser.test.ts
│   │   ├── coaching-ai-client.test.ts
│   │   └── normalize-spoken-numbers.test.ts
│   ├── weekly-gate.ts
│   ├── saisie-parser.ts
│   └── ...
└── ...

e2e/
├── weekly-gate.spec.ts
├── badge-celebration.spec.ts
├── guided-tour.spec.ts
└── ...
```

**Colocation Rule:**
- Unit tests live in `src/lib/__tests__/` (same directory as source)
- E2E tests live in `e2e/` root (separate from source)

## Running Tests

**Individual Test File:**
```bash
npx vitest src/lib/__tests__/weekly-gate.test.ts
npx playwright test e2e/weekly-gate.spec.ts
```

**Watch Mode:**
```bash
npx vitest                    # Unit tests watch (default)
npx vitest --run              # Unit tests once
npx playwright test --watch   # E2E watch (if supported)
```

**With Debug Output:**
```bash
DEBUG=pw:api npx playwright test    # Playwright debug logs
```

## CI/CD Integration

**Test Running in Pipeline:**
- Both Playwright and Vitest should pass before merge
- Artifacts saved to `test-results/` and `.playwright-mcp/`
- No external environment required (all mocked data)

**Screenshot Artifacts:**
- `.playwright-mcp/` contains:
  - `console-*.log` files (browser console output)
  - `page-*.yml` files (page snapshots)
- Useful for debugging failed E2E tests

---

*Testing analysis: 2026-05-18*
