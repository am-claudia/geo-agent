import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './ScoreTab.module.css';

const CRITERIA_LABELS = {
  authority:          'Authority & Credibility',
  structural_clarity: 'Structural Clarity',
  quotability:        'Quotability',
  comprehensiveness:  'Comprehensiveness',
  semantic_clarity:   'Semantic Clarity',
  freshness:          'Freshness Signals',
  question_answering: 'Q&A Format',
};

function scoreColor(score) {
  if (score >= 8)  return 'var(--score-great)';
  if (score >= 6.5)return 'var(--score-good)';
  if (score >= 4.5)return 'var(--score-fair)';
  return 'var(--score-poor)';
}

function scoreLabel(score) {
  if (score >= 8)  return 'Excellent';
  if (score >= 6.5)return 'Good';
  if (score >= 4.5)return 'Fair';
  return 'Needs Work';
}

function GaugeCircle({ score }) {
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const pct = Math.min(1, Math.max(0, score / 10));
  const offset = CIRCUMFERENCE * (1 - pct);
  const color = scoreColor(score);

  return (
    <div className={styles.gaugeWrap}>
      <svg width="200" height="200" viewBox="0 0 200 200" className={styles.gaugeSvg}>
        {/* Background track */}
        <circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
        />
        {/* Progress arc */}
        <motion.circle
          cx="100" cy="100" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          filter="url(#glow)"
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>
      {/* Center text */}
      <div className={styles.gaugeCenter}>
        <motion.span
          className={styles.gaugeScore}
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {score?.toFixed?.(1) ?? score}
        </motion.span>
        <span className={styles.gaugeMax}>/10</span>
        <span className={styles.gaugeLabel} style={{ color }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}

function CriterionBar({ label, score, explanation, delay }) {
  const color = scoreColor(score);
  const pct   = `${(score / 10) * 100}%`;

  return (
    <motion.div
      className={styles.criterion}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className={styles.criterionHeader}>
        <span className={styles.criterionLabel}>{label}</span>
        <span className={styles.criterionScore} style={{ color }}>{score}/10</span>
      </div>
      <div className={styles.barTrack}>
        <motion.div
          className={styles.barFill}
          style={{ background: color, '--target-width': pct }}
          initial={{ width: 0 }}
          animate={{ width: pct }}
          transition={{ duration: 0.8, delay: delay + 0.15, ease: 'easeOut' }}
        />
      </div>
      {explanation && (
        <p className={styles.criterionExplanation}>{explanation}</p>
      )}
    </motion.div>
  );
}

export default function ScoreTab({ geoAudit }) {
  if (!geoAudit) {
    return <div className={styles.empty}>Score data not available.</div>;
  }

  const { overall_score, criteria = {}, strengths = [], top_weaknesses = [] } = geoAudit;

  const sortedCriteria = Object.entries(criteria)
    .sort(([, a], [, b]) => a.score - b.score);

  return (
    <div className={styles.page}>
      {/* Contextual explanation */}
      <div className={styles.explainer}>
        <p className={styles.explainerText}>
          The <strong>GEO Score</strong> (0-10) measures how likely AI systems like <strong>ChatGPT, Perplexity, and Google AI Overviews</strong> are to cite this page as a source. It is calculated across 7 criteria:
        </p>
        <ul className={styles.criteriaList}>
          <li className={styles.criteriaListItem}><strong>Quotability:</strong> Does the page contain clear, citable statements, statistics, or definitions that AI can lift verbatim?</li>
          <li className={styles.criteriaListItem}><strong>Authority and Credibility:</strong> Does the page signal expertise through credentials, data sources, or author information?</li>
          <li className={styles.criteriaListItem}><strong>Q&amp;A Format:</strong> Does the page directly answer questions the way users phrase them to AI?</li>
          <li className={styles.criteriaListItem}><strong>Structural Clarity:</strong> Are headings, sections, and content organized so AI can parse and extract key points?</li>
          <li className={styles.criteriaListItem}><strong>Comprehensiveness:</strong> Does the page cover the topic thoroughly enough to be the definitive source?</li>
          <li className={styles.criteriaListItem}><strong>Semantic Clarity:</strong> Is the language precise and free of ambiguity, making it easy for AI to interpret?</li>
          <li className={styles.criteriaListItem}><strong>Freshness Signals:</strong> Does the page indicate recent publication or updates that signal relevance?</li>
        </ul>
      </div>

      {/* Gauge + summary */}
      <div className={styles.topRow}>
        <GaugeCircle score={overall_score} />

        <div className={styles.summary}>
          {strengths.length > 0 && (
            <div className={styles.summarySection}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionDot} style={{ background: 'var(--score-great)' }} />
                Strengths
              </h3>
              <ul className={styles.list}>
                {strengths.map((s, i) => (
                  <li key={i} className={styles.listItem}><span className={styles.listCheck}>✓</span>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {top_weaknesses.length > 0 && (
            <div className={styles.summarySection}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionDot} style={{ background: 'var(--score-poor)' }} />
                Top Weaknesses
              </h3>
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

      {/* Criteria breakdown */}
      <div className={styles.section}>
        <h2 className={styles.heading}>Criteria Breakdown</h2>
        <div className={styles.criteriaGrid}>
          {sortedCriteria.map(([key, val], i) => (
            <CriterionBar
              key={key}
              label={CRITERIA_LABELS[key] || key}
              score={val.score}
              explanation={val.explanation}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
