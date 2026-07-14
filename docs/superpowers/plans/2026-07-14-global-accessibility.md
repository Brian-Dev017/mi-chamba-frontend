# Global Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one session-scoped accessibility configuration, reachable from both profiles, for text size, high contrast, dyslexia-friendly typography, and reset.

**Architecture:** A React context owns in-memory preferences and exposes update/reset actions. `ResponsiveText` consumes the context so typography changes propagate through the app, while shared screens and controls consume a high-contrast palette. One reusable modal is opened by independent buttons in the client and worker profiles.

**Tech Stack:** React 19, React Native 0.81, Expo 54, TypeScript.

---

## File structure

- Create `src/accessibility/AccessibilityContext.tsx`: preference types, defaults, provider, hook, text-scale and contrast helpers.
- Create `src/accessibility/AccessibilitySettingsModal.tsx`: reusable accessible settings panel and reset confirmation.
- Modify `src/components/ResponsiveText.tsx`: combine responsive sizing with accessibility sizing and dyslexia typography.
- Modify `src/components/ui.tsx`: make shared screen surfaces and shell controls respond to contrast mode.
- Modify `src/prototype/MiChambaPrototype.tsx`: mount the provider around the app.
- Modify `src/screens/client/ClientScreens.tsx`: add client profile button/modal and reset settings on logout.
- Modify `src/screens/worker/WorkerScreens.tsx`: activate worker profile button/modal, use responsive text, and reset every worker logout path.
- Modify `src/screens/auth/AuthScreens.tsx`: use `ResponsiveText` so accessibility typography remains active on authentication screens during a session.

### Task 1: Global accessibility state

**Files:**
- Create: `src/accessibility/AccessibilityContext.tsx`
- Modify: `src/prototype/MiChambaPrototype.tsx`

- [ ] **Step 1: Define typed session preferences and defaults**

Create `AccessibilityContext.tsx` with `TextSize = "normal" | "large" | "extraLarge"`, preferences for `highContrast` and `dyslexiaFriendly`, and defaults `{ textSize: "normal", highContrast: false, dyslexiaFriendly: false }`.

- [ ] **Step 2: Expose update and reset actions through a provider**

Implement `AccessibilityProvider`, `useAccessibility`, `setTextSize`, `setHighContrast`, `setDyslexiaFriendly`, and `resetAccessibility`. Keep state only in `useState`; do not use device storage.

- [ ] **Step 3: Mount the provider once at the app root**

Wrap `MiChambaPrototype` content with `<AccessibilityProvider>` so every registered screen consumes the same session state.

- [ ] **Step 4: Verify compilation**

Run: `npm run typecheck`  
Expected: TypeScript completes without errors.

- [ ] **Step 5: Commit state foundation**

```bash
git add src/accessibility/AccessibilityContext.tsx src/prototype/MiChambaPrototype.tsx
git commit -m "feat: add global accessibility preferences"
```

### Task 2: Global typography behavior

**Files:**
- Modify: `src/components/ResponsiveText.tsx`
- Modify: `src/screens/auth/AuthScreens.tsx`
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Combine screen and user text scales**

Read `textSizeScale` from `useAccessibility()` and calculate the rendered size as `baseFontSize * responsiveScale * textSizeScale`, preserving React Native system font scaling.

- [ ] **Step 2: Apply dyslexia-friendly typography**

When enabled, add a moderate `letterSpacing`, increase explicit line height, synthesize a readable line height when only `fontSize` exists, and use the platform sans-serif family. Do not change content or force uppercase.

- [ ] **Step 3: Reinforce text contrast**

When high contrast is active, map muted/dark textual colors to strong black while preserving white text used on filled actions.

- [ ] **Step 4: Route remaining screen text through the shared component**

Replace React Native `Text` imports in authentication and worker screens with `ResponsiveText as Text`. Keep animated text wrappers unchanged if React Native animation requires a native component.

- [ ] **Step 5: Verify compilation and typography call sites**

Run: `npm run typecheck`  
Expected: TypeScript completes without errors.

Run: `rg -n "\bText\b" src/screens/auth/AuthScreens.tsx src/screens/worker/WorkerScreens.tsx`  
Expected: screen text resolves through the responsive import and no duplicate native `Text` import remains.

- [ ] **Step 6: Commit typography integration**

```bash
git add src/components/ResponsiveText.tsx src/screens/auth/AuthScreens.tsx src/screens/worker/WorkerScreens.tsx
git commit -m "feat: apply accessible typography globally"
```

### Task 3: Shared settings panel

**Files:**
- Create: `src/accessibility/AccessibilitySettingsModal.tsx`

- [ ] **Step 1: Build a scrollable accessible modal**

