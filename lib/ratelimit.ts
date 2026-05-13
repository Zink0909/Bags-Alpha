const store = new Map<string, { count: number; resetAt: number }>();
const MAX_SIZE = 5000;

let lastCleanup = 0;

function cleanup() {
  const now = Date.now();
  if (store.size < MAX_SIZE && now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export function rateLimitResponse() {
  return Response.json(
    { success: false, error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
