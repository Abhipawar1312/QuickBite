/**
 * Idempotency Middleware for QuickBite
 *
 * Guarantees that mutating operations (such as checkout session creation, order placement,
 * or financial transfers) execute exactly once even if network timeouts, retries,
 * or duplicate clicks occur.
 *
 * Header: `Idempotency-Key` or `X-Idempotency-Key`
 * Storage: Redis with seamless high-speed in-memory fallback.
 */

import { Request, Response, NextFunction } from "express";
import { cache } from "../utils/cache";

interface IdempotentRecord {
  status: "processing" | "completed";
  statusCode?: number;
  body?: any;
  createdAt: number;
}

export const idempotency = (ttlSeconds: number = 86400) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply idempotency to mutating HTTP methods
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    const idempotencyKey =
      (req.headers["idempotency-key"] as string) ||
      (req.headers["x-idempotency-key"] as string);

    if (!idempotencyKey || idempotencyKey.trim() === "") {
      // If no idempotency key is provided, proceed normally without idempotency caching
      return next();
    }

    const userId = (req as any).id || "anonymous";
    const cacheKey = `idempotency:${userId}:${idempotencyKey.trim()}`;

    try {
      const existing = await cache.get<IdempotentRecord>(cacheKey);

      if (existing) {
        if (existing.status === "processing") {
          res.status(409).json({
            success: false,
            message: "A request with this Idempotency-Key is currently being processed. Please wait.",
          });
          return;
        }

        if (existing.status === "completed") {
          // Replay cached response
          res.setHeader("X-Idempotent-Replay", "true");
          res.status(existing.statusCode || 200).json(existing.body);
          return;
        }
      }

      // Mark operation as processing
      const processingRecord: IdempotentRecord = {
        status: "processing",
        createdAt: Date.now(),
      };
      await cache.set(cacheKey, processingRecord, 120); // 2 minute processing lock

      // Intercept response to store completed result
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        // Only cache successful or non-server-error responses
        if (res.statusCode < 500) {
          const completedRecord: IdempotentRecord = {
            status: "completed",
            statusCode: res.statusCode,
            body,
            createdAt: Date.now(),
          };
          cache.set(cacheKey, completedRecord, ttlSeconds).catch(() => {});
        } else {
          // In case of 5xx server error, remove lock to allow retry
          cache.del(cacheKey).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("[Idempotency] Middleware error:", err);
      next();
    }
  };
};
