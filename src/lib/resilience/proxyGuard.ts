import { NextRequest, NextResponse } from "next/server";
import { SlidingWindowRateLimiter } from "./rateLimit.js";

/**
 * Shared guard for the MetaComp proxy routes. Enforces a caller-secret header
 * (fail-closed) plus IP-based sliding-window rate limiting so anonymous clients
 * cannot exhaust the upstream API quota.
 *
 * The expected secret comes from PROXY_API_SECRET. If it is unset the guard
 * FAILS CLOSED (503) — it never degrades to allowing the request.
 */
const PROXY_SECRET = process.env.PROXY_API_SECRET ?? "";

// One shared limiter across all proxy routes (single-process). 30 req / 60s per IP.
const limiter = new SlidingWindowRateLimiter({ limit: 30, windowMs: 60_000 });

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns a NextResponse to send when the request is rejected, or `null` when
 * the caller is authorized and within rate limits.
 */
export function guardProxyRequest(request: NextRequest): NextResponse | null {
  // Fail closed: no configured secret => refuse, never allow.
  if (!PROXY_SECRET) {
    return NextResponse.json(
      { error: "Server misconfigured: proxy secret is not set" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-proxy-secret");
  if (!provided || provided !== PROXY_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = limiter.check(clientIp(request));
  if (!result.allowed) {
    const retryAfter = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "retry-after": String(retryAfter) } }
    );
  }

  return null;
}
