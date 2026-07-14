import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResponsiveText as Text } from "../../components/ResponsiveText";
import { Ionicons, ScreenFrame } from "../../components/ui";
import { palette } from "../../theme/palette";
import type { ScreenRenderProps } from "../../types/domain";

type ActiveNeed = {
  id: string;
  title: string;
  property: string;
  location: string;
  publishedAgo: string;
  interestedWorkers: number;
  latestResponse: {
    workerName: string;
    message: string;
    receivedAgo: string;
  } | null;
};

const activeNeed: ActiveNeed = {
  id: "need-001",
  title: "Instalacion de tres tomacorrientes",
  property: "Departamento",
  location: "Chiclayo",
  publishedAgo: "Hace 8 min",
  interestedWorkers: 2,
  latestResponse: {
    workerName: "Juan Perez",
    message: "Puedo realizar el trabajo hoy desde las 4:00 p. m.",
    receivedAgo: "Hace 2 min"
  }
};

export function ClientRegistrationSuccessScreen({ navigate }: ScreenRenderProps) {
  return (
    <ScreenFrame centered noPadding scrollable={false}>
      <View style={local.successTopBand} />
      <View style={local.successContent}>
        <View style={local.successIcon}>
          <Ionicons name="checkmark" size={42} color={palette.white} />
        </View>
        <Text style={local.successTitle}>Cuenta creada correctamente</Text>
        <Text style={local.successMessage}>
          Tu documento ya esta vinculado a Mi Chamba. Usalo junto con tu contrasena para iniciar sesion.
        </Text>
        <Pressable onPress={() => navigate("login")} style={local.successButton}>
          <Text style={local.successButtonText}>Ir a iniciar sesion</Text>
          <Ionicons name="arrow-forward" size={18} color={palette.white} />
        </Pressable>
      </View>
    </ScreenFrame>
  );
}

