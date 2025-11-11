import { z } from 'zod';

export const missionCreateSchema = z.object({
  title: z.string().min(3).max(120),
  space: z.enum(['PRO', 'SOLIDAIRE']),
  description: z.string().min(10).max(2000),
  criteria: z.string().min(5).max(1000),
  slotsMax: z.number().int().min(1).max(1000),
  slaDecisionH: z.number().int().min(1).max(168).default(48),
  slaRewardH: z.number().int().min(1).max(168).default(72),
  // Accepter soit une URL, soit un chemin de fichier (pour les uploads)
  imageUrl: z.string().optional().refine(
    (val) => {
      if (!val || val === '') return true; // Optionnel, donc vide est OK
      // Soit c'est une URL valide, soit c'est un chemin de fichier (format: userId/filename.ext)
      try {
        new URL(val);
        return true; // C'est une URL valide
      } catch {
        // Ce n'est pas une URL, vérifier si c'est un chemin de fichier
        return /^[^\/]+\/[^\/]+/.test(val);
      }
    },
    { message: "imageUrl doit être une URL valide ou un chemin de fichier (format: userId/filename.ext)" }
  ),
  rewardText: z.string().max(500).optional(),
  rewardEscrowContent: z.string().max(2000).optional(), // Récompense en séquestre (code promo, lien privé, etc.)
  rewardMediaUrl: z.string().optional(), // Média de récompense (image, capture d'écran, etc.) à envoyer automatiquement
  organizationId: z.string().optional(), // ID de l'organisation (club) associée
  baseXp: z.number().int().min(0).max(10000).default(500).optional(), // Base XP pour chaque mission acceptée
  bonusXp: z.number().int().min(0).max(10000).default(0).optional(), // Bonus d'XP attribué par l'admin
});

export const submissionCreateSchema = z.object({
  missionId: z.string().min(1),
  proofUrl: z.string().optional(),
  proofShots: z.array(z.string().url()).min(0).max(3).optional(),
  comments: z.string().optional(),
}).refine((data) => {
  // Only validate URL if provided and not empty
  if (data.proofUrl && data.proofUrl.trim() !== '') {
    try {
      new URL(data.proofUrl.trim());
      return true;
    } catch {
      return false;
    }
  }
  return true; // URL is optional
}, {
  message: "L'URL fournie n'est pas valide",
  path: ["proofUrl"],
});

export const decisionSchema = z.object({ reason: z.string().min(2).max(500).optional() });

export const messageCreateSchema = z.object({
  type: z.enum(['TEXT', 'CODE']).default('TEXT'),
  content: z.string().min(1).max(4000),
});

export const reportCreateSchema = z.object({
  submissionId: z.string().cuid(),
  kind: z.enum(['NO_REWARD', 'INVALID_CODE', 'ABUSE', 'OTHER']),
  details: z.string().max(1000).optional(),
});

export const ratingCreateSchema = z.object({
  missionId: z.string().cuid(),
  submissionId: z.string().cuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});


