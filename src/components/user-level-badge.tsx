"use client";
import Image from 'next/image';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';
import { Space } from '@prisma/client';

interface UserLevelBadgeProps {
  xp: number;
  xpPro: number;
  xpSolid: number;
  space?: 'PRO' | 'SOLIDAIRE' | 'GENERAL';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function UserLevelBadge({ 
  xp, 
  xpPro, 
  xpSolid, 
  space = 'GENERAL',
  size = 'sm',
  showLabel = true 
}: UserLevelBadgeProps) {
  // Déterminer quelle XP utiliser selon l'espace
  let levelInfo;
  let levelName;
  
  if (space === 'PRO') {
    levelInfo = getLevelFromXp(xpPro, false);
    levelName = getLevelNameFromXp(xpPro, false);
  } else if (space === 'SOLIDAIRE') {
    levelInfo = getLevelFromXp(xpSolid, false);
    levelName = getLevelNameFromXp(xpSolid, false);
  } else {
    // GENERAL - utiliser l'XP général
    levelInfo = getLevelFromXp(xp, true);
    levelName = getLevelNameFromXp(xp, true);
  }

  const badgeSize = size === 'sm' ? 20 : 24;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1.5">
      <Image
        src={getBadgeForLevel(levelInfo.level)}
        alt={`Badge ${levelName}`}
        width={badgeSize}
        height={badgeSize}
        className="object-contain flex-shrink-0"
      />
      {showLabel && (
        <span className={`${textSize} font-medium text-muted-foreground`}>
          {levelName}
        </span>
      )}
    </div>
  );
}

