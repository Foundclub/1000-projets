import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get organizations owned by the user
    const organizations = await prisma.organization.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        isCertified: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ organizations });
  } catch (e: any) {
    console.error('Error in GET /api/clubs/my:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


