"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  organizationSlug: string;
  initialFollowing?: boolean;
  onFollowChange?: (following: boolean) => void;
}

export function FollowButton({ organizationSlug, initialFollowing = false, onFollowChange }: FollowButtonProps) {
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
      const res = await fetch(`/api/clubs/${organizationSlug}/follow`, {
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
      const res = await fetch(`/api/clubs/${organizationSlug}/unfollow`, {
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
          {loading ? '...' : 'Ne plus suivre'}
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
      >
        {loading ? '...' : 'Suivre'}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

