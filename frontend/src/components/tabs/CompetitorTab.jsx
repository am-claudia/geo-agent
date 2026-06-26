import { motion } from 'framer-motion';
import styles from './CompetitorTab.module.css';

function StrengthTag({ text }) {
  return <span className={styles.strengthTag}>{text}</span>;
}

function CompetitorRow({ competitor, index }) {
  const { url, domain, title, geo_strengths = [], why_ai_cites_it, key_differentiator } = competitor;

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
          <span className={styles.signalBadge}>{key_differentiator}</span>
        )}
        {why_ai_cites_it && (
          <p className={styles.whyCited}>{why_ai_cites_it}</p>
        )}
      </td>

      <td className={styles.tdStrengths}>
        <div className={styles.tagsWrap}>
          {geo_strengths.slice(0, 4).map((s, i) => (
            <StrengthTag key={i} text={s} />
          ))}
          {geo_strengths.length > 4 && (
            <span className={styles.moreTag}>+{geo_strengths.length - 4} more</span>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function CompetitorTab({ competitorData }) {
  if (!competitorData) {
    return <div className={styles.empty}>Competitor data not available.</div>;
  }

  const {
    competitors = [],
    landscape_summary,
    gap_opportunities = [],
    dominant_content_types = [],
  } = competitorData;

  return (
    <div className={styles.page}>
      {/* Contextual explanation */}
      <div className={styles.explainer}>
        <div className={styles.explainerRow}>
          <div className={styles.explainerItem}>
            <span className={styles.explainerIcon}>🎯</span>
            <div>
              <strong className={styles.explainerTitle}>Why these pages rank</strong>
              <p className={styles.explainerDesc}>These are the pages AI currently prefers to cite on your topic. What they do well reveals exactly what your content is missing.</p>
            </div>
          </div>
          <div className={styles.explainerItem}>
            <span className={styles.explainerIcon}>📊</span>
            <div>
              <strong className={styles.explainerTitle}>GEO Strengths column</strong>
              <p className={styles.explainerDesc}>The specific signals (authority, structure, quotability) that make each competitor attractive to AI. Use these as your checklist.</p>
            </div>
          </div>
          <div className={styles.explainerItem}>
            <span className={styles.explainerIcon}>💡</span>
            <div>
              <strong className={styles.explainerTitle}>Gap opportunities below</strong>
              <p className={styles.explainerDesc}>Angles and formats none of these competitors cover yet. Your best shot at a GEO advantage no one else has.</p>
            </div>
          </div>
        </div>
      </div>

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
                <span key={i} className={styles.ctTag}>{t}</span>
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
        <div className={styles.empty}>No competitor data found for this topic.</div>
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
            These are <strong>angles and formats that competitors are not covering</strong>. Adding them to your page can give you a GEO advantage no one else has.
          </p>
          <div className={styles.gaps}>
            {gap_opportunities.map((gap, i) => (
              <div key={i} className={styles.gapItem}>
                <span className={styles.gapNum}>{i + 1}</span>
                <span className={styles.gapText}>{gap}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
