import styles from './RewritePanel.module.css';

const EFFORT_COLOR = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };
const IMPACT_COLOR = { low: 'var(--text-dim)', medium: 'var(--warning)', high: 'var(--success)' };

export default function RewritePanel({ rewrites }) {
  const { rewrites: items, additional_quick_wins } = rewrites;

  return (
    <div className={styles.wrapper}>
      {/* Before/After Rewrites */}
      <div className={styles.rewritesList}>
        {items.map((item, i) => (
          <RewriteItem key={i} item={item} index={i} />
        ))}
      </div>

      {/* Quick Wins */}
      {additional_quick_wins && additional_quick_wins.length > 0 && (
        <div className={styles.quickWins}>
          <h4 className={styles.quickWinsTitle}>Additional Quick Wins</h4>
          <div className={styles.quickWinsList}>
            {additional_quick_wins.map((qw, i) => (
              <div key={i} className={styles.quickWin}>
                <div className={styles.quickWinHeader}>
                  <span className={styles.quickWinAction}>{qw.action}</span>
                  <div className={styles.quickWinBadges}>
                    <span className={styles.badge} style={{ color: EFFORT_COLOR[qw.effort] }}>
                      effort: {qw.effort}
                    </span>
                    <span className={styles.badge} style={{ color: IMPACT_COLOR[qw.impact] }}>
                      impact: {qw.impact}
                    </span>
                  </div>
                </div>
                {qw.example && <p className={styles.quickWinExample}>{qw.example}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RewriteItem({ item, index }) {
  const {
    weakness_label,
    weakness_addressed,
    weakness_score,
    context,
    before,
    after,
    why_better,
    geo_signals_added,
  } = item;

  return (
    <div className={styles.rewriteItem}>
      <div className={styles.rewriteHeader}>
        <div className={styles.rewriteMeta}>
          <span className={styles.rewriteNum}>Rewrite {index + 1}</span>
          <span className={styles.rewriteWeakness}>{weakness_label || weakness_addressed}</span>
          <span className={styles.rewriteScore}>{weakness_score}/10 → improving</span>
        </div>
        {context && <p className={styles.rewriteContext}>{context}</p>}
      </div>

      <div className={styles.beforeAfter}>
        {/* Before */}
        <div className={styles.panel}>
          <div className={styles.panelLabel + ' ' + styles.panelLabelBefore}>
            <span className={styles.panelDot} style={{ background: 'var(--danger)' }} />
            Before
          </div>
          <blockquote className={`${styles.panelText} ${styles.panelTextBefore}`}>
            {before}
          </blockquote>
        </div>

        <div className={styles.betweenArrow}>→</div>

        {/* After */}
        <div className={styles.panel}>
          <div className={styles.panelLabel + ' ' + styles.panelLabelAfter}>
            <span className={styles.panelDot} style={{ background: 'var(--success)' }} />
            After
          </div>
          <blockquote className={`${styles.panelText} ${styles.panelTextAfter}`}>
            {after}
          </blockquote>
        </div>
      </div>

      {/* Why better */}
      <div className={styles.whyBetter}>
        <span className={styles.whyBetterLabel}>Why this improves citability</span>
        <p className={styles.whyBetterText}>{why_better}</p>
      </div>

      {/* GEO signals added */}
      {geo_signals_added && geo_signals_added.length > 0 && (
        <div className={styles.signals}>
          <span className={styles.signalsLabel}>GEO signals added:</span>
          {geo_signals_added.map((s, i) => (
            <span key={i} className={styles.signalTag}>+ {s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
