import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (user) {
      // Log audit event
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'USER_LOGOUT',
          metadata: { email: user.email }
        }
      });
    }

    const response = NextResponse.json({ success: true });
    
    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}