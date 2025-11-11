"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Flag, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { shareFeedPost } from '@/lib/share';
import { getPublicUrl } from '@/lib/supabase';
import Image from 'next/image';
import { UserLevelBadge } from '@/components/user-level-badge';
import { ProfileRedirect } from '@/components/profile-redirect';

type FeedPost = {
  id: string;
  missionId: string;
  authorId: string;
  space: 'PRO' | 'SOLIDAIRE';
  text: string | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasLiked: boolean;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    xp: number;
    xpPro: number;
    xpSolid: number;
  };
  mission: {
    id: string;
    title: string;
    space: 'PRO' | 'SOLIDAIRE';
    imageUrl: string | null;
    owner: {
      id: string;
      displayName: string | null;
      isCertifiedAnnonceur: boolean;
    };
    organization: {
      id: string;
      name: string;
      logoUrl: string | null;
      isCertified: boolean;
    } | null;
  };
};

interface FeedCardProps {
  post: FeedPost;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string) => void;
  isAuthenticated: boolean;
}

export function FeedCard({ post, onLike, onComment, isAuthenticated }: FeedCardProps) {
  const [liking, setLiking] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated || liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareFeedPost(post.id, post.mission.title, post.text || undefined);
    } finally {
      setSharing(false);
    }
  };

  const authorName = post.author.displayName || 
    (post.author.firstName && post.author.lastName ? `${post.author.firstName} ${post.author.lastName}` : 'Utilisateur');
  
  // Utiliser useState pour éviter les erreurs d'hydratation avec les dates
  const [timeAgo, setTimeAgo] = useState('');
  
  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(post.createdAt), { 
      addSuffix: true, 
      locale: fr 
    }));
  }, [post.createdAt]);

  const isCertified = post.mission.owner.isCertifiedAnnonceur || post.mission.organization?.isCertified;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <ProfileRedirect userId={post.authorId}>
            <Avatar
              src={post.author.avatar}
              alt={authorName}
              name={authorName}
              size="md"
              className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200 cursor-pointer"
            />
          </ProfileRedirect>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ProfileRedirect userId={post.authorId}>
                <span className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer">
                  {authorName}
                </span>
              </ProfileRedirect>
              <UserLevelBadge
                xp={post.author.xp}
                xpPro={post.author.xpPro}
                xpSolid={post.author.xpSolid}
                space={post.space}
                size="sm"
                showLabel={true}
              />
              {isCertified && (
                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                  À la une
                </Badge>
              )}
              <Badge 
                variant={post.space === 'PRO' ? 'default' : 'secondary'}
                className="text-xs px-1.5 py-0.5"
              >
                {post.space}
              </Badge>
            </div>
            <Link href={`/missions/${post.missionId}`}>
              <p className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-1">
                {post.mission.title}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo || '...'}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {post.text && (
          <p className="text-sm whitespace-pre-wrap">{post.text}</p>
        )}
        
        {/* Afficher les médias uploadés ou l'image de la mission */}
        {post.mediaUrls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.mediaUrls.map((url, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        ) : post.mission.imageUrl ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <Image
              src={getPublicUrl(post.mission.imageUrl, 'missions') || ''}
              alt={post.mission.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 100vw"
            />
          </div>
        ) : null}
        
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!isAuthenticated || liking}
            className={cn(
              "gap-2 transition-all duration-200",
              post.hasLiked && "text-red-500 hover:text-red-600",
              !isAuthenticated && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 transition-all duration-200",
              post.hasLiked && "fill-current"
            )} />
            <span className="text-sm">{post.likeCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment(post.id)}
            disabled={!isAuthenticated}
            className={cn(
              "gap-2 transition-all duration-200",
              !isAuthenticated && "opacity-50 cursor-not-allowed"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.commentCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="gap-2 transition-all duration-200"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">{post.shareCount}</span>
          </Button>
          
          <div className="flex-1" />
          
          <Link href={`/missions/${post.missionId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Voir la mission</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

