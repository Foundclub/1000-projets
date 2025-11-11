import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLevelFromXp, getLevelNameFromXp, getBadgeForLevel } from '@/lib/xp';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    // currentUser peut être null si non authentifié (pour ProfileRedirect)
    const currentUser = await getCurrentUser(req, res).catch(() => null);
    const { id } = await params;

    // Récupérer l'utilisateur cible avec tous les champs nécessaires
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
        isCertifiedAnnonceur: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Vérifier si un thread existe déjà entre les deux utilisateurs
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
      canMessage = true; // Peut toujours créer un thread
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

    return NextResponse.json({
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
      isCertifiedAnnonceur: targetUser.isCertifiedAnnonceur,
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
    });
  } catch (e: any) {
    console.error('Error in GET /api/users/[id]:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

