import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import InputForm from './components/InputForm.jsx';
import AgentPipeline from './components/AgentPipeline.jsx';
import ResultsTabs from './components/ResultsTabs.jsx';
import styles from './App.module.css';

// Visual display order (what user sees sequentially)
const VISUAL_ORDER = [
  'contentFetcher',
  'geoAuditor',
  'competitorBenchmarker',
  'rewriteSuggester',
  'reportCompiler',
];

const INITIAL_DISPLAY_STATUSES = {
  contentFetcher: 'waiting',
  geoAuditor: 'waiting',
  competitorBenchmarker: 'waiting',
  rewriteSuggester: 'waiting',
  reportCompiler: 'waiting',
};

const INITIAL_AGENT_DATA = {
  contentFetcher:        { message: 'Fetching and parsing webpage content…',        preview: null },
  geoAuditor:            { message: 'Scoring content against 7 GEO criteria…',       preview: null },
  competitorBenchmarker: { message: 'Searching for top AI-cited sources…',           preview: null },
  rewriteSuggester:      { message: 'Generating before/after rewrites…',             preview: null },
  reportCompiler:        { message: 'Compiling final GEO audit report…',             preview: null },
};

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' } },
};

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  const [phase, setPhase] = useState('input'); // 'input' | 'pipeline' | 'results'
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [submittedTopic, setSubmittedTopic] = useState('');
  const [displayStatuses, setDisplayStatuses] = useState(INITIAL_DISPLAY_STATUSES);
  const [agentData, setAgentData] = useState(INITIAL_AGENT_DATA);
  const [results, setResults] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  // Mutable pipeline state kept in a ref to avoid stale closures
  const pipeRef = useRef({
    completedBuffer: new Set(),
    visualIndex: 0,
    resultsReady: false,
    pipelineComplete: false,
  });

  const handleSubmit = useCallback(async (url, topic) => {
    const pipe = pipeRef.current;
    pipe.completedBuffer = new Set();
    pipe.visualIndex = 0;
    pipe.resultsReady = false;
    pipe.pipelineComplete = false;

    setSubmittedUrl(url);
    setSubmittedTopic(topic);
    setGlobalError(null);
    setResults(null);
    setAgentData(INITIAL_AGENT_DATA);
    setDisplayStatuses({ ...INITIAL_DISPLAY_STATUSES, contentFetcher: 'running' });
    setPhase('pipeline');

    // ── Sequential visual activation ──────────────────────────────────────────
    function tryTransitionToResults() {
      if (pipe.resultsReady && pipe.pipelineComplete) {
        setTimeout(() => setPhase('results'), 800);
      }
    }

    function advanceVisual(agentKey) {
      setTimeout(() => {
        setDisplayStatuses(prev => ({ ...prev, [agentKey]: 'done' }));

        const idx = VISUAL_ORDER.indexOf(agentKey);
        const nextIdx = idx + 1;

        if (nextIdx >= VISUAL_ORDER.length) {
          pipe.pipelineComplete = true;
          tryTransitionToResults();
          return;
        }

        const nextAgent = VISUAL_ORDER[nextIdx];
        pipe.visualIndex = nextIdx;

        setTimeout(() => {
          setDisplayStatuses(prev => ({ ...prev, [nextAgent]: 'running' }));
          // If next agent already completed in reality, auto-advance after brief display
          if (pipe.completedBuffer.has(nextAgent)) {
            setTimeout(() => advanceVisual(nextAgent), 1100);
          }
        }, 420);
      }, 700);
    }

    // ── SSE event handler ─────────────────────────────────────────────────────
    function processEvent({ type, agent, data }) {
      switch (type) {
        case 'agent_start':
          if (data?.message) {
            setAgentData(prev => ({
              ...prev,
              [agent]: { ...prev[agent], message: data.message },
            }));
          }
          break;

        case 'agent_complete':
          setAgentData(prev => ({
            ...prev,
            [agent]: {
              message: data?.message ?? prev[agent].message,
              preview: data?.preview ?? null,
            },
          }));
          pipe.completedBuffer.add(agent);
          if (VISUAL_ORDER[pipe.visualIndex] === agent) {
            advanceVisual(agent);
          }
          break;

        case 'agent_error':
          setAgentData(prev => ({
            ...prev,
            [agent]: { ...prev[agent], message: data?.message ?? 'Error occurred' },
          }));
          setDisplayStatuses(prev => ({ ...prev, [agent]: 'error' }));
          break;

        case 'analysis_complete':
          pipe.resultsReady = true;
          setResults(data);
          tryTransitionToResults();
          break;

        case 'error':
          setGlobalError(data?.message ?? 'An unexpected error occurred.');
          break;
      }
    }

    // ── SSE stream ────────────────────────────────────────────────────────────
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, topic }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || 'Server error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          const dataLine = trimmed.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            processEvent(JSON.parse(dataLine.slice(6)));
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch (err) {
      setGlobalError(err.message || 'Connection failed. Please try again.');
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setPhase('input');
    setResults(null);
    setGlobalError(null);
    setDisplayStatuses(INITIAL_DISPLAY_STATUSES);
    setAgentData(INITIAL_AGENT_DATA);
  }, []);

  const geoScore = results?.geoAudit?.overall_score ?? null;

  return (
    <div className={styles.app}>
      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>◈ GEO<span className={styles.navAccent}>Agent</span></span>
        </div>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle light/dark mode"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </nav>

      {/* ── Stages ── */}
      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div key="input" variants={pageVariants} initial="initial" animate="animate" exit="exit" className={styles.stage}>
              <InputForm onSubmit={handleSubmit} />
            </motion.div>
          )}

          {phase === 'pipeline' && (
            <motion.div key="pipeline" variants={pageVariants} initial="initial" animate="animate" exit="exit" className={styles.stage}>
              <AgentPipeline
                displayStatuses={displayStatuses}
                agentData={agentData}
                error={globalError}
                url={submittedUrl}
                topic={submittedTopic}
              />
            </motion.div>
          )}

          {phase === 'results' && results && (
            <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" className={`${styles.stage} ${styles.stageFull}`}>
              <ResultsTabs
                results={results}
                url={submittedUrl}
                topic={submittedTopic}
                geoScore={geoScore}
                onNewAnalysis={handleNewAnalysis}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
