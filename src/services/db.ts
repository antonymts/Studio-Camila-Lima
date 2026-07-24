import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';

import {
  Service,
  Appointment,
  BusinessHours,
  BlockedSlot,
  StudioProfile,
  StudioPolicies,
  GalleryItem,
  AppointmentStatus,
} from '../types';

export const STUDIO_ID = 'camilalima';

// Root references
const studioRef = doc(db, 'studios', STUDIO_ID);
const profileRef = doc(db, 'studios', STUDIO_ID, 'info', 'profile');
const businessHoursRef = doc(db, 'studios', STUDIO_ID, 'settings', 'businessHours');
const policiesRef = doc(db, 'studios', STUDIO_ID, 'settings', 'policies');

const servicesCollection = collection(db, 'studios', STUDIO_ID, 'services');
const appointmentsCollection = collection(db, 'studios', STUDIO_ID, 'appointments');
const blockedSlotsCollection = collection(db, 'studios', STUDIO_ID, 'blockedSlots');
const galleryCollection = collection(db, 'studios', STUDIO_ID, 'gallery');

// Initial Default Profile Data
export const defaultProfile: StudioProfile = {
  name: 'Studio Camila Lima',
  ownerName: 'Camila Lima',
  profession: 'Nail Designer',
  bio: 'Especialista em unhas em gel, promovendo elegância, acabamento delicado e durabilidade para valorizar sua beleza natural.',
  whatsapp: '5582996844810',
  instagram: 'studiocamilalima._',
  address: 'Rua Regente Feijó, 81',
  neighborhood: 'Ponta da Terra',
  city: 'Maceió - AL',
  mapLink: 'https://maps.google.com/?q=Rua+Regente+Feij%C3%B3,+81+-+Ponta+da+Terra,+Macei%C3%B3+-+AL',
  pixKey: '82996844810',
  pixKeyType: 'Telefone (Chave Pix)',
  pendingExpirationMinutes: 15,
};

// Initial Default Business Hours
export const defaultBusinessHours: BusinessHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breakStart: '12:00', breakEnd: '13:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
  sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
};

// Initial Default Policies
export const defaultPolicies: StudioPolicies = {
  depositInfo: 'Para garantir a reserva exclusiva do seu horário, todos os agendamentos são confirmados apenas mediante o pagamento do sinal de 50%. O valor do sinal é abatido no dia do procedimento.',
  cancellationInfo: 'Caso seja necessário reagendar ou cancelar, o aviso deve ser feito com no mínimo 12 horas de antecedência. Reagendamentos solicitados após esse prazo, bem como não comparecimentos, implicam na perda do valor do sinal.',
  delayToleranceInfo: 'Tolerância máxima de atraso de 15 minutos, desde que avisado previamente com antecedência. Atrasos superiores poderão resultar no cancelamento do horário para não comprometer as clientes seguintes.',
};

// Initial Services List
export const defaultServices: Omit<Service, 'id'>[] = [
  {
    title: 'Alongamento em Gel - Aplicação',
    category: 'Alongamento em Gel',
    description: 'Ideal para quem deseja alongar as unhas naturais com elegância e sofisticação. O Alongamento em Gel oferece um acabamento delicado e natural, aliado à alta resistência e durabilidade.',
    type: 'application',
    price: 100,
    durationMinutes: 150, // 2h30
    durability: '20 a 30 dias',
    position: 1,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Alongamento em Gel - Manutenção',
    category: 'Alongamento em Gel',
    description: 'Manutenção periódica para preenchimento da raiz em crescimento, nivelamento e reforço da estrutura do gel para manter a durabilidade e beleza intactas.',
    type: 'maintenance',
    price: 80,
    durationMinutes: 120, // 2h
    durability: '20 a 30 dias',
    position: 2,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Banho em Gel - Aplicação',
    category: 'Banho em Gel',
    description: 'Perfeito para quem busca unhas naturais mais fortes e protegidas, sem perder a leveza e a beleza. Cria uma camada de resistência que auxilia no crescimento saudável.',
    type: 'application',
    price: 80,
    durationMinutes: 120, // 2h
    durability: '20 a 30 dias',
    position: 3,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Banho em Gel - Manutenção',
    category: 'Banho em Gel',
    description: 'Manutenção periódica para reajuste do crescimento natural, nivelamento do alinhamento e renovação do brilho e proteção das unhas.',
    type: 'maintenance',
    price: 80,
    durationMinutes: 120, // 2h
    durability: '20 a 30 dias',
    position: 4,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Esmaltação em Gel',
    category: 'Esmaltação em Gel',
    description: 'Proporciona brilho intenso, cor vibrante e maior durabilidade em comparação ao esmalte tradicional, reduzindo o desgaste e mantendo as unhas impecáveis.',
    type: 'single',
    price: 50,
    durationMinutes: 90, // 1h30
    durability: '15 a 20 dias',
    position: 5,
    active: true,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
  },
  {
    title: 'Reposição de Unha',
    category: 'Outros Serviços',
    description: 'Reposição ou reconstrução individual para unhas com quebra ou avaria acidental.',
    type: 'single',
    price: 10,
    durationMinutes: 30,
    position: 6,
    active: true,
  },
  {
    title: 'Remoção do Alongamento',
    category: 'Outros Serviços',
    description: 'Remoção cuidadosa e segura da estrutura de gel preservando a integridade da lâmina ungueal natural.',
    type: 'single',
    price: 60,
    durationMinutes: 60,
    position: 7,
    active: true,
  },
];

