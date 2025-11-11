import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@prisma/client';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/admin/missions
 * Liste les missions avec filtres et pagination
 * Query params: status, q (recherche), page, limit
 * RBAC: ADMIN only
 * Rate limit: 30/min
 */
export async function GET(req: NextRequest) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!isAdmin(user)) {
      console.log('[Admin Missions] ❌ Non-admin trying to access:', user.email, 'role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-missions`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as MissionStatus | null;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { criteria: { contains: q, mode: 'insensitive' } },
      ];
    }
    
    // Fetch missions with pagination
    const [items, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { featuredRank: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.mission.count({ where }),
    ]);
    
    return NextResponse.json({ items, total, page, limit });
  } catch (e: any) {
    console.error('[Admin Missions] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

