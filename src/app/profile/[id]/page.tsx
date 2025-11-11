import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MissionnaireProfile } from '@/components/missionnaire-profile';
import { notFound, redirect } from 'next/navigation';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  try {
    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        xp: true,
        xpPro: true,
        xpSolid: true,
        bio: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      notFound();
    }

    // Si c'est un annonceur, rediriger vers la page annonceur
    if (targetUser.role === 'ANNONCEUR') {
      redirect(`/annonceurs/${id}`);
    }

    // Vérifier si l'utilisateur actuel suit ce profil
    let isFollowing = false;
    let isOwner = false;
    if (currentUser) {
      isOwner = currentUser.id === id;
      if (!isOwner) {
        const follow = await prisma.follow.findFirst({
          where: {
            followerId: currentUser.id,
            targetType: 'USER',
            targetUserId: id,
          },
        });
        isFollowing = !!follow;
      }
    }

    // Vérifier si un thread existe déjà
    let canMessage = false;
    let existingThreadId: string | null = null;
    if (currentUser && !isOwner) {
      const thread = await prisma.thread.findFirst({
        where: {
          OR: [
            { aId: currentUser.id, bId: id },
            { aId: id, bId: currentUser.id },
          ],
        },
        select: { id: true },
      });
      canMessage = true;
      existingThreadId = thread?.id || null;
    }

    // Calculer les statistiques
    const [missionsCompleted, submissionsAccepted, feedPostsCount] = await Promise.all([
      prisma.submission.count({
        where: {
          userId: id,
          status: 'ACCEPTED',
        },
      }),
      prisma.submission.count({
        where: {
          userId: id,
          status: 'ACCEPTED',
        },
      }),
      prisma.feedPost.count({
        where: {
          authorId: id,
          published: true,
        },
      }),
    ]);

    // Calculer les niveaux
    const levelGeneral = getLevelFromXp(targetUser.xp, true);
    const levelPro = getLevelFromXp(targetUser.xpPro, false);
    const levelSolid = getLevelFromXp(targetUser.xpSolid, false);

    const levelNameGeneral = getLevelNameFromXp(targetUser.xp, true);
    const levelNamePro = getLevelNameFromXp(targetUser.xpPro, false);
    const levelNameSolid = getLevelNameFromXp(targetUser.xpSolid, false);

    const userData = {
      id: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      avatar: targetUser.avatar,
      role: targetUser.role,
      xp: targetUser.xp,
      xpPro: targetUser.xpPro,
      xpSolid: targetUser.xpSolid,
      bio: targetUser.bio,
      ratingAvg: targetUser.ratingAvg,
      ratingCount: targetUser.ratingCount,
      createdAt: targetUser.createdAt,
      isFollowing,
      isOwner,
      canMessage,
      existingThreadId,
      stats: {
        missionsCompleted,
        submissionsAccepted,
        feedPostsCount,
      },
      levels: {
        general: {
          level: levelGeneral.level,
          name: levelNameGeneral,
          badge: getBadgeForLevel(levelGeneral.level),
          progress: levelGeneral.progress,
        },
        pro: {
          level: levelPro.level,
          name: levelNamePro,
          badge: getBadgeForLevel(levelPro.level),
          progress: levelPro.progress,
        },
        solid: {
          level: levelSolid.level,
          name: levelNameSolid,
          badge: getBadgeForLevel(levelSolid.level),
          progress: levelSolid.progress,
        },
      },
    };

    return (
      <div className="max-w-6xl mx-auto p-6">
        <MissionnaireProfile user={userData} />
      </div>
    );
  } catch (e) {
    console.error('Error loading profile:', e);
    notFound();
  }
}

