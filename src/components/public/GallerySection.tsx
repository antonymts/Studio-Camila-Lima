import React, { useState } from 'react';
import { Sparkles, Maximize2, X } from 'lucide-react';
import { GalleryItem } from '../../types';

interface GallerySectionProps {
  gallery: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  if (!gallery || gallery.length === 0) return null;

  return (
    <section className="py-16 px-6 sm:px-10 bg-[#FAF7F2] border-b border-[#E5E1DA]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E5E1DA] gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C2A482] font-bold block mb-1">
              Portfólio Exclusivo
            </span>
            <h2 className="text-2xl sm:text-3xl font-light serif italic text-[#1A1A1A]">
              Galeria de Trabalhos
            </h2>
          </div>
          <p className="text-[11px] opacity-60 max-w-sm italic text-[#1A1A1A]">
            Acabamento natural, curvatura delicada e simetria perfeita em cada procedimento.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gallery.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="relative aspect-square rounded-sm overflow-hidden group cursor-pointer border border-[#E5E1DA] bg-white hover:border-[#C2A482] transition-all"
            >
              <img
                src={item.imageUrl}
                alt={item.title || 'Trabalho Studio Camila Lima'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                <span className="text-[9px] font-bold text-[#C2A482] uppercase tracking-widest">
                  {item.category}
                </span>
                <p className="font-serif italic text-xs leading-tight line-clamp-1">
                  {item.title}
                </p>
                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-[#1A1A1A]/60 backdrop-blur-sm text-white">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-xl w-full bg-[#FAF7F2] rounded-sm overflow-hidden shadow-2xl border border-[#E5E1DA]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-[#1A1A1A] text-white hover:bg-[#C2A482] transition-colors cursor-pointer rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="aspect-square sm:aspect-4/3 w-full overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-5 text-[#1A1A1A] bg-white border-t border-[#E5E1DA]">
              <span className="text-[10px] font-bold text-[#C2A482] uppercase tracking-widest block mb-1">
                {selectedImage.category}
              </span>
              <h3 className="font-serif italic text-lg font-light">{selectedImage.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
