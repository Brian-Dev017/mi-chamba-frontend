import type { ComponentProps } from "react";
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  useWindowDimensions
} from "react-native";
import { highContrastPalette, useAccessibility } from "../accessibility/AccessibilityContext";

type ResponsiveTextProps = ComponentProps<typeof NativeText>;

const getResponsiveScale = (width: number) => {
  if (width < 360) {
    return 0.92;
  }

  if (width >= 430) {
    return Math.min(width / 430, 1.08);
  }

  return 1;
};

export function ResponsiveText({ style, ...props }: ResponsiveTextProps) {
  const { width } = useWindowDimensions();
  const { dyslexiaFriendly, highContrast, textSizeScale } = useAccessibility();
  const responsiveScale = getResponsiveScale(width);
  const flattenedStyle = StyleSheet.flatten(style);
  const fontSize =
    typeof flattenedStyle?.fontSize === "number"
      ? Math.round(
          Math.max(
            flattenedStyle.fontSize * responsiveScale * textSizeScale,
            Math.min(flattenedStyle.fontSize, 8)
          ) * 10
        ) / 10
      : undefined;
  const lineHeight =
    typeof flattenedStyle?.lineHeight === "number"
      ? Math.round(
          flattenedStyle.lineHeight * responsiveScale * textSizeScale * (dyslexiaFriendly ? 1.12 : 1) * 10
        ) / 10
      : dyslexiaFriendly && fontSize !== undefined
        ? Math.round(fontSize * 1.45 * 10) / 10
        : undefined;

  const originalColor = typeof flattenedStyle?.color === "string" ? flattenedStyle.color.toUpperCase() : "";
  const highContrastColor = !highContrast
    ? undefined
    : originalColor === "#FFFFFF" || originalColor === "WHITE"
      ? "#FFFFFF"
      : originalColor.includes("D2") || originalColor.includes("FF")
        ? highContrastPalette.primary
        : highContrastPalette.text;

  const accessibilityTypography = dyslexiaFriendly
    ? {
        fontFamily: Platform.select({ android: "sans-serif", ios: "Arial", default: "Arial" }),
        letterSpacing: (typeof flattenedStyle?.letterSpacing === "number" ? flattenedStyle.letterSpacing : 0) + 0.35
      }
    : undefined;

  return (
    <NativeText
      {...props}
      style={[
        style,
        fontSize !== undefined && { fontSize },
        lineHeight !== undefined && { lineHeight },
        accessibilityTypography,
        highContrastColor !== undefined && { color: highContrastColor }
      ]}
    />
  );
}
