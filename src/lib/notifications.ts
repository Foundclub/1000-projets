import { prisma } from '@/lib/db';

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, any>
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as any,
        read: false,
      },
    });
    return notification;
  } catch (e: any) {
    console.error('Error creating notification:', e);
    throw e;
  }
}

/**
 * Crée des notifications pour tous les followers d'une organisation
 * Utilisé quand une nouvelle mission est créée
 */
export async function notifyOrganizationFollowers(
  organizationId: string,
  missionId: string,
  missionTitle: string
) {
  try {
    // Récupérer tous les followers de l'organisation
    const follows = await prisma.follow.findMany({
      where: { 
        targetType: 'ORGANIZATION',
        organizationId 
      },
      select: { followerId: true },
    });

    if (follows.length === 0) {
      return; // Pas de followers, pas de notifications
    }

    // Créer une notification pour chaque follower
    const notifications = follows.map(follow =>
      createNotification(follow.followerId, 'NEW_MISSION', {
        organizationId,
        missionId,
        missionTitle,
      })
    );

    await Promise.all(notifications);
  } catch (e: any) {
    console.error('Error notifying organization followers:', e);
    // Ne pas faire échouer la création de mission si les notifications échouent
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or forbidden');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (e: any) {
    console.error('Error marking notification as read:', e);
    throw e;
  }
}


