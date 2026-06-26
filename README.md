# GEO Agent — AI Citability Auditor

A multi-agent web application that analyzes web pages against 7 GEO (Generative Engine Optimization) criteria and produces a structured audit report — including before/after content rewrites and competitive benchmarking — so marketers know exactly what to change to get cited by ChatGPT, Perplexity, and Google AI Overviews.

---

## Setup

### 1. Add API Keys

Edit `backend/.env`:

```
GEMINI_API_KEY=your_real_gemini_api_key
SERPER_API_KEY=your_real_serper_api_key
PORT=3001
```

- **Gemini API key**: https://aistudio.google.com/app/apikey
- **Serper API key**: https://serper.dev (10,000 free searches/month)

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm start

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Architecture

```
User Input (URL + Topic)
        │
        ▼
  Orchestrator Agent
        │
        ├─────────────────────────┐
        │  (parallel)             │
        ▼                         ▼
Agent 1                     Agent 3
Content Fetcher         Competitor Benchmarker
(cheerio + axios)       (Serper API + Gemini)
        │                         │
        ▼                         │
Agent 2                           │
GEO Auditor (Gemini)              │
        │                         │
        ▼                         │
Agent 4                           │
Rewrite Suggester (Gemini)        │
        │                         │
        └──────────┬──────────────┘
                   ▼
             Agent 5
         Report Compiler (Gemini)
                   │
                   ▼
         Final GEO Audit Report
         (streamed via SSE)
```

### Agents

| # | Agent | Input | Output |
|---|-------|-------|--------|
| 1 | Content Fetcher | URL | Parsed page: title, headings, body text, word count |
| 2 | GEO Auditor | Parsed content | 7 criterion scores, top 3 weaknesses |
| 3 | Competitor Benchmarker | Topic keyword | 3-5 competitor URLs + GEO strengths |
| 4 | Rewrite Suggester | Content + weaknesses | Before/after rewrites per weakness |
| 5 | Report Compiler | All agent outputs | Final structured audit report |

### GEO Criteria Scored

1. **Authority & Credibility** - named sources, stats, expert citations
2. **Structural Clarity** - headings, lists, FAQ sections LLMs can parse
3. **Quotability** - short, precise sentences an LLM can lift directly
4. **Comprehensiveness** - topic coverage depth
5. **Semantic Clarity** - clear definitions without marketing language
6. **Freshness Signals** - dates, recent stats, time-stamped data
7. **Q&A Format** - direct answers to likely user questions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, CSS Modules |
| Backend | Node.js + Express |
| AI | Gemini 1.5 Pro (@google/generative-ai) |
| Web Search | Serper API |
| HTML Parsing | Cheerio |
| Streaming | Server-Sent Events (SSE) |

---

## Project Structure

```
geo-agent/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.js          # Coordinates all agents
│   │   ├── contentFetcher.js        # Agent 1: URL fetch + parse
│   │   ├── geoAuditor.js            # Agent 2: GEO scoring
│   │   ├── competitorBenchmarker.js # Agent 3: Serper search
│   │   ├── rewriteSuggester.js      # Agent 4: Before/after rewrites
│   │   └── reportCompiler.js        # Agent 5: Final report
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
            ├── InputForm.jsx
            ├── AgentTracker.jsx     # Real-time agent status
            ├── ReportView.jsx       # Full report layout
            ├── ScoreCard.jsx        # SVG gauge + criterion bars
            ├── CompetitorCard.jsx   # Per-competitor cards
            └── RewritePanel.jsx     # Before/after split view
```
