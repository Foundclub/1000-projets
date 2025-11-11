import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/admin/admins/[id]/approve
 * Approuve ou rejette une demande Admin
 * Body: { approve: boolean, note?: string }
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
    if (!adminRateLimit(`${key}:admin-approve-admin`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id: userId } = await params;
    const body = await req.json();
    const { approve, note } = body;
    
    if (typeof approve !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload: approve must be boolean' }, { status: 400 });
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (approve) {
      // Approuver : mettre à jour le rôle en ADMIN et approuver la demande
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: Role.ADMIN,
          adminRequestStatus: 'APPROVED',
          roleChosenAt: targetUser.roleChosenAt || new Date(),
        },
      });
    } else {
      // Rejeter : rejeter la demande (garder le rôle actuel)
      await prisma.user.update({
        where: { id: userId },
        data: {
          adminRequestStatus: 'REJECTED',
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Approve Admin] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


