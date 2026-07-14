import { Image, Modal, Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { ResponsiveText as Text } from "../../components/ResponsiveText";
import { AccessibilitySettingsModal } from "../../accessibility/AccessibilitySettingsModal";
import { useAccessibility } from "../../accessibility/AccessibilityContext";
import { requestDetail, workerReviews } from "../../data/mockData";
import type { ScreenRenderProps, WorkerJob } from "../../types/domain";
import {
  ConfirmationDialog,
  DetailRow,
  InfoCard,
  Ionicons,
  MapPreview,
  ScreenFrame,
  WorkerShell,
  styles
} from "../../components/ui";

type WorkerSection = "Solicitudes" | "Mis Trabajos" | "Perfil";
type WorkerModalState =
  | { type: "logout" }
  | { type: "reject"; job: WorkerJob }
  | null;

const homeFilters = ["Todos", "Cerca", "Mejor Precio", "Electricidad"] as const;
const requestReferencePhotos = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80"
] as const;
const workerPaymentHistory = [
  { id: "payment-001", date: "12/06/2026", service: "Instalacion de tomacorrientes", amount: "S/ 85.00" },
  { id: "payment-002", date: "06/06/2026", service: "Mantenimiento preventivo", amount: "S/ 120.00" },
  { id: "payment-003", date: "28/05/2026", service: "Revision de tablero electrico", amount: "S/ 65.00" }
] as const;

function mapWorkerSectionToScreen(section: WorkerSection) {
  switch (section) {
    case "Solicitudes":
      return "workerHome" as const;
    case "Mis Trabajos":
      return "myJobs" as const;
    case "Perfil":
      return "workerProfile" as const;
  }
}

function navigateWorkerSection(navigate: ScreenRenderProps["navigate"], section: WorkerSection) {
  navigate(mapWorkerSectionToScreen(section));
}

export function WorkerHomeScreen({
  authenticatedWorker,
  navigate,
  setAuthenticatedRole,
  setAuthenticatedWorker,
  workerRequests,
  setWorkerRequests
}: ScreenRenderProps) {
  const { resetAccessibility } = useAccessibility();
  const [activeFilter, setActiveFilter] = useState<(typeof homeFilters)[number]>("Todos");
  const [modalState, setModalState] = useState<WorkerModalState>(null);
  const workerName = authenticatedWorker
    ? `${authenticatedWorker.lastName}, ${authenticatedWorker.firstName}`
    : "Perez Perez, Juan";
  const visibleJobs =
    activeFilter === "Todos"
      ? workerRequests
      : workerRequests.filter((job) => (activeFilter === "Electricidad" ? job.category === "Electricidad" : true));

  const handleConfirmModal = () => {
    if (!modalState) {
      return;
    }

    if (modalState.type === "logout") {
      resetAccessibility();
      setAuthenticatedWorker(null);
      setAuthenticatedRole(null);
      navigate("login");
    } else {
      setWorkerRequests((currentJobs) => currentJobs.filter((job) => job.id !== modalState.job.id));
    }

    setModalState(null);
  };

  return (
    <WorkerShell active="Solicitudes" onNavigate={(section) => navigateWorkerSection(navigate, section)}>
      <View style={local.homeHeader}>
        <View style={local.welcomeBlock}>
          {authenticatedWorker?.profilePhotoUri ? (
            <Image source={{ uri: authenticatedWorker.profilePhotoUri }} style={local.workerAvatar} />
          ) : (
            <View style={[local.workerAvatar, local.workerAvatarFallback]}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
          )}
          <View style={local.welcomeCopy}>
            <Text style={local.welcomeEyebrow}>Bienvenido</Text>
            <Text style={local.workerName}>{workerName}</Text>
          </View>
        </View>
        <Pressable onPress={() => setModalState({ type: "logout" })} style={local.exitButton}>
          <Text style={local.exitButtonText}>Salir</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.filterRow}>
        {homeFilters.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[local.filterPill, activeFilter === filter && local.filterPillActive]}
          >
            <Text style={[local.filterPillText, activeFilter === filter && local.filterPillTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visibleJobs.map((job) => (
        <JobRequestCard
          key={job.id}
          job={job}
          onOpenDetail={() => navigate("requestDetail")}
          onReject={() => setModalState({ type: "reject", job })}
        />
      ))}
      <ConfirmationDialog
        visible={modalState !== null}
        title={modalState?.type === "logout" ? "Cerrar sesion" : "Rechazar solicitud"}
        message={
          modalState?.type === "logout"
            ? "Si sales ahora, volveras al login del trabajador."
            : "Esta solicitud se quitara de tu lista actual. Deseas continuar?"
        }
        confirmLabel={modalState?.type === "logout" ? "Salir" : "Rechazar"}
        cancelLabel="Cancelar"
        onCancel={() => setModalState(null)}
        onConfirm={handleConfirmModal}
      />
    </WorkerShell>
  );
}

