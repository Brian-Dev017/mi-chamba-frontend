import {
  ConfirmationDialog,
  Ionicons,
  ScreenFrame,
  styles
} from "../../components/ui";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, TextInput, View } from "react-native";
import type { ScreenRenderProps, UserRole } from "../../types/domain";

export function LoadingScreen({ navigate }: ScreenRenderProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1050,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true
    }).start();
    spin.start();

    const timer = setTimeout(() => {
      spin.stop();
      navigate("workerHome");
    }, 1800);

    return () => {
      clearTimeout(timer);
      spin.stop();
    };
  }, [navigate, opacity, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <ScreenFrame noPadding scrollable={false}>
      <View style={local.loadingTopBand} />
      <Animated.View style={[local.loadingScreen, { opacity }]}>
        <View style={local.loadingOrbit}>
          <Animated.View style={[local.loadingArc, { transform: [{ rotate }] }]} />
          <View style={local.loadingLogoBadge}>
            <Text style={local.logoMarkBlue}>MC</Text>
            <Text style={local.logoWordSmall}>Mi Chamba</Text>
          </View>
        </View>
      </Animated.View>
    </ScreenFrame>
  );
}

export function LoginScreen({
  navigate,
  registeredWorkers,
  resetRegistrationDraft,
  setAuthenticatedWorker
}: ScreenRenderProps) {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvalidCredentials, setShowInvalidCredentials] = useState(false);

  const handleLogin = () => {
    const worker = registeredWorkers.find(
      (registeredWorker) => registeredWorker.documentNumber === dni && registeredWorker.password === password
    );

    if (!worker) {
      setShowInvalidCredentials(true);
      return;
    }

    setShowInvalidCredentials(false);
    setAuthenticatedWorker(worker);
    navigate("loading");
  };

  return (
    <ScreenFrame noPadding scrollable={false}>
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
          maxLength={8}
          onChangeText={(value) => setDni(value.replace(/\D/g, "").slice(0, 8))}
          placeholder="12345678"
          value={dni}
        />
        <LoginField
          icon="lock-closed-outline"
          label="Contrasena"
          onChangeText={(value) => setPassword(value)}
          onToggleSecure={() => setShowPassword((current) => !current)}
          placeholder="Ingrese su contrasena"
          secure={!showPassword}
          toggleIcon={showPassword ? "eye-outline" : "eye-off-outline"}
          value={password}
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
          onPress={handleLogin}
          style={local.loginButton}
        >
          <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
          <Text style={local.loginButtonText}>Iniciar Sesion</Text>
        </Pressable>

        <View style={local.loginDivider} />

        <View style={styles.centerStack}>
          <Text style={local.registerPrompt}>No tienes cuenta?</Text>
          <Pressable
            onPress={() => {
              resetRegistrationDraft();
              navigate("profileSelection");
            }}
            style={({ pressed }) => [local.registerButton, pressed && local.registerButtonPressed]}
          >
            <Text style={local.registerLink}>Registrate</Text>
          </Pressable>
        </View>
      </View>
    </ScreenFrame>
  );
}

