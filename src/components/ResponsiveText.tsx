import type { ComponentProps } from "react";
import {
  StyleSheet,
  Text as NativeText,
  useWindowDimensions
} from "react-native";

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
  const responsiveScale = getResponsiveScale(width);
  const flattenedStyle = StyleSheet.flatten(style);
  const fontSize =
    typeof flattenedStyle?.fontSize === "number"
      ? Math.round(flattenedStyle.fontSize * responsiveScale * 10) / 10
      : undefined;
  const lineHeight =
    typeof flattenedStyle?.lineHeight === "number"
      ? Math.round(flattenedStyle.lineHeight * responsiveScale * 10) / 10
      : undefined;

  return (
    <NativeText
      {...props}
      style={[style, fontSize !== undefined && { fontSize }, lineHeight !== undefined && { lineHeight }]}
    />
  );
}
