import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@prisma/client';
import { canCreateMission } from '@/lib/rbac';
import { keyFromReq, limit } from '@/lib/ratelimit';

/**
 * PATCH /api/missions/[id]/reopen
 * Rouvre une mission clôturée
 * RBAC: ANNONCEUR (owner) or ADMIN only
 * Rate limit: 10/min
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user || !canCreateMission(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = keyFromReq(req as any, user.id);
    if (!limit(`${key}:reopen-mission`, 10, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    
    // Vérifier que la mission existe et appartient à l'utilisateur (ou que l'utilisateur est admin)
    const mission = await prisma.mission.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
        slotsTaken: true,
        slotsMax: true,
      },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    if (mission.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this mission' }, { status: 403 });
    }

    if (mission.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Mission is not closed' }, { status: 400 });
    }

    // Vérifier que la mission peut être rouverte (slotsTaken < slotsMax)
    if (mission.slotsTaken >= mission.slotsMax) {
      return NextResponse.json({ 
        error: 'Cannot reopen mission: all slots are taken' 
      }, { status: 400 });
    }

    // Rouvrir la mission
    const updated = await prisma.mission.update({
      where: { id },
      data: {
        status: MissionStatus.OPEN,
      },
    });

    return NextResponse.json({ mission: updated });
  } catch (e: any) {
    console.error('Error reopening mission:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}




