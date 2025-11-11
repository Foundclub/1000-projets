"use client";
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/avatar';
import { StarRating } from '@/components/star-rating';

interface ClubCardProps {
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
    };
    followersCount: number;
    missionsCount: number;
  };
}

export function ClubCard({ club }: ClubCardProps) {
  const ownerName = club.owner.displayName ||
    (club.owner.firstName && club.owner.lastName ? `${club.owner.firstName} ${club.owner.lastName}` : null) ||
    club.owner.email;

  return (
    <Link href={`/clubs/${club.slug}`} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        {club.coverUrl && (
          <div className="w-full h-32 overflow-hidden rounded-t-lg">
            <img
              src={club.coverUrl}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                  {club.name}
                </h3>
                <p className="text-xs text-muted-foreground">Par {ownerName}</p>
              </div>
            </div>
            {club.isCertified && (
              <span className="px-2 py-1 text-xs rounded-full font-medium bg-pro-100 text-pro-700">
                ✓ Certifié
              </span>
            )}
          </div>
          {club.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{club.bio}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <StarRating mode="read" rating={{ avg: club.ratingAvg, count: club.ratingCount }} />
              <span>({club.ratingCount})</span>
            </div>
            <span>{club.followersCount} followers</span>
            <span>{club.missionsCount} missions</span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}


