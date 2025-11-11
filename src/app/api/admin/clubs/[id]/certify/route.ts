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

    const key = keyFromReq(req as any, user.id);
    if (!adminRateLimit(`${key}:admin-club-certify`, 30, 60000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isCertified } = body;

    if (typeof isCertified !== 'boolean') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        isCertified,
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (e: any) {
    console.error('[Admin Club Certify] Error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


