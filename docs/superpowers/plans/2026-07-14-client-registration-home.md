# Client Registration and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el registro y acceso del cliente con documento de identidad, confirmaciones y una pantalla principal centrada en su publicación activa.

**Architecture:** El estado raíz seguirá controlando navegación y cuentas en memoria. Las validaciones documentales se compartirán mediante funciones puras, el login conservará el rol autenticado y una nueva pantalla de cliente recibirá los datos de la cuenta mediante `ScreenRenderProps`. La visibilidad del teclado se aislará en un hook reutilizable para ocultar únicamente el progreso de pasos.

**Tech Stack:** React 19, React Native 0.81, Expo 54, TypeScript 5.9, Expo Vector Icons.

---

## File map

- Create: `src/hooks/useKeyboardVisibility.ts` — expone el estado abierto/cerrado del teclado.
- Create: `src/services/validation/identityDocument.ts` — reglas compartidas de DNI y Carnet de Extranjería.
- Create: `src/screens/client/ClientScreens.tsx` — pantalla de registro exitoso e inicio del cliente.
- Modify: `src/types/domain.ts` — pantallas, grupo cliente, documento del cliente y estado autenticado.
- Modify: `src/services/api/clientRegistration.ts` — valida y persiste documento.
- Modify: `src/prototype/MiChambaPrototype.tsx` — cuentas únicas, cliente autenticado y propiedades compartidas.
- Modify: `src/screens/onboarding/OnboardingScreens.tsx` — campos documentales, confirmaciones y progreso oculto con teclado.
- Modify: `src/screens/auth/AuthScreens.tsx` — autenticación de ambos roles y destino de carga.
- Modify: `src/prototype/screenRegistry.tsx` — registro de éxito e inicio del cliente.

### Task 1: Document validation and client persistence

**Files:**
- Create: `src/services/validation/identityDocument.ts`
- Modify: `src/types/domain.ts`
- Modify: `src/services/api/clientRegistration.ts`

- [ ] **Step 1: Add shared document rules**

```ts
import type { IdentityDocumentType } from "../../types/domain";

export const getDocumentLength = (type: IdentityDocumentType | null) =>
  type === "Carnet de extranjeria" ? 9 : 8;

export const sanitizeDocumentNumber = (value: string, type: IdentityDocumentType | null) =>
  value.replace(/\D/g, "").slice(0, getDocumentLength(type));

export const isValidDocumentNumber = (type: IdentityDocumentType | null, value: string) =>
  Boolean(type) && /^\d+$/.test(value) && value.length === getDocumentLength(type);
```

- [ ] **Step 2: Extend domain contracts**

Add `IdentityDocumentType`, `clientRegistrationSuccess`, `clientHome`, `Cliente` as a screen group, document fields to `RegisteredClient`, and these properties to `ScreenRenderProps`:

```ts
authenticatedClient: RegisteredClient | null;
setAuthenticatedClient: (client: RegisteredClient | null) => void;
authenticatedRole: UserRole | null;
setAuthenticatedRole: (role: UserRole | null) => void;
```

- [ ] **Step 3: Validate and persist the document**

In `registerClientInMemory`, reject invalid documents before phone validation and return:

```ts
if (!isValidDocumentNumber(draft.documentType, draft.documentNumber)) {
  throw new Error("Ingresa un documento de identidad valido.");
}

return {
  id: `client-${draft.documentNumber}`,
  documentType: draft.documentType,
  documentNumber: draft.documentNumber,
  // existing client fields
};
```

- [ ] **Step 4: Verify types**

Run: `npm run typecheck`

Expected: failures only where the new required authentication and document properties have not yet been connected.

- [ ] **Step 5: Commit the data contract**

```powershell
git add src/types/domain.ts src/services/api/clientRegistration.ts src/services/validation/identityDocument.ts
git commit -m "feat: add client identity document contract"
```

### Task 2: Keyboard-aware progress and client registration confirmations

**Files:**
- Create: `src/hooks/useKeyboardVisibility.ts`
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] **Step 1: Create the keyboard hook**

```ts
import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardVisibility() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return isKeyboardVisible;
}
```

- [ ] **Step 2: Replace repeated progress markup with a keyboard-aware component**

```tsx
function RegistrationStepProgress({ step }: { step: 1 | 2 | 3 }) {
  const isKeyboardVisible = useKeyboardVisibility();
  if (isKeyboardVisible) return null;

  return (
    <View style={local.dualActionStepBlock}>
      <Text style={local.stepText}>Paso {step} de 3</Text>
      <View style={local.personalStepRow}>
        {[1, 2, 3].map((value) => (
          <View key={value} style={[local.personalStepBar, value <= step && local.personalStepBarActive]} />
        ))}
      </View>
    </View>
  );
}
```

Use it in the three client registration screens and the worker registration forms so the step disappears whenever an input opens the keyboard.

- [ ] **Step 3: Add document type and number to client personal information**

Reuse the worker selector presentation and shared validation functions. Include both fields in `canContinue`, clear `documentNumber` when the type changes, and show `DNI debe tener 8 numeros` or `Carnet de extranjeria debe tener 9 numeros` after interaction.

- [ ] **Step 4: Confirm client back actions**

