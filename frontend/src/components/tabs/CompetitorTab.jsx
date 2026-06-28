import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CompetitorTab.module.css';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold';

const sc = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function EmptyCompetitors() {
  return (
    <div className={styles.emptyState}>
      <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <h3 className={styles.emptyHeading}>No competitor data available</h3>
      <p className={styles.emptySubtext}>The competitor search couldn't retrieve results for this topic. This may be due to API limits or an unusual topic keyword.</p>
    </div>
  );
}

function sanitizeMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1');
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

function StrengthItem({ text }) {
  return (
    <div className={styles.strengthItem}>
      <svg className={styles.strengthCheck} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span className={styles.strengthText}>{renderMarkdownBold(sc(text))}</span>
    </div>
  );
}

function CompetitorRow({ competitor, index }) {
  const { url, domain, title, geo_strengths = [], why_ai_cites_it, key_differentiator } = competitor;

  const bullets = why_ai_cites_it
    ? (Array.isArray(why_ai_cites_it)
        ? why_ai_cites_it
        : (why_ai_cites_it || '').split(/(?<=[.!?])\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean))
    : [];

  return (
    <motion.tr
      className={styles.row}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
    >
      <td className={styles.tdRank}>
        <span className={styles.rankBadge}>#{index + 1}</span>
      </td>

      <td className={styles.tdDomain}>
        <div className={styles.domainCell}>
          <span className={styles.domainName}>{domain}</span>
          {title && <span className={styles.pageTitle}>{title}</span>}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className={styles.visitLink} aria-label={`Visit ${domain}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Visit
            </a>
          )}
        </div>
      </td>

      <td className={styles.tdSignal}>
        {key_differentiator && (
          <span className={styles.signalBadge}>{sanitizeMarkdown(key_differentiator)}</span>
        )}
        {bullets.length > 0 && (
          <div className={styles.whyCitedWrap}>
            <p className={styles.whyCitedLabel}>Why AI cites this</p>
            <ul className={styles.whyCitedList}>
              {bullets.map((b, i) => <li key={i}>{sanitizeMarkdown(b)}</li>)}
            </ul>
          </div>
        )}
      </td>

      <td className={styles.tdStrengths}>
        <div className={styles.strengthsList}>
          {geo_strengths.map((s, i) => (
            <StrengthItem key={i} text={s} />
          ))}
        </div>
      </td>
    </motion.tr>
  );
}

const GAP_ACCENT_COLORS = ['#6366f1', '#f97316', '#22c55e', '#3b82f6', '#a855f7'];

function GapCard({ gap, index }) {
  const [expanded, setExpanded] = useState(false);
  const color = GAP_ACCENT_COLORS[index % GAP_ACCENT_COLORS.length];

  // Split into a short title (first sentence or first ~80 chars) and body
  const periodIdx = gap.search(/[.!?]/);
  const hasMore = periodIdx > 0 && periodIdx < gap.length - 2;
  const title = hasMore ? gap.slice(0, periodIdx + 1) : gap;
  const detail = hasMore ? gap.slice(periodIdx + 1).trim() : null;

  return (
    <motion.div
      className={`${styles.gapCard} ${expanded ? styles.gapCardExpanded : ''}`}
      style={{ borderLeftColor: color }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      onClick={detail ? () => setExpanded(e => !e) : undefined}
      role={detail ? 'button' : undefined}
      tabIndex={detail ? 0 : undefined}
      onKeyDown={detail ? (e) => e.key === 'Enter' && setExpanded(x => !x) : undefined}
    >
      <div className={styles.gapCardHeader}>
        <span className={styles.gapCardNum} style={{ color }}>{index + 1}</span>
        <span className={styles.gapCardTitle}>{renderMarkdownBold(title)}</span>
        {detail && (
          <span className={styles.gapCardToggle} style={{ color }}>
            <Chevron open={expanded} />
          </span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expanded && detail && (
          <motion.p
            className={styles.gapCardDetail}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CompetitorTab({ competitorData }) {
  if (!competitorData) {
    return <EmptyCompetitors />;
  }

  const {
    competitors = [],
    landscape_summary,
    gap_opportunities = [],
    dominant_content_types = [],
  } = competitorData;

  return (
    <div className={styles.page}>
      {/* Landscape summary */}
      {landscape_summary && (
        <motion.div
          className={styles.summary}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.sectionTitle}>Competitive Landscape</h2>
          <p className={styles.summaryText}>{landscape_summary}</p>

          {dominant_content_types.length > 0 && (
            <div className={styles.contentTypes}>
              <span className={styles.ctLabel}>Dominant formats:</span>
              {dominant_content_types.map((t, i) => (
                <span key={i} className={styles.ctTagBlue}>{sc(t)}</span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Competitor table */}
      {competitors.length > 0 ? (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className={styles.sectionTitle}>Top AI-Cited Competitors</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.thead}>
                  <th className={styles.thRank}>#</th>
                  <th className={styles.thDomain}>Domain</th>
                  <th className={styles.thSignal}>Key Signal</th>
                  <th className={styles.thStrengths}>GEO Strengths</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <CompetitorRow key={i} competitor={c} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <EmptyCompetitors />
      )}

      {/* Arrow connector — visual bridge between competitors and gaps */}
      {gap_opportunities.length > 0 && (
        <div className={styles.gapConnector}>
          <div className={styles.gapConnectorLine} />
          <div className={styles.gapConnectorBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
            </svg>
            Gaps identified from the analysis above
          </div>
          <div className={styles.gapConnectorLine} />
        </div>
      )}

      {/* Gap opportunities */}
      {gap_opportunities.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Your Content Gap Opportunities</h2>
          <p className={styles.sectionHint}>
            These are <strong>angles and formats that competitors are not covering</strong>. Adding them gives you a GEO advantage no one else has.
            {gap_opportunities.some((g) => g.search(/[.!?]/) > 0 && g.search(/[.!?]/) < g.length - 2) && (
              <> Click any card to expand details.</>
            )}
          </p>
          <div className={styles.gapCards}>
            {gap_opportunities.map((gap, i) => (
              <GapCard key={i} gap={gap} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
