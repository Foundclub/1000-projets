"use client";
import { usePathname } from 'next/navigation';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';
import Image from 'next/image';

/**
 * Composant minimal pour tester si le problème vient du fetch asynchrone
 * Ce composant n'utilise que usePathname() sans useState ni useEffect
 */
export function LevelBadgeHeaderMinimal() {
  const pathname = usePathname();

  // Valeurs XP par défaut (sans fetch)
  const defaultXp = { xp: 0, xpPro: 0, xpSolid: 0 };

  // Déterminer l'espace actif selon le pathname
  let activeSpace: 'GENERAL' | 'PRO' | 'SOLIDAIRE' = 'GENERAL';
  if (pathname === '/missions') {
    // Par défaut PRO, mais pourrait être SOLIDAIRE selon les paramètres de l'URL
    activeSpace = 'PRO';
  } else if (pathname === '/feed') {
    activeSpace = 'GENERAL';
  }

  // Calculer le niveau selon l'espace actif (avec valeurs par défaut)
  let levelInfo;
  let levelName;
  let spaceLabel;
  let spaceColor;

  if (activeSpace === 'PRO') {
    levelInfo = getLevelFromXp(defaultXp.xpPro, false);
    levelName = getLevelNameFromXp(defaultXp.xpPro, false);
    spaceLabel = 'Pro';
    spaceColor = 'from-pro-500/10 to-pro-500/5 border-pro-500/20';
  } else {
    // activeSpace === 'GENERAL' (SOLIDAIRE n'est pas utilisé dans ce composant minimal)
    levelInfo = getLevelFromXp(defaultXp.xp, true);
    levelName = getLevelNameFromXp(defaultXp.xp, true);
    spaceLabel = 'Général';
    spaceColor = 'from-primary/10 to-primary/5 border-primary/20';
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br ${spaceColor} shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer`}>
      <Image
        src={getBadgeForLevel(levelInfo.level)}
        alt={`Badge ${levelName}`}
        width={32}
        height={32}
        className="object-contain drop-shadow-md"
      />
      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold text-foreground leading-tight">{levelName}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{spaceLabel} - Niveau {levelInfo.level}</span>
      </div>
    </div>
  );
}


