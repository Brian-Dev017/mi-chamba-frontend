# Client Registration Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the three-step client registration wizard, persist registered clients in memory, and return to login without changing worker behavior or styling.

**Architecture:** Extend the existing root-owned `RegistrationDraft` and screen-state navigation instead of introducing a second state manager. Isolate client record construction in a small asynchronous service boundary, while the root component owns the in-memory collection and the final client screen owns loading/error feedback.

**Tech Stack:** React Native 0.81, React 19, Expo SDK 54, TypeScript, Expo Location, Ionicons.

---

### Task 1: Extend the client domain contract

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/prototype/MiChambaPrototype.tsx`

- [ ] Add `clientPropertyType` to `ScreenKey`.
- [ ] Define `ClientPropertyType` and `RegisteredClient`.
- [ ] Add `clientPropertyType` and `clientReferenceDetails` to `RegistrationDraft`.
- [ ] Add `registeredClients` and asynchronous `registerClient` to `ScreenRenderProps`.
- [ ] Initialize the new draft fields in the root component.
- [ ] Run `npm run typecheck`; expect temporary missing-property errors only until subsequent tasks are complete.

### Task 2: Add the in-memory client registration boundary

**Files:**
- Create: `src/services/api/clientRegistration.ts`
- Modify: `src/prototype/MiChambaPrototype.tsx`

- [ ] Implement `buildRegisteredClient(draft)` with full validation of names, phone, password, location, and property type.
- [ ] Return a normalized `RegisteredClient` from an asynchronous `registerClientInMemory` function.
- [ ] Add root-owned `registeredClients` state.
- [ ] Implement `registerClient` to upsert by normalized phone and expose it to screen props.
- [ ] Keep worker registration and worker props unchanged.

### Task 3: Complete client personal information formatting

**Files:**
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] Display the stored nine phone digits as `999 999 999` while continuing to store digits only.
- [ ] Preserve the current name, password, password-confirmation validation, keyboard avoidance, and exit confirmation.
- [ ] Ensure the client-specific changes do not modify worker screen styles or validation.

### Task 4: Complete location capture and navigation

**Files:**
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] Build a readable address from `Location.reverseGeocodeAsync` results.
- [ ] Fall back to formatted coordinates when reverse geocoding is empty or fails after coordinates were acquired.
- [ ] Navigate `Siguiente` to `clientPropertyType`.
- [ ] Make `Regresar` navigate directly to personal information without a discard confirmation.
- [ ] Preserve the X confirmation and all draft values on non-destructive navigation.

### Task 5: Build the property-type final step

**Files:**
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`
- Modify: `src/prototype/screenRegistry.tsx`

- [ ] Add `ClientPropertyTypeScreen` with the shared dark header, title underline, explanatory copy, and X confirmation.
- [ ] Render a two-column single-select grid for Casa, Departamento, Oficina, Local Comercial, and Otros.
- [ ] Add an optional reference-details input.
- [ ] Add step 3 progress, direct back navigation, disabled/loading final button, and inline registration error feedback.
- [ ] On success, reset the draft and navigate to login.
- [ ] Register the new screen after `clientLocation`.

### Task 6: Verify behavior and regression safety

**Files:**
- Verify: `src/screens/onboarding/OnboardingScreens.tsx`
- Verify: `src/screens/worker/WorkerScreens.tsx`

- [ ] Run `npm run typecheck`; expect exit code 0.
- [ ] Run `npx expo export --platform web --clear`; expect a successful web bundle.
- [ ] Inspect `git diff -- src/screens/worker/WorkerScreens.tsx`; expect no changes.
- [ ] Inspect the final diff to confirm the pre-existing identity keyboard edits remain present.
- [ ] Verify wizard paths, disabled states, back-state preservation, X discard, location fallbacks, single selection, final in-memory upsert, and return to login.

