"use client";
import { useState, useEffect } from 'react';

type XpData = {
  xp: number;
  xpPro: number;
  xpSolid: number;
};

const defaultXp: XpData = {
  xp: 0,
  xpPro: 0,
  xpSolid: 0,
};

/**
 * Hook personnalisé pour charger l'XP de l'utilisateur
 * Garantit un nombre constant de hooks et retourne toujours la même structure
 */
export function useXp() {
  // Toujours initialiser avec les mêmes valeurs par défaut
  const [xp, setXp] = useState<XpData>(defaultXp);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchXp() {
      try {
        const res = await fetch('/api/user/xp', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setXp({
              xp: data.xp ?? 0,
              xpPro: data.xpPro ?? 0,
              xpSolid: data.xpSolid ?? 0,
            });
          }
        }
      } catch (e) {
        // User might not be logged in - keep default values
        if (!cancelled) {
          setXp(defaultXp);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchXp();

    return () => {
      cancelled = true;
    };
  }, []);

  // Toujours retourner la même structure
  return { xp, loading };
}


