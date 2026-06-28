import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ContentTab.module.css';

const QUESTION_WORDS = ['How', 'What', 'Why', 'When', 'Where', 'Which', 'Is', 'Are', 'Can', 'Does', 'Do', 'Should'];

const STAT_EXPLANATIONS = {
  wordCount:        'AI systems prefer comprehensive content. Under 500 words = thin content risk. 1,500+ words strongly correlates with citation frequency.',
  h1:               'A single clear H1 tells AI systems what the page is definitively about. Multiple H1s create ambiguity.',
  h2:               'H2s define chunk boundaries for RAG retrieval. Aim for 5–8 H2s on a 1,500+ word page.',
  h3:               'H3s add sub-structure within chunks. Useful for FAQ patterns and nested topic coverage.',
  schema:           'Schema.org JSON-LD gives AI systems machine-readable facts. FAQPage, Article, and HowTo schema are highest-value for GEO.',
  faq:              '72.4% of ChatGPT-cited pages contain FAQ-structured content. Direct question-answer pairs are the highest-signal format for AI citation.',
  questionHeadings: 'Question-phrased H2/H3s (How, What, Why, When) directly match user query patterns. Each one is a potential AI citation anchor.',
  published:        'Content updated within 2 months receives 28% more AI citations. Date signals shift LLM reranking by up to 4.78 years.',
};

function formatDate(str) {
  if (!str) return null;
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return str;
  }
}

function isQuestionHeading(text) {
  if (!text) return false;
  if (text.trim().endsWith('?')) return true;
  const first = text.trim().split(/\s+/)[0];
  return QUESTION_WORDS.includes(first);
}

