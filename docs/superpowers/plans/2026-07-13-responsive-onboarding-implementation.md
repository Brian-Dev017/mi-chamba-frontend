# Responsive Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar automáticamente la tipografía y el área desplazable del onboarding al tamaño del teléfono y al teclado en pantalla.

**Architecture:** Un componente `ResponsiveText` encapsulará el escalado moderado basado en `useWindowDimensions`, conservando el escalado accesible nativo. Los contenedores compartidos y los formularios de onboarding usarán un patrón uniforme `KeyboardAvoidingView` + `ScrollView`, mientras Android redimensionará su ventana hasta el borde superior del teclado.

**Tech Stack:** React 19, React Native 0.81, Expo 54, TypeScript 5.9, react-native-safe-area-context.

---

## Estructura de archivos

- Crear `src/components/ResponsiveText.tsx`: única responsabilidad de calcular y aplicar tipografía responsive.
- Modificar `src/components/ui.tsx`: adoptar el texto responsive y reforzar el contenedor compartido para teclado y scroll.
- Modificar `src/screens/onboarding/OnboardingScreens.tsx`: adoptar el texto responsive y configurar los formularios manuales con teclado.
- Modificar `app.json`: activar el redimensionamiento de la ventana Android.

### Task 1: Componente tipográfico responsive

**Files:**
- Create: `src/components/ResponsiveText.tsx`

- [ ] **Step 1: Crear el cálculo responsive con límites**

Crear un componente que derive un factor de `width`: `0.92` bajo 360 px, `1` entre 360 y 429 px y hasta `1.08` en 430 px o más. Aplanar el estilo recibido y reajustar `fontSize` y `lineHeight`, sin modificar `allowFontScaling`.

```tsx
import type { ComponentProps } from "react";
import { StyleSheet, Text as NativeText, useWindowDimensions } from "react-native";

type ResponsiveTextProps = ComponentProps<typeof NativeText>;

export function ResponsiveText({ style, ...props }: ResponsiveTextProps) {
  const { width } = useWindowDimensions();
  const scale = width < 360 ? 0.92 : width >= 430 ? Math.min(width / 430, 1.08) : 1;
  const flattenedStyle = StyleSheet.flatten(style);
  const fontSize = typeof flattenedStyle?.fontSize === "number" ? flattenedStyle.fontSize * scale : undefined;
  const lineHeight = typeof flattenedStyle?.lineHeight === "number" ? flattenedStyle.lineHeight * scale : undefined;

  return <NativeText {...props} style={[style, { fontSize, lineHeight }]} />;
}
```

- [ ] **Step 2: Ejecutar verificación TypeScript**

Run: `npm run typecheck`

Expected: PASS sin errores de TypeScript.

### Task 2: Componentes compartidos responsive y sensibles al teclado

**Files:**
- Modify: `src/components/ui.tsx`

- [ ] **Step 1: Sustituir el texto nativo por `ResponsiveText`**

Eliminar `Text` del import de `react-native` e importar:

```tsx
import { ResponsiveText as Text } from "./ResponsiveText";
```

- [ ] **Step 2: Configurar el ScrollView compartido para el teclado**

Agregar al `ScrollView` de `ScreenFrame`:

```tsx
automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
keyboardShouldPersistTaps="handled"
```

Mantener `KeyboardAvoidingView` con `padding` en iOS y `height` en Android.

- [ ] **Step 3: Eliminar la altura rígida del contenido**

Cambiar:

```tsx
screenContent: { flexGrow: 1, padding: 20, paddingBottom: 34, gap: 16 }
```

- [ ] **Step 4: Ejecutar verificación TypeScript**

Run: `npm run typecheck`

Expected: PASS sin errores.

### Task 3: Formularios de onboarding responsive

**Files:**
- Modify: `src/screens/onboarding/OnboardingScreens.tsx`

- [ ] **Step 1: Sustituir el texto nativo por `ResponsiveText`**

Eliminar `Text` del import de `react-native` e importar:

```tsx
import { ResponsiveText as Text } from "../../components/ResponsiveText";
```

- [ ] **Step 2: Configurar todos los ScrollView asociados a formularios**

En cada bloque `KeyboardAvoidingView` + `ScrollView`, agregar:

```tsx
automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
keyboardShouldPersistTaps="handled"
```

- [ ] **Step 3: Eliminar alturas de viewport rígidas**

Sustituir las dos apariciones de `minHeight: 744` en contenedores principales por `flexGrow: 1` o `flex: 1`, según si el estilo pertenece al contenido desplazable o a la cámara.

- [ ] **Step 4: Verificar que el onboarding no conserve el viewport rígido**

Run: `rg -n "minHeight: 744" src/components/ui.tsx src/screens/onboarding/OnboardingScreens.tsx`

Expected: sin coincidencias.

### Task 4: Redimensionamiento Android y verificación final

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Configurar Android para terminar la ventana sobre el teclado**

Agregar dentro de `expo.android`:

```json
"softwareKeyboardLayoutMode": "resize"
```

- [ ] **Step 2: Validar JSON y TypeScript**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json OK')"`

Expected: `app.json OK`.

Run: `npm run typecheck`

Expected: PASS sin errores.

- [ ] **Step 3: Revisar el diff final**

Run: `git diff --check && git diff --stat`

Expected: sin errores de espacios y cambios limitados a los archivos definidos.

- [ ] **Step 4: Commit de implementación**

```bash
git add app.json src/components/ResponsiveText.tsx src/components/ui.tsx src/screens/onboarding/OnboardingScreens.tsx
git commit -m "feat: make onboarding responsive and keyboard aware"
```
