import type { Dispatch, ReactElement, SetStateAction } from "react";

export type UserRole = "client" | "worker";

export type ScreenGroup = "Acceso" | "Registro" | "Verificacion" | "Cliente" | "Trabajador";

export type ScreenKey =
  | "loading"
  | "login"
  | "profileSelection"
  | "clientPersonalInformation"
  | "clientLocation"
  | "clientPropertyType"
  | "clientRegistrationSuccess"
  | "clientHome"
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
  documentType: IdentityDocumentType | null;
  documentNumber: string;
  professionalTrade: "Cerrajero" | "Plomero" | "Pintor" | "Gasfitero" | null;
  certificateUri: string | null;
  clientPhone: string;
  clientPassword: string;
  clientPasswordConfirmation: string;
  clientAddress: string;
  clientLatitude: number | null;
  clientLongitude: number | null;
  clientPropertyType: ClientPropertyType | null;
  clientReferenceDetails: string;
  workerPassword: string;
  workerPasswordConfirmation: string;
};

export type ClientPropertyType = "Casa" | "Departamento" | "Oficina" | "Local Comercial" | "Otros";

export type IdentityDocumentType = "DNI" | "Carnet de extranjeria";

export type RegisteredClient = {
  id: string;
  firstName: string;
  lastName: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  phone: string;
  password: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  propertyType: ClientPropertyType;
  referenceDetails: string;
};

export type RegisteredWorker = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  password: string;
  professionalTrade: "Cerrajero" | "Plomero" | "Pintor" | "Gasfitero";
  certificateUri: string | null;
  profilePhotoUri: string | null;
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
  registeredWorkers: RegisteredWorker[];
  registerWorker: () => void;
  registeredClients: RegisteredClient[];
  registerClient: () => Promise<void>;
  authenticatedClient: RegisteredClient | null;
  setAuthenticatedClient: (client: RegisteredClient | null) => void;
  authenticatedWorker: RegisteredWorker | null;
  setAuthenticatedWorker: (worker: RegisteredWorker | null) => void;
  authenticatedRole: UserRole | null;
  setAuthenticatedRole: (role: UserRole | null) => void;
  workerRequests: WorkerJob[];
  setWorkerRequests: Dispatch<SetStateAction<WorkerJob[]>>;
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
