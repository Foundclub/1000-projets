"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type Thread = {
  id: string;
  otherUser: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
    isCertifiedAnnonceur: boolean;
  } | null;
  mission: {
    id: string;
    title: string;
    space: string;
    imageUrl: string | null;
  } | null;
  lastMessage: {
    id: string;
    type: string;
    content: string;
    createdAt: string;
    authorId: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadThreads();
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUserId(userData.id || null);
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    }
  }

  async function loadThreads() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/threads', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des conversations');
      }
    } catch (e) {
      setError('Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  function getDisplayName(user: Thread['otherUser']): string {
    if (!user) return 'Utilisateur inconnu';
    if (user.displayName) return user.displayName;
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email.split('@')[0];
  }

  function getMessagePreview(message: Thread['lastMessage']): string {
    if (!message) return 'Aucun message';
    
    if (message.type === 'TEXT') {
      return message.content.length > 50 
        ? message.content.substring(0, 50) + '...'
        : message.content;
    } else if (message.type === 'REWARD') {
      return '🎁 Récompense délivrée';
    } else if (message.type === 'REWARD_MEDIA') {
      return '📷 Média de récompense';
    }
    
    return 'Message';
  }

  function getSpaceColor(space: string | null): string {
    switch (space) {
      case 'PRO':
        return 'bg-pro-500/10 text-pro-600 border-pro-500/20';
      case 'SOLIDAIRE':
        return 'bg-solidaire-500/10 text-solidaire-600 border-solidaire-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/missions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Mes messages
            </h1>
            <p className="text-muted-foreground mt-2">
              Toutes vos conversations ({threads.length})
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          </CardContent>
        </Card>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-lg font-medium mb-2">Aucune conversation</p>
              <p className="text-sm">
                Vous n'avez pas encore de conversations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const displayName = getDisplayName(thread.otherUser);
            const messagePreview = getMessagePreview(thread.lastMessage);
            const isLastMessageFromMe = thread.lastMessage?.authorId === currentUserId;
            const spaceColor = getSpaceColor(thread.mission?.space || null);

            return (
              <Link key={thread.id} href={`/threads/${thread.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {thread.otherUser?.avatar ? (
                          <Image
                            src={thread.otherUser.avatar}
                            alt={displayName}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        {thread.otherUser?.isCertifiedAnnonceur && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">✓</span>
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {displayName}
                            </h3>
                            {thread.mission && (
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0",
                                spaceColor
                              )}>
                                {thread.mission.space}
                              </span>
                            )}
                          </div>
                          {thread.lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(thread.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        {thread.mission && (
                          <p className="text-xs text-muted-foreground mb-1 truncate">
                            Mission: {thread.mission.title}
                          </p>
                        )}

                        {thread.lastMessage && (
                          <p className={cn(
                            "text-sm truncate",
                            !isLastMessageFromMe
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}>
                            {isLastMessageFromMe && 'Vous: '}
                            {messagePreview}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

