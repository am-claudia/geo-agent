import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderMarkdownBold } from '../../utils/renderMarkdownBold.jsx';
import styles from './ActionPlanTab.module.css';

function boldNumbers(text) {
  if (!text) return null;
  return text.split(/(\b\d+(?:\.\d+)?[%x]?\b)/).map((part, i) =>
    /^\d+(?:\.\d+)?[%x]?$/.test(part) ? <strong key={i}>{part}</strong> : part
  );
}

function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
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

const EFFORT_CLASS = {
  low:    'badgeLow',
  medium: 'badgeMedium',
  high:   'badgeHigh',
};

function effortColor(effort) {
  if (effort === 'high')   return '#ef4444';
  if (effort === 'medium') return '#f97316';
  if (effort === 'low')    return '#22c55e';
  return 'var(--border-mid)';
}

function TimelineItem({ item, index, expanded, onToggle }) {
  const {
    priority,
    action,
    criterion_label,
    expected_impact,
    implementation,
    effort,
    timeline,
  } = item;

  const nodeColor = effortColor(effort);
  const effortClass = styles[EFFORT_CLASS[effort]] || styles.badgeTimeline;

  return (
    <motion.div
      className={styles.timelineItem}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
    >
      {/* Node */}
      <div className={styles.timelineNodeWrap}>
        <div className={styles.timelineNode} style={{ background: nodeColor }}>
          <span className={styles.timelineNodeNum}>{priority ?? index + 1}</span>
        </div>
      </div>

      {/* Card */}
      <div
        className={`${styles.timelineCard} ${expanded ? styles.timelineCardExpanded : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      >
        <div className={styles.timelineCardHeader}>
          <div className={styles.timelineCardTitle}>
            {effort && (
              <span className={`${styles.priorityPill} ${effortClass}`}>
                {effort.charAt(0).toUpperCase() + effort.slice(1)}
              </span>
            )}
            <h3 className={styles.action}>{action}</h3>
          </div>
          <div className={styles.timelineCardRight}>
            <div className={styles.badges}>
              {timeline && (
                <span className={`${styles.badge} ${styles.badgeTimeline}`}>{timeline}</span>
              )}
            </div>
            <Chevron open={expanded} />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className={styles.timelineCardBody}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.timelineCardBodyInner}>
                {criterion_label && (
                  <div className={styles.criterion}>
                    <svg className={styles.criterionIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>Targets: <strong>{criterion_label}</strong></span>
                  </div>
                )}

                {expected_impact && (
                  <p className={styles.impact}>
                    <span className={styles.impactLabel}>Expected impact:</span> {boldNumbers(expected_impact)}
                  </p>
                )}

                {implementation && (
                  <div className={styles.implementation}>
                    <span className={styles.implLabel}>HOW TO DO IT</span>
                    <p className={styles.implText}>{implementation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'high',   label: 'High Priority' },
  { id: 'medium', label: 'Medium' },
  { id: 'low',    label: 'Low' },
];

export default function ActionPlanTab({ finalReport }) {
  const [explainerOpen, setExplainerOpen]   = useState(false);
  const [filter, setFilter]                 = useState('all');
  const [expandedItems, setExpandedItems]   = useState(new Set());

  if (!finalReport) {
    return <div className={styles.empty}>Action plan not available.</div>;
  }

  const { action_plan = [], closing_insight } = finalReport;

  const filteredActions = filter === 'all'
    ? action_plan
    : action_plan.filter(item => (item.effort || '').toLowerCase() === filter);

  const toggleItem = (i) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      {/* Collapsed explainer toggle */}
      <div className={styles.explainerToggleWrap}>
        <button
          className={styles.explainerToggle}
          onClick={() => setExplainerOpen(o => !o)}
          aria-expanded={explainerOpen}
        >
          How actions are prioritized
          <Chevron open={explainerOpen} />
        </button>
        <AnimatePresence initial={false}>
          {explainerOpen && (
            <motion.div
              className={styles.explainerBody}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className={styles.explainerBodyInner}>
                <div className={styles.explainerCards}>
                  <div className={styles.explainerCard} style={{ borderLeftColor: '#6366f1' }}>
                    <span className={styles.explainerCardIcon}>📈</span>
                    <div>
                      <strong className={styles.explainerCardTitle}>Impact-to-effort ratio</strong>
                      <p className={styles.explainerCardDesc}>Actions are ranked by the biggest GEO gain for the least effort. The first 2–3 items produce the largest jump in AI citability.</p>
                    </div>
                  </div>
                  <div className={styles.explainerCard} style={{ borderLeftColor: '#f97316' }}>
                    <span className={styles.explainerCardIcon}>🎯</span>
                    <div>
                      <strong className={styles.explainerCardTitle}>Targets a specific weakness</strong>
                      <p className={styles.explainerCardDesc}>Each action maps to a GEO criterion identified in the audit. Completing it directly improves that criterion's score.</p>
                    </div>
                  </div>
                  <div className={styles.explainerCard} style={{ borderLeftColor: '#22c55e' }}>
                    <span className={styles.explainerCardIcon}>⏱️</span>
                    <div>
                      <strong className={styles.explainerCardTitle}>Realistic timeline</strong>
                      <p className={styles.explainerCardDesc}>Effort levels reflect how much work is involved. Low-effort wins can be done today; high-effort items need planning.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Strategic insight */}
      {closing_insight && (
        <motion.div
          className={styles.closing}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className={styles.closingLabel}>STRATEGIC INSIGHT</span>
          {(() => {
            const sentences = splitSentences(closing_insight);
            const [lead, ...rest] = sentences.length > 0 ? sentences : [closing_insight];
            return (
              <>
                <p className={styles.closingLead}>{renderMarkdownBold(lead)}</p>
                {rest.length > 0 && (
                  <ul className={styles.closingBullets}>
                    {rest.map((b, i) => (
                      <li key={i} className={styles.closingBulletItem}>
                        {renderMarkdownBold(b)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Prioritized action plan — vertical timeline */}
      {action_plan.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Prioritized Action Plan</h2>
          <p className={styles.sectionHint}>Ordered by impact-to-effort ratio. Click any action to expand details.</p>

          {/* Filter bar */}
          <div className={styles.filterBar}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`${styles.filterPill} ${filter === f.id ? styles.filterPillActive : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id !== 'all' && (
                  <span className={styles.filterCount}>
                    {action_plan.filter(a => (a.effort || '').toLowerCase() === f.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className={styles.timeline}>
            <div className={styles.timelineLine} />
            <AnimatePresence>
              {filteredActions.map((item, i) => {
                const globalIndex = action_plan.indexOf(item);
                return (
                  <TimelineItem
                    key={globalIndex}
                    item={item}
                    index={i}
                    expanded={expandedItems.has(globalIndex)}
                    onToggle={() => toggleItem(globalIndex)}
                  />
                );
              })}
            </AnimatePresence>
            {filteredActions.length === 0 && (
              <p className={styles.filterEmpty}>No {filter}-priority actions found.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>No action plan items found.</div>
      )}
    </div>
  );
}
