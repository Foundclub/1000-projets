"use client";
import { useEffect, useState, useRef } from 'react';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';
import { useXp } from '@/hooks/use-xp';
import Image from 'next/image';

export function LevelBadgeHeader() {
  const { xp, loading } = useXp();
  const [pathname, setPathname] = useState<string>('');
  const pathnameRef = useRef<string>('');

  // Utiliser window.location au lieu de usePathname() pour éviter les problèmes avec dynamic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialiser avec le pathname actuel
    const currentPath = window.location.pathname;
    setPathname(currentPath);
    pathnameRef.current = currentPath;
    
    // Écouter les changements de route
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== pathnameRef.current) {
        pathnameRef.current = newPath;
        setPathname(newPath);
      }
    };
    
    // Écouter les événements popstate (navigation navigateur)
    window.addEventListener('popstate', handleRouteChange);
    
    // Pour Next.js, utiliser un interval pour détecter les changements de route
    const interval = setInterval(() => {
      const newPath = window.location.pathname;
      if (newPath !== pathnameRef.current) {
        pathnameRef.current = newPath;
        setPathname(newPath);
      }
    }, 100);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(interval);
    };
  }, []);

  // Déterminer l'espace actif selon le pathname
  let activeSpace: 'GENERAL' | 'PRO' | 'SOLIDAIRE' = 'GENERAL';
  if (pathname === '/missions') {
    activeSpace = 'PRO';
  } else if (pathname === '/feed') {
    activeSpace = 'GENERAL';
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-secondary rounded-full"></div>
        <div className="h-4 w-16 bg-secondary rounded"></div>
      </div>
    );
  }

  // Calculer le niveau selon l'espace actif
  let levelInfo;
  let levelName;
  let spaceLabel;
  let spaceColor;

  if (activeSpace === 'PRO') {
    levelInfo = getLevelFromXp(xp.xpPro, false);
    levelName = getLevelNameFromXp(xp.xpPro, false);
    spaceLabel = 'Pro';
    spaceColor = 'from-pro-500/10 to-pro-500/5 border-pro-500/20';
  } else {
    // activeSpace === 'GENERAL' (SOLIDAIRE n'est pas déterminé par le pathname seul)
    levelInfo = getLevelFromXp(xp.xp, true);
    levelName = getLevelNameFromXp(xp.xp, true);
    spaceLabel = 'Général';
    spaceColor = 'from-primary/10 to-primary/5 border-primary/20';
  }

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:bg-accent/50">
      <div className="flex-shrink-0">
        <Image
          src={getBadgeForLevel(levelInfo.level)}
          alt={`Badge ${levelName}`}
          width={36}
          height={36}
          className="object-contain drop-shadow-sm"
        />
      </div>
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-semibold text-foreground leading-tight truncate">{levelName}</span>
        <span className="text-xs text-muted-foreground leading-tight">{spaceLabel} - Niveau {levelInfo.level}</span>
      </div>
    </div>
  );
}

