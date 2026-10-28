/**
 * Order & Payment State Machine for QuickBite
 *
 * Enforces valid state transitions and protects against backward, illegal,
 * or concurrent state corruption across the food delivery lifecycle.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_riders"
  | "outfordelivery"
  | "delivered"
  | "Cancelled"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export type RiderWorkflowStatus = "pending" | "accepted" | "reached_restaurant" | "delivered";

/**
 * Valid directed graph of order state transitions.
 * Each state maps to an array of valid successor states.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "preparing", "Cancelled", "cancelled"],
  confirmed: ["preparing", "ready_for_riders", "Cancelled", "cancelled"],
  preparing: ["ready_for_riders", "outfordelivery", "Cancelled", "cancelled"],
  ready_for_riders: ["outfordelivery", "delivered", "Cancelled", "cancelled"],
  outfordelivery: ["delivered", "Cancelled", "cancelled"],
  delivered: [], // Terminal state: no further transitions permitted
  cancelled: [], // Terminal state
  Cancelled: [], // Terminal state
};

/**
 * Valid directed graph of payment status transitions.
 */
export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  paid: [], // Paid cannot regress to pending or failed (refunds handled via refundStatus)
  failed: ["pending"], // Retrying payment returns to pending
};

/**
 * Validates whether an order status transition is legal.
 */
export function canTransitionOrderStatus(currentStatus: string, targetStatus: string): boolean {
  if (currentStatus === targetStatus) return true;
  const normalizedCurrent = currentStatus.toLowerCase();
  const normalizedTarget = targetStatus.toLowerCase();

  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || ALLOWED_ORDER_TRANSITIONS[normalizedCurrent] || [];
  return allowed.some((status) => status.toLowerCase() === normalizedTarget);
}

/**
 * Validates whether a payment status transition is legal.
 */
export function canTransitionPaymentStatus(
  currentPaymentStatus: PaymentStatus,
  targetPaymentStatus: PaymentStatus
): boolean {
  if (currentPaymentStatus === targetPaymentStatus) return true;
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentPaymentStatus] || [];
  return allowed.includes(targetPaymentStatus);
}

/**
 * Validates rider delivery workflow transition.
 */
export function canTransitionRiderWorkflow(
  current: RiderWorkflowStatus = "pending",
  next: RiderWorkflowStatus
): boolean {
  if (current === next) return true;
  const workflowOrder: RiderWorkflowStatus[] = ["pending", "accepted", "reached_restaurant", "delivered"];
  const currentIndex = workflowOrder.indexOf(current);
  const nextIndex = workflowOrder.indexOf(next);

  // Must progress strictly forward
  return nextIndex > currentIndex;
}
