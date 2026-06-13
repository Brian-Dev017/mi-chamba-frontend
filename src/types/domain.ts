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
  | "frontDniConfirmation"
  | "backDniConfirmation"
  | "profilePhotoInstructions"
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
  render: (props: ScreenRenderProps) => JSX.Element;
};

export type ScreenRenderProps = {
  navigate: (screen: ScreenKey) => void;
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
