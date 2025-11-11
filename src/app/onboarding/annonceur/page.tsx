"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabaseBrowser } from '@/lib/supabase';

export default function OnboardingAnnonceurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    avatar: null as File | null,
    // Organization fields
    organizationName: '',
    organizationLogo: null as File | null,
    organizationCover: null as File | null,
    organizationBio: '',
    organizationWebsite: '',
    // KYC
    justificatif: null as File | null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const supabase = supabaseBrowser();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Vous devez être connecté');
        return;
      }

      let avatarUrl = '';
      let organizationLogoUrl = '';
      let organizationCoverUrl = '';
      let justificatifUrl = '';

      // Upload avatar if provided
      if (formData.avatar) {
        const avatarExt = formData.avatar.name.split('.').pop();
        const avatarPath = `${authUser.id}/${Date.now()}.${avatarExt}`;
        const { error: avatarError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, formData.avatar, { upsert: true });
        
        if (avatarError) {
          console.error('[Onboarding Annonceur] Avatar upload error:', avatarError);
          setError(`Erreur lors de l'upload de l'avatar: ${avatarError.message}`);
          return;
        }
        
        const { data: avatarData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 365 * 24 * 60 * 60);
        avatarUrl = avatarData?.signedUrl || '';
      }

      // Upload organization logo if provided
      if (formData.organizationLogo) {
        const logoExt = formData.organizationLogo.name.split('.').pop();
        const logoPath = `${authUser.id}/org-logo-${Date.now()}.${logoExt}`;
        const { error: logoError } = await supabase.storage
          .from('missions')
          .upload(logoPath, formData.organizationLogo, { upsert: true });
        
        if (logoError) {
          console.error('[Onboarding Annonceur] Logo upload error:', logoError);
          setError(`Erreur lors de l'upload du logo: ${logoError.message}`);
          return;
        }
        
        const { data: logoData } = await supabase.storage
          .from('missions')
          .createSignedUrl(logoPath, 365 * 24 * 60 * 60);
        organizationLogoUrl = logoData?.signedUrl || '';
      }

      // Upload organization cover if provided
      if (formData.organizationCover) {
        const coverExt = formData.organizationCover.name.split('.').pop();
        const coverPath = `${authUser.id}/org-cover-${Date.now()}.${coverExt}`;
        const { error: coverError } = await supabase.storage
          .from('missions')
          .upload(coverPath, formData.organizationCover, { upsert: true });
        
        if (coverError) {
          console.error('[Onboarding Annonceur] Cover upload error:', coverError);
          setError(`Erreur lors de l'upload de la couverture: ${coverError.message}`);
          return;
        }
        
        const { data: coverData } = await supabase.storage
          .from('missions')
          .createSignedUrl(coverPath, 365 * 24 * 60 * 60);
        organizationCoverUrl = coverData?.signedUrl || '';
      }

      // Upload justificatif (required)
      if (!formData.justificatif) {
        setError('Le justificatif est requis');
        return;
      }

      const justifExt = formData.justificatif.name.split('.').pop();
      const justifPath = `${authUser.id}/${Date.now()}.${justifExt}`;
      const { error: justifError } = await supabase.storage
        .from('justificatifs')
        .upload(justifPath, formData.justificatif, { upsert: true });
      
      if (justifError) {
        console.error('[Onboarding Annonceur] Justificatif upload error:', justifError);
        setError(`Erreur lors de l'upload du justificatif: ${justifError.message}`);
        return;
      }
      
      const { data: justifData } = await supabase.storage
        .from('justificatifs')
        .createSignedUrl(justifPath, 365 * 24 * 60 * 60);
      justificatifUrl = justifData?.signedUrl || '';

      const res = await fetch('/api/onboarding/annonceur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || null,
          avatarUrl: avatarUrl || undefined,
          organizationName: formData.organizationName,
          organizationLogoUrl: organizationLogoUrl || undefined,
          organizationCoverUrl: organizationCoverUrl || undefined,
          organizationBio: formData.organizationBio || undefined,
          organizationWebsite: formData.organizationWebsite || undefined,
          justificatifUrl,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la soumission');
        return;
      }
      
      router.push('/missions');
      router.refresh();
    } catch (e) {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 sm:pb-28">
      <h1 className="text-2xl font-bold mb-6">Onboarding Annonceur</h1>
      <p className="text-muted-foreground mb-6">
        Complétez votre profil et créez votre organisation. Votre demande sera soumise pour validation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-2">
            Votre demande sera soumise pour validation. Vous resterez Missionnaire jusqu'à approbation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Informations personnelles</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Prénom *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Nom *</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Date de naissance (JJ/MM/AAAA)</label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Avatar (optionnel)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, avatar: e.target.files?.[0] || null })}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold">Organisation (Club)</h2>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Nom de l'organisation *</label>
            <Input
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              required
              disabled={loading}
              placeholder="Ex: Mon Club"
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Logo (optionnel)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, organizationLogo: e.target.files?.[0] || null })}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Image de couverture (optionnel)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, organizationCover: e.target.files?.[0] || null })}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Bio (optionnel)</label>
            <Textarea
              value={formData.organizationBio}
              onChange={(e) => setFormData({ ...formData, organizationBio: e.target.value })}
              disabled={loading}
              placeholder="Description de votre organisation..."
              rows={4}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Site web (optionnel)</label>
            <Input
              type="url"
              value={formData.organizationWebsite}
              onChange={(e) => setFormData({ ...formData, organizationWebsite: e.target.value })}
              disabled={loading}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold">KYC (Justificatif)</h2>
          
          <div>
            <label className="text-sm font-semibold mb-2 block">Justificatif (document PDF/image) *</label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFormData({ ...formData, justificatif: e.target.files?.[0] || null })}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Document prouvant votre statut d'annonceur (KBIS, SIRET, etc.)
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Retour
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Enregistrement...' : 'Soumettre la demande'}
          </Button>
        </div>
      </form>
    </div>
  );
}


