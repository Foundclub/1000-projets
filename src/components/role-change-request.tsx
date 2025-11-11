"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseBrowser } from '@/lib/supabase';

interface RoleChangeRequestProps {
  user: any;
  onSuccess: () => void;
}

export function RoleChangeRequest({ user, onSuccess }: RoleChangeRequestProps) {
  const [showAnnonceurForm, setShowAnnonceurForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showMissionnaireConfirm, setShowMissionnaireConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data for Annonceur
  const [annonceurData, setAnnonceurData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    companyName: user.companyName || '',
    avatar: null as File | null,
    justificatif: null as File | null,
  });
  
  // Form data for Admin
  const [adminData, setAdminData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  });

  async function handleAnnonceurSubmit(e: React.FormEvent) {
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

      // Upload files first
      let avatarUrl = user.avatar || '';
      let justificatifUrl = '';
      
      if (annonceurData.avatar) {
        const avatarExt = annonceurData.avatar.name.split('.').pop();
        const avatarPath = `${authUser.id}/${Date.now()}.${avatarExt}`;
        const { error: avatarError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, annonceurData.avatar, { upsert: true });
        
        if (avatarError) {
          setError(`Erreur lors de l'upload de l'avatar: ${avatarError.message}`);
          return;
        }
        
        const { data: avatarData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 365 * 24 * 60 * 60);
        avatarUrl = avatarData?.signedUrl || '';
      }
      
      if (annonceurData.justificatif) {
        const justifExt = annonceurData.justificatif.name.split('.').pop();
        const justifPath = `${authUser.id}/${Date.now()}.${justifExt}`;
        const { error: justifError } = await supabase.storage
          .from('justificatifs')
          .upload(justifPath, annonceurData.justificatif, { upsert: true });
        
        if (justifError) {
          setError(`Erreur lors de l'upload du justificatif: ${justifError.message}`);
          return;
        }
        
        const { data: justifData } = await supabase.storage
          .from('justificatifs')
          .createSignedUrl(justifPath, 365 * 24 * 60 * 60);
        justificatifUrl = justifData?.signedUrl || '';
      } else if (!user.justificatifUrl) {
        setError('Le justificatif est requis pour devenir Annonceur');
        return;
      } else {
        justificatifUrl = user.justificatifUrl;
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
          avatarUrl: avatarUrl || undefined,
          justificatifUrl: justificatifUrl || user.justificatifUrl,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la soumission');
        return;
      }
      
      alert('Demande Annonceur soumise avec succès !');
      setShowAnnonceurForm(false);
      onSuccess();
    } catch (e) {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
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
      
      alert('Demande Admin soumise avec succès !');
      setShowAdminForm(false);
      onSuccess();
    } catch (e) {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  }

  async function handleMissionnaireSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Utiliser la nouvelle route pour changer le rôle actif (sans perdre les privilèges)
      const res = await fetch('/api/user/active-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          activeRole: 'MISSIONNAIRE',
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la soumission');
        return;
      }
      
      alert('Mode Missionnaire activé avec succès ! Vos privilèges sont conservés.');
      onSuccess();
    } catch (e) {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  }

  // Récupérer le rôle actif (ou role par défaut)
  const activeRole = (user as any).activeRole || user.role;
  
  // Les MISSIONNAIRE peuvent demander Annonceur ou Admin
  const canRequestAnnonceur = user.role === 'MISSIONNAIRE' && user.annonceurRequestStatus !== 'PENDING';
  const canRequestAdmin = user.role === 'MISSIONNAIRE' && user.adminRequestStatus !== 'PENDING';
  
  // Les ANNONCEUR peuvent demander Admin
  const canRequestAdminFromAnnonceur = user.role === 'ANNONCEUR' && user.adminRequestStatus !== 'PENDING';
  
  // Les ADMIN ou ANNONCEUR peuvent activer le mode Missionnaire (sans perdre les privilèges)
  const canRequestMissionnaire = (user.role === 'ANNONCEUR' || user.role === 'ADMIN') && activeRole !== 'MISSIONNAIRE';
  // Les ADMIN ou ANNONCEUR peuvent activer leur rôle privilégié s'ils sont en mode Missionnaire
  const canActivateAnnonceur = user.role === 'ANNONCEUR' && activeRole === 'MISSIONNAIRE';
  const canActivateAdmin = user.role === 'ADMIN' && activeRole !== 'ADMIN';

  return (
    <div className="border-t pt-3 mt-3">
      <p className="text-sm font-semibold mb-3">Demander un changement de rôle</p>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {!showAnnonceurForm && !showAdminForm && !showMissionnaireConfirm && (
        <div className="space-y-2">
          {!canRequestAnnonceur && !canRequestAdmin && !canRequestAdminFromAnnonceur && !canRequestMissionnaire && !canActivateAnnonceur && !canActivateAdmin ? (
            <p className="text-xs text-muted-foreground">
              Aucune action disponible pour le moment.
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {canRequestAnnonceur && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnonceurForm(true)}
                >
                  Devenir Annonceur
                </Button>
              )}
              {(canRequestAdmin || canRequestAdminFromAnnonceur) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminForm(true)}
                >
                  Devenir Admin
                </Button>
              )}
              {canActivateAnnonceur && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/user/active-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ activeRole: 'ANNONCEUR' }),
                      });
                      if (res.ok) {
                        alert('Mode Annonceur activé !');
                        onSuccess();
                      }
                    } catch (e) {
                      setError('Erreur lors de l\'activation');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Activer mode Annonceur
                </Button>
              )}
              {canActivateAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/user/active-role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ activeRole: 'ADMIN' }),
                      });
                      if (res.ok) {
                        alert('Mode Admin activé !');
                        onSuccess();
                      }
                    } catch (e) {
                      setError('Erreur lors de l\'activation');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  Activer mode Admin
                </Button>
              )}
              {canRequestMissionnaire && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMissionnaireConfirm(true)}
                >
                  Activer mode Missionnaire
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {showAnnonceurForm && (
        <form onSubmit={handleAnnonceurSubmit} className="space-y-3 mt-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              Votre demande sera soumise pour validation. Vous resterez Missionnaire jusqu'à approbation.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">Prénom *</label>
              <Input
                value={annonceurData.firstName}
                onChange={(e) => setAnnonceurData({ ...annonceurData, firstName: e.target.value })}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Nom *</label>
              <Input
                value={annonceurData.lastName}
                onChange={(e) => setAnnonceurData({ ...annonceurData, lastName: e.target.value })}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold mb-1 block">Date de naissance</label>
            <Input
              type="date"
              value={annonceurData.dateOfBirth}
              onChange={(e) => setAnnonceurData({ ...annonceurData, dateOfBirth: e.target.value })}
              disabled={loading}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold mb-1 block">Nom de l'entreprise *</label>
            <Input
              value={annonceurData.companyName}
              onChange={(e) => setAnnonceurData({ ...annonceurData, companyName: e.target.value })}
              required
              disabled={loading}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold mb-1 block">Avatar (optionnel)</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setAnnonceurData({ ...annonceurData, avatar: e.target.files?.[0] || null })}
              disabled={loading}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold mb-1 block">Justificatif (PDF/image) *</label>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setAnnonceurData({ ...annonceurData, justificatif: e.target.files?.[0] || null })}
              required={!user.justificatifUrl}
              disabled={loading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Document prouvant votre statut d'annonceur (KBIS, SIRET, etc.)
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAnnonceurForm(false);
                setError('');
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              {loading ? 'Envoi...' : 'Soumettre la demande'}
            </Button>
          </div>
        </form>
      )}

      {showAdminForm && (
        <form onSubmit={handleAdminSubmit} className="space-y-3 mt-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              Votre demande sera soumise pour validation. Vous resterez Missionnaire jusqu'à approbation.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">Prénom *</label>
              <Input
                value={adminData.firstName}
                onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Nom *</label>
              <Input
                value={adminData.lastName}
                onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold mb-1 block">Téléphone *</label>
            <Input
              type="tel"
              value={adminData.phone}
              onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
              required
              disabled={loading}
              className="text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAdminForm(false);
                setError('');
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              {loading ? 'Envoi...' : 'Soumettre la demande'}
            </Button>
          </div>
        </form>
      )}

      {showMissionnaireConfirm && (
        <div className="space-y-3 mt-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              ✅ Vous allez passer en mode Missionnaire. Vos privilèges ({user.role}) seront conservés et vous pourrez revenir à tout moment.
            </p>
          </div>
          
          <form onSubmit={handleMissionnaireSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMissionnaireConfirm(false);
                  setError('');
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="flex-1">
                {loading ? 'Traitement...' : 'Activer le mode Missionnaire'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

