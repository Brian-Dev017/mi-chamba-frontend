import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { ConfirmationDialog, Ionicons } from "../components/ui";
import { ResponsiveText as Text } from "../components/ResponsiveText";
import { palette } from "../theme/palette";
import {
  highContrastPalette,
  useAccessibility
} from "./AccessibilityContext";
import type { AccessibilityTextSize } from "./AccessibilityContext";

const textSizeOptions: { label: string; value: AccessibilityTextSize }[] = [
  { label: "Normal", value: "normal" },
  { label: "Grande", value: "large" },
  { label: "Muy grande", value: "extraLarge" }
];

export function AccessibilitySettingsModal({
  onClose,
  visible
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const {
    dyslexiaFriendly,
    highContrast,
    resetAccessibility,
    setDyslexiaFriendly,
    setHighContrast,
    setTextSize,
    textSize
  } = useAccessibility();
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const contrastStyles = highContrast
    ? {
        card: { backgroundColor: highContrastPalette.surface, borderColor: highContrastPalette.border },
        option: { backgroundColor: highContrastPalette.surface, borderColor: highContrastPalette.border },
        selected: { backgroundColor: highContrastPalette.primarySoft, borderColor: highContrastPalette.primary },
        preview: { backgroundColor: highContrastPalette.background, borderColor: highContrastPalette.border }
      }
    : null;

  const closeModal = () => {
    setShowResetConfirmation(false);
    onClose();
  };

  return (
    <>
      <Modal
        animationType="slide"
        hardwareAccelerated
        statusBarTranslucent
        transparent
        visible={visible}
        onRequestClose={closeModal}
      >
        <View accessibilityViewIsModal style={local.overlay}>
          <Pressable
            accessibilityLabel="Cerrar configuración de accesibilidad"
            onPress={closeModal}
            style={local.scrim}
          />
          <View style={[local.sheet, contrastStyles?.card]}>
            <View style={local.handle} />
            <View style={local.header}>
              <View style={local.headerCopy}>
                <Text accessibilityRole="header" style={local.title}>Accesibilidad</Text>
                <Text style={local.description}>
                  Ajusta la lectura y el contraste durante esta sesión.
                </Text>
              </View>
              <Pressable
                accessibilityHint="Cierra el panel y conserva los ajustes"
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                hitSlop={8}
                onPress={closeModal}
                style={[local.closeButton, contrastStyles?.option]}
              >
                <Ionicons name="close" size={22} color={highContrast ? highContrastPalette.text : palette.ink} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={local.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={local.section}>
                <Text style={local.sectionTitle}>Tamaño de letra</Text>
                <Text style={local.sectionHelp}>Selecciona el tamaño más cómodo para leer.</Text>
                <View accessibilityRole="radiogroup" style={local.sizeOptions}>
                  {textSizeOptions.map((option) => {
                    const selected = textSize === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityLabel={`Tamaño de letra ${option.label}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        onPress={() => setTextSize(option.value)}
                        style={[
                          local.sizeOption,
                          contrastStyles?.option,
                          selected && local.sizeOptionSelected,
                          selected && contrastStyles?.selected
                        ]}
                      >
                        <Text style={[local.sizeOptionText, selected && local.sizeOptionTextSelected]}>
                          {option.label}
                        </Text>
                        <Ionicons
                          name={selected ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={selected ? (highContrast ? highContrastPalette.primary : palette.blue) : palette.muted}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[local.preferenceCard, contrastStyles?.option]}>
                <View style={local.preferenceCopy}>
                  <Text style={local.preferenceTitle}>Contraste alto</Text>
                  <Text style={local.preferenceDescription}>Refuerza textos, bordes y controles.</Text>
                </View>
                <Switch
                  accessibilityLabel="Activar contraste alto"
                  ios_backgroundColor="#AAB3BD"
                  onValueChange={setHighContrast}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#AAB3BD", true: highContrastPalette.primary }}
                  value={highContrast}
                />
              </View>

              <View style={[local.preferenceCard, contrastStyles?.option]}>
                <View style={local.preferenceCopy}>
                  <Text style={local.preferenceTitle}>Dislexia amigable</Text>
                  <Text style={local.preferenceDescription}>Usa OpenDyslexic y amplía el espaciado entre líneas.</Text>
                </View>
                <Switch
                  accessibilityLabel="Activar modo dislexia amigable"
                  ios_backgroundColor="#AAB3BD"
                  onValueChange={setDyslexiaFriendly}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#AAB3BD", true: highContrastPalette.primary }}
                  value={dyslexiaFriendly}
                />
              </View>

              <View style={[local.preview, contrastStyles?.preview]}>
                <View style={local.previewHeading}>
                  <Ionicons name="eye-outline" size={19} color={highContrast ? highContrastPalette.primary : palette.blue} />
                  <Text style={local.previewLabel}>Vista previa</Text>
                </View>
                <Text style={local.previewText}>
                  Mi Chamba te ayuda a encontrar servicios de forma clara y segura.
                </Text>
              </View>

              <Pressable
                accessibilityHint="Devuelve todas las opciones a sus valores iniciales"
                accessibilityRole="button"
                onPress={() => setShowResetConfirmation(true)}
                style={[local.resetButton, contrastStyles?.option]}
              >
                <Ionicons name="refresh-outline" size={19} color={highContrast ? highContrastPalette.danger : "#C92A2A"} />
                <Text style={local.resetText}>Restablecer configuración</Text>
              </Pressable>

              <Pressable accessibilityRole="button" onPress={closeModal} style={local.doneButton}>
                <Text style={local.doneButtonText}>Listo</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmationDialog
        cancelLabel="Conservar ajustes"
        confirmLabel="Restablecer"
        message="El tamaño de letra volverá a Normal y se desactivarán el contraste alto y el modo dislexia amigable."
        onCancel={() => setShowResetConfirmation(false)}
        onConfirm={() => {
          resetAccessibility();
          setShowResetConfirmation(false);
        }}
        title="Restablecer accesibilidad"
        visible={visible && showResetConfirmation}
      />
    </>
  );
}

const local = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2, 27, 48, 0.58)" },
  sheet: {
    maxHeight: "90%",
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    paddingTop: 10,
    overflow: "hidden"
  },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 99, backgroundColor: "#B7C0C8" },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, paddingTop: 16 },
  headerCopy: { flex: 1, gap: 4 },
  title: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  description: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3F7",
    borderWidth: 1,
    borderColor: palette.line
  },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  section: { gap: 8 },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  sectionHelp: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  sizeOptions: { gap: 8 },
  sizeOption: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  sizeOptionSelected: { backgroundColor: palette.softBlue, borderColor: palette.blue, borderWidth: 2 },
  sizeOptionText: { color: palette.inkSoft, fontSize: 14, fontWeight: "700" },
  sizeOptionTextSelected: { color: palette.blue, fontWeight: "900" },
  preferenceCard: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  preferenceCopy: { flex: 1, gap: 3 },
  preferenceTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  preferenceDescription: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  preview: { borderRadius: 12, backgroundColor: "#F4FAFF", borderWidth: 1, borderColor: "#C7E2F5", padding: 14, gap: 8 },
  previewHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewLabel: { color: palette.blue, fontSize: 12, fontWeight: "900" },
  previewText: { color: palette.ink, fontSize: 14, lineHeight: 21 },
  resetButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8B4B4",
    backgroundColor: "#FFF7F7",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  resetText: { color: "#A91515", fontSize: 13, fontWeight: "900" },
  doneButton: { minHeight: 52, borderRadius: 12, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  doneButtonText: { color: palette.white, fontSize: 14, fontWeight: "900" }
});
