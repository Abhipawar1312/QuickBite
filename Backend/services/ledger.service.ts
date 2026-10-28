/**
 * Courier Financial Ledger & Reconciliation Service for QuickBite
 *
 * Implements:
 * 1. Double-entry financial audit records for courier compensation.
 * 2. Idempotent ledger entry creation (prevents duplicate earnings credits).
 * 3. Daily / Weekly aggregation pipeline for rider dashboards.
 * 4. Reconciliation engine between authoritative Order documents and Ledger entries.
 */

import mongoose from "mongoose";
import { Ledger, ILedgerEntry } from "../models/ledger.model";
import { Order } from "../models/order.model";

export interface RiderEarningsSummary {
  today: number;
  week: number;
  total: number;
  todayTips: number;
  weekTips: number;
  totalTips: number;
  tripsToday: number;
  tripsWeek: number;
  tripsTotal: number;
}

export interface ReconciliationResult {
  riderId: string;
  totalDeliveredOrders: number;
  totalLedgerEntries: number;
  orderTotalEarnings: number;
  ledgerTotalEarnings: number;
  discrepancyAmount: number;
  isBalanced: boolean;
  missingOrdersBackfilled: string[];
}

export class LedgerService {
  /**
   * Records courier earnings upon delivery completion.
   * Guarantees idempotency via unique database index on `idempotencyKey`.
   */
  public async recordOrderDeliveryEarnings(
    orderId: string,
    riderUserId: string
  ): Promise<ILedgerEntry[]> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found for ledger recording`);
    }

    const createdEntries: ILedgerEntry[] = [];
    const baseFee = order.deliveryFee || 25;
    const tipAmount = order.tipAmount || 0;

    // 1. Record Base Delivery Fee Credit
    const baseFeeKey = `ledger:base_fee:${orderId}:${riderUserId}`;
    try {
      const baseEntry = await Ledger.create({
        rider: new mongoose.Types.ObjectId(riderUserId),
        order: order._id,
        entryType: "base_delivery_fee",
        direction: "CREDIT",
        amount: baseFee,
        currency: "INR",
        status: "cleared",
        sourceEvent: "delivery_completed",
        idempotencyKey: baseFeeKey,
        description: `Base delivery earnings for Order #${orderId.substring(orderId.length - 6)} (${order.distanceKM || 2.5} KM)`,
      });
      createdEntries.push(baseEntry);
    } catch (err: any) {
      if (err.code === 11000) {
        console.log(`[Ledger] Base fee already credited for order ${orderId} (idempotent duplicate skipped).`);
      } else {
        throw err;
      }
    }

    // 2. Record Customer Tip Credit (100% pass-through to delivery courier)
    if (tipAmount > 0) {
      const tipKey = `ledger:tip:${orderId}:${riderUserId}`;
      try {
        const tipEntry = await Ledger.create({
          rider: new mongoose.Types.ObjectId(riderUserId),
          order: order._id,
          entryType: "tip",
          direction: "CREDIT",
          amount: tipAmount,
          currency: "INR",
          status: "cleared",
          sourceEvent: "tip_added",
          idempotencyKey: tipKey,
          description: `Customer tip for Order #${orderId.substring(orderId.length - 6)}`,
        });
        createdEntries.push(tipEntry);
      } catch (err: any) {
        if (err.code === 11000) {
          console.log(`[Ledger] Tip already credited for order ${orderId} (idempotent duplicate skipped).`);
        } else {
          throw err;
        }
      }
    }

    return createdEntries;
  }

  /**
   * Retrieves aggregated courier earnings from authoritative financial ledger using MongoDB aggregation.
   */
  public async getRiderEarningsSummary(riderUserId: string): Promise<RiderEarningsSummary> {
    const riderObjId = new mongoose.Types.ObjectId(riderUserId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const aggregateResult = await Ledger.aggregate([
      {
        $match: {
          rider: riderObjId,
          status: "cleared",
          direction: "CREDIT",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$amount" },
          totalTips: {
            $sum: {
              $cond: [{ $eq: ["$entryType", "tip"] }, "$amount", 0],
            },
          },
          todayEarnings: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfToday] }, "$amount", 0],
            },
          },
          todayTips: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", startOfToday] },
                    { $eq: ["$entryType", "tip"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          weekEarnings: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", startOfWeek] }, "$amount", 0],
            },
          },
          weekTips: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$createdAt", startOfWeek] },
                    { $eq: ["$entryType", "tip"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]);

    // Trip counts from completed orders
    const tripsTotal = await Order.countDocuments({ rider: riderUserId, status: "delivered" });
    const tripsToday = await Order.countDocuments({
      rider: riderUserId,
      status: "delivered",
      updatedAt: { $gte: startOfToday },
    });
    const tripsWeek = await Order.countDocuments({
      rider: riderUserId,
      status: "delivered",
      updatedAt: { $gte: startOfWeek },
    });

    const summary = aggregateResult[0] || {};

    return {
      today: summary.todayEarnings || 0,
      week: summary.weekEarnings || 0,
      total: summary.totalEarnings || 0,
      todayTips: summary.todayTips || 0,
      weekTips: summary.weekTips || 0,
      totalTips: summary.totalTips || 0,
      tripsToday,
      tripsWeek,
      tripsTotal,
    };
  }

  /**
   * Reconciles authoritative Order documents against Ledger records.
   * Identifies any missing or mismatched entries and backfills them automatically.
   */
  public async reconcileRiderEarnings(riderUserId: string): Promise<ReconciliationResult> {
    const deliveredOrders = await Order.find({ rider: riderUserId, status: "delivered" });
    const ledgerEntries = await Ledger.find({ rider: riderUserId, status: "cleared" });

    let orderTotalEarnings = 0;
    const missingOrdersBackfilled: string[] = [];

    for (const order of deliveredOrders) {
      const orderIdStr = (order._id as any).toString();
      const expectedEarnings = (order.deliveryFee || 25) + (order.tipAmount || 0);
      orderTotalEarnings += expectedEarnings;

      // Verify if ledger entry exists for this order
      const hasBaseFee = ledgerEntries.some(
        (e) => e.order?.toString() === orderIdStr && e.entryType === "base_delivery_fee"
      );

      if (!hasBaseFee) {
        // Automatically reconcile by recording missing ledger entries
        await this.recordOrderDeliveryEarnings(orderIdStr, riderUserId);
        missingOrdersBackfilled.push(orderIdStr);
      }
    }

    const refreshedLedgerEntries = await Ledger.find({ rider: riderUserId, status: "cleared" });
    const ledgerTotalEarnings = refreshedLedgerEntries
      .filter((e) => e.direction === "CREDIT")
      .reduce((sum, e) => sum + e.amount, 0);

    const discrepancyAmount = Math.abs(orderTotalEarnings - ledgerTotalEarnings);

    return {
      riderId: riderUserId,
      totalDeliveredOrders: deliveredOrders.length,
      totalLedgerEntries: refreshedLedgerEntries.length,
      orderTotalEarnings,
      ledgerTotalEarnings,
      discrepancyAmount,
      isBalanced: discrepancyAmount === 0,
      missingOrdersBackfilled,
    };
  }
}

export const ledgerService = new LedgerService();
