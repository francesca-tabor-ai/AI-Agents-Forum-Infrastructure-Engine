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

  // AI Readiness Assessment questions (8 questions)
  const questionCount = await prisma.assessmentQuestion.count();
  if (questionCount === 0) {
    await prisma.assessmentQuestion.createMany({
      data: [
        {
          category: 'data_maturity',
          categoryLabel: 'Data Maturity',
          questionText: 'How would you describe your organisation\'s data governance and quality maturity?',
          options: [
            { value: 'ad_hoc', label: 'Ad-hoc: Data scattered, no formal governance', score: 0 },
            { value: 'emerging', label: 'Emerging: Some documentation, inconsistent standards', score: 25 },
            { value: 'defined', label: 'Defined: Documented policies, centralised catalogues', score: 50 },
            { value: 'managed', label: 'Managed: Automated quality checks, lineage tracking', score: 75 },
            { value: 'optimising', label: 'Optimising: Data mesh/fabric, real-time quality', score: 100 },
          ],
          weight: 2,
          sortOrder: 1,
        },
        {
          category: 'infrastructure',
          categoryLabel: 'Infrastructure',
          questionText: 'What is your current infrastructure readiness for AI workloads?',
          options: [
            { value: 'legacy', label: 'Legacy: On-prem only, limited cloud', score: 0 },
            { value: 'hybrid', label: 'Hybrid: Some cloud, manual provisioning', score: 25 },
            { value: 'cloud_first', label: 'Cloud-first: Primary workloads in cloud', score: 50 },
            { value: 'modern', label: 'Modern: IaC, containerisation, autoscaling', score: 75 },
            { value: 'ai_native', label: 'AI-native: GPU clusters, MLOps pipelines', score: 100 },
          ],
          weight: 2,
          sortOrder: 2,
        },
        {
          category: 'security',
          categoryLabel: 'Security Posture',
          questionText: 'How mature is your security and access control for AI systems?',
          options: [
            { value: 'basic', label: 'Basic: Passwords, ad-hoc permissions', score: 0 },
            { value: 'standard', label: 'Standard: RBAC, some encryption', score: 25 },
            { value: 'strong', label: 'Strong: SSO, encryption at rest/transit', score: 50 },
            { value: 'advanced', label: 'Advanced: Zero trust, secret management', score: 75 },
            { value: 'soc2', label: 'SOC 2 / ISO: Audited, compliance-ready', score: 100 },
          ],
          weight: 2,
          sortOrder: 3,
        },
        {
          category: 'culture',
          categoryLabel: 'Organisational Culture',
          questionText: 'How would you describe your organisation\'s readiness for AI adoption?',
          options: [
            { value: 'resistant', label: 'Resistant: Sceptical, fear of job loss', score: 0 },
            { value: 'exploring', label: 'Exploring: Some pilot interest, no strategy', score: 25 },
            { value: 'aligned', label: 'Aligned: Executive buy-in, pilot programs', score: 50 },
            { value: 'committed', label: 'Committed: AI roadmap, dedicated teams', score: 75 },
            { value: 'embedded', label: 'Embedded: AI-first mindset, continuous learning', score: 100 },
          ],
          weight: 1,
          sortOrder: 4,
        },
        {
          category: 'regulatory',
          categoryLabel: 'Regulatory & Compliance',
          questionText: 'What is your regulatory exposure and compliance maturity for AI?',
          options: [
            { value: 'unaware', label: 'Unaware: No formal consideration', score: 0 },
            { value: 'assessing', label: 'Assessing: Evaluating implications', score: 25 },
            { value: 'addressing', label: 'Addressing: Policies in development', score: 50 },
            { value: 'compliant', label: 'Compliant: Documented controls, regular audits', score: 75 },
            { value: 'leading', label: 'Leading: Proactive governance, industry benchmark', score: 100 },
          ],
          weight: 2,
          sortOrder: 5,
        },
        {
          category: 'data_maturity',
          categoryLabel: 'Data Maturity',
          questionText: 'Do you have structured, accessible data for AI training and inference?',
          options: [
            { value: 'no', label: 'No: Data locked in legacy systems', score: 0 },
            { value: 'partial', label: 'Partial: Some APIs, manual exports', score: 25 },
            { value: 'structured', label: 'Structured: Data warehouses, documented schemas', score: 50 },
            { value: 'integrated', label: 'Integrated: Real-time pipelines, feature stores', score: 75 },
            { value: 'ai_ready', label: 'AI-ready: Labeled datasets, versioning', score: 100 },
          ],
          weight: 2,
          sortOrder: 6,
        },
        {
          category: 'infrastructure',
          categoryLabel: 'Infrastructure',
          questionText: 'How do you currently deploy and monitor AI models/agents?',
          options: [
            { value: 'manual', label: 'Manual: No formal process', score: 0 },
            { value: 'ad_hoc', label: 'Ad-hoc: Some scripts, no monitoring', score: 25 },
            { value: 'standardised', label: 'Standardised: CI/CD for models', score: 50 },
            { value: 'automated', label: 'Automated: Full pipeline, basic observability', score: 75 },
            { value: 'mlops', label: 'MLOps: A/B tests, drift detection, rollback', score: 100 },
          ],
          weight: 1,
          sortOrder: 7,
        },
        {
          category: 'risk',
          categoryLabel: 'Risk & Governance',
          questionText: 'Do you have governance for AI decision-making and audit trails?',
          options: [
            { value: 'none', label: 'None: No formal governance', score: 0 },
            { value: 'planned', label: 'Planned: Governance on roadmap', score: 25 },
            { value: 'manual', label: 'Manual: Spreadsheet tracking, ad-hoc reviews', score: 50 },
            { value: 'systematic', label: 'Systematic: Decision logs, periodic audits', score: 75 },
            { value: 'comprehensive', label: 'Comprehensive: Immutable audit trail, bias monitoring', score: 100 },
          ],
          weight: 2,
          sortOrder: 8,
        },
      ],
    });
    console.log('Assessment questions seeded: 8');
  }

  // Agent marketplace: vendors and categories
  const vendorCount = await prisma.vendor.count();
  if (vendorCount === 0) {
    await prisma.agentCategory.createMany({
      data: [
        { name: 'Customer Support', slug: 'customer-support', description: 'Agents for support tickets, FAQs, and customer inquiries', sortOrder: 1 },
        { name: 'Sales & CRM', slug: 'sales-crm', description: 'Agents for lead qualification, pipeline, and sales automation', sortOrder: 2 },
        { name: 'HR & People', slug: 'hr-people', description: 'Agents for onboarding, internal Q&A, and people operations', sortOrder: 3 },
        { name: 'Document & Knowledge', slug: 'document-knowledge', description: 'Agents for search, summarisation, and knowledge management', sortOrder: 4 },
        { name: 'DevOps & Engineering', slug: 'devops-engineering', description: 'Agents for code review, debugging, and deployment', sortOrder: 5 },
      ],
    });
    const categories = await prisma.agentCategory.findMany({ orderBy: { sortOrder: 'asc' } });

    const vendor1 = await prisma.vendor.create({
      data: {
        name: 'AI Agents Forum',
        slug: 'ai-agents-forum',
        description: 'Official agents for forum infrastructure and community engagement',
        website: 'https://aiagentsforum.com',
        isVerified: true,
      },
    });

    const vendor2 = await prisma.vendor.create({
      data: {
        name: 'BuildStack',
        slug: 'buildstack',
        description: 'Developer tools and community agents',
        website: 'https://buildstack.io',
        isVerified: false,
      },
    });

    const catSupport = categories.find((c) => c.slug === 'customer-support');
    await prisma.marketplaceAgent.create({
      data: {
        vendorId: vendor1.id,
        categoryId: catSupport?.id,
        name: 'SupportBot Pro',
        slug: 'supportbot-pro',
        description: 'Handles common support questions, routes to humans when needed, learns from resolution history.',
        useCase: 'Customer Support',
        integrationRequirements: ['Zendesk', 'Intercom', 'Slack'],
        dataRequirements: ['Support KB', 'Ticket history', 'Product docs'],
        governanceScore: 85,
        roiEstimate: { metric: 'Resolution time', range: '30–50% reduction', description: 'Faster first response and deflection' },
        isVerified: true,
        isActive: true,
      },
    });

    await prisma.marketplaceAgent.create({
      data: {
        vendorId: vendor2.id,
        categoryId: catSupport?.id,
        name: 'DevHelper',
        slug: 'devhelper',
        description: 'Answers technical questions in developer communities. Integrates with GitHub and Stack Overflow.',
        useCase: 'Developer Support',
        integrationRequirements: ['GitHub', 'Slack', 'Discord'],
        dataRequirements: ['Codebase index', 'Documentation', 'Changelog'],
        governanceScore: 72,
        roiEstimate: { metric: 'Moderator load', range: '40% reduction', description: 'Fewer human moderators needed' },
        isVerified: false,
        isActive: true,
      },
    });

    console.log('Marketplace: vendors, categories, and sample agents seeded');
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
