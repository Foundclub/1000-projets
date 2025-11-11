"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabaseBrowser } from '@/lib/supabase';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';
import { Avatar } from '@/components/avatar';
import { RoleChangeRequest } from '@/components/role-change-request';
import { ArrowLeft } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    dateOfBirth: '',
    avatar: null as File | null,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            displayName: data.displayName || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            companyName: data.companyName || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            avatar: null,
          });
        } else if (res.status === 401) {
          router.push('/login');
          return;
        } else {
          const errorData = await res.json().catch(() => ({}));
          setError(errorData.error || 'Erreur lors du chargement du profil');
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
      const supabase = supabaseBrowser();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Vous devez être connecté');
        return;
      }

      let avatarUrl = user?.avatar || '';
      
      // Upload avatar if changed
      if (formData.avatar) {
        const avatarExt = formData.avatar.name.split('.').pop();
        // Le chemin ne doit pas inclure le nom du bucket
        const avatarPath = `${authUser.id}/${Date.now()}.${avatarExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, formData.avatar, { upsert: true });
        
        if (uploadError) {
          console.error('[Profile] Avatar upload error:', uploadError);
          setError(`Erreur lors de l'upload de l'avatar: ${uploadError.message}`);
          return;
        }
        
        const { data: avatarData } = await supabase.storage
          .from('avatars')
          .createSignedUrl(avatarPath, 365 * 24 * 60 * 60); // 1 year
        avatarUrl = avatarData?.signedUrl || '';
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: formData.displayName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          companyName: formData.companyName,
          dateOfBirth: formData.dateOfBirth || null,
          avatar: avatarUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      router.push('/profile');
      router.refresh();
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

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="text-center py-12 text-muted-foreground">
          {error ? 'Erreur lors du chargement du profil' : 'Vous devez être connecté pour voir votre profil.'}
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthCallbackHandler />
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Modifier mon profil</h1>
        </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Email</label>
          <Input value={user.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié</p>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Nom d'affichage</label>
          <Input
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Votre nom d'affichage"
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Prénom</label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={saving}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Nom</label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Téléphone</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Date de naissance</label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Nom de l'entreprise</label>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Avatar</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, avatar: e.target.files?.[0] || null })}
            disabled={saving}
          />
          <div className="mt-2">
            <Avatar
              src={user.avatar}
              alt="Avatar"
              name={user.displayName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined)}
              email={user.email}
              size="lg"
              clickable={true}
              showModal={true}
            />
          </div>
        </div>

            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div>
                <p className="text-sm font-semibold mb-2">Privilèges</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
                {(user as any).activeRole && (user as any).activeRole !== user.role && (
                  <p className="text-xs text-blue-600 mt-1">
                    📱 Mode actif : {(user as any).activeRole}
                  </p>
                )}
                {user.annonceurRequestStatus === 'PENDING' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⏳ Demande Annonceur en attente de validation
                  </p>
                )}
                {user.adminRequestStatus === 'PENDING' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⏳ Demande Admin en attente de validation
                  </p>
                )}
                {user.annonceurRequestStatus === 'APPROVED' && user.role === 'ANNONCEUR' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Votre demande Annonceur a été approuvée
                  </p>
                )}
                {user.adminRequestStatus === 'APPROVED' && user.role === 'ADMIN' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Votre demande Admin a été approuvée
                  </p>
                )}
                {user.annonceurRequestStatus === 'REJECTED' && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ Votre demande Annonceur a été refusée
                  </p>
                )}
                {user.adminRequestStatus === 'REJECTED' && (
                  <p className="text-xs text-red-600 mt-1">
                    ❌ Votre demande Admin a été refusée
                  </p>
                )}
              </div>
          
          {/* Section demande de changement de rôle */}
          <RoleChangeRequest 
            user={user} 
            onSuccess={() => {
              router.refresh();
              window.location.reload();
            }}
          />
          
          {/* Lien vers édition profil annonceur si l'utilisateur est annonceur */}
          {user.role === 'ANNONCEUR' && (
            <div className="mt-4">
              <Link href="/profile/annonceur">
                <Button variant="outline" className="w-full">
                  ✏️ Modifier mon profil annonceur
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Gérez votre bio, activités et site web pour votre profil public
              </p>
            </div>
          )}

          {/* Lien vers historique XP */}
          <div className="mt-4">
            <Link href="/profile/xp-history">
              <Button variant="outline" className="w-full">
                📊 Historique des gains d'XP
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">
              Consultez tous vos gains d'XP et leur provenance
            </p>
          </div>
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
        </div>
      </form>
      </div>
    </>
  );
}

