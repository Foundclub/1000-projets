"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, X, Image as ImageIcon, Upload } from 'lucide-react';
import { Space } from '@prisma/client';
import { supabaseBrowser } from '@/lib/supabase';
import { getPublicUrl } from '@/lib/supabase';
import Image from 'next/image';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  missionTitle: string;
  space: Space;
  onPublished: () => void;
}

interface MediaPreview {
  file: File;
  preview: string;
  path?: string;
}

export function PublishModal({
  open,
  onOpenChange,
  postId,
  missionTitle,
  space,
  onPublished,
}: PublishModalProps) {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [missionImage, setMissionImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [loadingMission, setLoadingMission] = useState(false);

  // Charger l'image de la mission au montage
  useEffect(() => {
    if (open && postId) {
      setLoadingMission(true);
      fetch(`/api/feed/posts/${postId}`)
        .then(res => res.json())
        .then(data => {
          if (data.post?.mission?.imageUrl) {
            setMissionImage(getPublicUrl(data.post.mission.imageUrl, 'missions'));
          }
        })
        .catch(err => {
          console.error('Error loading mission image:', err);
        })
        .finally(() => {
          setLoadingMission(false);
        });
    }
  }, [open, postId]);

  // Nettoyer les previews quand le modal se ferme
  useEffect(() => {
    if (!open) {
      setText('');
      setSelectedFiles([]);
      setMediaPreviews([]);
      setMissionImage(null);
      setError('');
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validation : max 5 fichiers
    if (files.length > 5) {
      setError('Vous ne pouvez sélectionner que 5 fichiers maximum');
      return;
    }

    // Validation : types de fichiers (images uniquement)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('Seules les images (PNG, JPEG, JPG, WEBP) sont autorisées');
      return;
    }

    // Validation : taille max 5MB par fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Certains fichiers sont trop volumineux (max 5MB par fichier)`);
      return;
    }

    setError('');
    setSelectedFiles(files);

    // Créer les previews
    const newPreviews: MediaPreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setMediaPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    
    // Libérer l'URL de l'objet pour éviter les fuites mémoire
    URL.revokeObjectURL(mediaPreviews[index].preview);
    
    setSelectedFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const uploadFiles = async (userId: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    const uploadedPaths: string[] = [];
    
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const objectPath = `${userId}/${postId}/${filename}`;
      
      const supabase = supabaseBrowser();
      const { error } = await supabase.storage
        .from('feed-posts')
        .upload(objectPath, file, { upsert: true, cacheControl: '3600' });
      
      if (error) {
        throw new Error(`Erreur lors de l'upload de ${file.name}: ${error.message}`);
      }
      
      uploadedPaths.push(objectPath);
    }
    
    return uploadedPaths;
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');

    try {
      const supabase = supabaseBrowser();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('Vous devez être connecté');
      }

      // Upload des fichiers si nécessaire
      let mediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        try {
          const uploadedPaths = await uploadFiles(authUser.id);
          // Convertir les chemins en URLs publiques
          mediaUrls = uploadedPaths.map(path => {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl) return '';
            return `${supabaseUrl}/storage/v1/object/public/feed-posts/${path}`;
          });
        } catch (uploadError: any) {
          throw new Error(uploadError.message || 'Erreur lors de l\'upload des médias');
        } finally {
          setUploading(false);
        }
      }

      // Publier le post
      const res = await fetch(`/api/feed/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: text.trim() || null,
          published: true,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la publication');
      }

      // Fermer le modal et notifier le parent
      onOpenChange(false);
      // Petit délai pour que le modal se ferme avant de recharger
      setTimeout(() => {
        onPublished();
      }, 100);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la publication');
    } finally {
      setPublishing(false);
      setUploading(false);
    }
  };

  const handleLater = () => {
    // Si l'utilisateur ferme le modal sans publier, le post reste en brouillon
    // On peut afficher un message informatif
    onOpenChange(false);
  };

  const canAttachMedia = space !== 'SOLIDAIRE'; // SOLIDAIRE ne peut pas avoir de médias

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publier votre post dans "À la une"</DialogTitle>
          <DialogDescription>
            Partagez votre accomplissement pour la mission "{missionTitle}". 
            L'image de la mission sera automatiquement incluse dans votre post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Aperçu de l'image de la mission */}
          {missionImage && (
            <div className="space-y-2">
              <Label>Image de la mission</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border-2 border-border">
                <Image
                  src={missionImage}
                  alt={missionTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 500px"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cette image sera affichée dans votre post
              </p>
            </div>
          )}

          {loadingMission && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Commentaire (optionnel)</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ajoutez un commentaire sur votre accomplissement..."
              rows={4}
              maxLength={500}
              disabled={publishing || uploading}
            />
            <p className="text-xs text-muted-foreground">
              {text.length}/500 caractères
            </p>
          </div>

          {canAttachMedia && (
            <div className="space-y-2">
              <Label htmlFor="media-upload">Médias additionnels (optionnel)</Label>
              <div className="flex items-center gap-2">
                <input
                  id="media-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  disabled={publishing || uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('media-upload')?.click()}
                  disabled={publishing || uploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter des images ({selectedFiles.length}/5)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum 5 images, 5MB par fichier (PNG, JPEG, JPG, WEBP)
              </p>

              {/* Aperçu des médias sélectionnés */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border group">
                      <Image
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={publishing || uploading}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {space === 'SOLIDAIRE' && (
            <p className="text-xs text-muted-foreground italic">
              Note: Pour l'espace SOLIDAIRE, les médias additionnels ne sont pas autorisés pour respecter la dignité des personnes.
            </p>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {(uploading || publishing) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? 'Upload des médias...' : 'Publication...'}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLater}
            disabled={publishing || uploading}
            className="w-full sm:w-auto"
          >
            Publier plus tard
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || uploading}
            className="w-full sm:w-auto gap-2"
          >
            {publishing || uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? 'Upload des médias...' : 'Publication en cours...'}
              </>
            ) : (
              'Publier maintenant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

