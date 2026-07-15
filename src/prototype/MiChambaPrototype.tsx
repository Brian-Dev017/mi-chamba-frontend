import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { screenRegistry } from "./screenRegistry";
import { palette } from "../theme/palette";
import { workerRequests as initialWorkerRequests } from "../data/mockData";
import { registerClientInMemory } from "../services/api/clientRegistration";
import { AccessibilityProvider } from "../accessibility/AccessibilityContext";
import type {
  RegisteredClient,
  RegisteredWorker,
  RegistrationDraft,
  ScreenKey,
  UserRole
} from "../types/domain";

const initialRegistrationDraft: RegistrationDraft = {
  firstName: "",
  lastName: "",
  birthDate: "",
  documentType: null,
  documentNumber: "",
  professionalTrade: null,
  certificateUri: null,
  clientPhone: "",
  clientPassword: "",
  clientPasswordConfirmation: "",
  clientAddress: "",
  clientLatitude: null,
  clientLongitude: null,
  clientPropertyType: null,
  clientReferenceDetails: "",
  workerPassword: "",
  workerPasswordConfirmation: ""
};

export default function MiChambaPrototype() {
  useFonts({
    OpenDyslexic: require("../../assets/fonts/OpenDyslexic-Regular.otf"),
    "OpenDyslexic-Bold": require("../../assets/fonts/OpenDyslexic-Bold.otf")
  });

  return (
    <AccessibilityProvider>
      <MiChambaPrototypeContent />
    </AccessibilityProvider>
  );
}

