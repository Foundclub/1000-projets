"use client";
import { useState } from 'react';
import { StarRating } from '@/components/star-rating';
import { Button } from '@/components/ui/button';

type RatingDialogProps = {
  missionId: string;
  submissionId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function RatingDialog({ missionId, submissionId, onClose, onSuccess }: RatingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(score: number, comment?: string) {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          submissionId,
          score,
          comment,
        }),
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'envoi de la note');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Noter l'annonceur</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <StarRating mode="edit" onSubmit={handleSubmit} />
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-sm text-muted-foreground text-center">
            Envoi en cours...
          </div>
        )}
      </div>
    </div>
  );
}

