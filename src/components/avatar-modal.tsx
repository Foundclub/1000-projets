"use client";
import { useState, useEffect } from 'react';

interface AvatarModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function AvatarModal({ src, alt, children }: AvatarModalProps) {
  const [open, setOpen] = useState(false);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (open) {
      // Pour iOS, on doit aussi fixer la position
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open) {
    return (
      <div 
        onClick={() => setOpen(true)}
        className="cursor-pointer transition-transform hover:scale-105"
      >
        {children}
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="cursor-pointer transition-transform hover:scale-105"
      >
        {children}
      </div>
      {/* Overlay avec animation fade-in */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300"
        onClick={() => setOpen(false)}
        style={{ touchAction: 'none' }}
      >
        {/* Bouton fermer - en dehors du conteneur d'image pour éviter les problèmes de propagation */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[10000] bg-black/70 hover:bg-black/90 active:bg-black text-white rounded-full transition-all hover:scale-110 active:scale-95 p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Fermer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 sm:h-5 sm:w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image avec animation zoom-in */}
        <div 
          className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center p-4 animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'pan-zoom' }}
        >
          <img 
            src={src} 
            alt={alt}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            style={{ touchAction: 'none' }}
          />
        </div>
      </div>
    </>
  );
}

