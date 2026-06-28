import { groqComplete } from './groqWithFallback.js';

// Agent 2 — GEO Auditor
// Scores content against 7 research-backed GEO criteria.
// Primary sources: Princeton GEO (Aggarwal et al., ACM KDD 2024),
// SIGIR-AP 2025 (Fang et al.), Gao et al. RAG Survey (arXiv:2312.10997),
// BrightEdge 2025, Tian et al. AgentGEO March 2026.

const SYSTEM_PROMPT = `You are a GEO (Generative Engine Optimization) expert. GEO is the discipline of optimizing web content so that AI systems — ChatGPT, Perplexity, Google AI Overviews, Claude — retrieve and cite it in their responses.

Your scoring rubric is grounded in peer-reviewed research: principally the Princeton GEO paper (Aggarwal et al., ACM KDD 2024), which tested 9 optimization tactics across 10,000 queries, and the SIGIR-AP 2025 recency bias study (Fang et al.), which quantified how LLM rerankers weight temporal signals. These findings are supplemented by the canonical RAG architecture survey (Gao et al., arXiv:2312.10997) and BrightEdge industry analyses (2025–2026).

Your scores are calibrated — 7/10 means genuinely good, not average. Reserve 9–10 for exceptional content. Base every explanation on specific evidence from the actual page content provided, not generic observations.

Always respond with valid JSON only. No markdown, no prose outside the JSON object.`;

function extractRootDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function buildPrompt(parsedContent) {
  const sig = parsedContent.structuralSignals;

  return `Analyze this web page against the 8 research-backed GEO citability criteria. Score 0–10 each with specific evidence from the content.

=== PAGE DATA ===
URL: ${parsedContent.url}
Root Domain: ${extractRootDomain(parsedContent.url)}
Title: ${parsedContent.title}
Meta Description: ${parsedContent.metaDescription}
Word Count: ${parsedContent.wordCount}
H1s: ${parsedContent.headings.h1.join(' | ') || 'none'}
H2s: ${parsedContent.headings.h2.slice(0, 12).join(' | ') || 'none'}
H3s: ${parsedContent.headings.h3.slice(0, 12).join(' | ') || 'none'}
Has Lists: ${sig.hasLists}
Has FAQ patterns: ${sig.hasFAQ}
Has Schema.org markup: ${sig.hasSchema}
Schema Types Found: ${sig.schemaTypes.length > 0 ? sig.schemaTypes.join(', ') : 'none'}
datePublished (schema/meta): ${sig.datePublished || 'not detected'}
dateModified (schema/meta): ${sig.dateModified || 'not detected'}
Author (schema/meta): ${sig.schemaAuthor || 'not detected'}
Question-Phrased Headings: ${sig.questionHeadingCount} out of ${parsedContent.headings.h2.length + parsedContent.headings.h3.length} H2/H3s

=== MAIN CONTENT ===
${parsedContent.mainContent}

=== CRITERIA ===

1. EVIDENCE DENSITY (0–10)
Count: (a) statistics with specific numbers (percentages, dollar figures, quantities, ratios), (b) outbound citations or "according to [source]" attributions, (c) direct quotes attributed to named people or publications.
Score 0–3: no statistics, no citations, no quotes. Score 4–5: 1–2 statistics, little or no citation. Score 6–7: 3–5 statistics plus 1–2 citations or quotes. Score 8–9: 6+ statistics with clear attribution and 3+ citations or quotes. Score 10: dense, consistent evidence throughout with every major claim backed by a source.
Research basis: Princeton GEO (Aggarwal et al., ACM KDD 2024) — statistics addition produced a +41% citation lift; citing external sources produced +115% for mid-ranked content; quotation addition produced +28%.

2. CHUNK QUALITY & PASSAGE ARCHITECTURE (0–10)
LLMs do not read a full page — they retrieve independently embedded chunks of 200–500 words. Evaluate: (a) Does the page open with a direct, self-contained answer to the primary topic in the first 40–150 words? (b) Are key claims written as standalone passages that don't require surrounding context to make sense? (c) Is the most important information positioned in the first 30% of the text?
Score 0–3: long introductory preamble, no answer until deep into the page. Score 4–6: some self-contained passages but answer-first discipline is inconsistent. Score 7–8: clear answer-first structure, most claims extractable independently. Score 9–10: every section opens with a self-contained claim, exemplary passage architecture throughout.
Research basis: Gao et al. RAG Survey (arXiv:2312.10997) — chunks are retrieved and scored independently, not as a page. SatelliteAI analysis: 44.2% of all LLM citations come from the first 30% of text. ZipTie: optimizing chunk quality lifts retrieval accuracy from ~65% to 92%. Tian et al. AgentGEO (Virginia Tech, March 2026): modifying 5% of content structure produced a 40% relative improvement in citation rates.

3. QUESTION-ORIENTED STRUCTURE (0–10)
Count question-phrased H2/H3 headings (already provided above). Evaluate: (a) are FAQ blocks present with direct Q&A pairs? (b) does the heading hierarchy follow a logical order without skipped levels? (c) are "who / what / when / why / how" questions answered directly and early within each section, not buried?
Score 0–3: all headings are keyword phrases, no FAQ structure, no Q&A format. Score 4–5: occasional question headings but no systematic Q&A structure. Score 6–7: some question headings and FAQ-style sections. Score 8–9: majority of headings are questions, FAQ blocks present, each section opens with a direct answer. Score 10: fully question-driven architecture throughout.
Research basis: Practitioner reverse-engineering shows 72.4% of ChatGPT-cited pages had a short direct answer immediately after a question-based heading. GEO-SFE framework (Machine Relations Research, 2026). Tian et al. AgentGEO 2026.

4. E-E-A-T & AUTHOR CREDIBILITY (0–10)
Evaluate: (a) is there a named author (not anonymous or "Staff")? (b) are credentials, job title, affiliation, or years of experience stated or inferable? (c) is there a bio page, author profile, or schema author signal (use the Author field above)? (d) does the publisher present as a credible, specialized source with a clear editorial identity?
Score 0–2: anonymous, no authorship signals, generic publisher. Score 3–5: name present but no credentials or bio. Score 6–7: named author with credentials OR strong publisher credibility. Score 8–9: named author with credentials AND bio AND publisher credibility. Score 10: full E-E-A-T stack — expert author, verifiable credentials, linked profiles, publisher track record.
Research basis: BrightEdge 2025 — author credentials carry 16% weight in AI citation decisions (up from 8% in 2024). 2026 analysis of 15,847 AI Overview results: 96% of citations came from sources with demonstrably strong E-E-A-T signals. E-E-A-T functions as a binary pass/fail gate in Google AI Overviews' multi-stage filtering pipeline.

5. SCHEMA & STRUCTURED DATA IMPLEMENTATION (0–10)
Use the Schema Types, datePublished, dateModified, and Author fields provided above. Evaluate: (a) is FAQPage JSON-LD present? (b) are datePublished and dateModified in schema? (c) is Article or WebPage schema present? (d) is Person/Author schema with author details present? No JSON-LD at all is a significant deficit.
Score 0–2: no JSON-LD schema at all. Score 3–4: basic schema only (e.g. WebSite or Organization), no article or FAQ schema, no dates. Score 5–6: Article schema present but missing FAQPage or date fields. Score 7–8: Article + datePublished/dateModified present. Score 9–10: Article + FAQPage + datePublished + dateModified + Person/Author schema all present.
Research basis: Fang et al. SIGIR-AP 2025 — machine-readable date fields are the primary mechanism by which LLM rerankers detect freshness; absence means the recency signal is unavailable. Schema.org structured data operates on two axes: parsed at inference time by retrieval systems (Perplexity, ChatGPT search) AND shapes parametric knowledge during future training cycles. FAQPage schema has among the highest citation rates across ChatGPT, Perplexity, and Google AI Overviews.

6. FRESHNESS & TEMPORAL SIGNALS (0–10)
Evaluate what a reader (and an LLM) can actually see in the content: (a) is a publication date visible on the page? (b) are statistics year-stamped (e.g. "in 2025, X% of...")? (c) are there "Last Updated" markers? (d) does the content reference current events, recent developments, or 2024–2026 data? Use datePublished/dateModified from the schema signals above as supporting evidence but also assess what is visible in the prose.
Score 0–2: no dates anywhere, undated statistics, no temporal anchoring. Score 3–5: one date present (published or modified) but statistics are undated, no "last updated" marker. Score 6–7: publication date visible and most statistics are year-stamped. Score 8–9: publication + modification dates visible, year-stamped statistics throughout, recent data (within 12 months). Score 10: explicit "Last Updated" + publication date + year-stamped statistics + references to current-year developments.
Research basis: Fang et al. SIGIR-AP 2025 (controlled study, 7 models) — adding date signals shifts the mean publication year of top-10 retrieved results by up to 4.78 years and moves individual items up to 95 rank positions in LLM reranking; pairwise preference can be reversed by up to 25% from date injection alone. Perplexity applies aggressive time decay. Content updated within 2 months earns 28% more AI citations (Fuel Online industry analysis).

7. FLUENCY & CONTENT QUALITY (0–10)
Evaluate: (a) is the prose clear and readable without excessive jargon, filler phrases, or marketing spin? (b) is keyword stuffing absent (natural language, no forced repetition of target terms)? (c) does the content comprehensively cover the topic — definitions, sub-questions, edge cases — or is it thin and vague?
Score 0–3: heavy marketing language, keyword stuffing, or thin shallow coverage. Score 4–5: readable but with some filler or jargon, moderate depth. Score 6–7: clear prose, natural keyword usage, solid coverage. Score 8–9: high fluency, no stuffing, thorough and precise coverage. Score 10: exceptional clarity, expert-level depth, zero fluff.
Research basis: Princeton GEO (Aggarwal et al., ACM KDD 2024) — fluency optimization produced a +15–30% citation visibility boost; keyword stuffing was the control condition and found to be ineffective or counterproductive. LLMs evaluate content quality holistically; stuffed content scores lower on semantic coherence in embedding similarity.

8. DOMAIN ENTITY AUTHORITY (0–10)
Use the Root Domain field above. Score how likely this domain is to be recognized as an institutional authority in LLM training data — independent of this page's on-page signals. This reflects domain-level recognition baked into model weights, not content quality.
Score 9–10: known institutional authorities with massive training data representation: wikipedia.org, github.com, google.com, developer.mozilla.org, .gov domains, .edu domains, major established media (nytimes.com, bbc.com, reuters.com, nature.com, sciencedirect.com, pubmed.ncbi.nlm.nih.gov, cnn.com, theguardian.com, wsj.com, economist.com, scientificamerican.com).
Score 6–8: established industry authorities that appear extensively in training data: well-known SaaS platforms (salesforce.com, adobe.com, shopify.com, stripe.com, notion.so), major SEO/marketing tools (moz.com, ahrefs.com, semrush.com, hubspot.com), recognized trade publications with strong domain history, established tech media (techcrunch.com, wired.com, theverge.com, zdnet.com).
Score 3–5: mid-tier recognized domains — established brands with some domain history and training data presence, but not at the institutional tier. Known in their industry but not widely cited across LLM corpora.
Score 0–2: unknown or unrecognized domains, personal blogs, content farms, or subdomains of free publishing platforms (e.g., medium.com user pages, substack.com newsletters, blogspot.com, wordpress.com free blogs). Also 0–2 for domains with no signals of institutional recognition.
Important: explain your reasoning. Cite the specific domain-level signals that informed your judgment (TLD, publisher history, industry standing, known training data presence). A high score here does NOT mean the page content is good — it means the domain itself carries inherent citation weight in AI systems.

Return ONLY this JSON (no markdown code fences):
{
  "criteria": {
    "evidence_density": {
      "score": <0-10>,
      "explanation": "<2-3 sentences citing specific content examples>",
      "evidence": "<direct quote or specific element from the content>"
    },
    "chunk_quality": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example — e.g. quote the opening 20 words of the page>"
    },
    "question_structure": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example — e.g. a question-phrased heading or lack thereof>"
    },
    "eeat_authority": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example — author name, credentials found, or note they are absent>"
    },
    "schema_markup": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific schema types found or confirm none>"
    },
    "freshness": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific dates found in content, or confirm they are absent>"
    },
    "fluency_quality": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example of strong or weak prose>"
    },
    "domain_entity_authority": {
      "score": <0-10>,
      "explanation": "<2-3 sentences: why this domain does or does not have institutional recognition in LLM training data>",
      "evidence": "<specific domain signals — e.g., '.gov domain operated by a federal agency', 'major established publisher with decades of online presence', or 'unknown personal blog without institutional backing'>"
    }
  },
  "overall_score": <exact average to 1 decimal place>,
  "top_weaknesses": [
    {
      "criterion": "<criterion key matching the criteria object>",
      "score": <score>,
      "issue": "<specific, concrete problem found in this content>",
      "impact": "<why this specific weakness makes LLMs less likely to cite this page>"
    },
    {
      "criterion": "<criterion key>",
      "score": <score>,
      "issue": "<specific problem>",
      "impact": "<specific citability impact>"
    },
    {
      "criterion": "<criterion key>",
      "score": <score>,
      "issue": "<specific problem>",
      "impact": "<specific citability impact>"
    }
  ],
  "strengths": [
    "<concrete strength 1 with evidence>",
    "<concrete strength 2 with evidence>",
    "<concrete strength 3 with evidence>"
  ]
}`;
}

