"use client";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CloseMissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  missionTitle: string;
  onCloseSuccess: (feedPostId?: string) => void;
}

export function CloseMissionModal({
  open,
  onOpenChange,
  missionId,
  missionTitle,
  onCloseSuccess,
}: CloseMissionModalProps) {
  const [closing, setClosing] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [error, setError] = useState('');

  const handleClose = async (success: boolean) => {
    setClosing(true);
    setError('');

    try {
      // Étape 1: Clôturer la mission
      const res = await fetch(`/api/missions/${missionId}/close`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la clôture de la mission');
      }

      // Étape 2: Si la mission s'est bien passée, créer un FeedPost pour l'annonceur
      if (success) {
        setCreatingPost(true);
        try {
          const postRes = await fetch(`/api/missions/${missionId}/create-annonceur-post`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (!postRes.ok) {
            const postData = await postRes.json();
            throw new Error(postData.error || 'Erreur lors de la création du post');
          }
          
          const postData = await postRes.json();
          if (!postData.postId) {
            throw new Error('Le post n\'a pas pu être créé');
          }
          
          // Fermer le modal de clôture et ouvrir le modal de publication
          onOpenChange(false);
          // Petit délai pour que le modal de clôture se ferme avant d'ouvrir le modal de publication
          setTimeout(() => {
            onCloseSuccess(postData.postId);
          }, 150);
        } catch (e: any) {
          // Si la création échoue, afficher l'erreur mais ne pas fermer le modal
          setError(e.message || 'Erreur lors de la création du post. La mission a été clôturée, mais le post n\'a pas pu être créé.');
          setClosing(false);
          setCreatingPost(false);
          return;
        }
      } else {
        // Mission clôturée sans publication
        onOpenChange(false);
        onCloseSuccess();
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la clôture de la mission');
      setClosing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Clôturer la mission</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir clôturer la mission "{missionTitle}" ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            La mission s'est-elle bien passée ? Si oui, vous pourrez publier un post dans "À la une" avec l'image de la mission et un commentaire optionnel.
          </p>

          {error && (
            <div className={`p-3 text-sm rounded-lg ${
              error.includes('échoué') 
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {error}
            </div>
          )}

          {closing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Clôture de la mission en cours...
              </div>
              {creatingPost && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Création du post en cours...
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closing}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleClose(false)}
            disabled={closing}
            className="w-full sm:w-auto gap-2"
          >
            {closing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Clôture...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Non, clôturer sans publier
              </>
            )}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            disabled={closing}
            className="w-full sm:w-auto gap-2"
          >
            {closing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Clôture...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Oui, publier dans "À la une"
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

