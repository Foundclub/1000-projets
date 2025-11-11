import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Fetch full user data with all fields
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
        // Return only the fields we need
        // Si activeRole n'est pas défini, utiliser role par défaut
        const activeRole = (fullUser as any).activeRole || fullUser.role;
        
        return NextResponse.json({
          id: fullUser.id,
          email: fullUser.email,
          displayName: fullUser.displayName,
          firstName: (fullUser as any).firstName || null,
          lastName: (fullUser as any).lastName || null,
          avatar: (fullUser as any).avatar || null,
          role: fullUser.role,
          activeRole: activeRole,
        });
  } catch (e: any) {
    console.error('Error in GET /api/user/me:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

