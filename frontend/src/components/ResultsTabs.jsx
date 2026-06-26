import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ScoreTab from './tabs/ScoreTab.jsx';
import ContentTab from './tabs/ContentTab.jsx';
import CompetitorTab from './tabs/CompetitorTab.jsx';
import RewriteTab from './tabs/RewriteTab.jsx';
import ActionPlanTab from './tabs/ActionPlanTab.jsx';
import DownloadMenu from './DownloadMenu.jsx';
import styles from './ResultsTabs.module.css';

const TABS = [
  { id: 'score',      label: 'GEO Score',     icon: '🧠', shortLabel: 'Score' },
  { id: 'content',    label: 'Content',        icon: '🔍', shortLabel: 'Content' },
  { id: 'competitors',label: 'Competitors',    icon: '🏆', shortLabel: 'Rivals' },
  { id: 'rewrites',   label: 'Rewrites',       icon: '✍️', shortLabel: 'Rewrites' },
  { id: 'action',     label: 'Action Plan',    icon: '📋', shortLabel: 'Plan' },
];

function scoreColor(score) {
  if (score >= 8)  return 'var(--score-great)';
  if (score >= 6.5)return 'var(--score-good)';
  if (score >= 4.5)return 'var(--score-fair)';
  return 'var(--score-poor)';
}

function scoreLabel(score) {
  if (score >= 8)  return 'Excellent';
  if (score >= 6.5)return 'Good';
  if (score >= 4.5)return 'Fair';
  return 'Needs Work';
}

export default function ResultsTabs({ results, url, topic, geoScore, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('score');

  const { parsedContent, geoAudit, competitorData, rewrites, finalReport } = results ?? {};
  const score = geoAudit?.overall_score ?? geoScore ?? 0;

  return (
    <div className={styles.shell}>
      {/* ─── Sticky chrome: header + tab bar combined ─── */}
      <div className={styles.chrome}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.urlRow}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className={styles.urlText}>{url}</span>
            </div>
            <div className={styles.topicRow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className={styles.topicText}>{topic}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.scoreBadge} style={{ '--badge-color': scoreColor(score) }}>
              <span className={styles.scoreBadgeNum}>{score?.toFixed?.(1) ?? score}</span>
              <div className={styles.scoreBadgeMeta}>
                <span className={styles.scoreBadgeLabel}>GEO Score</span>
                <span className={styles.scoreBadgeRating}>{scoreLabel(score)}</span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <DownloadMenu results={results} url={url} topic={topic} score={score} />
              <button className={styles.newBtn} onClick={onNewAnalysis}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                <span>New Analysis</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Tab bar ─── */}
        <div className={styles.tabBar}>
          <div className={styles.tabList} role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
                <span className={styles.tabLabelShort}>{tab.shortLabel}</span>
                {activeTab === tab.id && (
                  <motion.div className={styles.tabUnderline} layoutId="tab-underline" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab content ─── */}
      <div className={styles.content} id="report-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'score'       && <ScoreTab       geoAudit={geoAudit} />}
            {activeTab === 'content'     && <ContentTab     parsedContent={parsedContent} />}
            {activeTab === 'competitors' && <CompetitorTab  competitorData={competitorData} />}
            {activeTab === 'rewrites'    && <RewriteTab     rewrites={rewrites} geoAudit={geoAudit} url={url} topic={topic} />}
            {activeTab === 'action'      && <ActionPlanTab  finalReport={finalReport} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