export function RequestDetailScreen({ navigate, setWorkerRequests }: ScreenRenderProps) {
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isMessageSheetOpen, setIsMessageSheetOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");

  return (
    <WorkerShell active="Solicitudes" onNavigate={(section) => navigateWorkerSection(navigate, section)} showNavigation={false}>
      <View style={local.detailScreen}>
        <View style={local.detailHeaderTopRow}>
          <View style={local.detailHeaderIdentity}>
            <Text style={local.detailEyebrow}>Detalle de Solicitud</Text>
            <View style={local.detailStatusPill}>
              <Text style={local.detailStatusText}>NUEVO</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowExitConfirmation(true)} style={local.detailBackIcon} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#021B30" />
          </Pressable>
        </View>

        <View style={local.detailTitleRow}>
          <Text style={local.detailTitle}>{requestDetail.title}</Text>
          <View style={local.detailCategoryPill}>
            <Text style={local.detailCategoryText}>{requestDetail.category}</Text>
          </View>
        </View>

        <Text style={local.detailSectionLabel}>CLIENTE</Text>
        <View style={local.clientCard}>
          <View style={local.clientAvatarWrap}>
            <View style={local.avatarMini} />
          </View>
          <View style={local.flex}>
            <Text style={local.clientName}>{requestDetail.clientName}</Text>
            <View style={local.clientRatingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={local.clientRatingText}>
                {requestDetail.rating} ({requestDetail.completedServices} servicios)
              </Text>
            </View>
          </View>
          <View style={local.clientVerifiedPill}>
            <Text style={local.clientVerifiedText}>Verificado</Text>
            <Ionicons name="chevron-forward" size={14} color="#1976D2" />
          </View>
        </View>

        <Text style={local.detailSectionLabel}>QUE NECESITA?</Text>
        <InfoCard>
          <Text style={local.requestDescription}>{requestDetail.description}</Text>
          <View style={local.referencePhotoRow}>
            {requestReferencePhotos.map((uri, index) => (
              <Image key={`reference-${index}`} source={{ uri }} style={local.referencePhoto} />
            ))}
          </View>
        </InfoCard>

        <Text style={local.detailSectionLabel}>DETALLES DEL TRABAJO</Text>
        <View style={local.detailStack}>
          <DetailRow icon="location-outline" label="Direccion" value={requestDetail.address} />
          <DetailRow icon="navigate-outline" label="Distancia" value={requestDetail.distance} />
          <DetailRow icon="calendar-outline" label="Disponibilidad" value={requestDetail.availability} />
          <DetailRow icon="construct-outline" label="Materiales" value={requestDetail.materials} />
          <DetailRow icon="time-outline" label="Duracion" value={requestDetail.duration} />
        </View>

        <View style={local.paymentPanel}>
          <View style={styles.rowBetween}>
            <Text style={local.paymentLabel}>Pago por el servicio</Text>
            <View style={local.completePaymentPill}>
              <Text style={local.completePaymentPillText}>Pago al completar</Text>
            </View>
          </View>
          <View style={local.paymentRow}>
            <Text style={local.priceLarge}>{requestDetail.paymentAmount}</Text>
            <View style={local.plinBadge}>
              <Text style={local.plinBadgeText}>plin</Text>
            </View>
          </View>
        </View>

        <Text style={local.detailSectionLabel}>UBICACION</Text>
        <MapPreview />
        <Pressable onPress={() => setIsMessageSheetOpen(true)} style={local.messageButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          <Text style={local.messageButtonText}>Enviar mensaje al cliente</Text>
        </Pressable>

        <View style={local.detailBottomActions}>
          <Pressable style={local.detailRejectButton}>
            <Text style={local.detailRejectText}>Rechazar</Text>
          </Pressable>
          <Pressable
            style={local.detailAcceptButton}
            onPress={() => {
              setWorkerRequests((currentRequests) =>
                currentRequests.filter((job) => job.id !== requestDetail.id)
              );
              navigate("workConfirmation");
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={local.detailAcceptText}>Aceptar trabajo</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmationDialog
        visible={showExitConfirmation}
        title="Volver a solicitudes"
        message="Si regresas ahora, saldras del detalle y volveras a la lista de solicitudes."
        confirmLabel="Regresar"
        cancelLabel="Quedarme aqui"
        onCancel={() => setShowExitConfirmation(false)}
        onConfirm={() => {
          setShowExitConfirmation(false);
          navigate("workerHome");
        }}
      />

      <Modal animationType="slide" transparent visible={isMessageSheetOpen} onRequestClose={() => setIsMessageSheetOpen(false)}>
        <View style={local.messageSheetOverlay}>
          <Pressable style={local.messageSheetScrim} onPress={() => setIsMessageSheetOpen(false)} />
          <View style={local.messageSheet}>
            <View style={local.messageSheetHandle} />
            <Text style={local.messageSheetTitle}>Mensaje al cliente</Text>
            <Text style={local.messageSheetSubtitle}>Coordina detalles antes de aceptar el trabajo.</Text>
            <View style={local.messageClientRow}>
              <View style={local.avatarMini} />
              <View>
                <Text style={local.clientName}>{requestDetail.clientName}</Text>
                <Text style={local.messageClientHint}>Cliente de esta solicitud</Text>
              </View>
            </View>
            <TextInput
              multiline
              onChangeText={setMessageDraft}
              placeholder="Escribe tu mensaje aqui"
              placeholderTextColor="#8A96A3"
              style={local.messageInput}
              textAlignVertical="top"
              value={messageDraft}
            />
            <View style={local.messageSheetActions}>
              <Pressable onPress={() => setIsMessageSheetOpen(false)} style={local.messageSheetSecondary}>
                <Text style={local.messageSheetSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={() => setIsMessageSheetOpen(false)} style={local.messageSheetPrimary}>
                <Text style={local.messageSheetPrimaryText}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </WorkerShell>
  );
}

export function WorkConfirmationScreen({ navigate }: ScreenRenderProps) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      navigate("workerHome");
    }, 1300);

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <ScreenFrame scrollable={false} noPadding>
      <View style={local.workAcceptedScreen}>
        <View style={local.workAcceptedTopBand} />
        <View style={local.workAcceptedContent}>
          <Text style={local.workAcceptedTitle}>Trabajo aceptado!</Text>
          <View style={local.workAcceptedIcon}>
            <Ionicons name="checkmark" size={92} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </ScreenFrame>
  );
}

