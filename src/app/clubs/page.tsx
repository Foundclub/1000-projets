"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ClubCard } from '@/components/club-card';

type Club = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  website: string | null;
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
};

export default function ClubsPage() {
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
      params.set('limit', '50');

      const res = await fetch(`/api/clubs?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs);
      } else {
        setError('Erreur lors du chargement des clubs');
      }
    } catch (e) {
      setError('Erreur lors du chargement des clubs');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Annuaire des Clubs</h1>
        <p className="text-muted-foreground">
          Découvrez les clubs et organisations qui proposent des missions.
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Rechercher un club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={certified}
          onChange={(e) => setCertified(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Tous les clubs</option>
          <option value="true">Clubs certifiés uniquement</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun club trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}


