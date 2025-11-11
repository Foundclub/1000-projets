import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

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
    if (!adminRateLimit(`${key}:admin-certify`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
    
    const { id } = await params;
    const body = await req.json();
    
    if (typeof body.isCertifiedAnnonceur !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    // Vérifier que la cible a bien le rôle ANNONCEUR (on ne certifie pas des missionnaires)
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (targetUser.role !== 'ANNONCEUR') {
      return NextResponse.json({ error: 'Can only certify ANNONCEUR users' }, { status: 400 });
    }
    
    const updated = await prisma.user.update({
      where: { id },
      data: { isCertifiedAnnonceur: body.isCertifiedAnnonceur },
    });
    
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error certifying annonceur:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

