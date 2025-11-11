import { getBaseUrl } from './url';

/**
 * Génère l'URL de partage pour un post du feed
 */
export function generateFeedPostShareUrl(postId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/feed/${postId}`;
}

/**
 * Partage un post via Web Share API si disponible, sinon copie l'URL
 */
export async function shareFeedPost(postId: string, title?: string, text?: string): Promise<boolean> {
  const url = generateFeedPostShareUrl(postId);
  
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: title || 'Mission accomplie',
        text: text || 'Découvrez cette mission accomplie',
        url: url,
      });
      return true;
    } catch (error: any) {
      // L'utilisateur a annulé le partage ou une erreur s'est produite
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  
  // Fallback: copier l'URL dans le presse-papiers
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
  
  // Dernier recours: afficher l'URL (pour les navigateurs très anciens)
  alert(`URL à partager: ${url}`);
  return false;
}

