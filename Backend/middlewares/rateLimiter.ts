import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 2000,
    retryStrategy: () => null,
  });

  redisClient.connect()
    .then(() => {
      isRedisConnected = true;
      console.log("🛡️ Redis Rate Limiting & Brute-Force Shield active.");
    })
    .catch(() => {
      isRedisConnected = false;
    });

  redisClient.on("error", () => {
    isRedisConnected = false;
  });
} catch {
  isRedisConnected = false;
}

/**
 * Creates a Redis Token-Bucket / Sliding Window Rate Limiter Middleware
 * with seamless in-memory fallback.
 *
 * @param prefix Unique key prefix for this limiter
 * @param windowMs Window size in milliseconds
 * @param maxRequests Maximum allowed requests within the window
 * @param message Custom message on rate limit violation
 */
export const createRateLimiter = (
  prefix: string,
  windowMs: number,
  maxRequests: number,
  message: string = "Too many requests. Please try again later."
) => {
  const ipRequests = new Map<string, RateLimitRecord>();
  const windowSeconds = Math.ceil(windowMs / 1000);

  // Periodic cleanup of expired in-memory entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequests.entries()) {
      if (now > record.resetTime) {
        ipRequests.delete(ip);
      }
    }
  }, 60 * 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown-ip";

    // 1. Primary: Distributed Redis Token-Bucket Rate Limiter
    if (isRedisConnected && redisClient) {
      try {
        const key = `ratelimit:${prefix}:${clientIp}`;
        const count = await redisClient.incr(key);

        if (count === 1) {
          await redisClient.expire(key, windowSeconds);
        }

        const ttl = await redisClient.ttl(key);
        const remaining = Math.max(0, maxRequests - count);

        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", remaining);

        if (count > maxRequests) {
          const retryAfter = ttl > 0 ? ttl : windowSeconds;
          res.setHeader("Retry-After", retryAfter);
          res.status(429).json({
            success: false,
            message,
            retryAfterSeconds: retryAfter,
          });
          return;
        }

        return next();
      } catch (redisErr) {
        // Fall through to memory store on Redis error
      }
    }

    // 2. Fallback: High-Speed In-Memory Sliding Window Limiter
    const now = Date.now();
    const record = ipRequests.get(clientIp);

    if (!record || now > record.resetTime) {
      ipRequests.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
      return;
    }

    record.count += 1;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    next();
  };
};

// Specialized Rate Limiters & Brute-Force Shields

// 1. Auth Shield: 10 attempts per 15 minutes (Protects against brute-force login & signup spam)
export const authLimiter = createRateLimiter(
  "auth",
  15 * 60 * 1000,
  10,
  "Too many authentication attempts. For security, please wait 15 minutes before trying again."
);

// 2. OTP Shield: 5 attempts per 10 minutes (Protects OTP generation and verification)
export const otpLimiter = createRateLimiter(
  "otp",
  10 * 60 * 1000,
  5,
  "Too many OTP verification attempts. Please wait 10 minutes."
);

// 3. Checkout / Payment Shield: 15 requests per minute (Prevents payment race conditions & spam)
export const checkoutLimiter = createRateLimiter(
  "checkout",
  60 * 1000,
  15,
  "Checkout request limit exceeded. Please wait a moment before proceeding."
);

// 4. General API Limiter: 200 requests per minute
export const generalApiLimiter = createRateLimiter(
  "general",
  60 * 1000,
  200,
  "High traffic detected. Please slow down your requests."
);