Create a transparent React Native `Modal` with a dismissible scrim, dialog semantics, title, concise description, preview sample, and a close action. Use `ScrollView` so large text never clips the controls.

- [ ] **Step 2: Add the three-level text selector**

Render `Normal`, `Grande`, and `Muy grande` as pressable options with `accessibilityRole="radio"` and selected state. Apply changes immediately through `setTextSize`.

- [ ] **Step 3: Add contrast and dyslexia switches**

Render labelled `Switch` controls for `highContrast` and `dyslexiaFriendly`. Give the complete row a clear accessibility label and description.

- [ ] **Step 4: Add reset with confirmation**

Add “Restablecer configuración”. On press, show the existing `ConfirmationDialog`; confirmation calls `resetAccessibility`, closes only the confirmation, and leaves the settings panel open so the default preview is visible.

- [ ] **Step 5: Verify compilation**

Run: `npm run typecheck`  
Expected: TypeScript completes without errors.

- [ ] **Step 6: Commit the shared panel**

```bash
git add src/accessibility/AccessibilitySettingsModal.tsx
git commit -m "feat: add accessibility settings panel"
```

### Task 4: Profile entry points and session reset

**Files:**
- Modify: `src/screens/client/ClientScreens.tsx`
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Add the client profile entry point**

Add local modal visibility state to the client home/profile flow. Render a labelled “Accesibilidad” button inside `ClientProfile`, with accessibility icon and `accessibilityHint="Configura el tamaño del texto, el contraste y la lectura"`.

- [ ] **Step 2: Activate the worker profile entry point**

Attach `onPress` to the existing worker accessibility control, add a visible label, and open the same `AccessibilitySettingsModal` component used by the client.

- [ ] **Step 3: Reset preferences on client logout**

Call `resetAccessibility()` in the confirmed client logout function before clearing authentication and navigating to `login`.

- [ ] **Step 4: Reset preferences on every worker logout**

Call `resetAccessibility()` in `WorkerHomeScreen`, `MyJobsScreen`, and `WorkerProfileScreen` confirmed logout branches. Ensure those branches also clear both `authenticatedWorker` and `authenticatedRole` before navigating.

- [ ] **Step 5: Verify profile wiring**

Run: `rg -n "AccessibilitySettingsModal|resetAccessibility|Accesibilidad" src/screens/client/ClientScreens.tsx src/screens/worker/WorkerScreens.tsx`  
Expected: two profile entry points, shared modal usage, and all confirmed logout paths are visible.

- [ ] **Step 6: Commit profile wiring**

```bash
git add src/screens/client/ClientScreens.tsx src/screens/worker/WorkerScreens.tsx
git commit -m "feat: expose accessibility from both profiles"
```

### Task 5: High-contrast surfaces and final verification

**Files:**
- Modify: `src/components/ui.tsx`
- Modify: `src/screens/client/ClientScreens.tsx`
- Modify: `src/screens/worker/WorkerScreens.tsx`
- Modify: `src/screens/auth/AuthScreens.tsx`
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] **Step 1: Make common surfaces contrast-aware**

Use `useAccessibility()` in `ScreenFrame` and `WorkerShell` to apply white primary surfaces, black primary text/borders, and stronger blue controls in high-contrast mode. Preserve the standard brand palette when disabled.

- [ ] **Step 2: Cover role-specific main layouts**

Add contrast-aware overrides to client and worker root backgrounds, cards, profile details, bottom navigation, input borders, and modal surfaces. Preserve white text on blue/dark filled buttons.

- [ ] **Step 3: Cover authentication and onboarding layouts**

Apply contrast overrides to their main screen surfaces, form cards, text inputs, selectors, and action states using the shared preference. Do not replace existing validation messages or keyboard behavior.

- [ ] **Step 4: Run static verification**

Run: `npm run typecheck`  
Expected: TypeScript completes without errors.

Run: `git diff --check`  
Expected: no whitespace errors.

- [ ] **Step 5: Perform manual behavior verification**

Check on a narrow phone viewport and a larger viewport:

1. Both profile buttons open the same panel state.
2. Each text size updates the visible app without clipping the modal.
3. Contrast changes text, surfaces, borders, and buttons.
4. Dyslexia mode changes letter spacing and line height.
5. Combined settings remain usable.
6. Reset restores all defaults.
7. Client and worker logout restore defaults.
8. Registration keyboard/footer behavior remains unchanged.

- [ ] **Step 6: Commit the contrast and QA pass**

```bash
git add src/components/ui.tsx src/screens/client/ClientScreens.tsx src/screens/worker/WorkerScreens.tsx src/screens/auth/AuthScreens.tsx src/screens/onboarding/OnboardingScreens.tsx
git commit -m "feat: complete global accessibility experience"
```

