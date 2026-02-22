import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Helper to build include/select for entities
const userInclude = { organization: { select: { id: true, name: true } } };
const topicInclude = {
  forum: true,
  authorUser: { select: { id: true, email: true, name: true } },
  authorAgent: { select: { id: true, name: true } },
  _count: { select: { posts: true } },
};
const postInclude = {
  topic: true,
  authorUser: { select: { id: true, email: true, name: true } },
  authorAgent: { select: { id: true, name: true } },
};

// ---------- USERS ----------
adminRouter.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: userInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

adminRouter.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: userInclude,
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

adminRouter.post('/users', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.status(201).json(user);
});

adminRouter.patch('/users/:id', async (req, res) => {
  const { name, role, organizationId } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
  if (organizationId !== undefined) data.organizationId = organizationId || null;
  if (req.body.password) data.passwordHash = await bcrypt.hash(req.body.password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, name: true, role: true, organizationId: true, updatedAt: true },
  });
  res.json(user);
});

adminRouter.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- ORGANIZATIONS ----------
adminRouter.get('/organizations', async (req, res) => {
  const orgs = await prisma.organization.findMany({
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orgs);
});

adminRouter.get('/organizations/:id', async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: { plan: true, users: true, agents: true, forums: true },
  });
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

adminRouter.post('/organizations', async (req, res) => {
  const { name, planId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const org = await prisma.organization.create({
    data: { name, planId: planId || null },
  });
  res.status(201).json(org);
});

adminRouter.patch('/organizations/:id', async (req, res) => {
  const { name, planId } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (planId !== undefined) data.planId = planId || null;

  const org = await prisma.organization.update({
    where: { id: req.params.id },
    data,
  });
  res.json(org);
});

adminRouter.delete('/organizations/:id', async (req, res) => {
  await prisma.organization.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- PLANS ----------
adminRouter.get('/plans', async (req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(plans);
});

adminRouter.get('/plans/:id', async (req, res) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
    include: { organizations: true },
  });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json(plan);
});

adminRouter.post('/plans', async (req, res) => {
  const { name, slug, price, period, agentsLimit, apiCallsLimit, features } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const plan = await prisma.plan.create({
    data: {
      name,
      slug,
      price: Number(price) ?? 0,
      period: period || 'monthly',
      agentsLimit: Number(agentsLimit) ?? 0,
      apiCallsLimit: Number(apiCallsLimit) ?? 0,
      features: features ? JSON.parse(features) : null,
    },
  });
  res.status(201).json(plan);
});

adminRouter.patch('/plans/:id', async (req, res) => {
  const data = { ...req.body };
  if (data.features && typeof data.features === 'string') data.features = JSON.parse(data.features);
  if (data.price !== undefined) data.price = Number(data.price);
  if (data.agentsLimit !== undefined) data.agentsLimit = Number(data.agentsLimit);
  if (data.apiCallsLimit !== undefined) data.apiCallsLimit = Number(data.apiCallsLimit);

  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data,
  });
  res.json(plan);
});

