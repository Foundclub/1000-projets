"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Briefcase, CheckCircle2 } from 'lucide-react';
import { getPublicUrl } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Organization = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  isCertified: boolean;
  ratingAvg: number;
  ratingCount: number;
  followersCount: number;
  missionsCount: number;
};

export function OrganizationCard({ organization }: { organization: Organization }) {
  const logoUrl = getPublicUrl(organization.logoUrl, 'organizations');
  const coverUrl = getPublicUrl(organization.coverUrl, 'organizations');

  return (
    <Link href={`/clubs/${organization.slug}`}>
      <Card className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer h-full flex flex-col">
        {/* Cover Image */}
        {coverUrl && (
          <div className="relative h-32 sm:h-40 overflow-hidden">
            <Image
              src={coverUrl}
              alt={organization.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
          {/* Header with Logo and Name */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {logoUrl ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-background shadow-lg">
                  <Image
                    src={logoUrl}
                    alt={organization.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background shadow-lg">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              )}
              {organization.isCertified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name and Badge */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                  {organization.name}
                </h3>
                {organization.isCertified && (
                  <Badge variant="default" className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                    Certifié
                  </Badge>
                )}
              </div>
              {organization.ratingCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">⭐ {organization.ratingAvg.toFixed(1)}</span>
                  <span>({organization.ratingCount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {organization.bio && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {organization.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{organization.followersCount}</span>
              <span>abonnés</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{organization.missionsCount}</span>
              <span>missions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


