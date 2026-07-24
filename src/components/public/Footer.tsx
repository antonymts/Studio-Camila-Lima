import React from 'react';
import { Sparkles, Heart, Instagram, UserCheck } from 'lucide-react';
import { StudioProfile } from '../../types';

interface FooterProps {
  profile: StudioProfile;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ profile, onOpenAdmin }) => {
  return (
    <footer className="bg-white border-t border-[#E5E1DA] py-8 px-6 sm:px-10 text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-center md:text-left">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={profile.name}
              className="h-10 w-auto max-w-[140px] object-contain shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-[#E5E1DA] text-[#C2A482] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className="font-serif italic text-base uppercase font-light tracking-wider text-[#1A1A1A]">
              {profile.name}
            </h3>
            <p className="text-[10px] tracking-widest uppercase opacity-60">
              {profile.address} • {profile.neighborhood}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] tracking-widest uppercase">
          <a
            href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#C2A482] transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E1DA] hover:border-[#C2A482] hover:text-[#C2A482] transition-all cursor-pointer font-bold"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Área Profissional</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-[#E5E1DA] text-center text-[10px] tracking-widest uppercase opacity-50 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Studio Camila Lima • Todos os direitos reservados</p>
        <p>Atendimento Exclusivo com Hora Marcada</p>
      </div>
    </footer>
  );
};
