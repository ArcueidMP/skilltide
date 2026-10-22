/**
 * A sliding-window limit held in one Worker instance's memory. Cloudflare runs many instances, so it
 * caps bursts from one client rather than global totals. The hard stop for spending is the monthly
 * budget set in OpenAI's dashboard.
 */
export class WindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    const allowed = recent.length < this.limit;
    if (allowed) recent.push(now);
    // Bound memory: an instance that has seen this many clients simply starts over.
    if (this.hits.size >= 10_000 && !this.hits.has(key)) this.hits.clear();
    this.hits.set(key, recent);
    return allowed;
  }
}
