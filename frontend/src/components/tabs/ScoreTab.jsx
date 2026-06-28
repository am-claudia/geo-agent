import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from '../../utils/scoreColor.js';
import styles from './ScoreTab.module.css';

const CRITERIA_EXPLAINER = [
  { icon: '📊', name: 'Quotability', desc: 'Clear, citable statements AI can lift verbatim' },
  { icon: '🏅', name: 'Authority & Credibility', desc: 'Expertise signals: credentials, data sources, author info' },
  { icon: '❓', name: 'Q&A Format', desc: 'Directly answers questions the way users prompt AI' },
  { icon: '🗂️', name: 'Structural Clarity', desc: 'Headings organized so AI can parse and extract key points' },
  { icon: '📖', name: 'Comprehensiveness', desc: 'Covers the topic thoroughly to be the definitive source' },
  { icon: '🎯', name: 'Semantic Clarity', desc: 'Precise language, free of ambiguity, easy for AI to interpret' },
  { icon: '🕐', name: 'Freshness Signals', desc: 'Publication dates or updates that signal ongoing relevance' },
  { icon: '🌐', name: 'Domain Authority', desc: 'Domain recognized as authoritative in LLM training data' },
];

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
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  return 'Needs Work';
}

function citationLikelihood(domainScore, overallScore) {
  if (domainScore >= 8 && overallScore >= 6) return { label: 'Very High',     color: '#22c55e' };
  if (domainScore >= 8)                      return { label: 'High',          color: '#4ade80' };
  if (domainScore >= 6)                      return { label: 'Moderate–High', color: '#f97316' };
  if (overallScore >= 5)                     return { label: 'Moderate',      color: '#d97706' };
  return                                            { label: 'Low',           color: '#ef4444' };
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function Chevron({ open }) {
  return (
    <svg
      className={`${styles.chevronIcon} ${open ? styles.chevronOpen : ''}`}
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function CitationLikelihood({ domainScore, overallScore }) {
  const { label, color } = citationLikelihood(domainScore, overallScore);
  return (
    <motion.div
      className={styles.citationBadge}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <span className={styles.citationLabel}>Citation Likelihood</span>
      <span className={styles.citationValue} style={{ color }}>{label}</span>
    </motion.div>
  );
}

function GaugeCircle({ score }) {
  const RADIUS = 80;
  const C = 2 * Math.PI * RADIUS; // full circumference ≈ 502.655

  // Band boundaries as fractions of 0–10
  const BAND1 = 0.5; // 0–5  = red   (50%)
  const BAND2 = 0.7; // 5–7  = orange (20%), 7–10 = green (30%)

  const RED_LEN    = BAND1 * C;
  const ORANGE_LEN = (BAND2 - BAND1) * C;
  const GREEN_LEN  = (1 - BAND2) * C;

  // dashoffset to start each arc at its correct position on the circle
  // formula: dashoffset = C - start_fraction * C
  const ORANGE_OFFSET = C - RED_LEN;
  const GREEN_OFFSET  = C - RED_LEN - ORANGE_LEN;

  const pct    = Math.min(1, Math.max(0, score / 10));
  const offset = C * (1 - pct);
  const color  = getScoreColor(score);
  const displayScore = useCountUp(score, 800);

  const trackStyle = { transformOrigin: 'center', transform: 'rotate(-90deg)' };

  return (
    <div className={styles.gaugeWrap}>
      <svg width="200" height="200" viewBox="0 0 200 200" className={styles.gaugeSvg}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Color band track — red (0–5) */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke="var(--danger)"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeOpacity="0.22"
          strokeDasharray={`${RED_LEN} ${C - RED_LEN}`}
          style={trackStyle}
        />
        {/* Orange (5–7) */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke="var(--warning)"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeOpacity="0.22"
          strokeDasharray={`${ORANGE_LEN} ${C - ORANGE_LEN}`}
          strokeDashoffset={ORANGE_OFFSET}
          style={trackStyle}
        />
        {/* Green (7–10) */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke="var(--success)"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeOpacity="0.22"
          strokeDasharray={`${GREEN_LEN} ${C - GREEN_LEN}`}
          strokeDashoffset={GREEN_OFFSET}
          style={trackStyle}
        />

        {/* Animated score indicator — on top of the track */}
        <motion.circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          filter="url(#glow)"
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
        <span className={styles.gaugeLabel}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function CriterionCard({ label, score, explanation, index, expanded, onToggle }) {
  const color = getScoreColor(score);
  const pct = `${(score / 10) * 100}%`;
  const firstSentence = explanation
    ? explanation.split(/(?<=[.!?])\s+(?=[A-Z])/)[0]
    : '';

  return (
    <motion.div
      className={`${styles.criterionCard} ${expanded ? styles.criterionCardExpanded : ''}`}
      onClick={onToggle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
    >
      <div className={styles.criterionCardHeader}>
        <span className={styles.criterionCardLabel}>{label}</span>
        <span className={styles.criterionCardBadge} style={{ color, borderColor: color }}>
          {score}/10
        </span>
      </div>

      <div className={styles.criterionCardBarTrack}>
        <motion.div
          className={styles.criterionCardBarFill}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: pct }}
          transition={{ duration: 0.7, delay: index * 0.05 + 0.15, ease: 'easeOut' }}
        />
      </div>

      {firstSentence && (
        <p className={styles.criterionCardSummary}>{firstSentence}</p>
      )}

      {expanded && explanation && explanation !== firstSentence && (
        <motion.p
          className={styles.criterionCardFull}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {explanation}
        </motion.p>
      )}
    </motion.div>
  );
}

export default function ScoreTab({ geoAudit }) {
  const [expandedCards, setExpandedCards] = useState(new Set());

  if (!geoAudit) {
    return <div className={styles.empty}>Score data not available.</div>;
  }

  const { overall_score, criteria = {}, strengths = [], top_weaknesses = [] } = geoAudit;

  const sortedCriteria = Object.entries(criteria).sort(([, a], [, b]) => a.score - b.score);

  const toggleCard = (key) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      {/* Score card FIRST */}
      <div className={styles.scoreCard}>
        <div className={styles.topRow}>
          <div className={styles.gaugeColumn}>
            <GaugeCircle score={overall_score} />
            <CitationLikelihood
              domainScore={criteria.domain_entity_authority?.score ?? 0}
              overallScore={overall_score}
            />
          </div>

          <div className={styles.summary}>
            {strengths.length > 0 && (
              <div className={styles.summarySection}>
                <h3 className={styles.strengthsLabel}>STRENGTHS</h3>
                <ul className={styles.list}>
                  {strengths.map((s, i) => (
                    <li key={i} className={styles.listItem}>
                      <span className={styles.listCheck}>✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {top_weaknesses.length > 0 && (
              <div className={styles.summarySection}>
                <h3 className={styles.weaknessesLabel}>WEAKNESSES</h3>
                <ul className={styles.list}>
                  {top_weaknesses.map((w, i) => (
                    <li key={i} className={styles.listItem}>
                      <span className={styles.listX}>✗</span>
                      <span>
                        <strong>{CRITERIA_LABELS[w.criterion] || w.criterion}</strong>
                        {w.feedback && <>: {w.feedback}</>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Criteria explainer grid */}
      <div className={styles.criteriaExplainerSection}>
        <h2 className={styles.criteriaExplainerHeading}>What affects your score</h2>
        <div className={styles.criteriaExplainerGrid}>
          {CRITERIA_EXPLAINER.map(({ icon, name, desc }) => (
            <div key={name} className={styles.criteriaExplainerCard}>
              <span className={styles.criteriaExplainerCardIcon}>{icon}</span>
              <span className={styles.criteriaExplainerCardName}>{name}</span>
              <span className={styles.criteriaExplainerCardDesc}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria breakdown — interactive 2-col card grid */}
      {sortedCriteria.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.heading}>Criteria Breakdown</h2>
          <div className={styles.criteriaCardGrid}>
            {sortedCriteria.map(([key, val], i) => (
              <CriterionCard
                key={key}
                label={CRITERIA_LABELS[key] || key}
                score={val.score}
                explanation={val.explanation}
                index={i}
                expanded={expandedCards.has(key)}
                onToggle={() => toggleCard(key)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
