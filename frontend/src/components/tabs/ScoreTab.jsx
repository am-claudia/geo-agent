import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ScoreTab.module.css';

const CRITERIA = [
  {
    key: 'evidence_density', label: 'Evidence Density', weight: 20, shortLabel: 'Evidence',
    description: 'How much factual, verifiable evidence — statistics, data points, citations, named sources — appears in your content. AI citation systems strongly favor content that backs every claim with specifics rather than vague generalities.',
    howToFix: 'Add concrete numbers, cite named studies or reports, and include attributable quotes. Replace phrases like "many experts say" with "According to [Source], X% of…"',
  },
  {
    key: 'chunk_quality', label: 'Chunk Quality', weight: 18, shortLabel: 'Chunks',
    description: 'Whether your content is organized into clean, self-contained passages that an AI can extract as a standalone answer. Poor chunking — walls of text, buried answers — makes your content harder to cite directly.',
    howToFix: 'Use short paragraphs (3–5 sentences), clear subheadings, and put the direct answer at the start of each section before expanding on it.',
  },
  {
    key: 'fluency_quality', label: 'Fluency & Content Quality', weight: 15, shortLabel: 'Fluency',
    description: 'The overall clarity, readability, and grammatical quality of your writing. AI systems are more likely to reproduce — and credit — fluent, well-structured prose over awkward or error-prone text.',
    howToFix: 'Proofread for grammar and clarity, avoid jargon without explanation, and prefer active voice and short sentences.',
  },
  {
    key: 'question_structure', label: 'Question-Oriented Structure', weight: 12, shortLabel: 'Q&A',
    description: 'How well your content is structured around questions real users ask. AI systems are built to answer questions, so aligning your headings and sections with search queries and FAQ patterns dramatically increases citation likelihood.',
    howToFix: 'Rewrite section headings as questions ("What is…?", "How do I…?"), and add an FAQ section targeting common queries in your topic area.',
  },
  {
    key: 'eeat_authority', label: 'E-E-A-T & Author Credibility', weight: 12, shortLabel: 'E-E-A-T',
    description: 'Experience, Expertise, Authoritativeness, and Trustworthiness signals. This includes visible author bylines, credentials, author bios, institutional affiliations, and about pages. A score of 0 means none of these signals were detected.',
    howToFix: 'Add an author byline with credentials, link to an author bio page, include an "About" section, and mention any relevant certifications, experience, or institutional backing.',
  },
  {
    key: 'freshness', label: 'Freshness Signals', weight: 10, shortLabel: 'Freshness',
    description: 'Visible indicators that your content is current — publication dates, "last updated" timestamps, and references to recent events or data. AI systems prefer up-to-date sources, especially for time-sensitive topics. A score of 0 means no freshness signals were found.',
    howToFix: 'Add a visible publication date and "Last updated" timestamp to every page. Reference recent data (within the past 1–2 years) and update content regularly.',
  },
  {
    key: 'schema_markup', label: 'Schema & Structured Data', weight: 8, shortLabel: 'Schema',
    description: 'Machine-readable markup (JSON-LD, microdata) that tells AI systems exactly what your content is — an article, a FAQ, a product, a review. Schema.org markup helps AI parse and classify your content more accurately. A score of 0 means no structured data was detected.',
    howToFix: 'Add JSON-LD markup for Article, FAQPage, or BreadcrumbList schema. Tools like Google\'s Rich Results Test can validate your implementation.',
  },
  {
    key: 'domain_entity_authority', label: 'Domain Entity Authority', weight: 5, shortLabel: 'Authority',
    description: 'How strongly your domain is recognized as an authority on this specific topic across the web. This is built over time through consistent topical focus, inbound links from relevant sources, and being mentioned alongside established entities in the field.',
    howToFix: 'Publish consistently on your core topic, earn backlinks from authoritative sources in your niche, and ensure your brand is mentioned alongside credible entities.',
  },
];

