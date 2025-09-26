import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth';
import { enforcePlanLimits, incrementUsage } from '@/lib/planLimits';

const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description_raw: z.string().min(1, 'Description is required'),
  source: z.enum(['CREATED', 'UPLOADED', 'IMPORTED']).optional().default('CREATED'),
  scheduled_post_date: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const jobs = await prisma.job.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        candidates: true,
        compliance_logs: true,
        _count: {
          select: { candidates: true }
        }
      }
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { title, description_raw, source, scheduled_post_date } = createJobSchema.parse(body);

    // Check plan limits
    const limitsCheck = await enforcePlanLimits(user.id, 'job_creation');
    if (!limitsCheck.canPerformAction) {
      return NextResponse.json(
        { error: 'Job creation limit reached for your plan' },
        { status: 403 }
      );
    }

    const job = await prisma.job.create({
      data: {
        user_id: user.id,
        title,
        description_raw,
        source,
        scheduled_post_date: scheduled_post_date ? new Date(scheduled_post_date) : null
      }
    });

    // Increment usage
    await incrementUsage(user.id, 'job_creation');

    // Log audit event
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'JOB_CREATED',
        metadata: { job_id: job.id, title }
      }
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
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