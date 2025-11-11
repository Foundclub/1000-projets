"use client";
import { FollowButton } from './follow-button';
import { MissionCard } from './mission-card';
import { StarRating } from './star-rating';
import { Avatar } from './avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPublicUrl } from '@/lib/supabase';

interface ClubDetailProps {
  club: {
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
      avatar: string | null;
      isCertifiedAnnonceur: boolean;
      ratingAvg: number;
      ratingCount: number;
    };
    missions: Array<{
      id: string;
      title: string;
      space: 'PRO' | 'SOLIDAIRE';
      description: string;
      criteria: string;
      slotsTaken: number;
      slotsMax: number;
      imageUrl: string | null;
      rewardText: string | null;
      isFeatured: boolean;
      createdAt: Date;
      owner: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
      };
      submissionsCount: number;
    }>;
    followersCount: number;
    missionsCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  isFollowing: boolean;
  isAuthenticated: boolean;
}

export function ClubDetail({ club, isFollowing, isAuthenticated }: ClubDetailProps) {
  const ownerName = club.owner.displayName ||
    (club.owner.firstName && club.owner.lastName ? `${club.owner.firstName} ${club.owner.lastName}` : null) ||
    club.owner.email;

  const logoUrl = getPublicUrl(club.logoUrl, 'missions');
  const coverUrl = getPublicUrl(club.coverUrl, 'missions');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cover Image */}
      {coverUrl && (
        <div className="w-full h-64 overflow-hidden rounded-lg">
          <img
            src={coverUrl}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Club Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={club.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-background"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background">
              <span className="text-4xl">🏢</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{club.name}</h1>
              {club.isCertified && (
                <span className="px-2 py-1 text-xs rounded-full font-medium bg-pro-100 text-pro-700">
                  ✓ Certifié
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <StarRating mode="read" rating={{ avg: club.ratingAvg, count: club.ratingCount }} />
                <span>({club.ratingCount} avis)</span>
              </div>
              <span>{club.followersCount} followers</span>
              <span>{club.missionsCount} missions</span>
            </div>
            {club.bio && (
              <p className="text-muted-foreground mb-2">{club.bio}</p>
            )}
            {club.website && (
              <a
                href={club.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {club.website}
              </a>
            )}
          </div>
        </div>
        {isAuthenticated && (
          <FollowButton
            organizationSlug={club.slug}
            initialFollowing={isFollowing}
          />
        )}
      </div>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Propriétaire</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar
              src={club.owner.avatar}
              alt={ownerName}
              name={ownerName}
              email={club.owner.email}
              size="md"
              clickable={true}
              showModal={true}
            />
            <div>
              <p className="font-semibold">{ownerName}</p>
              {club.owner.isCertifiedAnnonceur && (
                <span className="text-xs text-pro-600">✓ Annonceur Certifié</span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <StarRating mode="read" rating={{ avg: club.owner.ratingAvg, count: club.owner.ratingCount }} />
                <span>({club.owner.ratingCount} avis)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Missions ({club.missions.length})</h2>
        {club.missions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune mission disponible</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {club.missions.map(mission => {
              const imageUrl = getPublicUrl(mission.imageUrl, 'missions');
              return (
                <MissionCard
                  key={mission.id}
                  mission={{
                    id: mission.id,
                    title: mission.title,
                    space: mission.space,
                    description: mission.description,
                    criteria: mission.criteria,
                    slotsTaken: mission.slotsTaken,
                    slotsMax: mission.slotsMax,
                    slaDecisionH: 48,
                    ownerId: mission.owner.id,
                    imageUrl,
                    rewardText: mission.rewardText,
                  }}
                  featured={mission.isFeatured}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

