import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/admin/missions/[id]
 * Récupère une mission par son ID
 * RBAC: ADMIN only
 * Rate limit: 30/min
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-mission-get`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    return NextResponse.json({ mission });
  } catch (e: any) {
    console.error('[Admin Mission Get] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}



