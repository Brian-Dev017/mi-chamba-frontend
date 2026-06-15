import { ScrollView, Text, View } from "react-native";
import { requestDetail, workerJobs, workerReviews } from "../../data/mockData";
import type { ScreenRenderProps, WorkerJob } from "../../types/domain";
import {
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

export function WorkerHomeScreen({ authenticatedWorker, navigate, setAuthenticatedWorker }: ScreenRenderProps) {
  const workerName = authenticatedWorker
    ? `${authenticatedWorker.lastName}, ${authenticatedWorker.firstName}`
    : "Perez Perez, Juan";

  return (
    <WorkerShell active="Solicitudes">
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.smallMuted}>Bienvenido</Text>
          <Text style={styles.screenTitle}>{workerName}</Text>
        </View>
        <Text
          onPress={() => {
            setAuthenticatedWorker(null);
            navigate("login");
          }}
          style={local.exitText}
        >
          Salir
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.filterRow}>
        {["Todos", "Cerca", "Mejor Precio", "Electricidad"].map((filter, index) => (
          <Text key={filter} style={[local.filterPill, index === 0 && local.filterPillActive]}>
            {filter}
          </Text>
        ))}
      </ScrollView>
      {workerJobs.map((job) => (
        <JobRequestCard key={job.id} job={job} />
      ))}
    </WorkerShell>
  );
}

export function RequestDetailScreen() {
  return (
    <WorkerShell active="Solicitudes">
      <View style={local.detailHeader}>
        <View>
          <Text style={styles.screenTitle}>Detalle de Solicitud</Text>
          <Text style={styles.bodyText}>{requestDetail.title}</Text>
        </View>
        <StatusPill label="NUEVO" />
      </View>
      <SectionLabel label="CLIENTE" />
      <View style={local.clientCard}>
        <View style={local.avatarMini} />
        <View style={local.flex}>
          <Text style={styles.cardTitle}>{requestDetail.clientName}</Text>
          <Text style={styles.captionText}>
            {requestDetail.rating} ({requestDetail.completedServices} servicios)
          </Text>
        </View>
        <Text style={local.verifiedText}>Verificado</Text>
      </View>
      <SectionLabel label="QUE NECESITA?" />
      <InfoCard>
        <Text style={styles.bodyText}>{requestDetail.description}</Text>
      </InfoCard>
      <SectionLabel label="DETALLES DEL TRABAJO" />
      <DetailRow icon="location-outline" label="Direccion" value={requestDetail.address} />
      <DetailRow icon="navigate-outline" label="Distancia" value={requestDetail.distance} />
      <DetailRow icon="time-outline" label="Disponibilidad" value={requestDetail.availability} />
      <DetailRow icon="cube-outline" label="Materiales" value={requestDetail.materials} />
      <DetailRow icon="hourglass-outline" label="Duracion" value={requestDetail.duration} />
      <View style={local.paymentPanel}>
        <View style={styles.rowBetween}>
          <Text style={local.paymentLabel}>Pago por el servicio</Text>
          <Text style={local.payOnComplete}>Pago al completar</Text>
        </View>
        <Text style={local.priceLarge}>{requestDetail.paymentAmount}</Text>
      </View>
      <SectionLabel label="UBICACION" />
      <MapPreview />
      <View style={styles.actionRow}>
        <SecondaryButton label="Rechazar" destructive />
        <PrimaryButton label="Aceptar trabajo" grow />
      </View>
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

export function MyJobsScreen() {
  return (
    <WorkerShell active="Mis Trabajos">
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

export function WorkerProfileScreen() {
  return (
    <WorkerShell active="Perfil">
      <View style={local.profileHero}>
        <View style={local.profileAvatar}>
          <Ionicons name="person" size={66} color="#FFFFFF" />
        </View>
        <Text style={styles.screenTitle}>Juan Perez Perez</Text>
        <Text style={styles.captionText}>Tecnico Electricista</Text>
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

function JobRequestCard({ job }: { job: WorkerJob }) {
  return (
    <View style={local.jobCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{job.title}</Text>
        <StatusPill label={job.status} />
      </View>
      <Text style={styles.captionText}>{job.location}</Text>
      <View style={styles.rowGap}>
        <Text style={styles.cardTitle}>{job.price}</Text>
        <Text style={styles.captionText}>{job.time}</Text>
      </View>
      <View style={styles.actionRow}>
        <SecondaryButton label="Rechazar" destructive grow />
        <PrimaryButton label="Detalles" grow />
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
  filterRow: { gap: 8, paddingVertical: 4 },
  filterPill: {
    overflow: "hidden" as const,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#021B30",
    fontSize: 16,
    fontWeight: "700" as const
  },
  filterPillActive: { backgroundColor: "#021B30", color: "#FFFFFF" },
  jobCard: card,
  historyCard: card,
  reviewCard: card,
  detailHeader: { gap: 10 },
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
  avatarMini: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#021B30" },
  flex: { flex: 1 },
  verifiedText: { color: "#22C55E", fontSize: 10, fontWeight: "900" as const },
  paymentPanel: { borderRadius: 8, padding: 18, backgroundColor: "#021B30", gap: 12 },
  paymentLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" as const },
  payOnComplete: { color: "#00B8FF", fontSize: 10, fontWeight: "900" as const },
  priceLarge: { color: "#FFFFFF", fontSize: 40, fontWeight: "900" as const },
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
  ratingText: { color: "#021B30", fontSize: 14, fontWeight: "900" as const },
  earningsCard: { ...card, padding: 18, gap: 8 },
  priceMedium: { color: "#021B30", fontSize: 24, fontWeight: "900" as const }
};
