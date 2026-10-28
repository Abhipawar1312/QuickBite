import {
  isRestaurantCurrentlyOpen,
  formatTimeTo12Hr,
  isValidTimeString,
  evaluateRushModeHysteresis,
} from "../utils/operatingHours";

export function runOperatingHoursTests() {
  console.log("\n🧪 Running Topic 10: Operating Hours & Rush Mode Hysteresis Tests...");

  // Test 1: Time string validation
  console.assert(isValidTimeString("09:00") === true, "09:00 is valid");
  console.assert(isValidTimeString("23:59") === true, "23:59 is valid");
  console.assert(isValidTimeString("24:00") === false, "24:00 is invalid");
  console.assert(isValidTimeString("9:00") === false, "Single digit hour is invalid");
  console.assert(isValidTimeString("invalid") === false, "Non-time string is invalid");
  console.log("  ✅ Time string validation passed");

  // Test 2: 12-hour format conversion
  console.assert(formatTimeTo12Hr("09:30") === "09:30 AM", "09:30 => 09:30 AM");
  console.assert(formatTimeTo12Hr("13:15") === "01:15 PM", "13:15 => 01:15 PM");
  console.assert(formatTimeTo12Hr("00:00") === "12:00 AM", "00:00 => 12:00 AM");
  console.assert(formatTimeTo12Hr("12:00") === "12:00 PM", "12:00 => 12:00 PM");
  console.log("  ✅ 12-hour time format conversion passed");

  // Test 3: Manual merchant closure
  const closedByMerchant = isRestaurantCurrentlyOpen({ isOpen: false });
  console.assert(closedByMerchant.isOpen === false, "When isOpen: false, restaurant must be closed");
  console.assert(closedByMerchant.reason === "Closed by merchant", "Must return 'Closed by merchant'");
  console.log("  ✅ Manual closure override verified");

  // Test 4: Automatic Rush Mode with Hysteresis (prevents flapping)
  // Low watermark = 4, High watermark = 8

  // Case A: Below high watermark (6 active orders) -> Should NOT trigger Rush Mode yet
  const eval1 = evaluateRushModeHysteresis(false, 6, 8, 4);
  console.assert(eval1.isBusy === false, "6 orders should not trigger rush mode (threshold: 8)");
  console.assert(eval1.stateChanged === false, "State should remain unchanged");

  // Case B: Exceeds high watermark (9 active orders) -> Triggers Rush Mode
  const eval2 = evaluateRushModeHysteresis(false, 9, 8, 4);
  console.assert(eval2.isBusy === true, "9 orders must activate rush mode (>= 8)");
  console.assert(eval2.stateChanged === true, "State must change to busy");

  // Case C: Hysteresis Window: Orders drop from 9 to 6 -> Should REMAIN in Rush Mode!
  const eval3 = evaluateRushModeHysteresis(true, 6, 8, 4);
  console.assert(eval3.isBusy === true, "In hysteresis zone (6 orders), rush mode must remain ACTIVE to prevent flapping");
  console.assert(eval3.stateChanged === false, "State should remain busy");

  // Case D: Orders drop to low watermark (3 orders) -> Exits Rush Mode
  const eval4 = evaluateRushModeHysteresis(true, 3, 8, 4);
  console.assert(eval4.isBusy === false, "When orders drop to <= 4, rush mode must deactivate");
  console.assert(eval4.stateChanged === true, "State must change to not busy");

  console.log("  ✅ Rush Mode Hysteresis algorithm verified (prevents rapid flapping)");
}
