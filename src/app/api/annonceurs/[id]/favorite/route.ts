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
    if (!limit(key + ':favorite-annonceur', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;

    // Check if annonceur exists and is an ANNONCEUR
    const annonceur = await prisma.user.findUnique({
      where: { id },
    });

    if (!annonceur) {
      return NextResponse.json({ error: 'Annonceur not found' }, { status: 404 });
    }

    if (annonceur.role !== 'ANNONCEUR') {
      return NextResponse.json({ error: 'User is not an annonceur' }, { status: 400 });
    }

    // Cannot favorite yourself
    if (annonceur.id === user.id) {
      return NextResponse.json({ error: 'Cannot favorite yourself' }, { status: 400 });
    }

    // Check limit: max 50 favorite annonceurs per user
    const favoriteCount = await prisma.favoriteAnnonceur.count({
      where: { userId: user.id },
    });

    if (favoriteCount >= 50) {
      return NextResponse.json({ error: 'Limite de 50 annonceurs favoris atteinte' }, { status: 400 });
    }

    // Create favorite and grant XP in a transaction
    try {
      const xp = xpForFollow();
      await prisma.$transaction(async (tx) => {
        await tx.favoriteAnnonceur.create({
          data: {
            userId: user.id,
            annonceurId: id,
          },
        });

        // Grant +5 XP for favoriting (same as follow)
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
        // Unique constraint violation (already favorited)
        return NextResponse.json({ error: 'Already favorited' }, { status: 400 });
      }
      throw createError;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/annonceurs/[id]/favorite:', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


