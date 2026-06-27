import { fetchAndParseContent } from './contentFetcher.js';
import { auditGEOContent } from './geoAuditor.js';
import { benchmarkCompetitors } from './competitorBenchmarker.js';
import { suggestRewrites } from './rewriteSuggester.js';
import { compileReport } from './reportCompiler.js';

// Orchestrator Agent
// Coordinates the 5 specialist agents in the correct sequence:
//   Step 1: Agent 1 (Content Fetcher) + Agent 3 (Competitor Benchmarker) — PARALLEL
//   Step 2: Agent 2 (GEO Auditor) — receives Agent 1 output
//   Step 3: Agent 4 (Rewrite Suggester) — receives Agent 1 + Agent 2 outputs
//   Step 4: Agent 5 (Report Compiler) — receives all outputs

export async function runOrchestrator(url, topic, emit) {
  console.log(`\n[ORCHESTRATOR] ▶ Starting analysis`);
  console.log(`[ORCHESTRATOR]   URL:   ${url}`);
  console.log(`[ORCHESTRATOR]   Topic: ${topic}`);

  // ── Step 1: Parallel — Agent 1 & Agent 3 ─────────────────────────────────
  console.log('\n[ORCHESTRATOR] Step 1: Launching Agent 1 (Content Fetcher) + Agent 3 (Competitor Benchmarker) in parallel');

  emit('agent_start', 'contentFetcher', {
    message: 'Fetching and parsing webpage content…',
  });
  emit('agent_start', 'competitorBenchmarker', {
    message: `Searching for top AI-cited sources on "${topic}"…`,
  });

  let parsedContent, competitorData;

  [parsedContent, competitorData] = await Promise.all([
    // Agent 1
    (async () => {
      try {
        const result = await fetchAndParseContent(url);
        console.log('[ORCHESTRATOR] ✓ Agent 1 complete —', result.wordCount, 'words extracted');
        emit('agent_complete', 'contentFetcher', {
          message: `Extracted ${result.wordCount.toLocaleString()} words from "${result.title}"`,
          preview: {
            title: result.title,
            wordCount: result.wordCount,
            h2Count: result.headings.h2.length,
          },
        });
        return result;
      } catch (err) {
        console.error('[ORCHESTRATOR] ✗ Agent 1 failed:', err.message);
        emit('agent_error', 'contentFetcher', { message: err.message });
        throw err;
      }
    })(),

    // Agent 3
    (async () => {
      try {
        const result = await benchmarkCompetitors(topic, url);
        console.log('[ORCHESTRATOR] ✓ Agent 3 complete —', result.competitors.length, 'competitors found');
        emit('agent_complete', 'competitorBenchmarker', {
          message: `Found ${result.competitors.length} key competitors to benchmark`,
          preview: {
            competitorCount: result.competitors.length,
            topDomain: result.competitors[0]?.domain || 'n/a',
          },
        });
        return result;
      } catch (err) {
        console.error('[ORCHESTRATOR] ✗ Agent 3 failed (non-fatal):', err.message);
        emit('agent_error', 'competitorBenchmarker', { message: err.message });
        // Non-fatal — continue with empty competitive data
        return {
          competitors: [],
          landscape_summary: 'Competitor data unavailable.',
          gap_opportunities: [],
          dominant_content_types: [],
        };
      }
    })(),
  ]);

  // ── Step 2: Agent 2 (GEO Auditor) ────────────────────────────────────────
  console.log('\n[ORCHESTRATOR] Step 2: Launching Agent 2 (GEO Auditor)');
  emit('agent_start', 'geoAuditor', {
    message: 'Scoring content against 7 GEO citability criteria…',
  });

  let geoAudit;
  try {
    geoAudit = await auditGEOContent(parsedContent);
    console.log('[ORCHESTRATOR] ✓ Agent 2 complete — Overall score:', geoAudit.overall_score);
    emit('agent_complete', 'geoAuditor', {
      message: `GEO Score: ${geoAudit.overall_score}/10 — ${scoreLabel(geoAudit.overall_score)}`,
      preview: {
        overallScore: geoAudit.overall_score,
        weaknesses: geoAudit.top_weaknesses.map(w => w.criterion),
      },
    });
  } catch (err) {
    console.error('[ORCHESTRATOR] ✗ Agent 2 failed:', err.message);
    emit('agent_error', 'geoAuditor', { message: err.message });
    throw err;
  }

  // ── Step 3: Agent 4 (Rewrite Suggester) ──────────────────────────────────
  console.log('\n[ORCHESTRATOR] Step 3: Launching Agent 4 (Rewrite Suggester)');
  emit('agent_start', 'rewriteSuggester', {
    message: 'Generating before/after rewrites for the top 3 weaknesses…',
  });

  let rewrites;
  try {
    rewrites = await suggestRewrites(parsedContent, geoAudit.top_weaknesses);
    console.log('[ORCHESTRATOR] ✓ Agent 4 complete —', rewrites.rewrites.length, 'rewrites generated');
    emit('agent_complete', 'rewriteSuggester', {
      message: `Generated ${rewrites.rewrites.length} targeted before/after rewrites`,
      preview: { rewriteCount: rewrites.rewrites.length },
    });
  } catch (err) {
    console.error('[ORCHESTRATOR] ✗ Agent 4 failed:', err.message);
    emit('agent_error', 'rewriteSuggester', { message: err.message });
    throw err;
  }

  // ── Step 4: Agent 5 (Report Compiler) ────────────────────────────────────
  console.log('\n[ORCHESTRATOR] Step 4: Launching Agent 5 (Report Compiler)');
  emit('agent_start', 'reportCompiler', {
    message: 'Compiling final GEO audit report…',
  });

  let finalReport;
  try {
    finalReport = await compileReport({ parsedContent, geoAudit, competitorData, rewrites });
    console.log('[ORCHESTRATOR] ✓ Agent 5 complete — Report ready');
    emit('agent_complete', 'reportCompiler', {
      message: 'Final report compiled successfully',
    });
  } catch (err) {
    console.error('[ORCHESTRATOR] ✗ Agent 5 failed:', err.message);
    emit('agent_error', 'reportCompiler', { message: err.message });
    throw err;
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n[ORCHESTRATOR] ✅ Analysis complete\n');
  emit('analysis_complete', 'orchestrator', {
    parsedContent,
    geoAudit,
    competitorData,
    rewrites,
    finalReport,
  });
}

function scoreLabel(score) {
  if (score >= 8) return 'Excellent';
  if (score >= 6.5) return 'Good';
  if (score >= 4.5) return 'Fair';
  return 'Poor — significant improvement needed';
}
