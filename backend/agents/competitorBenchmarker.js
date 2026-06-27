import axios from 'axios';
import Groq from 'groq-sdk';

// Agent 3 — Competitor Benchmarker
// Searches Serper for authoritative sources on the topic, then uses Gemini
// to identify GEO strengths of the top-cited pages.

const SYSTEM_PROMPT = `You are a competitive intelligence analyst for GEO (Generative Engine Optimization). You identify which content sources are most cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews, and explain precisely what makes them citation-worthy.

Your analysis is specific and tactical — marketing teams use this to know exactly what content attributes to emulate. Never give generic advice. Always tie observations back to concrete GEO signals.

Respond only with valid JSON. No markdown code fences.`;

async function serperSearch(query) {
  const url = 'https://google.serper.dev/search';
  const body = { q: query, num: 10, gl: 'us', hl: 'en' };
  const apiKey = process.env.SERPER_API_KEY;
  const keyPreview = apiKey ? apiKey.slice(0, 8) + '...' : '(not set)';

  console.log(`\n[Serper] ── REQUEST ──────────────────────────────`);
  console.log(`[Serper] Query    : "${query}"`);
  console.log(`[Serper] URL      : POST ${url}`);
  console.log(`[Serper] Headers  : { 'X-API-KEY': '${keyPreview}', 'Content-Type': 'application/json' }`);
  console.log(`[Serper] Body     :`, JSON.stringify(body));

  try {
    const res = await axios.post(url, body, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    });

    console.log(`[Serper] ── RESPONSE ─────────────────────────────`);
    console.log(`[Serper] Status   : ${res.status} ${res.statusText}`);
    console.log(`[Serper] Raw body :`, JSON.stringify(res.data, null, 2));

    return res.data;
  } catch (err) {
    console.error(`[Serper] ── ERROR ───────────────────────────────`);
    console.error(`[Serper] Message  :`, err.message);
    if (err.response) {
      console.error(`[Serper] Status   : ${err.response.status} ${err.response.statusText}`);
      console.error(`[Serper] Body     :`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`[Serper] No HTTP response received (network/timeout error)`);
    }
    return { organic: [] };
  }
}

