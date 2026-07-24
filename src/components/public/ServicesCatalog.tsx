import React, { useState } from 'react';
import { Clock, Calendar, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Service } from '../../types';

interface ServicesCatalogProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({ services, onSelectService }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Alongamento em Gel', 'Banho em Gel', 'Esmaltação em Gel', 'Outros Serviços'];

  const filteredServices = services.filter((s) => {
    if (s.active === false) return false;
    if (selectedCategory === 'Todos') return true;
    return s.category === selectedCategory;
  });

  return (
    <section id="servicos" className="py-16 px-6 sm:px-10 bg-[#FDFBF9] border-b border-[#E5E1DA]">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E5E1DA] gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C2A482] font-bold block mb-1">
              Procedimentos
            </span>
            <h2 className="text-2xl sm:text-3xl font-light serif italic text-[#1A1A1A]">
              Catálogo de Serviços
            </h2>
          </div>
          <span className="text-[10px] tracking-widest uppercase opacity-50 text-[#1A1A1A]">
            Selecione uma opção abaixo para agendar
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-[10px] sm:text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#E5E1DA] text-[#1A1A1A] opacity-70 hover:opacity-100 hover:border-[#C2A482]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`group relative bg-white border border-[#E5E1DA] p-6 rounded-sm hover:border-[#C2A482] cursor-pointer transition-all flex flex-col justify-between ${
                service.type === 'maintenance' ? 'border-l-4 border-l-[#C2A482]' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#C2A482] font-bold block mb-0.5">
                      {service.category}
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-[#1A1A1A]">
                      {service.title}
                    </h3>
                  </div>
                  <span className="text-base font-light text-[#C2A482] font-serif">
                    R$ {service.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <p className="text-[11px] opacity-60 leading-relaxed mb-6 line-clamp-2 text-[#1A1A1A]">
                  {service.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-widest opacity-60 pt-4 border-t border-[#E5E1DA]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#C2A482]" />
                      {service.durationMinutes} min
                    </span>
                    <span>•</span>
                    <span>{service.type === 'application' ? 'Aplicação' : service.type === 'maintenance' ? 'Manutenção' : 'Geral'}</span>
                  </div>

                  <span className="text-[#C2A482] font-bold group-hover:translate-x-1 transition-transform">
                    Selecionar →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
