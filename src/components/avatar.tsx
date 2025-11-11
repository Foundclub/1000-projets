"use client";
import { AvatarModal } from './avatar-modal';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
  showModal?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ 
  src, 
  alt, 
  name, 
  email, 
  size = 'md', 
  className,
  clickable = true,
  showModal = true,
}: AvatarProps) {
  const displayName = name || email || 'User';
  const initials = getInitials(displayName);
  const hasImage = src && src.trim().length > 0;
  
  const avatarContent = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white overflow-hidden',
        'bg-gradient-to-br from-blue-500 to-purple-600',
        'border-2 border-background shadow-sm',
        sizeClasses[size],
        !hasImage && 'ring-2 ring-offset-2 ring-offset-background ring-primary/20',
        clickable && 'cursor-pointer transition-transform hover:scale-105',
        className
      )}
    >
      {hasImage ? (
        <img 
          src={src} 
          alt={alt || displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Si l'image ne charge pas, afficher les initiales
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span>${initials}</span>`;
            }
          }}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );

  if (hasImage && showModal && clickable) {
    return (
      <AvatarModal src={src!} alt={alt || displayName}>
        {avatarContent}
      </AvatarModal>
    );
  }

  return avatarContent;
}

function getInitials(name: string): string {
  if (!name) return '?';
  
  // Extraire les initiales du nom
  const parts = name.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    // Prénom + Nom : prendre la première lettre de chaque
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1) {
    // Un seul mot : prendre les 2 premières lettres
    const word = parts[0];
    if (word.length >= 2) {
      return word.substring(0, 2).toUpperCase();
    }
    return word[0].toUpperCase();
  }
  
  // Si c'est un email, prendre les 2 premières lettres
  if (name.includes('@')) {
    const localPart = name.split('@')[0];
    if (localPart.length >= 2) {
      return localPart.substring(0, 2).toUpperCase();
    }
    return localPart[0].toUpperCase();
  }
  
  return '?';
}


