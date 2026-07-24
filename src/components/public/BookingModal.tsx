import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Service, BusinessHours, BlockedSlot, Appointment, StudioProfile } from '../../types';
import { getAvailableSlots, formatDateBR, formatTimeInterval, TimeSlot } from '../../utils/timeSlots';
import {
  createAppointmentTransaction,
  getAppointmentsByDate,
  getAppointmentsByClientPhone,
  updateAppointmentStatus,
  normalizePhone,
} from '../../services/db';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService: Service | null;
  services: Service[];
  businessHours: BusinessHours;
  blockedSlots: BlockedSlot[];
  profile: StudioProfile;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialService,
  services,
  businessHours,
  blockedSlots,
  profile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientWhatsapp, setClientWhatsapp] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Re-scheduling & Existing Appointment State
  const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);
  const [showExistingAlert, setShowExistingAlert] = useState<boolean>(false);
  const [blocked12Hours, setBlocked12Hours] = useState<boolean>(false);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false);

  // Replacement option for "Alongamento em Gel - Manutenção"
  const [replacementOption, setReplacementOption] = useState<'Nenhuma' | '1 unha' | '2 unhas ou mais'>('Nenhuma');

  // Check if current service is "Alongamento em Gel - Manutenção"
  const isMaintenanceService = selectedService?.title?.trim().toLowerCase() === 'alongamento em gel - manutenção';

  // Calculate prices
  const basePrice = selectedService?.price || 0;
  const replacementPrice = isMaintenanceService
    ? replacementOption === '1 unha'
      ? 10
      : replacementOption === '2 unhas ou mais'
      ? 20
      : 0
    : 0;
  const totalPrice = basePrice + replacementPrice;
  const depositHalf = totalPrice / 2;

  // Initialize selected service
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      setStep(2); // Jump to date selection if service selected
    } else if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [initialService, services]);

  // Generate tomorrow or earliest date as default date
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const da = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${yr}-${mo}-${da}`);
    }
  }, []);

  // Fetch appointments for selected date & recalculate time slots
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlotsForDate(selectedDate, selectedService);
    }
  }, [selectedDate, selectedService, businessHours, blockedSlots]);

  const fetchSlotsForDate = async (dateStr: string, service: Service) => {
    setLoadingSlots(true);
    setErrorMessage('');
    setSelectedSlot(null);
    try {
      const apps = await getAppointmentsByDate(dateStr);
      const slots = getAvailableSlots(
        dateStr,
        service.durationMinutes,
        businessHours,
        apps,
        blockedSlots
      );
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const handleWhatsappChange = (value: string) => {
    // Basic phone formatting
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length <= 11) {
      setClientWhatsapp(numbersOnly);
    }
  };

  const formattedWhatsapp = clientWhatsapp
    ? clientWhatsapp.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    : '';

  const handleCheckAndProceedToStep4 = async () => {
    if (!clientName.trim() || clientWhatsapp.length < 10) {
      setErrorMessage('Por favor, preencha seu nome e um número de WhatsApp válido.');
      return;
    }

    setCheckingExisting(true);
    setErrorMessage('');
    setShowExistingAlert(false);
    setBlocked12Hours(false);

    try {
      const clientApps = await getAppointmentsByClientPhone(clientWhatsapp);
      const inputNormPhone = normalizePhone(clientWhatsapp);

      const activeMatch = clientApps.find((a) => {
        if (a.status === 'cancelled' || a.status === 'denied' || a.status === 'rescheduled') {
          return false;
        }
        const aPhoneNorm = normalizePhone(a.clientWhatsapp);
        return aPhoneNorm === inputNormPhone;
      });

      if (activeMatch) {
        setExistingAppointment(activeMatch);
        setShowExistingAlert(true);
      } else {
        setExistingAppointment(null);
        setStep(4);
      }
    } catch (err) {
      console.error('Error checking existing appointment:', err);
      setStep(4);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleProceedWithReschedule = () => {
    if (!existingAppointment) return;

    // Calculate 12-hour difference from original appointment time
    const appDateTime = new Date(`${existingAppointment.date}T${existingAppointment.time}:00`);
    const diffMs = appDateTime.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 12) {
      setBlocked12Hours(true);
    } else {
      setShowExistingAlert(false);
      setStep(4);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot || !clientName || clientWhatsapp.length < 10) {
      setErrorMessage('Por favor, preencha seu nome e um número de WhatsApp válido.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await createAppointmentTransaction({
      clientName,
      clientWhatsapp: `55${clientWhatsapp}`,
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      price: totalPrice,
      basePrice: basePrice,
      replacement: isMaintenanceService ? replacementOption : undefined,
      replacementPrice: isMaintenanceService ? replacementPrice : undefined,
      totalPrice: totalPrice,
      date: selectedDate,
      time: selectedSlot.time,
      endTime: selectedSlot.endTime,
      durationMinutes: selectedService.durationMinutes,
      notes,
    });

    setSubmitting(false);

    if (res.success) {
      // If this was a rescheduling of an existing appointment, mark old as 'rescheduled'
      if (existingAppointment) {
        try {
          await updateAppointmentStatus(existingAppointment.id, 'rescheduled');
        } catch (err) {
          console.error('Error updating status of old appointment:', err);
        }
      }

      setBookingSuccess(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      setErrorMessage(res.error || 'Não foi possível confirmar o agendamento.');
    }
  };

  const buildWhatsappMessage = () => {
    if (!selectedService || !selectedSlot) return '';
    const dateFormatted = formatDateBR(selectedDate);

    if (isMaintenanceService) {
      const baseFormatted = basePrice.toFixed(2).replace('.', ',');
      const repFormatted = replacementPrice.toFixed(2).replace('.', ',');
      const totalFormatted = totalPrice.toFixed(2).replace('.', ',');

      return (
        `Olá, Camila! Gostaria de agendar um horário.\n\n` +
        `*Nome:* ${clientName}\n` +
        `*Procedimento:* ${selectedService.title}\n` +
        `*Data:* ${dateFormatted}\n` +
        `*Horário:* ${selectedSlot.time} às ${selectedSlot.endTime}\n` +
        `*Reposição de unha:* ${replacementOption}\n` +
        `*Valor do serviço:* R$ ${baseFormatted}\n` +
        `*Valor da reposição:* R$ ${repFormatted}\n` +
        `*Valor total:* R$ ${totalFormatted}\n` +
        (notes ? `*Observações:* ${notes}\n\n` : `\n`) +
        `Aguardo a confirmação do agendamento. 💅`
      );
    }

    const depositHalfFormatted = (selectedService.price / 2).toFixed(2).replace('.', ',');

    return (
      `Olá, Camila! Gostaria de agendar um horário.\n\n` +
      `*Nome:* ${clientName}\n` +
      `*Procedimento:* ${selectedService.title}\n` +
      `*Data:* ${dateFormatted}\n` +
      `*Horário:* ${selectedSlot.time} às ${selectedSlot.endTime}\n` +
      `*Valor:* R$ ${selectedService.price.toFixed(2).replace('.', ',')} (Sinal 50%: R$ ${depositHalfFormatted})\n` +
      (notes ? `*Observações:* ${notes}\n\n` : `\n`) +
      `Aguardo a confirmação do agendamento. 💅`
    );
  };

  const handleRedirectWhatsapp = () => {
    const text = encodeURIComponent(buildWhatsappMessage());
    const url = `https://wa.me/${profile.whatsapp}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleResetModal = () => {
    setBookingSuccess(false);
    setStep(1);
    setSelectedSlot(null);
    setClientName('');
    setClientWhatsapp('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF9] rounded-sm w-full max-w-xl shadow-2xl border border-[#E5E1DA] overflow-hidden my-auto flex flex-col max-h-[90vh] text-[#1A1A1A]">
        {/* Modal Header */}
        <div className="bg-[#1A1A1A] text-white px-6 py-4 flex items-center justify-between border-b border-[#E5E1DA] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2A482]" />
            <h3 className="font-serif italic font-light text-lg tracking-wider uppercase">
              {bookingSuccess ? 'Solicitação Enviada' : 'Agendar Horário'}
            </h3>
          </div>
          <button
            onClick={handleResetModal}
            className="p-1.5 hover:text-[#C2A482] text-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Bar */}
        {!bookingSuccess && (
          <div className="bg-[#FAF7F2] px-6 py-2.5 border-b border-[#E5E1DA] flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/60 shrink-0">
            <span className={step >= 1 ? 'text-[#C2A482] font-bold' : ''}>1. Serviço</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className={step >= 2 ? 'text-[#C2A482] font-bold' : ''}>2. Data & Hora</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className={step >= 3 ? 'text-[#C2A482] font-bold' : ''}>3. Seus Dados</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className={step >= 4 ? 'text-[#C2A482] font-bold' : ''}>4. Confirmação</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto grow">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Atenção</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {bookingSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-[#FAF7F2] border border-[#C2A482] text-[#C2A482] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif italic text-2xl font-light text-[#1A1A1A] mb-2">
                Solicitação Registrada com Sucesso
              </h4>
              <p className="text-[#1A1A1A]/80 text-xs max-w-md mx-auto mb-6 leading-relaxed font-light">
                Seu horário para <span className="font-bold">{selectedService?.title}</span> no dia{' '}
                <span className="font-bold">{formatDateBR(selectedDate)}</span> às{' '}
                <span className="font-bold">{selectedSlot?.time}</span> foi reservado temporariamente no sistema.
              </p>

              {/* Deposit Warning Alert */}
              <div className="bg-[#FAF7F2] border border-[#E5E1DA] p-4 text-left text-xs mb-6 rounded-sm">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] text-[#C2A482] mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Confirmação Mediante 50% de Sinal</span>
                </div>
                <p className="text-[#1A1A1A]/80 leading-relaxed font-light">
                  Para confirmar definitivamente seu atendimento, envie a mensagem pré-preenchida no WhatsApp e realize a transferência do sinal de 50%.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRedirectWhatsapp}
                  className="w-full py-3.5 bg-[#25D366] text-white text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir WhatsApp para Confirmar</span>
                </button>

                <button
                  onClick={handleResetModal}
                  className="w-full py-3 border border-[#E5E1DA] bg-white text-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-medium hover:border-[#C2A482] transition-colors"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: SELECT SERVICE */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="font-serif italic text-[#1A1A1A] text-base font-light">
                    Escolha o procedimento desejado:
                  </h4>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                          selectedService?.id === service.id
                            ? 'bg-white border-[#C2A482] border-l-4'
                            : 'bg-white border-[#E5E1DA] hover:border-[#C2A482]'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-[#1A1A1A] text-xs sm:text-sm uppercase tracking-tight">
                            {service.title}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#1A1A1A]/70 mt-1">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-[#C2A482]" />
                              {service.durationMinutes} min
                            </span>
                            <span>•</span>
                            <span className="font-serif text-[#C2A482] font-bold">
                              R$ {service.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selectedService?.id === service.id
                              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                              : 'border-[#E5E1DA]'
                          }`}
                        >
                          {selectedService?.id === service.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reposição de Unha Section (Shown ONLY when "Alongamento em Gel - Manutenção" is selected) */}
                  {isMaintenanceService && (
                    <div className="bg-[#FAF7F2] border border-[#E5E1DA] p-4 rounded-sm space-y-3">
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#C2A482]">
                          Reposição de unha
                        </h5>
                        <p className="text-[11px] opacity-70 mt-0.5">
                          Informe se será necessária alguma reposição para esta manutenção:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(['Nenhuma', '1 unha', '2 unhas ou mais'] as const).map((opt) => {
                          const isSelected = replacementOption === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setReplacementOption(opt)}
                              className={`px-3 py-2.5 rounded-sm border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                  : 'bg-white border-[#E5E1DA] text-[#1A1A1A] hover:border-[#C2A482]'
                              }`}
                            >
                              <span>{opt}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-[#C2A482]' : 'opacity-60'}`}>
                                {opt === '1 unha' ? '+ R$ 10' : opt === '2 unhas ou mais' ? '+ R$ 20' : 'R$ 0'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[11px] font-semibold text-[#1A1A1A] flex justify-between pt-1 border-t border-[#E5E1DA]">
                        <span>Valor Total Estimado:</span>
                        <span className="font-serif text-[#C2A482] font-bold">
                          R$ {totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={!selectedService}
                    onClick={() => setStep(2)}
                    className="w-full mt-4 py-3.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C2A482] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Avançar para Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: SELECT DATE AND TIME SLOT */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Reposição de Unha Selector in Step 2 */}
                  {isMaintenanceService && (
                    <div className="bg-[#FAF7F2] border border-[#E5E1DA] p-4 rounded-sm space-y-3">
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#C2A482]">
                          Reposição de unha
                        </h5>
                        <p className="text-[11px] opacity-70 mt-0.5">
                          Informe se será necessária reposição de unha para esta manutenção:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(['Nenhuma', '1 unha', '2 unhas ou mais'] as const).map((opt) => {
                          const isSelected = replacementOption === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setReplacementOption(opt)}
                              className={`px-3 py-2.5 rounded-sm border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                  : 'bg-white border-[#E5E1DA] text-[#1A1A1A] hover:border-[#C2A482]'
                              }`}
                            >
                              <span>{opt}</span>
                              <span className={`text-[10px] ${isSelected ? 'text-[#C2A482]' : 'opacity-60'}`}>
                                {opt === '1 unha' ? '+ R$ 10' : opt === '2 unhas ou mais' ? '+ R$ 20' : 'R$ 0'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C2A482] mb-1">
                      1. Selecione a Data
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-sm border border-[#E5E1DA] text-[#1A1A1A] text-xs font-medium focus:border-[#C2A482] focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#C2A482] mb-2">
                      2. Escolha o Horário ({selectedService?.durationMinutes} min)
                    </label>

                    {loadingSlots ? (
                      <div className="text-center py-8 text-[#1A1A1A]/60 text-xs">
                        <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Verificando disponibilidade da agenda...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="bg-white border border-[#E5E1DA] rounded-sm p-6 text-center text-[#1A1A1A]/80 text-xs">
                        <AlertCircle className="w-5 h-5 text-[#C2A482] mx-auto mb-2" />
                        <p className="font-bold">Nenhum horário livre nesta data.</p>
                        <p className="mt-1 opacity-70">
                          Escolha outra data ou entre em contato pelo WhatsApp.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-sm border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center ${
                              selectedSlot?.time === slot.time
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-white border-[#E5E1DA] text-[#1A1A1A] hover:border-[#C2A482]'
                            }`}
                          >
                            <span>{slot.time}</span>
                            <span className="text-[10px] opacity-60 font-normal">
                              até {slot.endTime}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-3 border border-[#E5E1DA] text-[#1A1A1A] text-xs uppercase tracking-wider font-semibold hover:border-[#C2A482]"
                    >
                      Voltar
                    </button>
                    <button
                      disabled={!selectedSlot}
                      onClick={() => setStep(3)}
                      className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C2A482] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Avançar para Seus Dados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CLIENT IDENTIFICATION */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Alert if client has a recent active appointment */}
                  {showExistingAlert && existingAppointment && (
                    <div className="bg-[#FAF7F2] border border-[#C2A482] p-4 rounded-sm space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-[#C2A482] shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-serif italic font-bold text-sm text-[#1A1A1A]">
                            Você já possui um agendamento recente!
                          </h5>
                          <p className="text-xs opacity-80 mt-1">
                            Encontramos um agendamento em andamento para este WhatsApp:
                          </p>
                          <div className="bg-white p-3 rounded border border-[#E5E1DA] my-2 text-xs space-y-1 font-medium">
                            <p>💅 <span className="font-bold">{existingAppointment.serviceTitle}</span></p>
                            <p>📅 Data: <span className="font-bold">{formatDateBR(existingAppointment.date)}</span> às <span className="font-bold">{existingAppointment.time}</span></p>
                            <p>Status: <span className="uppercase text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">{existingAppointment.status}</span></p>
                          </div>
                          <p className="text-xs font-semibold text-[#1A1A1A] mt-2">
                            Deseja cancelar esta operação ou continuar com o reagendamento para uma nova data?
                          </p>
                        </div>
                      </div>

                      {blocked12Hours ? (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-sm text-xs text-rose-900 space-y-2 mt-2">
                          <p className="font-bold">⚠️ Reagendamento não permitido pelo sistema:</p>
                          <p className="leading-relaxed">
                            Seu agendamento está dentro do período de 12 horas. Por isso, não é possível realizar o reagendamento pelo sistema. Entre em contato com o Studio Camila Lima pelo WhatsApp.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `Olá, Camila! Preciso falar sobre meu agendamento de ${existingAppointment.serviceTitle} do dia ${formatDateBR(existingAppointment.date)} às ${existingAppointment.time}.`
                              );
                              window.open(`https://wa.me/${profile.whatsapp}?text=${text}`, '_blank');
                            }}
                            className="w-full py-2.5 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 cursor-pointer mt-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Falar com o Studio pelo WhatsApp</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#E5E1DA]">
                          <button
                            type="button"
                            onClick={handleResetModal}
                            className="w-full sm:w-1/2 py-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] text-xs uppercase tracking-wider font-semibold hover:border-rose-300 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleProceedWithReschedule}
                            className="w-full sm:w-1/2 py-2.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-wider font-bold hover:bg-[#C2A482] transition-colors"
                          >
                            Continuar Reagendamento
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!showExistingAlert && (
                    <>
                      <h4 className="font-serif italic text-[#1A1A1A] text-base font-light">
                        Informe seus dados de contato:
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                          Seu Nome Completo *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#C2A482] absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            placeholder="Ex: Maria Silva"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-[#E5E1DA] text-[#1A1A1A] text-xs focus:border-[#C2A482] focus:outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                          Seu WhatsApp com DDD *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#C2A482] absolute left-3.5 top-3.5" />
                          <input
                            type="tel"
                            placeholder="(82) 99999-9999"
                            value={formattedWhatsapp || clientWhatsapp}
                            onChange={(e) => handleWhatsappChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-[#E5E1DA] text-[#1A1A1A] text-xs focus:border-[#C2A482] focus:outline-none bg-white"
                          />
                        </div>
                        <p className="text-[10px] text-[#1A1A1A]/60 mt-1">
                          Usaremos este número para contato via WhatsApp e confirmação do sinal.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] mb-1">
                          Observações (Opcional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Unhas curtas, preferência por tom nude..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-2 rounded-sm border border-[#E5E1DA] text-[#1A1A1A] text-xs focus:border-[#C2A482] focus:outline-none bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setStep(2)}
                          className="px-4 py-3 border border-[#E5E1DA] text-[#1A1A1A] text-xs uppercase tracking-wider font-semibold hover:border-[#C2A482]"
                        >
                          Voltar
                        </button>
                        <button
                          disabled={!clientName.trim() || clientWhatsapp.length < 10 || checkingExisting}
                          onClick={handleCheckAndProceedToStep4}
                          className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C2A482] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {checkingExisting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Verificando...</span>
                            </>
                          ) : (
                            <>
                              <span>Revisar e Agendar</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: REVISION & CONFIRMATION */}
              {step === 4 && (
                <div className="space-y-5">
                  <h4 className="font-serif italic text-[#1A1A1A] text-base font-light">
                    Revise as informações da sua solicitação:
                  </h4>

                  <div className="bg-[#FAF7F2] border border-[#E5E1DA] rounded-sm p-4 space-y-2.5 text-xs text-[#1A1A1A]">
                    <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                      <span className="opacity-70">Procedimento:</span>
                      <span className="font-bold">{selectedService?.title}</span>
                    </div>

                    <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                      <span className="opacity-70">Data e Horário:</span>
                      <span className="font-bold">
                        {formatDateBR(selectedDate)} às {selectedSlot?.time}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                      <span className="opacity-70">Identificação:</span>
                      <span className="font-bold">{clientName}</span>
                    </div>

                    {isMaintenanceService ? (
                      <>
                        <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                          <span className="opacity-70">Reposição de Unha:</span>
                          <span className="font-bold">{replacementOption}</span>
                        </div>

                        <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                          <span className="opacity-70">Valor do Serviço:</span>
                          <span className="font-bold font-serif">
                            R$ {basePrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                          <span className="opacity-70">Valor da Reposição:</span>
                          <span className="font-bold font-serif">
                            R$ {replacementPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                          <span className="opacity-70 font-semibold">Valor Total:</span>
                          <span className="font-bold font-serif text-[#1A1A1A]">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between border-b border-[#E5E1DA] pb-2">
                        <span className="opacity-70">Valor do Serviço:</span>
                        <span className="font-bold font-serif">
                          R$ {basePrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1 font-semibold">
                      <span className="text-[#C2A482] font-bold uppercase tracking-wider text-[10px]">
                        Sinal de Reserva (50%):
                      </span>
                      <span className="text-[#C2A482] font-bold font-serif">
                        R$ {depositHalf.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Policy reminder box */}
                  <div className="p-3.5 rounded-sm bg-white border border-[#E5E1DA] text-xs">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-[#C2A482] flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      Confirmação Obrigatória do Sinal
                    </p>
                    <p className="leading-relaxed opacity-80 font-light">
                      Ao clicar em solicitar, o horário ficará pré-reservado no sistema e você será direcionada para o WhatsApp para envio do comprovante.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-3 border border-[#E5E1DA] text-[#1A1A1A] text-xs uppercase tracking-wider font-semibold hover:border-[#C2A482]"
                    >
                      Voltar
                    </button>
                    <button
                      disabled={submitting}
                      onClick={handleConfirmBooking}
                      className="flex-1 py-3.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C2A482] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Registrando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Solicitação</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
