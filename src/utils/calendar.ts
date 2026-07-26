import { Appointment, StudioProfile } from '../types';
import { formatDateBR } from './timeSlots';

// Helper to format local date string YYYY-MM-DD and time HH:mm into ISO strings and ICS formats
export function getAppointmentDateTimeRange(app: Appointment) {
  const [year, month, day] = app.date.split('-').map(Number);
  const [startHour, startMin] = app.time.split(':').map(Number);

  // Parse start time (in local Maceió time)
  const startDate = new Date(year, month - 1, day, startHour, startMin, 0);

  // Parse end time (using app.endTime or durationMinutes)
  let endDate: Date;
  if (app.endTime) {
    const [endHour, endMin] = app.endTime.split(':').map(Number);
    endDate = new Date(year, month - 1, day, endHour, endMin, 0);
  } else {
    endDate = new Date(startDate.getTime() + (app.durationMinutes || 60) * 60 * 1000);
  }

  return { startDate, endDate };
}

// Format Date object to UTC string for ICS (YYYYMMDDTHHmmssZ)
function formatICSUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

// Format local date and time YYYYMMDDTHHmm00
function formatICSLocal(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '');
  return `${cleanDate}T${cleanTime}00`;
}

export function buildEventDetails(app: Appointment) {
  const title = `${app.serviceTitle} - ${app.clientName}`;

  let description = `Cliente: ${app.clientName}\nServiço: ${app.serviceTitle}\nWhatsApp: ${app.clientWhatsapp}`;
  if (app.replacement) {
    description += `\nReposição de Unha: ${app.replacement}`;
  }
  if (app.notes) {
    description += `\nObservações: ${app.notes}`;
  }

  const location = 'Studio Camila Lima - Rua Regente Feijó, 81, Ponta da Terra, Maceió - AL';

  return { title, description, location };
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(app: Appointment) {
  const { startDate, endDate } = getAppointmentDateTimeRange(app);
  const { title, description, location } = buildEventDetails(app);

  const startUtc = formatICSUtc(startDate);
  const endUtc = formatICSUtc(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: description,
    location: location,
    ctz: 'America/Maceio',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate .ics File Content
export function generateICSContent(app: Appointment, profile?: StudioProfile | null) {
  const { startDate, endDate } = getAppointmentDateTimeRange(app);
  const { title, description } = buildEventDetails(app);

  const studioLocation = profile
    ? `${profile.name} - ${profile.address}, ${profile.neighborhood}, ${profile.city}`
    : 'Studio Camila Lima - Rua Regente Feijó, 81, Ponta da Terra, Maceió - AL';

  const dtStamp = formatICSUtc(new Date());
  const dtStartUtc = formatICSUtc(startDate);
  const dtEndUtc = formatICSUtc(endDate);

  // Escape special characters in text fields according to iCalendar spec RFC 5545
  const escapeICS = (str: string) =>
    str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studio Camila Lima//Agendamentos//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:appointment-${app.id}@studiocamilalima.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStartUtc}`,
    `DTEND:${dtEndUtc}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `LOCATION:${escapeICS(studioLocation)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}

// Trigger ICS File Download
export function downloadICSFile(app: Appointment, profile?: StudioProfile | null) {
  const content = generateICSContent(app, profile);
  const cleanClientName = app.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `agendamento-${cleanClientName}-${app.date}.ics`;

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
