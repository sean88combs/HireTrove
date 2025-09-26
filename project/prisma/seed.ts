import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default plans
  const starterPlan = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      price: 0,
      ai_calls_included: 100,
      job_limit: 3,
      resume_storage_limit: 50,
      features: {
        bias_checker: true,
        basic_scoring: true,
        email_templates: true,
        compliance_monitoring: true
      }
    }
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      price: 4900, // $49.00
      ai_calls_included: 500,
      job_limit: 15,
      resume_storage_limit: 250,
      features: {
        bias_checker: true,
        advanced_scoring: true,
        interview_guides: true,
        email_templates: true,
        compliance_monitoring: true,
        scheduling: true,
        custom_templates: true
      }
    }
  });

  const teamPlan = await prisma.plan.upsert({
    where: { name: 'Team' },
    update: {},
    create: {
      name: 'Team',
      price: 9900, // $99.00
      ai_calls_included: 1500,
      job_limit: 50,
      resume_storage_limit: 1000,
      features: {
        bias_checker: true,
        advanced_scoring: true,
        interview_guides: true,
        email_templates: true,
        compliance_monitoring: true,
        scheduling: true,
        custom_templates: true,
        team_collaboration: true,
        advanced_analytics: true,
        priority_support: true,
        custom_branding: true
      }
    }
  });

  console.log('Seeded plans:', { starterPlan, proPlan, teamPlan });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });