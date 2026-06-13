// Vendored from cubiczan-resilience (typescript/src). No npm registry available,
// so the primitives are copied here verbatim. Keep imports working via the
// barrel below. Source of truth: cubiczan-resilience/typescript/src.
export { safeFetch } from "./safeFetch.js";
export type { SafeFetchOptions, AllowlistHook } from "./safeFetch.js";
export { requireAuth, requireAuthResponse } from "./auth.js";
export type { AuthResult, RequireAuthOptions } from "./auth.js";
export { SlidingWindowRateLimiter } from "./rateLimit.js";
export type { RateLimitOptions, RateLimitResult } from "./rateLimit.js";
export { ResilienceError, isResilienceError } from "./errors.js";
export type { ResilienceErrorKind } from "./errors.js";
