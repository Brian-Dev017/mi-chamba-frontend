import { Alert, Image, Modal, Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { ResponsiveText as Text } from "../../components/ResponsiveText";
import { AccessibilitySettingsModal } from "../../accessibility/AccessibilitySettingsModal";
import { useAccessibility, useAccessibleInputStyle } from "../../accessibility/AccessibilityContext";
import { workerReviews } from "../../data/mockData";
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
const REQUESTS_PER_PAGE = 3;
const workerPaymentHistory = [
  { id: "payment-001", date: "12/06/2026", service: "Instalacion de tomacorrientes", amount: "S/ 85.00" },
  { id: "payment-002", date: "06/06/2026", service: "Mantenimiento preventivo", amount: "S/ 120.00" },
  { id: "payment-003", date: "28/05/2026", service: "Revision de tablero electrico", amount: "S/ 65.00" }
] as const;
const workerPaymentTotal = workerPaymentHistory.reduce(
  (total, payment) => total + Number(payment.amount.replace(/[^0-9.]/g, "")),
  0
);

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
  setWorkerRequests,
  setSelectedWorkerJobId
}: ScreenRenderProps) {
  const { resetAccessibility } = useAccessibility();
  const [activeFilter, setActiveFilter] = useState<(typeof homeFilters)[number]>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState<WorkerModalState>(null);
  const workerName = authenticatedWorker
    ? `${authenticatedWorker.lastName}, ${authenticatedWorker.firstName}`
    : "Perez Perez, Juan";
  const newJobs = workerRequests.filter((job) => job.status === "NUEVO");
  const visibleJobs = (() => {
    if (activeFilter === "Cerca") {
      return newJobs.filter((job) => Number.parseFloat(job.detail.distance) <= 4);
    }

    if (activeFilter === "Mejor Precio") {
      return [...newJobs].sort(
        (firstJob, secondJob) =>
          Number(secondJob.price.replace(/[^0-9.]/g, "")) - Number(firstJob.price.replace(/[^0-9.]/g, ""))
      );
    }

    if (activeFilter === "Electricidad") {
      return newJobs.filter((job) => job.category === "Electricidad");
    }

    return newJobs;
  })();
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / REQUESTS_PER_PAGE));
  const paginatedJobs = visibleJobs.slice(
    (currentPage - 1) * REQUESTS_PER_PAGE,
    currentPage * REQUESTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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
            onPress={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
            style={[local.filterPill, activeFilter === filter && local.filterPillActive]}
          >
            <Text style={[local.filterPillText, activeFilter === filter && local.filterPillTextActive]}>{filter}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {paginatedJobs.map((job) => (
        <JobRequestCard
          key={job.id}
          job={job}
          onOpenDetail={() => {
            setSelectedWorkerJobId(job.id);
            navigate("requestDetail");
          }}
          onReject={() => setModalState({ type: "reject", job })}
        />
      ))}
      {visibleJobs.length === 0 ? (
        <View style={local.emptyStateCard}>
          <Ionicons name="briefcase-outline" size={26} color="#6D7B88" />
          <Text style={local.emptyStateTitle}>No hay solicitudes disponibles</Text>
          <Text style={local.emptyStateText}>Prueba otro filtro o vuelve a revisar más tarde.</Text>
        </View>
      ) : null}
      {visibleJobs.length > 0 ? (
        <View style={local.paginationRow}>
          <Pressable
            accessibilityLabel="Pagina anterior de solicitudes"
            accessibilityState={{ disabled: currentPage === 1 }}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
            style={[local.paginationButton, currentPage === 1 && local.paginationButtonDisabled]}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#8A96A3" : "#FFFFFF"} />
            <Text style={[local.paginationButtonText, currentPage === 1 && local.paginationButtonTextDisabled]}>Anterior</Text>
          </Pressable>
          <Text accessibilityLabel={`Pagina ${currentPage} de ${totalPages}`} style={local.paginationLabel}>
            {currentPage} de {totalPages}
          </Text>
          <Pressable
            accessibilityLabel="Pagina siguiente de solicitudes"
            accessibilityState={{ disabled: currentPage === totalPages }}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            style={[local.paginationButton, currentPage === totalPages && local.paginationButtonDisabled]}
          >
            <Text style={[local.paginationButtonText, currentPage === totalPages && local.paginationButtonTextDisabled]}>Siguiente</Text>
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#8A96A3" : "#FFFFFF"} />
          </Pressable>
        </View>
      ) : null}
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

export function RequestDetailScreen({
  isWorkerAvailable,
  navigate,
  selectedWorkerJobId,
  setSelectedWorkerJobId,
  setWorkerRequests,
  workerRequests
}: ScreenRenderProps) {
  const { highContrast } = useAccessibility();
  const accessibleInputStyle = useAccessibleInputStyle(14);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [isMessageSheetOpen, setIsMessageSheetOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const selectedJob = workerRequests.find((job) => job.id === selectedWorkerJobId);
  const detail = selectedJob?.detail;
  const backTarget = selectedJob?.status === "NUEVO" ? "workerHome" : "myJobs";

  const sendMessage = () => {
    const body = messageDraft.trim();

    if (!body || !selectedJob) {
      return;
    }

    setWorkerRequests((currentJobs) =>
      currentJobs.map((job) =>
        job.id === selectedJob.id
          ? {
              ...job,
              messages: [
                ...job.messages,
                {
                  id: `message-${Date.now()}`,
                  body,
                  sentAt: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
                  sender: "worker" as const
                }
              ]
            }
          : job
      )
    );
    setMessageDraft("");
  };

  const acceptJob = () => {
    if (!selectedJob || selectedJob.status !== "NUEVO") {
      return;
    }

    if (!isWorkerAvailable) {
      Alert.alert(
        "Trabajador inactivo",
        "Estas inactivo. Activa tu disponibilidad desde el perfil para aceptar trabajos.",
        [{ text: "Entendido" }]
      );
      return;
    }

    setWorkerRequests((currentJobs) =>
      currentJobs.map((job) =>
        job.id === selectedJob.id ? { ...job, status: "AGENDADO" as const, time: "Agendado recientemente" } : job
      )
    );
    navigate("workConfirmation");
  };

  const rejectJob = () => {
    if (!selectedJob) {
      return;
    }

    setWorkerRequests((currentJobs) => currentJobs.filter((job) => job.id !== selectedJob.id));
    setShowRejectConfirmation(false);
    setSelectedWorkerJobId(null);
    navigate("workerHome");
  };

  if (!selectedJob || !detail) {
    return (
      <WorkerShell active="Solicitudes" onNavigate={(section) => navigateWorkerSection(navigate, section)} showNavigation={false}>
        <View style={local.missingJobState}>
          <Ionicons name="alert-circle-outline" size={38} color="#C92A2A" />
          <Text style={local.emptyStateTitle}>No encontramos este trabajo</Text>
          <Text style={local.emptyStateText}>La solicitud pudo haber sido retirada o ya no está disponible.</Text>
          <Pressable onPress={() => navigate("workerHome")} style={local.missingJobButton}>
            <Text style={local.missingJobButtonText}>Volver a solicitudes</Text>
          </Pressable>
        </View>
      </WorkerShell>
    );
  }

  return (
    <WorkerShell active="Solicitudes" onNavigate={(section) => navigateWorkerSection(navigate, section)} showNavigation={false}>
      <View style={local.detailScreen}>
        <View style={local.detailHeaderTopRow}>
          <View style={local.detailHeaderIdentity}>
            <Text style={local.detailEyebrow}>Detalle de Solicitud</Text>
            <View style={local.detailStatusPill}>
              <Text style={local.detailStatusText}>{selectedJob.status}</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowExitConfirmation(true)} style={local.detailBackIcon} hitSlop={8}>
            <Ionicons name="arrow-back" size={18} color="#021B30" />
          </Pressable>
        </View>

        <View style={local.detailTitleRow}>
          <Text style={local.detailTitle}>{detail.title}</Text>
          <View style={local.detailCategoryPill}>
            <Text style={local.detailCategoryText}>{detail.category}</Text>
          </View>
        </View>

        <Text style={local.detailSectionLabel}>CLIENTE</Text>
        <View style={local.clientCard}>
          <View style={local.clientAvatarWrap}>
            <View style={local.avatarMini} />
          </View>
          <View style={local.flex}>
            <Text style={local.clientName}>{detail.clientName}</Text>
            <View style={local.clientRatingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={local.clientRatingText}>
                {detail.rating} ({detail.completedServices} servicios)
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
          <Text style={local.requestDescription}>{detail.description}</Text>
          <View style={local.referencePhotoRow}>
            {selectedJob.referencePhotos.map((uri, index) => (
              <Image key={`reference-${index}`} source={{ uri }} style={local.referencePhoto} />
            ))}
          </View>
        </InfoCard>

        <Text style={local.detailSectionLabel}>DETALLES DEL TRABAJO</Text>
        <View style={local.detailStack}>
          <DetailRow icon="location-outline" label="Direccion" value={detail.address} />
          <DetailRow icon="navigate-outline" label="Distancia" value={detail.distance} />
          <DetailRow icon="calendar-outline" label="Disponibilidad" value={detail.availability} />
          <DetailRow icon="construct-outline" label="Materiales" value={detail.materials} />
          <DetailRow icon="time-outline" label="Duracion" value={detail.duration} />
        </View>

        <View style={local.paymentPanel}>
          <View style={styles.rowBetween}>
            <Text style={local.paymentLabel}>Pago por el servicio</Text>
            <View style={local.completePaymentPill}>
              <Text style={local.completePaymentPillText}>Pago al completar</Text>
            </View>
          </View>
          <View style={local.paymentRow}>
            <Text style={local.priceLarge}>{detail.paymentAmount}</Text>
            <View style={local.paymentMethodBadge}>
              <Text style={local.paymentMethodBadgeText}>{selectedJob.paymentMethod}</Text>
            </View>
          </View>
        </View>

        <Text style={local.detailSectionLabel}>UBICACION</Text>
        <MapPreview />
        <Pressable onPress={() => setIsMessageSheetOpen(true)} style={local.messageButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
          <Text style={local.messageButtonText}>Enviar mensaje al cliente</Text>
        </Pressable>

        {selectedJob.status === "NUEVO" ? (
          <>
            {!isWorkerAvailable ? (
              <View style={local.unavailableNotice}>
                <Ionicons name="pause-circle-outline" size={19} color="#A15C00" />
                <Text style={local.unavailableNoticeText}>Activa tu disponibilidad desde el perfil para aceptar trabajos.</Text>
              </View>
            ) : null}
            <View style={local.detailBottomActions}>
              <Pressable onPress={() => setShowRejectConfirmation(true)} style={local.detailRejectButton}>
                <Text style={local.detailRejectText}>Rechazar</Text>
              </Pressable>
              <Pressable
                onPress={acceptJob}
                style={[local.detailAcceptButton, !isWorkerAvailable && local.detailAcceptButtonDisabled]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={isWorkerAvailable ? "#FFFFFF" : "#6D7B88"} />
                <Text style={[local.detailAcceptText, !isWorkerAvailable && local.detailAcceptTextDisabled]}>Aceptar trabajo</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      <ConfirmationDialog
        visible={showExitConfirmation}
        title={backTarget === "workerHome" ? "Volver a solicitudes" : "Volver a mis trabajos"}
        message={
          backTarget === "workerHome"
            ? "Si regresas ahora, saldras del detalle y volveras a la lista de solicitudes."
            : "Si regresas ahora, saldras del detalle y volveras a tus trabajos."
        }
        confirmLabel="Regresar"
        cancelLabel="Quedarme aqui"
        onCancel={() => setShowExitConfirmation(false)}
        onConfirm={() => {
          setShowExitConfirmation(false);
          navigate(backTarget);
        }}
      />

      <Modal animationType="slide" transparent visible={isMessageSheetOpen} onRequestClose={() => setIsMessageSheetOpen(false)}>
        <View style={local.messageSheetOverlay}>
          <Pressable style={local.messageSheetScrim} onPress={() => setIsMessageSheetOpen(false)} />
          <View style={[local.messageSheet, highContrast && local.highContrastCard]}>
            <View style={local.messageSheetHandle} />
            <Text style={local.messageSheetTitle}>Mensaje al cliente</Text>
            <Text style={local.messageSheetSubtitle}>
              {selectedJob.status === "NUEVO"
                ? "Coordina detalles antes de aceptar el trabajo."
                : "Consulta y coordina los detalles de este trabajo."}
            </Text>
            <View style={local.messageClientRow}>
              <View style={local.avatarMini} />
              <View>
                <Text style={local.clientName}>{detail.clientName}</Text>
                <Text style={local.messageClientHint}>Cliente de esta solicitud</Text>
              </View>
            </View>
            <Text style={local.messageHistoryLabel}>HISTORIAL</Text>
            <ScrollView style={local.messageHistory} contentContainerStyle={local.messageHistoryContent}>
              {selectedJob.messages.length > 0 ? (
                selectedJob.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      local.messageBubble,
                      message.sender === "worker" ? local.messageBubbleWorker : local.messageBubbleClient
                    ]}
                  >
                    <Text style={local.messageBubbleSender}>{message.sender === "worker" ? "Tú" : detail.clientName}</Text>
                    <Text style={local.messageBubbleBody}>{message.body}</Text>
                    <Text style={local.messageBubbleTime}>{message.sentAt}</Text>
                  </View>
                ))
              ) : (
                <View style={local.messageHistoryEmpty}>
                  <Ionicons name="chatbubble-outline" size={20} color="#6D7B88" />
                  <Text style={local.messageHistoryEmptyText}>Aún no hay mensajes en esta conversación.</Text>
                </View>
              )}
            </ScrollView>
            <TextInput
              multiline
              onChangeText={setMessageDraft}
              placeholder="Escribe tu mensaje aqui"
              placeholderTextColor="#8A96A3"
              style={[local.messageInput, accessibleInputStyle, highContrast && local.highContrastInput]}
              textAlignVertical="top"
              value={messageDraft}
            />
            <View style={local.messageSheetActions}>
              <Pressable onPress={() => setIsMessageSheetOpen(false)} style={local.messageSheetSecondary}>
                <Text style={local.messageSheetSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={!messageDraft.trim()}
                onPress={sendMessage}
                style={[local.messageSheetPrimary, !messageDraft.trim() && local.messageSheetPrimaryDisabled]}
              >
                <Text style={[local.messageSheetPrimaryText, !messageDraft.trim() && local.messageSheetPrimaryTextDisabled]}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationDialog
        visible={showRejectConfirmation}
        title="Rechazar solicitud"
        message="Esta solicitud se quitara de tu lista actual. Deseas continuar?"
        confirmLabel="Rechazar"
        cancelLabel="Cancelar"
        onCancel={() => setShowRejectConfirmation(false)}
        onConfirm={rejectJob}
      />
    </WorkerShell>
  );
}

export function WorkConfirmationScreen({ navigate }: ScreenRenderProps) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      navigate("myJobs");
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
  setSelectedWorkerJobId,
  setAuthenticatedRole,
  setAuthenticatedWorker,
  workerRequests
}: ScreenRenderProps) {
  const { resetAccessibility } = useAccessibility();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const visibleJobs = workerRequests.filter((job) => job.status === "AGENDADO" || job.status === "COMPLETADO");

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
                <Pressable
                  onPress={() => {
                    setSelectedWorkerJobId(job.id);
                    navigate("requestDetail");
                  }}
                  style={local.historyDetailButton}
                >
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
        {visibleJobs.length === 0 ? (
          <View style={local.emptyStateCard}>
            <Ionicons name="calendar-outline" size={26} color="#6D7B88" />
            <Text style={local.emptyStateTitle}>Aún no tienes trabajos</Text>
            <Text style={local.emptyStateText}>Los trabajos que aceptes aparecerán aquí como agendados.</Text>
          </View>
        ) : null}
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
  isWorkerAvailable,
  navigate,
  setAuthenticatedRole,
  setAuthenticatedWorker,
  setIsWorkerAvailable
}: ScreenRenderProps) {
  const { highContrast, resetAccessibility } = useAccessibility();
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
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
            <View style={[local.profileStatusDot, !isWorkerAvailable && local.profileStatusDotInactive]} />
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
              <Text style={local.profileAvailabilityText}>{isWorkerAvailable ? "Activo" : "Inactivo"}</Text>
              <Switch
                ios_backgroundColor="#C8CCD2"
                onValueChange={setIsWorkerAvailable}
                thumbColor="#FFFFFF"
                trackColor={{ false: "#C8CCD2", true: "#00C853" }}
                value={isWorkerAvailable}
              />
            </View>
            <Pressable
              accessibilityHint="Configura el tamaño del texto, el contraste y la lectura"
              accessibilityLabel="Accesibilidad"
              accessibilityRole="button"
              hitSlop={5}
              onPress={() => setShowAccessibilitySettings(true)}
              style={[local.accessibilityButton, highContrast && local.highContrastAccessibilityButton]}
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
          <View accessibilityViewIsModal style={[local.paymentHistorySheet, highContrast && local.highContrastCard]}>
            <View style={local.messageSheetHandle} />
            <View style={local.paymentHistoryHeader}>
              <View style={local.flex}>
                <Text accessibilityRole="header" style={local.paymentHistoryTitle}>Historial de pagos</Text>
                <Text style={local.paymentHistorySubtitle}>Resumen de operaciones completadas</Text>
              </View>
              <Pressable
                accessibilityLabel="Cerrar historial de pagos"
                accessibilityRole="button"
                onPress={() => setShowPaymentHistory(false)}
                style={local.paymentHistoryClose}
              >
                <Ionicons name="close" size={21} color="#102538" />
              </Pressable>
            </View>

            <View style={local.paymentHistorySummary}>
              <View>
                <Text style={local.paymentHistorySummaryLabel}>Total recibido</Text>
                <Text style={local.paymentHistorySummaryAmount}>S/ {workerPaymentTotal.toFixed(2)}</Text>
              </View>
              <View style={local.paymentHistoryCountPill}>
                <Text style={local.paymentHistoryCount}>{workerPaymentHistory.length} pagos</Text>
              </View>
            </View>

            <Text style={local.paymentHistoryListLabel}>OPERACIONES</Text>
            <ScrollView style={local.paymentHistoryList} contentContainerStyle={local.paymentHistoryListContent}>
              {workerPaymentHistory.map((payment) => (
                <View key={payment.id} style={local.paymentHistoryRow}>
                  <View style={local.paymentHistoryIcon}>
                    <Ionicons name="receipt-outline" size={18} color="#1976D2" />
                  </View>
                  <View style={local.flex}>
                    <Text style={local.paymentHistoryService}>{payment.service}</Text>
                    <View style={local.paymentHistoryMeta}>
                      <Text style={local.paymentHistoryDate}>{payment.date}</Text>
                      <View style={local.paymentPaidPill}>
                        <Text style={local.paymentPaidText}>Pagado</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={local.paymentHistoryAmount}>{payment.amount}</Text>
                </View>
              ))}
            </ScrollView>
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
      {job.referencePhotos[0] ? (
        <Image
          accessibilityLabel={`Imagen de la solicitud ${job.title}`}
          source={{ uri: job.referencePhotos[0] }}
          style={local.jobCardPhoto}
        />
      ) : (
        <View style={local.jobCardPhotoPlaceholder}>
          <Ionicons name="image-outline" size={25} color="#6D7B88" />
        </View>
      )}
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
          <Text style={local.jobInfoText}>{job.price} · {job.paymentMethod}</Text>
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
  jobCardPhoto: { width: "100%" as const, height: 138, borderRadius: 12, backgroundColor: "#D7DEE5" },
  jobCardPhotoPlaceholder: { width: "100%" as const, height: 86, borderRadius: 12, backgroundColor: "#EEF2F5", alignItems: "center" as const, justifyContent: "center" as const },
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
  paginationRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 10, marginTop: 2, marginBottom: 6 },
  paginationButton: { minHeight: 40, borderRadius: 20, paddingHorizontal: 13, backgroundColor: "#021B30", flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 4 },
  paginationButtonDisabled: { backgroundColor: "#E1E6EC" },
  paginationButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" as const },
  paginationButtonTextDisabled: { color: "#8A96A3" },
  paginationLabel: { color: "#405163", fontSize: 12, fontWeight: "900" as const },
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
  paymentMethodBadge: {
    minWidth: 62,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#16D1E6",
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  paymentMethodBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" as const },
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
  detailAcceptButtonDisabled: { backgroundColor: "#E1E6EC" },
  detailAcceptText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  detailAcceptTextDisabled: { color: "#6D7B88" },
  unavailableNotice: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#E6A84A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 9
  },
  unavailableNoticeText: { flex: 1, color: "#7A4600", fontSize: 12, lineHeight: 17, fontWeight: "700" as const },
  messageSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
    backgroundColor: "rgba(2, 27, 48, 0.34)"
  },
  messageSheetScrim: {
    flex: 1
  },
  messageSheet: {
    maxHeight: "92%" as const,
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
  messageHistoryLabel: { color: "#6D7B88", fontSize: 10, fontWeight: "900" as const, letterSpacing: 0.6 },
  messageHistory: { maxHeight: 180 },
  messageHistoryContent: { gap: 8, paddingVertical: 2 },
  messageBubble: { maxWidth: "86%" as const, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  messageBubbleWorker: { alignSelf: "flex-end" as const, backgroundColor: "#DCEEFF" },
  messageBubbleClient: { alignSelf: "flex-start" as const, backgroundColor: "#EEF2F5" },
  messageBubbleSender: { color: "#1976D2", fontSize: 10, fontWeight: "900" as const },
  messageBubbleBody: { color: "#102538", fontSize: 13, lineHeight: 18, marginTop: 2 },
  messageBubbleTime: { color: "#6D7B88", fontSize: 10, textAlign: "right" as const, marginTop: 3 },
  messageHistoryEmpty: { minHeight: 72, alignItems: "center" as const, justifyContent: "center" as const, gap: 6 },
  messageHistoryEmptyText: { color: "#6D7B88", fontSize: 12, textAlign: "center" as const },
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
  messageSheetPrimaryDisabled: { backgroundColor: "#E1E6EC" },
  messageSheetPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" as const },
  messageSheetPrimaryTextDisabled: { color: "#6D7B88" },
  emptyStateCard: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  emptyStateTitle: { color: "#102538", fontSize: 15, fontWeight: "900" as const, textAlign: "center" as const },
  emptyStateText: { color: "#6D7B88", fontSize: 12, lineHeight: 18, textAlign: "center" as const },
  missingJobState: { minHeight: 420, alignItems: "center" as const, justifyContent: "center" as const, gap: 12, padding: 24 },
  missingJobButton: { minHeight: 44, borderRadius: 22, backgroundColor: "#021B30", paddingHorizontal: 20, alignItems: "center" as const, justifyContent: "center" as const },
  missingJobButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" as const },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#EAF2F8",
    borderWidth: 1,
    borderColor: "#D8E5F0"
  },
  highContrastAccessibilityButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
    borderWidth: 2
  },
  highContrastCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
    borderWidth: 2
  },
  highContrastInput: {
    color: "#000000",
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
    borderWidth: 2
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
    maxHeight: "84%" as const,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12
  },
  paymentHistoryHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12 },
  paymentHistoryTitle: { color: "#102538", fontSize: 19, fontWeight: "900" as const },
  paymentHistorySubtitle: { color: "#6A7785", fontSize: 12, lineHeight: 17, marginTop: 2 },
  paymentHistoryClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF2F5", borderWidth: 1, borderColor: "#D6DEE8", alignItems: "center" as const, justifyContent: "center" as const },
  paymentHistorySummary: { minHeight: 94, borderRadius: 18, backgroundColor: "#021B30", paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 12 },
  paymentHistorySummaryLabel: { color: "#B9D3E8", fontSize: 12, fontWeight: "700" as const },
  paymentHistorySummaryAmount: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" as const, marginTop: 3 },
  paymentHistoryCountPill: { borderRadius: 99, backgroundColor: "#0D3555", borderWidth: 1, borderColor: "#2B638F", paddingHorizontal: 11, paddingVertical: 7 },
  paymentHistoryCount: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" as const },
  paymentHistoryListLabel: { color: "#6D7B88", fontSize: 10, fontWeight: "900" as const, letterSpacing: 0.7 },
  paymentHistoryList: { maxHeight: 300 },
  paymentHistoryListContent: { gap: 9, paddingBottom: 4 },
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
  paymentHistoryMeta: { flexDirection: "row" as const, alignItems: "center" as const, gap: 7, marginTop: 4 },
  paymentHistoryDate: { color: "#6A7785", fontSize: 11, fontWeight: "500" as const },
  paymentPaidPill: { borderRadius: 99, backgroundColor: "#E6F8ED", paddingHorizontal: 7, paddingVertical: 3 },
  paymentPaidText: { color: "#08783D", fontSize: 9, fontWeight: "900" as const },
  paymentHistoryAmount: { color: "#021B30", fontSize: 14, fontWeight: "900" as const }
};
