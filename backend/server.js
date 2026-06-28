import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import { runOrchestrator } from './agents/orchestrator.js';

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory result cache: Map<sha256(url|topic), { data, ts }>
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildCacheKey(url, topic) {
  return createHash('sha256').update(`${url}|${topic}`).digest('hex');
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data;
}

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      serper: !!process.env.SERPER_API_KEY,
    },
  });
});

app.post('/api/analyze', async (req, res) => {
  const { url, topic } = req.body;

  if (!url || !topic) {
    return res.status(400).json({ error: 'Both url and topic are required.' });
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured in .env' });
  }
  if (!process.env.SERPER_API_KEY || process.env.SERPER_API_KEY === 'your_serper_api_key_here') {
    return res.status(500).json({ error: 'SERPER_API_KEY is not configured in .env' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 20000);

  const sendEvent = (type, agent, data) => {
    const payload = JSON.stringify({ type, agent, data, timestamp: new Date().toISOString() });
    res.write(`data: ${payload}\n\n`);
  };

  // Cache check — serve immediately if fresh result exists
  const key = buildCacheKey(url, topic);
  const cached = cacheGet(key);
  if (cached) {
    sendEvent('analysis_complete', 'orchestrator', { ...cached, cache_hit: true });
    clearInterval(heartbeat);
    res.end();
    return;
  }

  try {
    let capturedResult = null;
    const sendEventWithCapture = (type, agent, data) => {
      sendEvent(type, agent, data);
      if (type === 'analysis_complete') capturedResult = data;
    };

    await runOrchestrator(url, topic, sendEventWithCapture);

    if (capturedResult) {
      cache.set(key, { data: capturedResult, ts: Date.now() });
    }
  } catch (err) {
    console.error('[SERVER] Orchestrator error:', err.message);
    sendEvent('error', 'orchestrator', { message: err.message });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 GEO Agent Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
