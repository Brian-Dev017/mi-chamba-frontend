import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { requestDetail, workerJobs, workerReviews } from "../../data/mockData";
import type { ScreenRenderProps, WorkerJob } from "../../types/domain";
import {
  ConfirmationDialog,
  DetailRow,
  InfoCard,
  Ionicons,
  MapPreview,
  PrimaryButton,
  ScreenFrame,
  SecondaryButton,
  SectionLabel,
  StatusPill,
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
  setAuthenticatedWorker,
  workerRequests,
  setWorkerRequests
}: ScreenRenderProps) {
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
      setAuthenticatedWorker(null);
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

export function RequestDetailScreen({ navigate }: ScreenRenderProps) {
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
          <Pressable style={local.detailAcceptButton} onPress={() => navigate("workConfirmation")}>
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

export function WorkConfirmationScreen() {
  return (
    <ScreenFrame centered>
      <View style={local.successIcon}>
        <Ionicons name="briefcase-outline" size={58} color="#FFFFFF" />
      </View>
      <Text style={local.successTitle}>Trabajo aceptado</Text>
      <Text style={[styles.bodyText, styles.textCenter]}>
        El cliente sera notificado y podras revisar el detalle desde Mis Trabajos.
      </Text>
      <PrimaryButton label="Ver mis trabajos" />
    </ScreenFrame>
  );
}

export function MyJobsScreen({ navigate }: ScreenRenderProps) {
  return (
    <WorkerShell active="Mis Trabajos" onNavigate={(section) => navigateWorkerSection(navigate, section)}>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>Mis Trabajos</Text>
        <Text style={local.exitText}>Salir</Text>
      </View>
      {workerJobs.slice(1).map((job, index) => (
        <View key={job.id} style={local.historyCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <StatusPill label={index === 0 ? "AGENDADO" : "COMPLETADO"} muted={index !== 0} />
          </View>
          <Text style={styles.captionText}>{job.location}</Text>
          <Text style={styles.captionText}>{job.time}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.linkTextStrong}>Ver detalles</Text>
            <Text style={styles.cardTitle}>{index === 0 ? "Agendado" : "Completado"}</Text>
          </View>
        </View>
      ))}
    </WorkerShell>
  );
}

export function WorkerProfileScreen({ authenticatedWorker, navigate }: ScreenRenderProps) {
  const workerFullName = authenticatedWorker
    ? `${authenticatedWorker.firstName} ${authenticatedWorker.lastName}`
    : "Juan Perez Perez";
  const workerTrade = authenticatedWorker?.professionalTrade ?? "Tecnico Electricista";

  return (
    <WorkerShell active="Perfil" onNavigate={(section) => navigateWorkerSection(navigate, section)}>
      <View style={local.profileHero}>
        {authenticatedWorker?.profilePhotoUri ? (
          <Image source={{ uri: authenticatedWorker.profilePhotoUri }} style={local.profileAvatarPhoto} />
        ) : (
          <View style={local.profileAvatar}>
            <Ionicons name="person" size={66} color="#FFFFFF" />
          </View>
        )}
        <Text style={styles.screenTitle}>{workerFullName}</Text>
        <Text style={styles.captionText}>{workerTrade}</Text>
        <Text style={local.ratingText}>4.5</Text>
      </View>
      <View style={local.earningsCard}>
        <Text style={styles.cardTitle}>Mis ganancias</Text>
        <Text style={styles.captionText}>Balance actual</Text>
        <Text style={local.priceMedium}>S/ 1,240.00</Text>
        <Text style={styles.linkTextStrong}>Ver historial de pagos</Text>
      </View>
      <View style={styles.rowBetween}>
        <SectionLabel label="LO QUE DICEN DE MI" />
        <Text style={styles.linkTextStrong}>Ver todas</Text>
      </View>
      {workerReviews.map((review) => (
        <View key={review.id} style={local.reviewCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{review.name}</Text>
            <Text style={styles.captionText}>{review.date}</Text>
          </View>
          <Text style={styles.bodyText}>{review.body}</Text>
        </View>
      ))}
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
  historyCard: card,
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
  successIcon: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#22C55E",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 22
  },
  successTitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, textAlign: "center" as const },
  profileHero: { alignItems: "center" as const, gap: 6, paddingTop: 28 },
  profileAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#021B30",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 10
  },
  profileAvatarPhoto: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: 10
  },
  ratingText: { color: "#021B30", fontSize: 14, fontWeight: "900" as const },
  earningsCard: { ...card, padding: 18, gap: 8 },
  priceMedium: { color: "#021B30", fontSize: 24, fontWeight: "900" as const }
};