export async function auditGEOContent(parsedContent) {
  const completion = await groqComplete({
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(parsedContent) },
    ],
  });

  const raw = completion.choices[0].message.content.trim();

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('GEO Auditor returned non-JSON output.');

  const parsed = JSON.parse(jsonMatch[0]);

  // Weighted score calculation (weights sum to 1.0)
  const WEIGHTS = {
    evidence_density:        0.20,
    chunk_quality:           0.18,
    fluency_quality:         0.15,
    question_structure:      0.12,
    eeat_authority:          0.12,
    freshness:               0.10,
    schema_markup:           0.08,
    domain_entity_authority: 0.05,
  };

  const c = parsed.criteria;
  const weightedSum = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (c[key]?.score ?? 0) * weight,
    0
  );

  // Domain authority bonus — applied after weighted average, capped at 10
  const domainScore = c.domain_entity_authority?.score ?? 0;
  const domainBonus = domainScore >= 8 ? 1.5 : domainScore >= 6 ? 0.5 : 0;
  parsed.domain_bonus = domainBonus;

  parsed.overall_score = Math.min(10, Math.round((weightedSum + domainBonus) * 10) / 10);

  // Sort weaknesses by score ascending
  parsed.top_weaknesses = parsed.top_weaknesses
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return parsed;
}
