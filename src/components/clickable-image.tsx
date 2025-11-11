"use client";
import { useState } from 'react';
import { ImageModal } from './image-modal';
import { ZoomIn } from 'lucide-react';

interface ClickableImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  children?: React.ReactNode;
}

export function ClickableImage({ 
  src, 
  alt, 
  className = '', 
  containerClassName = '',
  children 
}: ClickableImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!src) {
    return children || null;
  }

  return (
    <>
      <div
        className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] group overflow-hidden ${containerClassName}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }
        }}
        aria-label={`Cliquer pour agrandir l'image: ${alt}`}
      >
        {children || (
          <img
            src={src}
            alt={alt}
            className={`${className} transition-transform duration-300 group-hover:scale-105`}
          />
        )}
        
        {/* Overlay avec icône au survol */}
        <div 
          className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="h-5 w-5 text-gray-800" />
          </div>
        </div>
      </div>
      
      <ImageModal
        src={src}
        alt={alt}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