function MiChambaPrototypeContent() {
  const [activeKey, setActiveKey] = useState<ScreenKey>("login");
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(initialRegistrationDraft);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [pendingProfilePhotoUri, setPendingProfilePhotoUri] = useState<string | null>(null);
  const [frontDniPhotoUri, setFrontDniPhotoUri] = useState<string | null>(null);
  const [backDniPhotoUri, setBackDniPhotoUri] = useState<string | null>(null);
  const [pendingDniPhotoUri, setPendingDniPhotoUri] = useState<string | null>(null);
  const [registeredWorkers, setRegisteredWorkers] = useState<RegisteredWorker[]>([]);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [authenticatedClient, setAuthenticatedClient] = useState<RegisteredClient | null>(null);
  const [authenticatedWorker, setAuthenticatedWorker] = useState<RegisteredWorker | null>(null);
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);
  const [workerRequests, setWorkerRequests] = useState(initialWorkerRequests);
  const [selectedWorkerJobId, setSelectedWorkerJobId] = useState<string | null>(null);
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(true);
  const screens = useMemo(() => screenRegistry, []);
  const activeScreen = screens.find((screen) => screen.key === activeKey) ?? screens[0];
  const ActiveScreen = activeScreen.render;

  const resetRegistrationDraft = useCallback(() => {
    setRegistrationDraft(initialRegistrationDraft);
    setProfilePhotoUri(null);
    setPendingProfilePhotoUri(null);
    setFrontDniPhotoUri(null);
    setBackDniPhotoUri(null);
    setPendingDniPhotoUri(null);
  }, []);

  const registerWorker = useCallback(() => {
    const {
      birthDate,
      documentNumber,
      documentType,
      firstName,
      lastName,
      professionalTrade,
      certificateUri,
      workerPassword
    } = registrationDraft;

    if (!documentType || !professionalTrade || !documentNumber || !workerPassword) {
      throw new Error("Completa todos los datos obligatorios del trabajador.");
    }

    if (!frontDniPhotoUri || !backDniPhotoUri) {
      throw new Error("Adjunta el anverso y reverso de la cedula de identidad.");
    }

    const documentAlreadyExists =
      registeredClients.some((client) => client.documentNumber === documentNumber) ||
      registeredWorkers.some((worker) => worker.documentNumber === documentNumber);

    if (documentAlreadyExists) {
      throw new Error("Ya existe una cuenta registrada con este documento.");
    }

    const worker: RegisteredWorker = {
      id: documentNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      documentType,
      documentNumber,
      password: workerPassword,
      professionalTrade,
      certificateUri,
      profilePhotoUri,
      frontIdentityPhotoUri: frontDniPhotoUri,
      backIdentityPhotoUri: backDniPhotoUri
    };

    setRegisteredWorkers((currentWorkers) => [
      ...currentWorkers.filter((currentWorker) => currentWorker.documentNumber !== documentNumber),
      worker
    ]);
  }, [backDniPhotoUri, frontDniPhotoUri, profilePhotoUri, registeredClients, registeredWorkers, registrationDraft]);

  const registerClient = useCallback(async () => {
    const documentNumber = registrationDraft.documentNumber;
    const documentAlreadyExists =
      registeredClients.some((client) => client.documentNumber === documentNumber) ||
      registeredWorkers.some((worker) => worker.documentNumber === documentNumber);

    if (documentAlreadyExists) {
      throw new Error("Ya existe una cuenta registrada con este documento.");
    }

    const client = await registerClientInMemory(registrationDraft);

    setRegisteredClients((currentClients) => [
      ...currentClients.filter((currentClient) => currentClient.documentNumber !== client.documentNumber),
      client
    ]);
  }, [registeredClients, registeredWorkers, registrationDraft]);

  const screenProps = {
    navigate: setActiveKey,
    registrationDraft,
    setRegistrationDraft,
    resetRegistrationDraft,
    profilePhotoUri,
    setProfilePhotoUri,
    pendingProfilePhotoUri,
    setPendingProfilePhotoUri,
    frontDniPhotoUri,
    setFrontDniPhotoUri,
    backDniPhotoUri,
    setBackDniPhotoUri,
    pendingDniPhotoUri,
    setPendingDniPhotoUri,
    registeredWorkers,
    registerWorker,
    registeredClients,
    registerClient,
    authenticatedClient,
    setAuthenticatedClient,
    authenticatedWorker,
    setAuthenticatedWorker,
    authenticatedRole,
    setAuthenticatedRole,
    workerRequests,
    setWorkerRequests,
    selectedWorkerJobId,
    setSelectedWorkerJobId,
    isWorkerAvailable,
    setIsWorkerAvailable
  };

  if (Platform.OS !== "web") {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.nativeShell}>
          <StatusBar style="dark" />
          <View style={styles.nativeScreen}>
            <ActiveScreen {...screenProps} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.shell}>
        <StatusBar style="dark" />
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewEyebrow}>MI CHAMBA / Alta fidelidad</Text>
            <Text style={styles.previewTitle}>{activeScreen.title}</Text>
          </View>
          <Text style={styles.previewCount}>
            {screens.findIndex((screen) => screen.key === activeKey) + 1}/{screens.length}
          </Text>
        </View>

        <View style={styles.phoneStage}>
          <View style={styles.phone}>
            <View style={styles.phoneViewport}>
              <ActiveScreen {...screenProps} />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.screenRail}
        >
          {screens.map((screen) => (
            <Pressable
              key={screen.key}
              onPress={() => setActiveKey(screen.key)}
              style={[styles.screenChip, activeKey === screen.key && styles.screenChipActive]}
            >
              <Text
                numberOfLines={1}
                style={[styles.screenChipText, activeKey === screen.key && styles.screenChipTextActive]}
              >
                {screen.title}
              </Text>
              <Text style={styles.screenChipGroup}>{screen.group}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  nativeShell: {
    flex: 1,
    backgroundColor: palette.paper
  },
  nativeScreen: {
    flex: 1
  },
  shell: {
    flex: 1,
    backgroundColor: "#E8EEF5"
  },
  previewHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  previewEyebrow: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  previewTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  previewCount: {
    color: palette.ink,
    fontWeight: "800"
  },
  phoneStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  phone: {
    width: "100%",
    maxWidth: 390,
    height: "100%",
    maxHeight: 760,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: palette.white,
    borderWidth: 8,
    borderColor: "#101820",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8
  },
  phoneViewport: {
    flex: 1,
    marginTop: 12,
    marginBottom: 18,
    marginHorizontal: 0,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: palette.white
  },
  screenRail: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8
  },
  screenChip: {
    width: 150,
    padding: 10,
    borderRadius: 8,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line
  },
  screenChipActive: {
    backgroundColor: palette.ink,
    borderColor: palette.ink
  },
  screenChipText: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 12
  },
  screenChipTextActive: {
    color: palette.white
  },
  screenChipGroup: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 4
  }
});
