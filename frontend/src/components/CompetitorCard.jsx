import styles from './CompetitorCard.module.css';

export default function CompetitorCard({ competitor, index }) {
  const { url, domain, title, geo_strengths, why_ai_cites_it, key_differentiator } = competitor;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.rank}>{String(index + 1).padStart(2, '0')}</div>
        <div className={styles.domainInfo}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.domain}
          >
            {domain}
            <span className={styles.linkIcon}>↗</span>
          </a>
          {title && <div className={styles.pageTitle}>{title}</div>}
        </div>
      </div>

      <div className={styles.differentiator}>
        <span className={styles.differentiatorLabel}>Key differentiator</span>
        <p className={styles.differentiatorText}>{key_differentiator}</p>
      </div>

      <div className={styles.whyBlock}>
        <span className={styles.whyLabel}>Why AI cites this</span>
        <p className={styles.whyText}>{why_ai_cites_it}</p>
      </div>

      {geo_strengths && geo_strengths.length > 0 && (
        <div className={styles.strengths}>
          {geo_strengths.map((s, i) => (
            <span key={i} className={styles.strengthTag}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
