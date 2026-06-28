import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ContentTab.module.css';

const SIGNAL_CARDS = [
  {
    icon: '📝',
    name: 'Word Count',
    desc: 'Longer, comprehensive content scores higher. AI prefers pages that cover a topic fully. Aim for 1,500+ words on competitive topics.',
    accentColor: '#2563EB',
  },
  {
    icon: '🔤',
    name: 'Heading Structure',
    desc: 'Clear H1/H2/H3 headings help AI parse content into citable sections. One H1, multiple H2s, and optional H3 sub-sections is the ideal pattern.',
    accentColor: '#16A34A',
  },
  {
    icon: '🔗',
    name: 'Schema Markup',
    desc: 'Structured data tells AI systems exactly what your page is about. Pages with schema are far more likely to appear in AI-generated answers.',
    accentColor: '#7C3AED',
  },
  {
    icon: '❓',
    name: 'FAQ Section',
    desc: 'A dedicated FAQ signals that your page directly answers questions — exactly how people prompt AI. One of the highest-impact GEO signals you can add.',
    accentColor: '#D97706',
  },
];

// Maps each stat label to its signal card index
const STAT_SIGNAL_MAP = {
  'Word Count': 0,
  'H1 Headings': 1,
  'H2 Headings': 1,
  'H3 Headings': 1,
  'Schema Markup': 2,
  'FAQ Section': 3,
};

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

