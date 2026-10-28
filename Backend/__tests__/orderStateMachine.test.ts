import {
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  canTransitionRiderWorkflow,
} from "../utils/orderStateMachine";

export function runOrderStateMachineTests() {
  console.log("\n🧪 Running Topic 5 & 11: Order & Payment State Machine Tests...");

  // Test 1: Legal Order Status Forward Transitions
  console.assert(canTransitionOrderStatus("pending", "confirmed") === true, "pending -> confirmed is legal");
  console.assert(canTransitionOrderStatus("confirmed", "preparing") === true, "confirmed -> preparing is legal");
  console.assert(canTransitionOrderStatus("preparing", "ready_for_riders") === true, "preparing -> ready_for_riders is legal");
  console.assert(canTransitionOrderStatus("ready_for_riders", "outfordelivery") === true, "ready_for_riders -> outfordelivery is legal");
  console.assert(canTransitionOrderStatus("outfordelivery", "delivered") === true, "outfordelivery -> delivered is legal");
  console.assert(canTransitionOrderStatus("pending", "cancelled") === true, "pending -> cancelled is legal");
  console.assert(canTransitionOrderStatus("preparing", "cancelled") === true, "preparing -> cancelled is legal");
  console.log("  ✅ Legal order forward transitions verified");

  // Test 2: Illegal Order Backward Transitions (Regression protection)
  console.assert(canTransitionOrderStatus("delivered", "pending") === false, "delivered CANNOT regress to pending");
  console.assert(canTransitionOrderStatus("delivered", "preparing") === false, "delivered CANNOT regress to preparing");
  console.assert(canTransitionOrderStatus("cancelled", "outfordelivery") === false, "cancelled CANNOT transition to outfordelivery");
  console.assert(canTransitionOrderStatus("outfordelivery", "confirmed") === false, "outfordelivery CANNOT regress to confirmed");
  console.log("  ✅ Illegal backward order transitions successfully blocked");

  // Test 3: Payment State Machine
  console.assert(canTransitionPaymentStatus("pending", "paid") === true, "pending -> paid is legal");
  console.assert(canTransitionPaymentStatus("pending", "failed") === true, "pending -> failed is legal");
  console.assert(canTransitionPaymentStatus("failed", "pending") === true, "failed -> pending (retry) is legal");
  console.assert(canTransitionPaymentStatus("paid", "pending") === false, "paid CANNOT regress to pending");
  console.assert(canTransitionPaymentStatus("paid", "failed") === false, "paid CANNOT regress to failed");
  console.log("  ✅ Payment status transitions verified (paid is irreversible terminal payment state)");

  // Test 4: Rider Delivery Workflow Sequence
  console.assert(canTransitionRiderWorkflow("pending", "accepted") === true, "pending -> accepted is valid");
  console.assert(canTransitionRiderWorkflow("accepted", "reached_restaurant") === true, "accepted -> reached_restaurant is valid");
  console.assert(canTransitionRiderWorkflow("reached_restaurant", "delivered") === true, "reached_restaurant -> delivered is valid");
  console.assert(canTransitionRiderWorkflow("delivered", "accepted") === false, "delivered CANNOT regress to accepted");
  console.log("  ✅ Rider delivery workflow sequence verified");
}
