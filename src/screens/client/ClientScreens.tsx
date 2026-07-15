import { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ResponsiveText as Text } from "../../components/ResponsiveText";
import { ConfirmationDialog, Ionicons, ScreenFrame } from "../../components/ui";
import { AccessibilitySettingsModal } from "../../accessibility/AccessibilitySettingsModal";
import { useAccessibility, useAccessibleInputStyle } from "../../accessibility/AccessibilityContext";
import { palette } from "../../theme/palette";
import type { PaymentMethod, RegisteredWorker, ScreenRenderProps, WorkerJob } from "../../types/domain";

type ClientSection = "Inicio" | "Publicaciones" | "Perfil";
type ServiceCategory = RegisteredWorker["professionalTrade"];

const serviceCategories: ServiceCategory[] = ["Cerrajero", "Plomero", "Pintor", "Gasfitero"];
const paymentMethods: PaymentMethod[] = ["Yape", "Plin", "Efectivo"];

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

export function ClientHomeScreen({
  authenticatedClient,
  navigate,
  setAuthenticatedClient,
  setAuthenticatedRole,
  setWorkerRequests,
  workerRequests
}: ScreenRenderProps) {
  const { highContrast, resetAccessibility } = useAccessibility();
  const accessibleInputStyle = useAccessibleInputStyle(14);
  const [activeSection, setActiveSection] = useState<ClientSection>("Inicio");
  const [isAccessibilityVisible, setAccessibilityVisible] = useState(false);
  const [isComposerVisible, setComposerVisible] = useState(false);
  const [isLogoutConfirmationVisible, setLogoutConfirmationVisible] = useState(false);
  const [needDraft, setNeedDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState<ServiceCategory | null>(null);
  const [photoDraftUri, setPhotoDraftUri] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethod | null>(null);
  const [selectedClientJobId, setSelectedClientJobId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const clientName = authenticatedClient
    ? `${authenticatedClient.firstName} ${authenticatedClient.lastName}`.trim()
    : "Brian Monteza";
  const location = authenticatedClient?.address || "Chiclayo, Peru";
  const navigationHeight = 70;
  const clientJobs = workerRequests.filter((job) => job.clientId === authenticatedClient?.id);
  const selectedChatJob = workerRequests.find((job) => job.id === selectedClientJobId);
  const normalizedPrice = Number(priceDraft.replace(",", "."));
  const canPublish = Boolean(
    authenticatedClient &&
      needDraft.trim() &&
      categoryDraft &&
      photoDraftUri &&
      paymentMethodDraft &&
      Number.isFinite(normalizedPrice) &&
      normalizedPrice > 0
  );

  const pickNeedImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permiso necesario", "Permite el acceso a tus fotos para adjuntar una imagen de la necesidad.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoDraftUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("No se pudo abrir la galeria", "Intenta seleccionar la imagen nuevamente.");
    }
  };

  const publishNeed = () => {
    if (!canPublish || !authenticatedClient || !categoryDraft || !photoDraftUri || !paymentMethodDraft) {
      return;
    }

    const jobId = `request-${Date.now()}`;
    const title = needDraft.trim();
    const formattedPrice = `S/ ${normalizedPrice.toFixed(2)}`;

    setWorkerRequests((currentJobs) => [
      {
        id: jobId,
        clientId: authenticatedClient.id,
        title,
        category: categoryDraft,
        location: authenticatedClient.address,
        price: formattedPrice,
        paymentMethod: paymentMethodDraft,
        time: "Ahora",
        status: "NUEVO",
        detail: {
          id: jobId,
          clientName: clientName,
          rating: "Nuevo",
          completedServices: 0,
          title,
          category: categoryDraft,
          description: title,
          address: authenticatedClient.address,
          distance: "Por calcular",
          availability: "A coordinar",
          materials: "Por coordinar",
          duration: "Por coordinar",
          paymentAmount: formattedPrice
        },
        referencePhotos: [photoDraftUri],
        messages: []
      },
      ...currentJobs
    ]);
    setNeedDraft("");
    setCategoryDraft(null);
    setPhotoDraftUri(null);
    setPriceDraft("");
    setPaymentMethodDraft(null);
    setComposerVisible(false);
    setActiveSection("Publicaciones");
  };

  const sendClientMessage = () => {
    const body = messageDraft.trim();

    if (!body || !selectedChatJob || !selectedChatJob.messages.some((message) => message.sender === "worker")) {
      return;
    }

    setWorkerRequests((currentJobs) =>
      currentJobs.map((job) =>
        job.id === selectedChatJob.id
          ? {
              ...job,
              messages: [
                ...job.messages,
                {
                  id: `message-${Date.now()}`,
                  body,
                  sentAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
                  sender: "client" as const
                }
              ]
            }
          : job
      )
    );
    setMessageDraft("");
  };

  const logout = () => {
    setLogoutConfirmationVisible(false);
    resetAccessibility();
    setAuthenticatedClient(null);
    setAuthenticatedRole(null);
    navigate("login");
  };

  return (
    <View style={[local.homeScreen, highContrast && local.highContrastScreen]}>
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
          {activeSection !== "Perfil" ? (
            <>
                <View style={[local.newNeedPanel, highContrast && local.highContrastSoftPanel]}>
                <View style={local.newNeedCopy}>
                  <Text style={local.newNeedTitle}>¿Tienes otra necesidad?</Text>
                </View>
                <Pressable onPress={() => setComposerVisible(true)} style={local.newNeedButton}>
                  <Ionicons name="add" size={19} color={palette.white} />
                  <Text style={local.newNeedButtonText}>Publicar otra</Text>
                </Pressable>
              </View>

              {isComposerVisible ? (
                <View style={[local.composerPanel, highContrast && local.highContrastCard]}>
                  <Text style={local.composerTitle}>Describe tu necesidad</Text>
                  <TextInput
                    maxLength={160}
                    multiline
                    onChangeText={setNeedDraft}
                    placeholder="Ej.: Necesito reparar una fuga de agua en la cocina"
                    placeholderTextColor="#8A97A4"
                    style={[local.composerInput, accessibleInputStyle, highContrast && local.highContrastInput]}
                    textAlignVertical="top"
                    value={needDraft}
                  />
                  <Text style={local.composerFieldLabel}>Categoria del servicio</Text>
                  <View style={local.optionGrid}>
                    {serviceCategories.map((category) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: categoryDraft === category }}
                        key={category}
                        onPress={() => setCategoryDraft(category)}
                        style={[local.optionChip, categoryDraft === category && local.optionChipActive]}
                      >
                        <Text style={[local.optionChipText, categoryDraft === category && local.optionChipTextActive]}>{category}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={local.composerFieldLabel}>Imagen de la necesidad</Text>
                  {photoDraftUri ? (
                    <View style={local.photoPreviewWrap}>
                      <Image accessibilityLabel="Imagen seleccionada de la necesidad" source={{ uri: photoDraftUri }} style={local.photoPreview} />
                      <Pressable onPress={pickNeedImage} style={local.replacePhotoButton}>
                        <Ionicons name="images-outline" size={17} color={palette.blue} />
                        <Text style={local.replacePhotoText}>Cambiar imagen</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable accessibilityLabel="Agregar imagen de la necesidad" onPress={pickNeedImage} style={local.addPhotoButton}>
                      <Ionicons name="camera-outline" size={21} color={palette.blue} />
                      <Text style={local.addPhotoText}>Agregar imagen</Text>
                    </Pressable>
                  )}
                  <Text style={local.composerFieldLabel}>Precio propuesto</Text>
                  <View style={[local.priceInputShell, highContrast && local.highContrastInput]}>
                    <Text style={local.pricePrefix}>S/</Text>
                    <TextInput
                      accessibilityLabel="Precio propuesto"
                      keyboardType="decimal-pad"
                      maxLength={8}
                      onChangeText={(value) => setPriceDraft(value.replace(/[^0-9.,]/g, ""))}
                      placeholder="0.00"
                      placeholderTextColor="#8A97A4"
                      style={[local.priceInput, accessibleInputStyle]}
                      value={priceDraft}
                    />
                  </View>
                  <Text style={local.composerFieldLabel}>Metodo de pago</Text>
                  <View style={local.optionGrid}>
                    {paymentMethods.map((method) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMethodDraft === method }}
                        key={method}
                        onPress={() => setPaymentMethodDraft(method)}
                        style={[local.optionChip, paymentMethodDraft === method && local.optionChipActive]}
                      >
                        <Text style={[local.optionChipText, paymentMethodDraft === method && local.optionChipTextActive]}>{method}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={local.composerActions}>
                    <Pressable onPress={() => setComposerVisible(false)} style={local.composerCancelButton}>
                      <Text style={local.composerCancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      accessibilityState={{ disabled: !canPublish }}
                      disabled={!canPublish}
                      onPress={publishNeed}
                      style={[local.composerPublishButton, !canPublish && local.disabledButton]}
                    >
                      <Text style={[local.composerPublishText, !canPublish && local.disabledButtonText]}>
                        Publicar
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <Text style={local.sectionTitle}>
                {activeSection === "Publicaciones" ? "Mis publicaciones" : "Tus publicaciones activas"}
              </Text>
              <View style={local.clientJobList}>
                {clientJobs.map((job) => (
                  <ActiveNeedCard
                    job={job}
                    key={job.id}
                    onOpenChat={() => setSelectedClientJobId(job.id)}
                  />
                ))}
              </View>

              {clientJobs.length === 0 ? (
                <View style={[local.activityEmpty, highContrast && local.highContrastCard]}>
                  <Ionicons name="reader-outline" size={23} color={palette.muted} />
                  <Text style={local.activityEmptyText}>Aun no tienes publicaciones. Crea una para recibir propuestas de trabajadores.</Text>
                </View>
              ) : null}

              {activeSection === "Inicio" ? (
                <>
                  <View style={local.safetyNote}>
                    <Ionicons name="shield-checkmark-outline" size={21} color={palette.blue} />
                    <Text style={local.safetyText}>
                      Revisa la identidad, el oficio y la propuesta antes de contactar al trabajador.
                    </Text>
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <ClientProfile
              address={location}
              document={authenticatedClient?.documentNumber ?? "No disponible"}
              name={clientName}
              phone={authenticatedClient?.phone ?? "No disponible"}
              onOpenAccessibility={() => setAccessibilityVisible(true)}
              onLogout={() => setLogoutConfirmationVisible(true)}
            />
          )}
        </View>
      </ScrollView>

      <ClientBottomNavigation active={activeSection} onNavigate={setActiveSection} />
      <ConfirmationDialog
        cancelLabel="Permanecer"
        confirmLabel="Cerrar sesion"
        message="Tendras que ingresar nuevamente tu documento y contrasena para volver."
        onCancel={() => setLogoutConfirmationVisible(false)}
        onConfirm={logout}
        title="Cerrar sesion?"
        visible={isLogoutConfirmationVisible}
      />
      <AccessibilitySettingsModal
        onClose={() => setAccessibilityVisible(false)}
        visible={isAccessibilityVisible}
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedClientJobId(null)}
        transparent
        visible={Boolean(selectedChatJob)}
      >
        <View style={local.chatOverlay}>
          <Pressable style={local.chatScrim} onPress={() => setSelectedClientJobId(null)} />
          <View accessibilityViewIsModal style={[local.chatSheet, highContrast && local.highContrastCard]}>
            <View style={local.chatHandle} />
            <View style={local.chatHeader}>
              <View style={local.chatHeaderCopy}>
                <Text accessibilityRole="header" style={local.chatTitle}>Conversacion del trabajo</Text>
                <Text numberOfLines={1} style={local.chatSubtitle}>{selectedChatJob?.title}</Text>
              </View>
              <Pressable accessibilityLabel="Cerrar conversacion" onPress={() => setSelectedClientJobId(null)} style={local.chatCloseButton}>
                <Ionicons name="close" size={20} color={palette.ink} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={local.chatHistoryContent} style={local.chatHistory}>
              {selectedChatJob?.messages.map((message) => (
                <View
                  key={message.id}
                  style={[local.chatBubble, message.sender === "client" ? local.chatBubbleClient : local.chatBubbleWorker]}
                >
                  <Text style={local.chatSender}>{message.sender === "client" ? "Tu" : "Trabajador"}</Text>
                  <Text style={local.chatBody}>{message.body}</Text>
                  <Text style={local.chatTime}>{message.sentAt}</Text>
                </View>
              ))}
            </ScrollView>
            <TextInput
              accessibilityLabel="Mensaje para el trabajador"
              multiline
              onChangeText={setMessageDraft}
              placeholder="Escribe tu respuesta"
              placeholderTextColor="#8A97A4"
              style={[local.chatInput, accessibleInputStyle, highContrast && local.highContrastInput]}
              textAlignVertical="top"
              value={messageDraft}
            />
            <Pressable
              accessibilityState={{ disabled: !messageDraft.trim() }}
              disabled={!messageDraft.trim()}
              onPress={sendClientMessage}
              style={[local.chatSendButton, !messageDraft.trim() && local.disabledButton]}
            >
              <Ionicons name="send" size={17} color={messageDraft.trim() ? palette.white : palette.muted} />
              <Text style={[local.chatSendText, !messageDraft.trim() && local.disabledButtonText]}>Enviar mensaje</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActiveNeedCard({ job, onOpenChat }: { job: WorkerJob; onOpenChat: () => void }) {
  const { highContrast } = useAccessibility();
  const hasWorkerMessage = job.messages.some((message) => message.sender === "worker");

  return (
    <View style={[local.needCard, highContrast && local.highContrastCard]}>
      <View style={local.needMetaRow}>
        <View style={local.statusPill}>
          <View style={local.statusDot} />
          <Text style={local.statusText}>{job.status}</Text>
        </View>
        <Text style={local.timeText}>{job.time}</Text>
      </View>
      {job.referencePhotos[0] ? (
        <Image accessibilityLabel={`Imagen de ${job.title}`} source={{ uri: job.referencePhotos[0] }} style={local.needPhoto} />
      ) : null}
      <Text style={local.needTitle}>{job.title}</Text>
      <View style={local.needLocationRow}>
        <Ionicons name="construct-outline" size={16} color={palette.muted} />
        <Text style={local.needLocation}>{job.category} · {job.location}</Text>
      </View>

      <View style={local.needPaymentRow}>
        <View>
          <Text style={local.needPaymentLabel}>Precio propuesto</Text>
          <Text style={local.needPaymentAmount}>{job.price}</Text>
        </View>
        <View style={local.paymentMethodPill}>
          <Text style={local.paymentMethodText}>{job.paymentMethod}</Text>
        </View>
      </View>
      <Text style={local.chatAvailabilityHint}>
        {hasWorkerMessage
          ? `${job.messages.length} mensaje${job.messages.length === 1 ? "" : "s"} en la conversacion`
          : "El chat se habilitara cuando un trabajador te escriba."}
      </Text>
      <Pressable
        accessibilityState={{ disabled: !hasWorkerMessage }}
        disabled={!hasWorkerMessage}
        onPress={onOpenChat}
        style={[local.responsesButton, !hasWorkerMessage && local.disabledButton]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={hasWorkerMessage ? palette.white : palette.muted} />
        <Text style={[local.responsesButtonText, !hasWorkerMessage && local.disabledButtonText]}>Abrir conversacion</Text>
      </Pressable>
    </View>
  );
}

function ClientProfile({
  address,
  document,
  name,
  onOpenAccessibility,
  onLogout,
  phone
}: {
  address: string;
  document: string;
  name: string;
  onOpenAccessibility: () => void;
  onLogout: () => void;
  phone: string;
}) {
  const { highContrast } = useAccessibility();
  return (
    <View>
      <Text style={local.profileTitle}>Mi perfil</Text>
      <View style={local.profileIdentity}>
        <View style={local.profileAvatar}><Ionicons name="person" size={26} color={palette.white} /></View>
        <View style={local.profileNameCopy}>
          <Text style={local.profileName}>{name}</Text>
          <Text style={local.profileVerified}>Identidad registrada</Text>
        </View>
      </View>
      <View style={local.profileDetails}>
        <ProfileDetail icon="card-outline" label="Documento" value={document} />
        <ProfileDetail icon="call-outline" label="Celular" value={phone} />
        <ProfileDetail icon="location-outline" label="Ubicacion" value={address} />
      </View>
      <Pressable
        accessibilityHint="Configura el tamaño del texto, el contraste y la lectura"
        accessibilityLabel="Accesibilidad"
        accessibilityRole="button"
        onPress={onOpenAccessibility}
        style={[local.profileAccessibilityButton, highContrast && local.highContrastCard]}
      >
        <View style={local.profileAccessibilityIcon}>
          <Ionicons name="accessibility-outline" size={21} color={palette.blue} />
        </View>
        <View style={local.profileAccessibilityCopy}>
          <Text style={local.profileAccessibilityTitle}>Accesibilidad</Text>
          <Text style={local.profileAccessibilityDescription}>Texto, contraste y lectura</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={palette.muted} />
      </Pressable>
      <Pressable onPress={onLogout} style={local.logoutButton}>
        <Ionicons name="log-out-outline" size={19} color="#C92A2A" />
        <Text style={local.logoutButtonText}>Cerrar sesion</Text>
      </Pressable>
    </View>
  );
}

function ProfileDetail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={local.profileDetailRow}>
      <Ionicons name={icon} size={20} color={palette.blue} />
      <View style={local.profileDetailCopy}>
        <Text style={local.profileDetailLabel}>{label}</Text>
        <Text style={local.profileDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ClientBottomNavigation({
  active,
  onNavigate
}: {
  active: ClientSection;
  onNavigate: (section: ClientSection) => void;
}) {
  const { highContrast } = useAccessibility();
  return (
    <View style={[local.bottomNavigation, highContrast && local.highContrastNavigation]}>
      <ClientNavItem active={active === "Inicio"} icon="home" label="Inicio" onPress={() => onNavigate("Inicio")} />
      <ClientNavItem active={active === "Publicaciones"} icon="reader-outline" label="Publicaciones" onPress={() => onNavigate("Publicaciones")} />
      <ClientNavItem active={active === "Perfil"} icon="person-outline" label="Perfil" onPress={() => onNavigate("Perfil")} />
    </View>
  );
}

function ClientNavItem({
  active = false,
  icon,
  label,
  onPress
}: {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityState={{ selected: active }} onPress={onPress} style={local.navItem}>
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
  highContrastScreen: { backgroundColor: "#FFFFFF" },
  highContrastCard: { backgroundColor: "#FFFFFF", borderColor: "#000000", borderWidth: 2 },
  highContrastSoftPanel: { backgroundColor: "#DCEEFF", borderColor: "#000000", borderWidth: 2 },
  highContrastInput: { color: "#000000", borderColor: "#000000", borderWidth: 2, backgroundColor: "#FFFFFF" },
  highContrastNavigation: { backgroundColor: "#FFFFFF", borderTopColor: "#000000", borderTopWidth: 2 },
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
  composerPanel: { marginTop: 10, padding: 14, borderRadius: 17, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  composerTitle: { color: palette.ink, fontSize: 14, fontWeight: "900", marginBottom: 9 },
  composerInput: { minHeight: 88, borderRadius: 13, borderWidth: 1, borderColor: "#B9C8D6", color: palette.ink, fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingVertical: 10 },
  composerFieldLabel: { color: palette.ink, fontSize: 12, fontWeight: "900", marginTop: 13, marginBottom: 7 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  optionChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: "#B9C8D6", paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: palette.white },
  optionChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  optionChipText: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  optionChipTextActive: { color: palette.white },
  addPhotoButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderStyle: "dashed", borderColor: palette.blue, backgroundColor: palette.softBlue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addPhotoText: { color: palette.blue, fontSize: 13, fontWeight: "900" },
  photoPreviewWrap: { gap: 8 },
  photoPreview: { width: "100%", height: 150, borderRadius: 14, backgroundColor: "#D7DEE5" },
  replacePhotoButton: { minHeight: 38, borderRadius: 19, alignSelf: "flex-start", paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 6 },
  replacePhotoText: { color: palette.blue, fontSize: 12, fontWeight: "800" },
  priceInputShell: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: "#B9C8D6", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  pricePrefix: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  priceInput: { flex: 1, minHeight: 44, color: palette.ink, fontSize: 14, paddingVertical: 0 },
  composerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 10 },
  composerCancelButton: { minHeight: 39, borderRadius: 20, paddingHorizontal: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  composerCancelText: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  composerPublishButton: { minHeight: 39, borderRadius: 20, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  composerPublishText: { color: palette.white, fontSize: 13, fontWeight: "900" },
  sectionTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: "900", marginTop: 20, marginBottom: 10 },
  clientJobList: { gap: 12 },
  needCard: { padding: 15, borderRadius: 17, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  needMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: palette.softBlue },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.blue },
  statusText: { color: palette.blue, fontSize: 12, fontWeight: "900" },
  timeText: { color: palette.muted, fontSize: 12 },
  needPhoto: { width: "100%", height: 145, borderRadius: 14, marginTop: 12, backgroundColor: "#D7DEE5" },
  needTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: "900", marginTop: 14 },
  needLocationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 },
  needLocation: { color: palette.muted, fontSize: 13 },
  needPaymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: "#E7ECF2", marginTop: 15, paddingTop: 12 },
  needPaymentLabel: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  needPaymentAmount: { color: palette.ink, fontSize: 18, fontWeight: "900", marginTop: 2 },
  paymentMethodPill: { borderRadius: 99, backgroundColor: palette.softBlue, paddingHorizontal: 11, paddingVertical: 6 },
  paymentMethodText: { color: palette.blue, fontSize: 11, fontWeight: "900" },
  chatAvailabilityHint: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 12 },
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
  expandedResponse: { marginTop: 12 },
  expandedResponseLabel: { color: palette.ink, fontSize: 12, fontWeight: "900", marginBottom: 7 },
  safetyNote: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 13, padding: 12, borderRadius: 14, backgroundColor: "#EAF1F7" },
  safetyText: { flex: 1, color: palette.inkSoft, fontSize: 12, lineHeight: 18 },
  profileTitle: { color: palette.ink, fontSize: 20, fontWeight: "900", marginBottom: 16 },
  profileIdentity: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: palette.line },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: palette.ink },
  profileNameCopy: { flex: 1 },
  profileName: { color: palette.ink, fontSize: 17, fontWeight: "900" },
  profileVerified: { color: palette.blue, fontSize: 12, fontWeight: "700", marginTop: 3 },
  profileDetails: { marginTop: 5 },
  profileDetailRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderBottomColor: "#E7ECF2" },
  profileDetailCopy: { flex: 1 },
  profileDetailLabel: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  profileDetailValue: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "700", marginTop: 2 },
  profileAccessibilityButton: { minHeight: 64, marginTop: 16, paddingHorizontal: 13, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  profileAccessibilityIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.softBlue },
  profileAccessibilityCopy: { flex: 1, gap: 2 },
  profileAccessibilityTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  profileAccessibilityDescription: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  logoutButton: { minHeight: 44, marginTop: 22, borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: palette.softRed, borderWidth: 1, borderColor: "#F4B4B4" },
  logoutButtonText: { color: "#C92A2A", fontSize: 14, fontWeight: "900" },
  chatOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(2,27,48,0.42)" },
  chatScrim: { flex: 1 },
  chatSheet: { maxHeight: "78%", paddingHorizontal: 17, paddingTop: 10, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: palette.white, gap: 12 },
  chatHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "#CBD5DF", alignSelf: "center" },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  chatHeaderCopy: { flex: 1 },
  chatTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" },
  chatSubtitle: { color: palette.muted, fontSize: 12, marginTop: 2 },
  chatCloseButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F5" },
  chatHistory: { maxHeight: 250 },
  chatHistoryContent: { gap: 8, paddingVertical: 4 },
  chatBubble: { maxWidth: "86%", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  chatBubbleClient: { alignSelf: "flex-end", backgroundColor: "#DCEEFF" },
  chatBubbleWorker: { alignSelf: "flex-start", backgroundColor: "#EEF2F5" },
  chatSender: { color: palette.blue, fontSize: 10, fontWeight: "900" },
  chatBody: { color: palette.ink, fontSize: 13, lineHeight: 18, marginTop: 2 },
  chatTime: { color: palette.muted, fontSize: 10, textAlign: "right", marginTop: 3 },
  chatInput: { minHeight: 72, maxHeight: 110, borderRadius: 13, borderWidth: 1, borderColor: "#B9C8D6", color: palette.ink, fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingVertical: 10 },
  chatSendButton: { minHeight: 44, borderRadius: 22, backgroundColor: palette.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chatSendText: { color: palette.white, fontSize: 14, fontWeight: "900" },
  bottomNavigation: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 70, paddingTop: 5, paddingBottom: 8, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line, flexDirection: "row" },
  navItem: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center", gap: 2 },
  navIconWrap: { width: 42, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navIconWrapActive: { backgroundColor: "#DCE6F0" },
  navLabel: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  navLabelActive: { color: palette.ink, fontWeight: "900" }
});
