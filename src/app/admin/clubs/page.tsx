"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Club = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  isCertified: boolean;
  ratingAvg: number;
  ratingCount: number;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  };
  followersCount: number;
  missionsCount: number;
  createdAt: string;
};

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [certified, setCertified] = useState<string>('');

  useEffect(() => {
    loadClubs();
  }, [search, certified]);

  async function loadClubs() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (certified === 'true') params.set('certified', 'true');
      if (certified === 'false') params.set('certified', 'false');
      params.set('limit', '100');

      const res = await fetch(`/api/clubs?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des clubs');
      }
    } catch (e) {
      setError('Erreur lors du chargement des clubs');
    } finally {
      setLoading(false);
    }
  }

  async function toggleCertify(clubId: string, currentCertified: boolean) {
    try {
      const res = await fetch(`/api/admin/clubs/${clubId}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isCertified: !currentCertified }),
      });
      if (res.ok) {
        await loadClubs();
        alert(currentCertified ? '✅ Club non certifié' : '✅ Club certifié');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestion des Clubs</h1>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Filtres</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Recherche</label>
              <Input
                type="text"
                placeholder="Nom du club..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Certification</label>
              <select
                value={certified}
                onChange={(e) => setCertified(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous</option>
                <option value="true">Certifiés uniquement</option>
                <option value="false">Non certifiés uniquement</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clubs List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Clubs ({clubs.length})</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : clubs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun club trouvé</p>
          ) : (
            <div className="space-y-3">
              {clubs.map(club => (
                <div key={club.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{club.name}</h3>
                      <span className="text-xs text-muted-foreground">({club.slug})</span>
                      {club.isCertified && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          ✓ Certifié
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Par {club.owner.displayName || 
                        (club.owner.firstName && club.owner.lastName ? `${club.owner.firstName} ${club.owner.lastName}` : null) || 
                        club.owner.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {club.followersCount} followers • {club.missionsCount} missions • 
                      Note: {club.ratingAvg.toFixed(1)} ({club.ratingCount} avis) • 
                      Créé le {new Date(club.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={club.isCertified ? 'default' : 'outline'}
                      onClick={() => toggleCertify(club.id, club.isCertified)}
                    >
                      {club.isCertified ? '✓ Certifié' : 'Certifier'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/clubs/${club.slug}`)}
                    >
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


