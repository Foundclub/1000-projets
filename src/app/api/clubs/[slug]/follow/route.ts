import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';
import { xpForFollow } from '@/lib/xp';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':follow', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { slug } = await params;

    // Check if organization exists by slug
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check limit: max 50 follows per user
    const followCount = await prisma.follow.count({
      where: { 
        followerId: user.id,
        targetType: 'ORGANIZATION',
      },
    });

    if (followCount >= 50) {
      return NextResponse.json({ error: 'Limite de 50 clubs suivis atteinte' }, { status: 400 });
    }

    // Create follow and grant XP in a transaction
    try {
      const xp = xpForFollow();
      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            followerId: user.id,
            targetType: 'ORGANIZATION',
            organizationId: organization.id,
            targetUserId: null,
          },
        });

        // Grant +5 XP for following
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
    console.error('Error in POST /api/clubs/[slug]/follow:', e);
    if (e.code === 'P2002') {
      // Unique constraint violation (already following)
      return NextResponse.json({ error: 'Already following' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


