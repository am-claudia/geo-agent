import styles from './ScoreCard.module.css';

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 452.4
const ARC_DEGREES = 270;
const ARC_LENGTH = (ARC_DEGREES / 360) * CIRCUMFERENCE; // ≈ 339.3

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

function scoreColor(score) {
  if (score >= 8) return 'var(--score-great)';
  if (score >= 6.5) return 'var(--score-good)';
  if (score >= 4.5) return 'var(--score-fair)';
  return 'var(--score-poor)';
}

function scoreRating(score) {
  if (score >= 8) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 4.5) return 'Fair';
  return 'Poor';
}

export default function ScoreCard({ geoAudit }) {
  const { overall_score, criteria, strengths } = geoAudit;
  const color = scoreColor(overall_score);
  const dashoffset = ARC_LENGTH * (1 - overall_score / 10);

  return (
    <div className={styles.wrapper}>
      {/* Gauge */}
      <div className={styles.gaugeSection}>
        <div className={styles.gauge}>
          <svg viewBox="0 0 200 200" className={styles.gaugeSvg}>
            {/* Track */}
            <circle
              cx="100" cy="100" r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(135 100 100)"
            />
            {/* Progress */}
            <circle
              cx="100" cy="100" r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              transform="rotate(135 100 100)"
              style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 1s ease' }}
            />
            {/* Score text */}
            <text x="100" y="96" textAnchor="middle" fontSize="40" fontWeight="800"
              fill={color} fontFamily="Inter, sans-serif">
              {overall_score.toFixed(1)}
            </text>
            <text x="100" y="118" textAnchor="middle" fontSize="11"
              fill="rgba(200,216,234,0.5)" fontFamily="Inter, sans-serif">
              / 10
            </text>
            <text x="100" y="140" textAnchor="middle" fontSize="12" fontWeight="600"
              fill={color} fontFamily="Inter, sans-serif">
              {scoreRating(overall_score).toUpperCase()}
            </text>
          </svg>
        </div>

        {strengths && strengths.length > 0 && (
          <div className={styles.strengths}>
            <div className={styles.strengthsTitle}>What's working</div>
            {strengths.map((s, i) => (
              <div key={i} className={styles.strengthItem}>
                <span className={styles.strengthCheck}>✓</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criteria breakdown */}
      <div className={styles.criteriaGrid}>
        {Object.entries(criteria).map(([key, val]) => (
          <CriterionBar key={key} label={CRITERIA_LABELS[key] || key} score={val.score} explanation={val.explanation} />
        ))}
      </div>
    </div>
  );
}

function CriterionBar({ label, score, explanation }) {
  const color = scoreColor(score);
  const pct = (score / 10) * 100;

  return (
    <div className={styles.criterion}>
      <div className={styles.criterionHeader}>
        <span className={styles.criterionLabel}>{label}</span>
        <span className={styles.criterionScore} style={{ color }}>{score}/10</span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className={styles.criterionExplanation}>{explanation}</p>
    </div>
  );
}
