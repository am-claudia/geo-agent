import { motion } from 'framer-motion';
import styles from './ActionPlanTab.module.css';

function boldNumbers(text) {
  if (!text) return null;
  return text.split(/(\b\d+(?:\.\d+)?[%x]?\b)/).map((part, i) =>
    /^\d+(?:\.\d+)?[%x]?$/.test(part) ? <strong key={i}>{part}</strong> : part
  );
}

function boldFirstWord(text) {
  if (!text) return text;
  const idx = text.indexOf(' ');
  if (idx === -1) return <strong>{text}</strong>;
  return <><strong>{text.slice(0, idx)}</strong>{text.slice(idx)}</>;
}

function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
}

const EFFORT_COLOR = {
  low:    'var(--score-great)',
  medium: 'var(--score-fair)',
  high:   'var(--score-poor)',
};

function ActionItem({ item, index }) {
  const {
    priority,
    action,
    criterion_label,
    expected_impact,
    implementation,
    effort,
    timeline,
  } = item;

  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Priority number */}
      <div className={styles.priorityCol}>
        <div className={styles.priorityNum}>{priority ?? index + 1}</div>
        {index < 4 && <div className={styles.priorityLine} />}
      </div>

      {/* Content */}
      <div className={styles.itemContent}>
        <div className={styles.itemHeader}>
          <h3 className={styles.action}>{boldFirstWord(action)}</h3>
          <div className={styles.badges}>
            {effort && (
              <span className={styles.badge} style={{ color: EFFORT_COLOR[effort] || 'var(--text-secondary)', borderColor: EFFORT_COLOR[effort] || 'var(--border-mid)' }}>
                {effort} effort
              </span>
            )}
            {timeline && (
              <span className={styles.badge}>⏱ {timeline}</span>
            )}
          </div>
        </div>

        {criterion_label && (
          <div className={styles.criterion}>
            <span className={styles.criterionIcon}>◎</span>
            <span>Targets: <strong>{criterion_label}</strong></span>
          </div>
        )}

        {expected_impact && (
          <p className={styles.impact}>
            <span className={styles.impactLabel}>Expected impact:</span> {boldNumbers(expected_impact)}
          </p>
        )}

        {implementation && (
          <div className={styles.implementation}>
            <span className={styles.implLabel}>How to do it</span>
            <p className={styles.implText}>{implementation}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ActionPlanTab({ finalReport }) {
  if (!finalReport) {
    return <div className={styles.empty}>Action plan not available.</div>;
  }

  const {
    action_plan = [],
    closing_insight,
  } = finalReport;

  return (
    <div className={styles.page}>
      {/* Contextual explanation */}
      <div className={styles.explainer}>
        <p className={styles.explainerText}>
          This is a <strong>prioritized, step-by-step plan</strong> to improve your page's GEO score. Every action is ranked by its <strong>impact-to-effort ratio</strong>: the highest-value, lowest-effort improvements come first. Completing the first <strong>2-3 items</strong> typically produces the biggest jump in AI citability.
        </p>
        <p className={styles.explainerText}>
          Each action targets a specific GEO weakness identified in the audit. The <strong>effort level</strong> reflects how much work is involved, and the <strong>timeline</strong> suggests when you can realistically see results.
        </p>
      </div>

      {/* Strategic insight at top, above checklist */}
      {closing_insight && (
        <motion.div
          className={styles.closing}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className={styles.closingIcon}>💡</span>
          <div>
            <span className={styles.closingLabel}>Strategic insight</span>
            {(() => {
              const bullets = splitSentences(closing_insight);
              if (bullets.length <= 1) {
                return <p className={styles.closingText}>{boldNumbers(closing_insight)}</p>;
              }
              return (
                <ul className={styles.closingBullets}>
                  {bullets.map((b, i) => (
                    <li key={i} className={styles.closingBulletItem}>{boldNumbers(b)}</li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Prioritized action plan */}
      {action_plan.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Prioritized Action Plan</h2>
          <p className={styles.sectionHint}>Ordered by impact-to-effort ratio. Start with #1.</p>

          <div className={styles.items}>
            {action_plan.map((item, i) => (
              <ActionItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>No action plan items found.</div>
      )}
    </div>
  );
}
