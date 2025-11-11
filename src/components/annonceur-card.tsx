"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Star, CheckCircle2, Globe } from 'lucide-react';
import { getPublicUrl } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Annonceur = {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatar: string | null;
  isCertifiedAnnonceur: boolean;
  ratingAvg: number;
  ratingCount: number;
  bio: string | null;
  companyName: string | null;
  website: string | null;
  missionsCount: number;
};

export function AnnonceurCard({ annonceur }: { annonceur: Annonceur }) {
  const avatarUrl = annonceur.avatar ? getPublicUrl(annonceur.avatar, 'avatars') : null;
  
  const displayName = annonceur.displayName || 
    (annonceur.firstName || annonceur.lastName 
      ? `${annonceur.firstName || ''} ${annonceur.lastName || ''}`.trim() 
      : annonceur.email.split('@')[0]);

  return (
    <Link href={`/annonceurs/${annonceur.id}`}>
      <Card className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 cursor-pointer h-full flex flex-col">
        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
          {/* Header with Avatar and Name */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-background shadow-lg group-hover:border-primary transition-colors">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background shadow-lg group-hover:border-primary transition-colors">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
              )}
              {annonceur.isCertifiedAnnonceur && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </div>

            {/* Name and Badge */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                  {displayName}
                </h3>
                {annonceur.isCertifiedAnnonceur && (
                  <Badge variant="default" className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">
                    Certifié
                  </Badge>
                )}
              </div>
              {annonceur.companyName && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
                  {annonceur.companyName}
                </p>
              )}
              {annonceur.ratingCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{annonceur.ratingAvg.toFixed(1)}</span>
                  <span>({annonceur.ratingCount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {annonceur.bio && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {annonceur.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{annonceur.missionsCount}</span>
              <span>missions</span>
            </div>
            {annonceur.website && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Globe className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[100px]">Site web</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


