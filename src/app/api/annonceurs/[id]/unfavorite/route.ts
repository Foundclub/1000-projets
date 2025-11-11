import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':unfavorite-annonceur', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;

    // Check if favorite exists and delete
    const favorite = await prisma.favoriteAnnonceur.findFirst({
      where: {
        userId: user.id,
        annonceurId: id,
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Not favorited' }, { status: 400 });
    }

    // Delete favorite
    await prisma.favoriteAnnonceur.delete({
      where: {
        id: favorite.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/annonceurs/[id]/unfavorite:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


