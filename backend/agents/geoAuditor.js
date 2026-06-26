import Groq from 'groq-sdk';

// Agent 2 — GEO Auditor
// Analyzes parsed content against 7 GEO criteria and returns structured scores.

const SYSTEM_PROMPT = `You are a GEO (Generative Engine Optimization) expert. GEO is the discipline of optimizing web content so that Large Language Models — ChatGPT, Perplexity, Google AI Overviews, Claude — cite it as a credible source in their responses.

You evaluate content rigorously against established GEO criteria. Your analysis is evidence-based: you cite specific examples from the content, not generic observations. Your scores are calibrated — 7/10 means genuinely good, not average. Reserve 9-10 for exceptional content.

Always respond with valid JSON only. No markdown, no prose outside the JSON object.`;

function buildPrompt(parsedContent) {
  return `Analyze this web page against the 7 GEO citability criteria. Score 0–10 each with specific evidence from the content.

=== PAGE DATA ===
URL: ${parsedContent.url}
Title: ${parsedContent.title}
Meta Description: ${parsedContent.metaDescription}
Word Count: ${parsedContent.wordCount}
H1s: ${parsedContent.headings.h1.join(' | ') || 'none'}
H2s: ${parsedContent.headings.h2.slice(0, 12).join(' | ') || 'none'}
H3s: ${parsedContent.headings.h3.slice(0, 12).join(' | ') || 'none'}
Has Lists: ${parsedContent.structuralSignals?.hasLists}
Has FAQ patterns: ${parsedContent.structuralSignals?.hasFAQ}
Has Schema.org markup: ${parsedContent.structuralSignals?.hasSchema}

=== MAIN CONTENT ===
${parsedContent.mainContent}

=== CRITERIA ===
1. AUTHORITY & CREDIBILITY SIGNALS (0–10)
Does it cite named sources, statistics with attribution, expert names, published studies, or verifiable data? LLMs strongly prefer citable, verifiable content.

2. STRUCTURAL CLARITY (0–10)
Is it organized with scannable headings, numbered steps, bullet lists, or FAQ blocks that an LLM can parse and extract cleanly without guessing context?

3. QUOTABILITY (0–10)
Does it contain short, precise, self-contained factual statements an LLM can lift verbatim? Or is it all long paragraphs of narrative prose that are hard to excerpt?

4. COMPREHENSIVENESS (0–10)
Does it cover the topic thoroughly enough to be a reliable single source? Does it address sub-questions, edge cases, definitions, and related concepts?

5. SEMANTIC CLARITY (0–10)
Are concepts clearly defined without jargon, ambiguity, or marketing spin? Can an LLM confidently paraphrase the content without risk of misrepresenting it?

6. FRESHNESS SIGNALS (0–10)
Does it include specific dates, year-stamped statistics, current examples, or explicit "last updated" markers? LLMs weight recency heavily.

7. QUESTION-ANSWERING FORMAT (0–10)
Does the structure map to how people actually ask questions about this topic? Does it answer "who/what/when/why/how" directly and early in each section?

Return ONLY this JSON (no markdown code fences):
{
  "criteria": {
    "authority": {
      "score": <0-10>,
      "explanation": "<2-3 sentences citing specific content examples>",
      "evidence": "<direct quote or specific element from the content>"
    },
    "structural_clarity": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example>"
    },
    "quotability": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example>"
    },
    "comprehensiveness": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example>"
    },
    "semantic_clarity": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example>"
    },
    "freshness": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example or note that dates are absent>"
    },
    "question_answering": {
      "score": <0-10>,
      "explanation": "<2-3 sentences>",
      "evidence": "<specific example>"
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
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
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

  // Recalculate overall score from criteria to ensure accuracy
  const scores = Object.values(parsed.criteria).map(c => c.score);
  parsed.overall_score = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

  // Sort weaknesses by score ascending
  parsed.top_weaknesses = parsed.top_weaknesses
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return parsed;
}
