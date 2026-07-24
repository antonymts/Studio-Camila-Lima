import { BusinessHours, Appointment, BlockedSlot, DaySchedule } from '../types';
import { timeToMinutes, minutesToTime } from '../services/db';

export interface TimeSlot {
  time: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
  reason?: string;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function getAvailableSlots(
  dateStr: string, // YYYY-MM-DD
  durationMinutes: number,
  businessHours: BusinessHours,
  existingAppointments: Appointment[],
  blockedSlots: BlockedSlot[]
): TimeSlot[] {
  if (!dateStr || !durationMinutes) return [];

  // Determine day of week
  // Add timezone fix for YYYY-MM-DD string parsing
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeekIndex = dateObj.getDay();
  const dayKey = DAY_KEYS[dayOfWeekIndex];

  const schedule: DaySchedule = businessHours[dayKey];

  if (!schedule || !schedule.isOpen) {
    return []; // Studio closed on this day
  }

  // Check if entire day is blocked
  const fullDayBlock = blockedSlots.find((b) => b.date === dateStr && b.fullDay);
  if (fullDayBlock) {
    return []; // Full day blocked
  }

  const openMins = timeToMinutes(schedule.openTime);
  const closeMins = timeToMinutes(schedule.closeTime);

  const breakStartMins = schedule.breakStart ? timeToMinutes(schedule.breakStart) : null;
  const breakEndMins = schedule.breakEnd ? timeToMinutes(schedule.breakEnd) : null;

  const now = new Date();
  const isToday =
    now.getFullYear() === year &&
    now.getMonth() === month - 1 &&
    now.getDate() === day;
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes() + 15; // +15 min buffer for today

  // Filter blocked slots for this date
  const dayBlocks = blockedSlots.filter((b) => b.date === dateStr && !b.fullDay);

  // Filter active appointments for this date
  const dayApps = existingAppointments.filter((app) => {
    if (app.date !== dateStr || app.status === 'cancelled') return false;
    // Check if expired pending
    if (app.status === 'pending' && app.expiresAt) {
      if (new Date(app.expiresAt).getTime() < now.getTime()) {
        return false; // Expired reservation
      }
    }
    return true;
  });

  const slots: TimeSlot[] = [];
  const step = 30; // Generate slots every 30 minutes

  for (let t = openMins; t + durationMinutes <= closeMins; t += step) {
    const slotStart = t;
    const slotEnd = t + durationMinutes;

    // 1. If today, check if time has already passed
    if (isToday && slotStart < currentMinutesToday) {
      continue;
    }

    // 2. Check overlap with lunch break
    if (breakStartMins !== null && breakEndMins !== null) {
      // Overlap condition: max(slotStart, breakStart) < min(slotEnd, breakEnd)
      if (Math.max(slotStart, breakStartMins) < Math.min(slotEnd, breakEndMins)) {
        continue;
      }
    }

    // 3. Check overlap with manual blocks
    let isBlocked = false;
    for (const block of dayBlocks) {
      if (block.startTime && block.endTime) {
        const bStart = timeToMinutes(block.startTime);
        const bEnd = timeToMinutes(block.endTime);
        if (Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd)) {
          isBlocked = true;
          break;
        }
      }
    }
    if (isBlocked) continue;

    // 4. Check overlap with existing active appointments
    let hasConflict = false;
    for (const app of dayApps) {
      const appStart = timeToMinutes(app.time);
      const appEnd = timeToMinutes(app.endTime);

      if (Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      slots.push({
        time: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        available: true,
      });
    }
  }

  return slots;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatTimeInterval(timeStr: string, durationMinutes: number): string {
  const startMins = timeToMinutes(timeStr);
  const endMins = startMins + durationMinutes;
  return `${timeStr} às ${minutesToTime(endMins)}`;
}
