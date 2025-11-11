import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;

    const where: any = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applications = await (prisma as any).missionApplication?.findMany({
      where,
      include: {
        mission: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
                isCertifiedAnnonceur: true,
                ratingAvg: true,
                ratingCount: true,
              },
            },
            organization: {
              select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                isCertified: true,
              },
            },
          },
        },
        thread: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) || [];

    return NextResponse.json({ applications });
  } catch (e: any) {
    console.error('Error in GET /api/applications/my:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

