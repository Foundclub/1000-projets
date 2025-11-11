"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, RotateCcw } from 'lucide-react';
import { MissionStatus } from '@prisma/client';

interface ReopenMissionButtonProps {
  missionId: string;
  missionTitle: string;
  missionStatus: MissionStatus;
  slotsTaken: number;
  slotsMax: number;
}

export function ReopenMissionButton({
  missionId,
  missionTitle,
  missionStatus,
  slotsTaken,
  slotsMax,
}: ReopenMissionButtonProps) {
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleReopen = async () => {
    setReopening(true);
    setError('');

    try {
      const res = await fetch(`/api/missions/${missionId}/reopen`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la réouverture');
      }

      setReopenModalOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la réouverture');
    } finally {
      setReopening(false);
    }
  };

  if (missionStatus !== MissionStatus.CLOSED) {
    return null;
  }

  // Vérifier si la mission peut être rouverte
  const canReopen = slotsTaken < slotsMax;

  if (!canReopen) {
    return null; // Tous les slots sont pris, on ne peut pas rouvrir
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setReopenModalOpen(true)}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Rouvrir
      </Button>
      
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rouvrir la mission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir rouvrir la mission "{missionTitle}" ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              La mission sera à nouveau visible et les utilisateurs pourront postuler.
              {slotsTaken > 0 && (
                <span className="block mt-2">
                  <strong>Note :</strong> {slotsTaken} slot(s) déjà pris sur {slotsMax}.
                </span>
              )}
            </p>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}

            {reopening && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Réouverture de la mission en cours...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReopenModalOpen(false)}
              disabled={reopening}
            >
              Annuler
            </Button>
            <Button
              onClick={handleReopen}
              disabled={reopening}
              className="gap-2"
            >
              {reopening ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Réouverture...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Rouvrir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

