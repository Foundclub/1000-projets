import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ratingAvg: true,
        ratingCount: true,
        isCertifiedAnnonceur: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      isCertifiedAnnonceur: user.isCertifiedAnnonceur,
    });
  } catch (e) {
    console.error('Error fetching rating:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

