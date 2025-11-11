"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ApplyMissionButtonProps {
  missionId: string;
  missionTitle: string;
  slotsTaken: number;
  slotsMax: number;
  missionStatus: string;
  onApplied?: () => void;
}

export function ApplyMissionButton({ 
  missionId, 
  missionTitle, 
  slotsTaken, 
  slotsMax, 
  missionStatus,
  onApplied 
}: ApplyMissionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isDisabled = missionStatus !== 'OPEN' || slotsTaken >= slotsMax;
  const disabledMessage = missionStatus === 'CLOSED' || missionStatus === 'ARCHIVED' 
    ? 'Mission fermée' 
    : slotsTaken >= slotsMax 
    ? 'Tous les slots sont occupés' 
    : '';

  async function handleApply() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/missions/${missionId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOpen(false);
        setMessage('');
        alert('✅ Candidature envoyée ! Un canal de communication a été ouvert avec l\'annonceur.');
        onApplied?.();
        // Rediriger vers le thread de chat
        if (data.threadId) {
          router.push(`/threads/${data.threadId}`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la candidature');
      }
    } catch (e) {
      setError('Erreur lors de la candidature');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button 
        onClick={() => setOpen(true)}
        disabled={isDisabled}
        className="w-full"
      >
        {isDisabled ? disabledMessage : '🎯 Je veux faire cette mission'}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Postuler pour cette mission</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vous allez créer un canal de communication avec l'annonceur pour discuter de la mission "{missionTitle}".
            </p>
          </div>
          <button 
            onClick={() => {
              setOpen(false);
              setMessage('');
              setError('');
            }}
            className="text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Message initial (optionnel)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dites pourquoi vous êtes intéressé par cette mission..."
              rows={4}
              disabled={loading}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 caractères
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setMessage('');
              setError('');
            }}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Envoyer ma candidature'}
          </Button>
        </div>
      </div>
    </div>
  );
}

