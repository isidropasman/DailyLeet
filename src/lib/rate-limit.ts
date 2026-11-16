// Best-effort, per-instance fixed window. Fluid compute reuses instances across many
// requests, so this stops a single client hammering an instance without new infra; it is
// not a global limit (that belongs in a Vercel Firewall rate-limit rule, see docs).
export type Limit = { key: string; max: number; windowMs: number };
export type LimitDecision = { ok: true } | { ok: false; retryAfterSeconds: number };

const MAX_KEYS = 50_000;

export function createLimiter(now: () => number = Date.now) {
  const windows = new Map<string, { count: number; resetAt: number }>();
  function prune(at: number) {
    for (const [key, window] of windows) if (window.resetAt <= at) windows.delete(key);
    // Under a key-spraying attack expired entries may not free enough; dropping state
    // only makes the limiter more permissive, never blocks legit users.
    if (windows.size > MAX_KEYS) windows.clear();
  }
  return function check(limits: Limit[]): LimitDecision {
    const at = now();
    if (windows.size > MAX_KEYS) prune(at);
    for (const limit of limits) {
      const window = windows.get(limit.key);
      if (window && window.resetAt > at && window.count >= limit.max) return { ok: false, retryAfterSeconds: Math.ceil((window.resetAt - at) / 1000) };
    }
    for (const limit of limits) {
      const window = windows.get(limit.key);
      if (!window || window.resetAt <= at) windows.set(limit.key, { count: 1, resetAt: at + limit.windowMs });
      else window.count += 1;
    }
    return { ok: true };
  };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
