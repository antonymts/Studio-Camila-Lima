import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;

app.use(express.json());

// Track sent notification emails to prevent duplicates
const notifiedAppointmentIds = new Set<string>();

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint: Notify Admin of New Pending Appointment via Email
app.post('/api/notify-new-appointment', async (req, res) => {
  try {
    const {
      appointmentId,
      clientName,
      serviceTitle,
      date,
      time,
      clientWhatsapp,
      notificationEmail = 'camilalima@studio.com',
    } = req.body;

    if (!appointmentId || !clientName) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    // Prevent duplicate emails for the same appointment
    if (notifiedAppointmentIds.has(appointmentId)) {
      return res.json({ success: true, message: 'Notificação já enviada anteriormente' });
    }

    notifiedAppointmentIds.add(appointmentId);

    // Format Date to BR format DD/MM/YYYY
    let formattedDate = date;
    if (date && date.includes('-')) {
      const [y, m, d] = date.split('-');
      formattedDate = `${d}/${m}/${y}`;
    }

    const recipientEmail = notificationEmail || 'camilalima@studio.com';
    const appUrl = process.env.APP_URL || 'https://ais-dev-7eg67del673go6sz7el4wh-368469246860.us-east1.run.app';

    const subject = 'Novo agendamento pendente - Studio Camila Lima';

    const textContent = `Olá!

Você recebeu uma nova solicitação de agendamento no Studio Camila Lima.

Cliente: ${clientName}
Serviço: ${serviceTitle}
Data: ${formattedDate}
Horário: ${time}
WhatsApp: ${clientWhatsapp}

O agendamento está aguardando confirmação.

Acesse o painel administrativo para confirmar ou recusar o horário:
${appUrl}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ffe4e6; border-radius: 20px; background-color: #ffffff; color: #4c0519;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #881337; margin: 0; font-size: 22px;">Studio Camila Lima</h2>
          <p style="color: #9f1239; font-size: 14px; margin-top: 4px;">Novo Agendamento Pendente</p>
        </div>

        <p style="font-size: 15px; line-height: 1.5; color: #4c0519;">Olá!</p>
        <p style="font-size: 15px; line-height: 1.5; color: #4c0519;">Você recebeu uma nova solicitação de agendamento no <strong>Studio Camila Lima</strong>.</p>

        <div style="background-color: #fff1f2; padding: 18px; border-radius: 16px; margin: 20px 0; border: 1px solid #fecdd3;">
          <p style="margin: 8px 0; font-size: 14px;"><strong>💅 Serviço:</strong> ${serviceTitle}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>👤 Cliente:</strong> ${clientName}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>📅 Data:</strong> ${formattedDate}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>⏰ Horário:</strong> ${time}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>📱 WhatsApp:</strong> ${clientWhatsapp}</p>
        </div>

        <p style="font-size: 14px; color: #881337;">O agendamento está aguardando sua confirmação no painel.</p>

        <div style="text-align: center; margin-top: 28px; margin-bottom: 16px;">
          <a href="${appUrl}" style="background-color: #881337; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(136, 19, 55, 0.2);">
            Ver agendamento no painel
          </a>
        </div>
      </div>
    `;

    // Check if SMTP or Resend credentials exist
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (resendApiKey || (smtpHost && smtpUser && smtpPass)) {
      let transporter: nodemailer.Transporter;

      if (resendApiKey) {
        transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: resendApiKey,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      }

      const fromAddress = process.env.SMTP_FROM || '"Studio Camila Lima" <onboarding@resend.dev>';

      await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EMAIL NOTIFICATION] Email sent successfully to ${recipientEmail} for appointment ${appointmentId}`);
      return res.json({ success: true, status: 'sent', recipient: recipientEmail });
    } else {
      console.log(`[EMAIL NOTIFICATION LOG] New pending appointment recorded.`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${textContent}`);
      console.log(`[NOTE] SMTP/Resend credentials not set in environment. Set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS in .env to deliver real emails.`);

      return res.json({
        success: true,
        status: 'logged',
        recipient: recipientEmail,
        message: 'Notificação gravada no servidor. Configure RESEND_API_KEY ou SMTP para envio ao vivo.',
      });
    }
  } catch (error: any) {
    console.error('[EMAIL NOTIFICATION ERROR]', error);
    return res.status(500).json({ error: error.message || 'Erro ao processar notificação de e-mail' });
  }
});

async function startServer() {
  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