export function MyJobsScreen({
  navigate,
  setAuthenticatedRole,
  setAuthenticatedWorker
}: ScreenRenderProps) {
  const { resetAccessibility } = useAccessibility();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const visibleJobs = [
    {
      id: "my-job-001",
      title: "Mantenimiento preventivo",
      location: "Jr. Junin 345, Cercado de Lima",
      time: "15 Jul, 03:00 PM",
      status: "AGENDADO" as const
    },
    {
      id: "my-job-002",
      title: "Mantenimiento preventivo",
      location: "Jr. Junin 345, Cercado de Lima",
      time: "01 Jun, 03:00 PM",
      status: "COMPLETADO" as const
    }
  ];

  return (
    <WorkerShell active="Mis Trabajos" onNavigate={(section) => navigateWorkerSection(navigate, section)}>
      <View style={local.myJobsHeader}>
        <View>
          <Text style={local.myJobsTitle}>Mis Trabajos</Text>
          <View style={local.myJobsTitleUnderline} />
        </View>
        <Pressable onPress={() => setShowLogoutConfirmation(true)} style={local.exitButton}>
          <Text style={local.exitButtonText}>Salir</Text>
        </Pressable>
      </View>

      <View style={local.myJobsList}>
        {visibleJobs.map((job) => {
          const isCompleted = job.status === "COMPLETADO";

          return (
            <View key={job.id} style={local.historyCard}>
              <View style={local.historyHeader}>
                <Text style={local.historyTitle}>{job.title}</Text>
                <View style={[local.historyStatusPill, isCompleted && local.historyStatusPillCompleted]}>
                  <Text style={local.historyStatusText}>{job.status}</Text>
                </View>
              </View>

              <View style={local.historyMetaRow}>
                <Ionicons name="location-outline" size={16} color="#00A6FF" />
                <Text style={local.historyMetaText}>{job.location}</Text>
              </View>
              <View style={local.historyMetaRow}>
                <Ionicons name="time-outline" size={16} color="#00A6FF" />
                <Text style={local.historyMetaText}>{job.time}</Text>
              </View>

              <View style={local.historyActionRow}>
                <Pressable style={local.historyDetailButton}>
                  <Text style={local.historyDetailText}>Ver detalles</Text>
                </Pressable>
                <Pressable style={[local.historyCompleteButton, !isCompleted && local.historyCompleteButtonDisabled]}>
                  <Text style={[local.historyCompleteText, !isCompleted && local.historyCompleteTextDisabled]}>
                    Completado
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <ConfirmationDialog
        visible={showLogoutConfirmation}
        title="Cerrar sesion"
        message="Si sales ahora, volveras al login del trabajador."
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={() => {
          setShowLogoutConfirmation(false);
          resetAccessibility();
          setAuthenticatedWorker(null);
          setAuthenticatedRole(null);
          navigate("login");
        }}
      />
    </WorkerShell>
  );
}
export function WorkerProfileScreen({
  authenticatedWorker,
  navigate,
  setAuthenticatedRole,
  setAuthenticatedWorker
}: ScreenRenderProps) {
  const { resetAccessibility } = useAccessibility();
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const workerFullName = authenticatedWorker
    ? `${authenticatedWorker.firstName} ${authenticatedWorker.lastName}`
    : "Juan Perez Perez";
  const workerTrade = authenticatedWorker?.professionalTrade ?? "Tecnico Electricista";

  return (
    <WorkerShell active="Perfil" onNavigate={(section) => navigateWorkerSection(navigate, section)}>
      <View style={local.profileHeader}>
        <View style={local.profileAvatarColumn}>
          <View style={local.profilePhotoWrap}>
            {authenticatedWorker?.profilePhotoUri ? (
              <Image source={{ uri: authenticatedWorker.profilePhotoUri }} style={local.profileAvatarPhoto} />
            ) : (
              <View style={local.profileAvatar}>
                <Ionicons name="person" size={44} color="#FFFFFF" />
              </View>
            )}
            <View style={[local.profileStatusDot, !isAvailable && local.profileStatusDotInactive]} />
          </View>
        </View>

        <View style={local.profileIdentity}>
          <View style={local.profileNameRow}>
            <Text style={local.profileName}>{workerFullName}</Text>
            <Pressable onPress={() => setShowLogoutConfirmation(true)} style={local.exitButton}>
              <Text style={local.exitButtonText}>Salir</Text>
            </Pressable>
          </View>
          <View style={local.profileTradeRow}>
            <Text style={local.profileTrade}>{workerTrade}</Text>
            <View style={local.profileRatingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={local.profileRatingText}>4.5</Text>
            </View>
          </View>
          <View style={local.profileToolsRow}>
            <View style={local.profileAvailability}>
              <Text style={local.profileAvailabilityText}>{isAvailable ? "Activo" : "Inactivo"}</Text>
              <Switch
                ios_backgroundColor="#C8CCD2"
                onValueChange={setIsAvailable}
                thumbColor="#FFFFFF"
                trackColor={{ false: "#C8CCD2", true: "#00C853" }}
                value={isAvailable}
              />
            </View>
            <Pressable
              accessibilityHint="Configura el tamaño del texto, el contraste y la lectura"
              accessibilityLabel="Accesibilidad"
              accessibilityRole="button"
              onPress={() => setShowAccessibilitySettings(true)}
              style={local.accessibilityButton}
            >
              <Ionicons name="accessibility-outline" size={18} color="#1976D2" />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={local.profileSectionTitle}>Mis ganancias</Text>
      <View style={local.earningsCard}>
        <View style={local.earningsBalanceRow}>
          <View style={local.earningsIcon}>
            <Ionicons name="cash-outline" size={22} color="#1976D2" />
          </View>
          <View>
            <Text style={local.earningsLabel}>Balance actual</Text>
            <Text style={local.priceMedium}>S/ 1,240.00</Text>
          </View>
        </View>
        <Pressable onPress={() => setShowPaymentHistory(true)} style={local.paymentHistoryButton}>
          <Text style={local.paymentHistoryText}>Ver historial de pagos</Text>
        </Pressable>
      </View>

      <View style={local.profileReviewHeader}>
        <Text style={local.profileReviewTitle}>LO QUE DICEN DE MI</Text>
        <Text style={local.profileReviewLink}>Ver todas</Text>
      </View>

      <View style={local.profileReviewsPanel}>
        {workerReviews.map((review, reviewIndex) => (
          <View key={review.id} style={[local.profileReviewItem, reviewIndex > 0 && local.profileReviewItemBorder]}>
            <View style={local.profileReviewTop}>
              <View>
                <Text style={local.profileReviewName}>{review.name}</Text>
                <View style={local.profileReviewStars}>
                  {[0, 1, 2, 3, 4].map((starIndex) => (
                    <Ionicons key={`${review.id}-star-${starIndex}`} name="star" size={12} color="#00A6FF" />
                  ))}
                </View>
              </View>
              <Text style={local.profileReviewDate}>{review.date}</Text>
            </View>
            <Text style={local.profileReviewBody}>{review.body}</Text>
          </View>
        ))}
      </View>

      <ConfirmationDialog
        visible={showLogoutConfirmation}
        title="Cerrar sesion"
        message="Si sales ahora, volveras al login del trabajador."
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onCancel={() => setShowLogoutConfirmation(false)}
        onConfirm={() => {
          setShowLogoutConfirmation(false);
          resetAccessibility();
          setAuthenticatedWorker(null);
          setAuthenticatedRole(null);
          navigate("login");
        }}
      />

      <AccessibilitySettingsModal
        onClose={() => setShowAccessibilitySettings(false)}
        visible={showAccessibilitySettings}
      />

      <Modal animationType="slide" transparent visible={showPaymentHistory} onRequestClose={() => setShowPaymentHistory(false)}>
        <View style={local.paymentHistoryOverlay}>
          <Pressable style={local.paymentHistoryScrim} onPress={() => setShowPaymentHistory(false)} />
          <View style={local.paymentHistorySheet}>
            <View style={local.messageSheetHandle} />
            <Text style={local.paymentHistoryTitle}>Historial de pagos</Text>
            <Text style={local.paymentHistorySubtitle}>Pagos registrados antes del 14/06/2026.</Text>
            {workerPaymentHistory.map((payment) => (
              <View key={payment.id} style={local.paymentHistoryRow}>
                <View style={local.paymentHistoryIcon}>
                  <Ionicons name="receipt-outline" size={18} color="#1976D2" />
                </View>
                <View style={local.flex}>
                  <Text style={local.paymentHistoryService}>{payment.service}</Text>
                  <Text style={local.paymentHistoryDate}>{payment.date}</Text>
                </View>
                <Text style={local.paymentHistoryAmount}>{payment.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </WorkerShell>
  );
}

function JobRequestCard({
  job,
  onOpenDetail,
  onReject
}: {
  job: WorkerJob;
  onOpenDetail: () => void;
  onReject: () => void;
}) {
  return (
    <View style={local.jobCard}>
      <View style={local.jobCardHeader}>
        <Text style={local.jobTitle}>{job.title}</Text>
        <View style={local.newPill}>
          <Text style={local.newPillText}>{job.status}</Text>
        </View>
      </View>
      <View style={local.jobMetaRow}>
        <Ionicons name="location-outline" size={16} color="#00A6FF" />
        <Text style={local.jobMetaText}>{job.location}</Text>
      </View>
      <View style={local.jobInfoRow}>
        <View style={local.jobInfoItem}>
          <Ionicons name="card-outline" size={16} color="#00A6FF" />
          <Text style={local.jobInfoText}>{job.price}</Text>
        </View>
        <View style={local.jobInfoItem}>
          <Ionicons name="time-outline" size={16} color="#00A6FF" />
          <Text style={local.jobInfoText}>{job.time}</Text>
        </View>
      </View>
      <View style={local.jobActionRow}>
        <Pressable onPress={onReject} style={local.rejectButton}>
          <Text style={local.rejectButtonText}>Rechazar</Text>
        </Pressable>
        <Pressable onPress={onOpenDetail} style={local.detailButton}>
          <Text style={local.detailButtonText}>Detalles</Text>
        </Pressable>
      </View>
    </View>
  );
}

const card = {
  borderRadius: 8,
  padding: 16,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#D6DEE8",
  gap: 12
};

const local = {
  exitText: { color: "#021B30", fontSize: 16, fontWeight: "800" as const },
  homeHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12 },
  welcomeBlock: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, flex: 1 },
  workerAvatar: { width: 34, height: 34, borderRadius: 17 },
  workerAvatarFallback: { backgroundColor: "#1E5D93", alignItems: "center" as const, justifyContent: "center" as const },
  welcomeCopy: { flexShrink: 1, gap: 2 },
  welcomeEyebrow: { color: "#5B6673", fontSize: 12, fontWeight: "600" as const },
  workerName: { color: "#021B30", fontSize: 15, fontWeight: "500" as const },
  exitButton: {
    minWidth: 82,
    minHeight: 44,
    borderRadius: 18,
    backgroundColor: "#F10C11",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 18
  },
  exitButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" as const },
  filterRow: { gap: 8, paddingTop: 4, paddingBottom: 6, paddingRight: 12 },
  filterPill: {
    borderRadius: 18,
    paddingHorizontal: 18,
    minHeight: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#DCE5F1"
  },
  filterPillText: { color: "#1F3040", fontSize: 14, fontWeight: "500" as const },
  filterPillActive: { backgroundColor: "#021B30" },
  filterPillTextActive: { color: "#FFFFFF", fontWeight: "700" as const },
  jobCard: { ...card, borderRadius: 14, padding: 14, gap: 14, shadowColor: "#1E293B", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  jobCardHeader: { flexDirection: "row" as const, alignItems: "flex-start" as const, justifyContent: "space-between" as const, gap: 10 },
  jobTitle: { color: "#102538", fontSize: 16, fontWeight: "800" as const, flex: 1 },
  newPill: { borderRadius: 99, backgroundColor: "#F4F6F8", paddingHorizontal: 8, paddingVertical: 4 },
  newPillText: { color: "#0E2033", fontSize: 10, fontWeight: "900" as const },
  jobMetaRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4 },
  jobMetaText: { color: "#43515F", fontSize: 13, fontWeight: "500" as const },
  jobInfoRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 16 },
  jobInfoItem: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4 },
  jobInfoText: { color: "#32404D", fontSize: 13, fontWeight: "500" as const },
  jobActionRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, gap: 14 },
  rejectButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#F10C11",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  rejectButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" as const },
  detailButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  detailButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" as const },
  myJobsHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 14,
    marginTop: 0,
    marginBottom: 20
  },
  myJobsTitle: { color: "#102538", fontSize: 20, fontWeight: "500" as const },
  myJobsTitleUnderline: { width: 43, height: 3, borderRadius: 99, backgroundColor: "#021B30", marginTop: 4 },
  myJobsList: { gap: 24 },
  historyCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAF2",
    gap: 10,
    shadowColor: "#1E293B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  historyHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10
  },
  historyTitle: { color: "#102538", fontSize: 16, fontWeight: "800" as const, flex: 1 },
  historyStatusPill: {
    borderRadius: 999,
    backgroundColor: "#1976D2",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  historyStatusPillCompleted: { backgroundColor: "#22CC37" },
  historyStatusText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" as const },
  historyMetaRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5 },
  historyMetaText: { color: "#3A4957", fontSize: 14, fontWeight: "500" as const, flexShrink: 1 },
  historyActionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 18,
    marginTop: 12
  },
  historyDetailButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1976D2",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FFFFFF"
  },
  historyDetailText: { color: "#021B30", fontSize: 14, fontWeight: "700" as const },
  historyCompleteButton: {
    flex: 1.18,
    minHeight: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#021B30"
  },
  historyCompleteButtonDisabled: { backgroundColor: "#C8CCD2" },
  historyCompleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const },
  historyCompleteTextDisabled: { color: "#FFFFFF" },
  reviewCard: card,
  detailScreen: { gap: 12, paddingBottom: 8 },
  detailHeaderTopRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12, paddingBottom: 0 },
  detailHeaderIdentity: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  detailEyebrow: { color: "#405163", fontSize: 14, fontWeight: "500" as const },
  detailStatusPill: { borderRadius: 999, backgroundColor: "#E8F8FF", paddingHorizontal: 8, paddingVertical: 4 },
  detailStatusText: { color: "#1976D2", fontSize: 10, fontWeight: "900" as const },
  detailBackIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F4F6F8",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  detailTitleRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 10 },
  detailTitle: { color: "#102538", fontSize: 16, fontWeight: "800" as const, flex: 1 },
  detailCategoryPill: { borderRadius: 999, backgroundColor: "#F4F6F8", paddingHorizontal: 10, paddingVertical: 6 },
  detailCategoryText: { color: "#102538", fontSize: 11, fontWeight: "700" as const },
  detailSectionLabel: { color: "#9AA4AF", fontSize: 11, fontWeight: "800" as const, marginTop: 4 },
  clientCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DEE8",
    padding: 14
  },
  clientAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EAF2F8",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  avatarMini: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#021B30" },
  flex: { flex: 1 },
  clientName: { color: "#1C2C3D", fontSize: 15, fontWeight: "700" as const },
  clientRatingRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: 2 },
  clientRatingText: { color: "#5E6A76", fontSize: 12, fontWeight: "500" as const },
  clientVerifiedPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    borderRadius: 999,
    backgroundColor: "#EEF7FF",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  clientVerifiedText: { color: "#1976D2", fontSize: 10, fontWeight: "800" as const },
  requestDescription: { color: "#1F3040", fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  referencePhotoRow: { flexDirection: "row" as const, gap: 10, marginTop: 10 },
  referencePhoto: { width: 70, height: 70, borderRadius: 18, backgroundColor: "#D7DEE5" },
  detailStack: { gap: 8 },
  paymentPanel: { borderRadius: 10, padding: 16, backgroundColor: "#021B30", gap: 12 },
  paymentLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" as const },
  completePaymentPill: { borderRadius: 999, backgroundColor: "#18B5FF", paddingHorizontal: 9, paddingVertical: 4 },
  completePaymentPillText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" as const },
  paymentRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12 },
  priceLarge: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" as const },
  plinBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#16D1E6",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  plinBadgeText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" as const },
  messageButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#1976D2",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  messageButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  detailBottomActions: { flexDirection: "row" as const, gap: 10, marginTop: 6},
  detailRejectButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#E3E8EF",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  detailRejectText: { color: "#6A7785", fontSize: 13, fontWeight: "700" as const },
  detailAcceptButton: {
    flex: 1.3,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#021B30",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  detailAcceptText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  messageSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
    backgroundColor: "rgba(2, 27, 48, 0.34)"
  },
  messageSheetScrim: {
    flex: 1
  },
  messageSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12
  },
  messageSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D5DCE3",
    alignSelf: "center" as const
  },
  messageSheetTitle: { color: "#102538", fontSize: 18, fontWeight: "800" as const, textAlign: "center" as const },
  messageSheetSubtitle: { color: "#6A7785", fontSize: 13, lineHeight: 18, textAlign: "center" as const },
  messageClientRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, marginTop: 4 },
  messageClientHint: { color: "#7A8693", fontSize: 12, fontWeight: "500" as const },
  messageInput: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#102538",
    fontSize: 14
  },
  messageSheetActions: { flexDirection: "row" as const, gap: 10, marginTop: 4 },
  messageSheetSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#EFF3F7",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  messageSheetSecondaryText: { color: "#5A6978", fontSize: 14, fontWeight: "700" as const },
  messageSheetPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  messageSheetPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  workAcceptedScreen: { flex: 1, backgroundColor: "#F4F7FA" },
  workAcceptedTopBand: {
    height: 52,
    backgroundColor: "#021B30",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  workAcceptedContent: {
    flex: 1,
    alignItems: "center" as const,
    paddingTop: 94,
    gap: 70
  },
  workAcceptedTitle: { color: "#021B30", fontSize: 20, fontWeight: "800" as const, textAlign: "center" as const },
  workAcceptedIcon: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  profileHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    marginTop: 0
  },
  profileAvatarColumn: { alignItems: "center" as const, gap: 4 },
  profilePhotoWrap: { position: "relative" as const },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  profileAvatarPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31
  },
  profileStatusDot: {
    position: "absolute" as const,
    right: -1,
    bottom: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#F4F7FA"
  },
  profileStatusDotInactive: { backgroundColor: "#9AA4AF" },
  profileRatingRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3 },
  profileRatingText: { color: "#021B30", fontSize: 12, fontWeight: "800" as const },
  profileIdentity: { flex: 1, gap: 6, justifyContent: "center" as const },
  profileNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10
  },
  profileName: { color: "#102538", fontSize: 18, fontWeight: "500" as const, flex: 1 },
  profileTradeRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  profileTrade: { color: "#1976D2", fontSize: 14, fontWeight: "700" as const },
  profileToolsRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 2 },
  profileAvailability: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    width: 142,
    borderRadius: 999,
    backgroundColor: "#EAF2F8",
    paddingLeft: 10,
    paddingRight: 2,
    minHeight: 32
  },
  profileAvailabilityText: { color: "#102538", fontSize: 12, fontWeight: "800" as const },
  accessibilityButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#EAF2F8",
    borderWidth: 1,
    borderColor: "#D8E5F0"
  },
  profileSectionTitle: { color: "#2D3A46", fontSize: 14, fontWeight: "600" as const, marginTop: 8 },
  earningsCard: { borderRadius: 12, padding: 22, gap: 18, backgroundColor: "#021B30" },
  earningsBalanceRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14 },
  earningsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0D3555",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  earningsLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "500" as const },
  priceMedium: { color: "#FFFFFF", fontSize: 24, fontWeight: "500" as const },
  paymentHistoryButton: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#0B78B6",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  paymentHistoryText: { color: "#00A6FF", fontSize: 14, fontWeight: "500" as const },
  profileReviewHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 2
  },
  profileReviewTitle: { color: "#405163", fontSize: 13, fontWeight: "800" as const },
  profileReviewLink: { color: "#1976D2", fontSize: 13, fontWeight: "600" as const },
  profileReviewsPanel: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DEE8",
    overflow: "hidden" as const
  },
  profileReviewItem: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  profileReviewItemBorder: { borderTopWidth: 1, borderTopColor: "#D6DEE8" },
  profileReviewTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 12
  },
  profileReviewName: { color: "#102538", fontSize: 14, fontWeight: "800" as const },
  profileReviewStars: { flexDirection: "row" as const, alignItems: "center" as const, gap: 1, marginTop: 2 },
  profileReviewDate: { color: "#5F6B77", fontSize: 12, fontWeight: "500" as const },
  profileReviewBody: { color: "#44515E", fontSize: 15, lineHeight: 20, fontWeight: "500" as const },
  paymentHistoryOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
    backgroundColor: "rgba(2, 27, 48, 0.34)"
  },
  paymentHistoryScrim: { flex: 1 },
  paymentHistorySheet: {
    marginBottom: 74,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12
  },
  paymentHistoryTitle: { color: "#102538", fontSize: 18, fontWeight: "800" as const, textAlign: "center" as const },
  paymentHistorySubtitle: { color: "#6A7785", fontSize: 13, lineHeight: 18, textAlign: "center" as const },
  paymentHistoryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#F4F7FA",
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  paymentHistoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EAF2F8",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  paymentHistoryService: { color: "#102538", fontSize: 13, fontWeight: "800" as const },
  paymentHistoryDate: { color: "#6A7785", fontSize: 12, fontWeight: "500" as const, marginTop: 2 },
  paymentHistoryAmount: { color: "#021B30", fontSize: 14, fontWeight: "900" as const }
};
