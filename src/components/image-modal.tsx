"use client";
import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageModalProps {
  src: string | null | undefined;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Empêcher le scroll du body quand le modal est ouvert
      const originalOverflow = document.body.style.overflow;
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        window.scrollTo(0, scrollY);
        setIsLoaded(false);
        setIsZoomed(false);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto overflow-x-hidden"
      onClick={onClose}
    >
      {/* Overlay avec animation fade */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-black/90 via-black/95 to-black/90 transition-opacity duration-300 pointer-events-none"
      />
      
      {/* Bouton fermer - amélioré */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[10000] bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 p-2.5 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation shadow-lg border border-white/20"
        aria-label="Fermer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Boutons d'action */}
      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-full p-1.5 sm:p-2 border border-white/20 shadow-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
          aria-label={isZoomed ? "Réduire" : "Agrandir"}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isZoomed ? (
            <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 p-2 sm:p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
          aria-label="Télécharger"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
      
      {/* Conteneur d'image - centré et scrollable */}
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 py-20 sm:py-24"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative flex items-center justify-center transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={src}
            alt={alt}
            className={`object-contain rounded-lg shadow-2xl transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom();
            }}
            onLoad={() => setIsLoaded(true)}
            loading="eager"
            draggable={false}
            style={{ 
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 120px)',
              width: 'auto',
              height: 'auto',
              display: 'block'
            }}
          />
          
          {/* Indicateur de chargement */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

