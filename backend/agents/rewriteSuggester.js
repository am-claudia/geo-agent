import Groq from 'groq-sdk';

// Agent 4 — Rewrite Suggester
// Takes the top 3 GEO weaknesses and produces concrete before/after rewrites
// using actual sentences from the original content.

const SYSTEM_PROMPT = `You are a GEO (Generative Engine Optimization) content editor. Your job is to rewrite specific sections of web content to dramatically increase the likelihood that AI language models will cite that content.

Rewriting rules:
- ABSOLUTE PROHIBITION: Never invent statistics, percentages, dates, study names, author names, credentials, publication names, or any factual claim not already present word-for-word in the source content. Fabricated facts that sound plausible are the most dangerous failure mode — they poison the page's trustworthiness.
- Permitted transformations ONLY: (1) reorder existing sentences into answer-first structure, (2) reformat prose into lists or self-contained extractable blocks, (3) add schema markup examples using only facts already on the page, (4) convert hedged language ("may help", "can improve") into declarative statements using only facts already present.
- Be surgical: rewrite the specific weak sentence or paragraph, not a generic version
- Each rewrite must directly address the stated GEO weakness
- Explain WHY the rewrite improves citability in concrete LLM-behavior terms
- If a weakness CANNOT be addressed without inventing new facts, do NOT fabricate. Set the "after" field to a note starting with "NOTE:" that explains what type of content the user would need to add themselves — e.g., "NOTE: To fix this criterion, add a named expert quote with credentials. The page currently contains no named attribution to restructure. Format: '[Expert Name], [Title] at [Organization], states: ...'"

Respond only with valid JSON. No markdown code fences.`;

export async function suggestRewrites(parsedContent, topWeaknesses) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `Here is a web page's content and the 3 most critical GEO weaknesses identified in its audit. For each weakness, find a relevant excerpt from the original content and rewrite it to directly fix the GEO problem.

=== ORIGINAL PAGE ===
Title: ${parsedContent.title}
URL: ${parsedContent.url}

Content (first 5000 chars):
${parsedContent.mainContent.substring(0, 5000)}

=== TOP 3 WEAKNESSES TO FIX ===
${topWeaknesses.map((w, i) => `
WEAKNESS ${i + 1}:
Criterion: ${w.criterion}
Current Score: ${w.score}/10
Specific Issue: ${w.issue}
Why It Hurts LLM Citability: ${w.impact}
`).join('\n')}

For each weakness:
1. Find (or if necessary, paraphrase) a relevant passage from the original content
2. Rewrite it to specifically fix the GEO weakness
3. Add geo_signals_added listing the specific LLM-citability improvements made

Return ONLY this JSON:
{
  "rewrites": [
    {
      "weakness_addressed": "<criterion key, e.g. 'authority'>",
      "weakness_label": "<human-readable label, e.g. 'Authority & Credibility'>",
      "weakness_score": <original score>,
      "context": "<which section or part of the page this excerpt is from>",
      "before": "<original excerpt or paraphrase — the weak version>",
      "after": "<rewritten version using ONLY facts already present on the page — if the weakness cannot be fixed without inventing new facts, begin this field with 'NOTE:' and explain what the user would need to add themselves>",
      "why_better": "<specific explanation: how does this rewrite make an LLM more likely to cite this content?>",
      "geo_signals_added": [
        "<e.g., 'Added named expert with credentials'>",
        "<e.g., 'Added year-stamped statistic'>",
        "<e.g., 'Added source attribution'>'"
      ]
    }
  ],
  "additional_quick_wins": [
    {
      "action": "<specific, implementable action — not generic advice>",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "example": "<concrete example of what this would look like>"
    },
    {
      "action": "<quick win 2>",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "example": "<concrete example>"
    },
    {
      "action": "<quick win 3>",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "example": "<concrete example>"
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const raw = completion.choices[0].message.content.trim();

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Rewrite Suggester returned non-JSON output.');

  return JSON.parse(jsonMatch[0]);
}
