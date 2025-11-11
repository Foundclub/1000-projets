"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface FavoriteAnnonceurButtonProps {
  annonceurId: string;
  initialFavorited?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
}

export function FavoriteAnnonceurButton({ annonceurId, initialFavorited = false, onFavoriteChange }: FavoriteAnnonceurButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function handleFavorite() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/annonceurs/${annonceurId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        setFavorited(true);
        onFavoriteChange?.(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'ajout en favoris');
      }
    } catch (e) {
      setError('Erreur lors de l\'ajout en favoris');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnfavorite() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/annonceurs/${annonceurId}/unfavorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        setFavorited(false);
        onFavoriteChange?.(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la suppression des favoris');
      }
    } catch (e) {
      setError('Erreur lors de la suppression des favoris');
    } finally {
      setLoading(false);
    }
  }

  if (favorited) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleUnfavorite}
          disabled={loading}
          variant="outline"
        >
          {loading ? '...' : '⭐ Retirer des favoris'}
        </Button>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleFavorite}
        disabled={loading}
      >
        {loading ? '...' : '⭐ Ajouter aux favoris'}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}


