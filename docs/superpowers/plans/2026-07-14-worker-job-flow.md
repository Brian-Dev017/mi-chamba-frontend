# Worker Job Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make worker identity, availability, requests, details, messaging, acceptance, rejection, scheduled jobs, and payment history operate from synchronized in-memory state.

**Architecture:** Extend `WorkerJob` so every card owns its detail, reference photos, messages, and status. Keep the collection, selected job id, and worker availability at the prototype root and pass them through `ScreenRenderProps`; each worker screen derives its view from that single state.

**Tech Stack:** React 19, React Native 0.81, Expo 54, TypeScript.

---

## File structure

- Modify `src/types/domain.ts`: add identity photos, worker messages, complete job data, selected-job and availability props.
- Modify `src/data/mockData.ts`: replace duplicated/static detail data with eight coherent in-memory jobs.
- Modify `src/prototype/MiChambaPrototype.tsx`: own selected job and availability state, validate/store identity photos.
- Modify `src/screens/onboarding/OnboardingScreens.tsx`: require both identity photos before advancing.
- Modify `src/screens/worker/WorkerScreens.tsx`: connect all worker operations and improve payment history.

### Task 1: Complete worker domain and initial data

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Extend the worker account and job types**

Add `frontIdentityPhotoUri` and `backIdentityPhotoUri` to `RegisteredWorker`. Add `WorkerMessage` with `id`, `body`, `sentAt`, and `sender: "worker" | "client"`. Extend `WorkerJob` with `detail: ServiceRequestDetail`, `referencePhotos: string[]`, and `messages: WorkerMessage[]`.

- [ ] **Step 2: Add shared session props**

Add `selectedWorkerJobId`, its setter, `isWorkerAvailable`, and its setter to `ScreenRenderProps`.

- [ ] **Step 3: Build coherent initial jobs**

Replace the three repeated request summaries and standalone `requestDetail`/`workerJobs` data with eight `workerRequests`: six different `NUEVO` services, one `AGENDADO`, and one `COMPLETADO`. Ensure every summary title, category, location, price, and time agrees with its detail.

- [ ] **Step 4: Verify the domain compiles**

Run: `npm run typecheck`  
Expected: failures only at existing construction sites that still need the newly required fields.

- [ ] **Step 5: Commit the model and data**

```bash
git add src/types/domain.ts src/data/mockData.ts
git commit -m "feat: model complete worker jobs"
```

### Task 2: Root state and identity completion

**Files:**
- Modify: `src/prototype/MiChambaPrototype.tsx`
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] **Step 1: Create global worker operation state**

Initialize `selectedWorkerJobId` as `null` and `isWorkerAvailable` as `true` in `MiChambaPrototypeContent`, then include both values and setters in `screenProps`.

- [ ] **Step 2: Validate identity photos when registering**

Make `registerWorker` throw a descriptive error when either `frontDniPhotoUri` or `backDniPhotoUri` is absent. Store the two URIs in the new `RegisteredWorker` fields.

- [ ] **Step 3: Lock the identity step until complete**

Change `IdentityScreen.canContinue` to require document type, a valid document number, front photo, and back photo. Keep the photo upload controls available while the button is disabled.

- [ ] **Step 4: Verify registration behavior statically**

Run: `rg -n "canContinue|frontDniPhotoUri|backDniPhotoUri" src/screens/onboarding/OnboardingScreens.tsx src/prototype/MiChambaPrototype.tsx`  
Expected: UI and registration service both validate the two photos.

- [ ] **Step 5: Commit identity and root state**

```bash
git add src/prototype/MiChambaPrototype.tsx src/screens/onboarding/OnboardingScreens.tsx
git commit -m "feat: require complete worker identity"
```

### Task 3: Functional request cards and details

**Files:**
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Derive request cards from state**

Filter `workerRequests` to `status === "NUEVO"` before applying category filters. When a card opens, set `selectedWorkerJobId` to its id and navigate to `requestDetail`.

- [ ] **Step 2: Resolve the selected job safely**

In `RequestDetailScreen`, find the selected job from `workerRequests`. If absent, show an explanatory empty state and a button back to Solicitudes.

- [ ] **Step 3: Render job-owned details**

Replace the static `requestDetail` and global reference-photo constants with `selectedJob.detail` and `selectedJob.referencePhotos`. Show the actual job status.

- [ ] **Step 4: Connect detail rejection**

Make the detail Reject button open a confirmation with the same title, message, labels, and state update as rejection from the request list. Confirmation removes the selected job and navigates to `workerHome`.

- [ ] **Step 5: Commit functional detail selection**

```bash
git add src/screens/worker/WorkerScreens.tsx
git commit -m "feat: connect worker cards to their details"
```

### Task 4: Messaging, availability, and acceptance

**Files:**
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Make availability global**

Replace `WorkerProfileScreen` local availability state with `isWorkerAvailable` and `setIsWorkerAvailable` from props. Keep the existing visual status and switch.

- [ ] **Step 2: Render complete message history**

Inside the message sheet, render every `selectedJob.messages` entry in chronological order above the input, with an empty-history message when needed.

- [ ] **Step 3: Persist messages in memory**

Disable Send when the trimmed draft is empty. On send, append a `WorkerMessage` to only the selected job through `setWorkerRequests`, clear the input, and keep the modal open.

- [ ] **Step 4: Enforce availability during acceptance**

Disable Accept when the worker is inactive or the job is not `NUEVO`; show a visible explanation for inactive state. Recheck those conditions inside the press handler.

- [ ] **Step 5: Move accepted work by status**

Update the selected job to `AGENDADO` instead of deleting it, then navigate to `workConfirmation`. Change `WorkConfirmationScreen` to route to `myJobs` after its success delay.

- [ ] **Step 6: Commit session interactions**

```bash
git add src/screens/worker/WorkerScreens.tsx
git commit -m "feat: add worker messaging and availability rules"
```

### Task 5: Stateful My Jobs and payment history

**Files:**
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Derive My Jobs from global state**

Remove the static `visibleJobs` array. Filter `workerRequests` to `AGENDADO` and `COMPLETADO`, preserving existing status styling.

- [ ] **Step 2: Open scheduled and completed details**

Wire “Ver detalles” to set the job id and navigate to `requestDetail`. In the detail screen, hide reject/accept actions for non-new work and make the back action return to `myJobs`.

- [ ] **Step 3: Add empty states**

Show clear empty-state cards when Solicitudes has no new work or “Mis trabajos” has no scheduled/completed work.

- [ ] **Step 4: Improve the payment-history sheet**

Add a close button, summary card with total and payment count, scrollable transactions, `Pagado` labels, accessible controls, and high-contrast surface overrides. Keep `workerPaymentHistory` in memory.

- [ ] **Step 5: Run full verification**

Run: `npm run typecheck`  
Expected: TypeScript completes without errors.

Run: `npx expo export --platform web --output-dir .superpowers/worker-flow-export`  
Expected: Expo exports the web bundle without errors.

Run: `git diff --check`  
Expected: no whitespace errors.

- [ ] **Step 6: Commit the completed worker flow**

```bash
git add src/screens/worker/WorkerScreens.tsx
git commit -m "feat: complete worker jobs and payment history"
```

