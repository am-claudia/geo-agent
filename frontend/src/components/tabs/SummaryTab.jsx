import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/scoreColor.js';
import styles from './SummaryTab.module.css';

function stripMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1');
}

const CRITERIA_LABELS = {
  authority:               'Authority & Credibility',
  structural_clarity:      'Structural Clarity',
  quotability:             'Quotability',
  comprehensiveness:       'Comprehensiveness',
  semantic_clarity:        'Semantic Clarity',
  freshness:               'Freshness Signals',
  question_answering:      'Q&A Format',
  evidence_density:        'Evidence Density',
  chunk_quality:           'Chunk Quality',
  question_structure:      'Question-Oriented Structure',
  eeat_authority:          'E-E-A-T & Author Credibility',
  schema_markup:           'Schema & Structured Data',
  fluency_quality:         'Fluency & Content Quality',
  domain_entity_authority: 'Domain Entity Authority',
};

function scoreLabel(score) {
  if (score >= 8.5) return 'Excellent';
  if (score >= 7)   return 'Good';
  if (score >= 4)   return 'Fair';
  return 'Needs Work';
}

function citationLabel(domainScore, overallScore) {
  if (domainScore >= 8 && overallScore >= 6) return 'Very High';
  if (domainScore >= 8)                      return 'High';
  if (domainScore >= 6)                      return 'Moderate–High';
  if (overallScore >= 5)                     return 'Moderate';
  return 'Low';
}

function effortColor(effort) {
  if (effort === 'high')   return '#ef4444';
  if (effort === 'medium') return '#f97316';
  return '#22c55e';
}

function StatCard({ label, value, sub, color, delay }) {
  return (
    <motion.div
      className={styles.statCard}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <span className={styles.statValue} style={color ? { color } : {}}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </motion.div>
  );
}

