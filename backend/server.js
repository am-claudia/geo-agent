import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runOrchestrator } from './agents/orchestrator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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

  try {
    await runOrchestrator(url, topic, sendEvent);
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
