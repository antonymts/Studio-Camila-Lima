const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Trigger on new appointment creation in Firestore
exports.notifyNewAppointment = functions.firestore
  .document('studios/camilalima/appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const appointmentId = context.params.appointmentId;

    if (!appointment || appointment.status !== 'pending') {
      return null;
    }

    try {
      // Get studio profile for admin notification email
      const profileSnap = await admin
        .firestore()
        .doc('studios/camilalima/info/profile')
        .get();

      const profile = profileSnap.exists ? profileSnap.data() : {};
      const recipientEmail = profile.notificationEmail || 'camilalima@studio.com';

      // Setup nodemailer transport
      const resendApiKey = process.env.RESEND_API_KEY;
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!resendApiKey && !smtpHost) {
        console.log(`[CLOUD FUNCTION LOG] New appointment ${appointmentId} created. Configure SMTP or RESEND_API_KEY in functions config to send live emails.`);
        return null;
      }

      let transporter;
      if (resendApiKey) {
        transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: { user: 'resend', pass: resendApiKey },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: smtpUser, pass: smtpPass },
        });
      }

      let formattedDate = appointment.date;
      if (appointment.date && appointment.date.includes('-')) {
        const [y, m, d] = appointment.date.split('-');
        formattedDate = `${d}/${m}/${y}`;
      }

      const subject = 'Novo agendamento pendente - Studio Camila Lima';
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ffe4e6; border-radius: 20px; background-color: #ffffff; color: #4c0519;">
          <h2 style="color: #881337; margin: 0;">Studio Camila Lima</h2>
          <p style="color: #9f1239; font-size: 14px;">Novo Agendamento Pendente</p>
          <p>Olá!</p>
          <p>Você recebeu uma nova solicitação de agendamento no <strong>Studio Camila Lima</strong>.</p>
          <div style="background-color: #fff1f2; padding: 18px; border-radius: 16px; margin: 20px 0; border: 1px solid #fecdd3;">
            <p><strong>💅 Serviço:</strong> ${appointment.serviceTitle}</p>
            <p><strong>👤 Cliente:</strong> ${appointment.clientName}</p>
            <p><strong>📅 Data:</strong> ${formattedDate}</p>
            <p><strong>⏰ Horário:</strong> ${appointment.time}</p>
            <p><strong>📱 WhatsApp:</strong> ${appointment.clientWhatsapp}</p>
          </div>
          <p>Acesse o painel administrativo para confirmar ou recusar o horário.</p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Studio Camila Lima" <nao-responder@studiocamilalima.com>',
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      console.log(`Successfully sent email notification for appointment ${appointmentId} to ${recipientEmail}`);
      return true;
    } catch (err) {
      console.error('Error sending email notification:', err);
      return null;
    }
  });
