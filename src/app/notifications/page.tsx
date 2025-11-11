"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadNotifications();
  }, [offset]);

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('offset', offset.toString());
      params.set('limit', limit.toString());
      
      const res = await fetch(`/api/notifications?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (offset === 0) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        setTotal(data.total || 0);
        setHasMore((data.notifications || []).length === limit);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } catch (e) {
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }

  function getNotificationMessage(notification: Notification): string {
    switch (notification.type) {
      case 'NEW_MISSION':
        return `Nouvelle mission: ${notification.payload.missionTitle || 'Mission'}`;
      case 'NEW_APPLICATION':
        const applicantName = notification.payload.applicantName || 'Un missionnaire';
        const missionTitle = notification.payload.missionTitle || 'votre mission';
        return `${applicantName} a postulé à "${missionTitle}"`;
      case 'APPLICATION_ACCEPTED':
        const missionTitleAccepted = notification.payload.missionTitle || 'la mission';
        return `Votre candidature pour "${missionTitleAccepted}" a été acceptée`;
      case 'APPLICATION_REJECTED':
        const missionTitleRejected = notification.payload.missionTitle || 'la mission';
        return `Votre candidature pour "${missionTitleRejected}" a été refusée`;
      case 'SUBMISSION_ACCEPTED':
        const missionTitleSubAccepted = notification.payload.missionTitle || 'la mission';
        return `Votre soumission pour "${missionTitleSubAccepted}" a été acceptée`;
      case 'SUBMISSION_REJECTED':
        const missionTitleSubRejected = notification.payload.missionTitle || 'la mission';
        return `Votre soumission pour "${missionTitleSubRejected}" a été refusée`;
      case 'NEW_MESSAGE':
        const senderName = notification.payload.senderName || 'Quelqu\'un';
        return `Nouveau message de ${senderName}`;
      case 'ROLE_APPROVED':
        const roleType = notification.payload.roleType || 'rôle';
        return `Votre demande de ${roleType} a été approuvée`;
      case 'ROLE_REJECTED':
        const roleTypeRejected = notification.payload.roleType || 'rôle';
        return `Votre demande de ${roleTypeRejected} a été refusée`;
      case 'FEED_POST_DRAFT_READY':
        const missionTitleDraft = notification.payload.missionTitle || 'votre mission';
        return `Publiez votre post pour "${missionTitleDraft}"`;
      case 'FEED_POST_COMMENTED':
        const commenterName = notification.payload.commenterName || 'Quelqu\'un';
        return `${commenterName} a commenté votre post`;
      case 'FEED_POST_PUBLISHED':
        const missionTitlePublished = notification.payload.missionTitle || 'la mission';
        return `Votre post pour "${missionTitlePublished}" a été publié avec succès`;
      default:
        return 'Nouvelle notification';
    }
  }

  function getNotificationLink(notification: Notification): string {
    switch (notification.type) {
      case 'NEW_MISSION':
        return `/missions/${notification.payload.missionId}`;
      case 'NEW_APPLICATION':
        return `/admin/missions/${notification.payload.missionId}/applications`;
      case 'APPLICATION_ACCEPTED':
      case 'APPLICATION_REJECTED':
        return `/missions/${notification.payload.missionId}`;
      case 'SUBMISSION_ACCEPTED':
      case 'SUBMISSION_REJECTED':
        return `/missions/${notification.payload.missionId}`;
      case 'NEW_MESSAGE':
        return notification.payload.threadId ? `/threads/${notification.payload.threadId}` : '/my-applications';
      case 'ROLE_APPROVED':
      case 'ROLE_REJECTED':
        return '/profile';
      case 'FEED_POST_DRAFT_READY':
        return notification.payload.postId ? `/feed/${notification.payload.postId}` : '/feed';
      case 'FEED_POST_COMMENTED':
        return notification.payload.postId ? `/feed/${notification.payload.postId}` : '/feed';
      case 'FEED_POST_PUBLISHED':
        return notification.payload.postId ? `/feed/${notification.payload.postId}` : '/feed';
      default:
        return '/missions';
    }
  }

  function getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'NEW_MISSION':
        return '🎯';
      case 'NEW_APPLICATION':
        return '📝';
      case 'APPLICATION_ACCEPTED':
        return '✅';
      case 'APPLICATION_REJECTED':
        return '❌';
      case 'SUBMISSION_ACCEPTED':
        return '✅';
      case 'SUBMISSION_REJECTED':
        return '❌';
      case 'NEW_MESSAGE':
        return '💬';
      case 'ROLE_APPROVED':
        return '✅';
      case 'ROLE_REJECTED':
        return '❌';
      case 'FEED_POST_DRAFT_READY':
        return '📝';
      case 'FEED_POST_COMMENTED':
        return '💬';
      case 'FEED_POST_PUBLISHED':
        return '🎉';
      default:
        return '🔔';
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
              <Bell className="w-8 h-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Historique de toutes vos notifications ({total} au total)
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

      {loading && notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-lg font-medium mb-2">Aucune notification</p>
              <p className="text-sm">
                Vous n'avez pas encore de notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const message = getNotificationMessage(notification);
              const icon = getNotificationIcon(notification);
              const date = new Date(notification.createdAt).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Link
                  key={notification.id}
                  href={link}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                  className="block"
                >
                  <Card className={`hover:shadow-md transition-all ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl flex-shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{date}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setOffset(prev => prev + limit)}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

