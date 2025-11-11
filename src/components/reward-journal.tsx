"use client";
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPublicUrl } from '@/lib/supabase';
import Image from 'next/image';
import { X } from 'lucide-react';

interface RewardJournalProps {
  submissionId: string;
  rewardDeliveredAt: Date | string | null;
  rewardNote: string | null;
  rewardMediaUrl: string | null;
}

export function RewardJournal({ submissionId, rewardDeliveredAt, rewardNote, rewardMediaUrl }: RewardJournalProps) {
  const [delivered, setDelivered] = useState(!!rewardDeliveredAt);
  const [note, setNote] = useState(rewardNote || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(rewardMediaUrl ? getPublicUrl(rewardMediaUrl, 'proofs') : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validation du fichier
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setError('Le fichier est trop volumineux (max 10Mo)');
      return;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    if (!['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      setError('Type de fichier non supporté. Utilisez PNG, JPG, JPEG, GIF ou WEBP');
      return;
    }
    
    setSelectedFile(file);
    setError('');
    
    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function handleMarkReward() {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      if (note) {
        formData.append('rewardNote', note);
      }
      if (selectedFile) {
        formData.append('rewardMedia', selectedFile);
      }
      
      const res = await fetch(`/api/submissions/${submissionId}/reward`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        setDelivered(true);
        setSelectedFile(null);
        alert('✅ Récompense marquée comme remise');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }

  if (delivered) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Journal de récompense</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Récompense remise</span>
            </div>
            {rewardDeliveredAt && (
              <p className="text-xs text-muted-foreground">
                Remise le {new Date(rewardDeliveredAt).toLocaleString('fr-FR')}
              </p>
            )}
            {rewardNote && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">{rewardNote}</p>
              </div>
            )}
            {rewardMediaUrl && (
              <div className="mt-2 relative">
                <Image
                  src={getPublicUrl(rewardMediaUrl, 'proofs') || ''}
                  alt="Média de la récompense"
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Journal de récompense</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={delivered}
              onChange={(e) => setDelivered(e.target.checked)}
              disabled={loading}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Marquer la récompense comme remise</span>
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Note (optionnel)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Code XXX envoyé, bon remis, etc."
              rows={3}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Média (optionnel)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
              id="reward-media-input"
            />
            <label
              htmlFor="reward-media-input"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedFile || filePreview ? 'Changer le média' : 'Ajouter un média'}
            </label>
            
            {filePreview && (
              <div className="mt-2 relative inline-block">
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
                <Image
                  src={filePreview}
                  alt="Aperçu du média"
                  width={200}
                  height={200}
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <Button
            onClick={handleMarkReward}
            disabled={loading || !delivered}
            className="w-full"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


