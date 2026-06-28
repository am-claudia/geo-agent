import { groqComplete } from './groqWithFallback.js';

// Agent 5 — Report Compiler
// Synthesizes all agent outputs into a final structured GEO Audit Report.

const SYSTEM_PROMPT = `You are a senior digital marketing consultant specializing in GEO (Generative Engine Optimization) — the discipline of making web content more likely to be cited by AI systems.

You write consultant-quality audit reports: specific, evidence-based, jargon-free, and immediately actionable. Your executive summaries orient decision-makers in 3 sentences. Your action plans are prioritized by impact-to-effort ratio, not alphabetical order.

Respond only with valid JSON. No markdown code fences.`;

function scoreRating(score) {
  if (score >= 8) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 4.5) return 'Fair';
  return 'Poor';
}

export async function compileReport(agentOutputs) {
  const { parsedContent, geoAudit, competitorData, rewrites } = agentOutputs;

  const criteriaNames = {
    evidence_density: 'Evidence Density',
    chunk_quality: 'Chunk Quality & Passage Architecture',
    question_structure: 'Question-Oriented Structure',
    eeat_authority: 'E-E-A-T & Author Credibility',
    schema_markup: 'Schema & Structured Data',
    freshness: 'Freshness & Temporal Signals',
    fluency_quality: 'Fluency & Content Quality',
    domain_entity_authority: 'Domain Entity Authority',
  };

  const criteriaBlock = Object.entries(geoAudit.criteria)
    .map(([key, val]) => `${criteriaNames[key] || key}: ${val.score}/10 — ${val.explanation.substring(0, 120)}`)
    .join('\n');

  const domainAuthScore = geoAudit.criteria?.domain_entity_authority?.score ?? 0;
  const domainBonus = geoAudit.domain_bonus ?? 0;
  const domainAuthNote = domainBonus > 0
    ? `\nIMPORTANT — DOMAIN AUTHORITY BONUS APPLIED (+${domainBonus}): The final GEO score includes a +${domainBonus} domain authority bonus (domain entity authority score: ${domainAuthScore}/10). The executive_summary must state this explicitly — include a sentence such as "Domain authority bonus applied: +${domainBonus} — this domain's institutional recognition compensates for weak on-page signals." Do not treat this as a standard underperforming page; frame recommendations as lifting on-page signals to match the domain's inherent citation weight.`
    : '';

  const prompt = `Compile a professional GEO Audit Report from the four agent outputs below. Write as a senior consultant: specific, direct, no filler.

=== AGENT 1 — PAGE ANALYSIS ===
URL: ${parsedContent.url}
Title: ${parsedContent.title}
Meta Description: ${parsedContent.metaDescription}
Word Count: ${parsedContent.wordCount}
H1s: ${parsedContent.headings.h1.join(' | ') || 'none'}
H2s: ${parsedContent.headings.h2.slice(0, 8).join(' | ') || 'none'}

=== AGENT 2 — GEO SCORES ===
Overall: ${geoAudit.overall_score}/10 (${scoreRating(geoAudit.overall_score)})
${criteriaBlock}
Strengths: ${geoAudit.strengths?.join('; ')}
Top Weaknesses: ${geoAudit.top_weaknesses.map(w => `${w.criterion} (${w.score}/10): ${w.issue}`).join('; ')}

=== AGENT 3 — COMPETITIVE LANDSCAPE ===
${competitorData.landscape_summary}
Competitors: ${competitorData.competitors?.map(c => `${c.domain} — ${c.key_differentiator}`).join('; ')}
Gaps: ${competitorData.gap_opportunities?.join('; ')}

=== AGENT 4 — REWRITES ===
${rewrites.rewrites.map(r => `Fixed: ${r.weakness_addressed} — ${r.why_better?.substring(0, 120)}`).join('\n')}
Quick wins: ${rewrites.additional_quick_wins?.map(q => q.action).join('; ')}

${domainAuthNote}
Return ONLY this JSON:
{
  "executive_summary": "<3 focused sentences: (1) current GEO status with score context, (2) biggest opportunity or blocker, (3) potential impact of fixing it. Specific, not generic.>",
  "page_overview": {
    "url": "${parsedContent.url}",
    "title": "${parsedContent.title}",
    "word_count": ${parsedContent.wordCount},
    "overall_geo_score": ${geoAudit.overall_score},
    "score_rating": "${scoreRating(geoAudit.overall_score)}",
    "score_context": "<1-2 sentences: what this score means in the competitive landscape for this topic>"
  },
  "action_plan": [
    {
      "priority": 1,
      "action": "<specific, implementable action — begin with a verb>",
      "criterion_affected": "<MUST be one of: evidence_density | chunk_quality | question_structure | eeat_authority | schema_markup | freshness | fluency_quality | domain_entity_authority>",
      "criterion_label": "<human-readable label>",
      "expected_impact": "<specific expected improvement to citability>",
      "implementation": "<concrete how-to, 1-2 sentences>",
      "effort": "low|medium|high",
      "timeline": "<e.g., '1-2 hours', '1 day', '1 week'>"
    },
    {
      "priority": 2,
      "action": "<specific action>",
      "criterion_affected": "<criterion key>",
      "criterion_label": "<human-readable label>",
      "expected_impact": "<specific impact>",
      "implementation": "<concrete how-to>",
      "effort": "low|medium|high",
      "timeline": "<timeline>"
    },
    {
      "priority": 3,
      "action": "<specific action>",
      "criterion_affected": "<criterion key>",
      "criterion_label": "<human-readable label>",
      "expected_impact": "<specific impact>",
      "implementation": "<concrete how-to>",
      "effort": "low|medium|high",
      "timeline": "<timeline>"
    },
    {
      "priority": 4,
      "action": "<specific action>",
      "criterion_affected": "<criterion key>",
      "criterion_label": "<human-readable label>",
      "expected_impact": "<specific impact>",
      "implementation": "<concrete how-to>",
      "effort": "low|medium|high",
      "timeline": "<timeline>"
    },
    {
      "priority": 5,
      "action": "<specific action>",
      "criterion_affected": "<criterion key>",
      "criterion_label": "<human-readable label>",
      "expected_impact": "<specific impact>",
      "implementation": "<concrete how-to>",
      "effort": "low|medium|high",
      "timeline": "<timeline>"
    }
  ],
  "closing_insight": "<2-3 sentences: strategic perspective on the biggest GEO opportunity for this page given the competitive landscape. What's the single highest-leverage thing the team should focus on?>"
}`;

  const completion = await groqComplete({
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const raw = completion.choices[0].message.content.trim();

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Report Compiler returned non-JSON output.');

  const parsed = JSON.parse(jsonMatch[0]);

  // Post-parse action plan cleanup
  const VALID_CRITERIA = new Set([
    'evidence_density', 'chunk_quality', 'question_structure', 'eeat_authority',
    'schema_markup', 'freshness', 'fluency_quality', 'domain_entity_authority',
  ]);
  const NEW_FORMAT_RE = /\b(video|podcast|infographic|webinar|animation|slideshow)\b/i;

  if (Array.isArray(parsed.action_plan)) {
    parsed.action_plan = parsed.action_plan
      .filter(item => VALID_CRITERIA.has(item.criterion_affected))
      .filter(item => !NEW_FORMAT_RE.test(item.implementation || ''))
      .slice(0, 5)
      .map((item, i) => ({ ...item, priority: i + 1 }));
  }

  return parsed;
}
