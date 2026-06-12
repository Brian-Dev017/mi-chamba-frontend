import {
  Field,
  Ionicons,
  PrimaryButton,
  ScreenFrame,
  styles
} from "../../components/ui";
import { Text, View } from "react-native";

export function LoadingScreen() {
  return (
    <ScreenFrame centered>
      <View style={local.loadingRing}>
        <View style={local.logoBadge}>
          <Text style={local.logoMark}>MC</Text>
        </View>
      </View>
    </ScreenFrame>
  );
}

export function LoginScreen() {
  return (
    <ScreenFrame>
      <View style={local.logoBlock}>
        <Text style={local.logoWord}>MI CHAMBA</Text>
        <Text style={local.logoSub}>Servicios rapidos y confiables</Text>
      </View>
      <Text style={local.errorText}>Usuario o contrasena incorrectos</Text>
      <Field label="DNI / Usuario" placeholder="Ej: 12345678" />
      <Field label="Contrasena" placeholder="Ingrese su contrasena" secure />
      <View style={styles.rowBetween}>
        <View style={local.checkRow}>
          <View style={local.checkbox} />
          <Text style={styles.smallMuted}>Recordar contrasena</Text>
        </View>
        <Text style={local.linkText}>Olvidaste tu{"\n"}contrasena?</Text>
      </View>
      <PrimaryButton label="Iniciar Sesion" />
      <View style={styles.centerStack}>
        <Text style={styles.bodyText}>No tienes cuenta?</Text>
        <Text style={styles.linkTextStrong}>Registrate</Text>
      </View>
    </ScreenFrame>
  );
}

export function ProfileSelectionScreen() {
  return (
    <ScreenFrame gradient>
      <View style={local.heroTop}>
        <Text style={local.heroTitle}>Encuentra el servicio que necesitas cuando lo necesitas</Text>
        <Text style={local.heroQuestion}>Cual es tu perfil?</Text>
      </View>
      <View style={local.roleGrid}>
        <RoleCard icon="person-outline" label="Cliente" />
        <RoleCard icon="construct-outline" label="Trabajador" selected />
      </View>
      <PrimaryButton label="Continuar" />
    </ScreenFrame>
  );
}

function RoleCard({
  icon,
  label,
  selected
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected?: boolean;
}) {
  return (
    <View style={[local.roleCard, selected && local.roleCardSelected]}>
      <Ionicons name={icon} size={42} color={selected ? "#1976D2" : "#021B30"} />
      <Text style={styles.cardTitle}>{label}</Text>
    </View>
  );
}

const local = {
  logoBlock: { alignItems: "center" as const, marginTop: 54, marginBottom: 18 },
  logoWord: { color: "#021B30", fontSize: 30, fontWeight: "900" as const },
  logoSub: { color: "#12324A", fontSize: 16, marginTop: 12 },
  errorText: { color: "#EF4444", textAlign: "center" as const, fontSize: 14 },
  checkRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF"
  },
  linkText: { color: "#1976D2", fontSize: 14, fontWeight: "700" as const, textAlign: "right" as const },
  heroTop: { marginTop: 58, gap: 28 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800" as const,
    textAlign: "center" as const
  },
  heroQuestion: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900" as const,
    textAlign: "center" as const
  },
  roleGrid: { gap: 20, marginVertical: 34 },
  roleCard: {
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12,
    borderWidth: 2,
    borderColor: "transparent"
  },
  roleCardSelected: { borderColor: "#00B8FF" },
  loadingRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1976D2",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  logoBadge: {
    width: 152,
    height: 128,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  logoMark: { color: "#021B30", fontSize: 36, fontWeight: "900" as const }
};
