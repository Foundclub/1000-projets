"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeedCard } from '@/components/feed/feed-card';
import { FeedFilters } from '@/components/feed/feed-filters';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type SpaceFilter = 'ALL' | 'PRO' | 'SOLIDAIRE';

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

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [space, setSpace] = useState<SpaceFilter>('ALL');
  const [onlyFollowed, setOnlyFollowed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      setIsAuthenticated(res.ok);
    } catch (e) {
      setIsAuthenticated(false);
    }
  }, []);

  const loadPosts = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true);
      setPosts([]);
      setNextCursor(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (space !== 'ALL') params.set('space', space);
      if (onlyFollowed && isAuthenticated) params.set('onlyFollowed', 'true');
      if (nextCursor && !reset) params.set('cursor', nextCursor);
      params.set('limit', '20');

      const res = await fetch(`/api/feed?${params}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Erreur lors du chargement du feed');
      }

      const data = await res.json();
      
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement du feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [space, onlyFollowed, isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  async function handleLike(postId: string) {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/feed/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Erreur lors du like');
      }

      const data = await res.json();
      
      // Mettre à jour le post dans la liste
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: data.liked,
              likeCount: data.liked ? post.likeCount + 1 : post.likeCount - 1,
            };
          }
          return post;
        })
      );
    } catch (e: any) {
      console.error('Error liking post:', e);
    }
  }

  function handleComment(postId: string) {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/feed/${postId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">À la une</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez les missions récemment accomplies
        </p>
      </div>

      <FeedFilters
        space={space}
        onlyFollowed={onlyFollowed}
        onSpaceChange={setSpace}
        onOnlyFollowedChange={setOnlyFollowed}
        isAuthenticated={isAuthenticated}
      />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun post pour le moment. Les posts apparaîtront ici après l'acceptation de soumissions.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => loadPosts(false)}
                disabled={loadingMore}
                variant="outline"
                className="gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Charger plus'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

