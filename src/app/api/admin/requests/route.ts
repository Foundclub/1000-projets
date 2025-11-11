import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { isAdmin } from '@/lib/rbac';
import { keyFromReq, adminRateLimit } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (!isAdmin(user)) {
      console.log('[Admin Requests] ❌ Non-admin trying to access:', user.email, 'role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Rate limiting
    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-requests`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    // Fetch all users with pending requests
    const requests = await prisma.user.findMany({
      where: {
        OR: [
          { annonceurRequestStatus: 'PENDING' },
          { adminRequestStatus: 'PENDING' },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        annonceurRequestStatus: true,
        adminRequestStatus: true,
        justificatifUrl: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (e: any) {
    console.error('Error fetching requests:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

