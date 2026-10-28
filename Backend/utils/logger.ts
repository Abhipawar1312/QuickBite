/**
 * Structured Logger & Request Correlation Engine for QuickBite
 *
 * Implements:
 * 1. JSON-formatted structured logging with log levels (DEBUG, INFO, WARN, ERROR).
 * 2. Request Correlation ID generation and header propagation (`X-Correlation-ID`).
 * 3. Execution duration timing for database queries, routing, and dispatching.
 * 4. Automatic masking of sensitive fields (passwords, tokens, PINs, card numbers).
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "deliverypin",
  "card",
  "cvv",
  "stripesecretkey",
]);

/**
 * Recursively masks sensitive fields in metadata objects.
 */
export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
    correlationId?: string
  ): string {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: correlationId || "system",
      message,
      ...(meta ? { metadata: maskSensitiveData(meta) } : {}),
    };
    return JSON.stringify(logObject);
  }

  public debug(message: string, meta?: Record<string, any>, correlationId?: string): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("DEBUG", message, meta, correlationId));
    }
  }

  public info(message: string, meta?: Record<string, any>, correlationId?: string): void {
    console.log(this.formatLog("INFO", message, meta, correlationId));
  }

  public warn(message: string, meta?: Record<string, any>, correlationId?: string): void {
    console.warn(this.formatLog("WARN", message, meta, correlationId));
  }

  public error(
    message: string,
    error?: Error | any,
    meta?: Record<string, any>,
    correlationId?: string
  ): void {
    const errorDetails = error
      ? {
          errorMessage: error.message || String(error),
          stack: error.stack,
          name: error.name,
        }
      : {};

    console.error(
      this.formatLog("ERROR", message, { ...errorDetails, ...meta }, correlationId)
    );
  }
}

export const logger = new Logger();

/**
 * Correlation ID Middleware:
 * Extracts `X-Correlation-ID` from incoming request headers or generates a new UUID.
 * Attaches correlationId to `req.correlationId` and adds it to the response headers.
 */
export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || crypto.randomUUID();

  (req as any).correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const durationMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);

    // Skip static asset noise
    if (!req.originalUrl.startsWith("/Frontend")) {
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${durationMs}ms)`, {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs),
      }, correlationId);
    }
  });

  next();
};
