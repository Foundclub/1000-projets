"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { getLevelNameFromXp } from '@/lib/xp';

type User = {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  xp: number;
  xpPro: number;
  xpSolid: number;
};

export default function XpBonusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    delta: 0,
    space: '' as 'PRO' | 'SOLIDAIRE' | '' | null,
    description: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch (e) {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!selectedUserId) {
        setError('Veuillez sélectionner un utilisateur');
        return;
      }

      const res = await fetch(`/api/admin/users/${selectedUserId}/xp-bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          delta: formData.delta,
          space: formData.space || null,
          description: formData.description || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(`✅ Bonus de ${formData.delta} XP attribué avec succès !`);
        setFormData({ delta: 0, space: '', description: '' });
        setSelectedUserId('');
        loadUsers(); // Recharger les utilisateurs pour mettre à jour les niveaux
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Erreur lors de l\'attribution du bonus');
      }
    } catch (e) {
      setError('Erreur lors de l\'attribution du bonus');
    } finally {
      setSaving(false);
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attribuer des bonus XP</h1>
          <p className="text-muted-foreground mt-2">
            Attribuez des bonus d'XP manuels aux utilisateurs
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Retour au dashboard</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Formulaire d'attribution</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Utilisateur *</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={saving}
                required
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map(user => {
                  const userName = user.displayName ||
                    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                    user.email;
                  return (
                    <option key={user.id} value={user.id}>
                      {userName} ({user.email}) - {getLevelNameFromXp(user.xp, true)} (Général), {getLevelNameFromXp(user.xpPro, false)} (Pro), {getLevelNameFromXp(user.xpSolid, false)} (Solidaire)
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedUser && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold">Niveaux actuels :</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Général :</span>
                    <span className="ml-2 font-semibold">{getLevelNameFromXp(selectedUser.xp, true)}</span>
                    <span className="ml-2 text-muted-foreground">({selectedUser.xp} XP)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pro :</span>
                    <span className="ml-2 font-semibold">{getLevelNameFromXp(selectedUser.xpPro, false)}</span>
                    <span className="ml-2 text-muted-foreground">({selectedUser.xpPro} XP)</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Solidaire :</span>
                    <span className="ml-2 font-semibold">{getLevelNameFromXp(selectedUser.xpSolid, false)}</span>
                    <span className="ml-2 text-muted-foreground">({selectedUser.xpSolid} XP)</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-2 block">Montant XP *</label>
              <Input
                type="number"
                value={formData.delta}
                onChange={(e) => setFormData({ ...formData, delta: parseInt(e.target.value) || 0 })}
                min={-10000}
                max={10000}
                disabled={saving}
                required
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Montant d'XP à attribuer (peut être négatif pour retirer de l'XP)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Espace</label>
              <select
                value={formData.space || ''}
                onChange={(e) => setFormData({ ...formData, space: e.target.value as 'PRO' | 'SOLIDAIRE' | '' | null })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={saving}
              >
                <option value="">Général</option>
                <option value="PRO">Pro</option>
                <option value="SOLIDAIRE">Solidaire</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Espace concerné par le bonus (Général par défaut)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Description (optionnel)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Raison du bonus (ex: Participation à un événement, correction d'un bug, etc.)"
                rows={3}
                disabled={saving}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/500 caractères
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Attribution...' : 'Attribuer le bonus'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

