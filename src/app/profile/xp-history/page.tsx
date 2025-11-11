"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type XpEvent = {
  id: string;
  kind: string;
  delta: number;
  space: 'PRO' | 'SOLIDAIRE' | null;
  description: string | null;
  createdAt: string;
  mission: {
    id: string;
    title: string;
    space: 'PRO' | 'SOLIDAIRE';
  } | null;
};

function XpHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<XpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [kindFilter, setKindFilter] = useState(searchParams.get('kind') || '');
  const [spaceFilter, setSpaceFilter] = useState(searchParams.get('space') || '');
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [page, kindFilter, spaceFilter]);

  async function loadHistory() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (kindFilter) params.set('kind', kindFilter);
      if (spaceFilter) params.set('space', spaceFilter);

      const res = await fetch(`/api/user/xp-history?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement de l\'historique');
      }
    } catch (e) {
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newKind: string, newSpace: string) {
    setKindFilter(newKind);
    setSpaceFilter(newSpace);
    setPage(1);
    const params = new URLSearchParams();
    if (newKind) params.set('kind', newKind);
    if (newSpace) params.set('space', newSpace);
    router.push(`/profile/xp-history?${params}`);
  }

  function getKindLabel(kind: string): string {
    const labels: Record<string, string> = {
      MISSION_ACCEPTED: 'Mission acceptée',
      BONUS_MANUAL: 'Bonus manuel',
      BONUS_CLUB_FOLLOWED: 'Bonus club suivi',
    };
    return labels[kind] || kind;
  }

  function getSpaceLabel(space: 'PRO' | 'SOLIDAIRE' | null): string {
    if (space === 'PRO') return 'Pro';
    if (space === 'SOLIDAIRE') return 'Solidaire';
    return 'Général';
  }

  function getSpaceColor(space: 'PRO' | 'SOLIDAIRE' | null): string {
    if (space === 'PRO') return 'bg-pro-100 text-pro-700';
    if (space === 'SOLIDAIRE') return 'bg-solidaire-100 text-solidaire-700';
    return 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historique des gains d'XP</h1>
          <p className="text-muted-foreground mt-2">
            Consultez tous vos gains d'XP et leur provenance
          </p>
        </div>
        <Link href="/profile">
          <Button variant="outline">Retour au profil</Button>
        </Link>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Filtres</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Type</label>
              <select
                value={kindFilter}
                onChange={(e) => handleFilterChange(e.target.value, spaceFilter)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous les types</option>
                <option value="MISSION_ACCEPTED">Mission acceptée</option>
                <option value="BONUS_MANUAL">Bonus manuel</option>
                <option value="BONUS_CLUB_FOLLOWED">Bonus club suivi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Espace</label>
              <select
                value={spaceFilter}
                onChange={(e) => handleFilterChange(kindFilter, e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tous les espaces</option>
                <option value="GENERAL">Général</option>
                <option value="PRO">Pro</option>
                <option value="SOLIDAIRE">Solidaire</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">Chargement...</div>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-medium mb-2">Aucun événement XP</p>
              <p className="text-sm">
                Vous n'avez pas encore gagné d'XP. Commencez par accepter des missions !
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${getSpaceColor(event.space)}`}>
                          {getSpaceLabel(event.space)}
                        </span>
                        <span className="text-sm font-semibold">{getKindLabel(event.kind)}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      )}
                      {event.mission && (
                        <Link 
                          href={`/missions/${event.mission.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Mission: {event.mission.title}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(event.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${event.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {event.delta > 0 ? '+' : ''}{event.delta} XP
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} ({total} événements)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function XpHistoryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    }>
      <XpHistoryContent />
    </Suspense>
  );
}

