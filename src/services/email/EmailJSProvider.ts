import emailjs from '@emailjs/browser';
import { IEmailProvider, AppointmentNotificationData } from './types';

export class EmailJSProvider implements IEmailProvider {
  name = 'EmailJS';

  async send(data: AppointmentNotificationData): Promise<{ success: boolean; message?: string; error?: string }> {
    const env = (import.meta as any).env || {};

    const publicKey = env.VITE_EMAILJS_PUBLIC_KEY || '';
    const serviceId = env.VITE_EMAILJS_SERVICE_ID || '';
    const templateId = env.VITE_EMAILJS_TEMPLATE_ID || '';

    let formattedDate = data.date;
    if (data.date && data.date.includes('-')) {
      const [y, m, d] = data.date.split('-');
      formattedDate = `${d}/${m}/${y}`;
    }

    const adminPanelUrl = env.VITE_APP_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://studio-camila-lima.vercel.app');

    const templateParams = {
      appointment_id: data.appointmentId,
      client_name: data.clientName,
      service_title: data.serviceTitle,
      date: formattedDate,
      time: data.time,
      client_whatsapp: data.clientWhatsapp,
      notification_email: data.notificationEmail || 'camilalima@studio.com',
      to_email: data.notificationEmail || 'camilalima@studio.com',
      subject: 'Novo agendamento pendente - Studio Camila Lima',
      admin_panel_url: adminPanelUrl,
      message: `Novo agendamento de ${data.clientName} para ${data.serviceTitle} no dia ${formattedDate} às ${data.time}. WhatsApp: ${data.clientWhatsapp}`,
    };

    console.log('[EmailJS] Provedor selecionado: EmailJS');
    console.log('[EmailJS] Public Key carregada:', Boolean(publicKey));
    console.log('[EmailJS] Service ID carregado:', Boolean(serviceId));
    console.log('[EmailJS] Template ID carregado:', Boolean(templateId));
    console.log('[EmailJS] Objeto templateParams completo:', templateParams);

    if (!publicKey || !serviceId || !templateId) {
      console.log('[EmailJSProvider LOG] EmailJS credentials not set in environment (VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID). Notification logged.');
      return {
        success: true,
        message: 'Aviso: Chaves do EmailJS não configuradas. Notificação gerada no log.',
      };
    }

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log('Email enviado com sucesso');
      return { success: true, message: 'Email enviado com sucesso via EmailJS' };
    } catch (err: any) {
      console.error('[EmailJS Error] Erro retornado pelo EmailJS:', err);
      return {
        success: false,
        error: err?.text || err?.message || 'Erro ao enviar e-mail via EmailJS',
      };
    }
  }
}

export const emailJSProvider = new EmailJSProvider();
