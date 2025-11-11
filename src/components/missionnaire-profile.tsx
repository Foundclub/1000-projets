"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar';
import { UserLevelBadge } from '@/components/user-level-badge';
import { FollowUserButton } from '@/components/follow-user-button';
import { FeedCard } from '@/components/feed/feed-card';
import { MissionCard } from '@/components/mission-card';
import { getPublicUrl } from '@/lib/supabase';
import { MessageCircle, Trophy, TrendingUp, FileText, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MissionnaireProfileProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    role: string;
    xp: number;
    xpPro: number;
    xpSolid: number;
    bio: string | null;
    ratingAvg: number;
    ratingCount: number;
    createdAt: Date;
    isFollowing: boolean;
    isOwner: boolean;
    canMessage: boolean;
    existingThreadId: string | null;
    stats: {
      missionsCompleted: number;
      submissionsAccepted: number;
      feedPostsCount: number;
    };
    levels: {
      general: { level: number; name: string; badge: string; progress: number };
      pro: { level: number; name: string; badge: string; progress: number };
      solid: { level: number; name: string; badge: string; progress: number };
    };
  };
}

export function MissionnaireProfile({ user: initialUser }: MissionnaireProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [missions, setMissions] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const name = user.displayName ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    user.email;

  const avatarUrl = getPublicUrl(user.avatar, 'avatars');

  // Charger les missions complétées
  useEffect(() => {
    async function loadMissions() {
      try {
        const res = await fetch(`/api/users/${user.id}/completed-missions`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions || []);
        }
      } catch (e) {
        console.error('Error loading missions:', e);
      } finally {
        setLoadingMissions(false);
      }
    }
    loadMissions();
  }, [user.id]);

  // Charger les posts du feed
  useEffect(() => {
    async function loadFeedPosts() {
      try {
        const res = await fetch(`/api/users/${user.id}/feed-posts?limit=10`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setFeedPosts(data.posts || []);
        }
      } catch (e) {
        console.error('Error loading feed posts:', e);
      } finally {
        setLoadingFeed(false);
      }
    }
    loadFeedPosts();
  }, [user.id]);

  async function handleSendMessage() {
    if (sendingMessage || !user.canMessage) return;

    setSendingMessage(true);
    try {
      // Si un thread existe déjà, rediriger vers lui
      if (user.existingThreadId) {
        router.push(`/threads/${user.existingThreadId}`);
        return;
      }

      // Sinon, créer un nouveau thread
      const res = await fetch(`/api/users/${user.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/threads/${data.threadId}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Erreur lors de la création du message');
      }
    } catch (e) {
      console.error('Error sending message:', e);
      alert('Erreur lors de la création du message');
    } finally {
      setSendingMessage(false);
    }
  }

  function handleFollowChange(following: boolean) {
    setUser({ ...user, isFollowing: following });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar
              src={avatarUrl}
              alt={name || ''}
              name={name || undefined}
              email={user.email}
              size="xl"
              clickable={true}
              showModal={true}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold">{name}</h1>
                <UserLevelBadge
                  xp={user.xp}
                  xpPro={user.xpPro}
                  xpSolid={user.xpSolid}
                  space="GENERAL"
                  size="md"
                  showLabel={true}
                />
              </div>
              {user.ratingCount > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">
                    ⭐ {user.ratingAvg.toFixed(1)} ({user.ratingCount} avis)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Membre depuis {new Date(user.createdAt).getFullYear()}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {user.isOwner ? (
                <Link href="/profile/edit">
                  <Button variant="outline">
                    ✏️ Modifier mon profil
                  </Button>
                </Link>
              ) : (
                <>
                  <FollowUserButton
                    userId={user.id}
                    initialFollowing={user.isFollowing}
                    onFollowChange={handleFollowChange}
                  />
                  {user.canMessage && (
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage}
                      variant="outline"
                    >
                      {sendingMessage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Envoyer un message
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user.bio && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">À propos</h2>
              <p className="text-muted-foreground whitespace-pre-line">{user.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{user.stats.missionsCompleted}</div>
              <div className="text-sm text-muted-foreground">Missions complétées</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{user.stats.submissionsAccepted}</div>
              <div className="text-sm text-muted-foreground">Soumissions acceptées</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{user.xp.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">XP Général</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{user.feedPostsCount}</div>
              <div className="text-sm text-muted-foreground">Posts publiés</div>
            </div>
          </div>

          {/* Niveaux */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Niveaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={user.levels.general.badge}
                    alt={user.levels.general.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <div>
                    <div className="font-semibold">{user.levels.general.name}</div>
                    <div className="text-sm text-muted-foreground">Niveau {user.levels.general.level}</div>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${user.levels.general.progress * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={user.levels.pro.badge}
                    alt={user.levels.pro.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <div>
                    <div className="font-semibold">{user.levels.pro.name}</div>
                    <div className="text-sm text-muted-foreground">Niveau {user.levels.pro.level} Pro</div>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-pro-500 h-2 rounded-full transition-all"
                    style={{ width: `${user.levels.pro.progress * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={user.levels.solid.badge}
                    alt={user.levels.solid.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <div>
                    <div className="font-semibold">{user.levels.solid.name}</div>
                    <div className="text-sm text-muted-foreground">Niveau {user.levels.solid.level} Solidaire</div>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-solid-500 h-2 rounded-full transition-all"
                    style={{ width: `${user.levels.solid.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions complétées */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Missions complétées ({missions.length})</h2>
        {loadingMissions ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : missions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune mission complétée</p>
        )}
      </div>

      {/* Posts du feed */}
      {feedPosts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Posts publiés ({user.stats.feedPostsCount})</h2>
          {loadingFeed ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {feedPosts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onLike={async (postId: string) => {
                    // Recharger les posts après un like
                    const res = await fetch(`/api/users/${user.id}/feed-posts?limit=10`, {
                      credentials: 'include',
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setFeedPosts(data.posts || []);
                    }
                  }}
                  onComment={(postId: string) => {
                    // Rediriger vers la page du post pour commenter
                    router.push(`/feed/${postId}`);
                  }}
                  isAuthenticated={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

