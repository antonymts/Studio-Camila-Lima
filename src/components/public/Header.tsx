import React from 'react';
import { Sparkles, Instagram, MessageCircle, Calendar, ShieldCheck, User } from 'lucide-react';
import { StudioProfile } from '../../types';

interface HeaderProps {
  profile: StudioProfile;
  onOpenBooking: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onOpenBooking, onOpenAdmin }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E1DA] px-6 sm:px-10 h-20 flex items-center justify-between">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.name}
              className="h-12 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl font-light tracking-[0.18em] uppercase italic font-serif text-[#1A1A1A]">
                {profile.name}
              </h1>
              <span className="h-1.5 w-1.5 bg-[#C2A482] rounded-full hidden sm:inline-block"></span>
              <p className="text-[10px] tracking-widest uppercase opacity-60 font-semibold hidden md:block text-[#1A1A1A]">
                {profile.profession} Specialist
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase hover:text-[#C2A482] transition-colors hidden sm:inline-block font-medium"
          >
            Instagram
          </a>

          <a
            href={profile.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase hover:text-[#C2A482] transition-colors hidden md:inline-block font-medium"
          >
            Localização
          </a>

          <a
            href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent('Olá, Camila! Gostaria de tirar uma dúvida sobre os serviços de unhas em gel.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white px-4 sm:px-5 py-2 text-[10px] sm:text-xs tracking-widest uppercase font-bold rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={onOpenBooking}
            className="bg-[#1A1A1A] text-white px-5 py-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#C2A482] transition-colors cursor-pointer"
          >
            Agendar
          </button>

          <button
            onClick={onOpenAdmin}
            className="p-2 text-[#1A1A1A] hover:text-[#C2A482] transition-colors"
            title="Área Administrativa"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
