import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { STUDIO_ID } from '../db';
import { AppointmentNotificationData, EmailProviderType, EmailSettings, IEmailProvider } from './types';
import { resendProvider } from './ResendProvider';
import { emailJSProvider } from './EmailJSProvider';

const emailSettingsRef = doc(db, 'studios', STUDIO_ID, 'settings', 'email');

export class EmailService {
  private providers: Record<EmailProviderType, IEmailProvider> = {
    resend: resendProvider,
    emailjs: emailJSProvider,
  };

  /**
   * Fetches the current active email provider setting from Firestore.
   * Defaults to 'resend' if no setting exists.
   */
  async getEmailSettings(): Promise<EmailSettings> {
    try {
      const snap = await getDoc(emailSettingsRef);
      if (snap.exists()) {
        const data = snap.data() as EmailSettings;
        if (data && (data.provider === 'emailjs' || data.provider === 'resend')) {
          return { provider: data.provider };
        }
      }
    } catch (err) {
      console.warn('[EmailService] Failed to read email settings from Firestore, defaulting to resend:', err);
    }
    return { provider: 'resend' };
  }

  /**
   * Saves the active email provider configuration to Firestore.
   */
  async updateEmailSettings(settings: EmailSettings): Promise<void> {
    await setDoc(emailSettingsRef, settings, { merge: true });
  }

  /**
   * Main entrypoint for sending new appointment email notifications.
   * Dynamically inspects the active provider and dispatches to ResendProvider or EmailJSProvider.
   */
  async send(data: AppointmentNotificationData): Promise<{ success: boolean; message?: string; error?: string }> {
    const settings = await this.getEmailSettings();
    const activeProviderName = settings.provider || 'resend';
    const provider = this.providers[activeProviderName] || this.providers.resend;

    console.log(`[EmailService] Provedor escolhido após leitura do Firestore: ${activeProviderName}`);
    return provider.send(data);
  }
}

export const emailService = new EmailService();
