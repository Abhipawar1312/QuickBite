import mongoose, { Document, Schema, Model } from "mongoose";

export type LedgerEntryType =
  | "base_delivery_fee"
  | "tip"
  | "surge_bonus"
  | "adjustment"
  | "cancellation_fee"
  | "payout";

export type LedgerDirection = "CREDIT" | "DEBIT";

export type LedgerStatus = "pending" | "cleared" | "reversed";

export interface ILedgerEntry extends Document {
  rider: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  amount: number; // Stored in INR rupees
  currency: string;
  status: LedgerStatus;
  sourceEvent: string;
  idempotencyKey: string;
  relatedLedgerEntry?: mongoose.Types.ObjectId;
  isReversed: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema = new Schema<ILedgerEntry>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: false,
      index: true,
    },
    entryType: {
      type: String,
      enum: [
        "base_delivery_fee",
        "tip",
        "surge_bonus",
        "adjustment",
        "cancellation_fee",
        "payout",
      ],
      required: true,
    },
    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      default: "CREDIT",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "cleared", "reversed"],
      default: "cleared",
    },
    sourceEvent: {
      type: String,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate ledger credits for the same order/event
      index: true,
    },
    relatedLedgerEntry: {
      type: Schema.Types.ObjectId,
      ref: "Ledger",
      required: false,
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound indexes for fast aggregations and ledger reconciliation
LedgerSchema.index({ rider: 1, createdAt: -1 });
LedgerSchema.index({ rider: 1, status: 1 });

export const Ledger: Model<ILedgerEntry> = mongoose.model<ILedgerEntry>(
  "Ledger",
  LedgerSchema
);
