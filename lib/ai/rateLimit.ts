import { RateLimitResult } from "./types";

export type { RateLimitResult };

// In-memory store: Map<identifier, timestamp[]>
const rateLimitStore = new Map<string, number[]>();

/**
 * Check if an identifier (IP or wallet) has exceeded rate limit.
 * Implements sliding window rate limiting.
 */
export function checkRateLimit(
  identifier: string,
  limitPerMinute?: number,
  windowMs: number = 60_000
): RateLimitResult {
  const envLimit = process.env.AI_RATE_LIMIT_PER_MINUTE
    ? parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE, 10)
    : NaN;
  const limit = limitPerMinute ?? (!isNaN(envLimit) && envLimit > 0 ? envLimit : 10);
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = rateLimitStore.get(identifier) || [];
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetMs = Math.max(1, oldest + windowMs - now);
    rateLimitStore.set(identifier, validTimestamps);
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(identifier, validTimestamps);

  const resetMs = Math.max(1, validTimestamps[0] + windowMs - now);
  const remaining = Math.max(0, limit - validTimestamps.length);

  // Periodic cleanup if store grows large
  if (rateLimitStore.size > 2000) {
    pruneStaleRateLimits(now, windowMs);
  }

  return {
    success: true,
    limit,
    remaining,
    resetMs,
  };
}

/**
 * Remove entries with no active timestamps in the window.
 */
function pruneStaleRateLimits(now: number, windowMs: number): void {
  const windowStart = now - windowMs;
  rateLimitStore.forEach((timestamps: number[], id: string) => {
    const fresh = timestamps.filter((ts: number) => ts > windowStart);
    if (fresh.length === 0) {
      rateLimitStore.delete(id);
    } else {
      rateLimitStore.set(id, fresh);
    }
  });
}

/**
 * Extract client IP from standard request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    if (parts.length > 0 && parts[0].trim()) {
      return parts[0].trim();
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Composite check across IP and optional wallet address.
 * If either exceeds the limit, returns the exceeded result.
 */
export function checkRequestRateLimit(
  req: Request,
  walletAddress?: string,
  limitPerMinute?: number
): RateLimitResult {
  const ip = getClientIp(req);
  const ipResult = checkRateLimit(`ip:${ip}`, limitPerMinute);
  if (!ipResult.success) {
    return ipResult;
  }

  if (walletAddress && walletAddress.trim()) {
    const walletResult = checkRateLimit(`wallet:${walletAddress.trim()}`, limitPerMinute);
    if (!walletResult.success) {
      return walletResult;
    }
    // Return result with minimum remaining
    return ipResult.remaining < walletResult.remaining ? ipResult : walletResult;
  }

  return ipResult;
}

/**
 * Creates standard HTTP 429 response with Retry-After and rate limit headers.
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.max(1, Math.ceil(result.resetMs / 1000));
  const headers = new Headers({
    "Content-Type": "application/json",
    "Retry-After": String(retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetMs) / 1000)),
  });

  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please wait before retrying.",
      retryAfter: retryAfterSec,
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Reset all rate limits (for testing purposes).
 */
export function _resetRateLimits(): void {
  rateLimitStore.clear();
}
