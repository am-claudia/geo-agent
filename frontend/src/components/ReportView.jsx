import ScoreCard from './ScoreCard.jsx';
import CompetitorCard from './CompetitorCard.jsx';
import RewritePanel from './RewritePanel.jsx';
import styles from './ReportView.module.css';

const EFFORT_COLOR = { low: '#00e599', medium: '#ffaa00', high: '#ff9966' };

export default function ReportView({ results, onReset }) {
  const { parsedContent, geoAudit, competitorData, rewrites, finalReport } = results;

  return (
    <div className={styles.wrapper}>
      {/* ── Report Header ── */}
      <div className={styles.reportHeader}>
        <div className={styles.reportMeta}>
          <span className={styles.reportBadge}>GEO Audit Report</span>
          <span className={styles.reportDate}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className={styles.reportTitle}>
          <h2 className={styles.pageTitle}>{parsedContent.title}</h2>
          <a href={parsedContent.url} target="_blank" rel="noopener noreferrer" className={styles.pageUrl}>
            {parsedContent.url.length > 70 ? parsedContent.url.substring(0, 70) + '…' : parsedContent.url}
            <span> ↗</span>
          </a>
        </div>
        <div className={styles.pageMeta}>
          <span className={styles.metaChip}>{parsedContent.wordCount?.toLocaleString()} words</span>
          <span className={styles.metaChip}>{parsedContent.headings.h2?.length} H2 headings</span>
          {parsedContent.structuralSignals?.hasSchema && <span className={styles.metaChipGreen}>Schema.org ✓</span>}
          {parsedContent.structuralSignals?.hasFAQ && <span className={styles.metaChipGreen}>FAQ detected ✓</span>}
        </div>
        <button className={styles.resetBtn} onClick={onReset}>
          ← Analyze another page
        </button>
      </div>

      {/* ── Executive Summary ── */}
      {finalReport?.executive_summary && (
        <Section title="Executive Summary" icon="▣">
          <div className={styles.execSummary}>
            <p>{finalReport.executive_summary}</p>
          </div>
          {finalReport.closing_insight && (
            <div className={styles.closingInsight}>
              <span className={styles.insightLabel}>Strategic insight</span>
              <p>{finalReport.closing_insight}</p>
            </div>
          )}
        </Section>
      )}

      {/* ── GEO Score ── */}
      <Section title="GEO Citability Score" icon="◎">
        <ScoreCard geoAudit={geoAudit} />
      </Section>

      {/* ── Action Plan ── */}
      {finalReport?.action_plan && (
        <Section title="Action Plan" icon="✦" subtitle="Prioritized by impact-to-effort ratio">
          <div className={styles.actionPlan}>
            {finalReport.action_plan.map((item) => (
              <ActionItem key={item.priority} item={item} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Before/After Rewrites ── */}
      <Section title="Content Rewrites" icon="⬡" subtitle="Before/after transformations for your top 3 GEO weaknesses">
        <RewritePanel rewrites={rewrites} />
      </Section>

      {/* ── Competitive Landscape ── */}
      <Section title="Competitive Landscape" icon="◈" subtitle={competitorData.landscape_summary}>
        {competitorData.competitors && competitorData.competitors.length > 0 ? (
          <>
            <div className={styles.competitorGrid}>
              {competitorData.competitors.map((c, i) => (
                <CompetitorCard key={c.url} competitor={c} index={i} />
              ))}
            </div>

            {competitorData.gap_opportunities && competitorData.gap_opportunities.length > 0 && (
              <div className={styles.gapWrapper}>
                <div className={styles.gapBridge}>
                  <div className={styles.gapBridgeLine} />
                  <span className={styles.gapBridgeLabel}>from this analysis</span>
                  <div className={styles.gapBridgeLine} />
                </div>
                <div className={styles.gapBox}>
                  <div className={styles.gapHeader}>
                    <div className={styles.gapTitleRow}>
                      <span className={styles.gapIcon}>◐</span>
                      <span className={styles.gapTitle}>Content gap opportunities</span>
                    </div>
                    <p className={styles.gapSubtitle}>
                      Topics the AI-cited sources above cover that your page doesn't yet — your clearest path to competing for citations.
                    </p>
                  </div>
                  <ul className={styles.gapList}>
                    {competitorData.gap_opportunities.map((gap, i) => (
                      <li key={i} className={styles.gapItem}>
                        <span className={styles.gapBullet}>→</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>Competitor data unavailable for this search.</div>
        )}
      </Section>

      {/* ── Footer CTA ── */}
      <div className={styles.footerCta}>
        <button className={styles.resetBtnLarge} onClick={onReset}>
          Run another audit →
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, subtitle, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <span className={styles.sectionIcon}>{icon}</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function ActionItem({ item }) {
  const effortColor = EFFORT_COLOR[item.effort] || '#fff';

  return (
    <div className={styles.actionItem}>
      <div className={styles.actionPriority}>
        <span className={styles.priorityNum}>{item.priority}</span>
      </div>
      <div className={styles.actionBody}>
        <div className={styles.actionTop}>
          <span className={styles.actionTitle}>{item.action}</span>
          <div className={styles.actionBadges}>
            <span className={styles.actionCriterion}>{item.criterion_label}</span>
            <span className={styles.effortBadge} style={{ color: effortColor }}>
              {item.effort} effort
            </span>
            <span className={styles.timelineBadge}>{item.timeline}</span>
          </div>
        </div>
        <p className={styles.actionImpact}>{item.expected_impact}</p>
        <p className={styles.actionImpl}>{item.implementation}</p>
      </div>
    </div>
  );
}
