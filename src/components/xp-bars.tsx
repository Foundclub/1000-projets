"use client";
import { useEffect, useState } from 'react';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';
import Image from 'next/image';
import { InfoButton } from '@/components/info-button';

export function XpBars() {
  const [xp, setXp] = useState({ xp: 0, xpPro: 0, xpSolid: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchXp() {
      try {
        const res = await fetch('/api/user/xp');
        if (res.ok) {
          const data = await res.json();
          setXp(data);
        }
      } catch (e) {
        // Silently fail - user might not be logged in
      } finally {
        setLoading(false);
      }
    }
    fetchXp();
  }, []);

  if (loading) {
    return (
      <div className="space-y-1 animate-pulse">
        <div className="h-3 bg-secondary rounded w-16"></div>
        <div className="h-3 bg-secondary rounded"></div>
        <div className="flex gap-2 text-[10px]">
          <div className="flex-1 h-4 bg-secondary rounded"></div>
          <div className="flex-1 h-4 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  // Calculer les niveaux pour chaque type d'XP
  const levelGeneral = getLevelFromXp(xp.xp, true); // Général (2x XP)
  const levelPro = getLevelFromXp(xp.xpPro, false); // Pro (1x XP)
  const levelSolid = getLevelFromXp(xp.xpSolid, false); // Solidaire (1x XP)

  const levelNameGeneral = getLevelNameFromXp(xp.xp, true);
  const levelNamePro = getLevelNameFromXp(xp.xpPro, false);
  const levelNameSolid = getLevelNameFromXp(xp.xpSolid, false);

  return (
    <div className="space-y-3">
      {/* Niveau Général */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Image
              src={getBadgeForLevel(levelGeneral.level)}
              alt={`Badge ${levelNameGeneral}`}
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="font-semibold">Général</span>
            <InfoButton 
              content="L'XP Général représente votre progression globale. Vous gagnez 2x plus d'XP dans cette catégorie. Il y a 50 niveaux répartis en 10 tiers (Bronze, Argent, Or, Platine, Diamant, Saphir, Émeraude, Champion, Grand Champion, Elite)."
              side="right"
              size="sm"
            />
          </div>
          <span className="text-muted-foreground">{levelNameGeneral}</span>
        </div>
        <div className="w-full h-3 bg-secondary rounded">
          <div 
            className="h-full bg-primary rounded transition-all duration-300" 
            style={{ width: `${Math.round(levelGeneral.progress * 100)}%` }} 
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{xp.xp} XP</span>
          <span>{levelGeneral.xpInLevel} / {levelGeneral.xpForNextLevel} XP</span>
        </div>
      </div>

      {/* Niveaux Pro et Solidaire */}
      <div className="flex gap-2 text-[10px]">
        <Bar 
          label="Pro" 
          value={xp.xpPro} 
          levelName={levelNamePro}
          levelInfo={levelPro}
          color="bg-pro-500" 
        />
        <Bar 
          label="Solidaire" 
          value={xp.xpSolid} 
          levelName={levelNameSolid}
          levelInfo={levelSolid}
          color="bg-solidaire-500" 
        />
      </div>
    </div>
  );
}

function Bar({ 
  label, 
  value, 
  levelName,
  levelInfo,
  color 
}: { 
  label: string; 
  value: number; 
  levelName: string;
  levelInfo: ReturnType<typeof getLevelFromXp>;
  color: string;
}) {
  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Image
            src={getBadgeForLevel(levelInfo.level)}
            alt={`Badge ${levelName}`}
            width={16}
            height={16}
            className="object-contain"
          />
          <span className="font-semibold">{label}</span>
          <InfoButton 
            content={label === 'Pro' 
              ? "L'XP PRO est gagnée en complétant des missions professionnelles rémunérées. Chaque mission acceptée vous rapporte de l'XP PRO selon sa valeur (baseXp + bonusXp)."
              : "L'XP SOLIDAIRE est gagnée en complétant des missions à but non lucratif. Chaque mission acceptée vous rapporte de l'XP SOLIDAIRE selon sa valeur (baseXp + bonusXp)."
            }
            side="right"
            size="sm"
          />
        </div>
        <span className="text-muted-foreground">{levelName}</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded">
        <div 
          className={`h-full rounded ${color} transition-all duration-300`} 
          style={{ width: `${Math.round(levelInfo.progress * 100)}%` }} 
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{value} XP</span>
        <span>{levelInfo.xpInLevel} / {levelInfo.xpForNextLevel} XP</span>
      </div>
    </div>
  );
}