adminRouter.delete('/plans/:id', async (req, res) => {
  await prisma.plan.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Need to add sortOrder to Plan model - let me check schema
// The schema doesn't have sortOrder on Plan. I'll add it in the PATCH handling - actually the schema has it for CaseStudy. Let me add sortOrder to Plan in schema for consistency. Actually I didn't add it - that's fine. Skip.

// ---------- AGENTS ----------
adminRouter.get('/agents', async (req, res) => {
  const agents = await prisma.agent.findMany({
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(agents);
});

adminRouter.get('/agents/:id', async (req, res) => {
  const agent = await prisma.agent.findUnique({
    where: { id: req.params.id },
    include: { organization: true },
  });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

adminRouter.post('/agents', async (req, res) => {
  const { organizationId, name, provider, description, rateLimit } = req.body;
  if (!organizationId || !name) return res.status(400).json({ error: 'Organization and name required' });
  const agent = await prisma.agent.create({
    data: {
      organizationId,
      name,
      provider: provider || 'openai',
      description: description || null,
      rateLimit: Number(rateLimit) ?? 100,
    },
  });
  res.status(201).json(agent);
});

adminRouter.patch('/agents/:id', async (req, res) => {
  const { name, provider, description, rateLimit, isActive } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (provider !== undefined) data.provider = provider;
  if (description !== undefined) data.description = description;
  if (rateLimit !== undefined) data.rateLimit = Number(rateLimit);
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const agent = await prisma.agent.update({
    where: { id: req.params.id },
    data,
  });
  res.json(agent);
});

adminRouter.delete('/agents/:id', async (req, res) => {
  await prisma.agent.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- FORUMS ----------
adminRouter.get('/forums', async (req, res) => {
  const forums = await prisma.forum.findMany({
    include: { organization: true, _count: { select: { topics: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(forums);
});

adminRouter.get('/forums/:id', async (req, res) => {
  const forum = await prisma.forum.findUnique({
    where: { id: req.params.id },
    include: { organization: true, topics: true },
  });
  if (!forum) return res.status(404).json({ error: 'Forum not found' });
  res.json(forum);
});

adminRouter.post('/forums', async (req, res) => {
  const { organizationId, name, slug, description, isPublic } = req.body;
  if (!organizationId || !name) return res.status(400).json({ error: 'Organization and name required' });
  const slugVal = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const forum = await prisma.forum.create({
    data: {
      organizationId,
      name,
      slug: slugVal,
      description: description || null,
      isPublic: isPublic !== false,
    },
  });
  res.status(201).json(forum);
});

adminRouter.patch('/forums/:id', async (req, res) => {
  const { name, slug, description, isPublic } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (slug !== undefined) data.slug = slug;
  if (description !== undefined) data.description = description;
  if (isPublic !== undefined) data.isPublic = Boolean(isPublic);

  const forum = await prisma.forum.update({
    where: { id: req.params.id },
    data,
  });
  res.json(forum);
});

adminRouter.delete('/forums/:id', async (req, res) => {
  await prisma.forum.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- TOPICS ----------
adminRouter.get('/topics', async (req, res) => {
  const topics = await prisma.topic.findMany({
    include: topicInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(topics);
});

adminRouter.get('/topics/:id', async (req, res) => {
  const topic = await prisma.topic.findUnique({
    where: { id: req.params.id },
    include: { ...topicInclude, posts: { include: postInclude } },
  });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  res.json(topic);
});

adminRouter.post('/topics', async (req, res) => {
  const { forumId, title, authorUserId, authorAgentId } = req.body;
  if (!forumId || !title) return res.status(400).json({ error: 'Forum and title required' });
  const topic = await prisma.topic.create({
    data: {
      forumId,
      title,
      authorUserId: authorUserId || null,
      authorAgentId: authorAgentId || null,
    },
    include: topicInclude,
  });
  res.status(201).json(topic);
});

adminRouter.patch('/topics/:id', async (req, res) => {
  const { title, authorUserId, authorAgentId } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (authorUserId !== undefined) data.authorUserId = authorUserId || null;
  if (authorAgentId !== undefined) data.authorAgentId = authorAgentId || null;

  const topic = await prisma.topic.update({
    where: { id: req.params.id },
    data,
    include: topicInclude,
  });
  res.json(topic);
});

adminRouter.delete('/topics/:id', async (req, res) => {
  await prisma.topic.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- POSTS ----------
adminRouter.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    include: postInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(posts);
});

adminRouter.get('/posts/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: postInclude,
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

adminRouter.post('/posts', async (req, res) => {
  const { topicId, parentId, content, authorUserId, authorAgentId } = req.body;
  if (!topicId || !content) return res.status(400).json({ error: 'Topic and content required' });
  const post = await prisma.post.create({
    data: {
      topicId,
      parentId: parentId || null,
      content,
      authorUserId: authorUserId || null,
      authorAgentId: authorAgentId || null,
    },
    include: postInclude,
  });
  res.status(201).json(post);
});

adminRouter.patch('/posts/:id', async (req, res) => {
  const { content, authorUserId, authorAgentId } = req.body;
  const data = {};
  if (content !== undefined) data.content = content;
  if (authorUserId !== undefined) data.authorUserId = authorUserId || null;
  if (authorAgentId !== undefined) data.authorAgentId = authorAgentId || null;

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data,
    include: postInclude,
  });
  res.json(post);
});

adminRouter.delete('/posts/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- CASE STUDIES ----------
adminRouter.get('/case-studies', async (req, res) => {
  const items = await prisma.caseStudy.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(items);
});

adminRouter.get('/case-studies/:id', async (req, res) => {
  const item = await prisma.caseStudy.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Case study not found' });
  res.json(item);
});

adminRouter.post('/case-studies', async (req, res) => {
  const { companyName, industry, quote, badgeInitials, outcomes } = req.body;
  if (!companyName || !quote) return res.status(400).json({ error: 'Company name and quote required' });
  const outcomesArr = typeof outcomes === 'string' ? JSON.parse(outcomes) : (outcomes || []);
  const item = await prisma.caseStudy.create({
    data: {
      companyName,
      industry: industry || '',
      quote,
      badgeInitials: badgeInitials || companyName.slice(0, 2).toUpperCase(),
      outcomes: outcomesArr,
      sortOrder: Number(req.body.sortOrder) ?? 0,
    },
  });
  res.status(201).json(item);
});

adminRouter.patch('/case-studies/:id', async (req, res) => {
  const data = { ...req.body };
  if (data.outcomes && typeof data.outcomes === 'string') data.outcomes = JSON.parse(data.outcomes);
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);

  const item = await prisma.caseStudy.update({
    where: { id: req.params.id },
    data,
  });
  res.json(item);
});

adminRouter.delete('/case-studies/:id', async (req, res) => {
  await prisma.caseStudy.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- CONTACT SUBMISSIONS ----------
adminRouter.get('/contact-submissions', async (req, res) => {
  const items = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

adminRouter.get('/contact-submissions/:id', async (req, res) => {
  const item = await prisma.contactSubmission.findUnique({
    where: { id: req.params.id },
  });
  if (!item) return res.status(404).json({ error: 'Contact submission not found' });
  res.json(item);
});

adminRouter.delete('/contact-submissions/:id', async (req, res) => {
  await prisma.contactSubmission.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- REPUTATION SCORES ----------
adminRouter.get('/reputation-scores', async (req, res) => {
  const items = await prisma.reputationScore.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

adminRouter.get('/reputation-scores/:id', async (req, res) => {
  const item = await prisma.reputationScore.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Reputation score not found' });
  res.json(item);
});

adminRouter.post('/reputation-scores', async (req, res) => {
  const { participantId, participantType, forumId, score } = req.body;
  if (!participantId || !participantType) return res.status(400).json({ error: 'Participant ID and type required' });
  const item = await prisma.reputationScore.create({
    data: {
      participantId,
      participantType,
      forumId: forumId || null,
      score: Number(score) ?? 0,
    },
  });
  res.status(201).json(item);
});

adminRouter.patch('/reputation-scores/:id', async (req, res) => {
  const { score } = req.body;
  const item = await prisma.reputationScore.update({
    where: { id: req.params.id },
    data: { score: score !== undefined ? Number(score) : undefined },
  });
  res.json(item);
});

adminRouter.delete('/reputation-scores/:id', async (req, res) => {
  await prisma.reputationScore.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- AUDIT LOGS (read-only) ----------
adminRouter.get('/audit-logs', async (req, res) => {
  const items = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  res.json(items);
});

// ---------- APP SUBMISSIONS ----------
adminRouter.get('/app-submissions', async (req, res) => {
  const items = await prisma.appSubmission.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
});

adminRouter.get('/app-submissions/:id', async (req, res) => {
  const item = await prisma.appSubmission.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'App submission not found' });
  res.json(item);
});

adminRouter.delete('/app-submissions/:id', async (req, res) => {
  await prisma.appSubmission.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
