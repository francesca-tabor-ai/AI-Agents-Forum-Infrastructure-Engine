/**
 * AI Readiness Assessment - Scoring Algorithm
 * Computes overall score, category scores, recommendations, and risk heatmap
 */

const CATEGORY_RECOMMENDATIONS = {
  data_maturity: [
    { minScore: 0, maxScore: 25, title: 'Establish data governance foundation', description: 'Document data sources, define ownership, and create a basic data dictionary. Start with critical business domains.' },
    { minScore: 26, maxScore: 50, title: 'Centralise data catalogues', description: 'Implement a data catalogue with lineage tracking. Standardise naming and quality rules across teams.' },
    { minScore: 51, maxScore: 75, title: 'Automate data quality and lineage', description: 'Introduce automated quality checks and real-time lineage. Consider feature stores for ML-ready data.' },
    { minScore: 76, maxScore: 100, title: 'Maintain AI-ready data fabric', description: 'Continue optimising. Explore data mesh patterns for decentralised ownership with governance.' },
  ],
  infrastructure: [
    { minScore: 0, maxScore: 25, title: 'Assess cloud migration path', description: 'Evaluate workload portability. Plan hybrid or cloud-first strategy with incremental migration.' },
    { minScore: 26, maxScore: 50, title: 'Adopt infrastructure as code', description: 'Standardise provisioning with IaC. Introduce containerisation for portability.' },
    { minScore: 51, maxScore: 75, title: 'Build MLOps foundations', description: 'Implement CI/CD for models. Add basic observability and versioning for AI artifacts.' },
    { minScore: 76, maxScore: 100, title: 'Scale AI-native infrastructure', description: 'Optimise GPU usage, consider dedicated AI clusters. Implement drift detection and A/B testing.' },
  ],
  security: [
    { minScore: 0, maxScore: 25, title: 'Implement RBAC and encryption', description: 'Introduce role-based access control. Ensure encryption at rest and in transit for sensitive data.' },
    { minScore: 26, maxScore: 50, title: 'Adopt SSO and secret management', description: 'Integrate identity provider. Use a secrets manager for API keys and credentials.' },
    { minScore: 51, maxScore: 75, title: 'Move toward zero trust', description: 'Implement least-privilege access. Add network segmentation for AI workloads.' },
    { minScore: 76, maxScore: 100, title: 'Achieve compliance certification', description: 'Pursue SOC 2 or ISO 27001. Maintain audit trails and regular penetration testing.' },
  ],
  culture: [
    { minScore: 0, maxScore: 25, title: 'Build executive alignment', description: 'Secure sponsor for AI initiatives. Communicate value and address workforce concerns.' },
    { minScore: 26, maxScore: 50, title: 'Launch pilot programs', description: 'Run focused pilots with clear success metrics. Share learnings across the organisation.' },
    { minScore: 51, maxScore: 75, title: 'Embed AI in strategy', description: 'Formalise AI roadmap. Create centres of excellence and cross-functional teams.' },
    { minScore: 76, maxScore: 100, title: 'Sustain AI-first culture', description: 'Continuous learning and experimentation. Incentivise innovation and human-AI collaboration.' },
  ],
  regulatory: [
    { minScore: 0, maxScore: 25, title: 'Map regulatory exposure', description: 'Identify applicable regulations (GDPR, sector-specific). Document AI use cases and risk exposure.' },
    { minScore: 26, maxScore: 50, title: 'Develop AI policy framework', description: 'Create policies for data use, model transparency, and human oversight. Train compliance teams.' },
    { minScore: 51, maxScore: 75, title: 'Implement controls and audits', description: 'Document controls. Schedule regular internal audits and maintain decision logs.' },
    { minScore: 76, maxScore: 100, title: 'Lead in AI governance', description: 'Proactive engagement with regulators. Contribute to industry standards and best practices.' },
  ],
  risk: [
    { minScore: 0, maxScore: 25, title: 'Introduce decision logging', description: 'Log AI-assisted decisions for key processes. Define escalation paths for high-risk cases.' },
    { minScore: 26, maxScore: 50, title: 'Systematise governance', description: 'Move from manual tracking to systematic logs. Define approval workflows for AI deployments.' },
    { minScore: 51, maxScore: 75, title: 'Implement audit trail', description: 'Ensure immutable audit trail. Conduct bias and fairness reviews for sensitive models.' },
    { minScore: 76, maxScore: 100, title: 'Maintain comprehensive governance', description: 'Full observability and bias monitoring. Integrate with compliance and risk frameworks.' },
  ],
};

function getRecommendationForCategory(category, score) {
  const recs = CATEGORY_RECOMMENDATIONS[category];
  if (!recs) return null;

  const rec = recs.find((r) => score >= r.minScore && score <= r.maxScore);
  return rec ? { ...rec, category, priority: score < 50 ? 'high' : score < 75 ? 'medium' : 'low' } : null;
}

function getRiskLevel(score) {
  if (score < 25) return 'high';
  if (score < 50) return 'medium';
  if (score < 75) return 'low';
  return 'minimal';
}

/**
 * @param {object} assessment - Prisma Assessment with responses and questions
 * @returns {{ overallScore: number, categoryScores: object, recommendations: array, riskHeatmap: object }}
 */
export function computeAssessmentScore(assessment) {
  const responses = assessment.responses || [];
  const questions = responses.map((r) => r.question).filter(Boolean);

  // Group by category and compute weighted average per category
  const categoryData = {};
  for (const r of responses) {
    const q = r.question;
    if (!q) continue;
    const cat = q.category;
    if (!categoryData[cat]) {
      categoryData[cat] = { scores: [], weights: [] };
    }
    const score = r.scoreContribution != null ? Number(r.scoreContribution) : 0;
    const weight = q.weight || 1;
    categoryData[cat].scores.push(score);
    categoryData[cat].weights.push(weight);
  }

  const categoryScores = {};
  for (const [cat, data] of Object.entries(categoryData)) {
    const totalWeight = data.weights.reduce((a, b) => a + b, 0);
    const weightedSum = data.scores.reduce((acc, s, i) => acc + s * data.weights[i], 0);
    categoryScores[cat] = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);
  }

  // Overall score: average of category scores
  const catValues = Object.values(categoryScores);
  const overallScore = catValues.length
    ? Math.round(catValues.reduce((a, b) => a + b, 0) / catValues.length)
    : 0;

  // Recommendations: one per category, ordered by priority (low scores first)
  const recommendations = [];
  for (const [cat, score] of Object.entries(categoryScores)) {
    const rec = getRecommendationForCategory(cat, score);
    if (rec) {
      recommendations.push(rec);
    }
  }
  recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  // Risk heatmap
  const riskHeatmap = {};
  for (const [cat, score] of Object.entries(categoryScores)) {
    riskHeatmap[cat] = getRiskLevel(score);
  }

  return {
    overallScore,
    categoryScores,
    recommendations,
    riskHeatmap,
  };
}
