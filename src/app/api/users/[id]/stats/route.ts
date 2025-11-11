import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const { id } = await params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        xp: true,
        xpPro: true,
        xpSolid: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculer les statistiques
    const [missionsCompleted, submissionsAccepted, feedPostsCount, applicationsAccepted] = await Promise.all([
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
      prisma.missionApplication.count({
        where: {
          userId: id,
          status: 'ACCEPTED',
        },
      }),
    ]);

    return NextResponse.json({
      missionsCompleted,
      submissionsAccepted,
      feedPostsCount,
      applicationsAccepted,
      xp: {
        total: user.xp,
        pro: user.xpPro,
        solid: user.xpSolid,
      },
    });
  } catch (e: any) {
    console.error('Error in GET /api/users/[id]/stats:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

