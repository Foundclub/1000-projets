import { Space } from '@prisma/client';

/**
 * Valide que les médias sont conformes aux règles de l'espace
 * Pour SOLIDAIRE: pas de visages, pas de données sensibles
 * Pour PRO: pas de restrictions spécifiques (pour l'instant)
 */
export function validateMediaForSpace(
  mediaUrls: string[],
  space: Space
): { valid: boolean; error?: string } {
  if (mediaUrls.length === 0) {
    return { valid: true };
  }

  if (space === 'SOLIDAIRE') {
    // Pour l'espace SOLIDAIRE, on ne peut pas valider automatiquement
    // si les images contiennent des visages ou des données sensibles
    // sans analyse d'image. Pour l'instant, on accepte mais on devrait
    // avoir un processus de modération manuelle ou utiliser une API d'analyse d'image.
    
    // TODO: Implémenter validation automatique avec API d'analyse d'image
    // ou processus de modération manuelle
    
    // Pour l'instant, on retourne valid: true mais on devrait ajouter
    // un flag "needsModeration" ou similaire
    return { valid: true };
  }

  // Pour PRO, pas de restrictions pour l'instant
  return { valid: true };
}

/**
 * Vérifie si les médias peuvent être attachés à un post SOLIDAIRE
 * Cette fonction devrait être appelée avant de créer/modifier un FeedPost
 */
export function canAttachMediaToSolidairePost(mediaUrls: string[]): boolean {
  if (mediaUrls.length === 0) {
    return true;
  }

  // Pour l'instant, on retourne true mais on devrait avoir une validation
  // plus stricte (modération manuelle ou API d'analyse)
  // TODO: Implémenter validation stricte pour SOLIDAIRE
  
  return true;
}

