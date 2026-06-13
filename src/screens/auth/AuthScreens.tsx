import {
  Ionicons,
  PrimaryButton,
  ScreenFrame,
  styles
} from "../../components/ui";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvalidCredentials, setShowInvalidCredentials] = useState(false);

  return (
    <ScreenFrame noPadding>
      <View style={local.loginTopBand} />
      <View style={local.loginCard}>
        <View style={local.logoBlock}>
          <Text style={local.logoMarkBlue}>MC</Text>
          <Text style={local.logoWordSmall}>Mi Chamba</Text>
        </View>

        <Text style={local.logoSub}>Servicios rapidos y confiables</Text>

        {showInvalidCredentials ? (
          <View style={local.errorRow}>
            <Ionicons name="warning-outline" size={22} color="#B00000" />
            <Text style={local.errorText}>Usuario o contrasena incorrectos</Text>
          </View>
        ) : (
          <View style={local.errorPlaceholder} />
        )}

        <LoginField
          icon="person-outline"
          keyboardType="numeric"
          label="DNI / Usuario"
          placeholder="12345678"
        />
        <LoginField
          icon="lock-closed-outline"
          label="Contrasena"
          onToggleSecure={() => setShowPassword((current) => !current)}
          placeholder="Ingrese su contrasena"
          secure={!showPassword}
          toggleIcon={showPassword ? "eye-off-outline" : "eye-outline"}
        />

        <View style={local.loginOptionsRow}>
          <Pressable
            onPress={() => setRememberPassword((current) => !current)}
            style={local.rememberButton}
          >
            <View style={[local.rememberCircle, rememberPassword && local.rememberCircleActive]}>
              {rememberPassword ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
            <Text style={local.rememberText}>Recordar contrasena</Text>
          </Pressable>

          <Text style={local.forgotText}>Olvidaste tu{"\n"}contrasena?</Text>
        </View>

        <Pressable
          onPress={() => setShowInvalidCredentials(true)}
          style={local.loginButton}
        >
          <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
          <Text style={local.loginButtonText}>Iniciar Sesion</Text>
        </Pressable>

        <View style={local.loginDivider} />

        <View style={styles.centerStack}>
          <Text style={local.registerPrompt}>No tienes cuenta?</Text>
          <Text style={local.registerLink}>Registrate</Text>
        </View>
      </View>
    </ScreenFrame>
  );
}

function LoginField({
  icon,
  keyboardType,
  label,
  onToggleSecure,
  placeholder,
  secure,
  toggleIcon
}: {
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "numeric";
  label: string;
  onToggleSecure?: () => void;
  placeholder: string;
  secure?: boolean;
  toggleIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={local.loginFieldBlock}>
      <Text style={local.loginFieldLabel}>{label}</Text>
      <View style={local.loginInputShell}>
        <Ionicons name={icon} size={20} color="#1677F2" />
        <TextInput
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#B6BEC9"
          secureTextEntry={secure}
          style={local.loginInput}
        />
        {toggleIcon && onToggleSecure ? (
          <Pressable onPress={onToggleSecure} hitSlop={10}>
            <Ionicons name={toggleIcon} size={22} color="#1677F2" />
          </Pressable>
        ) : null}
      </View>
    </View>
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
  loginTopBand: {
    height: 52,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  loginCard: {
    margin: 14,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#C9D1DB",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    gap: 16
  },
  logoBlock: { alignItems: "center" as const, marginBottom: 4 },
  logoMarkBlue: { color: "#3B7DBB", fontSize: 50, fontWeight: "900" as const, letterSpacing: -4 },
  logoWordSmall: { color: "#194A7A", fontSize: 14, fontWeight: "900" as const, marginTop: -8 },
  logoSub: { color: "#303A45", fontSize: 16, marginTop: 8, marginBottom: 10, textAlign: "center" as const },
  errorRow: {
    minHeight: 28,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  errorPlaceholder: { height: 28 },
  errorText: { color: "#B00000", textAlign: "center" as const, fontSize: 13, fontWeight: "800" as const },
  loginFieldBlock: { gap: 8 },
  loginFieldLabel: { color: "#101820", fontSize: 14, fontWeight: "800" as const },
  loginInputShell: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1677F2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6
  },
  loginInput: { flex: 1, color: "#021B30", fontSize: 16, paddingVertical: 0 },
  loginOptionsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    marginTop: 4
  },
  rememberButton: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, flexShrink: 1 },
  rememberCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#C4CAD3",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FFFFFF"
  },
  rememberCircleActive: { borderColor: "#1677F2", backgroundColor: "#1677F2" },
  rememberText: { color: "#4A515A", fontSize: 13, fontWeight: "600" as const },
  forgotText: { color: "#006FE6", fontSize: 13, fontWeight: "700" as const, textAlign: "right" as const },
  loginButton: {
    minHeight: 42,
    borderRadius: 22,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 28
  },
  loginButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" as const },
  loginDivider: { height: 1, backgroundColor: "#C9D1DB", marginTop: 18, marginBottom: 2 },
  registerPrompt: { color: "#101820", fontSize: 15, fontWeight: "700" as const },
  registerLink: { color: "#006FE6", fontSize: 15, fontWeight: "800" as const },
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
