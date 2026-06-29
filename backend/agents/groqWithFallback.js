import Groq from 'groq-sdk';

const PRIMARY_MODEL  = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

// llama-3.1-8b-instant TPM limit is 6000 tokens. Use 5500 for headroom.
// Real-world English averages ~3.3 chars/token; use 3 to stay conservative.
const FALLBACK_TOKEN_BUDGET = 5500;
const CHARS_PER_TOKEN = 3;

function trimForFallback(messages) {
  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
  if (totalChars / CHARS_PER_TOKEN <= FALLBACK_TOKEN_BUDGET) return messages;

  const maxChars = FALLBACK_TOKEN_BUDGET * CHARS_PER_TOKEN;
  const prefixChars = messages.slice(0, -1).reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
  const budget = maxChars - prefixChars;

  return messages.map((msg, i) => {
    if (i !== messages.length - 1 || msg.role !== 'user' || msg.content.length <= budget) return msg;

    // Trim only the MAIN CONTENT section so the criteria definitions and JSON
    // template at the end of the prompt are always preserved for the LLM.
    const CONTENT_MARKER = '=== MAIN CONTENT ===\n';
    const CRITERIA_MARKER = '\n=== CRITERIA ===';
    const contentStart = msg.content.indexOf(CONTENT_MARKER);
    const contentEnd   = msg.content.indexOf(CRITERIA_MARKER);

    if (contentStart !== -1 && contentEnd !== -1 && contentStart < contentEnd) {
      const before        = msg.content.slice(0, contentStart + CONTENT_MARKER.length);
      const after         = msg.content.slice(contentEnd);
      const contentBudget = budget - before.length - after.length - 50; // 50 for the truncation note

      if (contentBudget > 300) {
        const trimmedContent = msg.content.slice(contentStart + CONTENT_MARKER.length, contentStart + CONTENT_MARKER.length + contentBudget);
        console.warn(`[groq] Fallback: trimmed MAIN CONTENT from ${contentEnd - contentStart - CONTENT_MARKER.length} to ${contentBudget} chars — criteria section preserved`);
        return { ...msg, content: before + trimmedContent + '\n[… content truncated]\n' + after };
      }
    }

    // Last resort: hard-slice (criteria may be lost, but better than a 413)
    console.warn(`[groq] Fallback: hard-slicing message from ${msg.content.length} to ${budget} chars`);
    return { ...msg, content: msg.content.slice(0, budget) };
  });
}

export async function groqComplete(params) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    return await groq.chat.completions.create({ model: PRIMARY_MODEL, ...params });
  } catch (err) {
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (status !== 429) throw err;
    console.warn(`[groq] ${PRIMARY_MODEL} rate-limited — retrying with ${FALLBACK_MODEL}`);
    const messages = trimForFallback(params.messages ?? []);
    return groq.chat.completions.create({ model: FALLBACK_MODEL, ...params, messages });
  }
}
