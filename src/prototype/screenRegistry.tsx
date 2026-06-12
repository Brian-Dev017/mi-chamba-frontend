import type { ScreenDefinition } from "../types/domain";
import {
  LoadingScreen,
  LoginScreen,
  ProfileSelectionScreen
} from "../screens/auth/AuthScreens";
import {
  DocumentConfirmation,
  DocumentInstruction,
  IdentityScreen,
  PersonalInformationScreen,
  ProfessionalInformationScreen,
  ProfilePhotoConfirmationScreen,
  ProfilePhotoInstructionsScreen,
  WorkerConfirmationScreen
} from "../screens/onboarding/OnboardingScreens";
import {
  MyJobsScreen,
  RequestDetailScreen,
  WorkConfirmationScreen,
  WorkerHomeScreen,
  WorkerProfileScreen
} from "../screens/worker/WorkerScreens";

export const screenRegistry: ScreenDefinition[] = [
  { key: "loading", title: "LOADING", group: "Acceso", render: LoadingScreen },
  { key: "login", title: "LOGIN", group: "Acceso", render: LoginScreen },
  {
    key: "profileSelection",
    title: "PERFIL SELECTION",
    group: "Acceso",
    render: ProfileSelectionScreen
  },
  {
    key: "personalInformation",
    title: "PERSONAL INFORMATION",
    group: "Registro",
    render: PersonalInformationScreen
  },
  { key: "identity", title: "IDENTITY", group: "Registro", render: IdentityScreen },
  {
    key: "professionalInformation",
    title: "Informacion Profesional",
    group: "Registro",
    render: ProfessionalInformationScreen
  },
  {
    key: "frontDniInstructions",
    title: "Cedula Anverso",
    group: "Verificacion",
    render: () => <DocumentInstruction side="FRONTAL" />
  },
  {
    key: "backDniInstructions",
    title: "Cedula Reverso",
    group: "Verificacion",
    render: () => <DocumentInstruction side="TRASERA" />
  },
  {
    key: "frontDniConfirmation",
    title: "Confirmacion Anverso DNI",
    group: "Verificacion",
    render: () => <DocumentConfirmation side="ANVERSO" />
  },
  {
    key: "backDniConfirmation",
    title: "Confirmacion Reverso DNI",
    group: "Verificacion",
    render: () => <DocumentConfirmation side="REVERSO" />
  },
  {
    key: "profilePhotoInstructions",
    title: "Instrucciones Foto de Perfil",
    group: "Verificacion",
    render: ProfilePhotoInstructionsScreen
  },
  {
    key: "profilePhotoConfirmation",
    title: "Confirmacion Foto de Perfil",
    group: "Verificacion",
    render: ProfilePhotoConfirmationScreen
  },
  {
    key: "workerConfirmation",
    title: "Confirmacion Trabajador",
    group: "Registro",
    render: WorkerConfirmationScreen
  },
  {
    key: "workerHome",
    title: "PRINCIPAL-WORKER",
    group: "Trabajador",
    render: WorkerHomeScreen
  },
  {
    key: "requestDetail",
    title: "Detalle de Solicitud",
    group: "Trabajador",
    render: RequestDetailScreen
  },
  {
    key: "workConfirmation",
    title: "Confirmacion trabajo",
    group: "Trabajador",
    render: WorkConfirmationScreen
  },
  { key: "myJobs", title: "Mis Trabajos", group: "Trabajador", render: MyJobsScreen },
  {
    key: "workerProfile",
    title: "Perfil del Trabajador",
    group: "Trabajador",
    render: WorkerProfileScreen
  }
];
