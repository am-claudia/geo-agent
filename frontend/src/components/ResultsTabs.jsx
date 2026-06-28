import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SummaryTab from './tabs/SummaryTab.jsx';
import ScoreTab from './tabs/ScoreTab.jsx';
import ContentTab from './tabs/ContentTab.jsx';
import CompetitorTab from './tabs/CompetitorTab.jsx';
import RewriteTab from './tabs/RewriteTab.jsx';
import ActionPlanTab from './tabs/ActionPlanTab.jsx';
import DownloadMenu from './DownloadMenu.jsx';
import { getScoreColor } from '../utils/scoreColor.js';
import styles from './ResultsTabs.module.css';

const TABS = [
  { id: 'score',       label: 'GEO Score',    shortLabel: 'Score' },
  { id: 'content',     label: 'Content',      shortLabel: 'Content' },
  { id: 'competitors', label: 'Competitors',  shortLabel: 'Rivals' },
  { id: 'rewrites',    label: 'Rewrites',     shortLabel: 'Rewrites' },
  { id: 'action',      label: 'Action Plan',  shortLabel: 'Plan' },
  { id: 'summary',     label: 'Summary',      shortLabel: 'Summary', separator: true },
];

export default function ResultsTabs({ results, url, topic, geoScore, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('score');

  const { parsedContent, geoAudit, competitorData, rewrites, finalReport } = results ?? {};
  const score = geoAudit?.overall_score ?? geoScore ?? 0;
  const color = getScoreColor(score);

  return (
    <div className={styles.shell}>
      {/* ─── Sticky chrome: header + tab bar ─── */}
      <div className={styles.chrome}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.urlRow}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className={styles.urlText}>{url}</span>
            </div>
            <div className={styles.topicRow}>
              <span className={styles.topicText}>{topic}</span>
            </div>
            {results?.cache_hit && (
              <span className={styles.cacheBadge}>⚡ Cached result</span>
            )}
          </div>

          <div className={styles.headerRight}>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreBadgeNum}>{score?.toFixed?.(1) ?? score}</span>
              <span className={styles.scoreBadgeLabel}>/ 10</span>
            </div>

            <div className={styles.headerActions}>
              <DownloadMenu results={results} url={url} topic={topic} score={score} />
              <button className={styles.newBtn} onClick={onNewAnalysis}>
                New Analysis
              </button>
            </div>
          </div>
        </div>

        {/* ─── Tab bar ─── */}
        <div className={styles.tabBar}>
          <div className={styles.tabList} role="tablist">
            {TABS.map(tab => (
              <div key={tab.id} className={styles.tabWrap}>
                {tab.separator && <div className={styles.tabSeparator} aria-hidden="true" />}
                <button
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                >
                  <span className={styles.tabLabel}>{tab.label}</span>
                  <span className={styles.tabLabelShort}>{tab.shortLabel}</span>
                  {activeTab === tab.id && (
                    <motion.div className={styles.tabUnderline} layoutId="tab-underline" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab content ─── */}
      <div className={styles.contentBg}>
        <div className={styles.content} id="report-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTab === 'summary'     && <SummaryTab     geoAudit={geoAudit} finalReport={finalReport} competitorData={competitorData} parsedContent={parsedContent} />}
              {activeTab === 'score'       && <ScoreTab       geoAudit={geoAudit} />}
              {activeTab === 'content'     && <ContentTab     results={results} />}
              {activeTab === 'competitors' && <CompetitorTab results={results} />}
              {activeTab === 'rewrites'    && <RewriteTab     rewrites={rewrites} geoAudit={geoAudit} url={url} topic={topic} />}
              {activeTab === 'action'      && <ActionPlanTab  finalReport={finalReport} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
