import styles from './AgentTracker.module.css';

const AGENTS = [
  {
    key: 'contentFetcher',
    name: 'Content Fetcher',
    number: '01',
    icon: '⬡',
    description: 'Fetches URL · Strips boilerplate · Extracts headings & body',
  },
  {
    key: 'competitorBenchmarker',
    name: 'Competitor Benchmarker',
    number: '03',
    icon: '◈',
    description: 'Searches Serper · Finds AI-cited sources · Maps competitive landscape',
    parallel: true,
  },
  {
    key: 'geoAuditor',
    name: 'GEO Auditor',
    number: '02',
    icon: '◎',
    description: 'Scores 7 GEO criteria · Identifies top 3 weaknesses',
  },
  {
    key: 'rewriteSuggester',
    name: 'Rewrite Suggester',
    number: '04',
    icon: '✦',
    description: 'Generates before/after rewrites for each weakness',
  },
  {
    key: 'reportCompiler',
    name: 'Report Compiler',
    number: '05',
    icon: '▣',
    description: 'Synthesizes all outputs into a final audit report',
  },
];

const STATUS_CONFIG = {
  idle:     { label: 'Queued',   dotClass: 'dotIdle',     textClass: 'statusIdle' },
  running:  { label: 'Running',  dotClass: 'dotRunning',  textClass: 'statusRunning' },
  complete: { label: 'Done',     dotClass: 'dotComplete', textClass: 'statusComplete' },
  error:    { label: 'Error',    dotClass: 'dotError',    textClass: 'statusError' },
};

export default function AgentTracker({ statuses }) {
  const totalComplete = Object.values(statuses).filter(s => s.status === 'complete').length;
  const totalAgents = AGENTS.length;

  // Group into pipeline steps for visual layout
  const parallelGroup = AGENTS.filter(a => a.key === 'contentFetcher' || a.key === 'competitorBenchmarker');
  const sequentialAgents = AGENTS.filter(a => a.key !== 'contentFetcher' && a.key !== 'competitorBenchmarker');

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Agent Pipeline</h2>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(totalComplete / totalAgents) * 100}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{totalComplete}/{totalAgents} complete</span>
        </div>
      </div>

      <div className={styles.pipeline}>
        {/* Step 1: Parallel group */}
        <div className={styles.parallelGroup}>
          <div className={styles.parallelLabel}>Parallel</div>
          {parallelGroup.map(agent => (
            <AgentCard key={agent.key} agent={agent} status={statuses[agent.key]} />
          ))}
        </div>

        <div className={styles.connector}>
          <div className={styles.connectorLine} />
          <span className={styles.connectorLabel}>sequential</span>
          <div className={styles.connectorLine} />
        </div>

        {/* Steps 2–4: Sequential */}
        {sequentialAgents.map((agent, i) => (
          <div key={agent.key}>
            <AgentCard agent={agent} status={statuses[agent.key]} />
            {i < sequentialAgents.length - 1 && (
              <div className={styles.arrow}>↓</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentCard({ agent, status }) {
  const cfg = STATUS_CONFIG[status.status] || STATUS_CONFIG.idle;

  return (
    <div className={`${styles.card} ${styles[`card_${status.status}`]}`}>
      <div className={styles.cardLeft}>
        <div className={styles.cardMeta}>
          <span className={styles.agentNum}>{agent.number}</span>
          <span className={styles.agentIcon}>{agent.icon}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.agentName}>{agent.name}</div>
          <div className={styles.agentDesc}>
            {status.status === 'idle' || status.status === 'running'
              ? status.message || agent.description
              : status.message}
          </div>
          {status.preview && <AgentPreview preview={status.preview} agentKey={agent.key} />}
        </div>
      </div>
      <div className={styles.cardRight}>
        <div className={`${styles.statusBadge} ${styles[cfg.textClass]}`}>
          <span className={`${styles.dot} ${styles[cfg.dotClass]}`} />
          {cfg.label}
        </div>
      </div>
    </div>
  );
}

function AgentPreview({ preview, agentKey }) {
  if (!preview) return null;

  const items = [];
  if (agentKey === 'contentFetcher') {
    if (preview.wordCount) items.push(`${preview.wordCount.toLocaleString()} words`);
    if (preview.h2Count) items.push(`${preview.h2Count} headings`);
  } else if (agentKey === 'competitorBenchmarker') {
    if (preview.competitorCount) items.push(`${preview.competitorCount} competitors`);
    if (preview.topDomain) items.push(`Top: ${preview.topDomain}`);
  } else if (agentKey === 'geoAuditor') {
    if (preview.overallScore !== undefined) items.push(`Score: ${preview.overallScore}/10`);
    if (preview.weaknesses) items.push(`Weaknesses: ${preview.weaknesses.join(', ')}`);
  } else if (agentKey === 'rewriteSuggester') {
    if (preview.rewriteCount) items.push(`${preview.rewriteCount} rewrites`);
  }

  if (!items.length) return null;
  return (
    <div className={styles.preview}>
      {items.map(item => <span key={item} className={styles.previewChip}>{item}</span>)}
    </div>
  );
}