function scoreColor(score) {
  if (score >= 7) return '#10b981';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function scoreColorProportional(score) {
  if (score >= 7) {
    const t = (score - 7) / 3;
    return `hsl(160, ${Math.round(55 + t * 29)}%, ${Math.round(32 + t * 10)}%)`;
  }
  if (score >= 4) {
    const t = (score - 4) / 2;
    return `hsl(38, ${Math.round(60 + t * 32)}%, ${Math.round(36 + t * 8)}%)`;
  }
  const t = score / 3;
  return `hsl(0, ${Math.round(55 + t * 27)}%, ${Math.round(33 + t * 12)}%)`;
}

function scoreRating(score) {
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  return 'Poor';
}

function citationLikelihood(score) {
  if (score >= 8) return { label: 'High',          color: '#10b981' };
  if (score >= 6) return { label: 'Moderate–High', color: '#6366f1' };
  if (score >= 4) return { label: 'Moderate',      color: '#f59e0b' };
  return              { label: 'Low',            color: '#ef4444' };
}

function severityInfo(score) {
  if (score < 4) return { label: 'Critical',   color: '#ef4444' };
  if (score < 7) return { label: 'Needs Work', color: '#f59e0b' };
  return              { label: 'Strong',      color: '#10b981' };
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ─── Gauge Circle ─────────────────────────────────────────────────────────────

function GaugeCircle({ score, domain_bonus }) {
  const RADIUS = 80;
  const C = 2 * Math.PI * RADIUS;
  const RED_LEN    = 0.5 * C;
  const ORANGE_LEN = 0.2 * C;
  const GREEN_LEN  = 0.3 * C;
  const pct    = Math.min(1, Math.max(0, score / 10));
  const offset = C * (1 - pct);
  const color  = scoreColor(score);
  const rating = scoreRating(score);
  const displayScore = useCountUp(score, 800);
  const citation = citationLikelihood(score);
  const ts = { transformOrigin: 'center', transform: 'rotate(-90deg)' };

  return (
    <div className={styles.gaugeWrap}>
      <div className={styles.gaugeSvgWrap}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <filter id="geoGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#ef4444" strokeWidth="14"
            strokeLinecap="butt" strokeOpacity="0.2"
            strokeDasharray={`${RED_LEN} ${C - RED_LEN}`} style={ts} />
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#f59e0b" strokeWidth="14"
            strokeLinecap="butt" strokeOpacity="0.2"
            strokeDasharray={`${ORANGE_LEN} ${C - ORANGE_LEN}`}
            strokeDashoffset={C - RED_LEN} style={ts} />
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#10b981" strokeWidth="14"
            strokeLinecap="butt" strokeOpacity="0.2"
            strokeDasharray={`${GREEN_LEN} ${C - GREEN_LEN}`}
            strokeDashoffset={C - RED_LEN - ORANGE_LEN} style={ts} />
          <motion.circle
            cx="100" cy="100" r={RADIUS}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            style={ts}
            filter="url(#geoGlow)"
          />
        </svg>
        <div className={styles.gaugeCenter}>
          <motion.span
            className={styles.gaugeScore}
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            {displayScore.toFixed(1)}
          </motion.span>
          <span className={styles.gaugeMax}>/10</span>
          <span className={styles.gaugeRating}>{rating}</span>
        </div>
      </div>
      <div className={styles.gaugeBelow}>
        <div className={styles.citationPill} style={{ color: citation.color, borderColor: citation.color }}>
          Citation Likelihood: <strong>{citation.label}</strong>
        </div>
        {domain_bonus > 0 && (
          <span className={styles.domainBonusNote}>
            + {domain_bonus} domain authority bonus applied
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Criteria Score List ──────────────────────────────────────────────────────

function CriteriaScoreList({ criteria }) {
  const [animatedBar, setAnimatedBar] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedBar(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.criteriaListWrap}>
      <span className={styles.criteriaListHeader}>Score Breakdown — click any row for details</span>
      {CRITERIA.map((c, i) => {
        const score = criteria?.[c.key]?.score ?? 0;
        const color = scoreColor(score);
        const isExpanded = expanded === c.key;
        const explanation = criteria?.[c.key]?.explanation;
        const evidence = criteria?.[c.key]?.evidence;
        const hasApiDetail = !!(explanation || evidence);
        const notDetected = score === 0 && !hasApiDetail;

        return (
          <div key={c.key}>
            <div
              className={`${styles.criteriaListRow} ${styles.criteriaListRowClickable} ${isExpanded ? styles.criteriaListRowActive : ''}`}
              onClick={() => setExpanded(isExpanded ? null : c.key)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isExpanded ? null : c.key); }}
            >
              <span className={styles.criteriaListLabel}>{c.label}</span>
              <div className={styles.criteriaListTrack}>
                <div
                  className={styles.criteriaListFill}
                  style={{
                    backgroundColor: color,
                    width: animatedBar ? `${(score / 10) * 100}%` : '0%',
                    transition: `width 0.5s ease ${i * 0.05}s`,
                  }}
                />
              </div>
              <span className={styles.criteriaListScore} style={{ color }}>
                {score}/10
              </span>
              <span className={styles.criteriaListWeight}>{c.weight}%</span>
              <motion.span
                className={styles.criteriaListChevron}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.18 }}
              >
                ▾
              </motion.span>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={styles.criteriaDetail}>
                    {hasApiDetail ? (
                      <>
                        {explanation && (
                          <p className={styles.criteriaDetailText}>{explanation}</p>
                        )}
                        {evidence && (
                          <div className={styles.criteriaDetailEvidence}>
                            <span className={styles.criteriaDetailEvidenceLabel}>Evidence:</span> {evidence}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {notDetected && (
                          <p className={styles.criteriaDetailNotDetected}>Not detected in your content.</p>
                        )}
                        {c.description && (
                          <p className={styles.criteriaDetailText}>{c.description}</p>
                        )}
                        {c.howToFix && (
                          <div className={styles.criteriaDetailEvidence}>
                            <span className={styles.criteriaDetailEvidenceLabel}>How to improve:</span> {c.howToFix}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Score Composition Bar ────────────────────────────────────────────────────

function ScoreCompositionBar({ criteria, overall_score, domain_bonus }) {
  const [animatedBar, setAnimatedBar] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedBar(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.compositionSection}>
      <div className={styles.compositionHeaderRow}>
        <span className={styles.compositionLabel}>HOW YOUR SCORE IS BUILT</span>
        <div className={styles.compositionHeaderRight}>
          <span className={styles.compositionTotal}>
            Weighted total: {overall_score?.toFixed(1)}/10
          </span>
          {domain_bonus > 0 && (
            <span className={styles.compositionBonusPill}>
              +{domain_bonus} domain bonus
            </span>
          )}
        </div>
      </div>
      <div className={styles.compositionBar}>
        {CRITERIA.map((c, i) => {
          const score = criteria?.[c.key]?.score ?? 0;
          const contribution = (score / 10) * c.weight;
          const color = scoreColorProportional(score);
          const isFirst = i === 0;
          const isLast = i === CRITERIA.length - 1;
          const borderRadius = isFirst ? '8px 0 0 8px' : isLast ? '0 8px 8px 0' : '0';
          return (
            <div
              key={c.key}
              className={styles.compositionSegment}
              style={{
                width: animatedBar ? `${contribution}%` : '0%',
                backgroundColor: color,
                borderRadius,
                transition: `width 0.6s ease ${i * 0.06}s`,
              }}
            >
              {contribution > 5 && (
                <span className={styles.compositionSegmentLabel}>{c.shortLabel}</span>
              )}
            </div>
          );
        })}
        <div className={styles.compositionBarEmpty} />
      </div>
      <div className={styles.compositionLegendGrid}>
        {CRITERIA.map(c => {
          const score = criteria?.[c.key]?.score ?? 0;
          const color = scoreColorProportional(score);
          const pts = (score * c.weight / 100).toFixed(1);
          return (
            <div key={c.key} className={styles.compositionLegendCard}>
              <div className={styles.compositionLegendTop}>
                <span className={styles.compositionLegendDot} style={{ background: color }} />
                <span className={styles.compositionLegendShort}>{c.shortLabel}</span>
              </div>
              <span className={styles.compositionLegendPts} style={{ color }}>+{pts}pts</span>
              <span className={styles.compositionLegendScore} style={{ color }}>{score}/10</span>
              <div className={styles.compositionLegendMiniTrack}>
                <div
                  className={styles.compositionLegendMiniFill}
                  style={{
                    backgroundColor: color,
                    width: animatedBar ? `${(score / 10) * 100}%` : '0%',
                    transition: `width 0.6s ease`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Priority Fix Callout ─────────────────────────────────────────────────────

function PriorityFixCallout({ top_weaknesses, criteria }) {
  if (!top_weaknesses?.length) return null;

  const opportunity = top_weaknesses
    .map((w) => ({ ...w, criteriaInfo: CRITERIA.find((c) => c.key === w.criterion) }))
    .filter((w) => w.criteriaInfo)
    .sort((a, b) => b.criteriaInfo.weight - a.criteriaInfo.weight)[0];

  if (!opportunity) return null;

  const score = criteria?.[opportunity.criterion]?.score ?? 0;
  const weight = opportunity.criteriaInfo.weight;
  const currentContrib = ((score / 10) * weight).toFixed(1);
  const fixedContrib = (0.8 * weight).toFixed(1);
  const delta = (parseFloat(fixedContrib) - parseFloat(currentContrib)).toFixed(1);

  return (
    <div className={styles.priorityCallout}>
      <div className={styles.priorityLeft}>
        <div className={styles.priorityHeader}>
          <span className={styles.priorityTag}>BIGGEST OPPORTUNITY</span>
          <span className={styles.priorityCriterionName}>{opportunity.criteriaInfo.label}</span>
          <span className={styles.priorityScoreBadge} style={{ color: scoreColor(score) }}>{score}/10</span>
        </div>
        {opportunity.issue && <p className={styles.priorityIssue}>{opportunity.issue}</p>}
        {opportunity.impact && (
          <p className={styles.priorityImpact}><strong>Impact:</strong> {opportunity.impact}</p>
        )}
      </div>
      <div className={styles.priorityRight}>
        <div className={styles.priorityGainRow}>
          <span className={styles.priorityGainLabel}>Current contribution</span>
          <span className={styles.priorityGainValue}>{currentContrib} pts</span>
        </div>
        <div className={styles.priorityGainRow}>
          <span className={styles.priorityGainLabel}>If fixed to 8/10</span>
          <span className={styles.priorityGainValue}>{fixedContrib} pts</span>
        </div>
        <div className={styles.priorityGainDelta}>
          +{delta} pts potential score increase
          <span className={styles.priorityGainNote}> (estimated)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Criterion Card ───────────────────────────────────────────────────────────

function CriterionCard({ criterion, data, index }) {
  const score = data?.score ?? 0;
  const color = scoreColor(score);
  const { label: sevLabel, color: sevColor } = severityInfo(score);
  const borderLeft = score < 4 ? '3px solid #ef4444' : score < 7 ? '3px solid #f59e0b' : undefined;

  return (
    <motion.div
      className={styles.criterionCard}
      style={borderLeft ? { borderLeft } : undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <div className={styles.criterionHeader}>
        <span className={styles.criterionLabel}>{criterion.label}</span>
        <span
          className={styles.criterionBadge}
          style={{
            color,
            borderColor: color,
            background: score < 4 ? 'rgba(239,68,68,0.15)' : score < 7 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          }}
        >
          {score}/10
        </span>
      </div>

      <div className={styles.criterionBarRow}>
        <div className={styles.criterionBarTrack}>
          <motion.div
            className={styles.criterionBarFill}
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.7, delay: index * 0.05 + 0.15, ease: 'easeOut' }}
          />
        </div>
        <span className={styles.criterionWeight}>{criterion.weight}% of score</span>
      </div>

      <span
        className={styles.severityTag}
        style={{ color: sevColor, borderColor: sevColor, background: `${sevColor}26` }}
      >
        {sevLabel}
      </span>

      {data?.explanation && (
        <p className={styles.criterionExplanation}>{data.explanation}</p>
      )}

      {data?.evidence && (
        <div className={styles.evidenceInline}>
          <span className={styles.evidenceLabel}>Evidence:</span> {data.evidence}
        </div>
      )}
    </motion.div>
  );
}

// ─── Strengths List ───────────────────────────────────────────────────────────

function StrengthsList({ strengths }) {
  return (
    <div className={styles.strengthsSection}>
      <h2 className={styles.strengthsHeading}>IDENTIFIED STRENGTHS</h2>
      {strengths?.length > 0 ? (
        <div className={styles.strengthsPills}>
          {strengths.map((s, i) => (
            <span key={i} className={styles.strengthPill}>&#10003; {s}</span>
          ))}
        </div>
      ) : (
        <p className={styles.strengthsEmpty}>
          No standout strengths identified — focus on the action plan.
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScoreTab({ geoAudit }) {
  if (!geoAudit) return <div className={styles.empty}>Score data not available.</div>;

  const {
    overall_score = 0,
    criteria = {},
    strengths = [],
    top_weaknesses = [],
    domain_bonus = 0,
  } = geoAudit;

  const sortedCriteria = CRITERIA
    .filter((c) => criteria[c.key] != null)
    .sort((a, b) => (criteria[a.key]?.score ?? 0) - (criteria[b.key]?.score ?? 0));

  const hasCritical = CRITERIA.some((c) => (criteria?.[c.key]?.score ?? 10) < 5);

  const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className={styles.page}>
      <motion.div className={styles.heroCard} {...fadeUp(0)}>
        <div className={styles.heroLeft}>
          <GaugeCircle score={overall_score} domain_bonus={domain_bonus} />
        </div>
        <div className={styles.heroDivider} />
        <div className={styles.heroRight}>
          <CriteriaScoreList criteria={criteria} />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <ScoreCompositionBar criteria={criteria} overall_score={overall_score} domain_bonus={domain_bonus} />
      </motion.div>

      {hasCritical && top_weaknesses.length > 0 && (
        <motion.div {...fadeUp(0.2)}>
          <PriorityFixCallout top_weaknesses={top_weaknesses} criteria={criteria} />
        </motion.div>
      )}

      <motion.div {...fadeUp(0.3)}>
        <div className={styles.criteriaSection}>
          <div className={styles.criteriaGrid}>
            {sortedCriteria.map((c, i) => (
              <CriterionCard key={c.key} criterion={c} data={criteria[c.key]} index={i} />
            ))}
          </div>
          <div className={styles.domainBonusRow}>
            {domain_bonus > 0 ? (
              <span className={styles.domainBonusPositive}>
                Domain Authority Bonus: +{domain_bonus} applied to final score
              </span>
            ) : (
              <span className={styles.domainBonusNone}>No domain authority bonus applied</span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.4)}>
        <StrengthsList strengths={strengths} />
      </motion.div>
    </div>
  );
}
