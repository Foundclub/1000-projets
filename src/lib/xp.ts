import { Space } from '@prisma/client';

/**
 * Structure des niveaux :
 * - 10 tiers : Bronze, Argent, Or, Platine, Diamant, Saphir, Émeraude, Champion, Grand Champion, Elite
 * - Chaque tier a 5 sous-niveaux (ex: Or 1, Or 2, Or 3, Or 4, Or 5)
 * - Total : 50 niveaux
 * 
 * Niveaux généraux : paliers à 2x XP (1000, 2000, 3000, ...)
 * Niveaux Pro/Solidaire : paliers à 1x XP (500, 1000, 1500, ...)
 */

const TIERS = [
  'Bronze',
  'Argent',
  'Or',
  'Platine',
  'Diamant',
  'Saphir',
  'Émeraude',
  'Champion',
  'Grand Champion',
  'Elite',
] as const;

const SUB_LEVELS_PER_TIER = 5;
const TOTAL_LEVELS = TIERS.length * SUB_LEVELS_PER_TIER; // 50 niveaux

/**
 * Calcule le niveau à partir de l'XP
 * @param xp - XP total
 * @param isGeneral - true pour XP général (2x), false pour Pro/Solidaire (1x)
 * @returns Informations sur le niveau actuel
 */
export function getLevelFromXp(xp: number, isGeneral: boolean): {
  tier: string;
  subLevel: number;
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  progress: number;
  tierIndex: number;
} {
  // Multiplicateur pour les niveaux généraux (2x)
  const multiplier = isGeneral ? 2 : 1;
  
  // Calculer le palier de base (500 pour Pro/Solidaire, 1000 pour général)
  const baseThreshold = 500 * multiplier;
  
  // Calculer le niveau actuel (niveau 1 = 0 XP, niveau 2 = baseThreshold, niveau 3 = 2*baseThreshold, etc.)
  // XP requis pour le niveau N = (N - 1) * baseThreshold
  let level = 1;
  if (xp > 0) {
    level = Math.floor(xp / baseThreshold) + 1;
  }
  
  // Limiter le niveau à 50
  if (level > TOTAL_LEVELS) {
    level = TOTAL_LEVELS;
  }
  
  // Calculer l'XP dans le niveau actuel
  const xpForCurrentLevel = (level - 1) * baseThreshold;
  const xpInLevel = xp - xpForCurrentLevel;
  
  // Calculer l'XP nécessaire pour le prochain niveau
  const xpForNextLevel = level < TOTAL_LEVELS ? baseThreshold : 0;
  
  // Calculer le tier et le sous-niveau
  const tierIndex = Math.floor((level - 1) / SUB_LEVELS_PER_TIER);
  const subLevel = ((level - 1) % SUB_LEVELS_PER_TIER) + 1;
  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)];
  
  // Calculer la progression (0 à 1)
  const progress = xpForNextLevel > 0 ? Math.min(1, Math.max(0, xpInLevel / xpForNextLevel)) : 1;
  
  return {
    tier,
    subLevel,
    level,
    xpInLevel,
    xpForNextLevel,
    progress,
    tierIndex,
  };
}

/**
 * Retourne le nom complet du niveau (ex: "Or 3")
 * @param level - Numéro du niveau (1-50)
 * @param isGeneral - true pour XP général, false pour Pro/Solidaire (non utilisé mais gardé pour compatibilité)
 * @returns Nom du niveau
 */
export function getLevelName(level: number, isGeneral: boolean): string {
  // Calculer directement le tier et sous-niveau à partir du niveau
  const tierIndex = Math.floor((level - 1) / SUB_LEVELS_PER_TIER);
  const subLevel = ((level - 1) % SUB_LEVELS_PER_TIER) + 1;
  const tier = TIERS[Math.min(tierIndex, TIERS.length - 1)];
  
  return `${tier} ${subLevel}`;
}

/**
 * Retourne le nom du niveau à partir de l'XP
 * @param xp - XP total
 * @param isGeneral - true pour XP général, false pour Pro/Solidaire
 * @returns Nom du niveau (ex: "Or 3")
 */
export function getLevelNameFromXp(xp: number, isGeneral: boolean): string {
  const levelInfo = getLevelFromXp(xp, isGeneral);
  return `${levelInfo.tier} ${levelInfo.subLevel}`;
}

/**
 * XP pour l'acceptation d'une mission
 * Supprime la décroissance - toujours 500 XP (ou baseXp + bonusXp)
 */
export function xpForAcceptance(baseXp: number = 500, bonusXp: number = 0, space: Space) {
  const totalXp = baseXp + bonusXp;
  const global = totalXp;
  const pro = space === 'PRO' ? totalXp : 0;
  const solid = space === 'SOLIDAIRE' ? totalXp : 0;
  return { global, pro, solid };
}

/**
 * XP pour suivre un club (+5 XP global)
 */
export function xpForFollow() {
  return { global: 5, pro: 0, solid: 0 };
}

/**
 * Bonus XP si la mission provient d'un club suivi (+10 XP global)
 */
export function xpForFollowedClubMission() {
  return { global: 10, pro: 0, solid: 0 };
}

/**
 * Retourne le chemin vers le badge correspondant au niveau
 * @param level - Numéro du niveau (1-50)
 * @returns Chemin public vers l'image du badge
 */
export function getBadgeForLevel(level: number): string {
  // Gérer les cas par défaut (niveau 0 ou supérieur à 50)
  if (level <= 0 || level > 50) {
    return '/badges/bronze.png';
  }

  // Calculer le tier à partir du niveau
  // Chaque tier correspond à 5 niveaux
  const tierIndex = Math.floor((level - 1) / SUB_LEVELS_PER_TIER);
  
  // Mapping des tiers vers les badges
  const badgeMap: Record<number, string> = {
    0: '/badges/bronze.png',           // Niveaux 1-5
    1: '/badges/argent.png',            // Niveaux 6-10
    2: '/badges/or.png',                // Niveaux 11-15
    3: '/badges/platine.png',           // Niveaux 16-20
    4: '/badges/diamant.png',           // Niveaux 21-25
    5: '/badges/saphir.png',            // Niveaux 26-30
    6: '/badges/emeraude.png',          // Niveaux 31-35
    7: '/badges/champion.png',          // Niveaux 36-40
    8: '/badges/grand-champion.png',    // Niveaux 41-45
    9: '/badges/elite.png',             // Niveaux 46-50
  };

  // Retourner le badge correspondant ou bronze par défaut
  return badgeMap[tierIndex] || '/badges/bronze.png';
}

/**
 * Fonction legacy pour compatibilité - utilise maintenant getLevelFromXp
 * @deprecated Utiliser getLevelFromXp à la place
 */
export function levelFromXp(xp: number) {
  const levelInfo = getLevelFromXp(xp, true);
  return {
    level: levelInfo.level,
    progress: levelInfo.progress,
    nextThreshold: levelInfo.xpForNextLevel + levelInfo.xpInLevel,
  };
}
