import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RewriteTab.module.css';

function isCodeContent(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.includes('"@context"') || trimmed.includes('"@type"');
}

function boldNumbers(text) {
  if (!text) return null;
  return text.split(/(\b\d+(?:\.\d+)?[%x]?\b)/).map((part, i) =>
    /^\d+(?:\.\d+)?[%x]?$/.test(part) ? <strong key={i}>{part}</strong> : part
  );
}


function scoreColor(score) {
  if (score == null) return '#6B7280';
  if (score <= 4) return '#DC2626';
  if (score <= 6) return '#D97706';
  return '#16A34A';
}

function RewriteItem({ rewrite, index }) {
  const [collapsed, setCollapsed] = useState(false);

  const {
    weakness_label,
    weakness_addressed,
    weakness_score,
    before,
    after,
    why_better,
    geo_signals_added = [],
  } = rewrite;

  const tierColor = scoreColor(weakness_score);

  return (
    <motion.div
      className={styles.item}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={styles.itemHeader}>
        <div className={styles.itemMeta}>
          <span className={styles.itemNum}>{index + 1}</span>
          <div className={styles.itemInfo}>
            <span className={styles.itemLabel}>{weakness_label || weakness_addressed}</span>
            {weakness_score != null && (
              <span
                className={styles.itemScoreBadge}
                style={{ color: tierColor, borderColor: tierColor }}
              >
                {weakness_score}/10
              </span>
            )}
          </div>
        </div>
        <button
          className={styles.itemToggleBtn}
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand rewrite' : 'Collapse rewrite'}
        >
          <svg
            className={`${styles.chevronIcon} ${collapsed ? '' : styles.chevronOpen}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.itemBody}>
              <div className={styles.panels}>
                <div className={`${styles.panel} ${styles.panelBefore}`}>
                  <div className={styles.panelLabel}>
                    <span className={styles.panelDot} style={{ background: 'var(--score-poor)' }} />
                    Before
                  </div>
                  {before
                    ? <p className={styles.panelText}>{before}</p>
                    : <p className={styles.panelText} style={{ fontStyle: 'italic', opacity: 0.5 }}>No original content captured for this section.</p>
                  }
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
                  {!after
                    ? <p className={styles.panelText} style={{ fontStyle: 'italic', opacity: 0.5 }}>Rewrite not generated for this section.</p>
                    : isCodeContent(after)
                      ? <pre className={styles.panelCode}><code>{after}</code></pre>
                      : <p className={styles.panelText}>{after}</p>
                  }
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const EFFORT_CLASS = {
  low:    'badgeLow',
  medium: 'badgeMedium',
  high:   'badgeHigh',
};

function QuickWin({ win, index }) {
  const [exampleOpen, setExampleOpen] = useState(false);
  const effortClass = styles[EFFORT_CLASS[win.effort]] || styles.badgeDefault;
  const impactClass = styles[EFFORT_CLASS[win.impact]] || styles.badgeDefault;
  const hasExample = Boolean(win.example);

  return (
    <motion.div
      className={`${styles.quickWin} ${hasExample ? styles.quickWinClickable : ''} ${exampleOpen ? styles.quickWinOpen : ''}`}
      onClick={hasExample ? () => setExampleOpen(o => !o) : undefined}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <div className={styles.qwHeader}>
        <div className={styles.qwTitleGroup}>
          <span className={styles.qwAction}>{win.action}</span>
          {hasExample && (
            <span className={styles.qwHint}>
              {exampleOpen ? 'Click to hide example' : 'Click to see example'}
            </span>
          )}
        </div>
        <div className={styles.qwBadges}>
          {win.effort && (
            <span className={`${styles.qwBadge} ${effortClass}`}>
              {win.effort} effort
            </span>
          )}
          {win.impact && (
            <span className={`${styles.qwBadge} ${impactClass}`}>
              {win.impact} impact
            </span>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {exampleOpen && win.example && (
          <motion.p
            className={styles.qwExample}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            e.g. {win.example}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function generateLLMPrompt(rewrites, geoAudit, url, topic) {
  const score = geoAudit?.overall_score;
  const weaknesses = geoAudit?.top_weaknesses || [];
  const strengths = geoAudit?.strengths || [];
  const items = rewrites?.rewrites || [];

  const weaknessList = weaknesses.length > 0
    ? weaknesses.map(w => {
        const label = w.criterion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const scoreNote = w.score != null ? ` (score: ${w.score}/10)` : '';
        return `- ${label}${scoreNote}: ${w.feedback || 'needs improvement'}`;
      }).join('\n')
    : '- See audit results for specific weaknesses';

  const strengthsList = strengths.length > 0
    ? strengths.map(s => `- ${s}`).join('\n')
    : '(none identified)';

  const rewriteSections = items.length > 0
    ? items.map((r, i) => {
        const label = r.weakness_label || r.weakness_addressed || `Section ${i + 1}`;
        const scoreNote = r.weakness_score != null ? ` (score: ${r.weakness_score}/10)` : '';
        return `  ${i + 1}. ${label}${scoreNote}`;
      }).join('\n')
    : '  - All content sections';

  return `You are an expert content strategist specializing in Generative Engine Optimization (GEO). Your task is to rewrite the following page so it gets cited more often by AI systems like ChatGPT, Perplexity, Claude, and Google AI Overviews.

═══════════════════════════════════════
PAGE CONTEXT
═══════════════════════════════════════
URL: ${url || '[your URL]'}
Topic: ${topic || '[your topic]'}
Current GEO Score: ${score != null ? `${score}/10` : '[see audit]'}

═══════════════════════════════════════
WEAKNESSES TO FIX (highest priority)
═══════════════════════════════════════
${weaknessList}

═══════════════════════════════════════
STRENGTHS TO PRESERVE
═══════════════════════════════════════
${strengthsList}

═══════════════════════════════════════
PRIORITY SECTIONS TO REWRITE
═══════════════════════════════════════
${rewriteSections}

═══════════════════════════════════════
REWRITE REQUIREMENTS
═══════════════════════════════════════

1. QUOTABLE STATEMENTS
   - Add 4–6 specific, standalone sentences with precise statistics or facts
   - Each key claim must be self-contained and citable without surrounding context
   - Format: "[Specific claim] according to [source], [concrete number/fact]"
   - Avoid vague language like "many experts say" — use named sources

2. DIRECT Q&A SECTION
   - Add a dedicated FAQ section with 5–7 questions real users ask AI about this topic
   - Each answer: 2–4 sentences max, direct and authoritative
   - Use exact phrasing from common search queries (what, how, why, when, best)
   - Place this section near the top of the page

3. AUTHORITY SIGNALS
   - Add author name, credentials, and publication/update date visibly
   - Cite specific studies, reports, or data sources by name and year
   - Include named expert quotes where relevant (real or representative)
   - Add "According to [org/study]..." framing for key claims

4. STRUCTURAL CLARITY
   - Use H2/H3 headings that mirror how people ask questions about this topic
   - Open with a 2–3 sentence definition/summary AI can use as a direct answer
   - Break paragraphs into 3–5 sentence chunks maximum
   - Add a "Key Takeaways" or "Quick Summary" bullet list at the top

5. SCHEMA MARKUP
   - Recommend the most appropriate schema.org type for this page
   - Provide complete JSON-LD markup with all key properties filled in
   - Include FAQPage schema if a Q&A section is added

6. COMPREHENSIVE COVERAGE
   - Ensure the page answers every sub-question a user might ask about this topic
   - Add a "What you'll learn" or table of contents section if the page is long
   - Cover common objections, misconceptions, or related concepts

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Please provide:
1. Rewritten opening section (first ~200 words including summary + key takeaways)
2. Rewritten version of each priority section listed above (before → after)
3. New FAQ/Q&A section (5–7 Q&As)
4. Complete JSON-LD schema markup
5. List of all GEO signals added (one per line)

Preserve the original brand voice, core facts, and key messaging. Do not add fictional data — if you need statistics, use placeholders like "[stat from your research]". Focus on structure and citability, not keyword density.`;
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
          <h2 className={styles.promptTitle}>Prompt for your LLM</h2>
          <p className={styles.promptSubtitle}>
            Paste this into <strong>any LLM</strong> (ChatGPT, Gemini, Claude, and more) to rewrite your full page based on these audit findings.
          </p>
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
      {/* Main rewrites */}
      {items.length > 0 ? (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Before / After Rewrites</h2>
          <p className={styles.sectionHint}>
            Each section targets a specific GEO weakness. Click ▲/▼ to collapse individual rewrites.
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

      {/* Quick wins — all shown, examples expandable */}
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
