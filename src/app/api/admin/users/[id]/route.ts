import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';

/**
 * GET /api/admin/users/[id]
 * Récupère un utilisateur par email (id peut être un email ou un id)
 * RBAC: ADMIN only
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
      console.log('[Admin Users] ❌ Non-admin trying to access:', user.email, 'role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    
    // Vérifier si c'est un email ou un id
    const isEmail = decodedId.includes('@');
    
    const targetUser = await prisma.user.findUnique({
      where: isEmail ? { email: decodedId } : { id: decodedId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isCertifiedAnnonceur: true,
      },
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(targetUser);
  } catch (e) {
    console.error('Error fetching user:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

