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
    if (!limit(key + ':unfollow', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;

    // Supprimer le follow
    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: user.id,
        targetType: 'USER',
        targetUserId: id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/users/[id]/unfollow:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

