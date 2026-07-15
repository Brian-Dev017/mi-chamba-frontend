import type { Review, WorkerJob } from "../types/domain";

const electricalPhotos = [
  "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80"
];
const plumbingPhotos = [
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80"
];
const homeServicePhotos = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
];
export const workerRequests: WorkerJob[] = [
  {
    id: "request-001",
    title: "Instalacion de tomacorrientes",
    category: "Electricidad",
    location: "Miraflores, Lima",
    price: "S/ 85.00",
    time: "Hace 5 min",
    status: "NUEVO",
    detail: {
      id: "request-001",
      clientName: "Ricardo Mendoza",
      rating: "4.5",
      completedServices: 12,
      title: "Instalacion de tomacorrientes",
      category: "Electricidad",
      description: "Necesito instalar tres tomacorrientes dobles en la sala y cocina de un departamento.",
      address: "Av. Larco 450, Miraflores",
      distance: "2.3 km de ti",
      availability: "Hoy, 3:00 PM - 6:00 PM",
      materials: "No incluidos",
      duration: "2 - 3 horas",
      paymentAmount: "S/ 85.00"
    },
    referencePhotos: electricalPhotos,
    messages: []
  },
  {
    id: "request-002",
    title: "Reparacion de fuga en cocina",
    category: "Gasfitero",
    location: "Santiago de Surco, Lima",
    price: "S/ 110.00",
    time: "Hace 20 min",
    status: "NUEVO",
    detail: {
      id: "request-002",
      clientName: "Maria Garcia",
      rating: "4.8",
      completedServices: 8,
      title: "Reparacion de fuga en cocina",
      category: "Gasfitero",
      description: "Hay una fuga debajo del lavadero y el agua está humedeciendo el mueble de cocina.",
      address: "Jr. Monte Rosa 286, Santiago de Surco",
      distance: "3.1 km de ti",
      availability: "Hoy, 5:00 PM - 8:00 PM",
      materials: "Por evaluar",
      duration: "1 - 2 horas",
      paymentAmount: "S/ 110.00"
    },
    referencePhotos: plumbingPhotos,
    messages: []
  },
  {
    id: "request-003",
    title: "Cambio de cerradura principal",
    category: "Cerrajero",
    location: "San Borja, Lima",
    price: "S/ 75.00",
    time: "Hace 25 min",
    status: "NUEVO",
    detail: {
      id: "request-003",
      clientName: "Ana Torres",
      rating: "4.7",
      completedServices: 5,
      title: "Cambio de cerradura principal",
      category: "Cerrajero",
      description: "La cerradura de la puerta principal se atasca y necesito reemplazarla por una de mayor seguridad.",
      address: "Av. San Luis 2150, San Borja",
      distance: "4.0 km de ti",
      availability: "Mañana, 9:00 AM - 12:00 PM",
      materials: "Cerradura por cotizar",
      duration: "1 hora",
      paymentAmount: "S/ 75.00"
    },
    referencePhotos: homeServicePhotos,
    messages: []
  },
  {
    id: "request-004",
    title: "Pintura de dormitorio",
    category: "Pintor",
    location: "Magdalena, Lima",
    price: "S/ 180.00",
    time: "Hace 32 min",
    status: "NUEVO",
    detail: {
      id: "request-004",
      clientName: "Luis Herrera",
      rating: "4.6",
      completedServices: 10,
      title: "Pintura de dormitorio",
      category: "Pintor",
      description: "Deseo pintar un dormitorio de 12 m². Las paredes están limpias y sin humedad.",
      address: "Jr. Tacna 640, Magdalena del Mar",
      distance: "5.4 km de ti",
      availability: "Sábado, 8:00 AM - 2:00 PM",
      materials: "Pintura incluida por el cliente",
      duration: "5 - 6 horas",
      paymentAmount: "S/ 180.00"
    },
    referencePhotos: homeServicePhotos,
    messages: []
  },
  {
    id: "request-005",
    title: "Instalacion de luminarias",
    category: "Electricidad",
    location: "Jesus Maria, Lima",
    price: "S/ 140.00",
    time: "Hace 40 min",
    status: "NUEVO",
    detail: {
      id: "request-005",
      clientName: "Carla Ruiz",
      rating: "4.9",
      completedServices: 16,
      title: "Instalacion de luminarias",
      category: "Electricidad",
      description: "Necesito instalar cuatro luminarias de techo y verificar dos interruptores.",
      address: "Av. Brasil 1450, Jesus Maria",
      distance: "6.2 km de ti",
      availability: "Mañana, 2:00 PM - 6:00 PM",
      materials: "Luminarias disponibles",
      duration: "3 horas",
      paymentAmount: "S/ 140.00"
    },
    referencePhotos: electricalPhotos,
    messages: []
  },
  {
    id: "request-006",
    title: "Destape de desague",
    category: "Gasfitero",
    location: "La Molina, Lima",
    price: "S/ 95.00",
    time: "Hace 48 min",
    status: "NUEVO",
    detail: {
      id: "request-006",
      clientName: "Jorge Salazar",
      rating: "4.4",
      completedServices: 6,
      title: "Destape de desague",
      category: "Gasfitero",
      description: "El desagüe del patio drena lentamente y se desborda cuando se usa la lavadora.",
      address: "Calle Los Cedros 178, La Molina",
      distance: "7.0 km de ti",
      availability: "Hoy, 6:00 PM - 9:00 PM",
      materials: "Herramientas del trabajador",
      duration: "1 - 2 horas",
      paymentAmount: "S/ 95.00"
    },
    referencePhotos: plumbingPhotos,
    messages: []
  },
  {
    id: "job-007",
    title: "Mantenimiento de tablero",
    category: "Electricidad",
    location: "Jr. Junin 345, Cercado de Lima",
    price: "S/ 120.00",
    time: "15 Jul, 03:00 PM",
    status: "AGENDADO",
    detail: {
      id: "job-007",
      clientName: "Patricia Leon",
      rating: "4.8",
      completedServices: 9,
      title: "Mantenimiento de tablero",
      category: "Electricidad",
      description: "Revisión preventiva del tablero eléctrico y ajuste de interruptores termomagnéticos.",
      address: "Jr. Junin 345, Cercado de Lima",
      distance: "3.8 km de ti",
      availability: "15 Jul, 3:00 PM",
      materials: "No requeridos",
      duration: "2 horas",
      paymentAmount: "S/ 120.00"
    },
    referencePhotos: electricalPhotos,
    messages: [
      { id: "message-007-1", body: "El ingreso es por la puerta lateral.", sentAt: "10:24", sender: "client" },
      { id: "message-007-2", body: "Perfecto, llegaré quince minutos antes.", sentAt: "10:28", sender: "worker" }
    ]
  },
  {
    id: "job-008",
    title: "Reparacion de grifo",
    category: "Gasfitero",
    location: "Av. Arequipa 1280, Lince",
    price: "S/ 65.00",
    time: "01 Jun, 03:00 PM",
    status: "COMPLETADO",
    detail: {
      id: "job-008",
      clientName: "Oscar Medina",
      rating: "4.7",
      completedServices: 14,
      title: "Reparacion de grifo",
      category: "Gasfitero",
      description: "Se reemplazó el cartucho del grifo de cocina y se verificó que no existan fugas.",
      address: "Av. Arequipa 1280, Lince",
      distance: "4.6 km de ti",
      availability: "01 Jun, 3:00 PM",
      materials: "Cartucho incluido",
      duration: "1 hora",
      paymentAmount: "S/ 65.00"
    },
    referencePhotos: plumbingPhotos,
    messages: []
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
