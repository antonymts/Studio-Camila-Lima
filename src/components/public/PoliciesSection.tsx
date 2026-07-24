import React from 'react';
import { ShieldCheck, Clock, CalendarX, Info } from 'lucide-react';
import { StudioPolicies } from '../../types';

interface PoliciesSectionProps {
  policies: StudioPolicies;
}

export const PoliciesSection: React.FC<PoliciesSectionProps> = ({ policies }) => {
  return (
    <section className="py-16 px-6 sm:px-10 bg-[#FDFBF9] text-[#1A1A1A] border-b border-[#E5E1DA]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#C2A482] font-bold block mb-1">
            Transparência & Respeito
          </span>
          <h2 className="font-serif italic text-3xl sm:text-4xl font-light text-[#1A1A1A] mt-1">
            Políticas do Studio
          </h2>
          <p className="text-[#1A1A1A]/70 text-xs sm:text-sm max-w-xl mx-auto mt-2 italic">
            Diretrizes de funcionamento para garantir atendimento exclusivo e pontualidade na sua reserva.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Policy 1: Deposit */}
          <div className="bg-white border border-[#E5E1DA] p-6 rounded-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif italic text-lg font-light text-[#1A1A1A] mb-2">
                Política de Sinal (50%)
              </h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed font-light">
                {policies.depositInfo}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E5E1DA] text-[10px] uppercase tracking-widest text-[#C2A482] font-bold">
              * Tratado via WhatsApp
            </div>
          </div>

          {/* Policy 2: Rescheduling */}
          <div className="bg-white border border-[#E5E1DA] p-6 rounded-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center mb-4">
                <CalendarX className="w-5 h-5" />
              </div>
              <h3 className="font-serif italic text-lg font-light text-[#1A1A1A] mb-2">
                Desmarcação e Reagendamento
              </h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed font-light">
                {policies.cancellationInfo}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E5E1DA] text-[10px] uppercase tracking-widest text-[#C2A482] font-bold">
              * Mínimo de 12h de antecedência
            </div>
          </div>

          {/* Policy 3: Delays */}
          <div className="bg-white border border-[#E5E1DA] p-6 rounded-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif italic text-lg font-light text-[#1A1A1A] mb-2">
                Tolerância de Atrasos
              </h3>
              <p className="text-[#1A1A1A]/70 text-xs leading-relaxed font-light">
                {policies.delayToleranceInfo}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#E5E1DA] text-[10px] uppercase tracking-widest text-[#C2A482] font-bold">
              * Máximo: 15 minutos
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
