import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const missionnaireOnboardingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  avatarUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const parsed = missionnaireOnboardingSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { firstName, lastName, dateOfBirth, avatarUrl } = parsed.data;

    // Update user with missionnaire data and set roleChosenAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        avatar: avatarUrl || null,
        roleChosenAt: new Date(),
        activeRole: 'MISSIONNAIRE',
        // Keep role as MISSIONNAIRE (default)
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error in onboarding missionnaire:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


