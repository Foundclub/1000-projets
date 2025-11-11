"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabaseBrowser } from '@/lib/supabase';

type RoleChoice = 'MISSIONNAIRE' | 'ANNONCEUR' | 'ADMIN' | null;

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleChoice>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data for Annonceur
  const [annonceurData, setAnnonceurData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    companyName: '',
    avatar: null as File | null,
    justificatif: null as File | null,
  });
  
  // Form data for Admin
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
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

      if (selectedRole === 'MISSIONNAIRE') {
        // Simple: just set roleChosenAt
        const res = await fetch('/api/onboarding/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: 'MISSIONNAIRE' }),
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Erreur lors de la sauvegarde');
          return;
        }
        
        router.push('/missions');
        router.refresh();
      } else if (selectedRole === 'ANNONCEUR') {
        // Upload files first, then submit form
        let avatarUrl = '';
        let justificatifUrl = '';
        
        if (annonceurData.avatar) {
          const avatarExt = annonceurData.avatar.name.split('.').pop();
          // Le chemin ne doit pas inclure le nom du bucket
          const avatarPath = `${authUser.id}/${Date.now()}.${avatarExt}`;
          const { error: avatarError } = await supabase.storage
            .from('avatars')
            .upload(avatarPath, annonceurData.avatar, { upsert: true });
          
          if (avatarError) {
            console.error('[Onboarding] Avatar upload error:', avatarError);
            setError(`Erreur lors de l'upload de l'avatar: ${avatarError.message}`);
            return;
          }
          
          const { data: avatarData } = await supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 365 * 24 * 60 * 60); // 1 year
          avatarUrl = avatarData?.signedUrl || '';
        }
        
        if (annonceurData.justificatif) {
          const justifExt = annonceurData.justificatif.name.split('.').pop();
          // Le chemin ne doit pas inclure le nom du bucket
          const justifPath = `${authUser.id}/${Date.now()}.${justifExt}`;
          const { error: justifError } = await supabase.storage
            .from('justificatifs')
            .upload(justifPath, annonceurData.justificatif, { upsert: true });
          
          if (justifError) {
            console.error('[Onboarding] Justificatif upload error:', justifError);
            setError(`Erreur lors de l'upload du justificatif: ${justifError.message}`);
            return;
          }
          
          const { data: justifData } = await supabase.storage
            .from('justificatifs')
            .createSignedUrl(justifPath, 365 * 24 * 60 * 60); // 1 year
          justificatifUrl = justifData?.signedUrl || '';
        }
        
        const res = await fetch('/api/onboarding/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'ANNONCEUR',
            firstName: annonceurData.firstName,
            lastName: annonceurData.lastName,
            dateOfBirth: annonceurData.dateOfBirth || null,
            companyName: annonceurData.companyName,
            avatarUrl,
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
      } else if (selectedRole === 'ADMIN') {
        const res = await fetch('/api/onboarding/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'ADMIN',
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            phone: adminData.phone,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Erreur lors de la soumission');
          return;
        }
        
        router.push('/missions');
        router.refresh();
      }
    } catch (e) {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Choisissez votre rôle</h1>
      <p className="text-muted-foreground mb-6">
        Sélectionnez le rôle qui correspond le mieux à votre utilisation de la plateforme.
        Vous pourrez modifier ce choix plus tard depuis votre profil.
      </p>

      {!selectedRole ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSelectedRole('MISSIONNAIRE')}
            className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-semibold mb-2">Missionnaire</h3>
            <p className="text-sm text-muted-foreground">
              Je veux participer aux missions et gagner des récompenses
            </p>
          </button>
          
          <button
            onClick={() => setSelectedRole('ANNONCEUR')}
            className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🏢</div>
            <h3 className="font-semibold mb-2">Annonceur</h3>
            <p className="text-sm text-muted-foreground">
              Je veux créer des missions et recruter des talents
            </p>
          </button>
          
          <button
            onClick={() => setSelectedRole('ADMIN')}
            className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold mb-2">Admin</h3>
            <p className="text-sm text-muted-foreground">
              Je veux gérer la plateforme et valider les demandes
            </p>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedRole === 'MISSIONNAIRE' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                En tant que Missionnaire, vous pourrez participer aux missions et gagner des récompenses.
                Cliquez sur "Confirmer" pour continuer.
              </p>
            </div>
          )}

          {selectedRole === 'ANNONCEUR' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-2">
                  Votre demande sera soumise pour validation. Vous resterez Missionnaire jusqu'à approbation.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Prénom *</label>
                  <Input
                    value={annonceurData.firstName}
                    onChange={(e) => setAnnonceurData({ ...annonceurData, firstName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Nom *</label>
                  <Input
                    value={annonceurData.lastName}
                    onChange={(e) => setAnnonceurData({ ...annonceurData, lastName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Date de naissance</label>
                <Input
                  type="date"
                  value={annonceurData.dateOfBirth}
                  onChange={(e) => setAnnonceurData({ ...annonceurData, dateOfBirth: e.target.value })}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Nom de l'entreprise *</label>
                <Input
                  value={annonceurData.companyName}
                  onChange={(e) => setAnnonceurData({ ...annonceurData, companyName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Avatar (optionnel)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAnnonceurData({ ...annonceurData, avatar: e.target.files?.[0] || null })}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Justificatif (document PDF/image) *</label>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setAnnonceurData({ ...annonceurData, justificatif: e.target.files?.[0] || null })}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Document prouvant votre statut d'annonceur (KBIS, SIRET, etc.)
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'ADMIN' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-2">
                  Votre demande sera soumise pour validation. Vous resterez Missionnaire jusqu'à approbation.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Prénom *</label>
                  <Input
                    value={adminData.firstName}
                    onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Nom *</label>
                  <Input
                    value={adminData.lastName}
                    onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Téléphone *</label>
                <Input
                  type="tel"
                  value={adminData.phone}
                  onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedRole(null)}
              disabled={loading}
            >
              Retour
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

