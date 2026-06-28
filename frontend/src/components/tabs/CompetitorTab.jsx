import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, Zap, Target,
  ChevronDown, ExternalLink, Check,
} from 'lucide-react';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold.jsx';
import styles from './CompetitorTab.module.css';

// ── Zone 1: Landscape Summary Strip ───────────────────────────────────────────

function LandscapeStrip({ competitorData }) {
  const { competitors = [], dominant_content_types, gap_opportunities = [] } = competitorData;

  const contentType = Array.isArray(dominant_content_types)
    ? dominant_content_types[0]
    : dominant_content_types;

  const pills = [
    {
      icon: <Globe size={14} />,
      label: `${competitors.length} AI-cited source${competitors.length !== 1 ? 's' : ''} found`,
    },
    contentType && {
      icon: <FileText size={14} />,
      label: `Dominant format: ${contentType}`,
    },
    {
      icon: <Zap size={14} />,
      label: 'Top signal: Domain authority',
    },
    gap_opportunities.length > 0 && {
      icon: <Target size={14} />,
      label: `${gap_opportunities.length} content gap${gap_opportunities.length !== 1 ? 's' : ''} identified`,
    },
  ].filter(Boolean);

  return (
    <motion.div
      className={styles.landscapeStrip}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {pills.map((pill, i) => (
        <div key={i} className={styles.statPill}>
          <span className={styles.pillIcon}>{pill.icon}</span>
          <span className={styles.pillLabel}>{pill.label}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ── Zone 2: Competitor Cards ───────────────────────────────────────────────────

const listVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardItemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function CompetitorCard({ competitor, rank }) {
  const [expanded, setExpanded] = useState(false);
  const {
    domain,
    url,
    key_differentiator,
    why_ai_cites_it = [],
    geo_strengths = [],
  } = competitor;

  const siteUrl = url || `https://${domain}`;
  const isTop = rank === 1;

  return (
    <motion.div
      variants={cardItemVariants}
      whileHover={{ y: -2 }}
      className={`${styles.compCard} ${isTop ? styles.compCardTop : ''}`}
      onClick={() => setExpanded(v => !v)}
    >
      <div className={styles.cardRow}>
        {/* Left: rank + domain */}
        <div className={styles.cardLeft}>
          <span className={styles.cardRank}>{String(rank).padStart(2, '0')}</span>
          <div className={styles.cardIdentity}>
            <div className={styles.domainRow}>
              <span className={styles.cardDomain}>{domain}</span>
              {isTop && <span className={styles.topBadge}>Top AI-cited</span>}
            </div>
          </div>
        </div>

        {/* Center: key differentiator */}
        <p className={styles.cardDiff}>{renderMarkdownBold(key_differentiator)}</p>

        {/* Right: visit button + chevron */}
        <div className={styles.cardRight}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(siteUrl, '_blank', 'noopener,noreferrer');
            }}
            className={styles.visitBtn}
          >
            <ExternalLink size={13} />
            Visit site
          </motion.button>
          <motion.span
            className={styles.chevron}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.expandedContent}>
              <div className={styles.expandedColumns}>
                <div className={styles.expandedCol}>
                  <span className={styles.expandedColLabel}>Why AI cites this</span>
                  <ul className={styles.citesList}>
                    {why_ai_cites_it.map((item, i) => (
                      <li key={i} className={styles.citesItem}>
                        <Check size={12} className={styles.checkIcon} />
                        <span>{renderMarkdownBold(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.expandedCol}>
                  <span className={styles.expandedColLabel}>GEO strengths</span>
                  <div className={styles.chipRow}>
                    {geo_strengths.map((strength, i) => (
                      <span key={i} className={styles.chip}>{strength}</span>
                    ))}
                  </div>
                </div>
              </div>

              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.visitLink}
                onClick={e => e.stopPropagation()}
              >
                Visit {domain} →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Zone 3: Gaps You Can Win ───────────────────────────────────────────────────

const gapListVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

const gapItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function GapsSection({ gaps }) {
  if (!gaps?.length) return null;

  return (
    <section className={styles.gapsSection}>
      <div className={styles.gapsHeader}>
        <span className={styles.gapsTitle}>Gaps you can win</span>
        <span className={styles.gapsPill}>{gaps.length} opportunities</span>
      </div>

      <motion.div
        className={styles.gapsList}
        variants={gapListVariants}
        initial="initial"
        animate="animate"
      >
        {gaps.map((gap, i) => (
          <motion.div
            key={i}
            variants={gapItemVariants}
            whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
            className={styles.gapCard}
          >
            <span className={styles.gapNumber}>{i + 1}</span>
            <p className={styles.gapText}>{gap}</p>
            <span className={styles.gapTag}>Content opportunity</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function CompetitorTab({ results }) {
  const { competitorData } = results ?? {};

  if (!competitorData?.competitors?.length) {
    return (
      <div className={styles.empty}>
        No competitor data available for this topic.
      </div>
    );
  }

  const { competitors = [], gap_opportunities = [] } = competitorData;

  return (
    <div className={styles.page}>
      <LandscapeStrip competitorData={competitorData} />

      <motion.div
        className={styles.cardsList}
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        {competitors.map((c, i) => (
          <CompetitorCard key={i} competitor={c} rank={i + 1} />
        ))}
      </motion.div>

      <GapsSection gaps={gap_opportunities} />
    </div>
  );
}
