import { motion } from 'framer-motion';
import styles from './CompetitorTab.module.css';

function CompetitorCard({ competitor, index }) {
  const { url, domain, title, geo_strengths = [], why_ai_cites_it, key_differentiator } = competitor;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.rank}>#{index + 1}</div>
        <div className={styles.domainWrap}>
          <span className={styles.domain}>{domain}</span>
          {title && <span className={styles.pageTitle}>{title}</span>}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.visitLink} aria-label={`Visit ${domain}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
      </div>

      {key_differentiator && (
        <div className={styles.keyDiff}>
          <span className={styles.keyDiffBadge}>Key Signal</span>
          <span className={styles.keyDiffText}>{key_differentiator}</span>
        </div>
      )}

      {why_ai_cites_it && (
        <p className={styles.whyCited}>{why_ai_cites_it}</p>
      )}

      {geo_strengths.length > 0 && (
        <ul className={styles.strengths}>
          {geo_strengths.map((s, i) => (
            <li key={i} className={styles.strengthItem}>
              <span className={styles.strengthBullet}>✓</span>
              {s}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
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

      {/* Competitor cards */}
      {competitors.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Top AI-Cited Competitors</h2>
          <div className={styles.grid}>
            {competitors.map((c, i) => (
              <CompetitorCard key={i} competitor={c} index={i} />
            ))}
          </div>
        </div>
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
          <h2 className={styles.sectionTitle}>Content Gap Opportunities</h2>
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
