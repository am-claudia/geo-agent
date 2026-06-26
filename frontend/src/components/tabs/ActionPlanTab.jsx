import { motion } from 'framer-motion';
import styles from './ActionPlanTab.module.css';

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
          <h3 className={styles.action}>{action}</h3>
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
            <span className={styles.impactLabel}>Expected impact:</span> {expected_impact}
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
    executive_summary,
    page_overview,
    action_plan = [],
    closing_insight,
  } = finalReport;

  return (
    <div className={styles.page}>
      {/* Executive summary */}
      {executive_summary && (
        <motion.div
          className={styles.execSummary}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.execLabel}>
            <span className={styles.execIcon}>📊</span>
            Executive Summary
          </div>
          <p className={styles.execText}>{executive_summary}</p>

          {page_overview?.score_context && (
            <p className={styles.scoreContext}>{page_overview.score_context}</p>
          )}
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

      {/* Closing insight */}
      {closing_insight && (
        <motion.div
          className={styles.closing}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <span className={styles.closingIcon}>💡</span>
          <div>
            <span className={styles.closingLabel}>Strategic insight</span>
            <p className={styles.closingText}>{closing_insight}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
