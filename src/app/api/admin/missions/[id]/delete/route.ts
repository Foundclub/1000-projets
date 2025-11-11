import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * DELETE /api/admin/missions/[id]/delete
 * Supprime définitivement une mission
 * RBAC: ADMIN only
 * Rate limit: 10/min (action destructive)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting (plus restrictif pour une action destructive)
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-mission-delete`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    
    const mission = await prisma.mission.findUnique({
      where: { id },
    });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    // Supprimer la mission (cascade supprimera les submissions et ratings associés)
    await prisma.mission.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Mission Delete] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


