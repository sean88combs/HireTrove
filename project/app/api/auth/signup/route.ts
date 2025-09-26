import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import { hashPassword, generateToken } from '@/lib/auth';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['RECRUITER', 'HIRING_MANAGER']).optional().default('RECRUITER')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Get starter plan
    let starterPlan = await prisma.plan.findUnique({
      where: { name: 'Starter' }
    });

    if (!starterPlan) {
      // Create default plans if they don't exist
      starterPlan = await prisma.plan.create({
        data: {
          name: 'Starter',
          price: 0,
          ai_calls_included: 100,
          job_limit: 3,
          resume_storage_limit: 50,
          features: {
            bias_checker: true,
            basic_scoring: true,
            email_templates: true
          }
        }
      });
    }

    // Hash password and create user
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role,
        plan_id: starterPlan.id
      },
      include: { plan: true }
    });

    // Create initial usage tracking
    const now = new Date();
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    await prisma.userUsage.create({
      data: {
        user_id: user.id,
        billing_cycle_start: now,
        billing_cycle_end: cycleEnd
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'USER_SIGNUP',
        metadata: { email, role }
      }
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan
      }
    });

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}