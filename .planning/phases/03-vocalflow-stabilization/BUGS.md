# VocalFlow Bug Inventory — Phase 3, Wave 1

**Date:** 2026-05-21  
**Review mode:** Static code analysis (no microphone available in headless environment)  
**Context:** Plan 03-01 mandatory bug inventory before implementation

---

## BLOCKER Bugs

### BUG-001 — Error handling resets entire flow

**Severity:** BLOCKER  
**File:** `src/components/vocal/VocalFlow.tsx`, line 154  
**Pattern:**
```typescript
catch (err) {
  console.error("[vocal] Processing error:", err);
  flow.startFlow();  // ← BLOCKER: resets to section 0
}
```

**Why it's a bug:** When `processAudio()` fails on any section (e.g., section 3 of 4), `flow.startFlow()` resets `currentSectionIndex` to 0. User loses progress and must restart from section 1. Worse: user sees NO error message — just silently restarts (data loss UX).

**Repro hypothesis:** 
1. Complete sections 1–3 successfully
2. Speak garbage audio for section 4 → transcription empty → API 400
3. Error caught, `startFlow()` called → back to intro
4. User thinks they need to redo everything

**Proposed fix:** 
- Add `setError(message)` state to VocalFlowState
- Replace `flow.startFlow()` with `flow.setError(err.message || "Erreur API vocal")` in catch block
- Render error banner in RecordingScreen with "Retry" button that calls `flow.setProcessing()` + `flow.processAudio(blob)` again

---

### BUG-002 — MediaStream tracks not stopped on abort/modal close

**Severity:** BLOCKER  
**File:** `src/hooks/use-vocal-recorder.ts`, line 56 (stopRecording)  
**Pattern:** Tracks are stopped in `mediaRecorder.onstop`, but only if `stop()` is called. If modal closes via Escape or click-outside during recording, `stopRecording()` is never awaited.

**Why it's a bug:** Microphone stays active ("recording" indicator on OS, mic never released to system). User must kill the browser tab to stop the mic. Critical security/UX issue.

**Repro hypothesis:**
1. Click "Commencer le bilan" → go to recording
2. Press Escape → modal closes immediately (see VocalFlow.tsx line 132)
3. But `isRecording` is true, `mediaRecorder` is still active
4. Modal gone, but recorder still running → mic never stops

**Proposed fix:**
- In VocalFlow.tsx `onClose` handler (or new effect), check if `recorder.isRecording === true`
- If so, call `await recorder.stopRecording()` before closing
- Also add cleanup in useVocalRecorder: even if `stopRecording()` not explicitly called, add an effect that stops tracks on unmount

---

### BUG-003 — No timeout or abort on API fetch

**Severity:** BLOCKER  
**File:** `src/hooks/use-vocal-flow.ts`, lines 169–172  
**Pattern:**
```typescript
const res = await fetch("/api/vocal", { method: "POST", body: formData });
// No timeout, no AbortController
```

**Why it's a bug:** If Groq API hangs or is slow (>10s), user sees "Analyse des données" forever. No way to cancel or retry. ProcessingScreen progress bar gets stuck at ~95% (by design, it never reaches 100% — see line 453).

**Repro hypothesis:**
1. Record audio
2. Groq Whisper times out (network issue, service down, quota)
3. User stuck on ProcessingScreen indefinitely
4. No "Cancel" button, no "Retry" option
5. Must force-close browser

**Proposed fix:** Implemented via `src/lib/transcription.ts` (Task 2). The wrapper will:
- Wrap in AbortController with 10s timeout per attempt
- Max 3 retries on 429 (rate limit)
- Return `{ ok: false, error: "timeout" | "rate-limited" | ... }` instead of throwing
- Hook's catch block can now show user-facing message

---

## MAJOR Bugs

### BUG-004 — No error message shown to user on API failure

**Severity:** MAJOR  
**File:** `src/components/vocal/VocalFlow.tsx`, lines 149–155  
**Pattern:** Error logged to console but no UI feedback given.

**Why it's a bug:** User is in ProcessingScreen → API fails → handler catches → `flow.startFlow()` called → user sees "Intro" screen. User has NO IDEA what happened (network error? rate limit? timeout?). Cannot make an informed decision to retry.

**Repro hypothesis:**
1. Network is flaky
2. Groq 429 rate limit hit
3. User sees spinning loader → then suddenly back at intro
4. "Why did it restart?" ← user doesn't know

**Proposed fix:**
- Add `errorMessage: string | null` to `VocalFlowState`
- Expose `flow.setError(msg)` action
- In catch block: call `flow.setError(msg)` instead of `flow.startFlow()`
- Render error banner in RecordingScreen with retry button + dismiss button
- On retry: call `processAudio(blob)` again with same audio

---

### BUG-005 — Escape key closes modal mid-recording without stopping MediaRecorder

**Severity:** MAJOR  
**File:** `src/components/vocal/VocalFlow.tsx`, lines 131–135  
**Pattern:**
```typescript
useEffect(() => {
  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
  document.addEventListener("keydown", handleKey);
  return () => document.removeEventListener("keydown", handleKey);
}, [onClose]);
```

**Why it's a bug:** `onClose()` called directly without checking if recording is active. No await on `recorder.stopRecording()`. MediaRecorder state left in limbo: might be "recording" or "paused" or "inactive". Tracks never `getTracks().forEach(t => t.stop())`.

**Repro hypothesis:**
1. Start recording (isRecording = true)
2. Press Escape immediately
3. onClose fires → modal closes
4. Mic still active (see BUG-002 details)

**Proposed fix:** 
- In onClose handler: if `recorder.isRecording`, call `await recorder.stopRecording()` first
- Or add a "Are you sure you want to close while recording?" confirmation
- Prefer first option for UX (silent, graceful)