export async function benchmarkCompetitors(topic, inputUrl) {
  console.log(`\n[CompetitorBenchmarker] ══ START ══════════════════════════`);
  console.log(`[CompetitorBenchmarker] Topic: "${topic}"`);
  console.log(`[CompetitorBenchmarker] SERPER_API_KEY set: ${!!process.env.SERPER_API_KEY}`);
  console.log(`[CompetitorBenchmarker] GROQ_API_KEY set  : ${!!process.env.GROQ_API_KEY}`);

  const queries = [
    `${topic} comprehensive guide`,
    `${topic} according to experts research`,
    `${topic} statistics data study`,
  ];

  console.log(`\n[CompetitorBenchmarker] ── Built ${queries.length} search queries:`);
  queries.forEach((q, i) => console.log(`[CompetitorBenchmarker]   [${i + 1}] "${q}"`));

  const searchResults = await Promise.allSettled(queries.map(q => serperSearch(q)));

  console.log(`\n[CompetitorBenchmarker] ── Serper results settled:`);
  searchResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const organicCount = r.value?.organic?.length ?? 0;
      console.log(`[CompetitorBenchmarker]   Query ${i + 1}: fulfilled — ${organicCount} organic results`);
    } else {
      console.log(`[CompetitorBenchmarker]   Query ${i + 1}: rejected — ${r.reason}`);
    }
  });

  const seen = new Set();
  const allResults = [];

  for (const result of searchResults) {
    if (result.status !== 'fulfilled') continue;
    const { organic = [], answerBox, knowledgeGraph } = result.value;

    for (const item of organic) {
      if (!item.link || seen.has(item.link)) continue;
      seen.add(item.link);
      allResults.push({
        url: item.link,
        domain: new URL(item.link).hostname.replace('www.', ''),
        title: item.title || '',
        snippet: item.snippet || '',
        position: item.position,
      });
    }
  }

  console.log(`\n[CompetitorBenchmarker] ── Deduplication complete:`);
  console.log(`[CompetitorBenchmarker]   Total unique results: ${allResults.length}`);
  allResults.forEach((r, i) => console.log(`[CompetitorBenchmarker]   [${i + 1}] ${r.domain} | pos:${r.position} | ${r.url}`));

  // Remove results that belong to the same domain as the page being analyzed
  const inputDomain = (() => {
    try {
      const hostname = new URL(inputUrl).hostname.replace(/^www\./, '');
      const parts = hostname.split('.');
      return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
    } catch {
      return '';
    }
  })();

  const filteredResults = inputDomain
    ? allResults.filter(r => r.domain !== inputDomain && !r.domain.endsWith('.' + inputDomain))
    : allResults;

  if (inputDomain) {
    const removed = allResults.length - filteredResults.length;
    console.log(`[CompetitorBenchmarker]   Self-domain filter ("${inputDomain}"): removed ${removed} result(s)`);
  }

  const topResults = filteredResults.slice(0, 15);
  console.log(`[CompetitorBenchmarker]   Top ${topResults.length} selected for LLM analysis`);

  if (topResults.length === 0) {
    console.warn(`[CompetitorBenchmarker] No results found — returning fallback. Check Serper API key and quota.`);
    return {
      competitors: [],
      landscape_summary: 'No competitor data available — Serper API may be rate-limited.',
      gap_opportunities: ['Add expert citations', 'Add dated statistics', 'Add FAQ sections'],
      dominant_content_types: ['Unknown'],
    };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `Analyze these search results for the topic "${topic}" and identify the 3–5 sources most likely to be cited by AI systems. For each, explain specifically which GEO signals make it citation-worthy.

SEARCH RESULTS:
${topResults.map((r, i) => `[${i + 1}] ${r.domain}\nURL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n')}

Identify the top 3–5 most GEO-optimized pages. Explain specifically WHY an AI would cite each one (data, structure, authority, comprehensiveness, etc.).

Return ONLY this JSON:
{
  "competitors": [
    {
      "url": "<full URL>",
      "domain": "<domain without www>",
      "title": "<page title>",
      "geo_strengths": [
        "<specific GEO strength 1 — e.g., 'cites 12 peer-reviewed studies with named authors'>",
        "<specific GEO strength 2>",
        "<specific GEO strength 3>"
      ],
      "why_ai_cites_it": ["<bullet 1: one specific reason AI cites this, with **key term** bolded>", "<bullet 2: another specific reason, with **key term** bolded>"],
      "key_differentiator": "<the single most citation-worthy element of this page>"
    }
  ],
  "landscape_summary": "<2-3 sentences: what does the best-performing content in this space consistently do well from a GEO perspective?>",
  "gap_opportunities": [
    "<specific content gap the target page could fill to outperform competitors>",
    "<specific gap 2>",
    "<specific gap 3>"
  ],
  "dominant_content_types": ["<e.g., long-form guides>", "<e.g., research roundups>"]
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const raw = completion.choices[0].message.content.trim();

  console.log(`\n[CompetitorBenchmarker] ── LLM raw response (first 500 chars):`);
  console.log(raw.slice(0, 500));

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`[CompetitorBenchmarker] JSON parse failed — no JSON object found in LLM response. Using fallback.`);
    return {
      competitors: topResults.slice(0, 3).map(r => ({
        url: r.url,
        domain: r.domain,
        title: r.title,
        geo_strengths: ['Strong domain authority', 'Comprehensive coverage', 'Clear structure'],
        why_ai_cites_it: 'High-authority domain with relevant content',
        key_differentiator: 'Domain authority',
      })),
      landscape_summary: 'Competitive analysis partially available.',
      gap_opportunities: ['Add expert citations', 'Add dated statistics', 'Add FAQ sections'],
      dominant_content_types: ['Long-form guides'],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`\n[CompetitorBenchmarker] ── Extracted data returned to orchestrator:`);
  console.log(`[CompetitorBenchmarker]   competitors         : ${parsed.competitors?.length ?? 0} items`);
  console.log(`[CompetitorBenchmarker]   gap_opportunities   : ${parsed.gap_opportunities?.length ?? 0} items`);
  console.log(`[CompetitorBenchmarker]   dominant_content_types: ${JSON.stringify(parsed.dominant_content_types)}`);
  console.log(`[CompetitorBenchmarker]   landscape_summary   : "${(parsed.landscape_summary || '').slice(0, 100)}..."`);
  console.log(`[CompetitorBenchmarker] ══ END ════════════════════════════════════\n`);

  return parsed;
}
