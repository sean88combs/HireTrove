import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth';
import { enforcePlanLimits, incrementUsage } from '@/lib/planLimits';
import { runComplianceCheck } from '@/lib/compliance';
import { generateJobDescription } from '@/lib/ai';

const complySchema = z.object({
  state: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { state } = complySchema.parse(body);

    // Check AI limits
    const limitsCheck = await enforcePlanLimits(user.id, 'ai_call');
    if (!limitsCheck.canPerformAction && limitsCheck.remainingCount === 0) {
      return NextResponse.json(
        { 
          error: 'AI call limit reached',
          isOverage: limitsCheck.isOverage,
          remainingCount: limitsCheck.remainingCount
        },
        { status: 403 }
      );
    }

    // Get the job
    const job = await prisma.job.findUnique({
      where: { id: params.id, user_id: user.id }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Run compliance check
    const complianceResult = await runComplianceCheck(job.description_raw, state);

    // Generate compliant version using AI
    const aiResult = await generateJobDescription(job.description_raw, state);

    // Update job with compliant description
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        description_compliant: aiResult.compliant_description
      }
    });

    // Log compliance results
    await prisma.complianceLog.create({
      data: {
        target_type: 'JOB',
        target_id: job.id,
        issues_found: complianceResult.issues,
        score: complianceResult.score,
        raw_text_snapshot: job.description_raw
      }
    });

    // Increment AI usage
    await incrementUsage(user.id, 'ai_call');

    // Log audit event
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'JOB_COMPLIANCE_CHECK',
        metadata: { 
          job_id: job.id, 
          compliance_score: complianceResult.score,
          ai_used: true
        }
      }
    });

    return NextResponse.json({
      job: updatedJob,
      compliance: complianceResult,
      ai_improvements: aiResult.improvements,
      usage: {
        isOverage: limitsCheck.isOverage,
        remaining: limitsCheck.remainingCount - 1
      }
    });
  } catch (error) {
    console.error('Job compliance error:', error);
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