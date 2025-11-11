import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/user/xp-history
 * Retourner l'historique des gains d'XP pour l'utilisateur connecté
 * Query params: page, limit, kind?, space?
 */
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const kind = searchParams.get('kind'); // MISSION_ACCEPTED, BONUS_MANUAL, etc.
    const space = searchParams.get('space'); // PRO, SOLIDAIRE, ou null pour général

    const where: any = {
      userId: user.id,
    };

    if (kind) {
      where.kind = kind;
    }

    if (space) {
      if (space === 'GENERAL' || space === 'null') {
        where.space = null;
      } else {
        where.space = space;
      }
    }

    // Récupérer les événements XP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, total] = await Promise.all([
      (prisma as any).xpEvent?.findMany({
        where,
        include: {
          mission: {
            select: {
              id: true,
              title: true,
              space: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }) || [],
      (prisma as any).xpEvent?.count({ where }) || 0,
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    console.error('Error in GET /api/user/xp-history:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

