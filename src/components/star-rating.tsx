"use client";
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type StarRatingProps = {
  mode: 'read' | 'edit';
  rating?: { avg: number; count: number };
  onSubmit?: (score: number, comment?: string) => void;
  initialScore?: number;
  initialComment?: string;
};

export function StarRating({ mode, rating, onSubmit, initialScore, initialComment }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initialScore || 0);
  const [comment, setComment] = useState(initialComment || '');

  if (mode === 'read') {
    if (!rating || rating.count === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>⭐</span>
          <span>Nouveau</span>
        </div>
      );
    }

    const fullStars = Math.floor(rating.avg);
    const hasHalfStar = rating.avg % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const roundedAvg = Number(rating.avg.toFixed(1));

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: fullStars }).map((_, i) => (
            <span key={i} className="text-yellow-400">⭐</span>
          ))}
          {hasHalfStar && <span className="text-yellow-400">⭐</span>}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <span key={i} className="text-gray-300">⭐</span>
          ))}
        </div>
        <span className="text-sm font-medium">{roundedAvg}</span>
        <span className="text-sm text-muted-foreground">({rating.count} avis)</span>
      </div>
    );
  }

  // Mode édition
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelected(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl focus:outline-none transition-transform hover:scale-110"
          >
            {star <= (hovered || selected) ? (
              <span className="text-yellow-400">⭐</span>
            ) : (
              <span className="text-gray-300">⭐</span>
            )}
          </button>
        ))}
        {selected > 0 && (
          <span className="text-sm text-muted-foreground ml-2">{selected}/5</span>
        )}
      </div>
      <div>
        <label className="text-sm font-semibold mb-2 block">Commentaire (optionnel)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Votre avis sur cette mission..."
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/500</p>
      </div>
      {onSubmit && (
        <Button
          onClick={() => onSubmit(selected, comment.trim() || undefined)}
          disabled={selected === 0}
          className="w-full"
        >
          Envoyer la note
        </Button>
      )}
    </div>
  );
}

