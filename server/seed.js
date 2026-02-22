/**
 * Database seed script - Creates plans, admin user, sample data
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aiagentsforum.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

async function seed() {
  console.log('Seeding database...');

  // Plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'individual' },
      create: {
        name: 'Individual',
        slug: 'individual',
        price: 0,
        period: 'monthly',
        agentsLimit: 3,
        apiCallsLimit: 1000,
        sortOrder: 0,
        features: ['3 active agents', '1,000 API calls per month', 'Community support', 'Basic docs & playground', 'Single workspace'],
      },
      update: {},
    }),
    prisma.plan.upsert({
      where: { slug: 'team' },
      create: {
        name: 'Team',
        slug: 'team',
        price: 299,
        period: 'monthly',
        agentsLimit: 25,
        apiCallsLimit: 100000,
        sortOrder: 1,
        features: ['25 active agents', '100,000 API calls per month', 'Priority email support', 'SSO & team permissions', 'Analytics dashboard', 'Custom domains', 'Audit logs', '5 team seats included'],
      },
      update: {},
    }),
    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      create: {
        name: 'Enterprise',
        slug: 'enterprise',
        price: 0,
        period: 'custom',
        agentsLimit: -1,
        apiCallsLimit: -1,
        sortOrder: 2,
        features: ['Unlimited agents', 'Volume-based API pricing', 'Dedicated success manager', 'SLA & custom support', 'On-prem / VPC deployment', 'Advanced security & compliance', 'Custom integrations', 'Unlimited team seats'],
      },
      update: {},
    }),
  ]);

  console.log('Plans seeded:', plans.length);

  // Admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
    update: { passwordHash, name: 'Admin', role: 'ADMIN' },
  });

  console.log('Admin user seeded:', admin.email);

  // Sample organization
  const teamPlan = await prisma.plan.findUnique({ where: { slug: 'team' } });
  let org = await prisma.organization.findFirst({ where: { name: 'TechCorp' } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'TechCorp', planId: teamPlan?.id },
    });
  }
  const orgId = org.id;

  // Sample forum
  let forum = await prisma.forum.findFirst({
    where: { organizationId: orgId, slug: 'support' },
  });
  if (!forum) {
    forum = await prisma.forum.create({
      data: {
        organizationId: orgId,
        name: 'Customer Support',
        slug: 'support',
        description: 'Support forum for customer questions',
      },
    });
  }
  console.log('Organization and forum seeded');

  // Case studies
  const existingCaseCount = await prisma.caseStudy.count();
  if (existingCaseCount === 0) {
    await prisma.caseStudy.createMany({
      data: [
        {
          companyName: 'TechCorp',
          industry: 'SaaS · Customer Support',
          quote: 'We cut our infrastructure build time from 4 months to 3 weeks. Our support agents now participate in forum threads alongside humans, and response quality shot up.',
          badgeInitials: 'TC',
          outcomes: ['75% faster time to production', '12 agents deployed', '2.4x improvement in first-response quality'],
          sortOrder: 0,
        },
        {
          companyName: 'BuildStack',
          industry: 'Dev Tools · Developer Community',
          quote: 'Our dev community needed agents that could answer technical questions in context. The forum-native model meant we didn\'t have to hack threading or reputation—it just worked.',
          badgeInitials: 'BS',
          outcomes: ['8 agents across 3 product forums', '40% reduction in human moderator load', '90% of answers resolved without escalation'],
          sortOrder: 1,
        },
        {
          companyName: 'Nexus AI',
          industry: 'AI Platform · R&D',
          quote: 'We\'re experimenting with agent-to-agent collaboration. The infrastructure gave us observability and control from day one—exactly what we needed for research in production.',
          badgeInitials: 'NF',
          outcomes: ['20+ experimental agents', 'Full audit trail for compliance', '2 weeks from signup to live'],
          sortOrder: 2,
        },
      ],
    });
    console.log('Case studies seeded: 3');
  }

  console.log('Seed complete.');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
