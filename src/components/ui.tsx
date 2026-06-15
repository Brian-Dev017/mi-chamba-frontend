import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { palette } from "../theme/palette";

type IconName = keyof typeof Ionicons.glyphMap;

export function ScreenFrame({
  children,
  centered,
  gradient,
  darkTop,
  noPadding
}: {
  children: ReactNode;
  centered?: boolean;
  gradient?: boolean;
  darkTop?: boolean;
  noPadding?: boolean;
}) {
  return (
    <ScrollView
      style={[styles.screen, gradient && styles.gradientScreen, darkTop && styles.darkTopScreen]}
      contentContainerStyle={[
        styles.screenContent,
        noPadding && styles.screenContentNoPadding,
        centered && styles.centerContent
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function WorkerShell({
  active,
  children
}: {
  active: "Solicitudes" | "Mis Trabajos" | "Perfil";
  children: ReactNode;
}) {
  return (
    <View style={styles.workerScreen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.workerContent}>{children}</View>
      </ScrollView>
      <View style={styles.bottomNav}>
        {(["Solicitudes", "Mis Trabajos", "Perfil"] as const).map((item) => (
          <View key={item} style={styles.navItem}>
            {active === item && <View style={styles.navActiveLine} />}
            <Ionicons
              name={
                item === "Solicitudes"
                  ? "list-outline"
                  : item === "Mis Trabajos"
                    ? "briefcase-outline"
                    : "person-outline"
              }
              size={20}
              color={active === item ? palette.blue : palette.muted}
            />
            <Text style={[styles.navText, active === item && styles.navTextActive]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SectionTitle({ title, centered }: { title: string; centered?: boolean }) {
  if (!title) {
    return <View style={styles.titleSpacer} />;
  }

  return (
    <View style={[styles.titleBlock, centered && styles.centerStack]}>
      <Text style={[styles.screenTitle, centered && styles.textCenter]}>{title}</Text>
      <View style={styles.titleUnderline} />
    </View>
  );
}

export function Field({
  label,
  placeholder,
  icon,
  secure
}: {
  label: string;
  placeholder: string;
  icon?: IconName;
  secure?: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          secureTextEntry={secure}
          style={styles.input}
        />
        {icon ? <Ionicons name={icon} size={20} color={palette.muted} /> : null}
      </View>
    </View>
  );
}

export function PrimaryButton({ label, grow }: { label: string; grow?: boolean }) {
  return (
    <Pressable style={[styles.primaryButton, grow && styles.grow]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  grow,
  destructive
}: {
  label: string;
  grow?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable style={[styles.secondaryButton, grow && styles.grow, destructive && styles.destructiveButton]}>
      <Text style={[styles.secondaryButtonText, destructive && styles.destructiveButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((value) => (
        <View key={value} style={[styles.stepBar, value <= step && styles.stepBarActive]} />
      ))}
    </View>
  );
}

export function StatusPill({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <View style={[styles.statusPill, muted && styles.statusPillMuted]}>
      <Text style={[styles.statusText, muted && styles.statusTextMuted]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export function InfoCard({ children }: { children: ReactNode }) {
  return <View style={styles.infoCard}>{children}</View>;
}

export function DetailRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={22} color={palette.blue} />
      <View>
        <Text style={styles.captionText}>{label}</Text>
        <Text style={styles.bodyText}>{value}</Text>
      </View>
    </View>
  );
}

export function RegistrationFrame({
  title,
  step,
  finalLabel = "Siguiente",
  children
}: {
  title: string;
  step: 1 | 2 | 3;
  finalLabel?: string;
  children: ReactNode;
}) {
  return (
    <ScreenFrame>
      <SectionTitle title={title} />
      {children}
      <View style={styles.stepFooter}>
        <StepIndicator step={step} />
        <Text style={styles.captionText}>Paso {step} de 3</Text>
        <View style={styles.actionRow}>
          <SecondaryButton label="Regresar" />
          <PrimaryButton label={finalLabel} grow />
        </View>
      </View>
    </ScreenFrame>
  );
}

export function MapPreview() {
  return (
    <View style={styles.mapPreview}>
      <Ionicons name="location" size={34} color={palette.red} />
      <Text style={styles.mapLink}>Ver en mapa</Text>
    </View>
  );
}

export function ConfirmationDialog({
  cancelLabel = "Continuar registro",
  confirmLabel,
  message,
  onCancel,
  onConfirm,
  title,
  visible
}: {
  cancelLabel?: string;
  confirmLabel: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconWrap}>
            <Ionicons name="alert-circle-outline" size={30} color={palette.red} />
          </View>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <Pressable onPress={onConfirm} style={styles.confirmDangerButton}>
            <Text style={styles.confirmDangerText}>{confirmLabel}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.confirmKeepButton}>
            <Text style={styles.confirmKeepText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export { Ionicons, palette };

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  screenContent: { padding: 20, paddingBottom: 34, minHeight: 744, gap: 16 },
  screenContentNoPadding: { padding: 0, paddingBottom: 34, gap: 0 },
  centerContent: { justifyContent: "center", alignItems: "center" },
  gradientScreen: { backgroundColor: palette.ink },
  darkTopScreen: { backgroundColor: palette.ink },
  workerScreen: { flex: 1, backgroundColor: palette.paper },
  workerContent: { padding: 20, paddingBottom: 106, gap: 16 },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navActiveLine: { position: "absolute", top: 0, width: 105, height: 3, backgroundColor: palette.cyan },
  navText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  navTextActive: { color: palette.ink },
  fieldBlock: { gap: 8 },
  fieldLabel: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  inputShell: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  input: { flex: 1, color: palette.ink, fontSize: 16 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  primaryButtonText: { color: palette.white, fontSize: 14, fontWeight: "800" },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  secondaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  destructiveButton: { borderColor: "#F4B4B4", backgroundColor: palette.softRed },
  destructiveButtonText: { color: palette.red },
  grow: { flex: 1 },
  titleBlock: { gap: 12, marginBottom: 8 },
  titleSpacer: { height: 8 },
  screenTitle: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  titleUnderline: { width: 48, height: 4, borderRadius: 99, backgroundColor: palette.ink },
  centerStack: { alignItems: "center", justifyContent: "center", gap: 4 },
  textCenter: { textAlign: "center" },
  bodyText: { color: palette.inkSoft, fontSize: 16, lineHeight: 22 },
  smallMuted: { color: palette.muted, fontSize: 12 },
  captionText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  linkTextStrong: { color: palette.blue, fontSize: 14, fontWeight: "900" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionRow: { flexDirection: "row", gap: 12 },
  stepFooter: { marginTop: "auto", gap: 14 },
  stepRow: { flexDirection: "row", justifyContent: "center", gap: 4 },
  stepBar: { width: 40, height: 6, borderRadius: 99, backgroundColor: "#C4C6CD" },
  stepBarActive: { backgroundColor: palette.blue },
  infoCard: {
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14
  },
  sectionLabel: { color: palette.ink, fontSize: 12, fontWeight: "900", marginTop: 4 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14
  },
  statusPill: { borderRadius: 99, backgroundColor: palette.softBlue, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillMuted: { backgroundColor: "#EEF2F5" },
  statusText: { color: palette.blue, fontSize: 10, fontWeight: "900" },
  statusTextMuted: { color: palette.muted },
  cardTitle: { color: palette.ink, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  mapPreview: {
    height: 188,
    borderRadius: 8,
    backgroundColor: "#DAEAF6",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  mapLink: { color: palette.blue, fontSize: 14, fontWeight: "900" },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 27, 48, 0.52)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  confirmCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: palette.white,
    padding: 20,
    alignItems: "center",
    gap: 12
  },
  confirmIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.softRed,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  },
  confirmMessage: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  confirmDangerButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: palette.red,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  confirmDangerText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "900"
  },
  confirmKeepButton: {
    width: "100%",
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmKeepText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
