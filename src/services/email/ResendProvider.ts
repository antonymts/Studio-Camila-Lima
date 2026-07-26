import { IEmailProvider, AppointmentNotificationData } from './types';

export class ResendProvider implements IEmailProvider {
  name = 'Resend';

  async send(data: AppointmentNotificationData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/notify-new-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn('[ResendProvider] Error sending email via endpoint:', errJson);
        return {
          success: false,
          error: errJson.error || `HTTP ${response.status}`,
        };
      }

      const resJson = await response.json().catch(() => ({ success: true }));
      return {
        success: true,
        message: resJson.message || 'Notification sent via Resend',
      };
    } catch (err: any) {
      console.warn('[ResendProvider] Exception:', err);
      return {
        success: false,
        error: err.message || 'Error communicating with Resend notification endpoint',
      };
    }
  }
}

export const resendProvider = new ResendProvider();
