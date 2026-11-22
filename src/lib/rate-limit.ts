/**
 * Process-local sliding-window rate limiter.
 *
 * This protects the public inquiry endpoint against accidental double
 * submissions and low-volume abuse without introducing a paid dependency.
 * For multi-instance deployments, replace with an Appwrite Function or a
 * shared store — the interface below stays the same.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 6;
const MAX_BUCKETS = 5000;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { max = MAX_HITS, windowMs = WINDOW_MS }: { max?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.hits.every((hit) => now - hit > windowMs)) {
        buckets.delete(bucketKey);
      }
    }
  }

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((hit) => now - hit < windowMs);

  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientKey(request: Request): string {
  const forwarded =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwarded || "unknown";
}
