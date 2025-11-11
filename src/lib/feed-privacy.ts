import { FeedPrivacy, FeedPrivacyOverride } from '@prisma/client';

/**
 * Calcule la privacy effective en combinant le réglage par défaut de l'utilisateur
 * et l'override spécifique à la soumission
 */
export function calculateEffectivePrivacy(
  userDefault: FeedPrivacy,
  override: FeedPrivacyOverride
): FeedPrivacy {
  if (override !== 'INHERIT') {
    return override;
  }
  return userDefault;
}

/**
 * Détermine si un FeedPost doit être créé selon la privacy effective
 */
export function shouldCreateFeedPost(effectivePrivacy: FeedPrivacy): boolean {
  return effectivePrivacy !== 'NEVER';
}

/**
 * Détermine si le FeedPost doit être publié immédiatement
 */
export function shouldPublishImmediately(effectivePrivacy: FeedPrivacy): boolean {
  return effectivePrivacy === 'AUTO';
}

/**
 * Détermine si le FeedPost doit être créé en brouillon (ASK mode)
 */
export function shouldCreateAsDraft(effectivePrivacy: FeedPrivacy): boolean {
  return effectivePrivacy === 'ASK';
}

