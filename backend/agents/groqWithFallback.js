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
    if (i === messages.length - 1 && msg.role === 'user' && msg.content.length > budget) {
      console.warn(`[groq] Trimming fallback user message from ${msg.content.length} to ${budget} chars to fit TPM limit`);
      return { ...msg, content: msg.content.slice(0, budget) };
    }
    return msg;
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
