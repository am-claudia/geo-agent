import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AgentPipeline.module.css';

const AGENTS = [
  {
    key: 'contentFetcher',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    name: 'Content Fetcher',
    description: 'Fetches the URL and extracts structured content, headings, and signals',
  },
  {
    key: 'geoAuditor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    name: 'GEO Auditor',
    description: 'Scores the page against 8 GEO citability criteria',
  },
  {
    key: 'competitorBenchmarker',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    name: 'Competitor Benchmarker',
    description: 'Finds AI-cited sources on the topic and identifies what makes them citation-worthy',
  },
  {
    key: 'rewriteSuggester',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    name: 'Rewrite Suggester',
    description: 'Generates targeted before/after rewrites for the top weaknesses',
  },
  {
    key: 'reportCompiler',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    name: 'Report Compiler',
    description: 'Synthesizes all findings into a prioritized action plan',
  },
];

const GEO_FACTS = [
  "Pages with statistics are 41% more likely to be cited by AI systems like ChatGPT and Perplexity.",
  "72.4% of ChatGPT-cited pages use FAQ-style question headings — a key GEO signal.",
  "Content updated within the last 2 months receives 28% more AI citations on average.",
  "Adding author credentials increases your AI citation probability by up to 16%.",
  "44.2% of LLM citations come from content in the first 30% of a page — lead with your strongest material.",
  "External citations and sourced statistics can boost citation rates by up to 115% for mid-ranked content.",
  "Schema markup (JSON-LD) is a key freshness and authority signal for AI Overview inclusion.",
];

/* Spinning ring wraps the step circle so the ring spins independently of the content */
function StepCircle({ index, status }) {
  const isDone    = status === 'done';
  const isError   = status === 'error';
  const isRunning = status === 'running';

  return (
    <div className={styles.stepCircleOuter}>
      {isRunning && <div className={styles.stepRingSpinner} />}
      <div className={`${styles.stepCircle} ${isDone ? styles.stepCircleDone : ''} ${isError ? styles.stepCircleError : ''} ${isRunning ? styles.stepCircleRunning : ''}`}>
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              key="check"
              className={styles.stepCheckWrap}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </motion.div>
          ) : isError ? (
            <motion.div
              key="x"
              className={styles.stepErrorWrap}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </motion.div>
          ) : (
            <motion.span
              key="num"
              className={`${styles.stepNum} ${isRunning ? styles.stepNumRunning : ''}`}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {String(index + 1).padStart(2, '0')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusDots() {
  return (
    <div className={styles.statusRunning}>
      <span className={styles.runningDot} />
      <span className={styles.runningDot} />
      <span className={styles.runningDot} />
    </div>
  );
}

function AgentCard({ agent, displayStatus, agentData, index }) {
  const isRunning = displayStatus === 'running';
  const isDone    = displayStatus === 'done';
  const isError   = displayStatus === 'error';
  const isWaiting = displayStatus === 'waiting';

  return (
    <motion.div
      className={`${styles.card} ${isRunning ? styles.cardRunning : ''} ${isDone ? styles.cardDone : ''} ${isError ? styles.cardError : ''} ${isWaiting ? styles.cardWaiting : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <StepCircle index={index} status={displayStatus} />

      <div className={`${styles.iconWrap} ${isRunning ? styles.iconActive : ''}`}>
        <span className={styles.icon}>{agent.icon}</span>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles.agentName}>{agent.name}</span>
          {isRunning && <StatusDots />}
        </div>

        <p className={styles.agentDesc}>{agent.description}</p>

        <AnimatePresence mode="wait">
          {(isRunning || isDone || isError) && (
            <motion.p
              key={agentData.message}
              className={`${styles.agentMsg} ${isDone ? styles.agentMsgDone : ''} ${isError ? styles.agentMsgError : ''}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isRunning && <span className={styles.msgSpinner} />}
              {agentData.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {isRunning && <div className={styles.shimmer} />}
    </motion.div>
  );
}

function FactCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % GEO_FACTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className={styles.factCard}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <div className={styles.factHeader}>✦ Did you know?</div>
      <AnimatePresence mode="wait">
        <motion.p
          key={current}
          className={styles.factText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {GEO_FACTS[current]}
        </motion.p>
      </AnimatePresence>
      <p className={styles.factSource}>GEO Research, 2024</p>
      <div className={styles.factProgressTrack}>
        <div key={current} className={styles.factProgressFill} />
      </div>
      <div className={styles.factDots}>
        {GEO_FACTS.map((_, i) => (
          <button
            key={i}
            className={`${styles.factDot} ${i === current ? styles.factDotActive : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Fact ${i + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function AgentPipeline({ displayStatuses, agentData, error, url, topic }) {
  const [notifPermission, setNotifPermission] = useState(
    () => (typeof window !== 'undefined' && 'Notification' in window)
      ? Notification.permission
      : 'granted'
  );

  const requestNotification = () => {
    Notification.requestPermission().then(p => setNotifPermission(p));
  };

  const runningAgent = AGENTS.find(a => displayStatuses[a.key] === 'running');
  const doneCount    = AGENTS.filter(a => displayStatuses[a.key] === 'done').length;
  const pct = Math.round((doneCount / AGENTS.length) * 100);

  return (
    <div className={styles.shell}>
      <div className={`${styles.orb} ${styles.orbBlue}`} />
      <div className={`${styles.orb} ${styles.orbPurple}`} />

      {notifPermission === 'default' && (
        <div className={styles.notifBanner}>
          <span className={styles.notifText}>
            🔔 Get notified when your audit finishes — useful if you switch tabs
          </span>
          <button className={styles.notifBtn} onClick={requestNotification}>Enable</button>
        </div>
      )}

      <div className={styles.page}>
        {/* Audit heading */}
        <motion.div
          className={styles.auditHeadingWrap}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className={styles.auditHeading}>Auditing your content</h1>
          <div className={styles.auditMeta}>
            <div className={styles.urlPill}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{url}</span>
            </div>
          </div>
        </motion.div>

        {/* Progress section */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.statusBadge}>
              <span className={styles.statusDotLive} />
              {runningAgent ? `Running: ${runningAgent.name}` : 'Preparing analysis…'}
            </div>
            <div className={styles.progressLabel}>{pct}% complete</div>
          </div>

          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressBar}
              animate={{ width: `${(doneCount / AGENTS.length) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Pipeline cards */}
        <div className={styles.pipeline}>
          {AGENTS.map((agent, i) => (
            <div key={agent.key} className={styles.cardRow}>
              <AgentCard
                agent={agent}
                displayStatus={displayStatuses[agent.key]}
                agentData={agentData[agent.key]}
                index={i}
              />
              {i < AGENTS.length - 1 && (
                <div className={`${styles.connector} ${displayStatuses[agent.key] === 'done' ? styles.connectorActive : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <motion.div
            className={styles.errorBox}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Analysis error</strong>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {/* GEO fact carousel */}
        <FactCarousel />

        <p className={styles.footer}>
          Each agent runs in sequence. Results will appear when all 5 complete.
        </p>
      </div>
    </div>
  );
}
