import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RewriteTab.module.css';

function boldNumbers(text) {
  if (!text) return null;
  return text.split(/(\b\d+(?:\.\d+)?[%x]?\b)/).map((part, i) =>
    /^\d+(?:\.\d+)?[%x]?$/.test(part) ? <strong key={i}>{part}</strong> : part
  );
}

function RewriteItem({ rewrite, index }) {
  const [expanded, setExpanded] = useState(true);

  const {
    weakness_label,
    weakness_addressed,
    weakness_score,
    before,
    after,
    why_better,
    geo_signals_added = [],
  } = rewrite;

  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <button
        className={styles.itemHeader}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className={styles.itemMeta}>
          <span className={styles.itemNum}>{index + 1}</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>{weakness_label || weakness_addressed}</span>
            {weakness_score != null && (
              <span className={styles.itemScore} style={{ color: weakness_score <= 4 ? 'var(--score-poor)' : weakness_score <= 6 ? 'var(--score-fair)' : 'var(--score-good)' }}>
                Score: {weakness_score}/10
              </span>
            )}
          </div>
        </div>
        <svg
          className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={styles.itemBody}
          >
            <div className={styles.panels}>
              <div className={`${styles.panel} ${styles.panelBefore}`}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelDot} style={{ background: 'var(--score-poor)' }} />
                  Before
                </div>
                <p className={styles.panelText}>{before}</p>
              </div>

              <div className={styles.panelArrow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>

              <div className={`${styles.panel} ${styles.panelAfter}`}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelDot} style={{ background: 'var(--score-great)' }} />
                  After
                </div>
                <p className={styles.panelText}>{after}</p>
              </div>
            </div>

            {why_better && (
              <div className={styles.whyBetter}>
                <span className={styles.whyLabel}>Why this works:</span>
                <span className={styles.whyText}>{boldNumbers(why_better)}</span>
              </div>
            )}

            {geo_signals_added.length > 0 && (
              <div className={styles.signals}>
                <span className={styles.signalsLabel}>GEO signals added:</span>
                <div className={styles.signalTags}>
                  {geo_signals_added.map((s, i) => (
                    <span key={i} className={styles.signalTag}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuickWin({ win, index }) {
  const effortColor = {
    low: 'var(--score-great)',
    medium: 'var(--score-fair)',
    high: 'var(--score-poor)',
  };

  return (
    <motion.div
      className={styles.quickWin}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div className={styles.qwHeader}>
        <span className={styles.qwAction}>{win.action}</span>
        <div className={styles.qwBadges}>
          {win.effort && (
            <span className={styles.qwBadge} style={{ color: effortColor[win.effort] || 'var(--text-secondary)' }}>
              {win.effort} effort
            </span>
          )}
          {win.impact && (
            <span className={styles.qwBadge} style={{ color: effortColor[win.impact] || 'var(--text-secondary)' }}>
              {win.impact} impact
            </span>
          )}
        </div>
      </div>
      {win.example && <p className={styles.qwExample}>e.g. {win.example}</p>}
    </motion.div>
  );
}

function generateLLMPrompt(rewrites, geoAudit, url, topic) {
  const score = geoAudit?.overall_score;
  const weaknesses = geoAudit?.top_weaknesses || [];
  const items = rewrites?.rewrites || [];

  const weaknessList = weaknesses.length > 0
    ? weaknesses.map(w => {
        const label = w.criterion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `- ${label}: ${w.feedback || 'needs improvement'}`;
      }).join('\n')
    : '- See audit results for specific weaknesses';

  const rewriteAreas = items.length > 0
    ? items.map(r => r.weakness_label || r.weakness_addressed).filter(Boolean).join(', ')
    : 'all content sections';

  return `You are a content expert specializing in Generative Engine Optimization (GEO). I need you to rewrite the content on this page so it is more likely to be cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews.

Page: ${url || '[paste your URL]'}
Topic: ${topic || '[your topic]'}
Current GEO Score: ${score != null ? `${score}/10` : 'see audit'}

Key weaknesses to address:
${weaknessList}

Specific sections needing rewriting: ${rewriteAreas}

Please rewrite the content with these GEO improvements:
1. Add quotable, specific statements with concrete data points and statistics that AI can cite verbatim.
2. Include a Q&A section that directly answers questions users ask AI about this topic.
3. Strengthen authority signals: add credentials, cite sources, use precise expert language.
4. Improve structural clarity: use clear H2 and H3 headings organized by sub-topic.
5. Ensure comprehensive coverage so this page is the definitive source on the topic.
6. Add a brief definition or summary at the top that AI can use as a direct answer.

Keep the core message and facts of the original content. Focus on making each section standalone and citable. The goal is for AI to confidently reference this page as a trusted source.`;
}

function LLMPromptBlock({ rewrites, geoAudit, url, topic }) {
  const [copied, setCopied] = useState(false);
  const prompt = generateLLMPrompt(rewrites, geoAudit, url, topic);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      className={styles.promptBlock}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className={styles.promptHeader}>
        <div className={styles.promptTitleGroup}>
          <span className={styles.promptIcon}>🤖</span>
          <div>
            <h2 className={styles.promptTitle}>Prompt for your LLM</h2>
            <p className={styles.promptSubtitle}>
              Paste this into <strong>any LLM</strong> (ChatGPT, Gemini, Claude, and more) to rewrite your full page based on these audit findings.
            </p>
          </div>
        </div>
        <button
          className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
          onClick={handleCopy}
          aria-label="Copy prompt to clipboard"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy prompt
            </>
          )}
        </button>
      </div>
      <pre className={styles.promptText}>{prompt}</pre>
    </motion.div>
  );
}

export default function RewriteTab({ rewrites, geoAudit, url, topic }) {
  if (!rewrites) {
    return <div className={styles.empty}>Rewrite data not available.</div>;
  }

  const { rewrites: items = [], additional_quick_wins = [] } = rewrites;

  return (
    <div className={styles.page}>
      {/* Contextual explanation */}
      <div className={styles.explainer}>
        <div className={styles.explainerRow}>
          <div className={styles.explainerItem}>
            <span className={styles.explainerIcon}>✍️</span>
            <div>
              <strong className={styles.explainerTitle}>Before / After rewrites</strong>
              <p className={styles.explainerDesc}>AI-generated rewrites for the specific sections hurting your GEO score. Each one targets a weakness from the audit and shows exactly what optimized content looks like.</p>
            </div>
          </div>
          <div className={styles.explainerItem}>
            <span className={styles.explainerIcon}>🤖</span>
            <div>
              <strong className={styles.explainerTitle}>Full-page rewrite prompt</strong>
              <p className={styles.explainerDesc}>At the bottom: a ready-to-use prompt you can paste into <strong>any LLM</strong> (ChatGPT, Gemini, Claude, and more) to rewrite your entire page in one shot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main rewrites */}
      {items.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Before / After Rewrites</h2>
          <p className={styles.sectionHint}>
            Each section targets a specific GEO weakness. Click to expand or collapse.
          </p>
          <div className={styles.items}>
            {items.map((r, i) => (
              <RewriteItem key={i} rewrite={r} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>No rewrites generated.</div>
      )}

      {/* Quick wins */}
      {additional_quick_wins.length > 0 && (
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>Additional Quick Wins</h2>
          <div className={styles.quickWins}>
            {additional_quick_wins.map((w, i) => (
              <QuickWin key={i} win={w} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* LLM prompt section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Full-Page Rewrite Prompt</h2>
        <LLMPromptBlock rewrites={rewrites} geoAudit={geoAudit} url={url} topic={topic} />
      </div>
    </div>
  );
}
