import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const adminOnboardingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const parsed = adminOnboardingSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { firstName, lastName, phone } = parsed.data;

    // Update User with admin data and set request status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        phone,
        roleChosenAt: new Date(),
        adminRequestStatus: 'PENDING',
        // Role stays MISSIONNAIRE until approved
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in onboarding admin:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


