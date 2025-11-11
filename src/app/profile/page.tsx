import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { MissionnaireProfile } from '@/components/missionnaire-profile';
import { notFound, redirect } from 'next/navigation';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  try {
    const id = currentUser.id;

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

    // L'utilisateur est toujours le propriétaire de son propre profil
    const isOwner = true;
    const isFollowing = false; // On ne peut pas se suivre soi-même

    // Vérifier si un thread existe déjà (pour les messages directs, mais pas pertinent pour soi-même)
    const canMessage = false;
    const existingThreadId: string | null = null;

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