function getWordCountZone(n) {
  if (n < 500)  return { zone: 'thin',     color: '#ef4444' };
  if (n < 1000) return { zone: 'moderate', color: '#f59e0b' };
  if (n < 1500) return { zone: 'strong',   color: '#6366f1' };
  return              { zone: 'optimal',  color: '#10b981' };
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function IconFAQ() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconSchema() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ id, label, value, valueColor, compact = false, delay = 0, selected, onSelect }) {
  return (
    <motion.button
      className={`${styles.statCard} ${selected ? styles.statCardSelected : ''}`}
      onClick={() => onSelect(id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      aria-pressed={selected}
    >
      <span
        className={`${styles.statValue} ${compact ? styles.statValueCompact : ''}`}
        style={{ color: valueColor }}
      >
        {value ?? 'N/A'}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </motion.button>
  );
}

function SignalCard({ icon, label, status, statusColor, implication }) {
  return (
    <div className={styles.sigCard}>
      <div className={styles.sigCardTop}>
        <span className={styles.sigIcon} style={{ color: statusColor }}>{icon}</span>
        <div className={styles.sigMeta}>
          <span className={styles.sigLabel}>{label}</span>
          <span className={styles.sigStatus} style={{ color: statusColor }}>{status}</span>
        </div>
      </div>
      <p className={styles.sigImpl}>{implication}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ContentTab({ results, parsedContent: parsedContentProp }) {
  const [selectedStat, setSelectedStat]         = useState(null);
  const [headingsExpanded, setHeadingsExpanded] = useState(false);
  const [aiExpanded, setAiExpanded]             = useState(false);

  const parsedContent = results?.parsedContent ?? parsedContentProp;

  if (!parsedContent) {
    return <div className={styles.empty}>Content analysis data not available.</div>;
  }

  const {
    title             = '',
    metaDescription   = '',
    wordCount         = 0,
    mainContent       = '',
    headings          = {},
    structuralSignals = {},
    url,
  } = parsedContent;

  const { h1 = [], h2 = [], h3 = [] } = headings;
  const {
    hasLists             = false,
    hasFAQ               = false,
    hasSchema            = false,
    schemaTypes          = [],
    datePublished        = null,
    dateModified         = null,
    schemaAuthor         = null,
    questionHeadingCount = 0,
  } = structuralSignals;

  // ── Colors ───────────────────────────────────────────────────────────────────
  const wcColor  = wordCount >= 1500 ? '#10b981' : wordCount >= 1000 ? '#6366f1' : wordCount >= 500 ? '#f59e0b' : '#ef4444';
  const h1Color  = h1.length === 1 ? '#10b981' : h1.length === 0 ? '#ef4444' : '#f59e0b';
  const h2Color  = h2.length >= 5 ? '#10b981' : h2.length >= 2 ? '#6366f1' : '#f59e0b';
  const h3Color  = h3.length > 0 ? '#6366f1' : '#9ca3af';
  const qhColor  = questionHeadingCount >= 3 ? '#10b981' : questionHeadingCount >= 1 ? '#f59e0b' : '#ef4444';
  const pubColor = datePublished ? '#10b981' : '#ef4444';

  // ── Headings ─────────────────────────────────────────────────────────────────
  const allHeadings = [
    ...h1.map(t => ({ type: 'H1', text: t })),
    ...h2.map(t => ({ type: 'H2', text: t })),
    ...h3.map(t => ({ type: 'H3', text: t })),
  ];
  const LIMIT          = 15;
  const visibleHeadings = headingsExpanded ? allHeadings : allHeadings.slice(0, LIMIT);
  const qhTotal        = allHeadings.filter(h => isQuestionHeading(h.text)).length || questionHeadingCount;

  // ── Benchmark ─────────────────────────────────────────────────────────────────
  const wcZone  = getWordCountZone(wordCount);
  const wcPct   = Math.min(wordCount, 2000) / 2000 * 100;
  const wcMsg   = {
    thin:     `At ${wordCount.toLocaleString()} words, this content is at high risk of being skipped by AI retrieval systems. Aim for 1,500+.`,
    moderate: `At ${wordCount.toLocaleString()} words, this content is competitive but not optimal. Adding 500+ words of structured detail would improve citation frequency.`,
    strong:   `At ${wordCount.toLocaleString()} words, this content has good depth. Minor structural improvements (FAQ, schema) will have higher impact than adding more words.`,
    optimal:  `At ${wordCount.toLocaleString()} words, this content has excellent depth. Focus on structure and evidence density rather than length.`,
  }[wcZone.zone];

  // ── AI panel ─────────────────────────────────────────────────────────────────
  const aiText  = mainContent ? mainContent.slice(0, 8000) : '';
  const splitAt = Math.floor(aiText.length * 0.3);

  const sect = (i) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.08 },
  });

  const handleStat = (id) => setSelectedStat(prev => prev === id ? null : id);

  return (
    <div className={styles.page}>

      {/* ── 1. Stat grid ── */}
      <motion.div {...sect(0)} className={styles.statsSection}>
        <p className={styles.statsHint}>Click any metric to see what it means for AI citation</p>
        <div className={styles.statsGrid}>
          <StatCard id="wordCount"        label="Word Count"        value={wordCount?.toLocaleString()}              valueColor={wcColor}                            selected={selectedStat === 'wordCount'}        onSelect={handleStat} delay={0}    />
          <StatCard id="h1"               label="H1 Headings"       value={h1.length}                                valueColor={h1Color}                            selected={selectedStat === 'h1'}              onSelect={handleStat} delay={0.04} />
          <StatCard id="h2"               label="H2 Headings"       value={h2.length}                                valueColor={h2Color}                            selected={selectedStat === 'h2'}              onSelect={handleStat} delay={0.08} />
          <StatCard id="h3"               label="H3 Headings"       value={h3.length}                                valueColor={h3Color}                            selected={selectedStat === 'h3'}              onSelect={handleStat} delay={0.12} />
          <StatCard id="schema"           label="Schema Markup"     value={hasSchema ? 'Yes' : 'No'}                 valueColor={hasSchema ? '#10b981' : '#ef4444'}  selected={selectedStat === 'schema'}          onSelect={handleStat} delay={0.16} />
          <StatCard id="faq"              label="FAQ Section"       value={hasFAQ ? 'Yes' : 'No'}                    valueColor={hasFAQ ? '#10b981' : '#9ca3af'}     selected={selectedStat === 'faq'}             onSelect={handleStat} delay={0.20} />
          <StatCard id="questionHeadings" label="Question Headings" value={questionHeadingCount}                     valueColor={qhColor}                            selected={selectedStat === 'questionHeadings'} onSelect={handleStat} delay={0.24} />
          <StatCard id="published"        label="Published"         value={formatDate(datePublished) ?? 'Unknown'}   valueColor={pubColor}                           selected={selectedStat === 'published'}        onSelect={handleStat} delay={0.28} compact />
        </div>

        <AnimatePresence mode="wait">
          {selectedStat && (
            <motion.div
              key={selectedStat}
              className={styles.statExplain}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <p className={styles.statExplainText}>{STAT_EXPLANATIONS[selectedStat]}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Page details ── */}
      <motion.div {...sect(1)} className={styles.section}>
        <h2 className={styles.sectionTitle}>Page Details</h2>
        <div className={styles.detailsCard}>
          {url && (
            <div className={styles.detailRow}>
              <span className={styles.detailKey}>Analyzed URL</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.detailUrl} title={url}>
                {url.length > 80 ? `${url.slice(0, 77)}…` : url}
              </a>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Page Title</span>
            <span className={styles.detailVal}>{title || <em className={styles.missing}>Not found</em>}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Meta Description</span>
            <div className={styles.detailValStack}>
              <span className={styles.detailVal}>
                {metaDescription || <em className={styles.missing}>Not found</em>}
              </span>
              {!metaDescription
                ? <span className={styles.noteRed}>No meta description found — AI snippet extraction relies heavily on meta descriptions.</span>
                : <span className={styles.noteGreen}>Meta description present — ensure it contains your primary keyword and a concrete claim.</span>
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Structural signals ── */}
      <motion.div {...sect(2)} className={styles.section}>
        <h2 className={styles.sectionTitle}>Structural Signals Breakdown</h2>
        <div className={styles.signalsGrid}>
          <SignalCard
            icon={<IconList />}
            label="Lists Present"
            status={hasLists ? 'Detected' : 'Not Found'}
            statusColor={hasLists ? '#10b981' : '#ef4444'}
            implication="Bulleted lists create discrete, citable fact chunks. AI systems extract list items as standalone citations more often than prose."
          />
          <SignalCard
            icon={<IconFAQ />}
            label="FAQ Structure"
            status={hasFAQ ? 'Detected' : 'Not Found'}
            statusColor={hasFAQ ? '#10b981' : '#ef4444'}
            implication="FAQ patterns are the single highest-performing GEO structure. Each Q&A pair is independently citable."
          />
          <SignalCard
            icon={<IconSchema />}
            label="Schema Markup"
            status={hasSchema ? (schemaTypes.length ? schemaTypes.join(', ') : 'Detected') : 'None detected'}
            statusColor={hasSchema ? '#10b981' : '#ef4444'}
            implication={hasSchema
              ? 'Structured data helps AI systems extract authoritative facts without parsing prose.'
              : 'Missing schema is the highest-impact quick fix. Add FAQPage or Article JSON-LD to unlock structured citations.'}
          />
          <SignalCard
            icon={<IconUser />}
            label="Author Information"
            status={schemaAuthor || 'Not found'}
            statusColor={schemaAuthor ? '#10b981' : '#f59e0b'}
            implication="Author credentials carry 16% weight in AI citation decisions. Named authors with linked bios outperform anonymous content."
          />
          <SignalCard
            icon={<IconCalendar />}
            label="Publication Date"
            status={formatDate(datePublished) || 'Not detected'}
            statusColor={datePublished ? '#10b981' : '#f59e0b'}
            implication="Date injection shifts LLM recency scoring by up to 4.78 years. Pages without visible dates appear stale to AI systems."
          />
          <SignalCard
            icon={<IconRefresh />}
            label="Last Modified"
            status={formatDate(dateModified) || 'Not detected'}
            statusColor={dateModified ? '#10b981' : '#f59e0b'}
            implication="Content updated within 2 months receives 28% more AI citations. Regular updates signal freshness to AI rerankers."
          />
        </div>
      </motion.div>

      {/* ── 3. Content density ── */}
      <motion.div {...sect(3)} className={styles.section}>
        <h2 className={styles.sectionTitle}>Content Density & Benchmark</h2>
        <div className={styles.densityCard}>
          <p className={styles.densityHeading}>Content Depth vs. AI Citation Benchmarks</p>

          <div className={styles.benchOuter}>
            <div className={styles.benchLabelRow}>
              <span
                className={styles.benchNeedleLabel}
                style={{ left: `${wcPct}%`, color: wcZone.color }}
              >
                {wordCount.toLocaleString()} words
              </span>
            </div>
            <div className={styles.benchBarWrap}>
              <div className={styles.benchBar}>
                <div className={styles.benchZone} style={{ width: '25%', background: '#ef4444' }} />
                <div className={styles.benchZone} style={{ width: '25%', background: '#f59e0b' }} />
                <div className={styles.benchZone} style={{ width: '25%', background: '#6366f1' }} />
                <div className={styles.benchZone} style={{ width: '25%', background: '#10b981' }} />
              </div>
              <div className={styles.benchNeedle} style={{ left: `${wcPct}%` }} />
            </div>
            <div className={styles.benchZoneLabels}>
              <span style={{ color: '#ef4444' }}>Thin</span>
              <span style={{ color: '#f59e0b' }}>Moderate</span>
              <span style={{ color: '#6366f1' }}>Strong</span>
              <span style={{ color: '#10b981' }}>Optimal for AI</span>
            </div>
          </div>

          <p className={styles.densityMsg} style={{ color: wcZone.color }}>{wcMsg}</p>

          <div className={styles.firstThirtyBox}>
            <p className={styles.firstThirtyText}>
              44.2% of AI citations come from the first 30% of a page's text (Gao et al., RAG Survey). Your first 30% is approximately{' '}
              <strong>{Math.floor(wordCount * 0.3).toLocaleString()} words</strong> — ensure your strongest claims, statistics, and definitions appear before word{' '}
              <strong>{Math.floor(wordCount * 0.3).toLocaleString()}</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Heading map ── */}
      <motion.div {...sect(4)} className={styles.section}>
        <h2 className={styles.sectionTitle}>Content Structure & Heading Map</h2>
        <div className={styles.headingMapCard}>
          {h2.length === 0 && (
            <div className={styles.warnCallout}>
              No H2 headings detected. H2s define chunk boundaries for AI retrieval — this is a high-priority structural fix.
            </div>
          )}

          {allHeadings.length > 0 ? (
            <div className={styles.headingList}>
              {visibleHeadings.map((h, i) => {
                const isQ = isQuestionHeading(h.text);
                return (
                  <div key={i} className={`${styles.headingRow} ${styles[`headingRow${h.type}`]}`}>
                    <span className={`${styles.hBadge} ${styles[`hBadge${h.type}`]}`}>{h.type}</span>
                    <span className={`${styles.hText} ${styles[`hText${h.type}`]}`}>{h.text}</span>
                    {isQ && <span className={styles.qTag}>Question</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.noHeadings}>No headings detected on this page.</p>
          )}

          {allHeadings.length > LIMIT && (
            <button className={styles.expandBtn} onClick={() => setHeadingsExpanded(e => !e)}>
              {headingsExpanded ? '▲ Show fewer headings' : `▼ Show all ${allHeadings.length} headings`}
            </button>
          )}

          <div className={styles.headingSummary}>
            <span>{h1.length} H1</span>
            <span className={styles.summSep}>·</span>
            <span>{h2.length} H2</span>
            <span className={styles.summSep}>·</span>
            <span>{h3.length} H3</span>
            {qhTotal > 0 && (
              <>
                <span className={styles.summSep}>·</span>
                <span className={styles.summQ}>{qhTotal} question heading{qhTotal !== 1 ? 's' : ''} detected</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── 5. AI view ── */}
      <motion.div {...sect(5)} className={styles.section}>
        <h2 className={styles.sectionTitle}>What AI Systems Actually Read</h2>
        <div className={styles.aiCard}>
          <p className={styles.aiIntro}>
            This is the cleaned, boilerplate-stripped version of your page content — exactly what was passed to the GEO auditor agents. Navigation menus, cookie banners, and UI chrome have been removed.
          </p>
          <button className={styles.aiToggle} onClick={() => setAiExpanded(e => !e)}>
            {aiExpanded ? '▲ Collapse' : '▼ Expand to see AI view'}
          </button>
          <AnimatePresence>
            {aiExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.aiInner}>
                  <div className={styles.aiWordBadge}>{wordCount.toLocaleString()} words analyzed</div>
                  <div className={styles.aiBox}>
                    {aiText ? (
                      <>
                        <span className={styles.aiFirst}>{aiText.slice(0, splitAt)}</span>
                        <span className={styles.aiRest}>{aiText.slice(splitAt)}</span>
                      </>
                    ) : (
                      <span className={styles.aiEmpty}>No content preview available.</span>
                    )}
                  </div>
                  <p className={styles.aiNote}>Content truncated to 8,000 characters for LLM processing.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}
