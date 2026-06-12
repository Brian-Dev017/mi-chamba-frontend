import { Text, View } from "react-native";
import {
  Field,
  InfoCard,
  Ionicons,
  PrimaryButton,
  RegistrationFrame,
  ScreenFrame,
  SecondaryButton,
  SectionTitle,
  styles
} from "../../components/ui";

export function PersonalInformationScreen() {
  return (
    <RegistrationFrame title="Informacion personal" step={1}>
      <View style={local.avatarPicker}>
        <Ionicons name="camera-outline" size={28} color="#1976D2" />
        <Text style={styles.smallMuted}>Tomar foto</Text>
      </View>
      <Text style={styles.bodyText}>Agrega una foto de perfil</Text>
      <Field label="Nombre" placeholder="Juan Manuel" />
      <Field label="Apellido" placeholder="Perez Fernandez" />
      <Field label="Fecha de nacimiento" placeholder="DD/MM/YYYY" />
    </RegistrationFrame>
  );
}

export function IdentityScreen() {
  return (
    <RegistrationFrame title="Cedula de identidad" step={2}>
      <View style={local.documentRow}>
        <DocumentUpload label="Anverso" />
        <DocumentUpload label="Reverso" />
      </View>
      <Field label="Tipo de documento" placeholder="DNI" />
      <Field label="Numero de documento" placeholder="Ej: 12345678" />
      <InfoCard>
        <Text style={local.infoText}>
          Asegurate de que la foto sea clara y que todos los datos sean legibles para evitar
          retrasos en tu verificacion.
        </Text>
      </InfoCard>
    </RegistrationFrame>
  );
}

export function ProfessionalInformationScreen() {
  return (
    <RegistrationFrame title="Informacion profesional" step={3} finalLabel="Finalizar registro">
      <Text style={styles.bodyText}>
        Completa los detalles de tu especialidad para que los clientes puedan encontrarte
        facilmente.
      </Text>
      <Field label="Oficio" placeholder="Seleccionar una ocupacion" icon="chevron-down" />
      <Text style={styles.fieldLabel}>Subir certificado (Opcional)</Text>
      <View style={local.uploadBox}>
        <Ionicons name="cloud-upload-outline" size={34} color="#1976D2" />
        <Text style={local.uploadText}>Toca aqui para subir tu certificado o dejalo en blanco</Text>
      </View>
      <Text style={styles.captionText}>Los certificados aumentan tus probabilidades de ser contratado.</Text>
    </RegistrationFrame>
  );
}

export function DocumentInstruction({ side }: { side: "FRONTAL" | "TRASERA" }) {
  return (
    <ScreenFrame darkTop>
      <View style={local.slideCard}>
        <SectionTitle title="Cedula de identidad" />
        <Text style={styles.bodyText}>Carga la parte {side} del documento de identificacion</Text>
        <Text style={styles.bodyText}>Asegurese de que la foto sea legible</Text>
        <DocumentMock caption="Imagen referencial" />
        <PrimaryButton label="Tomar Foto" />
        <SecondaryButton label="Elegir de la galeria" />
      </View>
    </ScreenFrame>
  );
}

export function DocumentConfirmation({ side }: { side: "ANVERSO" | "REVERSO" }) {
  return (
    <ScreenFrame>
      <SectionTitle title="Verifica el frente de tu documento" />
      <Text style={styles.captionText}>Asegurate de que el numero de DNI y tu nombre sean legibles</Text>
      <View style={local.documentPreview}>
        <Text style={local.documentPreviewLabel}>{side}</Text>
        <View style={local.documentPhotoLarge} />
        <View style={local.fakeLineWide} />
        <View style={local.fakeLine} />
      </View>
      <View style={local.validPill}>
        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
        <Text style={local.validText}>Documento legible</Text>
      </View>
      <PrimaryButton label="Usar esta foto" />
      <SecondaryButton label="Tomar otra foto" />
    </ScreenFrame>
  );
}

export function ProfilePhotoInstructionsScreen() {
  return (
    <ScreenFrame>
      <SectionTitle title="Su foto de perfil" />
      <Text style={styles.bodyText}>
        Para validar tu identidad y generar confianza con tus futuros clientes.
      </Text>
      <View style={local.bulletBlock}>
        <Bullet text="Tomar una buena selfie" />
        <Bullet text="Asegurese de que tu rostro este completamente visible" />
        <Bullet text="No use gorra, ni lentes de sol" />
      </View>
      <View style={local.selfieGuide}>
        <View style={local.selfieCircle}>
          <Ionicons name="person-outline" size={86} color="#D6DEE8" />
        </View>
      </View>
      <Text style={styles.captionText}>
        Su foto sera revisada manualmente por nuestro equipo de soporte.
      </Text>
      <PrimaryButton label="Tomar Foto" />
    </ScreenFrame>
  );
}

