import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = user.profile;
    if (!profile) {
      return NextResponse.json({ profile: null, completion: 0 });
    }

    const completion = calculateProfileCompletion(profile, user.email);

    return NextResponse.json({
      profile,
      completion,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      nationalId,
      birthDate,
      phone,
      jobTitle,
      department,
      skills,
      socials,
      documents,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'نام و نام خانوادگی الزامی است' },
        { status: 400 }
      );
    }

    // Check if nationalId is unique (if provided)
    if (nationalId) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: session.user.id },
          profile: {
            nationalId: nationalId,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'این کد ملی قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    // Update or create profile
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        firstName,
        lastName,
        nationalId,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        jobTitle,
        department,
        skills: skills || null,
        socials: socials || null,
        documents: documents || null,
      },
      create: {
        userId: session.user.id,
        firstName,
        lastName,
        nationalId,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        jobTitle,
        department,
        skills: skills || null,
        socials: socials || null,
        documents: documents || null,
      },
    });

    // Calculate new completion percentage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const completion = calculateProfileCompletion(profile, user?.email);

    // Update completion percentage
    await prisma.profile.update({
      where: { id: profile.id },
      data: { completion: completion.percentage },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        actorRole: session.user.role,
        action: 'PROFILE_UPDATE',
        entity: 'Profile',
        entityId: profile.id,
        diff: body,
      },
    });

    return NextResponse.json({
      profile: { ...profile, completion: completion.percentage },
      completion,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
