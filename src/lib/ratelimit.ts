type Stamp = number;

const store = new Map<string, Stamp[]>();

export function limit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const arr = store.get(key)?.filter((t) => t > windowStart) ?? [];
  arr.push(now);
  store.set(key, arr);
  return arr.length <= max;
}

export function keyFromReq(req: Request, fallback: string) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return ip || fallback;
}

/**
 * Rate limit pour les routes admin (30 requêtes par minute)
 */
export function adminRateLimit(key: string, limitCount: number = 30, windowMs: number = 60000) {
  return limit(key, limitCount, windowMs);
}