export function ProfilePhotoConfirmationScreen() {
  return (
    <ScreenFrame>
      <View style={local.facePreview}>
        <Ionicons name="person" size={118} color="#FFFFFF" />
      </View>
      <SectionTitle title="Te gusta tu foto?" centered />
      <Text style={[styles.bodyText, styles.textCenter]}>Esta foto sera visible para tus clientes</Text>
      <View style={local.validPill}>
        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
        <Text style={local.validText}>Foto valida</Text>
      </View>
      <PrimaryButton label="Usar esta foto" />
      <SecondaryButton label="Tomar otra foto" />
    </ScreenFrame>
  );
}

export function WorkerConfirmationScreen() {
  return (
    <ScreenFrame centered>
      <View style={local.successIcon}>
        <Ionicons name="checkmark" size={72} color="#FFFFFF" />
      </View>
      <Text style={local.successTitle}>Registro exitoso!</Text>
      <Text style={local.successSubtitle}>A chambear!</Text>
      <PrimaryButton label="Ir a solicitudes" />
    </ScreenFrame>
  );
}

function DocumentUpload({ label }: { label: string }) {
  return (
    <View style={local.documentUpload}>
      <Ionicons name="camera-outline" size={30} color="#1976D2" />
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.captionText}>Tomar foto</Text>
    </View>
  );
}

function DocumentMock({ caption }: { caption: string }) {
  return (
    <View style={local.documentMock}>
      <Text style={local.documentCaption}>{caption}</Text>
      <View style={local.documentLines}>
        <View style={local.documentPhoto} />
        <View style={local.fakeLineWide} />
        <View style={local.fakeLine} />
        <View style={local.fakeLineShort} />
      </View>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={local.bulletRow}>
      <Ionicons name="checkmark-circle-outline" size={20} color="#1976D2" />
      <Text style={styles.bodyText}>{text}</Text>
    </View>
  );
}

const local = {
  avatarPicker: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    alignSelf: "center" as const
  },
  documentRow: { flexDirection: "row" as const, gap: 12 },
  documentUpload: {
    flex: 1,
    minHeight: 118,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8
  },
  infoText: { color: "#12324A", fontSize: 12, lineHeight: 18 },
  uploadBox: {
    minHeight: 142,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: "#1976D2",
    backgroundColor: "#F5FBFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 18,
    gap: 12
  },
  uploadText: { color: "#12324A", fontSize: 16, lineHeight: 22, textAlign: "center" as const },
  slideCard: {
    marginTop: 118,
    minHeight: 650,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 20,
    gap: 16,
    marginHorizontal: -20
  },
  documentMock: { borderRadius: 8, backgroundColor: "#EEF4FA", padding: 14, gap: 10, alignItems: "center" as const },
  documentCaption: { color: "#6D7B88", fontSize: 12 },
  documentLines: { width: "100%" as const, minHeight: 180, borderRadius: 8, backgroundColor: "#FFFFFF", padding: 18, gap: 14 },
  documentPhoto: { width: 86, height: 86, borderRadius: 8, backgroundColor: "#D7E2EB" },
  documentPreview: {
    minHeight: 260,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6DEE8",
    padding: 18,
    gap: 18,
    justifyContent: "center" as const
  },
  documentPreviewLabel: { color: "#6D7B88", fontSize: 12, fontWeight: "900" as const },
  documentPhotoLarge: { width: 110, height: 86, borderRadius: 8, backgroundColor: "#D7E2EB" },
  fakeLineWide: { height: 12, width: "72%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  fakeLine: { height: 12, width: "56%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  fakeLineShort: { height: 12, width: "38%" as const, borderRadius: 99, backgroundColor: "#D7E2EB" },
  validPill: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: "#ECFDF3" },
  validText: { color: "#021B30", fontSize: 14, fontWeight: "800" as const },
  bulletBlock: { gap: 12, marginTop: 8 },
  bulletRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 10 },
  selfieGuide: { height: 260, borderRadius: 8, borderWidth: 2, borderColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "#F8FAFC" },
  selfieCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const },
  facePreview: { width: 220, height: 220, borderRadius: 110, backgroundColor: "#021B30", alignItems: "center" as const, justifyContent: "center" as const, alignSelf: "center" as const, marginTop: 44 },
  successIcon: { width: 132, height: 132, borderRadius: 66, backgroundColor: "#22C55E", alignItems: "center" as const, justifyContent: "center" as const, marginBottom: 22 },
  successTitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, textAlign: "center" as const },
  successSubtitle: { color: "#021B30", fontSize: 20, fontWeight: "900" as const, marginBottom: 28 }
};
