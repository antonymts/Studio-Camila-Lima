import React from 'react';
import { MapPin, MessageCircle, Instagram, ExternalLink, Navigation } from 'lucide-react';
import { StudioProfile } from '../../types';

interface LocationContactProps {
  profile: StudioProfile;
}

export const LocationContact: React.FC<LocationContactProps> = ({ profile }) => {
  return (
    <section className="py-16 px-6 sm:px-10 bg-[#FAF7F2] border-b border-[#E5E1DA]">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-sm p-6 sm:p-10 border border-[#E5E1DA] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Location Info */}
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C2A482] font-bold block mb-1">
              Atendimento Presencial
            </span>
            <h2 className="font-serif italic text-2xl sm:text-3xl font-light text-[#1A1A1A] mb-3">
              Localização do Studio
            </h2>
            <p className="text-[#1A1A1A]/70 text-xs sm:text-sm leading-relaxed mb-6 font-light">
              Localizado no coração da Ponta da Terra em Maceió, em um ambiente aconchegante, privativo e climatizado, preparado exclusivamente para o seu cuidado e bem-estar.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider">Endereço Completo</h4>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                    {profile.address} - {profile.neighborhood}
                  </p>
                  <p className="text-xs text-[#1A1A1A]/70">{profile.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider">Instagram Profissional</h4>
                  <a
                    href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#C2A482] font-semibold hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>@{profile.instagram.replace('@', '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={profile.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-5 py-3 bg-[#1A1A1A] hover:bg-[#C2A482] text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5 text-[#C2A482]" />
                <span>Google Maps</span>
              </a>

              <a
                href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent('Olá, Camila! Vi a localização no site e gostaria de falar com você.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-[#25D366] text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-full"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Interactive Map Visual Frame */}
          <div className="rounded-sm overflow-hidden border border-[#E5E1DA] bg-[#FAF7F2] h-64 sm:h-80 relative group">
            <iframe
              title="Studio Camila Lima Map"
              src="https://maps.google.com/maps?q=Rua+Regente+Feij%C3%B3+81+Ponta+da+Terra+Maceio&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-sm border border-[#E5E1DA] text-[11px] font-medium text-[#1A1A1A] flex items-center justify-between">
              <span>Studio Camila Lima • Ponta da Terra</span>
              <a
                href={profile.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C2A482] hover:underline text-[10px] uppercase font-bold tracking-widest"
              >
                Expandir
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
