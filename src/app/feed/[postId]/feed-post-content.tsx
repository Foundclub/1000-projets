"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FeedCard } from '@/components/feed/feed-card';
import { CommentList } from '@/components/feed/comment-list';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

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

type FeedComment = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    xp: number;
    xpPro: number;
    xpSolid: number;
  };
};

export function FeedPostPageContent({ params }: { params: Promise<{ postId: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ postId: string } | null>(null);
  const postId = resolvedParams?.postId;

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [commentCursor, setCommentCursor] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        setIsAuthenticated(true);
        setCurrentUserId(user.id);
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  }, []);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${postId}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Post introuvable');
      }
      const data = await res.json();
      setPost(data);
      setComments(data.comments || []);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement du post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setLoadingComments(true);
    try {
      const params = new URLSearchParams();
      if (commentCursor) params.set('cursor', commentCursor);
      params.set('limit', '20');

      const res = await fetch(`/api/feed/posts/${postId}/comments?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Erreur lors du chargement des commentaires');
      }

      const data = await res.json();
      setComments((prev) => [...prev, ...data.comments]);
      setCommentCursor(data.nextCursor);
      setHasMoreComments(data.hasMore);
    } catch (e: any) {
      console.error('Error loading comments:', e);
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    checkAuth();
    loadPost();
    // loadComments() est appelé séparément pour charger plus de commentaires
  }, [postId, checkAuth, loadPost]);

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
      
      if (post) {
        setPost({
          ...post,
          hasLiked: data.liked,
          likeCount: data.liked ? post.likeCount + 1 : post.likeCount - 1,
        });
      }
    } catch (e: any) {
      console.error('Error liking post:', e);
    }
  }

  async function handleCommentSubmit(text: string) {
    if (!isAuthenticated || !postId) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/feed/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de l\'envoi du commentaire');
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      
      if (post) {
        setPost({
          ...post,
          commentCount: post.commentCount + 1,
        });
      }
    } catch (e: any) {
      console.error('Error submitting comment:', e);
      throw e;
    }
  }

  function handleComment() {
    // Scroll vers les commentaires
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  if (loading || !postId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error || 'Post introuvable'}
        </div>
        <div className="mt-4">
          <Link href="/feed">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour au feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <Link href="/feed">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour au feed
          </Button>
        </Link>
      </div>

      <FeedCard
        post={post}
        onLike={handleLike}
        onComment={handleComment}
        isAuthenticated={isAuthenticated}
      />

      <div id="comments-section">
        <CommentList
          postId={postId}
          initialComments={comments}
          hasMore={hasMoreComments}
          onLoadMore={loadComments}
          onSubmit={handleCommentSubmit}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

