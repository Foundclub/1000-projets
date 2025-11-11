import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@prisma/client';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/admin/missions/[id]/reject
 * Rejette une mission (status=ARCHIVED)
 * Body: { reason?: string }
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
    if (!adminRateLimit(`${key}:admin-mission-reject`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason } = body;
    
    const mission = await prisma.mission.findUnique({
      where: { id },
    });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    // Note: On pourrait ajouter un champ reason dans Mission si nécessaire
    // Pour l'instant, on archive simplement
    const updated = await prisma.mission.update({
      where: { id },
      data: {
        status: MissionStatus.ARCHIVED,
      },
    });
    
    return NextResponse.json({ mission: updated });
  } catch (e: any) {
    console.error('[Admin Mission Reject] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


