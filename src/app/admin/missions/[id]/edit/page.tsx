"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseBrowser } from '@/lib/supabase';
import { FileText, Target, Users, Clock, Gift, Image as ImageIcon, Sparkles } from 'lucide-react';

const missionFormSchema = z.object({
  title: z.string().min(3).max(120),
  space: z.enum(['PRO', 'SOLIDAIRE']),
  description: z.string().min(10).max(2000),
  criteria: z.string().min(5).max(1000),
  slotsMax: z.number().int().min(1).max(1000),
  slaDecisionH: z.number().int().min(1).max(168).default(48),
  slaRewardH: z.number().int().min(1).max(168).default(72),
  rewardText: z.string().max(500).optional(),
  rewardEscrowContent: z.string().max(2000).optional(),
  rewardMediaFile: z.instanceof(File).optional(),
  organizationId: z.string().optional(),
  imageType: z.enum(['upload', 'url']).optional(),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
  baseXp: z.number().int().min(0).max(10000).default(500).optional(),
  bonusXp: z.number().int().min(0).max(10000).default(0).optional(),
});

type MissionFormValues = z.infer<typeof missionFormSchema>;

type Organization = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  isCertified: boolean;
};

export default function EditMissionPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageType, setImageType] = useState<'upload' | 'url' | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentRewardMediaUrl, setCurrentRewardMediaUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      space: 'PRO',
      slaDecisionH: 48,
      slaRewardH: 72,
      baseXp: 500,
      bonusXp: 0,
    },
  });

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setIsAdmin(userData.role === 'ADMIN');
        }
      } catch (e) {
        console.error('Error checking admin status:', e);
      }
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    loadMission();
    loadOrganizations();
  }, [missionId]);

  async function loadMission() {
    setLoading(true);
    try {
      const res = await fetch(`/api/missions/${missionId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const mission = data.mission;
        
        if (!mission) {
          setError('Mission non trouvée');
          return;
        }

        // Vérifier que l'utilisateur est le propriétaire
        const userRes = await fetch('/api/user/me', { credentials: 'include' });
        if (userRes.ok) {
          const user = await userRes.json();
          if (user.role !== 'ADMIN' && mission.ownerId !== user.id) {
            setError('Vous n\'avez pas la permission de modifier cette mission');
            return;
          }
        }

        // Pré-remplir le formulaire
        reset({
          title: mission.title,
          space: mission.space,
          description: mission.description,
          criteria: mission.criteria,
          slotsMax: mission.slotsMax,
          slaDecisionH: mission.slaDecisionH,
          slaRewardH: mission.slaRewardH,
          rewardText: mission.rewardText || '',
          rewardEscrowContent: (mission as any).rewardEscrowContent || '',
          organizationId: mission.organizationId || '',
          baseXp: (mission as any).baseXp ?? 500,
          bonusXp: (mission as any).bonusXp ?? 0,
        });

        // Gérer le média de récompense existant
        if ((mission as any).rewardMediaUrl) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const rewardMediaUrl = `${supabaseUrl}/storage/v1/object/public/proofs/${(mission as any).rewardMediaUrl}`;
          setCurrentRewardMediaUrl(rewardMediaUrl);
        }

        // Gérer l'image
        if (mission.imageUrl) {
          // Si c'est déjà une URL complète, l'utiliser telle quelle
          // Sinon, construire l'URL publique Supabase
          let imageUrl = mission.imageUrl;
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            // C'est un chemin de fichier, construire l'URL publique
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            imageUrl = `${supabaseUrl}/storage/v1/object/public/missions/${mission.imageUrl}`;
          }
          setCurrentImageUrl(imageUrl);
          setValue('imageUrl', imageUrl);
          setImageType('url');
        }
      } else if (res.status === 404) {
        setError('Mission non trouvée');
      } else {
        setError('Erreur lors du chargement de la mission');
      }
    } catch (e) {
      setError('Erreur lors du chargement de la mission');
    } finally {
      setLoading(false);
    }
  }

  async function loadOrganizations() {
    setLoadingOrgs(true);
    try {
      const res = await fetch('/api/clubs/my', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations);
      }
    } catch (e) {
      console.error('Error loading organizations:', e);
    } finally {
      setLoadingOrgs(false);
    }
  }

  async function onSubmit(data: MissionFormValues) {
    setError('');
    setSaving(true);
    
    try {
      const supabase = supabaseBrowser();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Vous devez être connecté');
        return;
      }

      let imageUrl = data.imageUrl || '';
      let rewardMediaUrl: string | undefined = undefined;

      // Upload image if needed
      if (imageType === 'upload' && data.imageFile) {
        const file = data.imageFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${authUser.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('missions')
          .upload(filePath, file, { upsert: true });
        
        if (uploadError) {
          setError(`Erreur lors de l'upload de l'image: ${uploadError.message}`);
          return;
        }
        
        imageUrl = filePath;
      } else if (imageType === 'url' && data.imageUrl) {
        // Si c'est une URL complète, extraire le chemin si c'est une URL Supabase
        const url = data.imageUrl;
        if (url.includes('/storage/v1/object/public/missions/')) {
          // Extraire le chemin depuis l'URL publique
          const pathMatch = url.match(/\/missions\/(.+)$/);
          if (pathMatch) {
            imageUrl = pathMatch[1];
          } else {
            imageUrl = url; // Garder l'URL complète si on ne peut pas extraire
          }
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          imageUrl = url; // URL externe
        } else {
          imageUrl = url; // Chemin déjà dans le bon format
        }
      }

      // Upload reward media if needed
      if (data.rewardMediaFile) {
        const file = data.rewardMediaFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `rewards/${authUser.id}/${fileName}`;
        
        console.log('[Mission Edit] Uploading reward media:', filePath, 'size:', file.size);
        
        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(filePath, file, { upsert: true, cacheControl: '3600' });
        
        if (uploadError) {
          console.error('[Mission Edit] Upload reward media error:', uploadError);
          setError(`Erreur lors de l'upload du média de récompense: ${uploadError.message}`);
          return;
        }
        
        console.log('[Mission Edit] Reward media upload successful');
        rewardMediaUrl = filePath;
      }

      const res = await fetch(`/api/missions/${missionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: data.title,
          space: data.space,
          description: data.description,
          criteria: data.criteria,
          slotsMax: data.slotsMax,
          slaDecisionH: data.slaDecisionH,
          slaRewardH: data.slaRewardH,
          rewardText: data.rewardText || undefined,
          rewardEscrowContent: data.rewardEscrowContent || undefined,
          rewardMediaUrl: rewardMediaUrl || undefined,
          organizationId: data.organizationId || undefined,
          imageUrl: imageUrl || undefined,
          baseXp: isAdmin ? (data.baseXp ?? 500) : undefined,
          bonusXp: isAdmin ? (data.bonusXp ?? 0) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Erreur lors de la modification de la mission');
        return;
      }

      alert('✅ Mission modifiée avec succès !');
      router.push('/admin/my-missions');
      router.refresh();
    } catch (e) {
      setError('Erreur lors de la modification de la mission');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12 text-red-600">{error}</div>
        <div className="text-center">
          <Button onClick={() => router.push('/admin/my-missions')} variant="outline">
            Retour aux missions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Modifier la mission</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations Générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Titre *</label>
              <Input
                {...register('title')}
                placeholder="Titre de la mission"
                disabled={saving}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Espace *</label>
              <select
                {...register('space')}
                disabled={saving}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="PRO">PRO</option>
                <option value="SOLIDAIRE">SOLIDAIRE</option>
              </select>
            </div>

            {organizations.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">Club (optionnel)</label>
                <select
                  {...register('organizationId')}
                  disabled={saving || loadingOrgs}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Aucun club (mission personnelle)</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.isCertified && '✓'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-2 block">Description *</label>
              <Textarea
                {...register('description')}
                placeholder="Description détaillée de la mission"
                rows={5}
                disabled={saving}
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image d'illustration (optionnel)
              </label>
              <div className="space-y-3">
                {currentImageUrl && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Image actuelle :</p>
                    <img src={currentImageUrl} alt="Image actuelle" className="max-w-xs h-32 object-cover rounded" />
                  </div>
                )}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageType"
                      value="upload"
                      checked={imageType === 'upload'}
                      onChange={() => setImageType('upload')}
                      disabled={saving}
                    />
                    <span className="text-sm">Uploader une image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageType"
                      value="url"
                      checked={imageType === 'url'}
                      onChange={() => setImageType('url')}
                      disabled={saving}
                    />
                    <span className="text-sm">URL d'image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageType"
                      value="none"
                      checked={imageType === null}
                      onChange={() => {
                        setImageType(null);
                        setValue('imageUrl', '');
                        setCurrentImageUrl(null);
                      }}
                      disabled={saving}
                    />
                    <span className="text-sm">Aucune image</span>
                  </label>
                </div>
                {imageType === 'upload' && (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setValue('imageFile', file);
                      }
                    }}
                    disabled={saving}
                  />
                )}
                {imageType === 'url' && (
                  <Input
                    {...register('imageUrl')}
                    placeholder="https://exemple.com/image.jpg"
                    type="url"
                    disabled={saving}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Critères d'acceptation *</label>
              <Textarea
                {...register('criteria')}
                placeholder="Critères que doivent respecter les soumissions"
                rows={4}
                disabled={saving}
              />
              {errors.criteria && (
                <p className="text-xs text-red-600 mt-1">{errors.criteria.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Slots max *
                </label>
                <Input
                  type="number"
                  {...register('slotsMax', { valueAsNumber: true })}
                  min={1}
                  max={1000}
                  disabled={saving}
                />
                {errors.slotsMax && (
                  <p className="text-xs text-red-600 mt-1">{errors.slotsMax.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  SLA Décision (h) *
                </label>
                <Input
                  type="number"
                  {...register('slaDecisionH', { valueAsNumber: true })}
                  min={1}
                  max={168}
                  disabled={saving}
                />
                {errors.slaDecisionH && (
                  <p className="text-xs text-red-600 mt-1">{errors.slaDecisionH.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  SLA Récompense (h) *
                </label>
                <Input
                  type="number"
                  {...register('slaRewardH', { valueAsNumber: true })}
                  min={1}
                  max={168}
                  disabled={saving}
                />
                {errors.slaRewardH && (
                  <p className="text-xs text-red-600 mt-1">{errors.slaRewardH.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Récompense & Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Récompense & Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Description de la récompense</label>
              <Textarea
                {...register('rewardText')}
                placeholder="Décrivez la récompense offerte (ex: 100€, badge spécial, etc.)"
                rows={3}
                disabled={saving}
              />
              {errors.rewardText && (
                <p className="text-xs text-red-600 mt-1">{errors.rewardText.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Ajouter la récompense</label>
              <Textarea
                {...register('rewardEscrowContent')}
                placeholder="Entrez le code, le lien privé ou les instructions qui seront automatiquement envoyés au missionnaire après validation."
                rows={4}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cette récompense sera automatiquement envoyée au missionnaire dans le chat lorsque sa soumission sera acceptée.
              </p>
              {errors.rewardEscrowContent && (
                <p className="text-xs text-red-600 mt-1">{errors.rewardEscrowContent.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Contenu multimédia à ajouter lié à la délivrance automatique de la récompense lors de la réalisation de la mission
              </label>
              {currentRewardMediaUrl && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Média actuel :</p>
                  <img src={currentRewardMediaUrl} alt="Média de récompense actuel" className="max-w-xs h-32 object-cover rounded" />
                </div>
              )}
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
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
                    setValue('rewardMediaFile', file);
                    setError('');
                  }
                }}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ce média sera automatiquement joint à la récompense envoyée au missionnaire lors de l'acceptation de sa soumission.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* XP (Admin uniquement) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Points d'Expérience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Base XP *</label>
                  <Input
                    type="number"
                    {...register('baseXp', { valueAsNumber: true })}
                    min={0}
                    max={10000}
                    disabled={saving}
                    placeholder="500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    XP de base attribué pour chaque mission acceptée (défaut: 500)
                  </p>
                  {errors.baseXp && (
                    <p className="text-xs text-red-600 mt-1">{errors.baseXp.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Bonus XP</label>
                  <Input
                    type="number"
                    {...register('bonusXp', { valueAsNumber: true })}
                    min={0}
                    max={10000}
                    disabled={saving}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bonus d'XP supplémentaire attribué par l'admin (défaut: 0)
                  </p>
                  {errors.bonusXp && (
                    <p className="text-xs text-red-600 mt-1">{errors.bonusXp.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/my-missions')}
            disabled={saving}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}

