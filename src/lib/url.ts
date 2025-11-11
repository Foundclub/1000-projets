/**
 * Obtient l'URL de base de l'application
 * Priorité : NEXT_PUBLIC_BASE_URL > VERCEL_URL > détection automatique
 */
export function getBaseUrl(): string {
  // Si on est côté serveur
  if (typeof window === 'undefined') {
    // Utiliser NEXT_PUBLIC_BASE_URL si défini
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    // Utiliser VERCEL_URL si disponible (format: https://xxx.vercel.app)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Fallback: essayer de détecter depuis les headers de la requête
    // Note: Cette fonction est utilisée dans les API routes, donc on ne peut pas accéder aux headers ici
    // On retourne une URL par défaut qui sera remplacée si nécessaire
    return 'https://1000-projets.vercel.app';
  }
  
  // Si on est côté client, utiliser window.location.origin
  return window.location.origin;
}

/**
 * Obtient l'URL de base depuis une requête Next.js (pour les API routes)
 */
export function getBaseUrlFromRequest(req?: { headers: { get: (key: string) => string | null } }): string {
  // Utiliser NEXT_PUBLIC_BASE_URL si défini
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Utiliser VERCEL_URL si disponible
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Essayer de détecter depuis les headers de la requête
  if (req && req.headers) {
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    
    if (host) {
      // Si on est en développement local, utiliser http
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `http://${host}`;
      }
      return `${protocol}://${host}`;
    }
  }
  
  // Fallback par défaut
  return 'https://1000-projets.vercel.app';
}

