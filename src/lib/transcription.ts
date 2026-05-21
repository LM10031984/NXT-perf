/**
 * src/lib/transcription.ts
 * Typed wrapper around Groq Whisper API for voice data entry.
 *
 * Wave 0 (03-00): Types and function signature locked.
 * Wave 1 (03-01): Implementation of retry logic, timeout, and error handling.
 *
 * Per Phase 3 D2: provides a Result<T> pattern for API integration.
 */

/**
 * Transcription result — discriminated union for type-safe error handling.
 *
 * Success: `{ ok: true, text: string, latencyMs: number, raw: unknown }`
 * Failure: `{ ok: false, error: "rate-limited" | "timeout" | "audio-invalid" | "unknown", details?: string }`
 *
 * The `raw` field contains the full parsed JSON response from /api/vocal,
 * allowing callers to extract additional fields (extracted, section, coachTip).
 */
export type TranscriptionResult =
  | { ok: true; text: string; latencyMs: number; raw: unknown }
  | {
      ok: false;
      error: "rate-limited" | "timeout" | "audio-invalid" | "unknown";
      details?: string;
    };

/**
 * Transcribe audio via Groq Whisper API with retry and timeout handling.
 *
 * @param audio - Blob or File containing audio data
 * @param section - VocalSection name (required by /api/vocal endpoint)
 * @param opts - Optional { timeoutMs?: number } to override default 10s timeout
 * @returns TranscriptionResult — typed success or failure
 *
 * Retry logic (Phase 03-01, Wave 1):
 * - 3 retries on HTTP 429 (rate limited) with exponential backoff (1s, 2s, 4s)
 * - Timeout: 10s per attempt (configurable)
 * - No exceptions thrown; all errors wrapped in Result type
 * - AbortController enforces timeout boundary
 *
 * Error mapping:
 * - HTTP 429 → { ok: false, error: "rate-limited" }
 * - Abort/timeout → { ok: false, error: "timeout" }
 * - HTTP 400 with empty transcript → { ok: false, error: "audio-invalid" }
 * - Network or HTTP 5xx → { ok: false, error: "unknown" }
 * - HTTP 200 → { ok: true, text, latencyMs, raw }
 */
export async function transcribeAudio(
  audio: Blob | File,
  section: string,
  opts?: { timeoutMs?: number }
): Promise<TranscriptionResult> {
  const timeoutMs = opts?.timeoutMs ?? 10_000;
  const maxRetries = 3;
  const backoffDelays = [1000, 2000, 4000]; // ms per retry

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      const start = Date.now();

      try {
        const formData = new FormData();
        formData.append("audio", audio);
        formData.append("section", section);

        const response = await fetch("/api/vocal", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);
        const latencyMs = Date.now() - start;

        // Rate limit: retry
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = backoffDelays[attempt];
            await new Promise((r) => setTimeout(r, delay));
            continue; // Next attempt
          }
          return {
            ok: false,
            error: "rate-limited",
            details: "Too many requests after 3 retries",
          };
        }

        // Bad request (empty audio, invalid section, etc.)
        if (response.status === 400) {
          const data = await response.json();
          return {
            ok: false,
            error: "audio-invalid",
            details: data.error || "Invalid audio or section",
          };
        }

        // Server error
        if (response.status >= 500) {
          if (attempt < maxRetries - 1) {
            const delay = backoffDelays[attempt];
            await new Promise((r) => setTimeout(r, delay));
            continue; // Next attempt
          }
          return {
            ok: false,
            error: "unknown",
            details: `Server error: ${response.status}`,
          };
        }

        // Unexpected error
        if (!response.ok) {
          return {
            ok: false,
            error: "unknown",
            details: `HTTP ${response.status}`,
          };
        }

        // Success
        const data = await response.json();
        return {
          ok: true,
          text: data.transcript || "",
          latencyMs,
          raw: data,
        };
      } catch (err) {
        clearTimeout(timeoutHandle);

        // Abort = timeout
        if (err instanceof DOMException && err.name === "AbortError") {
          if (attempt < maxRetries - 1) {
            const delay = backoffDelays[attempt];
            await new Promise((r) => setTimeout(r, delay));
            continue; // Next attempt
          }
          return {
            ok: false,
            error: "timeout",
            details: `Timeout after ${timeoutMs}ms`,
          };
        }

        // Other errors (network, etc.)
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries - 1) {
          const delay = backoffDelays[attempt];
          await new Promise((r) => setTimeout(r, delay));
          continue; // Next attempt
        }

        return {
          ok: false,
          error: "unknown",
          details: lastError.message,
        };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // All retries exhausted
  return {
    ok: false,
    error: "unknown",
    details: lastError?.message || "All retry attempts failed",
  };
}
