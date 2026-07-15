# Shared Client-Worker Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect client publications and worker requests through shared in-memory state, including required photo, category, price, payment method, paginated requests, inactive-worker feedback, and two-way messaging initiated by the worker.

**Architecture:** Keep `workerRequests` in `MiChambaPrototypeContent` as the single source of truth. Client and worker screens will read and update the same `WorkerJob` objects, while each job owns its message history. No backend, persistent storage, or new global provider will be introduced.

**Tech Stack:** React 19, React Native 0.81, Expo 54, TypeScript 5.9, `expo-image-picker`.

---

### Task 1: Extend the shared job model and fixtures

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/data/mockData.ts`

- [ ] **Step 1: Add payment and client ownership types**

Add a payment union and make every job identify its client and payment method:

```ts
export type PaymentMethod = "Yape" | "Plin" | "Efectivo";

export type WorkerJob = {
  id: string;
  clientId: string;
  title: string;
  category: string;
  location: string;
  price: string;
  paymentMethod: PaymentMethod;
  time: string;
  status: "NUEVO" | "AGENDADO" | "COMPLETADO";
  detail: ServiceRequestDetail;
  referencePhotos: string[];
  messages: WorkerMessage[];
};
```

- [ ] **Step 2: Run TypeScript to expose every fixture that needs migration**

Run: `npm run typecheck`

Expected: FAIL because existing `WorkerJob` fixtures are missing `clientId` and `paymentMethod`.

- [ ] **Step 3: Migrate all in-memory jobs**

Give each existing job a stable demo owner and the payment method already implied by its detail. Example:

```ts
{
  id: "request-001",
  clientId: "demo-client-001",
  paymentMethod: "Plin",
  // existing fields
}
```

Use explicit `Yape`, `Plin`, or `Efectivo` values for all eight fixtures.

- [ ] **Step 4: Verify the model migration**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the shared model**

```bash
git add src/types/domain.ts src/data/mockData.ts
git commit -m "feat: extend shared job data"
```

### Task 2: Create real client publications in shared memory

**Files:**
- Modify: `src/screens/client/ClientScreens.tsx`

- [ ] **Step 1: Replace the isolated publication state with shared jobs**

Read `workerRequests` and `setWorkerRequests` from `ScreenRenderProps`. Derive the authenticated client's publications:

```ts
const clientJobs = workerRequests.filter(
  (job) => job.clientId === authenticatedClient?.id
);
```

Remove the hard-coded `activeNeed` source of truth. Render an accessible empty state when `clientJobs` is empty and render all owned publications in array order when they exist.

- [ ] **Step 2: Add controlled publication fields**

Create state for the required inputs:

```ts
const [needDraft, setNeedDraft] = useState("");
const [categoryDraft, setCategoryDraft] = useState<RegisteredWorker["professionalTrade"] | null>(null);
const [photoDraftUri, setPhotoDraftUri] = useState<string | null>(null);
const [priceDraft, setPriceDraft] = useState("");
const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethod | null>(null);
```

Render category chips for Cerrajero, Plomero, Pintor, and Gasfitero; payment chips for Yape, Plin, and Efectivo; and a numeric price input.

- [ ] **Step 3: Add required image selection**

Import `expo-image-picker`, request media-library permission, and store the first selected asset URI:

```ts
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8
});

if (!result.canceled) {
  setPhotoDraftUri(result.assets[0].uri);
}
```

Show the selected image with an option to replace it. If permission is denied or selection fails, show a clear `Alert` and keep the form open.

- [ ] **Step 4: Validate and publish a shared job**

Derive validity from all required fields and a positive numeric price:

```ts
const normalizedPrice = Number(priceDraft.replace(",", "."));
const canPublish = Boolean(
  needDraft.trim() && categoryDraft && photoDraftUri && paymentMethodDraft && normalizedPrice > 0
);
```

On publish, prepend a complete `WorkerJob` to shared state:

```ts
const jobId = `request-${Date.now()}`;
const formattedPrice = `S/ ${normalizedPrice.toFixed(2)}`;