// Initial Gallery Images
export const defaultGallery: Omit<GalleryItem, 'id'>[] = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    title: 'Alongamento em Gel Natural',
    category: 'Alongamento em Gel',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
    title: 'Acabamento Delicado e Elegante',
    category: 'Banho em Gel',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800',
    title: 'Banho em Gel Proteção Natural',
    category: 'Banho em Gel',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800',
    title: 'Esmaltação em Gel Nude Chic',
    category: 'Esmaltação em Gel',
  },
];

// Seed Function & Cleanup
export async function seedInitialDataIfNeeded() {
  try {
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, defaultProfile);
      await setDoc(businessHoursRef, defaultBusinessHours);
      await setDoc(policiesRef, defaultPolicies);

      for (const s of defaultServices) {
        await addDoc(servicesCollection, s);
      }

      for (const g of defaultGallery) {
        await addDoc(galleryCollection, g);
      }
      console.log('Seed do Studio Camila Lima concluído com sucesso!');
    } else {
      // Check services collection to ensure no duplicates exist from previous seeds
      const servicesSnap = await getDocs(servicesCollection);
      if (servicesSnap.empty) {
        for (const s of defaultServices) {
          await addDoc(servicesCollection, s);
        }
      } else {
        // Cleanup duplicate services if any exist
        const seenTitles = new Map<string, string>();
        for (const d of servicesSnap.docs) {
          const data = d.data();
          const normalizedTitle = (data.title || '').trim().toLowerCase();
          if (data.active !== false) {
            if (seenTitles.has(normalizedTitle)) {
              // Duplicate found! Delete the extra document to fix duplicates permanently
              await deleteDoc(d.ref);
            } else {
              seenTitles.set(normalizedTitle, d.id);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Nota sobre inicialização do banco:', err);
  }
}

// Service CRUD
export async function getStudioProfile(): Promise<StudioProfile> {
  const snap = await getDoc(profileRef);
  if (snap.exists()) {
    return snap.data() as StudioProfile;
  }
  return defaultProfile;
}

export async function updateStudioProfile(data: Partial<StudioProfile>): Promise<void> {
  await updateDoc(profileRef, data);
}

export async function getBusinessHours(): Promise<BusinessHours> {
  const snap = await getDoc(businessHoursRef);
  if (snap.exists()) {
    return snap.data() as BusinessHours;
  }
  return defaultBusinessHours;
}

export async function updateBusinessHours(data: BusinessHours): Promise<void> {
  await setDoc(businessHoursRef, data);
}

export async function getStudioPolicies(): Promise<StudioPolicies> {
  const snap = await getDoc(policiesRef);
  if (snap.exists()) {
    return snap.data() as StudioPolicies;
  }
  return defaultPolicies;
}

export async function updateStudioPolicies(data: StudioPolicies): Promise<void> {
  await setDoc(policiesRef, data);
}

// Services
export async function getServices(includeInactive = false): Promise<Service[]> {
  const snap = await getDocs(servicesCollection);
  const list: Service[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as Omit<Service, 'id'>;
    if (includeInactive || data.active !== false) {
      list.push({ id: doc.id, ...data });
    }
  });

  // Additional safety deduplication by title if active
  const uniqueList: Service[] = [];
  const seenTitles = new Set<string>();

  for (const item of list) {
    const key = `${item.title.trim().toLowerCase()}_${item.active !== false}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueList.push(item);
    }
  }

  return uniqueList.sort((a, b) => a.position - b.position);
}

export async function addService(service: Omit<Service, 'id'>): Promise<string> {
  const docRef = await addDoc(servicesCollection, service);
  return docRef.id;
}

export async function updateService(id: string, service: Partial<Service>): Promise<void> {
  const ref = doc(db, 'studios', STUDIO_ID, 'services', id);
  await updateDoc(ref, service);
}

// Clean, isolated deletion function for Services
export async function deleteServiceById(serviceId: string): Promise<boolean> {
  if (!serviceId || typeof serviceId !== 'string') {
    throw new Error('ID do serviço inválido.');
  }

  try {
    const ref = doc(db, 'studios', STUDIO_ID, 'services', serviceId);
    // Mark as inactive AND remove document from Firestore so it never re-appears
    await updateDoc(ref, { active: false }).catch(() => {});
    await deleteDoc(ref);
    console.log('[Firestore] Service deleted successfully:', serviceId);
    return true;
  } catch (err) {
    console.error('[Firestore Error] Failed to delete service:', serviceId, err);
    throw err;
  }
}

// Backward-compatible alias
export async function deleteService(id: string): Promise<void> {
  await deleteServiceById(id);
}

// Hard Delete Service
export async function hardDeleteService(id: string): Promise<void> {
  await deleteServiceById(id);
}

// Gallery
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const snap = await getDocs(galleryCollection);
  const list: GalleryItem[] = [];
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as GalleryItem);
  });
  return list;
}

export async function addGalleryItem(item: Omit<GalleryItem, 'id'>): Promise<string> {
  const ref = await addDoc(galleryCollection, item);
  return ref.id;
}

// Helper to convert File to compressed DataURL as fallback or preview
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200; // Resizes high-res phone/camera photos cleanly
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload photo directly from device to Firebase Storage (with canvas DataURL fallback)
export async function uploadGalleryPhoto(
  file: File,
  title: string,
  category: string = 'Geral'
): Promise<GalleryItem> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `studios/${STUDIO_ID}/gallery/${timestamp}_${sanitizedName}`;

  let finalImageUrl = '';

  try {
    const sRef = storageRef(storage, storagePath);
    const snapshot = await uploadBytesResumable(sRef, file);
    finalImageUrl = await getDownloadURL(snapshot.ref);
  } catch (storageErr) {
    console.warn('Firebase Storage direct upload failed or unconfigured. Using high-quality DataURL fallback:', storageErr);
    finalImageUrl = await fileToDataUrl(file);
  }

  const galleryData: Omit<GalleryItem, 'id'> = {
    imageUrl: finalImageUrl,
    title: title || 'Trabalho em Gel',
    category: category || 'Geral',
    createdAt: new Date().toISOString(),
    storagePath: storagePath,
  };

  const docRef = await addDoc(galleryCollection, galleryData);

  return {
    id: docRef.id,
    ...galleryData,
  };
}

// Clean, isolated deletion function for Gallery Images
export async function deleteGalleryImageById(
  imageId: string,
  storagePath?: string,
  imageUrl?: string
): Promise<boolean> {
  if (!imageId || typeof imageId !== 'string') {
    throw new Error('ID da foto inválido.');
  }

  // 1. Delete file from Storage if applicable
  if (storagePath) {
    try {
      const sRef = storageRef(storage, storagePath);
      await deleteObject(sRef);
      console.log('[Storage] Deleted image from Firebase Storage:', storagePath);
    } catch (err) {
      console.warn('[Storage Warning] Could not delete image from Storage:', storagePath, err);
    }
  } else if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const sRef = storageRef(storage, imageUrl);
      await deleteObject(sRef);
      console.log('[Storage] Deleted image from Firebase Storage via URL:', imageUrl);
    } catch (err) {
      console.warn('[Storage Warning] Could not delete image via URL:', imageUrl, err);
    }
  }

  // 2. Delete document from Firestore
  try {
    const ref = doc(db, 'studios', STUDIO_ID, 'gallery', imageId);
    await deleteDoc(ref);
    console.log('[Firestore] Gallery item deleted successfully:', imageId);
    return true;
  } catch (err) {
    console.error('[Firestore Error] Failed to delete gallery item:', imageId, err);
    throw err;
  }
}

// Backward-compatible alias
export async function deleteGalleryItem(id: string, storagePath?: string, imageUrl?: string): Promise<void> {
  await deleteGalleryImageById(id, storagePath, imageUrl);
}

// Blocked Slots
export async function getBlockedSlots(): Promise<BlockedSlot[]> {
  const snap = await getDocs(blockedSlotsCollection);
  const list: BlockedSlot[] = [];
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as BlockedSlot);
  });
  return list;
}

export async function addBlockedSlot(slot: Omit<BlockedSlot, 'id'>): Promise<string> {
  const ref = await addDoc(blockedSlotsCollection, slot);
  return ref.id;
}

export async function deleteBlockedSlotById(slotId: string): Promise<boolean> {
  if (!slotId || typeof slotId !== 'string') {
    throw new Error('ID do bloqueio inválido.');
  }

  try {
    const ref = doc(db, 'studios', STUDIO_ID, 'blockedSlots', slotId);
    await deleteDoc(ref);
    console.log('[Firestore] Blocked slot deleted successfully:', slotId);
    return true;
  } catch (err) {
    console.error('[Firestore Error] Failed to delete blocked slot:', slotId, err);
    throw err;
  }
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  await deleteBlockedSlotById(id);
}

// Appointments
export async function getAppointmentsByDate(dateStr: string): Promise<Appointment[]> {
  const q = query(appointmentsCollection, where('date', '==', dateStr));
  const snap = await getDocs(q);
  const list: Appointment[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    list.push({ id: doc.id, ...data } as Appointment);
  });
  return list;
}

export async function getAppointmentsByClientPhone(clientPhone: string): Promise<Appointment[]> {
  const normPhone = normalizePhone(clientPhone);
  if (!normPhone) return [];

  const list: Appointment[] = [];

  try {
    const qNorm = query(appointmentsCollection, where('clientWhatsappNorm', '==', normPhone));
    const snapNorm = await getDocs(qNorm);
    snapNorm.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Appointment);
    });
  } catch {
    // ignore query error
  }

  if (list.length === 0) {
    try {
      const q1 = query(appointmentsCollection, where('clientWhatsapp', '==', `55${normPhone}`));
      const snap1 = await getDocs(q1);
      snap1.forEach((doc) => {
        if (!list.some((a) => a.id === doc.id)) {
          list.push({ id: doc.id, ...doc.data() } as Appointment);
        }
      });
    } catch {
      // ignore
    }

    try {
      const q2 = query(appointmentsCollection, where('clientWhatsapp', '==', normPhone));
      const snap2 = await getDocs(q2);
      snap2.forEach((doc) => {
        if (!list.some((a) => a.id === doc.id)) {
          list.push({ id: doc.id, ...doc.data() } as Appointment);
        }
      });
    } catch {
      // ignore
    }
  }

  return list;
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const snap = await getDocs(appointmentsCollection);
  const list: Appointment[] = [];
  snap.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as Appointment);
  });
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  try {
    const ref = doc(db, 'studios', STUDIO_ID, 'appointments', id);
    await updateDoc(ref, { status });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    throw err;
  }
}

export async function deleteAppointmentById(appointmentId: string): Promise<boolean> {
  if (!appointmentId || typeof appointmentId !== 'string') {
    throw new Error('ID do agendamento inválido.');
  }

  try {
    const ref = doc(db, 'studios', STUDIO_ID, 'appointments', appointmentId);
    await deleteDoc(ref);
    console.log('[Firestore] Appointment deleted successfully:', appointmentId);
    return true;
  } catch (err) {
    console.error('[Firestore Error] Failed to delete appointment:', appointmentId, err);
    throw err;
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteAppointmentById(id);
}

/**
 * Creates an appointment with race condition checking.
 * Checks whether the slot is still free before writing.
 */
export async function createAppointmentTransaction(
  appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 min pending window

    // Query existing appointments for the date
    const q = query(appointmentsCollection, where('date', '==', appointmentData.date));
    const snap = await getDocs(q);

    const existingApps: Appointment[] = [];
    snap.forEach((d) => {
      existingApps.push({ id: d.id, ...d.data() } as Appointment);
    });

    // Check for overlap
    const newStart = timeToMinutes(appointmentData.time);
    const newEnd = timeToMinutes(appointmentData.endTime);

    for (const app of existingApps) {
      if (app.status === 'cancelled') continue;

      // Check if pending and expired
      if (app.status === 'pending' && app.expiresAt) {
        if (new Date(app.expiresAt).getTime() < now.getTime()) {
          continue; // Expired reservation
        }
      }

      const existStart = timeToMinutes(app.time);
      const existEnd = timeToMinutes(app.endTime);

      // Overlap condition: max(newStart, existStart) < min(newEnd, existEnd)
      if (Math.max(newStart, existStart) < Math.min(newEnd, existEnd)) {
        return {
          success: false,
          error: 'Desculpe, este horário acabou de ser reservado por outra cliente. Por favor, escolha outro horário disponível.',
        };
      }
    }

    const fullAppointment: Omit<Appointment, 'id'> & { clientWhatsappNorm?: string } = {
      ...appointmentData,
      clientWhatsappNorm: normalizePhone(appointmentData.clientWhatsapp),
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt,
    };

    const docRef = await addDoc(appointmentsCollection, fullAppointment);
    return { success: true, id: docRef.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao agendar horário.' };
  }
}

// Helper time converters and phone normalizer
export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
