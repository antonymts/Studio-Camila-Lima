export type ServiceType = 'application' | 'maintenance' | 'single';

export interface Service {
  id: string;
  title: string;
  category: 'Alongamento em Gel' | 'Banho em Gel' | 'Esmaltação em Gel' | 'Outros Serviços';
  description: string;
  type: ServiceType;
  price: number;
  durationMinutes: number; // ex: 150 min (2h30min)
  durability?: string; // ex: "20 a 30 dias"
  position: number;
  active: boolean;
  imageUrl?: string;
}

export type AppointmentStatus =
  | 'pending'            // Solicitação inicial do cliente
  | 'waiting_deposit'    // Aguardando sinal de 50%
  | 'confirmed'          // Confirmado pela Camila
  | 'rescheduled'        // Reagendado
  | 'completed'          // Atendimento realizado
  | 'denied'             // Negado pelo administrador
  | 'cancelled';         // Cancelado

export interface Appointment {
  id: string;
  clientName: string;
  clientWhatsapp: string;
  serviceId: string;
  serviceTitle: string;
  price: number; // Total price
  basePrice?: number;
  replacement?: 'Nenhuma' | '1 unha' | '2 unhas ou mais';
  replacementPrice?: number;
  totalPrice?: number;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
  endTime: string; // Formato HH:mm (calculado: time + durationMinutes)
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string; // ISO string
  expiresAt?: string; // Reserva temporária para solicitações pendentes
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string; // ex: "09:00"
  closeTime: string; // ex: "18:00"
  breakStart?: string; // ex: "12:00"
  breakEnd?: string; // ex: "13:00"
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  fullDay: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  reason: string;
}

export interface StudioProfile {
  name: string;
  ownerName: string;
  profession: string;
  bio: string;
  whatsapp: string;
  instagram: string;
  address: string;
  neighborhood: string;
  city: string;
  mapLink: string;
  pixKey: string;
  pixKeyType: string;
  pendingExpirationMinutes: number; // ex: 15 min
  logoUrl?: string;
  notificationEmail?: string;
}

export interface StudioPolicies {
  depositInfo: string;
  cancellationInfo: string;
  delayToleranceInfo: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  createdAt?: string;
  storagePath?: string;
}
