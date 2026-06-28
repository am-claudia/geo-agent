import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './InputForm.module.css';

const AGENTS = [
  { name: 'Fetcher' },
  { name: 'Auditor' },
  { name: 'Benchmarker' },
  { name: 'Rewriter' },
  { name: 'Compiler' },
];

function validateUrl(val) {
  try {
    const u = new URL(val);
    if (!['http:', 'https:'].includes(u.protocol)) return 'URL must start with http:// or https://';
    return '';
  } catch {
    return 'Please enter a valid URL (e.g. https://example.com/article)';
  }
}

const fadeUp = (delay = 0, y = 20) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
});

export default function InputForm({ onSubmit }) {
  const [url, setUrl]     = useState('');
  const [topic, setTopic] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateUrl(url.trim());
    if (err) { setUrlError(err); return; }
    if (!topic.trim()) return;
    setUrlError('');
    setLoading(true);
    await onSubmit(url.trim(), topic.trim());
    setLoading(false);
  };

  const canSubmit = url.trim() && topic.trim() && !loading;

  return (
    <div className={styles.page} style={{ background: `radial-gradient(ellipse 100px 80px at ${mousePos.x}% ${mousePos.y}%, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.08) 55%, transparent 80%), var(--bg-base)` }}>
      <div className={`${styles.orb} ${styles.orbBlue}`} />
      <div className={`${styles.orb} ${styles.orbPurple}`} />
      <div className={styles.container}>

        {/* Badge */}
        <motion.div {...fadeUp(0)}>
          <div className={styles.badge}>Generative Engine Optimization</div>
        </motion.div>

        {/* Heading */}
        <motion.div {...fadeUp(0.1)}>
          <h1 className={styles.heading}>
            <span className={styles.headingLight}>Is your content</span><br />
            <span className={styles.headingAccent}>invisible to AI?</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div {...fadeUp(0.2)}>
          <p className={styles.subheading}>
            Run a deep 5-agent audit. Find out exactly why AI systems skip your page,
            and get targeted rewrites to fix it.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div {...fadeUp(0.3)}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>8</span>
              <span className={styles.statLabel}>GEO Criteria</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>5</span>
              <span className={styles.statLabel}>AI Agents</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>Live</span>
              <span className={styles.statLabel}>Streaming</span>
            </div>
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div {...fadeUp(0.4)} style={{ width: '100%' }}>
          <div className={styles.card}>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* URL field */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="url">Target URL</label>
                <div className={`${styles.inputWrap} ${urlError ? styles.inputWrapError : ''}`}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <input
                    id="url"
                    type="url"
                    className={styles.input}
                    placeholder="https://yoursite.com/your-article"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setUrlError(''); }}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                {urlError && <span className={styles.fieldError}>{urlError}</span>}
              </div>

              {/* Topic field */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="topic">Topic / Keyword</label>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    id="topic"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. content marketing for B2B SaaS"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
                <span className={styles.fieldHint}>The query you want AI systems to cite your page for.</span>
              </div>

              {/* Submit */}
              <button type="submit" className={styles.button} disabled={!canSubmit}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Starting analysis…</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <span>Run GEO Audit</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Agent pipeline preview */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
          style={{ width: '100%' }}
        >
          <div className={styles.pipeline}>
            <span className={styles.pipelineLabel}>Analysis Pipeline</span>
            <div className={styles.pipelineAgents}>
              {AGENTS.map((a, i) => (
                <div key={a.name} className={styles.pipelineItem}>
                  {i > 0 && <span className={styles.pipelineArrow}>›</span>}
                  <span className={styles.pipelineAgent}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
