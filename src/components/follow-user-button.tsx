"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FollowUserButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onFollowChange?: (following: boolean) => void;
}

export function FollowUserButton({ userId, initialFollowing = false, onFollowChange }: FollowUserButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  async function handleFollow() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        setFollowing(true);
        onFollowChange?.(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors du suivi');
      }
    } catch (e) {
      setError('Erreur lors du suivi');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnfollow() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        setFollowing(false);
        onFollowChange?.(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'arrêt du suivi');
      }
    } catch (e) {
      setError('Erreur lors de l\'arrêt du suivi');
    } finally {
      setLoading(false);
    }
  }

  if (following) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleUnfollow}
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ...
            </>
          ) : (
            'Ne plus suivre'
          )}
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
        onClick={handleFollow}
        disabled={loading}
        variant="default"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ...
          </>
        ) : (
          'Suivre'
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

