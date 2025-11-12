/**
 * Utilitaires pour gérer l'état du tutoriel dans localStorage
 */

const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
const TUTORIAL_SHOWN_KEY = 'tutorial_shown';

/**
 * Vérifie si le tutoriel a été complété
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
}

/**
 * Marque le tutoriel comme complété
 */
export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
}

/**
 * Vérifie si le tutoriel a déjà été affiché
 */
export function isTutorialShown(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_SHOWN_KEY) === 'true';
}

/**
 * Marque le tutoriel comme affiché
 */
export function markTutorialShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_SHOWN_KEY, 'true');
}

/**
 * Réinitialise l'état du tutoriel (utile pour les tests ou réaffichage)
 */
export function resetTutorial(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  localStorage.removeItem(TUTORIAL_SHOWN_KEY);
}

/**
 * Vérifie si le tutoriel doit être affiché
 * (non affiché ET non complété)
 */
export function shouldShowTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return !isTutorialShown() && !isTutorialCompleted();
}


