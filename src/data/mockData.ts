import type { Review, ServiceRequestDetail, WorkerJob } from "../types/domain";

export const workerRequests: WorkerJob[] = [
  {
    id: "request-001",
    title: "Instalacion de tomacorrientes",
    category: "Electricidad",
    location: "San Isidro, Lima",
    price: "S/ 85.00",
    time: "Hace 5 min",
    status: "NUEVO"
  },
  {
    id: "request-002",
    title: "Instalacion de tomacorrientes",
    category: "Electricidad",
    location: "Chongoyape, Lambayeque",
    price: "S/ 85.00",
    time: "Hace 20 min",
    status: "NUEVO"
  },
  {
    id: "request-003",
    title: "Arreglo de lavatorio",
    category: "Gasfitero",
    location: "La Molina, Lima",
    price: "S/ 85.00",
    time: "Hace 25 min",
    status: "NUEVO"
  }
];

export const workerJobs: WorkerJob[] = [
  {
    id: "job-001",
    title: "Instalacion de tomacorrientes",
    category: "Electricidad",
    location: "San Isidro, Lima",
    price: "S/ 85.00",
    time: "Hace 5 min",
    status: "NUEVO"
  },
  {
    id: "job-002",
    title: "Mantenimiento preventivo",
    category: "Electricidad",
    location: "Jr. Junin 345, Cercado de Lima",
    price: "S/ 120.00",
    time: "15 Oct, 03:00 PM",
    status: "AGENDADO"
  },
  {
    id: "job-003",
    title: "Revision de tablero electrico",
    category: "Electricidad",
    location: "Av. Arequipa 1280, Lince",
    price: "S/ 65.00",
    time: "Hace 18 min",
    status: "NUEVO"
  }
];

export const workerReviews: Review[] = [
  {
    id: "review-001",
    name: "Ricardo Mendoza",
    date: "Hace 2 dias",
    body:
      "Excelente servicio, llego a tiempo y soluciono el problema electrico de mi sala rapidamente. Muy profesional."
  },
  {
    id: "review-002",
    name: "Maria Garcia",
    date: "Hace 1 semana",
    body:
      "Juan es muy educado y sabe lo que hace. Instalo los nuevos interruptores sin dejar rastro de suciedad."
  }
];

export const requestDetail: ServiceRequestDetail = {
  id: "request-001",
  clientName: "Ricardo Mendoza",
  rating: "4.5",
  completedServices: 12,
  title: "Instalacion de tomacorrientes",
  category: "Electricidad",
  description:
    "Necesito instalar 3 tomacorrientes dobles en sala y cocina. El departamento es en piso 8, hay portero. Materiales no incluidos.",
  address: "Av. Larco 450, Miraflores",
  distance: "2.3 km de ti",
  availability: "Hoy, 3:00 PM - 6:00 PM",
  materials: "No incluidos",
  duration: "2 - 3 horas",
  paymentAmount: "S/ 85.00"
};
