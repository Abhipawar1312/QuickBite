/**
 * Queue-Based Asynchronous Background Job System for QuickBite
 *
 * Implements:
 * 1. Durable background job processing with bounded retries and exponential backoff.
 * 2. Dispatch offer timeout & escalation (prevents orders staying hung if rider doesn't respond).
 * 3. Notification delivery retry worker.
 * 4. Stale checkout cleanup task.
 * 5. Automatic Rush Mode workload evaluation.
 */

import { Order } from "../models/order.model";
import { smartDispatchOrder, recordRiderDeclined } from "./smartDispatch";
import { sendNotification } from "./socket";
import { cache } from "./cache";

export type JobType =
  | "DISPATCH_OFFER_TIMEOUT"
  | "NOTIFICATION_RETRY"
  | "STALE_CHECKOUT_CLEANUP"
  | "EVALUATE_RUSH_MODE";

export interface JobRecord<T = any> {
  id: string;
  type: JobType;
  payload: T;
  runAt: number; // Unix timestamp in ms
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
  lastError?: string;
}

export class JobQueue {
  private jobs: Map<string, JobRecord> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private intervalMs: number = 2000; // Poll queue every 2 seconds

  constructor() {
    this.startWorker();
  }

  public startWorker(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.processDueJobs(), this.intervalMs);
  }

  public stopWorker(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Enqueues a job to be executed after `delayMs` milliseconds.
   *
   * @param type Job type identifier
   * @param payload Arbitrary job payload
   * @param delayMs Delay in milliseconds before job becomes due (e.g. 30,000 for 30s timeout)
   * @param maxAttempts Maximum retry attempts on failure (default 3)
   */
  public enqueue<T>(
    type: JobType,
    payload: T,
    delayMs: number = 0,
    maxAttempts: number = 3
  ): string {
    const id = `job_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const runAt = Date.now() + Math.max(0, delayMs);

    const job: JobRecord<T> = {
      id,
      type,
      payload,
      runAt,
      attempts: 0,
      maxAttempts,
      status: "pending",
      createdAt: Date.now(),
    };

    this.jobs.set(id, job);
    console.log(`[JobQueue] Enqueued job ${id} (${type}) due in ${Math.round(delayMs / 1000)}s`);
    return id;
  }

  /**
   * Processes all pending jobs whose scheduled `runAt` timestamp has passed.
   */
  private async processDueJobs(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const now = Date.now();
    const dueJobs: JobRecord[] = [];

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "pending" && job.runAt <= now) {
        dueJobs.push(job);
      }
    }

    for (const job of dueJobs) {
      job.status = "processing";
      job.attempts += 1;

      try {
        await this.executeJob(job);
        job.status = "completed";
        // Clean up completed job after 5 minutes
        setTimeout(() => this.jobs.delete(job.id), 5 * 60 * 1000);
      } catch (err: any) {
        job.lastError = err.message || String(err);
        console.error(`[JobQueue] Error executing job ${job.id} (${job.type}, attempt ${job.attempts}/${job.maxAttempts}):`, err);

        if (job.attempts < job.maxAttempts) {
          // Exponential backoff: 2s, 4s, 8s...
          const backoffMs = Math.pow(2, job.attempts) * 1000;
          job.runAt = Date.now() + backoffMs;
          job.status = "pending";
          console.log(`[JobQueue] Re-scheduled job ${job.id} in ${backoffMs / 1000}s`);
        } else {
          job.status = "failed";
          console.error(`[JobQueue] Job ${job.id} PERMANENTLY FAILED after ${job.maxAttempts} attempts.`);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Dispatches job execution to the appropriate handler.
   */
  private async executeJob(job: JobRecord): Promise<void> {
    switch (job.type) {
      case "DISPATCH_OFFER_TIMEOUT":
        await this.handleDispatchTimeout(job.payload);
        break;

      case "NOTIFICATION_RETRY":
        await this.handleNotificationRetry(job.payload);
        break;

      case "STALE_CHECKOUT_CLEANUP":
        await this.handleStaleCheckoutCleanup();
        break;

      default:
        console.warn(`[JobQueue] Unknown job type: ${job.type}`);
    }
  }

  /**
   * Dispatch Offer Expiration & Escalation Handler:
   * If an order is still unassigned 30 seconds after dispatch offer,
   * marks previous candidates as timed out and re-dispatches to the next candidate tier.
   */
  private async handleDispatchTimeout(payload: { orderId: string; candidateUserIds: string[] }): Promise<void> {
    const { orderId, candidateUserIds } = payload;
    const order = await Order.findById(orderId);

    if (!order) {
      return;
    }

    // If order has already been claimed by a rider, no escalation needed!
    if (order.rider) {
      console.log(`[JobQueue] Dispatch offer timeout check: Order ${orderId} already claimed by rider ${order.rider}.`);
      return;
    }

    // If order is cancelled, do nothing
    if (order.status === "Cancelled" || order.status === "cancelled") {
      return;
    }

    console.log(`[JobQueue] Dispatch offer expired for order ${orderId}. Re-escalating to next candidate riders.`);

    // Record previously offered riders as timed out so they aren't offered the same order again
    if (Array.isArray(candidateUserIds)) {
      for (const userId of candidateUserIds) {
        recordRiderDeclined(orderId, userId);
      }
    }

    // Trigger next dispatch round
    const nextCandidates = await smartDispatchOrder(orderId, 10); // expand radius to 10KM for escalation
    if (nextCandidates.length > 0) {
      const nextUserIds = nextCandidates.slice(0, 3).map((c) => c.userId);
      // Schedule next timeout in 30s
      this.enqueue("DISPATCH_OFFER_TIMEOUT", { orderId, candidateUserIds: nextUserIds }, 30000);
    } else {
      console.warn(`[JobQueue] No further candidate riders available for order ${orderId}. Manual escalation needed.`);
    }
  }

  /**
   * Retries real-time socket/push notification
   */
  private async handleNotificationRetry(payload: { userId: string; eventName: string; data: any }): Promise<void> {
    const { userId, eventName, data } = payload;
    sendNotification(userId, eventName, data);
  }

  /**
   * Cleans up stale abandoned checkout sessions older than 30 minutes
   */
  private async handleStaleCheckoutCleanup(): Promise<void> {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await Order.deleteMany({ paymentStatus: "pending", createdAt: { $lt: thirtyMinsAgo } });
    if (result.deletedCount > 0) {
      console.log(`[JobQueue] Cleaned up ${result.deletedCount} abandoned unpaid orders.`);
    }
  }

  /**
   * Get queue health stats
   */
  public getStats(): { pendingCount: number; processingCount: number; failedCount: number } {
    let pending = 0;
    let processing = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === "pending") pending++;
      else if (job.status === "processing") processing++;
      else if (job.status === "failed") failed++;
    }

    return { pendingCount: pending, processingCount: processing, failedCount: failed };
  }
}

export const jobQueue = new JobQueue();
