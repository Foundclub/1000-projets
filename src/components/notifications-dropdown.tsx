"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  createdAt: string;
};

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // S'assurer que le composant est monté côté client avant de rendre le portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      // Charger les notifications non lues pour l'affichage
      const res = await fetch('/api/notifications?limit=10&read=false', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        // Le unreadCount est le total de toutes les notifications non lues
        setUnreadCount(data.unreadCount || 0);
      } else {
        // Si erreur, réinitialiser le compteur
        setUnreadCount(0);
        setNotifications([]);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
      setUnreadCount(0);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Polling toutes les 30 secondes pour les nouvelles notifications
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);
  
  // Recharger les notifications quand le dropdown s'ouvre
  useEffect(() => {
    if (open) {
      loadNotifications();
      // Calculer la position du dropdown
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [open, loadNotifications]);

  async function markAsRead(notificationId: string) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        // Recharger immédiatement pour mettre à jour le compteur
        await loadNotifications();
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


  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="relative p-2 sm:p-2 md:p-2 overflow-visible"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-white dark:ring-background z-20 translate-x-1/2 -translate-y-1/2">
            {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {mounted && open && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div 
            className="fixed w-80 bg-popover border-2 border-border/50 rounded-lg shadow-2xl shadow-black/20 ring-2 ring-black/5 z-50 max-h-96 overflow-y-auto"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} non lue(s)</p>
              )}
            </div>
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClose={() => setOpen(false)}
                    getLink={getNotificationLink}
                    getMessage={getNotificationMessage}
                  />
                ))}
              </div>
            )}
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// Composant pour formater la date et éviter les erreurs d'hydratation
function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
  getLink,
  getMessage,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
  getLink: (notification: Notification) => string;
  getMessage: (notification: Notification) => string;
}) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(
      new Date(notification.createdAt).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [notification.createdAt]);

  return (
    <Link
      href={getLink(notification)}
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        onClose();
      }}
      className={`block p-4 hover:bg-accent transition-colors ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <p className="text-sm font-medium">{getMessage(notification)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {formattedDate || '...'}
      </p>
    </Link>
  );
}