function LoginField({
  icon,
  keyboardType,
  label,
  maxLength,
  onChangeText,
  onToggleSecure,
  placeholder,
  secure,
  toggleIcon,
  value
}: {
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "numeric";
  label: string;
  maxLength?: number;
  onChangeText?: (value: string) => void;
  onToggleSecure?: () => void;
  placeholder: string;
  secure?: boolean;
  toggleIcon?: keyof typeof Ionicons.glyphMap;
  value?: string;
}) {
  return (
    <View style={local.loginFieldBlock}>
      <Text style={local.loginFieldLabel}>{label}</Text>
      <View style={local.loginInputShell}>
        <Ionicons name={icon} size={20} color="#1677F2" />
        <TextInput
          keyboardType={keyboardType}
          maxLength={maxLength}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B6BEC9"
          secureTextEntry={secure}
          style={local.loginInput}
          value={value}
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

export function ProfileSelectionScreen({ navigate, resetRegistrationDraft }: ScreenRenderProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const toggleRole = (role: UserRole) => {
    setSelectedRole((currentRole) => (currentRole === role ? null : role));
  };

  return (
    <ScreenFrame noPadding scrollable={false}>
      <View style={local.profileTopBand} />
      <View style={local.profileContent}>
        <Text style={local.profileIntro}>Encuentra el servicio que{"\n"}necesitas cuando lo necesitas</Text>
        <Text style={local.profileQuestion}>¿Cuál es tu perfil?</Text>

        <View style={local.profileRoleGrid}>
          <RoleCard
            icon="person-add-outline"
            label="Cliente"
            onPress={() => toggleRole("client")}
            selected={selectedRole === "client"}
          />
          <RoleCard
            icon="briefcase-outline"
            label="Trabajador"
            onPress={() => toggleRole("worker")}
            selected={selectedRole === "worker"}
          />
        </View>

        <View style={local.profileActions}>
          <Pressable
            disabled={!selectedRole}
            onPress={() => {
              navigate(selectedRole === "client" ? "clientPersonalInformation" : "personalInformation");
            }}
            style={[local.profileContinueButton, !selectedRole && local.profileContinueButtonDisabled]}
          >
            <Text style={[local.profileContinueText, !selectedRole && local.profileContinueTextDisabled]}>
              Continuar
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setIsCancelConfirmOpen(true)}
            style={({ pressed }) => [local.cancelButton, pressed && local.cancelButtonPressed]}
          >
            <Text style={local.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
      <ConfirmationDialog
        confirmLabel="Cancelar registro"
        message="Estas cancelando el registro. Si confirmas, se perdera la informacion ingresada."
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          setIsCancelConfirmOpen(false);
          resetRegistrationDraft();
          navigate("login");
        }}
        title="Cancelar registro?"
        visible={isCancelConfirmOpen}
      />
    </ScreenFrame>
  );
}

function RoleCard({
  icon,
  label,
  onPress,
  selected
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[local.roleCard, selected && local.roleCardSelected]}>
      {selected ? (
        <View style={local.roleCheck}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : null}
      <View style={local.roleIconCircle}>
        <Ionicons name={icon} size={36} color="#1976D2" />
      </View>
      <Text style={local.roleLabel}>{label}</Text>
    </Pressable>
  );
}

const local = {
  loginTopBand: {
    height: 42,
    marginTop: -3,
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
  registerButton: { borderBottomWidth: 1, borderBottomColor: "transparent" },
  registerButtonPressed: { borderBottomColor: "#58A8FF", opacity: 0.72 },
  registerLink: { color: "#006FE6", fontSize: 15, fontWeight: "800" as const },
  profileTopBand: {
    height: 42,
    marginTop: -3,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 23,
    paddingTop: 18,
    paddingBottom: 34
  },
  profileIntro: {
    color: "#09243A",
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center" as const,
    fontWeight: "500" as const
  },
  profileQuestion: {
    color: "#09243A",
    fontSize: 23,
    fontWeight: "900" as const,
    textAlign: "center" as const,
    marginTop: 10,
    marginBottom: 30
  },
  profileRoleGrid: { gap: 24 },
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
    minHeight: 148,
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1677F2",
    position: "relative" as const
  },
  roleCardSelected: {
    borderColor: "#00B8FF",
    borderWidth: 2,
    shadowColor: "#00B8FF",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  roleIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DDEAFF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  roleCheck: {
    position: "absolute" as const,
    right: -2,
    top: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#00B8FF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  roleLabel: { color: "#101820", fontSize: 13, fontWeight: "700" as const },
  profileActions: { gap: 12, marginTop: 68 },
  cancelButton: {
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5484D",
    backgroundColor: "#FFF5F5",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  cancelButtonPressed: { backgroundColor: "#FFE8E8", borderColor: "#C92A2A" },
  cancelButtonText: { color: "#C92A2A", fontSize: 14, fontWeight: "800" as const },
  profileContinueButton: {
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  profileContinueButtonDisabled: { backgroundColor: "#D6DEE8" },
  profileContinueText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" as const },
  profileContinueTextDisabled: { color: "#6D7B88" },
  loadingTopBand: {
    height: 42,
    marginTop: 10,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  loadingOrbit: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    position: "relative" as const
  },
  loadingArc: {
    position: "absolute" as const,
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 16,
    borderColor: "rgba(255, 255, 255, 0.96)",
    borderRightColor: "#1976D2",
    borderBottomColor: "#1976D2"
  },
  loadingLogoBadge: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
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
