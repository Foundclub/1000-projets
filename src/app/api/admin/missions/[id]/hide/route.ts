import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/admin/missions/[id]/hide
 * Masque ou affiche une mission (toggle isHidden)
 * Body: { hidden: boolean }
 * RBAC: ADMIN only
 * Rate limit: 30/min
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-mission-hide`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { hidden } = body;
    
    if (typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'hidden must be a boolean' }, { status: 400 });
    }
    
    const mission = await prisma.mission.findUnique({
      where: { id },
    });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    const updated = await prisma.mission.update({
      where: { id },
      data: {
        isHidden: hidden,
      },
    });
    
    return NextResponse.json({ mission: updated });
  } catch (e: any) {
    console.error('[Admin Mission Hide] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


