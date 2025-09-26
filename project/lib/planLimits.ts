import { prisma } from './database';
import { User, Plan } from '@prisma/client';

export interface PlanLimitsCheck {
  canPerformAction: boolean;
  isOverage: boolean;
  usagePercentage: number;
  remainingCount: number;
}

export async function enforcePlanLimits(
  userId: string,
  action: 'ai_call' | 'job_creation' | 'resume_upload'
): Promise<PlanLimitsCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      plan: true,
      usage: {
        where: {
          billing_cycle_start: { lte: new Date() },
          billing_cycle_end: { gte: new Date() }
        },
        orderBy: { billing_cycle_start: 'desc' },
        take: 1
      }
    }
  });

  if (!user) throw new Error('User not found');

  const currentUsage = user.usage[0];
  if (!currentUsage) {
    // Create new usage period
    const now = new Date();
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    
    await prisma.userUsage.create({
      data: {
        user_id: userId,
        billing_cycle_start: now,
        billing_cycle_end: cycleEnd
      }
    });

    return {
      canPerformAction: true,
      isOverage: false,
      usagePercentage: 0,
      remainingCount: getLimitForAction(user.plan, action)
    };
  }

  switch (action) {
    case 'ai_call':
      const aiRemaining = user.plan.ai_calls_included - currentUsage.ai_calls_used;
      return {
        canPerformAction: true, // Allow overage for AI calls (billable)
        isOverage: aiRemaining <= 0,
        usagePercentage: (currentUsage.ai_calls_used / user.plan.ai_calls_included) * 100,
        remainingCount: Math.max(0, aiRemaining)
      };

    case 'job_creation':
      const activeJobs = await prisma.job.count({
        where: { user_id: userId, status: { in: ['ACTIVE', 'DRAFT'] } }
      });
      const jobsRemaining = user.plan.job_limit - activeJobs;
      return {
        canPerformAction: jobsRemaining > 0,
        isOverage: false,
        usagePercentage: (activeJobs / user.plan.job_limit) * 100,
        remainingCount: Math.max(0, jobsRemaining)
      };

    case 'resume_upload':
      const resumeCount = await prisma.candidate.count({
        where: { 
          job: { user_id: userId },
          resume_file_url: { not: null }
        }
      });
      const resumesRemaining = user.plan.resume_storage_limit - resumeCount;
      return {
        canPerformAction: resumesRemaining > 0,
        isOverage: false,
        usagePercentage: (resumeCount / user.plan.resume_storage_limit) * 100,
        remainingCount: Math.max(0, resumesRemaining)
      };

    default:
      return {
        canPerformAction: true,
        isOverage: false,
        usagePercentage: 0,
        remainingCount: 0
      };
  }
}

function getLimitForAction(plan: Plan, action: string): number {
  switch (action) {
    case 'ai_call': return plan.ai_calls_included;
    case 'job_creation': return plan.job_limit;
    case 'resume_upload': return plan.resume_storage_limit;
    default: return 0;
  }
}

export async function incrementUsage(
  userId: string,
  action: 'ai_call' | 'job_creation' | 'resume_score'
) {
  const currentUsage = await prisma.userUsage.findFirst({
    where: {
      user_id: userId,
      billing_cycle_start: { lte: new Date() },
      billing_cycle_end: { gte: new Date() }
    }
  });

  if (!currentUsage) return;

  const updateData: any = {};
  
  switch (action) {
    case 'ai_call':
      updateData.ai_calls_used = { increment: 1 };
      break;
    case 'job_creation':
      updateData.jobs_created_count = { increment: 1 };
      break;
    case 'resume_score':
      updateData.resumes_scored_count = { increment: 1 };
      break;
  }

  await prisma.userUsage.update({
    where: { id: currentUsage.id },
    data: updateData
  });
}