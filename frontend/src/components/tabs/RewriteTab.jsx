import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RewriteTab.module.css';

function RewriteItem({ rewrite, index }) {
  const [expanded, setExpanded] = useState(true);

  const {
    weakness_label,
    weakness_addressed,
    weakness_score,
    before,
    after,
    why_better,
    geo_signals_added = [],
  } = rewrite;

  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      {/* Header */}
      <button
        className={styles.itemHeader}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className={styles.itemMeta}>
          <span className={styles.itemNum}>{index + 1}</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>{weakness_label || weakness_addressed}</span>
            {weakness_score != null && (
              <span className={styles.itemScore} style={{ color: weakness_score <= 4 ? 'var(--score-poor)' : weakness_score <= 6 ? 'var(--score-fair)' : 'var(--score-good)' }}>
                Score: {weakness_score}/10
              </span>
            )}
          </div>
        </div>
        <svg
          className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={styles.itemBody}
          >
            {/* Before / After panels */}
            <div className={styles.panels}>
              <div className={`${styles.panel} ${styles.panelBefore}`}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelDot} style={{ background: 'var(--score-poor)' }} />
                  Before
                </div>
                <p className={styles.panelText}>{before}</p>
              </div>

              <div className={styles.panelArrow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <div className={`${styles.panel} ${styles.panelAfter}`}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelDot} style={{ background: 'var(--score-great)' }} />
                  After
                </div>
                <p className={styles.panelText}>{after}</p>
              </div>
            </div>

            {/* Why better */}
            {why_better && (
              <div className={styles.whyBetter}>
                <span className={styles.whyLabel}>Why this works:</span>
                <span className={styles.whyText}>{why_better}</span>
              </div>
            )}

            {/* GEO signals */}
            {geo_signals_added.length > 0 && (
              <div className={styles.signals}>
                <span className={styles.signalsLabel}>GEO signals added:</span>
                <div className={styles.signalTags}>
                  {geo_signals_added.map((s, i) => (
                    <span key={i} className={styles.signalTag}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuickWin({ win, index }) {
  const effortColor = {
    low: 'var(--score-great)',
    medium: 'var(--score-fair)',
    high: 'var(--score-poor)',
  };

  return (
    <motion.div
      className={styles.quickWin}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div className={styles.qwHeader}>
        <span className={styles.qwAction}>{win.action}</span>
        <div className={styles.qwBadges}>
          {win.effort && (
            <span className={styles.qwBadge} style={{ color: effortColor[win.effort] || 'var(--text-secondary)' }}>
              {win.effort} effort
            </span>
          )}
          {win.impact && (
            <span className={styles.qwBadge} style={{ color: effortColor[win.impact] || 'var(--text-secondary)' }}>
              {win.impact} impact
            </span>
          )}
        </div>
      </div>
      {win.example && <p className={styles.qwExample}>e.g. {win.example}</p>}
    </motion.div>
  );
}

export default function RewriteTab({ rewrites }) {
  if (!rewrites) {
    return <div className={styles.empty}>Rewrite data not available.</div>;
  }

  const { rewrites: items = [], additional_quick_wins = [] } = rewrites;

  return (
    <div className={styles.page}>
      {/* Main rewrites */}
      {items.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Before / After Rewrites</h2>
          <p className={styles.sectionHint}>
            Each section targets a specific GEO weakness. Click to expand or collapse.
          </p>
          <div className={styles.items}>
            {items.map((r, i) => (
              <RewriteItem key={i} rewrite={r} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>No rewrites generated.</div>
      )}

      {/* Quick wins */}
      {additional_quick_wins.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Additional Quick Wins</h2>
          <div className={styles.quickWins}>
            {additional_quick_wins.map((w, i) => (
              <QuickWin key={i} win={w} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
