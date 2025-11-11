"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AnnonceurProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    bio: '',
    activities: '',
    website: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.role !== 'ANNONCEUR') {
            router.push('/profile');
            return;
          }
          setFormData({
            bio: data.bio || '',
            activities: data.activities || '',
            website: data.website || '',
          });
        } else if (res.status === 401) {
          router.push('/login');
        }
      } catch (e: any) {
        console.error('Error loading profile:', e);
        setError('Erreur lors du chargement du profil: ' + (e.message || 'Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    
    try {
      const res = await fetch('/api/profile/annonceur', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bio: formData.bio || null,
          activities: formData.activities || null,
          website: formData.website || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      router.push(`/annonceurs/${user.id}`);
      alert('Profil mis à jour avec succès');
    } catch (e) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== 'ANNONCEUR') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Vous devez être un annonceur pour accéder à cette page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Modifier mon profil annonceur</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Bio / Description</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Décrivez-vous et votre activité..."
            disabled={saving}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Cette description apparaîtra sur votre profil public
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Activités</label>
          <Textarea
            value={formData.activities}
            onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
            placeholder="Décrivez vos activités, vos domaines d'expertise..."
            disabled={saving}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Détaillez vos activités et domaines d'expertise
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Site web</label>
          <Input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="example.com ou https://example.com"
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Votre site web personnel ou professionnel (https:// sera ajouté automatiquement si nécessaire)
          </p>
        </div>

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
            onClick={() => router.push(`/annonceurs/${user.id}`)}
            disabled={saving}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}

