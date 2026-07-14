import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TextStyle } from "react-native";

export type AccessibilityTextSize = "normal" | "large" | "extraLarge";

export type AccessibilityPreferences = {
  textSize: AccessibilityTextSize;
  highContrast: boolean;
  dyslexiaFriendly: boolean;
};

type AccessibilityContextValue = AccessibilityPreferences & {
  textSizeScale: number;
  setTextSize: (size: AccessibilityTextSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setDyslexiaFriendly: (enabled: boolean) => void;
  resetAccessibility: () => void;
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  textSize: "normal",
  highContrast: false,
  dyslexiaFriendly: false
};

const textSizeScales: Record<AccessibilityTextSize, number> = {
  normal: 1,
  large: 1.15,
  extraLarge: 1.3
};

const defaultContextValue: AccessibilityContextValue = {
  ...defaultAccessibilityPreferences,
  textSizeScale: 1,
  setTextSize: () => undefined,
  setHighContrast: () => undefined,
  setDyslexiaFriendly: () => undefined,
  resetAccessibility: () => undefined
};

const AccessibilityContext = createContext<AccessibilityContextValue>(defaultContextValue);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultAccessibilityPreferences);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...preferences,
      textSizeScale: textSizeScales[preferences.textSize],
      setTextSize: (textSize) => setPreferences((current) => ({ ...current, textSize })),
      setHighContrast: (highContrast) => setPreferences((current) => ({ ...current, highContrast })),
      setDyslexiaFriendly: (dyslexiaFriendly) =>
        setPreferences((current) => ({ ...current, dyslexiaFriendly })),
      resetAccessibility: () => setPreferences(defaultAccessibilityPreferences)
    }),
    [preferences]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export function useAccessibleInputStyle(baseFontSize = 16): TextStyle {
  const { dyslexiaFriendly, highContrast, textSizeScale } = useAccessibility();
  const fontSize = Math.round(baseFontSize * textSizeScale * 10) / 10;

  return {
    color: highContrast ? "#000000" : undefined,
    fontSize,
    lineHeight: dyslexiaFriendly ? Math.round(fontSize * 1.45 * 10) / 10 : undefined,
    letterSpacing: dyslexiaFriendly ? 0.35 : undefined
  };
}

export const highContrastPalette = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#000000",
  mutedText: "#1A1A1A",
  border: "#000000",
  primary: "#004C97",
  primarySoft: "#DCEEFF",
  danger: "#A00000",
  success: "#006B2D"
};
