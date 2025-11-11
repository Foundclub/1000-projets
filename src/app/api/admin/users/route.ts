import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/admin/users
 * Liste les utilisateurs avec filtres et pagination
 * Query params: role, verification, adminStatus, q (recherche), page, limit
 * RBAC: ADMIN only
 * Rate limit: 30/min
 */
export async function GET(req: NextRequest) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!isAdmin(user)) {
      console.log('[Admin Users] ❌ Non-admin trying to access:', user.email, 'role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-users`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as Role | null;
    const verification = searchParams.get('verification'); // NONE|PENDING|APPROVED|REJECTED
    const adminStatus = searchParams.get('adminStatus'); // NONE|PENDING|APPROVED|REJECTED
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (verification) {
      if (verification === 'NONE') {
        where.annonceurRequestStatus = null;
      } else {
        where.annonceurRequestStatus = verification;
      }
    }

    if (adminStatus) {
      if (adminStatus === 'NONE') {
        where.adminRequestStatus = null;
      } else {
        where.adminRequestStatus = adminStatus;
      }
    }

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Fetch users with pagination
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          role: true,
          companyName: true,
          isCertifiedAnnonceur: true,
          annonceurRequestStatus: true,
          adminRequestStatus: true,
          xp: true,
          xpPro: true,
          xpSolid: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users: items, total, page, limit });
  } catch (e: any) {
    console.error('[Admin Users] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

