# GEO Agent: An AI-Powered Multi-Agent Citability Auditor

**Course:** Big Data and Artificial Intelligence in Marketing  
**Project Type:** Option 2 -- Hands-On Applied Project  
**Topic:** Generative Engine Optimization (GEO) -- Automating AI Citability Audits with Multi-Agent AI

## Live Demo

**Deployed app:** [https://geo-agent-xi.vercel.app/](https://geo-agent-xi.vercel.app/)

The app is fully functional — paste any public URL and a topic keyword, and the five-agent pipeline runs in real time. No setup required.

> **Note:** The backend is hosted on Render's free tier, which spins down after inactivity. The first request after a cold start may take 30–60 seconds to respond while the server wakes up. Subsequent requests are fast.

---

## Overview

This project builds a working multi-agent web application that audits any publicly accessible web page and tells marketers exactly what needs to change for their content to be cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews.

The problem it addresses is concrete: as of 2025, an estimated 40% of Google searches now return AI-generated summaries (BrightEdge, 2026), and those summaries cite sources. Most marketing teams have no systematic way to evaluate whether their content will be retrieved and quoted by these systems -- or why it won't be. This tool automates that evaluation using five coordinated AI agents, each handling a distinct step of the analysis pipeline.

The result is a structured audit report with a weighted GEO score, criterion-by-criterion explanations grounded in research evidence, competitive benchmarking against AI-cited pages, and before/after content rewrites targeting the three biggest weaknesses.

---

## Marketing Context: Why GEO Matters

Search Engine Optimization (SEO) optimized content for Google's page-rank algorithm. Generative Engine Optimization (GEO) optimizes content for AI retrieval systems -- the models that decide which sources to quote when generating an answer.

The discipline was formally defined in the Princeton GEO paper (Aggarwal et al., ACM KDD 2024), which ran 10,000 search queries through AI systems and tested nine content optimization tactics. The findings were counterintuitive: adding statistics increased AI citation rates by 41%, adding external source citations increased them by up to 115% for mid-ranked content, and adding quotations increased them by 28%. Keyword stuffing -- the traditional SEO tactic -- had no positive effect.

This creates a gap in most marketing strategies. Teams optimized for traditional search are not necessarily creating content that AI systems will retrieve or cite. GEO closes that gap by identifying the specific structural and evidential properties that make content machine-citable.

The shift is strategically significant because:

- AI Overviews now appear in roughly 40% of all Google searches (BrightEdge, 2026)
- Perplexity serves over 100 million monthly queries and cites sources by default
- ChatGPT with web browsing is increasingly used for research and product discovery
- 96% of pages cited in Google AI Overviews have demonstrably strong E-E-A-T signals (2026 analysis of 15,847 AI Overview results)

A marketing team that can systematically evaluate and improve their content's citability has a measurable competitive advantage in AI-driven discovery channels.

---

## What the System Does

The user pastes a URL and a topic keyword. Five agents run in sequence (with the first two running in parallel), and the output is a full audit report delivered in real time via a streaming interface:

1. The page is fetched and parsed to extract headings, body text, structural signals, and schema markup
2. The content is scored against eight research-backed GEO criteria using a weighted formula
3. Top competitors are identified by running three Serper searches and using an LLM to assess which results are most AI-citation-worthy
4. Before/after content rewrites are generated for the three weakest criteria
5. Everything is synthesized into a final consultant-style audit report with a prioritized action plan

---

## Architecture: Multi-Agent Pipeline

```
User Input (URL + Topic)
        |
        v
  Orchestrator Agent
        |
        +---------------------------+
        |  (parallel -- Step 1)     |
        v                           v
Agent 1                         Agent 3
Content Fetcher             Competitor Benchmarker
(axios + cheerio)           (Serper API + Groq LLM)
        |                           |
        v                           |
Agent 2                             |
GEO Auditor (Groq LLM)             |
        |                           |
        v                           |
Agent 4                             |
Rewrite Suggester (Groq LLM)       |
        |                           |
        +-------------+-------------+
                      v
                 Agent 5
           Report Compiler (Groq LLM)
                      |
                      v
           Final GEO Audit Report
           (streamed via SSE to browser)
```

The orchestrator coordinates the pipeline. Agents 1 and 3 run in parallel because they have no dependency on each other. Agent 2 depends on Agent 1's output. Agent 4 depends on Agents 1 and 2. Agent 5 depends on all four.

The frontend receives real-time status updates for each agent via Server-Sent Events (SSE), so the user sees each agent activate, run, and complete in sequence.

---

## The Five Agents

### Agent 1 -- Content Fetcher

**Role:** Fetches any public URL and extracts clean, structured content for analysis.

**What it does:**
- Sends an HTTP GET request with browser-like headers to avoid bot-detection blocks
- Loads the HTML into Cheerio (a server-side jQuery implementation) and strips boilerplate: navigation, footers, sidebars, cookie banners, ads, and social share elements
- Tries a ranked list of semantic content selectors (`article`, `main`, `[role="main"]`, `.post-content`, etc.) to locate the main body
- Falls back to the largest `<div>` by text length, then to the full `<body>` if needed
- Extracts H1, H2, and H3 headings; title; meta description; word count; and structural signals (lists, FAQ patterns, Schema.org markup)
- Parses all `application/ld+json` script blocks to extract `datePublished`, `dateModified`, author, and schema types
- Truncates content to 8,000 characters to keep LLM inference costs reasonable

**Output:** A structured JSON object containing the parsed content, all heading levels, word count, and a `structuralSignals` object that drives the GEO Auditor's scoring.

**Marketing relevance:** This agent solves a real workflow problem. Manually extracting clean text from a web page to feed into a content audit is tedious. Automating it lets the tool scale to any URL, including competitor pages, which is where the competitive benchmarking module gets its data.

---

### Agent 2 -- GEO Auditor

**Role:** Scores the parsed content against eight research-backed GEO criteria using a calibrated LLM prompt and a weighted formula.

**What it does:**
- Sends the structured content to Groq (LLaMA 3.3-70B) with a detailed system prompt grounding each criterion in its source research
- The LLM returns a JSON object with a 0--10 score, a 2--3 sentence explanation citing specific content evidence, and a direct quote or element from the page for each criterion
- A weighted average is computed in code (not by the LLM) to ensure mathematical consistency
- A domain authority bonus of +0.5 to +1.5 is applied post-calculation for high-authority domains
- The three lowest-scoring criteria are identified as the top weaknesses and passed to Agent 4

**The eight criteria and their weights:**

| Criterion | Weight | Research Basis |
|-----------|--------|----------------|
| Evidence Density | 20% | Princeton GEO (Aggarwal et al., ACM KDD 2024): statistics +41% citation lift, citations +115%, quotes +28% |
| Chunk Quality and Passage Architecture | 18% | Gao et al. RAG Survey (arXiv:2312.10997): LLMs retrieve 200--500 word chunks independently; Tian et al. AgentGEO (2026): 5% structure change = 40% citation lift |
| Fluency and Content Quality | 15% | Princeton GEO: fluency optimization +15--30% citation visibility; keyword stuffing was counterproductive |
| Question-Oriented Structure | 12% | 72.4% of ChatGPT-cited pages had a direct answer immediately after a question-based heading |
| E-E-A-T and Author Credibility | 12% | BrightEdge 2025: author credentials carry 16% weight in AI citation decisions; 96% of AI Overview citations had strong E-E-A-T |
| Freshness and Temporal Signals | 10% | Fang et al. SIGIR-AP 2025: date injection shifts mean retrieved publication year by 4.78 years and reverses pairwise preference in up to 25% of cases |
| Schema and Structured Data | 8% | Fang et al. SIGIR-AP 2025: machine-readable date fields are the primary mechanism for freshness detection in LLM rerankers |
| Domain Entity Authority | 5% | Applied as a bonus modifier, not a standard criterion; reflects institutional recognition in model training data |

The prompt instructs the LLM to calibrate strictly: a 7/10 means genuinely good, 9--10 is exceptional. Every score must be supported by a specific element from the actual content provided.

---

### Agent 3 -- Competitor Benchmarker

**Role:** Identifies which pages on the topic are most likely to be cited by AI systems and explains specifically why.

**What it does:**
- Runs three parallel Serper API searches using query templates designed to surface authoritative and evidence-rich content: `[topic] comprehensive guide`, `[topic] according to experts research`, and `[topic] statistics data study`
- Deduplicates and merges results, filters out any URLs from the same domain as the page being analyzed, and takes the top 15 unique results
- Passes those results to Groq with a prompt that asks the LLM to identify the 3--5 most AI-citation-worthy pages and explain precisely which GEO signals make each one citation-worthy
- Returns a competitive landscape summary, a list of gap opportunities, and dominant content types in the space

**Output:** A competitor list where each entry has specific GEO strengths, a `why_ai_cites_it` field with bolded key terms, a `key_differentiator`, and a `landscape_summary` plus `gap_opportunities` for the target page.

**Marketing relevance:** This is the competitive intelligence layer. It answers the question any marketer should ask: what is the best-performing content in this space doing that we are not? Unlike a traditional backlink analysis, it evaluates content through the lens of AI retrieval -- which is the channel that matters for GEO.

---

### Agent 4 -- Rewrite Suggester

**Role:** Generates concrete before/after content rewrites targeting the three specific weaknesses identified by the GEO Auditor.

**What it does:**
- Takes the top 3 weaknesses from Agent 2 and the first 5,000 characters of the original content
- Sends them to Groq with strict rewriting rules: no fabricated statistics, dates, names, or factual claims; only permitted transformations are allowed (reordering sentences into answer-first structure, reformatting into lists, converting hedged language into declarative statements using only existing facts)
- Where the original content lacks the facts needed to fully fix a weakness, the agent uses bracketed placeholders (`[Expert Name]`, `[Year]`, `[Statistic]`, `[Source]`) to show exactly what to add and how to format it
- Also returns three "quick win" recommendations with effort and impact ratings and a concrete implementation example

**Marketing relevance:** This is the most directly actionable output of the system. A content editor can read the before/after pairs and immediately understand what change to make and why it improves citability. The constraint against fabricating facts is a deliberate design choice -- it makes the rewrites trustworthy and avoids the most dangerous failure mode of AI-assisted content editing.

---

### Agent 5 -- Report Compiler

**Role:** Synthesizes all agent outputs into a final consultant-quality audit report.

**What it does:**
- Receives outputs from all four preceding agents
- Sends them to Groq with a prompt instructing it to write as a senior marketing consultant: specific, evidence-based, no filler
- Produces an executive summary (3 focused sentences covering current GEO status, biggest opportunity or blocker, and potential impact), a page overview section, a prioritized action plan with 5 items ranked by impact-to-effort ratio, and a closing strategic insight
- Post-processes the action plan in code to enforce valid criterion keys and filter out recommendations involving format changes (video, podcast, infographic) that are out of scope for a text audit

**Marketing relevance:** The report is structured for two audiences. The executive summary is for a marketing director who needs a quick read. The action plan, with its effort estimates, timelines, and implementation instructions, is for the content or SEO team who will execute the changes.

---

## Orchestrator Agent

The Orchestrator is not a specialized AI agent -- it is the coordination logic that sequences the five agents and manages the data flow between them.

It does two things the individual agents cannot:

1. Runs Agents 1 and 3 in parallel using `Promise.all`, reducing total pipeline time since they have no interdependency
2. Emits real-time SSE events to the frontend at every stage transition (`agent_start`, `agent_complete`, `agent_error`, `analysis_complete`), enabling the live agent tracker UI

If Agent 3 (Competitor Benchmarker) fails -- for example, due to a Serper quota issue -- the orchestrator treats it as non-fatal and continues with an empty competitive dataset, ensuring the rest of the pipeline completes.

---

## AI Model: Groq with LLaMA 3.3-70B

All four LLM-powered agents use the Groq inference API. Groq runs open-source LLaMA models on custom LPU (Language Processing Unit) hardware, delivering inference speeds significantly faster than standard GPU-based providers.

The primary model is `llama-3.3-70b-versatile`. If a request hits Groq's rate limit (HTTP 429), the system automatically retries with `llama-3.1-8b-instant` as a fallback. This is handled in a shared `groqWithFallback.js` module used by all agents.

All agents use `response_format: { type: 'json_object' }` to enforce structured JSON output, which is then validated and parsed in application code before being passed downstream.

---

## Streaming Architecture

Results are delivered to the frontend via Server-Sent Events (SSE) rather than a standard HTTP response. This is the correct protocol for this use case: the analysis takes 15--45 seconds, and SSE allows the server to push partial updates to the browser without the client needing to poll.

The Express server sets the appropriate headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`) and sends a heartbeat ping every 20 seconds to keep the connection alive through proxies and load balancers.

Each event has a `type` (`agent_start`, `agent_complete`, `agent_error`, `analysis_complete`), an `agent` identifier, a `data` payload, and a timestamp. The frontend parses these events and updates the agent status UI accordingly.

---

## Caching

The backend includes an in-memory result cache with a 30-minute TTL. Cache keys are SHA-256 hashes of the URL and topic string concatenated. If a result for the same URL and topic exists in cache, the server streams it immediately with a `cache_hit: true` flag, skipping all agent calls.

This has practical value during development and demos, where the same URL may be analyzed multiple times in a short session.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | UI framework + development server |
| Styling | CSS Modules | Scoped component styles |
| Backend | Node.js + Express | HTTP server + SSE endpoint |
| AI Inference | Groq API (LLaMA 3.3-70B) | GEO scoring, competitor analysis, rewrites, report |
| Web Search | Serper API | Real-time Google search for competitor discovery |
| HTML Parsing | Cheerio + Axios | Server-side DOM parsing for content extraction |
| Streaming | Server-Sent Events | Real-time agent status updates to the browser |
| Module System | ES Modules (`"type": "module"`) | Native ESM throughout the backend |

---

## Project Structure

```
geo-agent/
+-- backend/
|   +-- agents/
|   |   +-- orchestrator.js          # Pipeline coordination + SSE emission
|   |   +-- contentFetcher.js        # Agent 1: URL fetch + HTML parse
|   |   +-- geoAuditor.js            # Agent 2: 8-criterion GEO scoring
|   |   +-- competitorBenchmarker.js # Agent 3: Serper search + LLM analysis
|   |   +-- rewriteSuggester.js      # Agent 4: Before/after content rewrites
|   |   +-- reportCompiler.js        # Agent 5: Final audit report synthesis
|   |   +-- groqWithFallback.js      # Shared Groq client with rate-limit fallback
|   +-- server.js                    # Express server, SSE endpoint, cache
|   +-- package.json
|   +-- .env                         # API keys (not committed)
+-- frontend/
    +-- vite.config.js               # Vite config with /api proxy to backend
    +-- src/
        +-- main.jsx
        +-- App.jsx
        +-- components/
            +-- InputForm.jsx
            +-- AgentTracker.jsx     # Real-time agent pipeline status UI
            +-- ReportView.jsx       # Full report layout
            +-- ScoreCard.jsx        # Weighted score visualization
            +-- CompetitorCard.jsx   # Per-competitor breakdown cards
            +-- RewritePanel.jsx     # Before/after split view
```

---

## Local Installation and Setup

### Prerequisites

- Node.js 18 or later
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A Serper API key (free tier includes 2,500 searches at [serper.dev](https://serper.dev))

### Step 1: Clone or download the project

```bash
git clone <repo-url>
cd geo-agent
```

### Step 2: Configure API keys

Create the backend environment file:

```bash
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
SERPER_API_KEY=your_serper_api_key_here
PORT=3001
```

The server will refuse to start the analysis endpoint if either key is missing or set to the placeholder value.

### Step 3: Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a second terminal)
cd ../frontend
npm install
```

### Step 4: Run the application

Open two terminals:

```bash
# Terminal 1 -- Backend (port 3001)
cd backend
npm start

# Terminal 2 -- Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser.

The Vite dev server proxies all `/api` requests to the backend, so no CORS configuration is needed during development.

### Step 5: Verify setup

Before running an analysis, check that both API keys are recognized:

```
GET http://localhost:3001/api/health
```

The response will show `"groq": true` and `"serper": true` if both keys are loaded.

---

## How to Use

You can use the [live app](https://geo-agent-xi.vercel.app/) directly or run it locally (see Installation above).

1. Open the app (live or local)
2. Enter a URL (any publicly accessible web page) and a topic keyword describing the main subject of the page
3. Click "Analyze" and watch the agent pipeline run in real time -- Agents 1 and 3 activate simultaneously, then 2, 4, and 5 in sequence
4. When the pipeline completes, the full audit report loads below the agent tracker

The report includes:
- An executive summary
- A weighted GEO score with per-criterion breakdowns and specific evidence from the page
- A competitive landscape showing which pages dominate the topic from an AI citability perspective and why
- Before/after content rewrites targeting the three weakest criteria
- A prioritized action plan with effort estimates and implementation guidance

---

## Academic Foundation

The scoring rubric is grounded in the following primary sources:

**Aggarwal, A. et al. (2024). "GEO: Generative Engine Optimization." ACM KDD 2024 (Princeton University)**
The foundational GEO paper. Tested nine optimization tactics across 10,000 queries on five AI search systems. Quantified citation lift for statistics addition (+41%), external citations (+115% for mid-ranked content), quotations (+28%), and fluency optimization (+15--30%). Established that keyword stuffing is ineffective for AI retrieval.

**Fang, Z. et al. (2025). "Temporal Bias in LLM Reranking." SIGIR-AP 2025**
A controlled study across seven models quantifying how date signals affect LLM reranking. Adding date signals shifted the mean retrieved publication year by up to 4.78 years and moved individual items up to 95 rank positions. Pairwise preference was reversed in up to 25% of cases by date injection alone.

**Gao, Y. et al. (2023). "Retrieval-Augmented Generation for Large Language Models: A Survey." arXiv:2312.10997**
The canonical RAG architecture survey. Establishes why chunk-level retrieval matters: LLMs retrieve independently embedded 200--500 word passages, not full documents. Content that does not make sense out of context cannot be effectively retrieved.

**Tian, H. et al. (2026). "AgentGEO: Multi-Agent Framework for GEO." Virginia Tech, March 2026**
Found that modifying just 5% of content structure produced a 40% relative improvement in citation rates. Used a multi-agent architecture to identify and apply targeted structural changes.

**BrightEdge Industry Analysis (2025--2026)**
Industry data on AI Overview prevalence (40% of Google searches) and the finding that author credentials now carry 16% weight in AI citation decisions, up from 8% in 2024.

---

## Connection to Course Concepts

This project applies several concepts from the course syllabus in a concrete marketing context:

**Multi-agent AI systems:** The application implements a genuine multi-agent architecture where each agent has a defined role, inputs, and outputs. The orchestrator handles coordination, parallelism, and fault tolerance without any agent knowing about the others.

**AI in content strategy:** GEO is a direct application of AI to content marketing strategy. The tool operationalizes research findings about how AI systems select and cite sources, turning academic results into actionable recommendations.

**Marketing automation:** The pipeline automates a process -- competitive content benchmarking and GEO auditing -- that would take a marketing analyst several hours per page to do manually. Scaled across a content library, it enables systematic optimization rather than one-off guesswork.

**Data-driven decision making:** Every score and recommendation in the output is backed by specific evidence from the page being analyzed and cited research. The system does not give generic advice; it identifies the exact passages that are weak and rewrites them.

**Real-time data processing:** The SSE streaming architecture demonstrates how AI pipelines can deliver progressive results to users rather than making them wait for a complete batch result -- a pattern increasingly relevant for AI-powered marketing tools.

---

## Limitations and Considerations

**Dynamic pages:** The content fetcher uses Cheerio, which parses static HTML. Pages that require JavaScript to render content (single-page applications using client-side rendering) may return incomplete text. A production version would use a headless browser like Playwright.

**Rate limits:** Groq's free tier has rate limits. Very long pages or rapid back-to-back analyses may trigger the fallback to the smaller LLaMA model, which affects scoring quality. The 30-minute cache mitigates repeated requests for the same URL.

**Ethical use:** The content rewrite agent is explicitly constrained from fabricating facts. Bracketed placeholders are used wherever the original content lacks the evidence needed to support a stronger claim. This is a deliberate design choice rooted in content integrity.

**Scope:** This tool audits on-page GEO signals only. Off-page factors like backlink authority, brand recognition, and training data representation affect AI citability but are outside the scope of what can be measured from page content alone. The Domain Entity Authority criterion accounts for this partially by scoring domain-level recognition as a separate signal.
