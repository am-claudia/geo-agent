import { motion, AnimatePresence } from 'framer-motion';
import styles from './AgentPipeline.module.css';

const AGENTS = [
  {
    key: 'contentFetcher',
    icon: '🔍',
    name: 'Content Fetcher',
    description: 'Fetches the URL and extracts structured content, headings, and signals',
  },
  {
    key: 'geoAuditor',
    icon: '🧠',
    name: 'GEO Auditor',
    description: 'Scores the page against 7 GEO citability criteria',
  },
  {
    key: 'competitorBenchmarker',
    icon: '🏆',
    name: 'Competitor Benchmarker',
    description: 'Finds AI-cited sources on the topic and identifies what makes them citation-worthy',
  },
  {
    key: 'rewriteSuggester',
    icon: '✍️',
    name: 'Rewrite Suggester',
    description: 'Generates targeted before/after rewrites for the top weaknesses',
  },
  {
    key: 'reportCompiler',
    icon: '📋',
    name: 'Report Compiler',
    description: 'Synthesizes all findings into a prioritized action plan',
  },
];

function StatusIcon({ status }) {
  if (status === 'done') {
    return (
      <motion.div
        className={styles.statusDone}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </motion.div>
    );
  }
  if (status === 'running') {
    return (
      <div className={styles.statusRunning}>
        <span className={styles.runningDot} />
        <span className={styles.runningDot} />
        <span className={styles.runningDot} />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className={styles.statusError}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
    );
  }
  // waiting
  return <div className={styles.statusWaiting} />;
}

function AgentCard({ agent, displayStatus, agentData, index }) {
  const isRunning = displayStatus === 'running';
  const isDone    = displayStatus === 'done';
  const isError   = displayStatus === 'error';
  const isWaiting = displayStatus === 'waiting';

  return (
    <motion.div
      className={`
        ${styles.card}
        ${isRunning ? styles.cardRunning : ''}
        ${isDone    ? styles.cardDone    : ''}
        ${isError   ? styles.cardError   : ''}
        ${isWaiting ? styles.cardWaiting : ''}
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Index */}
      <div className={styles.cardIndex}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Icon */}
      <div className={`${styles.iconWrap} ${isRunning ? styles.iconActive : ''}`}>
        <span className={styles.icon}>{agent.icon}</span>
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <span className={styles.agentName}>{agent.name}</span>
          <StatusIcon status={displayStatus} />
        </div>

        <p className={styles.agentDesc}>{agent.description}</p>

        {/* Live message */}
        <AnimatePresence mode="wait">
          {(isRunning || isDone || isError) && (
            <motion.p
              key={agentData.message}
              className={`${styles.agentMsg} ${isDone ? styles.agentMsgDone : ''} ${isError ? styles.agentMsgError : ''}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {isRunning && <span className={styles.msgSpinner} />}
              {agentData.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Running shimmer overlay */}
      {isRunning && <div className={styles.shimmer} />}
    </motion.div>
  );
}

export default function AgentPipeline({ displayStatuses, agentData, error, url, topic }) {
  const runningAgent = AGENTS.find(a => displayStatuses[a.key] === 'running');
  const doneCount    = AGENTS.filter(a => displayStatuses[a.key] === 'done').length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.statusBadge}>
            <span className={styles.statusDotLive} />
            {runningAgent ? `Running: ${runningAgent.name}` : 'Preparing analysis…'}
          </div>
          <div className={styles.progressLabel}>{doneCount} / {AGENTS.length} agents done</div>
        </div>

        <div className={styles.headerMeta}>
          <span className={styles.metaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            {url}
          </span>
          <span className={styles.metaDivider}>·</span>
          <span className={styles.metaItem}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {topic}
          </span>
        </div>

        {/* Progress bar */}
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
          <span>⚠</span>
          <div>
            <strong>Analysis error</strong>
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Footer hint */}
      <p className={styles.footer}>
        Each agent runs in sequence. Results will appear when all 5 complete.
      </p>
    </div>
  );
}
