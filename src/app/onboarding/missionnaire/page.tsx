"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseBrowser } from '@/lib/supabase';

export default function OnboardingMissionnairePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    avatar: null as File | null,
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

      // Upload avatar if provided
      if (formData.avatar) {
        const avatarExt = formData.avatar.name.split('.').pop();
        const avatarPath = `${authUser.id}/${Date.now()}.${avatarExt}`;
        const { error: avatarError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, formData.avatar, { upsert: true });
        
        if (avatarError) {
          console.error('[Onboarding Missionnaire] Avatar upload error:', avatarError);
          setError(`Erreur lors de l'upload de l'avatar: ${avatarError.message}`);
          return;
        }
        
        const { data: avatarData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 365 * 24 * 60 * 60); // 1 year
        avatarUrl = avatarData?.signedUrl || '';
      }

      const res = await fetch('/api/onboarding/missionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || null,
          avatarUrl: avatarUrl || undefined,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
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
      <h1 className="text-2xl font-bold mb-6">Onboarding Missionnaire</h1>
      <p className="text-muted-foreground mb-6">
        Complétez votre profil pour commencer à participer aux missions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Enregistrement...' : 'Continuer'}
          </Button>
        </div>
      </form>
    </div>
  );
}