export default function SummaryTab({ geoAudit, finalReport, competitorData, parsedContent }) {
  if (!geoAudit && !finalReport) {
    return <div className={styles.empty}>Summary not available.</div>;
  }

  const score         = geoAudit?.overall_score ?? 0;
  const color         = getScoreColor(score);
  const criteria      = geoAudit?.criteria ?? {};
  const strengths     = geoAudit?.strengths ?? [];
  const weaknesses    = geoAudit?.top_weaknesses ?? [];
  const actionPlan    = finalReport?.action_plan ?? [];
  const summary       = finalReport?.executive_summary ?? '';
  const competitors   = competitorData?.competitors ?? [];
  const domainScore   = criteria.domain_entity_authority?.score ?? 0;
  const wordCount     = parsedContent?.word_count;

  // Top 3 actions to preview
  const topActions = actionPlan.slice(0, 3);

  // Weakest 3 criteria for the radar preview
  const sortedCriteria = Object.entries(criteria).sort(([, a], [, b]) => a.score - b.score);
  const weakestCriteria = sortedCriteria.slice(0, 3);
  const strongestCriteria = sortedCriteria.slice(-3).reverse();

  return (
    <div className={styles.page}>

      {/* ── Score hero ── */}
      <motion.div
        className={styles.scoreHero}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.scoreHeroLeft}>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreNumber} style={{ color }}>{score.toFixed(1)}</span>
            <span className={styles.scoreDenom}>/10</span>
          </div>
          <span className={styles.scoreVerdict}>{scoreLabel(score)}</span>
          <span className={styles.scoreSub}>GEO Score</span>
        </div>

        <div className={styles.scoreHeroDivider} />

        <div className={styles.scoreHeroRight}>
          {summary ? (
            <p className={styles.summaryText}>{summary}</p>
          ) : (
            <p className={styles.summaryText} style={{ opacity: 0.45 }}>No executive summary available.</p>
          )}
        </div>
      </motion.div>

      {/* ── At-a-glance stats ── */}
      <div className={styles.statsRow}>
        <StatCard
          label="GEO Score"
          value={score.toFixed(1)}
          sub={scoreLabel(score)}
          color={color}
          delay={0.05}
        />
        <StatCard
          label="Citation Likelihood"
          value={citationLabel(domainScore, score)}
          delay={0.1}
        />
        {wordCount != null && (
          <StatCard
            label="Word Count"
            value={wordCount.toLocaleString()}
            delay={0.15}
          />
        )}
        <StatCard
          label="Competitors Found"
          value={competitors.length}
          delay={0.2}
        />
        <StatCard
          label="Actions Generated"
          value={actionPlan.length}
          delay={0.25}
        />
      </div>

      {/* ── Strengths & Weaknesses ── */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <motion.div
          className={styles.swRow}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {strengths.length > 0 && (
            <div className={styles.swCard}>
              <h3 className={styles.swHeading} style={{ color: '#22c55e' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Strengths
              </h3>
              <ul className={styles.swList}>
                {strengths.map((s, i) => (
                  <li key={i} className={styles.swItem}>
                    <span className={styles.swDot} style={{ background: '#22c55e' }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className={styles.swCard}>
              <h3 className={styles.swHeading} style={{ color: '#ef4444' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Top Weaknesses
              </h3>
              <ul className={styles.swList}>
                {weaknesses.map((w, i) => (
                  <li key={i} className={styles.swItem}>
                    <span className={styles.swDot} style={{ background: '#ef4444' }} />
                    <span>
                      <strong>{CRITERIA_LABELS[w.criterion] || w.criterion}</strong>
                      {w.feedback ? ` — ${w.feedback}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Score breakdown mini-bars ── */}
      {sortedCriteria.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className={styles.sectionTitle}>Score Breakdown</h2>
          <div className={styles.criteriaList}>
            {sortedCriteria.map(([key, val], i) => {
              const c = getScoreColor(val.score);
              return (
                <motion.div
                  key={key}
                  className={styles.criteriaRow}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                >
                  <span className={styles.criteriaName}>{CRITERIA_LABELS[key] || key}</span>
                  <div className={styles.criteriaBarWrap}>
                    <motion.div
                      className={styles.criteriaBar}
                      style={{ background: c }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(val.score / 10) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.25 + i * 0.04, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={styles.criteriaScore} style={{ color: c }}>{val.score}/10</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Top priority actions ── */}
      {topActions.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h2 className={styles.sectionTitle}>Top Priority Actions</h2>
          <p className={styles.sectionHint}>Highest-impact improvements from the Action Plan tab.</p>
          <div className={styles.actionList}>
            {topActions.map((item, i) => (
              <motion.div
                key={i}
                className={styles.actionItem}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.07 }}
              >
                <div className={styles.actionNode} style={{ background: effortColor(item.effort) }}>
                  {item.priority ?? i + 1}
                </div>
                <div className={styles.actionContent}>
                  <span className={styles.actionTitle}>{item.action}</span>
                  {item.effort && (
                    <span
                      className={styles.actionEffort}
                      style={{ color: effortColor(item.effort) }}
                    >
                      {item.effort} effort
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Competitor snapshot ── */}
      {competitors.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Competitor Snapshot</h2>
          {competitorData?.landscape_summary && (
            <p className={styles.landscapeText}>{competitorData.landscape_summary}</p>
          )}
          <div className={styles.competitorList}>
            {competitors.slice(0, 4).map((c, i) => (
              <motion.div
                key={i}
                className={styles.competitorItem}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.06 }}
              >
                <span className={styles.competitorRank}>#{i + 1}</span>
                <div className={styles.competitorInfo}>
                  <span className={styles.competitorDomain}>{c.domain}</span>
                  {c.key_differentiator && (
                    <span className={styles.competitorDiff}>{stripMarkdown(c.key_differentiator)}</span>
                  )}
                </div>
                {c.geo_strengths?.length > 0 && (
                  <div className={styles.competitorTags}>
                    {c.geo_strengths.slice(0, 1).map((s, j) => (
                      <span key={j} className={styles.competitorTag}>{stripMarkdown(s)}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}
