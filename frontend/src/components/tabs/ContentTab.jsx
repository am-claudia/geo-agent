import { motion } from 'framer-motion';
import styles from './ContentTab.module.css';

function StatCard({ label, value, icon, delay = 0 }) {
  return (
    <motion.div
      className={styles.statCard}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value ?? '—'}</span>
      <span className={styles.statLabel}>{label}</span>
    </motion.div>
  );
}

export default function ContentTab({ parsedContent }) {
  if (!parsedContent) {
    return <div className={styles.empty}>Content analysis data not available.</div>;
  }

  const {
    title,
    wordCount,
    metaDescription,
    headings = {},
    paragraphs = [],
    structuralSignals = {},
  } = parsedContent;

  const { h1 = [], h2 = [], h3 = [] } = headings;
  const preview = paragraphs.slice(0, 3).join(' ').slice(0, 480);

  return (
    <div className={styles.page}>
      {/* Stats row */}
      <div className={styles.statsGrid}>
        <StatCard label="Word Count"    value={wordCount?.toLocaleString()} icon="📝" delay={0} />
        <StatCard label="H1 Headings"   value={h1.length}                   icon="H1" delay={0.05} />
        <StatCard label="H2 Headings"   value={h2.length}                   icon="H2" delay={0.10} />
        <StatCard label="H3 Headings"   value={h3.length}                   icon="H3" delay={0.15} />
        <StatCard label="Schema Markup" value={structuralSignals.hasSchema ? 'Yes ✓' : 'No ✗'} icon="⚡" delay={0.20} />
        <StatCard label="FAQ Section"   value={structuralSignals.hasFAQ   ? 'Yes ✓' : 'No ✗'} icon="❓" delay={0.25} />
      </div>

      {/* Page details */}
      <motion.div
        className={styles.section}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h2 className={styles.sectionTitle}>Page Details</h2>
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Page Title</span>
            <span className={styles.detailVal}>{title || '—'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Meta Description</span>
            <span className={styles.detailVal}>{metaDescription || <em className={styles.missing}>Not found</em>}</span>
          </div>
        </div>
      </motion.div>

      {/* Heading structure */}
      {(h1.length > 0 || h2.length > 0) && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h2 className={styles.sectionTitle}>Heading Structure</h2>
          <div className={styles.headings}>
            {h1.map((h, i) => (
              <div key={`h1-${i}`} className={`${styles.headingRow} ${styles.headingH1}`}>
                <span className={styles.headingTag}>H1</span>
                <span className={styles.headingText}>{h}</span>
              </div>
            ))}
            {h2.slice(0, 8).map((h, i) => (
              <div key={`h2-${i}`} className={`${styles.headingRow} ${styles.headingH2}`}>
                <span className={styles.headingTag}>H2</span>
                <span className={styles.headingText}>{h}</span>
              </div>
            ))}
            {h2.length > 8 && (
              <p className={styles.moreNote}>+{h2.length - 8} more H2 headings</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Content preview */}
      {preview && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Content Preview</h2>
          <div className={styles.preview}>
            <p>{preview}{preview.length >= 480 ? '…' : ''}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