function StatCard({ label, value, valueColor, delay = 0, signalIndex, selected, onSelect }) {
  return (
    <motion.button
      className={`${styles.statCard} ${selected ? styles.statCardSelected : ''}`}
      onClick={() => onSelect(signalIndex)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <span className={styles.statValue} style={{ color: valueColor }}>{value ?? 'N/A'}</span>
      <span className={styles.statLabel}>{label}</span>
    </motion.button>
  );
}

export default function ContentTab({ parsedContent }) {
  const [headingsExpanded, setHeadingsExpanded] = useState(false);
  const [previewExpanded, setPreviewExpanded]   = useState(false);
  const [selectedSignal, setSelectedSignal]     = useState(null);

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

  const fullPreview = paragraphs.slice(0, 3).join(' ').slice(0, 480);
  const shortPreview = fullPreview.slice(0, 120);
  const previewText = previewExpanded ? fullPreview : shortPreview;
  const previewTruncated = !previewExpanded && fullPreview.length > 120;

  const wordCountColor = wordCount > 800 ? '#2563EB' : '#6B7280';
  const h1Color = h1.length === 1 ? '#16A34A' : '#DC2626';
  const h2Color = h2.length >= 3 ? '#2563EB' : '#6B7280';
  const schemaColor = structuralSignals.hasSchema ? '#16A34A' : '#DC2626';
  const faqColor = structuralSignals.hasFAQ ? '#16A34A' : '#6B7280';

  const allHeadings = [
    ...h1.map(h => ({ type: 'H1', text: h })),
    ...h2.map(h => ({ type: 'H2', text: h })),
  ];

  const handleStatClick = (signalIdx) => {
    setSelectedSignal(prev => prev === signalIdx ? null : signalIdx);
  };

  return (
    <div className={styles.page}>
      {/* Stats grid FIRST */}
      <div className={styles.statsSection}>
        <p className={styles.statsHint}>Click any metric to see what it means for AI</p>
        <div className={styles.statsGrid}>
          <StatCard label="Word Count"    value={wordCount?.toLocaleString()} valueColor={wordCountColor} signalIndex={STAT_SIGNAL_MAP['Word Count']}    selected={selectedSignal === STAT_SIGNAL_MAP['Word Count']}    onSelect={handleStatClick} delay={0} />
          <StatCard label="H1 Headings"   value={h1.length}                   valueColor={h1Color}        signalIndex={STAT_SIGNAL_MAP['H1 Headings']}   selected={selectedSignal === STAT_SIGNAL_MAP['H1 Headings']}   onSelect={handleStatClick} delay={0.05} />
          <StatCard label="H2 Headings"   value={h2.length}                   valueColor={h2Color}        signalIndex={STAT_SIGNAL_MAP['H2 Headings']}   selected={selectedSignal === STAT_SIGNAL_MAP['H2 Headings']}   onSelect={handleStatClick} delay={0.10} />
          <StatCard label="H3 Headings"   value={h3.length}                   valueColor="#6B7280"        signalIndex={STAT_SIGNAL_MAP['H3 Headings']}   selected={selectedSignal === STAT_SIGNAL_MAP['H3 Headings']}   onSelect={handleStatClick} delay={0.15} />
          <StatCard label="Schema Markup" value={structuralSignals.hasSchema ? 'Yes' : 'No'} valueColor={schemaColor} signalIndex={STAT_SIGNAL_MAP['Schema Markup']} selected={selectedSignal === STAT_SIGNAL_MAP['Schema Markup']} onSelect={handleStatClick} delay={0.20} />
          <StatCard label="FAQ Section"   value={structuralSignals.hasFAQ   ? 'Yes' : 'No'} valueColor={faqColor}    signalIndex={STAT_SIGNAL_MAP['FAQ Section']}   selected={selectedSignal === STAT_SIGNAL_MAP['FAQ Section']}   onSelect={handleStatClick} delay={0.25} />
        </div>

        {/* Inline signal explanation — appears on click */}
        <AnimatePresence mode="wait">
          {selectedSignal !== null && (
            <motion.div
              key={selectedSignal}
              className={styles.signalDetail}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div
                className={styles.signalCard}
                style={{ borderLeftColor: SIGNAL_CARDS[selectedSignal].accentColor }}
              >
                <span
                  className={styles.signalCardIcon}
                  style={{ background: `${SIGNAL_CARDS[selectedSignal].accentColor}18` }}
                >
                  {SIGNAL_CARDS[selectedSignal].icon}
                </span>
                <div className={styles.signalCardContent}>
                  <span className={styles.signalCardName}>{SIGNAL_CARDS[selectedSignal].name}</span>
                  <span className={styles.signalCardDesc}>{SIGNAL_CARDS[selectedSignal].desc}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page Details */}
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
            <span className={styles.detailVal}>{title || 'N/A'}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Meta Description</span>
            <span className={styles.detailVal}>{metaDescription || <em className={styles.missing}>Not found</em>}</span>
          </div>
        </div>
      </motion.div>

      {/* Heading Structure */}
      {allHeadings.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <h2 className={styles.sectionTitle}>Heading Structure</h2>
          <div className={styles.headings}>
            {allHeadings.slice(0, 1).map((h, i) => (
              <div key={i} className={`${styles.headingRow} ${h.type === 'H1' ? styles.headingH1 : styles.headingH2}`}>
                <span className={styles.headingTag}>{h.type}</span>
                <span className={styles.headingText}>{h.text}</span>
              </div>
            ))}
            <AnimatePresence initial={false}>
              {headingsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}
                >
                  {allHeadings.slice(1, 9).map((h, i) => (
                    <div key={i} className={`${styles.headingRow} ${h.type === 'H1' ? styles.headingH1 : styles.headingH2}`}>
                      <span className={styles.headingTag}>{h.type}</span>
                      <span className={styles.headingText}>{h.text}</span>
                    </div>
                  ))}
                  {allHeadings.length > 9 && (
                    <p className={styles.moreNote}>+{allHeadings.length - 9} more headings</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {allHeadings.length > 1 && (
            <button className={styles.showMoreBtn} onClick={() => setHeadingsExpanded(e => !e)}>
              {headingsExpanded ? 'Show less' : 'Show more'}
              <Chevron open={headingsExpanded} />
            </button>
          )}
        </motion.div>
      )}

      {/* Content Preview */}
      {fullPreview && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Content Preview</h2>
          <div className={styles.preview}>
            <p>{previewText}{previewTruncated ? '…' : (fullPreview.length >= 480 && previewExpanded ? '…' : '')}</p>
          </div>
          {fullPreview.length > 120 && (
            <button className={styles.showMoreBtn} onClick={() => setPreviewExpanded(e => !e)}>
              {previewExpanded ? 'Show less' : 'Read full preview'}
              <Chevron open={previewExpanded} />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
