"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MissionStatus } from '@prisma/client';
import Link from 'next/link';
import { ClickableImage } from '@/components/clickable-image';
import { CloseMissionModal } from '@/components/close-mission-modal';
import { PublishModal } from '@/components/feed/publish-modal';
import { ReopenMissionButton } from '@/components/reopen-mission-button';
// Note: getPublicUrl est une fonction serveur, on l'utilisera côté client

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
  imageUrl: string | null;
  rewardText: string | null;
};

export default function MyMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadMissions();
  }, [activeTab, page]);

  async function loadMissions() {
    setLoading(true);
    try {
      const status = activeTab === 'open' ? MissionStatus.OPEN :
                     activeTab === 'closed' ? MissionStatus.CLOSED :
                     activeTab === 'archived' ? MissionStatus.ARCHIVED : null;
      
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/missions/my?${params}`, { credentials: 'include' });
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

  if (loading && missions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes missions</h1>
          <p className="text-muted-foreground mt-2">
            Gérez et suivez vos missions publiées
          </p>
        </div>
        <Link href="/admin/missions/new">
          <Button>Créer une mission</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open">Ouvertes</TabsTrigger>
          <TabsTrigger value="closed">Clôturées</TabsTrigger>
          <TabsTrigger value="archived">Archivées</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <MissionsList missions={missions} page={page} total={total} limit={limit} onPageChange={setPage} />
        </TabsContent>

        <TabsContent value="closed">
          <MissionsList missions={missions} page={page} total={total} limit={limit} onPageChange={setPage} />
        </TabsContent>

        <TabsContent value="archived">
          <MissionsList missions={missions} page={page} total={total} limit={limit} onPageChange={setPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MissionsList({
  missions,
  page,
  total,
  limit,
  onPageChange,
}: {
  missions: Mission[];
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [feedPostId, setFeedPostId] = useState<string | null>(null);
  const router = useRouter();

  const handleCloseClick = (mission: Mission) => {
    setSelectedMission(mission);
    setCloseModalOpen(true);
  };

  const handleCloseSuccess = (postId?: string) => {
    if (postId) {
      setFeedPostId(postId);
      // Petit délai pour s'assurer que le modal de clôture est bien fermé
      setTimeout(() => {
        setPublishModalOpen(true);
      }, 200);
    } else {
      // Recharger la page pour voir la mission clôturée
      router.refresh();
      window.location.reload();
    }
  };

  const handlePublishSuccess = () => {
    router.refresh();
    window.location.reload();
  };
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
            {missions.map(mission => {
              // Convertir le chemin de fichier en URL publique Supabase
              const supabaseUrl = typeof window !== 'undefined' 
                ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL 
                : null;
              const imageUrl = mission.imageUrl 
                ? (mission.imageUrl.startsWith('http://') || mission.imageUrl.startsWith('https://')
                  ? mission.imageUrl
                  : supabaseUrl 
                    ? `${supabaseUrl}/storage/v1/object/public/missions/${mission.imageUrl}`
                    : null)
                : null;
              return (
                <div key={mission.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{mission.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        mission.status === MissionStatus.OPEN ? 'bg-green-100 text-green-800' :
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
                    {imageUrl && (
                      <ClickableImage
                        src={imageUrl}
                        alt={mission.title}
                        containerClassName="w-full overflow-hidden rounded-lg mb-2"
                      >
                        <div className="w-full aspect-video overflow-hidden rounded-lg mb-2 relative group bg-muted">
                          <img 
                            src={imageUrl} 
                            alt={mission.title} 
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity duration-300">
                              🔍 Cliquer pour agrandir
                            </span>
                          </div>
                        </div>
                      </ClickableImage>
                    )}
                    {mission.rewardText && (
                      <p className="text-sm text-muted-foreground mb-1">
                        🎁 Récompense: {mission.rewardText}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {mission.slotsTaken}/{mission.slotsMax} slots • Créée le {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/missions/${mission.id}`}>
                      <Button size="sm" variant="outline">
                        Voir
                      </Button>
                    </Link>
                    <Link href={`/admin/missions/${mission.id}/applications`}>
                      <Button size="sm" variant="outline">
                        💬 Candidatures
                      </Button>
                    </Link>
                    <Link href={`/admin/missions/${mission.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Modifier
                      </Button>
                    </Link>
                    {mission.status === MissionStatus.OPEN && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseClick(mission)}
                      >
                        Clôturer
                      </Button>
                    )}
                    {mission.status === MissionStatus.CLOSED && mission.slotsTaken < mission.slotsMax && (
                      <ReopenMissionButton
                        missionId={mission.id}
                        missionTitle={mission.title}
                        missionStatus={mission.status}
                        slotsTaken={mission.slotsTaken}
                        slotsMax={mission.slotsMax}
                      />
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.')) {
                          return;
                        }
                        try {
                          const res = await fetch(`/api/missions/${mission.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          if (res.ok) {
                            // Recharger les missions
                            window.location.reload();
                          } else {
                            const data = await res.json().catch(() => ({}));
                            alert(data.error || 'Erreur lors de la suppression');
                          }
                        } catch (e) {
                          alert('Erreur lors de la suppression');
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              );
            })}
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
      
      {selectedMission && (
        <>
          <CloseMissionModal
            open={closeModalOpen}
            onOpenChange={setCloseModalOpen}
            missionId={selectedMission.id}
            missionTitle={selectedMission.title}
            onCloseSuccess={handleCloseSuccess}
          />
          {feedPostId && selectedMission && (
            <PublishModal
              open={publishModalOpen}
              onOpenChange={setPublishModalOpen}
              postId={feedPostId}
              missionTitle={selectedMission.title}
              space={selectedMission.space as 'PRO' | 'SOLIDAIRE'}
              onPublished={handlePublishSuccess}
            />
          )}
        </>
      )}
    </Card>
  );
}

