import Groq from 'groq-sdk';

const PRIMARY_MODEL  = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

export async function groqComplete(params) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    return await groq.chat.completions.create({ model: PRIMARY_MODEL, ...params });
  } catch (err) {
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (status !== 429) throw err;
    console.warn(`[groq] ${PRIMARY_MODEL} rate-limited — retrying with ${FALLBACK_MODEL}`);
    return groq.chat.completions.create({ model: FALLBACK_MODEL, ...params });
  }
}
