import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { xpForFollow } from '@/lib/xp';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':follow', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur ne se suit pas lui-même
    if (user.id === id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier la limite : max 50 follows par utilisateur
    const followCount = await prisma.follow.count({
      where: {
        followerId: user.id,
        targetType: 'USER',
      },
    });

    if (followCount >= 50) {
      return NextResponse.json({ error: 'Limite de 50 utilisateurs suivis atteinte' }, { status: 400 });
    }

    // Créer le follow et accorder XP en transaction
    try {
      const xp = xpForFollow();
      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            followerId: user.id,
            targetType: 'USER',
            targetUserId: id,
            organizationId: null,
          },
        });

        // Accorder +5 XP pour suivre
        await tx.user.update({
          where: { id: user.id },
          data: {
            xp: { increment: xp.global },
            xpPro: { increment: xp.pro },
            xpSolid: { increment: xp.solid },
          },
        });
      });
    } catch (createError: any) {
      if (createError.code === 'P2002') {
        // Unique constraint violation (already following)
        return NextResponse.json({ error: 'Already following' }, { status: 400 });
      }
      throw createError;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/users/[id]/follow:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

