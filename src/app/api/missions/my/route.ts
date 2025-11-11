import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@prisma/client';
import { canCreateMission } from '@/lib/rbac';
import { keyFromReq, limit } from '@/lib/ratelimit';

/**
 * GET /api/missions/my
 * Liste les missions de l'utilisateur connecté (annonceur/admin)
 * Query params: status, page, limit
 * RBAC: ADMIN or ANNONCEUR only
 * Rate limit: 30/min
 */
export async function GET(req: NextRequest) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!canCreateMission(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!limit(`${key}:my-missions`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as MissionStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limitCount = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limitCount;
    
    // Build where clause
    const where: any = {
      ownerId: user.id,
    };
    
    if (status) {
      where.status = status;
    }
    
    // Fetch missions with pagination
    const [items, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitCount,
      }),
      prisma.mission.count({ where }),
    ]);
    
    return NextResponse.json({ items, total, page, limit: limitCount });
  } catch (e: any) {
    console.error('[My Missions] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


