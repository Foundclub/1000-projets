"use client";
import { FavoriteAnnonceurButton } from './favorite-annonceur-button';
import { MissionCard } from './mission-card';
import { StarRating } from './star-rating';
import { Avatar } from './avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPublicUrl } from '@/lib/supabase';
import Link from 'next/link';
import { use } from 'react';

interface AnnonceurProfileProps {
  annonceur: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isCertifiedAnnonceur: boolean;
    ratingAvg: number;
    ratingCount: number;
    bio: string | null;
    activities: string | null;
    website: string | null;
    companyName: string | null;
    createdAt: Date;
    isFavorited: boolean;
    isOwner?: boolean;
    missions: Array<{
      id: string;
      title: string;
      space: 'PRO' | 'SOLIDAIRE';
      description: string;
      slotsTaken: number;
      slotsMax: number;
      imageUrl: string | null;
      rewardText: string | null;
      createdAt: Date;
      organization: {
        id: string;
        slug: string;
        name: string;
        logoUrl: string | null;
        isCertified: boolean;
      } | null;
    }>;
  };
}

export function AnnonceurProfile({ annonceur }: AnnonceurProfileProps) {
  const name = annonceur.displayName ||
    (annonceur.firstName && annonceur.lastName ? `${annonceur.firstName} ${annonceur.lastName}` : null) ||
    annonceur.email;

  const avatarUrl = getPublicUrl(annonceur.avatar, 'avatars');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar
              src={avatarUrl}
              alt={name || ''}
              name={name || undefined}
              email={annonceur.email}
              size="xl"
              clickable={true}
              showModal={true}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{name}</h1>
                {annonceur.isCertifiedAnnonceur && (
                  <span className="px-2 py-1 bg-pro-100 text-pro-700 text-xs font-semibold rounded">
                    ✓ Certifié
                  </span>
                )}
              </div>
              {annonceur.companyName && (
                <p className="text-lg text-muted-foreground mb-2">{annonceur.companyName}</p>
              )}
              {annonceur.ratingCount > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <StarRating mode="read" rating={{ avg: annonceur.ratingAvg, count: annonceur.ratingCount }} />
                  <span className="text-sm text-muted-foreground">
                    {annonceur.ratingAvg.toFixed(1)} ({annonceur.ratingCount} avis)
                  </span>
                </div>
              )}
              {annonceur.website && (
                <a
                  href={annonceur.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-pro-600 hover:underline"
                >
                  {annonceur.website}
                </a>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {annonceur.isOwner ? (
                <Link href="/profile/annonceur">
                  <Button variant="outline">
                    ✏️ Modifier mon profil
                  </Button>
                </Link>
              ) : (
                <FavoriteAnnonceurButton
                  annonceurId={annonceur.id}
                  initialFavorited={annonceur.isFavorited}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {annonceur.bio && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">À propos</h2>
              <p className="text-muted-foreground whitespace-pre-line">{annonceur.bio}</p>
            </div>
          )}
          {annonceur.activities && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Activités</h2>
              <p className="text-muted-foreground whitespace-pre-line">{annonceur.activities}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Missions ({annonceur.missions.length})</h2>
        {annonceur.missions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonceur.missions.map((mission) => {
              // Convertir le chemin d'image en URL publique Supabase si nécessaire
              const imageUrl = mission.imageUrl 
                ? getPublicUrl(mission.imageUrl, 'missions')
                : null;
              
              return (
                <MissionCard
                  key={mission.id}
                  mission={{
                    id: mission.id,
                    title: mission.title,
                    space: mission.space,
                    description: mission.description,
                    criteria: '',
                    slotsTaken: mission.slotsTaken,
                    slotsMax: mission.slotsMax,
                    slaDecisionH: 48,
                    ownerId: annonceur.id,
                    imageUrl: imageUrl,
                    rewardText: mission.rewardText,
                  }}
                  organization={mission.organization ? {
                    id: mission.organization.id,
                    slug: mission.organization.slug,
                    name: mission.organization.name,
                    logoUrl: mission.organization.logoUrl,
                    isCertified: mission.organization.isCertified,
                  } : null}
                  owner={{
                    id: annonceur.id,
                    displayName: annonceur.displayName,
                    firstName: annonceur.firstName,
                    lastName: annonceur.lastName,
                    avatar: annonceur.avatar,
                    isCertifiedAnnonceur: annonceur.isCertifiedAnnonceur,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune mission disponible</p>
        )}
      </div>
    </div>
  );
}

