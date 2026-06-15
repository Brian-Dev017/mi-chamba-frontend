import type { Dispatch, ReactElement, SetStateAction } from "react";

export type UserRole = "client" | "worker";

export type ScreenGroup = "Acceso" | "Registro" | "Verificacion" | "Trabajador";

export type ScreenKey =
  | "loading"
  | "login"
  | "profileSelection"
  | "personalInformation"
  | "identity"
  | "professionalInformation"
  | "frontDniInstructions"
  | "backDniInstructions"
  | "frontDniCamera"
  | "backDniCamera"
  | "frontDniConfirmation"
  | "backDniConfirmation"
  | "profilePhotoInstructions"
  | "profilePhotoCamera"
  | "profilePhotoConfirmation"
  | "workerConfirmation"
  | "workerHome"
  | "requestDetail"
  | "workConfirmation"
  | "myJobs"
  | "workerProfile";

export type ScreenDefinition = {
  key: ScreenKey;
  title: string;
  group: ScreenGroup;
  render: (props: ScreenRenderProps) => ReactElement;
};

export type RegistrationDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  documentType: "DNI" | "Carnet de extranjeria" | null;
  documentNumber: string;
  professionalTrade: "Cerrajero" | "Plomero" | "Pintor" | "Gasfitero" | null;
  certificateUri: string | null;
};

export type ScreenRenderProps = {
  navigate: (screen: ScreenKey) => void;
  registrationDraft: RegistrationDraft;
  setRegistrationDraft: Dispatch<SetStateAction<RegistrationDraft>>;
  resetRegistrationDraft: () => void;
  profilePhotoUri: string | null;
  setProfilePhotoUri: (uri: string | null) => void;
  pendingProfilePhotoUri: string | null;
  setPendingProfilePhotoUri: (uri: string | null) => void;
  frontDniPhotoUri: string | null;
  setFrontDniPhotoUri: (uri: string | null) => void;
  backDniPhotoUri: string | null;
  setBackDniPhotoUri: (uri: string | null) => void;
  pendingDniPhotoUri: string | null;
  setPendingDniPhotoUri: (uri: string | null) => void;
};

export type WorkerJob = {
  id: string;
  title: string;
  category: string;
  location: string;
  price: string;
  time: string;
  status: "NUEVO" | "AGENDADO" | "COMPLETADO";
};

export type Review = {
  id: string;
  name: string;
  date: string;
  body: string;
};

export type ServiceRequestDetail = {
  id: string;
  clientName: string;
  rating: string;
  completedServices: number;
  title: string;
  category: string;
  description: string;
  address: string;
  distance: string;
  availability: string;
  materials: string;
  duration: string;
  paymentAmount: string;
};
