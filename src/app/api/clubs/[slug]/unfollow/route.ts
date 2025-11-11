import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { keyFromReq, limit } from '@/lib/ratelimit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = keyFromReq(req as any, user.id);
    if (!limit(key + ':unfollow', 10, 60_000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { slug } = await params;

    // Get organization by slug
    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if follow exists and delete
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: user.id,
        targetType: 'ORGANIZATION',
        organizationId: organization.id,
      },
    });

    if (!follow) {
      return NextResponse.json({ error: 'Not following' }, { status: 400 });
    }

    // Delete follow
    await prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in POST /api/clubs/[slug]/unfollow:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


