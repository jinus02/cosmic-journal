// Round-robin Gemini key pool with quota fallback.
// Reads GEMINI_API_KEY_1..GEMINI_API_KEY_20 from process.env.
// Server-only module — never import from client components.

const MAX_KEYS = 20;

function loadKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= MAX_KEYS; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k && k.trim().length > 0) keys.push(k.trim());
  }
  return keys;
}

const KEYS = loadKeys();
let cursor = 0;

export function nextKey(): string {
  if (KEYS.length === 0) {
    throw new Error("No GEMINI_API_KEY_* configured in environment");
  }
  const key = KEYS[cursor % KEYS.length];
  cursor = (cursor + 1) % KEYS.length;
  return key;
}

export function totalKeys(): number {
  return KEYS.length;
}

// Try the operation with each key in turn. On 429 / 503 / quota, rotate.
export async function withKeyFallback<T>(op: (key: string) => Promise<T>): Promise<T> {
  if (KEYS.length === 0) throw new Error("No GEMINI_API_KEY_* configured");

  let lastErr: unknown;
  for (let attempt = 0; attempt < KEYS.length; attempt++) {
    const key = nextKey();
    try {
      return await op(key);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retriable = /429|503|quota|exhaust|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(msg);
      if (!retriable) throw err;
      // backoff between key swaps: 0s, 1s, 2s
      if (attempt < KEYS.length - 1) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All Gemini keys exhausted");
}
