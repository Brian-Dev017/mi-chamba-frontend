import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { screenRegistry } from "./screenRegistry";
import { palette } from "../theme/palette";
import type { RegistrationDraft, ScreenKey } from "../types/domain";

const initialRegistrationDraft: RegistrationDraft = {
  firstName: "",
  lastName: "",
  birthDate: "",
  documentType: null,
  documentNumber: "",
  professionalTrade: null,
  certificateUri: null
};

export default function MiChambaPrototype() {
  const [activeKey, setActiveKey] = useState<ScreenKey>("login");
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(initialRegistrationDraft);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [pendingProfilePhotoUri, setPendingProfilePhotoUri] = useState<string | null>(null);
  const [frontDniPhotoUri, setFrontDniPhotoUri] = useState<string | null>(null);
  const [backDniPhotoUri, setBackDniPhotoUri] = useState<string | null>(null);
  const [pendingDniPhotoUri, setPendingDniPhotoUri] = useState<string | null>(null);
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
    setPendingDniPhotoUri
  };

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView style={styles.nativeShell}>
        <StatusBar style="dark" />
        <View style={styles.nativeScreen}>
          <ActiveScreen {...screenProps} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.shell}>
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
          <ActiveScreen {...screenProps} />
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
