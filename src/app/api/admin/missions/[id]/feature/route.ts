import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/admin/missions/[id]/feature
 * Met à jour isFeatured et featuredRank d'une mission
 * Body: { featured: boolean, rank?: number }
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
    if (!adminRateLimit(`${key}:admin-mission-feature`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    const body = await req.json();
    const { featured, rank } = body;
    
    if (typeof featured !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload: featured must be boolean' }, { status: 400 });
    }
    
    const mission = await prisma.mission.findUnique({
      where: { id },
    });
    
    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }
    
    const updateData: any = {
      isFeatured: featured,
    };
    
    if (featured && typeof rank === 'number') {
      updateData.featuredRank = rank;
    } else if (!featured) {
      updateData.featuredRank = null;
    }
    
    const updated = await prisma.mission.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({ mission: updated });
  } catch (e: any) {
    console.error('[Admin Mission Feature] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