setWorkerRequests((jobs) => [{
  id: jobId,
  clientId: authenticatedClient!.id,
  title: needDraft.trim(),
  category: categoryDraft!,
  location: authenticatedClient!.address,
  price: formattedPrice,
  paymentMethod: paymentMethodDraft!,
  time: "Ahora",
  status: "NUEVO",
  detail: {
    id: jobId,
    clientName: `${authenticatedClient!.firstName} ${authenticatedClient!.lastName}`.trim(),
    rating: "Nuevo",
    completedServices: 0,
    title: needDraft.trim(),
    category: categoryDraft!,
    description: needDraft.trim(),
    address: authenticatedClient!.address,
    distance: "Por calcular",
    availability: "A coordinar",
    materials: "Por coordinar",
    duration: "Por coordinar",
    paymentAmount: formattedPrice
  },
  referencePhotos: [photoDraftUri!],
  messages: []
}, ...jobs]);
```

Clear every draft field, close the composer, and move to Publicaciones.

- [ ] **Step 5: Show photo, category, price, and payment in client cards**

Update the card props to accept `WorkerJob`. Show the first reference image, category, formatted price, payment method, status, and message availability. Preserve existing accessible typography and contrast variants.

- [ ] **Step 6: Verify and commit client publication creation**

Run: `npm run typecheck`

Expected: PASS.

```bash
git add src/screens/client/ClientScreens.tsx
git commit -m "feat: publish client jobs in shared memory"
```

### Task 3: Add client-side shared chat

**Files:**
- Modify: `src/screens/client/ClientScreens.tsx`

- [ ] **Step 1: Gate the client conversation until the worker initiates it**

For each client job, calculate:

```ts
const hasWorkerMessage = job.messages.some((message) => message.sender === "worker");
```

Disable the chat action when false and expose `accessibilityState={{ disabled: true }}`. Display the hint `El chat se habilitará cuando un trabajador te escriba.`

- [ ] **Step 2: Add the client chat modal and selected job state**

Track the selected job id and draft message. The modal must read the selected job directly from `workerRequests` so worker messages appear without copying state:

```ts
const selectedChatJob = workerRequests.find((job) => job.id === selectedClientJobId);
```

Render all messages in insertion order, with client messages aligned to the right and worker messages aligned to the left.

- [ ] **Step 3: Append client replies to the same job**

Reject blank messages and append a typed message through `setWorkerRequests`:

```ts
setWorkerRequests((jobs) => jobs.map((job) =>
  job.id === selectedChatJob.id
    ? { ...job, messages: [...job.messages, {
        id: `message-${Date.now()}`,
        body,
        sentAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        sender: "client"
      }] }
    : job
));
```

- [ ] **Step 4: Verify and commit shared messaging**

Run: `npm run typecheck`

Expected: PASS.

```bash
git add src/screens/client/ClientScreens.tsx
git commit -m "feat: add client replies to shared job chat"
```

### Task 4: Paginate worker requests and show publication photos

**Files:**
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Add page state after filtering**

Use a three-item page size and slice the already filtered jobs:

```ts
const PAGE_SIZE = 3;
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.max(1, Math.ceil(visibleJobs.length / PAGE_SIZE));
const paginatedJobs = visibleJobs.slice(
  (currentPage - 1) * PAGE_SIZE,
  currentPage * PAGE_SIZE
);
```

Render `paginatedJobs` instead of `visibleJobs`.

- [ ] **Step 2: Keep page state valid**

Reset to page 1 in the filter press handler. Add an effect that clamps the current page after accept/reject or data changes:

```ts
useEffect(() => {
  setCurrentPage((page) => Math.min(page, totalPages));
}, [totalPages]);
```

- [ ] **Step 3: Add accessible pagination controls**

Render Anterior, `Página X de Y`, and Siguiente below the cards. Disable boundary controls, expose disabled accessibility state, and hide the controls when there are no matching jobs.

- [ ] **Step 4: Display the first need photo on every worker card**

Extend `JobRequestCard` to render `job.referencePhotos[0]` when present. Keep a neutral icon placeholder for defensive compatibility when no URI exists.

- [ ] **Step 5: Show the job's actual payment method in detail**

Replace the hard-coded Plin badge with `selectedJob.paymentMethod`, using a neutral badge style that works for Yape, Plin, and Efectivo.

- [ ] **Step 6: Verify and commit worker presentation changes**

Run: `npm run typecheck`

Expected: PASS.

```bash
git add src/screens/worker/WorkerScreens.tsx
git commit -m "feat: paginate worker requests and show job media"
```

### Task 5: Alert inactive workers without silently disabling acceptance

**Files:**
- Modify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Add an inactive-worker alert state**

Track a dedicated confirmation-dialog flag in `RequestDetailScreen`:

```ts
const [showInactiveAlert, setShowInactiveAlert] = useState(false);
```

- [ ] **Step 2: Route acceptance through availability validation**

Keep the accept action pressable. If unavailable, open the alert and return without mutating the job:

```ts
const acceptJob = () => {
  if (!selectedJob || selectedJob.status !== "NUEVO") return;
  if (!isWorkerAvailable) {
    setShowInactiveAlert(true);
    return;
  }
  // existing AGENDADO mutation and navigation
};
```

Do not pass `disabled={!isWorkerAvailable}` to the button. Preserve the inactive visual treatment as feedback but allow the press event.

- [ ] **Step 3: Render the explanatory alert**

Use `ConfirmationDialog` with title `Trabajador inactivo`, message `Estás inactivo. Activa tu disponibilidad desde el perfil para aceptar trabajos.`, confirm label `Entendido`, no destructive action, and close it from either callback.

- [ ] **Step 4: Verify and commit the availability feedback**

Run: `npm run typecheck`

Expected: PASS.

```bash
git add src/screens/worker/WorkerScreens.tsx
git commit -m "fix: alert inactive workers on acceptance"
```

### Task 6: End-to-end verification and review

**Files:**
- Verify: `src/types/domain.ts`
- Verify: `src/data/mockData.ts`
- Verify: `src/screens/client/ClientScreens.tsx`
- Verify: `src/screens/worker/WorkerScreens.tsx`

- [ ] **Step 1: Run static checks**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 2: Generate a production web bundle**

Run: `npx expo export --platform web --output-dir .superpowers/shared-job-export`

Expected: PASS and `Exported: .superpowers/shared-job-export`.

- [ ] **Step 3: Remove only the verified temporary export directory**

Resolve the absolute target, verify it is inside the repository, and delete it using PowerShell/.NET long-path-safe APIs.

- [ ] **Step 4: Check repository hygiene**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only intentional source or documentation changes.

- [ ] **Step 5: Review the complete feature against the specification**

Confirm publication validation, shared job creation, photo display, three-card pagination, inactive alert, payment method display, worker-initiated chat, client replies, and in-memory-only behavior. Correct every Critical or Important issue before delivery.

- [ ] **Step 6: Commit any review fixes**

```bash
git add src/types/domain.ts src/data/mockData.ts src/screens/client/ClientScreens.tsx src/screens/worker/WorkerScreens.tsx
git commit -m "fix: finalize shared client worker flow"
```
