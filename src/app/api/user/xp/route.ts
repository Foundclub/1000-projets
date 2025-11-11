import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, xpPro: true, xpSolid: true }
    });
    
    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    return NextResponse.json({
      xp: userData.xp,
      xpPro: userData.xpPro,
      xpSolid: userData.xpSolid
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

