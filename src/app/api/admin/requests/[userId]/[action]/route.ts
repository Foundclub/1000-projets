import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; action: string }> }
) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, action } = await params;
    
    // Valider que l'action est valide
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const { type } = body; // 'annonceur' | 'admin'

    if (!type || (type !== 'annonceur' && type !== 'admin')) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      if (type === 'annonceur') {
        // Approve annonceur request
        await prisma.user.update({
          where: { id: userId },
          data: {
            role: Role.ANNONCEUR,
            annonceurRequestStatus: 'APPROVED',
            roleChosenAt: new Date(),
          },
        });
      } else if (type === 'admin') {
        // Approve admin request
        await prisma.user.update({
          where: { id: userId },
          data: {
            role: Role.ADMIN,
            adminRequestStatus: 'APPROVED',
            roleChosenAt: new Date(),
          },
        });
      }
    } else if (action === 'reject') {
      if (type === 'annonceur') {
        // Reject annonceur request
        await prisma.user.update({
          where: { id: userId },
          data: {
            annonceurRequestStatus: 'REJECTED',
          },
        });
      } else if (type === 'admin') {
        // Reject admin request
        await prisma.user.update({
          where: { id: userId },
          data: {
            adminRequestStatus: 'REJECTED',
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error processing request:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

