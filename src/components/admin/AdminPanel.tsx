import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Settings,
  Image as ImageIcon,
  LogOut,
  Sparkles,
  Search,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Upload,
  Loader2,
  Download,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar';
import {
  Appointment,
  Service,
  BusinessHours,
  BlockedSlot,
  StudioProfile,
  StudioPolicies,
  GalleryItem,
  AppointmentStatus,
} from '../../types';
import {
  getAllAppointments,
  getServices,
  getBusinessHours,
  getBlockedSlots,
  getStudioProfile,
  getStudioPolicies,
  getGalleryItems,
  updateAppointmentStatus,
  deleteAppointmentById,
  addService,
  updateService,
  deleteServiceById,
  updateBusinessHours,
  addBlockedSlot,
  deleteBlockedSlotById,
  updateStudioProfile,
  updateStudioPolicies,
  addGalleryItem,
  uploadGalleryPhoto,
  deleteGalleryImageById,
} from '../../services/db';

import { formatDateBR } from '../../utils/timeSlots';
import { emailService, EmailProviderType } from '../../services/email';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshPublicData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefreshPublicData }) => {
  const { isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'services' | 'hours' | 'gallery' | 'settings'>('overview');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [policies, setPolicies] = useState<StudioPolicies | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [emailProvider, setEmailProvider] = useState<EmailProviderType>('resend');

  const [loading, setLoading] = useState<boolean>(true);
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals inside Admin
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockFullDay, setBlockFullDay] = useState<boolean>(true);
  const [blockStart, setBlockStart] = useState<string>('12:00');
  const [blockEnd, setBlockEnd] = useState<string>('13:00');
  const [blockReason, setBlockReason] = useState<string>('Folga / Evento');

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState<string>('');
  const [newGalleryTitle, setNewGalleryTitle] = useState<string>('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<string>('Alongamento em Gel');
  const [selectedGalleryFile, setSelectedGalleryFile] = useState<File | null>(null);
  const [galleryFilePreview, setGalleryFilePreview] = useState<string>('');
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);

  // Clean Re-engineered Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: 'service' | 'gallery' | 'blockedSlot' | 'appointment' | 'logo';
    id: string;
    title: string;
    subtitle?: string;
    extraData?: any;
  }>({
    isOpen: false,
    type: 'service',
    id: '',
    title: '',
    subtitle: '',
  });
  const [isExecutingDelete, setIsExecutingDelete] = useState<boolean>(false);

  // Calendar Modal State
  const [calendarModalApp, setCalendarModalApp] = useState<Appointment | null>(null);
  const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [appsData, servsData, hoursData, blocksData, profData, polData, galData, emailSettings] = await Promise.all([
        getAllAppointments(),
        getServices(),
        getBusinessHours(),
        getBlockedSlots(),
        getStudioProfile(),
        getStudioPolicies(),
        getGalleryItems(),
        emailService.getEmailSettings(),
      ]);

      setAppointments(appsData);
      setServices(servsData);
      setBusinessHours(hoursData);
      setBlockedSlots(blocksData);
      setProfile(profData);
      setPolicies(polData);
      setGallery(galData);
      setEmailProvider(emailSettings.provider || 'resend');
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Notification Modal state for cancellation or refusal
  const [notifyModal, setNotifyModal] = useState<{
    isOpen: boolean;
    type: 'cancelled' | 'denied';
    app: Appointment | null;
  }>({ isOpen: false, type: 'cancelled', app: null });

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

    const app = appointments.find((a) => a.id === id);
    if (app && (status === 'cancelled' || status === 'denied')) {
      setNotifyModal({
        isOpen: true,
        type: status,
        app: { ...app, status },
      });
    }
  };

  // Dedicated Request Triggers for Delete Modal
  const requestDeleteService = (service: Service) => {
    if (!service || !service.id) {
      alert('Erro: ID do serviço não encontrado.');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      type: 'service',
      id: service.id,
      title: service.title,
      subtitle: `Preço: R$ ${service.price.toFixed(2)} | Categoria: ${service.category || 'Geral'}`,
    });
  };

  const requestDeleteGallery = (item: GalleryItem) => {
    if (!item || !item.id) {
      alert('Erro: ID da foto não encontrado.');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      type: 'gallery',
      id: item.id,
      title: item.title || 'Foto da Galeria',
      subtitle: `Categoria: ${item.category || 'Geral'}`,
      extraData: item,
    });
  };

  const requestDeleteBlockedSlot = (block: BlockedSlot) => {
    if (!block || !block.id) {
      alert('Erro: ID do bloqueio não encontrado.');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      type: 'blockedSlot',
      id: block.id,
      title: `Bloqueio: ${formatDateBR(block.date)}`,
      subtitle: block.reason || (block.fullDay ? 'Dia inteiro' : `${block.startTime} - ${block.endTime}`),
    });
  };

  const requestDeleteAppointment = (app: Appointment) => {
    if (!app || !app.id) {
      alert('Erro: ID do agendamento não encontrado.');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      type: 'appointment',
      id: app.id,
      title: app.clientName,
      subtitle: `${app.serviceTitle} | ${formatDateBR(app.date)} às ${app.time}`,
    });
  };

  const requestRemoveLogo = () => {
    setDeleteModalState({
      isOpen: true,
      type: 'logo',
      id: 'logo',
      title: 'Logo do Studio',
      subtitle: 'Remover logo atual do site',
    });
  };

  // Central Delete Execution Handler
  const handleConfirmDelete = async () => {
    if (!deleteModalState.id && deleteModalState.type !== 'logo') {
      alert('Erro: Identificador do item não encontrado.');
      return;
    }

    if (!isAdmin) {
      alert('Aviso de Segurança: Apenas administradores autenticados têm permissão para excluir registros.');
      setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    setIsExecutingDelete(true);

    try {
      const { type, id, extraData } = deleteModalState;

      if (type === 'service') {
        await deleteServiceById(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
        onRefreshPublicData();
      } else if (type === 'gallery') {
        const item: GalleryItem = extraData;
        await deleteGalleryImageById(id, item?.storagePath, item?.imageUrl);
        setGallery((prev) => prev.filter((g) => g.id !== id));
        onRefreshPublicData();
      } else if (type === 'blockedSlot') {
        await deleteBlockedSlotById(id);
        setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
        onRefreshPublicData();
      } else if (type === 'appointment') {
        await deleteAppointmentById(id);
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      } else if (type === 'logo') {
        if (profile) {
          const updated = { ...profile, logoUrl: '' };
          await updateStudioProfile(updated);
          setProfile(updated);
          onRefreshPublicData();
        }
      }

      setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
      alert('Excluído com sucesso.');
    } catch (err: any) {
      console.error('[Delete Operation Error] Technical details:', err);
      alert('Não foi possível excluir este item. Verifique sua conexão ou tente novamente.');
    } finally {
      setIsExecutingDelete(false);
    }
  };

  // Logo Management Handlers
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl && profile) {
        const updated = { ...profile, logoUrl: dataUrl };
        setProfile(updated);
        await updateStudioProfile({ logoUrl: dataUrl });
        onRefreshPublicData();
        alert('Logo atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (confirm('Tem certeza que deseja remover a logo do site?')) {
      if (profile) {
        const updated = { ...profile, logoUrl: '' };
        setProfile(updated);
        await updateStudioProfile({ logoUrl: '' });
        onRefreshPublicData();
        alert('Logo removida. O site exibirá o nome em texto.');
      }
    }
  };

  // Save Service
  const handleSaveService = async () => {
    if (!editingService?.title || !editingService?.price || !editingService?.durationMinutes) return;

    try {
      if (editingService.id) {
        await updateService(editingService.id, editingService);
      } else {
        await addService({
          title: editingService.title,
          category: editingService.category || 'Alongamento em Gel',
          description: editingService.description || '',
          type: editingService.type || 'single',
          price: Number(editingService.price),
          durationMinutes: Number(editingService.durationMinutes),
          durability: editingService.durability || '20 a 30 dias',
          position: services.length + 1,
          active: true,
          imageUrl: editingService.imageUrl || '',
        });
      }

      setIsServiceModalOpen(false);
      setEditingService(null);
      loadAllAdminData();
      onRefreshPublicData();
      alert(editingService.id ? 'Serviço atualizado com sucesso.' : 'Serviço adicionado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao salvar serviço:', err);
      alert('Não foi possível realizar esta ação. Tente novamente.');
    }
  };

  // Legacy delete function wrappers (delegating to new *ById functions if called)
  const handleDeleteService = async (id: string) => {
    await deleteServiceById(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    onRefreshPublicData();
  };

  // Add Blocked Slot
  const handleAddBlock = async () => {
    if (!blockDate) return;
    try {
      const blockPayload: any = {
        date: blockDate,
        fullDay: blockFullDay,
        reason: blockReason || '',
      };
      if (!blockFullDay) {
        blockPayload.startTime = blockStart;
        blockPayload.endTime = blockEnd;
      }
      await addBlockedSlot(blockPayload);

      setIsBlockModalOpen(false);
      loadAllAdminData();
      onRefreshPublicData();
      alert('Bloqueio de horário adicionado com sucesso.');
    } catch (err: any) {
      console.error('Erro ao adicionar bloqueio:', err);
      alert('Não foi possível realizar esta ação. Tente novamente.');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    await deleteBlockedSlotById(id);
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
    onRefreshPublicData();
  };

  // Save Business Hours
  const handleSaveHours = async () => {
    if (!businessHours) return;
    try {
      await updateBusinessHours(businessHours);
      alert('Horários de funcionamento atualizados com sucesso!');
      onRefreshPublicData();
    } catch (err: any) {
      console.error('Erro ao salvar horários:', err);
      alert('Não foi possível realizar esta ação. Tente novamente.');
    }
  };

  // Save Profile, Policies & Email Settings
  const handleSaveProfile = async () => {
    try {
      if (profile) await updateStudioProfile(profile);
      if (policies) await updateStudioPolicies(policies);
      await emailService.updateEmailSettings({ provider: emailProvider });
      alert('Informações do perfil, políticas e configurações de e-mail salvas!');
      onRefreshPublicData();
    } catch (err: any) {
      console.error('Erro ao salvar perfil/políticas:', err);
      alert('Não foi possível realizar esta ação. Tente novamente.');
    }
  };

  // File selection for Gallery Upload from device
  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedGalleryFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setGalleryFilePreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add Gallery Photo (from device upload or URL)
  const handleAddGallery = async () => {
    if (!selectedGalleryFile && !newGalleryUrl) {
      alert('Por favor, selecione uma foto do dispositivo ou informe uma URL.');
      return;
    }

    setIsUploadingGallery(true);
    try {
      if (selectedGalleryFile) {
        const newItem = await uploadGalleryPhoto(
          selectedGalleryFile,
          newGalleryTitle || 'Trabalho em Gel',
          newGalleryCategory || 'Geral'
        );
        setGallery((prev) => [newItem, ...prev]);
        alert('Foto adicionada à galeria com sucesso.');
      } else if (newGalleryUrl) {
        const id = await addGalleryItem({
          imageUrl: newGalleryUrl,
          title: newGalleryTitle || 'Trabalho em Gel',
          category: newGalleryCategory || 'Geral',
          createdAt: new Date().toISOString(),
        });
        setGallery((prev) => [
          {
            id,
            imageUrl: newGalleryUrl,
            title: newGalleryTitle || 'Trabalho em Gel',
            category: newGalleryCategory || 'Geral',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        alert('Foto adicionada à galeria com sucesso.');
      }

      // Reset modal state
      setSelectedGalleryFile(null);
      setGalleryFilePreview('');
      setNewGalleryUrl('');
      setNewGalleryTitle('');
      setIsGalleryModalOpen(false);
      onRefreshPublicData();
    } catch (err: any) {
      console.error('Erro ao adicionar foto à galeria:', err);
      alert('Não foi possível realizar esta ação. Tente novamente.');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Delete Gallery Item
  const handleDeleteGallery = async (item: GalleryItem) => {
    await deleteGalleryImageById(item.id, item.storagePath, item.imageUrl);
    setGallery((prev) => prev.filter((g) => g.id !== item.id));
    onRefreshPublicData();
  };


  // Helper functions for WhatsApp message templates
  const getConfirmedWhatsappMessage = (app: Appointment) => {
    return `Olá, ${app.clientName}! 💕\nAqui é do Studio Camila Lima! Passando para informar que seu agendamento foi confirmado com sucesso. ✨\n\n💅 Serviço: ${app.serviceTitle}\n📅 Data: ${formatDateBR(app.date)}\n⏰ Horário: ${app.time}\n\nEstamos te esperando! 🥰\nCaso precise cancelar ou reagendar, entre em contato conosco com antecedência.\n\nAté lá! 💖`;
  };

  const getDeniedWhatsappMessage = (app: Appointment) => {
    return `Olá, ${app.clientName}! 💕\nAqui é do Studio Camila Lima! Entramos em contato para informar que, infelizmente, não foi possível confirmar o seu agendamento. 😔\n\n💅 Serviço solicitado: ${app.serviceTitle}\n📅 Data: ${formatDateBR(app.date)}\n⏰ Horário solicitado: ${app.time}\n\nPedimos desculpas pelo inconveniente! Você pode acessar nosso site novamente para escolher outro horário disponível ou, se preferir, falar conosco por aqui. 💖`;
  };

  // Open WhatsApp Client link
  const openClientWhatsapp = (app: Appointment, customText?: string) => {
    let text = customText;
    if (!text) {
      if (app.status === 'confirmed') {
        text = getConfirmedWhatsappMessage(app);
      } else if (app.status === 'denied' || app.status === 'cancelled') {
        text = getDeniedWhatsappMessage(app);
      } else {
        text = `Olá, ${app.clientName}! Falo do Studio Camila Lima em relação ao seu agendamento de ${app.serviceTitle} no dia ${formatDateBR(app.date)} às ${app.time}.`;
      }
    }
    window.open(`https://wa.me/${app.clientWhatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  // Filter active appointments for today (exclude cancelled, denied, rescheduled)
  const todayAppointments = appointments.filter(
    (a) =>
      a.date === todayStr &&
      a.status !== 'cancelled' &&
      a.status !== 'denied' &&
      a.status !== 'rescheduled'
  );
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  // Filtered Appointments
  const filteredApps = appointments.filter((app) => {
    if (filterDate && app.date !== filterDate) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        app.clientName.toLowerCase().includes(term) ||
        app.clientWhatsapp.includes(term) ||
        app.serviceTitle.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-rose-950 text-rose-950 flex flex-col font-sans overflow-hidden">
      {/* Admin Navbar */}
      <div className="bg-rose-950 text-white px-4 sm:px-6 py-3 border-b border-rose-800/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-rose-900 text-rose-300 transition-colors"
            title="Voltar ao site público"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg flex items-center gap-1.5">
              <span>Painel Administrativo</span>
              <span className="text-xs bg-amber-400 text-rose-950 font-sans font-bold px-2 py-0.5 rounded-full">
                Camila Lima
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      {/* Admin Subtabs Bar */}
      <div className="bg-rose-900 text-rose-100 px-4 flex items-center gap-1 overflow-x-auto border-b border-rose-800 shrink-0 no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Resumo & Hoje</span>
          {pendingAppointments.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-rose-950 text-[10px] font-bold">
              {pendingAppointments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Gestão de Agendamentos</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'services'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Serviços & Preços</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'hours'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários & Folgas</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'gallery'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Galeria</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'border-amber-300 text-white font-bold'
              : 'border-transparent text-rose-200/80 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="bg-rose-50 grow overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-rose-800">
              <div className="w-8 h-8 border-3 border-rose-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Carregando dados da agenda...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-rose-700">Atendimentos de Hoje</p>
                        <p className="text-3xl font-bold text-rose-950 mt-1">{todayAppointments.length}</p>
                      </div>
                      <div className="p-3 bg-rose-100 text-rose-900 rounded-2xl">
                        <CalendarCheck className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-amber-700">Solicitações Pendentes</p>
                        <p className="text-3xl font-bold text-amber-900 mt-1">{pendingAppointments.length}</p>
                      </div>
                      <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700">Total Agendados</p>
                        <p className="text-3xl font-bold text-emerald-950 mt-1">
                          {appointments.filter((a) => a.status === 'confirmed').length}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Pending Requests Section */}
                  {pendingAppointments.length > 0 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="font-serif font-bold text-amber-950 text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span>Novas Solicitações Aguardando Confirmação do Sinal</span>
                      </h3>

                      <div className="space-y-3">
                        {pendingAppointments.map((app) => (
                          <div
                            key={app.id}
                            className="bg-white rounded-2xl p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-rose-950 text-base">{app.clientName}</span>
                                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                                  Pendente
                                </span>
                              </div>
                              <p className="text-xs text-rose-800 mt-1">
                                <span className="font-semibold text-rose-950">{app.serviceTitle}</span>
                                {app.replacement && (
                                  <span className="font-bold text-amber-800 ml-1">
                                    [Reposição: {app.replacement}]
                                  </span>
                                )}{' '}
                                • R$ {app.price.toFixed(2)} (Sinal R$ {(app.price / 2).toFixed(2)})
                              </p>
                              <p className="text-xs text-rose-700 mt-0.5">
                                📅 {formatDateBR(app.date)} às ⏰ {app.time} ({app.durationMinutes} min)
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => openClientWhatsapp(app, `Olá, ${app.clientName}! Recebi sua solicitação de agendamento no Studio Camila Lima para o dia ${formatDateBR(app.date)} às ${app.time}. Para confirmar seu horário, por favor envie o comprovante do sinal de 50% (R$ ${(app.price / 2).toFixed(2)}) na chave Pix: ${profile?.pixKey}.`)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Cobrar Sinal WhatsApp</span>
                              </button>

                              <button
                                onClick={() => handleStatusChange(app.id, 'confirmed')}
                                className="px-3.5 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                <span>Confirmar</span>
                              </button>

                              <button
                                onClick={() => handleStatusChange(app.id, 'denied')}
                                className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Today's Schedule */}
                  <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                    <h3 className="font-serif font-bold text-rose-950 text-lg mb-4">
                      Agenda de Hoje ({formatDateBR(todayStr)})
                    </h3>

                    {todayAppointments.length === 0 ? (
                      <p className="text-xs text-rose-700 italic py-4">
                        Nenhum atendimento agendado para o dia de hoje.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {todayAppointments.map((app) => (
                          <div
                            key={app.id}
                            className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-rose-950 text-sm sm:text-base">
                                  ⏰ {app.time} às {app.endTime}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                    app.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : app.status === 'completed'
                                      ? 'bg-blue-100 text-blue-900'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {app.status === 'confirmed'
                                    ? 'Confirmado'
                                    : app.status === 'completed'
                                    ? 'Concluído'
                                    : 'Pendente'}
                                </span>
                              </div>
                              <p className="text-xs text-rose-900 font-semibold mt-1">
                                {app.clientName} — {app.serviceTitle}
                                {app.replacement && (
                                  <span className="text-amber-800 font-bold ml-1">
                                    [Reposição: {app.replacement}]
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {app.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => setCalendarModalApp(app)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs flex items-center gap-1 transition-colors"
                                  title="Adicionar agendamento ao calendário"
                                >
                                  <CalendarCheck className="w-3.5 h-3.5 text-rose-800" />
                                  <span>{addedToCalendarIds.has(app.id) ? 'No calendário' : 'Adicionar ao calendário'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => openClientWhatsapp(app)}
                                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                title="Abrir WhatsApp"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              {app.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(app.id, 'completed')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-900 text-white text-xs font-semibold"
                                >
                                  Concluir Atendimento
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS MANAGEMENT */}
              {activeTab === 'appointments' && (
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-rose-950 text-xl">
                        Todos os Agendamentos
                      </h3>
                      <p className="text-xs text-rose-800">
                        Gerencie os horários, altere o status e fale com as clientes no WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 uppercase mb-1">
                        Buscar por Nome ou WhatsApp
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Digite para buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-rose-200 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 uppercase mb-1">
                        Filtrar por Data
                      </label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-900 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs bg-white"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="confirmed">Confirmados</option>
                        <option value="completed">Concluídos</option>
                        <option value="denied">Recusados</option>
                        <option value="cancelled">Cancelados</option>
                        <option value="rescheduled">Reagendados</option>
                      </select>
                    </div>
                  </div>

                  {/* Appointments List Table */}
                  <div className="space-y-3">
                    {filteredApps.length === 0 ? (
                      <p className="text-xs text-center py-8 text-rose-700">
                        Nenhum agendamento encontrado para os filtros selecionados.
                      </p>
                    ) : (
                      filteredApps.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-2xl border border-rose-100 hover:border-rose-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-rose-950 text-base">{app.clientName}</span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  app.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : app.status === 'completed'
                                    ? 'bg-blue-100 text-blue-900'
                                    : app.status === 'denied'
                                    ? 'bg-rose-100 text-rose-900'
                                    : app.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-900'
                                    : app.status === 'rescheduled'
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {app.status === 'confirmed'
                                  ? 'Confirmado'
                                  : app.status === 'completed'
                                  ? 'Concluído'
                                  : app.status === 'denied'
                                  ? 'Recusado'
                                  : app.status === 'cancelled'
                                  ? 'Cancelado'
                                  : app.status === 'rescheduled'
                                  ? 'Reagendado'
                                  : 'Pendente'}
                              </span>
                            </div>

                            <p className="text-xs text-rose-800 mt-1">
                              <span className="font-semibold text-rose-950">{app.serviceTitle}</span>
                              {app.replacement && (
                                <span className="font-bold text-amber-800 ml-1">
                                  [Reposição: {app.replacement}]
                                </span>
                              )}{' '}
                              • R$ {app.price.toFixed(2)}
                            </p>

                            <p className="text-xs text-rose-700 mt-0.5">
                              📅 {formatDateBR(app.date)} das ⏰ {app.time} às {app.endTime} ({app.durationMinutes} min)
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            {app.status === 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => setCalendarModalApp(app)}
                                className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold text-xs flex items-center gap-1 transition-colors"
                                title="Adicionar ao calendário"
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-rose-800" />
                                <span>{addedToCalendarIds.has(app.id) ? 'No calendário' : 'Adicionar ao calendário'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => openClientWhatsapp(app)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value as AppointmentStatus)}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold bg-rose-50 text-rose-900"
                            >
                              <option value="pending">Pendente</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="completed">Concluído</option>
                              <option value="denied">Recusado</option>
                              <option value="cancelled">Cancelado</option>
                              <option value="rescheduled">Reagendado</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => requestDeleteAppointment(app)}
                              title="Excluir agendamento"
                              className="p-1.5 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICES MANAGEMENT */}
              {activeTab === 'services' && (
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-rose-950 text-xl">
                        Catálogo de Serviços
                      </h3>
                      <p className="text-xs text-rose-800">
                        Edite valores, durações em minutos e adicione novos procedimentos.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingService({
                          title: '',
                          category: 'Alongamento em Gel',
                          type: 'application',
                          price: 100,
                          durationMinutes: 120,
                          description: '',
                        });
                        setIsServiceModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-full bg-rose-900 text-white text-xs font-semibold hover:bg-rose-950 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Serviço</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="p-5 rounded-2xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                              {service.category}
                            </span>
                            <span className="text-xs font-bold text-rose-950">
                              R$ {service.price.toFixed(2)}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-rose-950 text-base">
                            {service.title}
                          </h4>
                          <p className="text-xs text-rose-800 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                          <p className="text-xs font-semibold text-rose-900 mt-2">
                            ⏱ Duração: {service.durationMinutes} minutos
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-rose-100 mt-3">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setIsServiceModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => requestDeleteService(service)}
                            title="Excluir serviço"
                            className="p-1.5 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: HOURS & BLOCKS */}
              {activeTab === 'hours' && businessHours && (
                <div className="space-y-6">
                  {/* Business Hours */}
                  <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-rose-950 text-xl">
                          Horários de Funcionamento Semanal
                        </h3>
                        <p className="text-xs text-rose-800">
                          Defina os dias e horários de atendimento do studio.
                        </p>
                      </div>

                      <button
                        onClick={handleSaveHours}
                        className="px-5 py-2.5 rounded-full bg-rose-900 text-white font-semibold text-xs hover:bg-rose-950 shadow-sm"
                      >
                        Salvar Horários
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(
                        (day) => {
                          const dayNames: Record<string, string> = {
                            monday: 'Segunda-feira',
                            tuesday: 'Terça-feira',
                            wednesday: 'Quarta-feira',
                            thursday: 'Quinta-feira',
                            friday: 'Sexta-feira',
                            saturday: 'Sábado',
                            sunday: 'Domingo',
                          };
                          const sched = businessHours[day];

                          return (
                            <div
                              key={day}
                              className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-36">
                                <input
                                  type="checkbox"
                                  checked={sched.isOpen}
                                  onChange={(e) =>
                                    setBusinessHours({
                                      ...businessHours,
                                      [day]: { ...sched, isOpen: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-rose-900 rounded"
                                />
                                <span className="font-bold text-rose-950">{dayNames[day]}</span>
                              </div>

                              {sched.isOpen ? (
                                <div className="flex flex-wrap items-center gap-3">
                                  <span>Abertura:</span>
                                  <input
                                    type="time"
                                    value={sched.openTime}
                                    onChange={(e) =>
                                      setBusinessHours({
                                        ...businessHours,
                                        [day]: { ...sched, openTime: e.target.value },
                                      })
                                    }
                                    className="px-2 py-1 rounded-lg border border-rose-200 bg-white"
                                  />

                                  <span>Fechamento:</span>
                                  <input
                                    type="time"
                                    value={sched.closeTime}
                                    onChange={(e) =>
                                      setBusinessHours({
                                        ...businessHours,
                                        [day]: { ...sched, closeTime: e.target.value },
                                      })
                                    }
                                    className="px-2 py-1 rounded-lg border border-rose-200 bg-white"
                                  />
                                </div>
                              ) : (
                                <span className="text-rose-500 font-semibold italic">Fechado</span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Manual Blocked Slots */}
                  <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-rose-950 text-xl">
                          Bloqueio de Dias e Horários
                        </h3>
                        <p className="text-xs text-rose-800">
                          Bloqueie feriados, dias de folga ou horários específicos.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsBlockModalOpen(true)}
                        className="px-4 py-2.5 rounded-full bg-rose-900 text-white text-xs font-semibold hover:bg-rose-950 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Novo Bloqueio</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {blockedSlots.length === 0 ? (
                        <p className="text-xs text-rose-700 italic py-2">
                          Nenhum bloqueio cadastrado.
                        </p>
                      ) : (
                        blockedSlots.map((block) => (
                          <div
                            key={block.id}
                            className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-rose-950">📅 {formatDateBR(block.date)}</span> —{' '}
                              <span className="font-semibold text-rose-900">
                                {block.fullDay ? 'Dia Inteiro' : `${block.startTime} às ${block.endTime}`}
                              </span>{' '}
                              ({block.reason})
                            </div>

                            <button
                              type="button"
                              onClick={() => requestDeleteBlockedSlot(block)}
                              title="Excluir bloqueio"
                              className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: GALLERY */}
              {activeTab === 'gallery' && (
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rose-100">
                    <div>
                      <h3 className="font-serif font-bold text-rose-950 text-xl">
                        Galeria do Portfólio
                      </h3>
                      <p className="text-xs text-rose-800">
                        Adicione e remova fotos dos seus trabalhos em gel diretamente do celular, iPad ou computador.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedGalleryFile(null);
                        setGalleryFilePreview('');
                        setNewGalleryUrl('');
                        setNewGalleryTitle('');
                        setIsGalleryModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-full bg-rose-900 text-white text-xs font-semibold hover:bg-rose-950 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Foto à Galeria</span>
                    </button>
                  </div>

                  {gallery.length === 0 ? (
                    <div className="text-center py-12 bg-rose-50/50 rounded-3xl border border-dashed border-rose-200 p-6">
                      <ImageIcon className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-rose-950 mb-1">
                        Sua galeria está vazia
                      </p>
                      <p className="text-xs text-rose-700 max-w-sm mx-auto mb-4">
                        Adicione fotos de alongamento e esmaltação em gel para encantar suas clientes no catálogo.
                      </p>
                      <button
                        onClick={() => setIsGalleryModalOpen(true)}
                        className="px-4 py-2 rounded-full bg-rose-900 text-white text-xs font-bold hover:bg-rose-950"
                      >
                        Adicionar Primeira Foto
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {gallery.map((item) => (
                        <div
                          key={item.id}
                          className="group relative bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
                        >
                          <div className="relative aspect-square w-full bg-rose-50 overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                                {item.category || 'Geral'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 flex items-center justify-between gap-2 bg-white">
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-rose-950 text-xs truncate">
                                {item.title || 'Trabalho em Gel'}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={() => requestDeleteGallery(item)}
                              title="Excluir foto da galeria"
                              className="p-1.5 rounded-xl text-rose-500 hover:text-white hover:bg-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* TAB 6: SETTINGS */}
              {activeTab === 'settings' && profile && policies && (
                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-rose-950 text-xl">
                        Informações do Studio & Políticas
                      </h3>
                      <p className="text-xs text-rose-800">
                        Atualize WhatsApp, endereço, chave Pix e textos das políticas.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 rounded-full bg-rose-900 text-white font-semibold text-xs hover:bg-rose-950 shadow-sm"
                    >
                      Salvar Alterações
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-rose-950 mb-1">Nome do Studio</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-rose-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-rose-950 mb-1">WhatsApp (Apenas números)</label>
                      <input
                        type="text"
                        value={profile.whatsapp}
                        onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-rose-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-rose-950 mb-1">Instagram (@usuario)</label>
                      <input
                        type="text"
                        value={profile.instagram}
                        onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-rose-200"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-rose-950 mb-1">Chave Pix para o Sinal (50%)</label>
                      <input
                        type="text"
                        value={profile.pixKey}
                        onChange={(e) => setProfile({ ...profile, pixKey: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-rose-200"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-rose-950 mb-1">Apresentação / Bio do Studio</label>
                      <textarea
                        rows={2}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-rose-200"
                      />
                    </div>

                    {/* Email Notifications Settings Section */}
                    <div className="sm:col-span-2 space-y-2 pt-4 border-t border-rose-100">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-rose-900" />
                        <h4 className="font-serif font-bold text-rose-950 text-sm">
                          Configurações de Notificações por E-mail
                        </h4>
                      </div>
                      <p className="text-xs text-rose-800">
                        Defina o endereço de e-mail do administrador que receberá alertas automáticos sempre que uma cliente realizar um novo agendamento no site.
                      </p>

                      <div>
                        <label className="block font-bold text-rose-950 mb-1">
                          E-mail para receber notificações de novos agendamentos:
                        </label>
                        <input
                          type="email"
                          placeholder="camilalima@studio.com"
                          value={profile.notificationEmail || ''}
                          onChange={(e) => setProfile({ ...profile, notificationEmail: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-rose-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-3 pt-4 border-t border-rose-100">
                      <h4 className="font-serif font-bold text-rose-950 text-sm">
                        Identidade Visual & Logo do Site
                      </h4>
                      <p className="text-xs text-rose-800">
                        Envie a imagem da logo oficial do Studio para exibir no cabeçalho e rodapé do site.
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                        <div className="w-24 h-24 bg-white border border-rose-200 rounded-2xl flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-sm">
                          {profile.logoUrl ? (
                            <img src={profile.logoUrl} alt="Logo Studio Camila Lima" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-[10px] text-rose-400 font-semibold text-center">Sem Logo<br/>(Exibindo Texto)</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <label className="px-4 py-2 bg-rose-900 text-white rounded-xl text-xs font-bold hover:bg-rose-950 transition-colors cursor-pointer text-center">
                            <span>Alterar Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoFileUpload}
                            />
                          </label>

                          {profile.logoUrl && (
                            <button
                              type="button"
                              onClick={requestRemoveLogo}
                              className="px-4 py-2 bg-white border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
                            >
                              Remover Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-3 pt-2 border-t border-rose-100">
                      <h4 className="font-serif font-bold text-rose-950 text-sm">
                        Textos das Políticas do Studio
                      </h4>

                      <div>
                        <label className="block font-semibold text-rose-900 mb-1">Política do Sinal</label>
                        <textarea
                          rows={2}
                          value={policies.depositInfo}
                          onChange={(e) => setPolicies({ ...policies, depositInfo: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-rose-200"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-rose-900 mb-1">Política de Reagendamento e Cancelamento</label>
                        <textarea
                          rows={2}
                          value={policies.cancellationInfo}
                          onChange={(e) => setPolicies({ ...policies, cancellationInfo: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-rose-200"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-rose-900 mb-1">Política de Tolerância a Atrasos</label>
                        <textarea
                          rows={2}
                          value={policies.delayToleranceInfo}
                          onChange={(e) => setPolicies({ ...policies, delayToleranceInfo: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-rose-200"
                        />
                      </div>
                    </div>

                    {/* Email Provider Configuration */}
                    <div className="sm:col-span-2 space-y-3 pt-4 border-t border-rose-100">
                      <h4 className="font-serif font-bold text-rose-950 text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-rose-700" />
                        <span>Configurações de E-mail</span>
                      </h4>
                      <p className="text-xs text-rose-700">
                        Escolha o sistema responsável pelo envio dos e-mails de notificação de novos agendamentos:
                      </p>

                      <div className="space-y-2 bg-rose-50/70 p-4 rounded-2xl border border-rose-100">
                        <label className="block text-xs font-bold text-rose-900 mb-2">Método de envio</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-950 bg-white px-3.5 py-2 rounded-xl border border-rose-200 hover:border-rose-300">
                            <input
                              type="radio"
                              name="emailProvider"
                              value="emailjs"
                              checked={emailProvider === 'emailjs'}
                              onChange={() => setEmailProvider('emailjs')}
                              className="w-4 h-4 text-rose-900 border-rose-300 focus:ring-rose-900 accent-rose-900 cursor-pointer"
                            />
                            <span>( ) EmailJS</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-950 bg-white px-3.5 py-2 rounded-xl border border-rose-200 hover:border-rose-300">
                            <input
                              type="radio"
                              name="emailProvider"
                              value="resend"
                              checked={emailProvider === 'resend'}
                              onChange={() => setEmailProvider('resend')}
                              className="w-4 h-4 text-rose-900 border-rose-300 focus:ring-rose-900 accent-rose-900 cursor-pointer"
                            />
                            <span>( ) Resend</span>
                          </label>
                        </div>
                        <p className="text-[11px] text-rose-600 mt-2 font-medium">
                          Provedor ativo no momento: <strong className="text-rose-950 uppercase">{emailProvider}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EDIT SERVICE MODAL */}
      {isServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100">
            <h4 className="font-serif font-bold text-rose-950 text-lg mb-4">
              {editingService.id ? 'Editar Serviço' : 'Novo Serviço'}
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-rose-950 mb-1">Título do Procedimento</label>
                <input
                  type="text"
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-950 mb-1">Categoria</label>
                <select
                  value={editingService.category || 'Alongamento em Gel'}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-rose-200"
                >
                  <option value="Alongamento em Gel">Alongamento em Gel</option>
                  <option value="Banho em Gel">Banho em Gel</option>
                  <option value="Esmaltação em Gel">Esmaltação em Gel</option>
                  <option value="Outros Serviços">Outros Serviços</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-rose-950 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    value={editingService.price || 0}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-rose-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-rose-950 mb-1">Duração (Minutos)</label>
                  <input
                    type="number"
                    step={15}
                    value={editingService.durationMinutes || 120}
                    onChange={(e) =>
                      setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-rose-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-rose-950 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-rose-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-rose-100">
                <input
                  type="checkbox"
                  id="service-active-toggle"
                  checked={editingService.active !== false}
                  onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                  className="w-4 h-4 text-rose-900 rounded focus:ring-rose-900 border-rose-300 accent-rose-900 cursor-pointer"
                />
                <label htmlFor="service-active-toggle" className="font-bold text-rose-950 text-xs cursor-pointer select-none">
                  Serviço Ativo (visível no catálogo público para agendamentos)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="px-4 py-2 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveService}
                className="px-5 py-2 rounded-full bg-rose-900 text-white text-xs font-semibold"
              >
                Salvar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100">
            <h4 className="font-serif font-bold text-rose-950 text-lg mb-4">
              Adicionar Bloqueio na Agenda
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-rose-950 mb-1">Data</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fullDay"
                  checked={blockFullDay}
                  onChange={(e) => setBlockFullDay(e.target.checked)}
                />
                <label htmlFor="fullDay" className="font-bold text-rose-950">Bloquear o Dia Inteiro</label>
              </div>

              {!blockFullDay && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-rose-950 mb-1">Horário Início</label>
                    <input
                      type="time"
                      value={blockStart}
                      onChange={(e) => setBlockStart(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-rose-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-950 mb-1">Horário Fim</label>
                    <input
                      type="time"
                      value={blockEnd}
                      onChange={(e) => setBlockEnd(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-rose-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-rose-950 mb-1">Motivo do Bloqueio</label>
                <input
                  type="text"
                  placeholder="Ex: Feriado, Consulta médica..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBlock}
                className="px-5 py-2 rounded-full bg-rose-900 text-white text-xs font-semibold"
              >
                Adicionar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h4 className="font-serif font-bold text-rose-950 text-lg">
                Adicionar Foto à Galeria
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedGalleryFile(null);
                  setGalleryFilePreview('');
                  setIsGalleryModalOpen(false);
                }}
                className="p-1 rounded-full text-rose-400 hover:text-rose-900 hover:bg-rose-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Native File Input for Device Upload */}
              <div>
                <label className="block font-bold text-rose-950 mb-1.5">
                  Foto do Dispositivo (Celular, iPad, PC)
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-rose-200 rounded-2xl bg-rose-50/50 hover:bg-rose-100/50 cursor-pointer transition-colors text-center">
                  <Upload className="w-6 h-6 text-rose-700 mb-1" />
                  <span className="font-bold text-rose-950 text-xs">
                    {selectedGalleryFile ? selectedGalleryFile.name : 'Clique para selecionar foto'}
                  </span>
                  <span className="text-[10px] text-rose-600 mt-0.5">
                    Aceita imagens da câmera ou galeria (JPG, PNG, WEBP, HEIC)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryFileSelect}
                  />
                </label>
              </div>

              {/* Preview Thumbnail if selected */}
              {galleryFilePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-rose-200 aspect-video bg-rose-50">
                  <img
                    src={galleryFilePreview}
                    alt="Pré-visualização"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGalleryFile(null);
                      setGalleryFilePreview('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block font-bold text-rose-950 mb-1">Título da Foto</label>
                <input
                  type="text"
                  placeholder="Ex: Alongamento em Gel Nude com Glitter"
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-950 mb-1">Categoria</label>
                <select
                  value={newGalleryCategory}
                  onChange={(e) => setNewGalleryCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <option value="Alongamento em Gel">Alongamento em Gel</option>
                  <option value="Banho em Gel">Banho em Gel</option>
                  <option value="Esmaltação em Gel">Esmaltação em Gel</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              {/* Optional URL input if no file is selected */}
              {!selectedGalleryFile && (
                <div className="pt-2 border-t border-rose-100">
                  <label className="block font-semibold text-rose-800 mb-1 text-[11px]">
                    Ou cole uma URL de Imagem (opcional):
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="w-full p-2 rounded-xl border border-rose-200 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGalleryFile(null);
                  setGalleryFilePreview('');
                  setIsGalleryModalOpen(false);
                }}
                disabled={isUploadingGallery}
                className="px-4 py-2.5 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddGallery}
                disabled={isUploadingGallery || (!selectedGalleryFile && !newGalleryUrl)}
                className="px-5 py-2.5 rounded-full bg-rose-900 text-white text-xs font-semibold hover:bg-rose-950 flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isUploadingGallery ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando Foto...</span>
                  </>
                ) : (
                  <span>Adicionar à Galeria</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* WHATSAPP NOTIFICATION MODAL FOR CANCELLED / DENIED APPOINTMENTS */}
      {notifyModal.isOpen && notifyModal.app && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h4 className="font-serif font-bold text-rose-950 text-base">
                {notifyModal.type === 'cancelled'
                  ? 'Notificar Cancelamento por WhatsApp'
                  : 'Notificar Recusa por WhatsApp'}
              </h4>
              <button
                onClick={() => setNotifyModal({ isOpen: false, type: 'cancelled', app: null })}
                className="p-1 rounded-full text-rose-400 hover:text-rose-900 hover:bg-rose-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-rose-800 leading-relaxed">
              Deseja enviar uma mensagem padrão no WhatsApp da cliente <span className="font-bold">{notifyModal.app.clientName}</span> informando sobre o {notifyModal.type === 'cancelled' ? 'cancelamento' : 'não agendamento'}?
            </p>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs text-rose-900 whitespace-pre-wrap font-sans leading-relaxed">
              {getDeniedWhatsappMessage(notifyModal.app)}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNotifyModal({ isOpen: false, type: 'cancelled', app: null })}
                className="w-full sm:w-1/2 py-2.5 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-50"
              >
                Não Notificar
              </button>
              <button
                type="button"
                onClick={() => {
                  openClientWhatsapp(notifyModal.app!, getDeniedWhatsappMessage(notifyModal.app!));
                  setNotifyModal({ isOpen: false, type: 'cancelled', app: null });
                }}
                className="w-full sm:w-1/2 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold hover:bg-emerald-600 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RE-ENGINEERED DELETE CONFIRMATION MODAL */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-rose-950 text-lg">
                  Confirmar Exclusão
                </h4>
                <p className="text-xs text-rose-600 font-medium">
                  Esta ação atualizará o Firebase imediatamente.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-100 text-xs space-y-1">
              <p className="font-bold text-rose-950 text-sm">
                {deleteModalState.type === 'service' && `Tem certeza que deseja excluir o serviço "${deleteModalState.title}"?`}
                {deleteModalState.type === 'gallery' && `Tem certeza que deseja excluir a foto "${deleteModalState.title}" da galeria?`}
                {deleteModalState.type === 'blockedSlot' && `Tem certeza que deseja excluir este bloqueio de horário?`}
                {deleteModalState.type === 'appointment' && `Tem certeza que deseja excluir este agendamento?`}
                {deleteModalState.type === 'logo' && `Tem certeza que deseja remover a logo do site?`}
              </p>
              {deleteModalState.subtitle && (
                <p className="text-rose-700 font-medium">{deleteModalState.subtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
              <button
                type="button"
                disabled={isExecutingDelete}
                onClick={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-full border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isExecutingDelete}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isExecutingDelete ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR SELECTION MODAL */}
      {calendarModalApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-900 shrink-0">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-rose-950 text-base">
                    Adicionar ao Calendário
                  </h4>
                  <p className="text-[11px] text-rose-700 font-medium">Escolha a plataforma de sua preferência</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalendarModalApp(null)}
                className="p-1.5 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 text-xs space-y-1.5 text-rose-950">
              <p><span className="font-bold">Serviço:</span> {calendarModalApp.serviceTitle}</p>
              <p><span className="font-bold">Cliente:</span> {calendarModalApp.clientName}</p>
              <p><span className="font-bold">Data:</span> {formatDateBR(calendarModalApp.date)}</p>
              <p><span className="font-bold">Horário:</span> {calendarModalApp.time} às {calendarModalApp.endTime} ({calendarModalApp.durationMinutes} min)</p>
              {calendarModalApp.notes && <p><span className="font-bold">Observações:</span> {calendarModalApp.notes}</p>}
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Apple Calendar */}
              <button
                type="button"
                onClick={() => {
                  downloadICSFile(calendarModalApp, profile);
                  setAddedToCalendarIds(prev => new Set(prev).add(calendarModalApp.id));
                  setCalendarModalApp(null);
                }}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50/50 flex items-center justify-between transition-colors shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-rose-950 text-xs block">Apple Calendar</span>
                    <span className="text-[10px] text-rose-600 block">Abrir / importar no aplicativo Calendário da Apple</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 2: Google Calendar */}
              <button
                type="button"
                onClick={() => {
                  const url = getGoogleCalendarUrl(calendarModalApp);
                  window.open(url, '_blank');
                  setAddedToCalendarIds(prev => new Set(prev).add(calendarModalApp.id));
                  setCalendarModalApp(null);
                }}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50/50 flex items-center justify-between transition-colors shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-rose-950 text-xs block">Google Calendar</span>
                    <span className="text-[10px] text-rose-600 block">Criar evento diretamente no Google Agenda Web</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 3: Download .ics File */}
              <button
                type="button"
                onClick={() => {
                  downloadICSFile(calendarModalApp, profile);
                  setAddedToCalendarIds(prev => new Set(prev).add(calendarModalApp.id));
                  setCalendarModalApp(null);
                }}
                className="w-full py-3 px-4 rounded-2xl border border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50/50 flex items-center justify-between transition-colors shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-900 text-white flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-rose-950 text-xs block">Baixar arquivo .ics</span>
                    <span className="text-[10px] text-rose-600 block">Arquivo iCalendar para Outlook e outros calendários</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCalendarModalApp(null)}
                className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
