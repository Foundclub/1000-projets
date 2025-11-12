"use client";
import { useEffect, useState } from 'react';
import { WelcomeTutorial } from './welcome-tutorial';
import { shouldShowTutorial } from '@/lib/tutorial';

export function TutorialWrapper() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    async function checkAuth() {
      try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        setIsAuthenticated(res.ok);
        
        // Afficher le tutoriel seulement si l'utilisateur n'est pas connecté
        if (!res.ok && shouldShowTutorial()) {
          setShowTutorial(true);
        }
      } catch (e) {
        setIsAuthenticated(false);
        // Si erreur, considérer comme non connecté et afficher le tutoriel si nécessaire
        if (shouldShowTutorial()) {
          setShowTutorial(true);
        }
      }
    }

    checkAuth();
  }, []);

  // Ne pas afficher si on est en train de vérifier l'authentification
  if (isAuthenticated === null) {
    return null;
  }

  // Ne pas afficher si l'utilisateur est connecté
  if (isAuthenticated) {
    return null;
  }

  return (
    <WelcomeTutorial 
      open={showTutorial} 
      onClose={() => setShowTutorial(false)} 
    />
  );
}