---

### BUG-006 — Inline fetch to /api/vocal in hook instead of using transcription.ts wrapper

**Severity:** MAJOR  
**File:** `src/hooks/use-vocal-flow.ts`, lines 161–206 (processAudio)  
**Pattern:** Direct fetch + no retry + no timeout handling

**Why it's a bug:** 
1. Not using the typed `transcribeAudio()` wrapper (which will be implemented in 03-01)
2. No retry on 429 → single transient error = flow restart
3. No timeout → user can hang forever
4. Phase 6 training vocal will need the same infra — code duplication

**Repro hypothesis:**
1. High-traffic moment → Groq rate limit (429)
2. Single request fails → user must redo entire flow
3. Meanwhile, Phase 6 will copy-paste this code → 2 bugs to maintain

**Proposed fix:** 
- Import `transcribeAudio` from `@/lib/transcription`
- Replace inline fetch with: `const result = await transcribeAudio(audioBlob, currentSection, { timeoutMs: 10_000 })`
- Check `if (!result.ok)` → call `flow.setError(mapResultErrorToUI(result.error))`
- Clean up try/catch (no longer needed, errors are typed)

---

### BUG-007 — ProcessingScreen progress bar never reaches 100%

**Severity:** MAJOR  
**File:** `src/components/vocal/VocalFlow.tsx`, lines 433–496  
**Pattern:** Line 453: `if (p >= 95) { clearInterval(t3); return 95; }`

**Why it's a bug:** Progress bar animates to 95% and stops. Psychological issue: user thinks something is still loading even if API returned. If API is slow (realistic), progress bar finishes way before API does → user sees frozen 95% for 5+ seconds.

**Repro hypothesis:**
1. Slow network (3G, poor connection)
2. API takes 8 seconds to respond
3. Progress bar reaches 95% at 3s mark
4. User stares at frozen bar for 5 seconds
5. Feels broken, not like "waiting for real work"

**Proposed fix:**
- Remove the artificial progress cap at 95%
- Let progress reach 100% once API call is confirmed done
- Better: use a callback from `processAudio()` to notify when real work is done, then advance bar to 100%
- Or simpler: just remove the phase 2 logic and keep phase 1 at 50%, then jump to 100% when result arrives

---

### BUG-008 — No input validation on audio Blob

**Severity:** MAJOR  
**File:** `src/hooks/use-vocal-flow.ts`, lines 162–172 (processAudio)  
**Pattern:** Blob is sent to API with zero validation.

**Why it's a bug:**
- Blob could be 0 bytes (recording error, no audio)
- Blob could be wrong type (image, text, etc.)
- API will fail downstream → user sees generic error
- No validation = poor error message ("Error" vs. "Recording was empty")

**Repro hypothesis:**
1. Recording started but mic not detected
2. User speaks 2 seconds
3. 0-byte Blob recorded (mediaRecorder silently captured nothing)
4. API call made with empty blob
5. Groq fails with "Transcription vide"
6. User sees generic "Erreur API vocal" (not helpful)

**Proposed fix:**
- In handleRecord (before calling processAudio), check: `if (blob.size === 0) { flow.setError("Recording was empty — try again"); return; }`
- Also check minimum duration (e.g., 1 second = ~20KB for webm opus)
- If too short: `flow.setError("Recording too short — please speak for at least 1 second")`

---

## MINOR Bugs

### BUG-009 — RecordingScreen timer can desync on parent re-render

**Severity:** MINOR  
**File:** `src/components/vocal/VocalFlow.tsx`, lines 367–379  
**Pattern:** Timer resets `setSeconds(0)` if isRecording dependency changes.

**Why it's a bug:** If parent component re-renders and VocalFlow props change, RecordingScreen might unmount/remount → timer resets. Not critical (user can ignore), but janky UX.

**Repro hypothesis:**
1. Recording for 5 seconds
2. Parent triggers re-render
3. RecordingScreen effect re-runs: `setSeconds(0)` called
4. Timer jumps back to 0:00

**Proposed fix:**
- Use useRef for timer state to persist across renders
- Or move timer state to VocalFlowState (central, single source of truth)

---

### BUG-010 — Missing accessibility features (aria-live)

**Severity:** MINOR  
**File:** `src/components/vocal/VocalFlow.tsx`  
**Pattern:** ProcessingScreen, ReviewScreen, DoneScreen lack aria-live regions for screen readers.

**Why it's a bug:** Screen reader users won't hear when processing finishes or data is displayed.

**Proposed fix:**
- Add `aria-live="polite" aria-atomic="true"` to ProcessingScreen progress area
- Add to ReviewScreen data display
- Announce state changes: "Extracting data... done. Please review results."

---

## TRIVIAL (Won't Fix This Phase)

- **Dead code**: `SECTION_ARRAY_FIELDS` (line 116–121) is defined but never used
- **Console logging**: Multiple `console.error` calls should use centralized logger (deferred to Phase 4 logging infra)
- **Hardcoded timeouts**: ProcessingScreen phases (1.5s, etc.) are magic numbers (deferred to constants.ts)

---

## Summary by Severity

| Severity | Count | Impact |
|----------|-------|--------|
| BLOCKER  | 3     | Data loss, mic leak, infinite hang |
| MAJOR    | 5     | Silent errors, no retry, UX confusion |
| MINOR    | 2     | Janky animations, accessibility |
| TRIVIAL  | 3     | Code smell, not urgent |

**Immediate action (Phase 03-01):** Fix all BLOCKER + MAJOR (8 bugs). Proceed with transcription.ts implementation + error state management.
