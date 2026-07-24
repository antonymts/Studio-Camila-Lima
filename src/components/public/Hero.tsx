import React from 'react';
import { Calendar, Sparkles, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';
import { StudioProfile } from '../../types';

interface HeroProps {
  profile: StudioProfile;
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ profile, onOpenBooking }) => {
  return (
    <section className="relative bg-[#FDFBF9] text-[#1A1A1A] py-16 sm:py-20 px-6 sm:px-10 border-b border-[#E5E1DA]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left / Main Editorial Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C2A482] font-bold">
                Bem-vinda • {profile.profession}
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-light leading-tight font-serif italic text-[#1A1A1A]">
                Sua beleza em cada detalhe.
              </h2>
            </div>

            <p className="text-sm sm:text-base leading-relaxed opacity-75 italic text-[#1A1A1A] max-w-xl">
              {profile.bio} Especializada em unhas em gel com acabamento natural, alta durabilidade e sofisticação no coração de {profile.neighborhood}.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="px-8 py-4 bg-[#1A1A1A] text-white text-xs uppercase tracking-[0.25em] font-bold hover:bg-[#C2A482] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#C2A482]" />
                <span>Agendar Horário</span>
              </button>

              <a
                href="#servicos"
                className="px-6 py-4 bg-white border border-[#E5E1DA] text-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-medium hover:border-[#C2A482] transition-colors text-center"
              >
                Ver Catálogo de Serviços
              </a>
            </div>
          </div>

          {/* Right / Editorial Highlights Box */}
          <div className="lg:col-span-5 bg-[#FAF7F2] border border-[#E5E1DA] p-6 sm:p-8 rounded-sm space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#C2A482] font-bold">
                Como Funciona
              </span>
              <h3 className="font-serif italic text-xl text-[#1A1A1A]">Passos do Agendamento</h3>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full border border-[#E5E1DA] bg-white flex items-center justify-center text-xs font-serif italic text-[#C2A482] shrink-0">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Escolha o Serviço
                  </p>
                  <p className="text-[11px] opacity-60">Aplicação, Manutenção ou Banho em Gel</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full border border-[#E5E1DA] bg-white flex items-center justify-center text-xs font-serif italic text-[#C2A482] shrink-0">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Data e Horário
                  </p>
                  <p className="text-[11px] opacity-60">Escolha a melhor opção na agenda em tempo real</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full border border-[#E5E1DA] bg-white flex items-center justify-center text-xs font-serif italic text-[#C2A482] shrink-0">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Confirmação do Sinal
                  </p>
                  <p className="text-[11px] opacity-60">Reserva confirmada mediante 50% via WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#E5E1DA] rounded-sm text-left">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#C2A482]" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]">
                  Localização Privativa
                </p>
              </div>
              <p className="text-[11px] leading-relaxed opacity-75">
                {profile.address} • {profile.neighborhood}, {profile.city}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