export function ClientHomeScreen({ authenticatedClient }: ScreenRenderProps) {
  const insets = useSafeAreaInsets();
  const clientName = authenticatedClient
    ? `${authenticatedClient.firstName} ${authenticatedClient.lastName}`.trim()
    : "Brian Monteza";
  const location = authenticatedClient?.address || "Chiclayo, Peru";
  const navigationHeight = 62 + Math.max(insets.bottom, 8);

  return (
    <View style={local.homeScreen}>
      <ScrollView
        contentContainerStyle={[local.homeScrollContent, { paddingBottom: navigationHeight + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={local.homeHeader}>
          <View style={local.headerMainRow}>
            <View style={local.headerCopy}>
              <Text style={local.headerEyebrow}>Bienvenido</Text>
              <Text style={local.headerName}>{clientName}</Text>
            </View>
            <Pressable accessibilityLabel="Ver notificaciones" hitSlop={10} style={local.notificationButton}>
              <Ionicons name="notifications-outline" size={21} color={palette.white} />
              <View style={local.notificationDot} />
            </Pressable>
          </View>
          <View style={local.locationRow}>
            <Ionicons name="location-outline" size={17} color="#B9D3E8" />
            <Text numberOfLines={1} style={local.headerLocation}>{location}</Text>
          </View>
        </View>

        <View style={local.homeBody}>
          <View style={local.newNeedPanel}>
            <View style={local.newNeedCopy}>
              <Text style={local.newNeedTitle}>¿Tienes otra necesidad?</Text>
            </View>
            <Pressable style={local.newNeedButton}>
              <Ionicons name="add" size={19} color={palette.white} />
              <Text style={local.newNeedButtonText}>Publicar otra</Text>
            </Pressable>
          </View>

          <Text style={local.sectionTitle}>Tu publicacion activa</Text>
          <ActiveNeedCard need={activeNeed} />

          <Text style={local.sectionTitle}>Actividad reciente</Text>
          <WorkerResponsePreview response={activeNeed.latestResponse} />

          <View style={local.safetyNote}>
            <Ionicons name="shield-checkmark-outline" size={21} color={palette.blue} />
            <Text style={local.safetyText}>
              Revisa la identidad, el oficio y la propuesta antes de contactar al trabajador.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ClientBottomNavigation bottomInset={Math.max(insets.bottom, 8)} />
    </View>
  );
}

function ActiveNeedCard({ need }: { need: ActiveNeed }) {
  const hasResponses = need.interestedWorkers > 0;

  return (
    <View style={local.needCard}>
      <View style={local.needMetaRow}>
        <View style={local.statusPill}>
          <View style={local.statusDot} />
          <Text style={local.statusText}>Publicada</Text>
        </View>
        <Text style={local.timeText}>{need.publishedAgo}</Text>
      </View>
      <Text style={local.needTitle}>{need.title}</Text>
      <View style={local.needLocationRow}>
        <Ionicons name="business-outline" size={16} color={palette.muted} />
        <Text style={local.needLocation}>{need.property} · {need.location}</Text>
      </View>

      <View style={local.responseSummary}>
        <View style={local.avatarStack}>
          <View style={local.workerAvatar}><Text style={local.workerInitials}>JP</Text></View>
          {need.interestedWorkers > 1 ? (
            <View style={[local.workerAvatar, local.workerAvatarOffset]}><Text style={local.workerInitials}>CM</Text></View>
          ) : null}
        </View>
        <View style={local.responseCopy}>
          <Text style={local.responseCount}>
            {hasResponses ? `${need.interestedWorkers} trabajadores interesados` : "Esperando respuestas"}
          </Text>
          <Text style={local.responseHint}>
            {hasResponses ? "Compara sus propuestas y perfiles" : "Te avisaremos cuando un trabajador responda"}
          </Text>
        </View>
      </View>

      <Pressable disabled={!hasResponses} style={[local.responsesButton, !hasResponses && local.disabledButton]}>
        <Text style={[local.responsesButtonText, !hasResponses && local.disabledButtonText]}>Ver respuestas</Text>
        <Ionicons name="arrow-forward" size={18} color={hasResponses ? palette.white : palette.muted} />
      </Pressable>
    </View>
  );
}

function WorkerResponsePreview({ response }: { response: ActiveNeed["latestResponse"] }) {
  if (!response) {
    return (
      <View style={local.activityEmpty}>
        <Ionicons name="chatbubble-ellipses-outline" size={23} color={palette.muted} />
        <Text style={local.activityEmptyText}>Aun no hay respuestas para esta publicacion.</Text>
      </View>
    );
  }

  return (
    <View style={local.activityRow}>
      <View style={local.activityAvatar}>
        <Text style={local.activityInitials}>JP</Text>
      </View>
      <View style={local.activityCopy}>
        <View style={local.activityHeader}>
          <Text style={local.activityName}>{response.workerName} respondio</Text>
          <Text style={local.activityTime}>{response.receivedAgo}</Text>
        </View>
        <Text style={local.activityMessage}>“{response.message}”</Text>
      </View>
    </View>
  );
}

function ClientBottomNavigation({ bottomInset }: { bottomInset: number }) {
  return (
    <View style={[local.bottomNavigation, { paddingBottom: bottomInset }] }>
      <ClientNavItem active icon="home" label="Inicio" />
      <ClientNavItem icon="reader-outline" label="Publicaciones" />
      <ClientNavItem icon="person-outline" label="Perfil" />
    </View>
  );
}

function ClientNavItem({
  active = false,
  icon,
  label
}: {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <Pressable accessibilityState={{ selected: active }} style={local.navItem}>
      <View style={[local.navIconWrap, active && local.navIconWrapActive]}>
        <Ionicons name={icon} size={20} color={active ? palette.ink : palette.muted} />
      </View>
      <Text style={[local.navLabel, active && local.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  successTopBand: { position: "absolute", left: 0, right: 0, top: 0, height: 44, backgroundColor: palette.ink, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  successContent: { width: "100%", paddingHorizontal: 28, alignItems: "center", gap: 16 },
  successIcon: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", backgroundColor: palette.green },
  successTitle: { color: palette.ink, fontSize: 23, lineHeight: 29, fontWeight: "900", textAlign: "center" },
  successMessage: { color: palette.inkSoft, fontSize: 15, lineHeight: 22, textAlign: "center" },
  successButton: { width: "100%", minHeight: 48, borderRadius: 24, marginTop: 16, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  successButtonText: { color: palette.white, fontSize: 15, fontWeight: "900" },
  homeScreen: { flex: 1, backgroundColor: palette.paper },
  homeScrollContent: { flexGrow: 1 },
  homeHeader: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 20, backgroundColor: palette.ink, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerMainRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  headerCopy: { flex: 1 },
  headerEyebrow: { color: "#B9D3E8", fontSize: 13, lineHeight: 17 },
  headerName: { color: palette.white, fontSize: 21, lineHeight: 27, fontWeight: "900", marginTop: 2 },
  notificationButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  notificationDot: { position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: palette.cyan, borderWidth: 1, borderColor: palette.ink },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  headerLocation: { flex: 1, color: "#D5E5F1", fontSize: 13 },
  homeBody: { paddingHorizontal: 15, paddingTop: 16 },
  newNeedPanel: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 17, backgroundColor: "#DCEEFF", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  newNeedCopy: { flex: 1 },
  newNeedTitle: { color: palette.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  newNeedButton: { minHeight: 40, borderRadius: 20, paddingHorizontal: 13, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  newNeedButtonText: { color: palette.white, fontSize: 12, fontWeight: "900" },
  sectionTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "900", marginTop: 20, marginBottom: 10 },
  needCard: { padding: 15, borderRadius: 17, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  needMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: palette.softBlue },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.blue },
  statusText: { color: palette.blue, fontSize: 12, fontWeight: "900" },
  timeText: { color: palette.muted, fontSize: 12 },
  needTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: "900", marginTop: 14 },
  needLocationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 },
  needLocation: { color: palette.muted, fontSize: 13 },
  responseSummary: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "#E7ECF2", marginTop: 15, paddingTop: 14 },
  avatarStack: { width: 56, height: 36, flexDirection: "row", alignItems: "center" },
  workerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.ink, borderWidth: 2, borderColor: palette.white, alignItems: "center", justifyContent: "center" },
  workerAvatarOffset: { marginLeft: -12, backgroundColor: palette.blue },
  workerInitials: { color: palette.white, fontSize: 10, fontWeight: "900" },
  responseCopy: { flex: 1 },
  responseCount: { color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  responseHint: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  responsesButton: { minHeight: 43, borderRadius: 22, marginTop: 14, backgroundColor: palette.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  responsesButtonText: { color: palette.white, fontSize: 14, fontWeight: "900" },
  disabledButton: { backgroundColor: "#E0E6ED" },
  disabledButtonText: { color: palette.muted },
  activityRow: { flexDirection: "row", gap: 11, padding: 14, borderRadius: 16, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  activityAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  activityInitials: { color: palette.white, fontSize: 11, fontWeight: "900" },
  activityCopy: { flex: 1 },
  activityHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  activityName: { flex: 1, color: palette.ink, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  activityTime: { color: palette.muted, fontSize: 11 },
  activityMessage: { color: palette.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 7 },
  activityEmpty: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  activityEmptyText: { flex: 1, color: palette.muted, fontSize: 13, lineHeight: 18 },
  safetyNote: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 13, padding: 12, borderRadius: 14, backgroundColor: "#EAF1F7" },
  safetyText: { flex: 1, color: palette.inkSoft, fontSize: 12, lineHeight: 18 },
  bottomNavigation: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 62, paddingTop: 5, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line, flexDirection: "row" },
  navItem: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", gap: 2 },
  navIconWrap: { width: 42, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navIconWrapActive: { backgroundColor: "#DCE6F0" },
  navLabel: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: palette.ink, fontWeight: "900" }
});
