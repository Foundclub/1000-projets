"use client";
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicUrl } from '@/lib/supabase';
import { MissionCard } from '@/components/mission-card';
import { OrganizationCard } from '@/components/organization-card';
import { AnnonceurCard } from '@/components/annonceur-card';
import { MissionsSearchFilters } from '@/components/missions-search-filters';
import { MissionSkeleton } from '@/components/mission-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorBubbles } from '@/components/color-bubbles';
import { InfoButton } from '@/components/info-button';

type Mission = {
  id: string;
  title: string;
  space: 'PRO' | 'SOLIDAIRE';
  description: string;
  criteria: string;
  slotsTaken: number;
  slotsMax: number;
  slaDecisionH: number;
  ownerId: string;
  imageUrl: string | null;
  rewardText: string | null;
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
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    avatar: string | null;
    isCertifiedAnnonceur: boolean;
    ratingAvg: number;
    ratingCount: number;
  };
  isFeatured: boolean;
};

function MissionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [featuredMissions, setFeaturedMissions] = useState<Mission[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [annonceurs, setAnnonceurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const space = (searchParams.get('space') || 'PRO') as 'PRO' | 'SOLIDAIRE';
  const tab = searchParams.get('tab') || '';
  const query = searchParams.get('query') || '';
  const certified = searchParams.get('certified') || '';
  const available = searchParams.get('available') || '';

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('space', space);
      if (tab === 'mes-annonceurs-favoris') params.set('tab', 'mes-annonceurs-favoris');
      if (query) params.set('query', query);
      if (certified === 'true') params.set('certified', 'true');
      if (available === 'true') params.set('available', 'true');
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      // Charger les missions
      const res = await fetch(`/api/missions?${params}`, { credentials: 'include' });
      let loadedMissions: Mission[] = [];
      if (res.ok) {
        const data = await res.json();
        loadedMissions = data.missions || [];
        setMissions(loadedMissions);
        setTotal(data.total || 0);
        
        // Load featured missions separately (only for PRO/SOLIDAIRE tabs, not "Mes annonceurs favoris")
        if (tab !== 'mes-annonceurs-favoris') {
          const featuredParams = new URLSearchParams();
          featuredParams.set('space', space);
          if (query) featuredParams.set('query', query);
          if (certified === 'true') featuredParams.set('certified', 'true');
          featuredParams.set('page', '1');
          featuredParams.set('limit', '5');
          
          const featuredRes = await fetch(`/api/missions?${featuredParams}`, { credentials: 'include' });
          if (featuredRes.ok) {
            const featuredData = await featuredRes.json();
            setFeaturedMissions((featuredData.missions || []).filter((m: Mission) => m.isFeatured));
          }
        } else {
          setFeaturedMissions([]);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.details || errorData.error || 'Erreur lors du chargement des missions');
        console.error('Error loading missions:', errorData);
      }

      // Charger les organisations si une recherche est active
      if (query && query.trim()) {
        const orgParams = new URLSearchParams();
        orgParams.set('q', query);
        if (certified === 'true') orgParams.set('certified', 'true');
        orgParams.set('limit', '10'); // Augmenter la limite pour avoir plus de résultats
        orgParams.set('offset', '0');

        const orgRes = await fetch(`/api/clubs?${orgParams}`, { credentials: 'include' });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          let foundOrgs = orgData.clubs || [];
          
          // Si des missions ont été trouvées avec des organisations, ajouter ces organisations aussi
          // (même si elles ne correspondent pas exactement à la recherche)
          if (loadedMissions.length > 0) {
            // Extraire les organisations des missions trouvées
            const missionOrgs = loadedMissions
              .map((m: Mission) => m.organization)
              .filter((org): org is NonNullable<typeof org> => !!org && !!org.id);
            
            // Créer une Map pour éviter les doublons
            const uniqueOrgs = new Map();
            foundOrgs.forEach((org: any) => uniqueOrgs.set(org.id, org));
            
            // Ajouter les organisations des missions qui ne sont pas déjà dans les résultats
            missionOrgs.forEach(org => {
              if (!uniqueOrgs.has(org.id)) {
                // Compter les missions de cette organisation dans les résultats
                const orgMissionsCount = loadedMissions.filter((m: Mission) => m.organizationId === org.id).length;
                uniqueOrgs.set(org.id, {
                  id: org.id,
                  slug: org.slug,
                  name: org.name,
                  logoUrl: org.logoUrl,
                  coverUrl: null, // Pas disponible dans les missions
                  bio: null, // Pas disponible dans les missions
                  website: null, // Pas disponible dans les missions
                  isCertified: org.isCertified,
                  ratingAvg: 0, // Pas disponible dans les missions
                  ratingCount: 0, // Pas disponible dans les missions
                  followersCount: 0, // Pas disponible dans les missions
                  missionsCount: orgMissionsCount,
                });
              }
            });
            foundOrgs = Array.from(uniqueOrgs.values());
          }
          
          setOrganizations(foundOrgs);
        }

        // Charger les annonceurs si une recherche est active
        const annonceurParams = new URLSearchParams();
        annonceurParams.set('q', query);
        if (certified === 'true') annonceurParams.set('certified', 'true');
        annonceurParams.set('limit', '10');
        annonceurParams.set('offset', '0');

        const annonceurRes = await fetch(`/api/annonceurs?${annonceurParams}`, { credentials: 'include' });
        if (annonceurRes.ok) {
          const annonceurData = await annonceurRes.json();
          let foundAnnonceurs = annonceurData.annonceurs || [];
          
          // Si des missions ont été trouvées avec des annonceurs, ajouter ces annonceurs aussi
          // (même si elles ne correspondent pas exactement à la recherche)
          if (loadedMissions.length > 0) {
            // Extraire les annonceurs des missions trouvées
            const missionOwners = loadedMissions
              .map((m: Mission) => m.owner)
              .filter((owner): owner is NonNullable<typeof owner> => !!owner && !!owner.id);
            
            // Créer une Map pour éviter les doublons
            const uniqueAnnonceurs = new Map();
            foundAnnonceurs.forEach((a: any) => uniqueAnnonceurs.set(a.id, a));
            
            // Ajouter les annonceurs des missions qui ne sont pas déjà dans les résultats
            missionOwners.forEach(owner => {
              if (!uniqueAnnonceurs.has(owner.id)) {
                // Compter les missions de cet annonceur dans les résultats
                const ownerMissionsCount = loadedMissions.filter((m: Mission) => m.ownerId === owner.id).length;
                uniqueAnnonceurs.set(owner.id, {
                  id: owner.id,
                  displayName: owner.displayName,
                  firstName: owner.firstName,
                  lastName: owner.lastName,
                  email: owner.email,
                  avatar: owner.avatar,
                  isCertifiedAnnonceur: owner.isCertifiedAnnonceur,
                  ratingAvg: owner.ratingAvg || 0,
                  ratingCount: owner.ratingCount || 0,
                  bio: null, // Pas disponible dans les missions
                  companyName: null, // Pas disponible dans les missions
                  website: null, // Pas disponible dans les missions
                  missionsCount: ownerMissionsCount,
                });
              }
            });
            foundAnnonceurs = Array.from(uniqueAnnonceurs.values());
          }
          
          setAnnonceurs(foundAnnonceurs);
        }
      } else {
        setOrganizations([]);
        setAnnonceurs([]);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement des missions');
      console.error('Error loading missions:', e);
    } finally {
      setLoading(false);
    }
  }, [space, tab, query, certified, available, page]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  function handleTabChange(newTab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === 'mes-annonceurs-favoris') {
      params.set('tab', 'mes-annonceurs-favoris');
    } else {
      params.delete('tab');
      params.set('space', newTab);
    }
    params.delete('page'); // Reset to page 1
    router.push(`/missions?${params}`);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/missions?${params}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Déterminer l'espace actif pour l'ambiance
  const activeSpace = tab === 'mes-annonceurs-favoris' ? null : space;
  
  // Classes pour l'ambiance selon l'espace
  const getAmbianceClasses = () => {
    if (!activeSpace) {
      return 'bg-gradient-to-b from-indigo-100 to-zinc-100';
    }
    if (activeSpace === 'PRO') {
      return 'bg-gradient-to-b from-pro-50/30 via-indigo-50/40 to-zinc-100';
    }
    return 'bg-gradient-to-b from-solidaire-50/30 via-indigo-50/40 to-zinc-100';
  };

  // Déterminer la couleur des bulles
  const bubbleColor = activeSpace === 'PRO' ? 'pro' : activeSpace === 'SOLIDAIRE' ? 'solidaire' : null;

  return (
    <>
      <ColorBubbles color={bubbleColor} />
      <div className={`min-h-screen -mx-4 -my-6 px-4 py-6 transition-all duration-700 relative ${getAmbianceClasses()}`}>
        <div className="space-y-4 relative z-10">
        <MissionsSearchFilters />
      
      {/* Tabs */}
      <div className="p-3 sm:p-4 md:p-5 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card via-card to-card/95 shadow-xl shadow-black/10 ring-2 ring-black/5 relative overflow-hidden max-w-full">
        {/* Dégradé en vagues en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 pointer-events-none">
          <svg viewBox="0 0 1200 50" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="tabsWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,50 C300,20 600,30 900,25 C1050,27 1150,23 1200,25 L1200,50 L0,50 Z" fill="url(#tabsWaveGradient)" />
          </svg>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <TabButton
              onClick={() => handleTabChange('PRO')}
              active={tab !== 'mes-clubs' && space === 'PRO'}
              variant="PRO"
            >
              PRO
            </TabButton>
            <InfoButton 
              content="Les missions PRO sont des missions professionnelles rémunérées. Elles permettent de gagner de l'expérience dans l'espace PRO et offrent généralement des récompenses monétaires ou matérielles."
              side="bottom"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <TabButton
              onClick={() => handleTabChange('SOLIDAIRE')}
              active={tab !== 'mes-clubs' && space === 'SOLIDAIRE'}
              variant="SOLIDAIRE"
            >
              SOLIDAIRE
            </TabButton>
            <InfoButton 
              content="Les missions SOLIDAIRE sont des missions à but non lucratif. Elles permettent de gagner de l'expérience dans l'espace SOLIDAIRE et contribuent à des causes sociales ou environnementales."
              side="bottom"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <TabButton
              onClick={() => handleTabChange('mes-annonceurs-favoris')}
              active={tab === 'mes-annonceurs-favoris'}
              variant="default"
            >
              Mes annonceurs favoris
            </TabButton>
            <InfoButton 
              content="Affiche uniquement les missions publiées par vos annonceurs favoris. Ajoutez des annonceurs à vos favoris depuis leur profil pour les retrouver facilement."
              side="bottom"
              size="sm"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-5 rounded-xl border-2 border-destructive/50 bg-gradient-to-br from-destructive/10 via-destructive/5 to-destructive/10 shadow-xl shadow-destructive/20 ring-2 ring-destructive/20">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      {/* Afficher les annonceurs si une recherche est active */}
      {!loading && query && annonceurs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-foreground">Annonceurs</h2>
            <span className="text-sm text-muted-foreground">({annonceurs.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {annonceurs.map((annonceur) => (
              <AnnonceurCard key={annonceur.id} annonceur={annonceur} />
            ))}
          </div>
        </div>
      )}

      {/* Séparateur si on a des annonceurs et d'autres résultats */}
      {!loading && query && annonceurs.length > 0 && (organizations.length > 0 || missions.length > 0) && (
        <div className="border-t-2 border-border/50 my-6"></div>
      )}

      {/* Afficher les organisations si une recherche est active */}
      {!loading && query && organizations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-bold text-foreground">Organisations</h2>
            <span className="text-sm text-muted-foreground">({organizations.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        </div>
      )}

      {/* Séparateur si on a à la fois des organisations et des missions */}
      {!loading && query && organizations.length > 0 && missions.length > 0 && (
        <div className="border-t-2 border-border/50 my-6"></div>
      )}

      {/* Titre pour les missions si une recherche est active */}
      {!loading && query && missions.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground">Missions</h2>
          <span className="text-sm text-muted-foreground">({total})</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MissionSkeleton key={i} />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card via-card to-card/95 shadow-xl shadow-black/10 ring-2 ring-black/5">
          <div className="text-6xl mb-6">📭</div>
          <p className="text-xl font-bold mb-3 text-foreground">Aucune mission disponible</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {tab === 'mes-annonceurs-favoris'
              ? "Vous n'avez aucun annonceur favori ou il n'y a pas de missions disponibles de vos annonceurs favoris."
              : `Il n'y a pas de missions ${space === 'PRO' ? 'PRO' : 'SOLIDAIRE'} ouvertes pour le moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Intégrer les missions featured dans la grille principale */}
          {featuredMissions.map(m => {
            const imageUrl = getPublicUrl(m.imageUrl, 'missions');
            return (
              <MissionCard
                key={m.id}
                mission={{
                  id: m.id,
                  title: m.title,
                  space: m.space,
                  description: m.description,
                  criteria: m.criteria,
                  slotsTaken: m.slotsTaken,
                  slotsMax: m.slotsMax,
                  slaDecisionH: m.slaDecisionH,
                  ownerId: m.ownerId,
                  imageUrl,
                  rewardText: m.rewardText,
                }}
                featured={true}
                organization={m.organization}
                owner={m.owner}
              />
            );
          })}
          {missions.map(m => {
            const imageUrl = getPublicUrl(m.imageUrl, 'missions');
            return (
              <MissionCard
                key={m.id}
                mission={{
                  id: m.id,
                  title: m.title,
                  space: m.space,
                  description: m.description,
                  criteria: m.criteria,
                  slotsTaken: m.slotsTaken,
                  slotsMax: m.slotsMax,
                  slaDecisionH: m.slaDecisionH,
                  ownerId: m.ownerId,
                  imageUrl,
                  rewardText: m.rewardText,
                }}
                featured={m.isFeatured}
                organization={m.organization}
                owner={m.owner}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="p-5 rounded-xl border-2 border-border/50 bg-gradient-to-br from-card via-card to-card/95 shadow-xl shadow-black/10 ring-2 ring-black/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-foreground">
              Page <span className="font-bold text-primary">{page}</span> sur <span className="font-bold text-primary">{Math.ceil(total / limit)}</span> 
              <span className="text-muted-foreground ml-2">({total} missions)</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] transition-all duration-200 border-2 border-border/50 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] transition-all duration-200 border-2 border-border/50 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </>
  );
}

export default function MissionsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-secondary animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MissionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <MissionsPageContent />
    </Suspense>
  );
}

function TabButton({
  onClick,
  active,
  children,
  variant,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  variant?: 'PRO' | 'SOLIDAIRE' | 'default';
}) {
  const getActiveClasses = () => {
    if (!active) {
      return 'bg-gradient-to-br from-background/90 via-background/80 to-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:from-accent/90 hover:via-accent/80 hover:to-accent/90 border-2 border-border/60 hover:border-border shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 ring-1 ring-black/5 hover:ring-2 hover:ring-black/10 transition-all duration-300';
    }
    
    if (variant === 'PRO') {
      return 'bg-gradient-to-br from-pro-500 via-pro-600 to-pro-500 text-white shadow-2xl shadow-pro-500/50 ring-4 ring-pro-400/40 border-2 border-pro-300/60 hover:shadow-3xl hover:shadow-pro-500/60 hover:ring-pro-300/50 hover:from-pro-400 hover:via-pro-500 hover:to-pro-400 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700';
    }
    
    if (variant === 'SOLIDAIRE') {
      return 'bg-gradient-to-br from-solidaire-500 via-solidaire-600 to-solidaire-500 text-white shadow-2xl shadow-solidaire-500/50 ring-4 ring-solidaire-400/40 border-2 border-solidaire-300/60 hover:shadow-3xl hover:shadow-solidaire-500/60 hover:ring-solidaire-300/50 hover:from-solidaire-400 hover:via-solidaire-500 hover:to-solidaire-400 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700';
    }
    
    return 'bg-gradient-to-br from-primary via-primary/90 to-primary text-primary-foreground shadow-2xl shadow-primary/50 ring-4 ring-primary/40 border-2 border-primary/60 hover:shadow-3xl hover:shadow-primary/60 hover:ring-primary/50 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700';
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 active:scale-[0.95] hover:scale-[1.05] whitespace-nowrap ${getActiveClasses()}`}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
