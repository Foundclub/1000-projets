"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MissionCard } from '@/components/mission-card';
import { getPublicUrl } from '@/lib/supabase';

type Application = {
  id: string;
  missionId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  mission: {
    id: string;
    title: string;
    description: string;
    criteria: string;
    space: 'PRO' | 'SOLIDAIRE';
    slotsTaken: number;
    slotsMax: number;
    slaDecisionH: number;
    imageUrl: string | null;
    rewardText: string | null;
    ownerId: string;
    organizationId: string | null;
    organization: {
      id: string;
      slug: string;
      name: string;
      logoUrl: string | null;
      isCertified: boolean;
    } | null;
    owner: {
      id: string;
      email: string;
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
      isCertifiedAnnonceur: boolean;
      ratingAvg: number;
      ratingCount: number;
    };
    isFeatured: boolean;
  };
  thread: {
    id: string;
  } | null;
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  async function loadApplications() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.set('status', activeTab.toUpperCase());
      }

      const res = await fetch(`/api/applications/my?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des candidatures');
      }
    } catch (e) {
      setError('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  }

  if (loading && applications.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 pb-24">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab.toUpperCase();
  });

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes candidatures</h1>
        <p className="text-muted-foreground mt-2">
          Suivez l'état de vos candidatures aux missions
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' 
            ? 'px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold whitespace-nowrap'
            : 'px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap'
          }
        >
          Toutes ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={activeTab === 'pending'
            ? 'px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold whitespace-nowrap'
            : 'px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap'
          }
        >
          En attente ({applications.filter(a => a.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={activeTab === 'accepted'
            ? 'px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold whitespace-nowrap'
            : 'px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap'
          }
        >
          Acceptées ({applications.filter(a => a.status === 'ACCEPTED').length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={activeTab === 'rejected'
            ? 'px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold whitespace-nowrap'
            : 'px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap'
          }
        >
          Refusées ({applications.filter(a => a.status === 'REJECTED').length})
        </button>
      </div>

      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-muted-foreground">
              {activeTab === 'all' 
                ? "Vous n'avez pas encore candidaté à une mission."
                : `Aucune candidature ${activeTab === 'pending' ? 'en attente' : activeTab === 'accepted' ? 'acceptée' : 'refusée'}.`
              }
            </p>
            <Link href="/missions" className="mt-4 inline-block">
              <Button>Découvrir les missions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((application) => {
            const imageUrl = application.mission.imageUrl
              ? getPublicUrl(application.mission.imageUrl, 'missions')
              : null;

            return (
              <div key={application.id} className="relative">
                <MissionCard
                  mission={{
                    ...application.mission,
                    imageUrl,
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    application.status === 'PENDING' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : application.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {application.status === 'PENDING' ? '⏳ En attente' :
                     application.status === 'ACCEPTED' ? '✅ Acceptée' :
                     '❌ Refusée'}
                  </span>
                </div>
                {application.thread && (
                  <div className="absolute bottom-2 right-2">
                    <Link href={`/threads/${application.thread.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        💬 Chat
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

