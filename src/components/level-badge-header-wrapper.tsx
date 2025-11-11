"use client";
import dynamic from 'next/dynamic';

// Charger LevelBadgeHeader uniquement côté client pour éviter les problèmes d'hydratation
const LevelBadgeHeader = dynamic(
  () => import('@/components/level-badge-header').then(mod => ({ default: mod.LevelBadgeHeader })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 bg-secondary rounded-full"></div>
        <div className="h-4 w-16 bg-secondary rounded"></div>
      </div>
    )
  }
);

export function LevelBadgeHeaderWrapper() {
  return <LevelBadgeHeader />;
}


