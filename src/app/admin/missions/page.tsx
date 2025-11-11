"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MissionStatus } from '@prisma/client';
import Link from 'next/link';

type Mission = {
  id: string;
  title: string;
  space: string;
  status: MissionStatus;
  isFeatured: boolean;
  featuredRank: number | null;
  isHidden: boolean;
  slotsMax: number;
  slotsTaken: number;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
};

export default function AdminMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadMissions();
  }, [activeTab, searchQuery, page]);

  async function loadMissions() {
    setLoading(true);
    try {
      const status = activeTab === 'pending' ? MissionStatus.PENDING :
                     activeTab === 'open' ? MissionStatus.OPEN :
                     activeTab === 'closed' ? MissionStatus.CLOSED :
                     activeTab === 'archived' ? MissionStatus.ARCHIVED : null;
      
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (searchQuery) params.set('q', searchQuery);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/admin/missions?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.items);
        setTotal(data.total);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des missions');
      }
    } catch (e) {
      setError('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  }

  async function approveMission(missionId: string) {
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await loadMissions();
      } else {
        alert('Erreur lors de l\'approbation');
      }
    } catch (e) {
      alert('Erreur lors de l\'approbation');
    }
  }

  async function rejectMission(missionId: string) {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette mission ?')) return;
    
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await loadMissions();
      } else {
        alert('Erreur lors du rejet');
      }
    } catch (e) {
      alert('Erreur lors du rejet');
    }
  }

  async function toggleFeature(missionId: string, currentStatus: boolean, currentRank: number | null) {
    const newStatus = !currentStatus;
    const newRank = newStatus ? (currentRank || 1) : null;
    
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: newStatus, rank: newRank }),
      });
      if (res.ok) {
        await loadMissions();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  }

  async function toggleHide(missionId: string, currentHidden: boolean) {
    const newHidden = !currentHidden;
    
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ hidden: newHidden }),
      });
      if (res.ok) {
        await loadMissions();
        alert(newHidden ? '✅ Mission masquée' : '✅ Mission visible');
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    }
  }

  async function deleteMission(missionId: string) {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer définitivement cette mission ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await loadMissions();
        alert('✅ Mission supprimée');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      alert('Erreur lors de la suppression');
    }
  }

  if (loading && missions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  const featuredMissions = missions.filter(m => m.isFeatured);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des missions</h1>
        <Link href="/admin/missions/new">
          <Button>Créer une mission</Button>
        </Link>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <Input
            type="text"
            placeholder="Rechercher par titre, description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">À valider</TabsTrigger>
          <TabsTrigger value="open">Ouvertes</TabsTrigger>
          <TabsTrigger value="closed">Clôturées</TabsTrigger>
          <TabsTrigger value="archived">Archivées</TabsTrigger>
          <TabsTrigger value="featured">À la Une</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <MissionsList
            missions={missions}
            onApprove={approveMission}
            onReject={rejectMission}
            onFeature={toggleFeature}
            onHide={toggleHide}
            onDelete={deleteMission}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="open">
          <MissionsList
            missions={missions}
            onApprove={approveMission}
            onReject={rejectMission}
            onFeature={toggleFeature}
            onHide={toggleHide}
            onDelete={deleteMission}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="closed">
          <MissionsList
            missions={missions}
            onApprove={approveMission}
            onReject={rejectMission}
            onFeature={toggleFeature}
            onHide={toggleHide}
            onDelete={deleteMission}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="archived">
          <MissionsList
            missions={missions}
            onApprove={approveMission}
            onReject={rejectMission}
            onFeature={toggleFeature}
            onHide={toggleHide}
            onDelete={deleteMission}
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="featured">
          <MissionsList
            missions={featuredMissions}
            onApprove={approveMission}
            onReject={rejectMission}
            onFeature={toggleFeature}
            onHide={toggleHide}
            onDelete={deleteMission}
            page={1}
            total={featuredMissions.length}
            limit={limit}
            onPageChange={setPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MissionsList({
  missions,
  onApprove,
  onReject,
  onFeature,
  onHide,
  onDelete,
  page,
  total,
  limit,
  onPageChange,
}: {
  missions: Mission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFeature: (id: string, currentStatus: boolean, currentRank: number | null) => void;
  onHide: (id: string, currentHidden: boolean) => void;
  onDelete: (id: string) => void;
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Missions ({total})</h2>
      </CardHeader>
      <CardContent>
        {missions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune mission trouvée</p>
        ) : (
          <div className="space-y-3">
            {missions.map(mission => (
              <div key={mission.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{mission.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      mission.status === MissionStatus.OPEN ? 'bg-green-100 text-green-800' :
                      mission.status === MissionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                      mission.status === MissionStatus.CLOSED ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {mission.status}
                    </span>
                    {mission.isFeatured && (
                      <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                        ⭐ À la Une
                      </span>
                    )}
                    {mission.isHidden && (
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                        👁️ Masquée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Par {mission.owner.firstName} {mission.owner.lastName} ({mission.owner.email})
                    {mission.owner.companyName && ` • ${mission.owner.companyName}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mission.slotsTaken}/{mission.slotsMax} slots • Créée le {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {mission.status === MissionStatus.PENDING && (
                    <>
                      <Button size="sm" onClick={() => onApprove(mission.id)}>
                        Approuver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onReject(mission.id)}>
                        Rejeter
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant={mission.isFeatured ? 'default' : 'outline'}
                    onClick={() => onFeature(mission.id, mission.isFeatured, mission.featuredRank)}
                  >
                    {mission.isFeatured ? '⭐ À la Une' : 'Mettre à la Une'}
                  </Button>
                  <Button
                    size="sm"
                    variant={mission.isHidden ? 'destructive' : 'outline'}
                    onClick={() => onHide(mission.id, mission.isHidden)}
                  >
                    {mission.isHidden ? '👁️ Masquée' : '👁️ Masquer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(mission.id)}
                  >
                    🗑️ Supprimer
                  </Button>
                  <Link href={`/admin/missions/${mission.id}/edit`}>
                    <Button size="sm" variant="outline">
                      Editer
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} sur {Math.ceil(total / limit)}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

