"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MissionCardRating } from '@/components/mission-card-rating';
import { ClickableImage } from './clickable-image';
import { InfoButton } from '@/components/info-button';
import { Users, Clock, Gift, User } from 'lucide-react';
import { getPublicUrl } from '@/lib/supabase';

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    space: 'PRO' | 'SOLIDAIRE';
    description: string;
    criteria: string;
    slotsTaken: number;
    slotsMax: number;
    slaDecisionH: number;
    ownerId: string;
    imageUrl?: string | null;
    rewardText?: string | null;
  };
  featured?: boolean;
  organization?: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    isCertified: boolean;
  } | null;
  owner?: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isCertifiedAnnonceur: boolean;
  } | null;
}

export function MissionCard({ mission, featured = false, organization, owner }: MissionCardProps) {
  const router = useRouter();

  // Obtenir le nom d'affichage de l'annonceur
  const ownerName = owner?.displayName || 
    (owner?.firstName || owner?.lastName 
      ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() 
      : 'Annonceur');
  
  // Obtenir l'URL de l'avatar
  const ownerAvatarUrl = owner?.avatar ? getPublicUrl(owner.avatar, 'avatars') : null;

  function handleCardClick(e: React.MouseEvent) {
    // Ne pas naviguer si on clique sur un lien ou un bouton
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return;
    }
    router.push(`/missions/${mission.id}`);
  }

  return (
    <div onClick={handleCardClick} className="block cursor-pointer">
      <Card className={`shadow-xl hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 cursor-pointer h-full border-l-4 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ring-2 ring-black/5 hover:ring-4 hover:ring-primary/20 ${
        featured 
          ? 'border-2 border-purple-300/50 border-l-purple-500 shadow-purple-500/20 hover:shadow-purple-500/30' 
          : mission.space === 'PRO' 
            ? 'border-l-pro-500 shadow-pro-500/15 hover:shadow-pro-500/25 ring-pro-200/20' 
            : 'border-l-solidaire-500 shadow-solidaire-500/15 hover:shadow-solidaire-500/25 ring-solidaire-200/20'
      }`}>
        {mission.imageUrl && (
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <ClickableImage
              src={mission.imageUrl}
              alt={mission.title}
              containerClassName="w-full overflow-hidden rounded-t-lg"
            >
              <div className="w-full aspect-video overflow-hidden rounded-t-lg relative group bg-muted">
                <img 
                  src={mission.imageUrl!} 
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
          </div>
        )}
        <CardHeader className="space-y-2 sm:space-y-3 bg-card p-3 sm:p-4 md:p-6">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg hover:text-primary transition-colors flex-1 min-w-0 break-words">
              {mission.title}
            </h3>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {featured && (
                <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-full font-bold bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 text-purple-800 shadow-lg shadow-purple-500/30 ring-2 ring-purple-300/30 hover:ring-purple-400/50 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 transition-all duration-300 border-2 border-purple-300/30 whitespace-nowrap">
                  ⭐ À la Une
                </span>
              )}
              {!featured && (
                <span className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-current/30 relative overflow-hidden whitespace-nowrap ${
                  mission.space === 'PRO' 
                    ? 'bg-gradient-to-br from-pro-100 via-pro-50 to-pro-100 text-pro-700 shadow-pro-500/30 ring-2 ring-pro-300/30 hover:ring-pro-400/50 hover:from-pro-200 hover:via-pro-100 hover:to-pro-200' 
                    : 'bg-gradient-to-br from-solidaire-100 via-solidaire-50 to-solidaire-100 text-solidaire-700 shadow-solidaire-500/30 ring-2 ring-solidaire-300/30 hover:ring-solidaire-400/50 hover:from-solidaire-200 hover:via-solidaire-100 hover:to-solidaire-200'
                }`}>
                  <span className="relative z-10">{mission.space}</span>
                </span>
              )}
              {organization && organization.isCertified && (
                <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-full font-bold bg-gradient-to-br from-pro-100 via-pro-50 to-pro-100 text-pro-700 shadow-lg shadow-pro-500/30 ring-2 ring-pro-300/30 hover:ring-pro-400/50 hover:from-pro-200 hover:via-pro-100 hover:to-pro-200 transition-all duration-300 border-2 border-pro-300/30 whitespace-nowrap">
                  ✓ Club Certifié
                </span>
              )}
            </div>
          </div>
          {organization && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>🏢 {organization.name}</span>
            </div>
          )}
          {/* Informations de l'annonceur */}
          {owner && (
            <Link 
              href={`/annonceurs/${owner.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
            >
              <div className="relative flex-shrink-0">
                {ownerAvatarUrl ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border/50 group-hover:border-primary transition-colors">
                    <Image
                      src={ownerAvatarUrl}
                      alt={ownerName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-border/50 group-hover:border-primary transition-colors">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                )}
                {owner.isCertifiedAnnonceur && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-background">
                    <span className="text-[6px] text-white font-bold">✓</span>
                  </div>
                )}
              </div>
              <span className="font-medium group-hover:text-primary transition-colors">{ownerName}</span>
            </Link>
          )}
          {mission.rewardText && (
            <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-50 border-2 border-yellow-300/60 rounded-lg shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-400/20 hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-300">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-yellow-900 flex items-center gap-1 sm:gap-1.5 min-w-0 break-words">
                  <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                  <span className="min-w-0">Récompense: {mission.rewardText}</span>
                </p>
                <InfoButton 
                  content="La récompense est ce que vous recevrez en complétant cette mission avec succès. Elle peut être monétaire, matérielle ou autre selon le type de mission."
                  side="top"
                  size="sm"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MissionCardRating ownerId={mission.ownerId} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-medium">{mission.slotsTaken}/{mission.slotsMax}</span>
              <InfoButton 
                content="Le nombre de slots indique combien de personnes peuvent postuler pour cette mission. Le premier nombre indique les places déjà prises, le second le nombre total de places disponibles."
                side="top"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{mission.slaDecisionH}h</span>
              <InfoButton 
                content="Le délai de décision indique le temps maximum que l'annonceur a pour examiner votre candidature ou votre soumission. Après ce délai, vous pouvez considérer que votre candidature n'a pas été retenue."
                side="top"
                size="sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative p-3 sm:p-4 md:p-6">
          {/* Dégradé en vagues en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 pointer-events-none opacity-50">
            <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id={`missionWaveGradient-${mission.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,30 C200,20 400,10 600,15 C800,12 1000,18 1200,15 L1200,30 L0,30 Z" fill={`url(#missionWaveGradient-${mission.id})`} />
            </svg>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 relative z-10 break-words">{mission.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