Change direct back navigation in location and property screens to:

```tsx
onPress={() => setExitIntent({ action: "back", target: "clientPersonalInformation" })}
```

and:

```tsx
onPress={() => setExitIntent({ action: "back", target: "clientLocation" })}
```

Update each `handleConfirmExit` to reset the full draft only for `cancel`, preserving data for `back`.

- [ ] **Step 5: Confirm final registration**

Add a separate `isFinishConfirmOpen` state. The button opens a `ConfirmationDialog`; its confirm handler invokes `registerClient`, resets the draft and navigates to `clientRegistrationSuccess`. Errors remain visible on the property screen.

- [ ] **Step 6: Verify the registration screens**

Run: `npm run typecheck`

Expected: no errors inside `OnboardingScreens.tsx` or `useKeyboardVisibility.ts`.

- [ ] **Step 7: Commit registration behavior**

```powershell
git add src/hooks/useKeyboardVisibility.ts src/screens/onboarding/OnboardingScreens.tsx
git commit -m "feat: complete client registration confirmations"
```

### Task 3: Role-aware authentication

**Files:**
- Modify: `src/prototype/MiChambaPrototype.tsx`
- Modify: `src/screens/auth/AuthScreens.tsx`

- [ ] **Step 1: Store the authenticated role and client**

Add state in the prototype root:

```ts
const [authenticatedClient, setAuthenticatedClient] = useState<RegisteredClient | null>(null);
const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);
```

Expose both through `screenProps`. Update `registerClient` to reject a document already present in either registered collection and filter clients by `documentNumber`, not phone.

- [ ] **Step 2: Authenticate both account types**

In `LoginScreen`, normalize the numeric credential, search clients and workers, clear the other authenticated account, set the matching role, and navigate to `loading`. Raise the same `Usuario o contrasena incorrectos` state for every failure. Set `maxLength={9}`.

- [ ] **Step 3: Route loading by role**

Change `LoadingScreen` to receive `authenticatedRole` and navigate after the animation:

```ts
navigate(authenticatedRole === "client" ? "clientHome" : "workerHome");
```

If no role exists, return to `login` instead of assuming worker.

- [ ] **Step 4: Verify authentication types**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit authentication**

```powershell
git add src/prototype/MiChambaPrototype.tsx src/screens/auth/AuthScreens.tsx
git commit -m "feat: route login by account role"
```

### Task 4: Client success and active-publication home

**Files:**
- Create: `src/screens/client/ClientScreens.tsx`
- Modify: `src/prototype/screenRegistry.tsx`

- [ ] **Step 1: Add the registration success screen**

Create `ClientRegistrationSuccessScreen` with a success icon, `Cuenta creada correctamente`, explanatory text and a button that navigates to `login`. Follow the existing confirmation screen spacing, typography and dark primary button.

- [ ] **Step 2: Add focused home components**

Inside `ClientScreens.tsx`, define:

```ts
type ActiveNeed = {
  id: string;
  title: string;
  property: string;
  location: string;
  publishedAgo: string;
  interestedWorkers: number;
  latestResponse: { workerName: string; message: string; receivedAgo: string } | null;
};
```

Use a local active need for the prototype. Implement `ActiveNeedCard` and `WorkerResponsePreview` as private components receiving typed properties.

- [ ] **Step 3: Compose the approved home hierarchy**

`ClientHomeScreen` must render, in this order: dark greeting header, `Nueva publicacion`, `Tu publicacion activa`, the active need, `Ver respuestas`, recent worker activity, and bottom navigation with `Inicio`, `Publicaciones`, `Perfil`. Use `authenticatedClient?.firstName` and its stored address; provide neutral fallbacks for preview mode.

- [ ] **Step 4: Register both screens**

Add entries:

```tsx
{ key: "clientRegistrationSuccess", title: "REGISTRO CLIENTE EXITOSO", group: "Registro", render: ClientRegistrationSuccessScreen },
{ key: "clientHome", title: "PRINCIPAL-CLIENTE", group: "Cliente", render: ClientHomeScreen },
```

- [ ] **Step 5: Verify responsive UI compilation**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit client screens**

```powershell
git add src/screens/client/ClientScreens.tsx src/prototype/screenRegistry.tsx
git commit -m "feat: add active-publication client home"
```

### Task 5: Integrated verification and cleanup

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run the full static check**

Run: `npm run typecheck`

Expected: PASS with exit code 0.

- [ ] **Step 2: Inspect repository changes**

Run: `git status --short` and `git diff --check`.

Expected: no accidental changes, merge markers or whitespace errors; `.superpowers/` preview artifacts remain uncommitted.

- [ ] **Step 3: Exercise the client flow manually**

Run: `npm run web`.

Verify: DNI/CE lengths; disabled continuation on invalid document; back/cancel/final confirmations; success screen; login with document; client destination; active publication; worker login still reaching worker home; step indicators hidden only while the keyboard is visible.

- [ ] **Step 4: Apply only integration fixes and rerun checks**

Run: `npm run typecheck` and repeat the affected manual path.

Expected: PASS and no regression in worker registration/login.

- [ ] **Step 5: Commit integration fixes if any**

```powershell
git add src
git commit -m "fix: stabilize client registration and home flow"
```
