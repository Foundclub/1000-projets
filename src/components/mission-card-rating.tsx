"use client";
import { useEffect, useState } from 'react';
import { StarRating } from '@/components/star-rating';
import { AnnonceurBadge } from '@/components/annonceur-badge';

export function MissionCardRating({ ownerId }: { ownerId: string }) {
  const [rating, setRating] = useState<{ avg: number; count: number; isCertified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRating() {
      try {
        const res = await fetch(`/api/annonceurs/${ownerId}/rating`);
        if (res.ok) {
          const data = await res.json();
          setRating({
            avg: data.ratingAvg || 0,
            count: data.ratingCount || 0,
            isCertified: data.isCertifiedAnnonceur || false,
          });
        }
      } catch (e) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRating();
  }, [ownerId]);

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StarRating mode="read" rating={rating ? { avg: rating.avg, count: rating.count } : undefined} />
      <AnnonceurBadge isCertified={rating?.isCertified || false} />
    </div>
  );
}

