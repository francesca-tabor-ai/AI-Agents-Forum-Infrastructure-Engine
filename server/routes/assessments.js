/**
 * AI Readiness Assessment API
 * Phase 2: Assessment Engine
 */
import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware, attachUser, optionalAuthMiddleware } from '../middleware/auth.js';
import { computeAssessmentScore } from '../services/assessmentScoring.js';

export const assessmentsRouter = Router();

// Optional auth - attach user if token present
assessmentsRouter.use(optionalAuthMiddleware);
assessmentsRouter.use(attachUser);

// GET /api/assessment-questions - List all questions (public)
assessmentsRouter.get('/assessment-questions', async (req, res) => {
  try {
    const questions = await prisma.assessmentQuestion.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        category: true,
        categoryLabel: true,
        questionText: true,
        options: true,
        weight: true,
        sortOrder: true,
      },
    });
    res.json(questions);
  } catch (err) {
    console.error('Assessment questions error:', err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// GET /api/assessments - List user's assessments (requires auth) - must be before /:id
assessmentsRouter.get('/assessments', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        overallScore: true,
        submittedAt: true,
        createdAt: true,
      },
    });

    res.json(assessments);
  } catch (err) {
    console.error('List assessments error:', err);
    res.status(500).json({ error: 'Failed to list assessments' });
  }
});

// POST /api/assessments - Create new assessment
assessmentsRouter.post('/assessments', async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const organizationId = req.user?.organizationId ?? null;

    const assessment = await prisma.assessment.create({
      data: {
        userId,
        organizationId,
        status: 'draft',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json(assessment);
  } catch (err) {
    console.error('Create assessment error:', err);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// GET /api/assessments/:id - Get assessment with responses
assessmentsRouter.get('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            question: {
              select: {
                id: true,
                category: true,
                categoryLabel: true,
                questionText: true,
                options: true,
                sortOrder: true,
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Optional: restrict to owner if authenticated
    if (req.user && assessment.userId && assessment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: assessment.id,
      status: assessment.status,
      overallScore: assessment.overallScore,
      categoryScores: assessment.categoryScores,
      recommendations: assessment.recommendations,
      riskHeatmap: assessment.riskHeatmap,
      submittedAt: assessment.submittedAt,
      createdAt: assessment.createdAt,
      responses: assessment.responses.map((r) => ({
        questionId: r.questionId,
        question: r.question,
        answerValue: r.answerValue,
        scoreContribution: r.scoreContribution,
      })),
    });
  } catch (err) {
    console.error('Get assessment error:', err);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

// POST /api/assessments/:id/responses - Upsert responses (batch)
assessmentsRouter.post('/assessments/:id/responses', async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body; // [{ questionId, answerValue }]

    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'responses must be a non-empty array' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { responses: true },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status === 'submitted') {
      return res.status(400).json({ error: 'Cannot modify submitted assessment' });
    }

    const questions = await prisma.assessmentQuestion.findMany();
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    for (const { questionId, answerValue } of responses) {
      const question = questionMap.get(questionId);
      if (!question) continue;

      const options = question.options;
      const option = Array.isArray(options)
        ? options.find((o) => o.value === answerValue)
        : null;
      const scoreContribution = option?.score ?? null;

      await prisma.assessmentResponse.upsert({
        where: {
          assessmentId_questionId: { assessmentId: id, questionId },
        },
        create: {
          assessmentId: id,
          questionId,
          answerValue,
          scoreContribution,
        },
        update: {
          answerValue,
          scoreContribution,
        },
      });
    }

    const updated = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            question: { select: { id: true, category: true } },
          },
        },
      },
    });

    res.json({
      id: updated.id,
      responseCount: updated.responses.length,
      message: 'Responses saved',
    });
  } catch (err) {
    console.error('Save responses error:', err);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

// POST /api/assessments/:id/submit - Submit and compute score
assessmentsRouter.post('/assessments/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.status === 'submitted') {
      return res.status(400).json({ error: 'Assessment already submitted' });
    }

    const result = computeAssessmentScore(assessment);
    const { overallScore, categoryScores, recommendations, riskHeatmap } = result;

    await prisma.assessment.update({
      where: { id },
      data: {
        status: 'submitted',
        overallScore,
        categoryScores,
        recommendations,
        riskHeatmap,
        submittedAt: new Date(),
      },
    });

    res.json({
      id,
      status: 'submitted',
      overallScore,
      categoryScores,
      recommendations,
      riskHeatmap,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});
