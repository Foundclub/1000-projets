import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  avatar: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Fetch full user data with all fields needed for profile
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        dateOfBirth: true,
        avatar: true,
        role: true,
        activeRole: true,
        annonceurRequestStatus: true,
        adminRequestStatus: true,
        justificatifUrl: true,
        roleChosenAt: true,
      },
    });
    
    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(fullUser);
  } catch (e: any) {
    console.error('Error fetching profile:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const res = NextResponse.next();
  try {
    const user = await getCurrentUser(req, res);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { displayName, firstName, lastName, phone, companyName, dateOfBirth, avatar } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName !== undefined ? displayName : undefined,
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        phone: phone !== undefined ? phone : undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
    });
    
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Error updating profile:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

