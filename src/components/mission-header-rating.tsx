"use client";
import { useEffect, useState } from 'react';
import { StarRating } from '@/components/star-rating';
import { AnnonceurBadge } from '@/components/annonceur-badge';
import { RatingDialog } from '@/components/rating-dialog';
import { Button } from '@/components/ui/button';

type MissionHeaderRatingProps = {
  ownerId: string;
  missionId: string;
  userId?: string;
  acceptedSubmissionId?: string;
};

export function MissionHeaderRating({ ownerId, missionId, userId, acceptedSubmissionId }: MissionHeaderRatingProps) {
  const [rating, setRating] = useState<{ avg: number; count: number; isCertified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [hasRated, setHasRated] = useState(false);

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

  useEffect(() => {
    async function checkRating() {
      if (!userId || !acceptedSubmissionId || !missionId) return;
      try {
        // Vérifier si l'utilisateur a déjà noté cette mission
        const res = await fetch(`/api/ratings?missionId=${missionId}&userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setHasRated(!!data.rating);
        }
      } catch (e) {
        // Silently fail
      }
    }
    checkRating();
  }, [userId, missionId, acceptedSubmissionId]);

  const canRate = userId && acceptedSubmissionId && !hasRated && userId !== ownerId;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <StarRating mode="read" rating={rating ? { avg: rating.avg, count: rating.count } : undefined} />
        <AnnonceurBadge isCertified={rating?.isCertified || false} />
      </div>
      {canRate && (
        <Button onClick={() => setShowDialog(true)} variant="outline" size="sm" className="mt-2">
          ⭐ Noter l'annonceur
        </Button>
      )}
      {showDialog && acceptedSubmissionId && (
        <RatingDialog
          missionId={missionId}
          submissionId={acceptedSubmissionId}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setHasRated(true);
            // Recharger les ratings
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

