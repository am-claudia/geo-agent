import axios from 'axios';
import Groq from 'groq-sdk';

// Agent 3 — Competitor Benchmarker
// Searches Serper for authoritative sources on the topic, then uses Gemini
// to identify GEO strengths of the top-cited pages.

const SYSTEM_PROMPT = `You are a competitive intelligence analyst for GEO (Generative Engine Optimization). You identify which content sources are most cited by AI systems like ChatGPT, Perplexity, and Google AI Overviews, and explain precisely what makes them citation-worthy.

Your analysis is specific and tactical — marketing teams use this to know exactly what content attributes to emulate. Never give generic advice. Always tie observations back to concrete GEO signals.

Respond only with valid JSON. No markdown code fences.`;

async function serperSearch(query) {
  try {
    const res = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 10, gl: 'us', hl: 'en' },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );
    return res.data;
  } catch (err) {
    console.warn(`[Serper] Search failed for "${query}":`, err.message);
    return { organic: [] };
  }
}

export async function benchmarkCompetitors(topic) {
  const queries = [
    `${topic} comprehensive guide`,
    `${topic} according to experts research`,
    `${topic} statistics data study`,
  ];

  const searchResults = await Promise.allSettled(queries.map(q => serperSearch(q)));

  // Deduplicate and collect top organic results
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

  const topResults = allResults.slice(0, 15);

  if (topResults.length === 0) {
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
      "why_ai_cites_it": "<1-2 sentences: specific reason AI systems prefer this page>",
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

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
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

  return JSON.parse(jsonMatch[0]);
}
