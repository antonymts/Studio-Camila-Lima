export interface AppointmentNotificationData {
  appointmentId: string;
  clientName: string;
  serviceTitle: string;
  date: string;
  time: string;
  clientWhatsapp: string;
  notificationEmail?: string;
}

export type EmailProviderType = 'resend' | 'emailjs';

export interface EmailSettings {
  provider: EmailProviderType;
}

export interface IEmailProvider {
  name: string;
  send(data: AppointmentNotificationData): Promise<{ success: boolean; message?: string; error?: string }>;
}
