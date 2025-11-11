"use client";
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/avatar';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UserLevelBadge } from '@/components/user-level-badge';
import { ProfileRedirect } from '@/components/profile-redirect';

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

interface CommentListProps {
  postId: string;
  initialComments: FeedComment[];
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onSubmit: (text: string) => Promise<void>;
  isAuthenticated: boolean;
  currentUserId?: string;
}

// Composant pour formater le temps et éviter les erreurs d'hydratation
function CommentTime({ createdAt }: { createdAt: string }) {
  const [timeAgo, setTimeAgo] = useState('');
  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(createdAt), { 
      addSuffix: true, 
      locale: fr 
    }));
  }, [createdAt]);
  return <span className="text-xs text-muted-foreground">{timeAgo || '...'}</span>;
}

export function CommentList({
  postId,
  initialComments,
  hasMore,
  onLoadMore,
  onSubmit,
  isAuthenticated,
  currentUserId,
}: CommentListProps) {
  const [comments, setComments] = useState<FeedComment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || !isAuthenticated) return;
    
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      await onLoadMore();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">Commentaires ({comments.length})</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun commentaire pour l'instant. Soyez le premier !
            </p>
          ) : (
            comments.map((comment) => {
              const authorName = comment.user.displayName || 
                (comment.user.firstName && comment.user.lastName 
                  ? `${comment.user.firstName} ${comment.user.lastName}` 
                  : 'Utilisateur');
              const isOwn = currentUserId === comment.userId;

              return (
                <div key={comment.id} className="flex gap-3">
                  <ProfileRedirect userId={comment.userId}>
                    <Avatar
                      src={comment.user.avatar}
                      alt={authorName}
                      name={authorName}
                      size="sm"
                      className="ring-2 ring-background cursor-pointer"
                    />
                  </ProfileRedirect>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <ProfileRedirect userId={comment.userId}>
                        <span className={cn(
                          "text-sm font-medium cursor-pointer hover:text-primary",
                          isOwn && "text-primary"
                        )}>
                          {authorName}
                        </span>
                      </ProfileRedirect>
                      <UserLevelBadge
                        xp={comment.user.xp}
                        xpPro={comment.user.xpPro}
                        xpSolid={comment.user.xpSolid}
                        space="GENERAL"
                        size="sm"
                        showLabel={true}
                      />
                      <CommentTime createdAt={comment.createdAt} />
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              );
            })
          )}
          
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Voir plus'
              )}
            </Button>
          )}
        </div>

        {isAuthenticated ? (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un commentaire (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              rows={2}
              className="resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                size="sm"
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            <Link href="/login" className="text-primary hover:underline">
              Connectez-vous
            </Link>
            {' '}pour commenter
          </p>
        )}
      </CardContent>
    </Card>
  );
}

