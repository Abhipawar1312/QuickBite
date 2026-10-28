/**
 * Restaurant Operating Hours & Rush Mode Engine for QuickBite
 *
 * Implements:
 * 1. 24-hour and 12-hour time conversion.
 * 2. Timezone-aware operating window evaluation (default Asia/Kolkata).
 * 3. Normal same-day operating hours (e.g. 09:00 - 23:00).
 * 4. Overnight operating schedules (e.g. 19:00 - 03:00 next day).
 * 5. Time string validation and defensive edge-case handling.
 * 6. Workload-based Automatic Rush Mode evaluation with Hysteresis.
 */

export function isValidTimeString(time?: string): boolean {
  if (!time || typeof time !== "string") return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim());
}

export function formatTimeTo12Hr(time24?: string): string {
  if (!time24) return "";
  const parts = time24.trim().split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
}

export interface OperatingHoursCheckResult {
  isOpen: boolean;
  reason?: string;
  currentTimeStr?: string;
}

/**
 * Checks whether a restaurant is currently open based on manual toggle
 * and scheduled operating hours in the specified timezone.
 */
export function isRestaurantCurrentlyOpen(
  restaurant: {
    isOpen?: boolean;
    operatingHours?: { openTime?: string; closeTime?: string };
  },
  timeZone: string = "Asia/Kolkata"
): OperatingHoursCheckResult {
  if (restaurant.isOpen === false) {
    return { isOpen: false, reason: "Closed by merchant" };
  }

  const { openTime, closeTime } = restaurant.operatingHours || {};

  if (openTime && closeTime && isValidTimeString(openTime) && isValidTimeString(closeTime)) {
    const now = new Date();
    let currentTimeStr: string;

    try {
      currentTimeStr = now.toLocaleTimeString("en-GB", {
        timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      // Fallback to local time if timezone string is invalid
      currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    const cleanOpen = openTime.trim();
    const cleanClose = closeTime.trim();

    // Case 1: Normal operating hours within same day (e.g. 09:00 to 23:00)
    if (cleanOpen <= cleanClose) {
      if (currentTimeStr < cleanOpen || currentTimeStr >= cleanClose) {
        return {
          isOpen: false,
          currentTimeStr,
          reason: `Operating hours are ${formatTimeTo12Hr(cleanOpen)} – ${formatTimeTo12Hr(cleanClose)}`,
        };
      }
    } else {
      // Case 2: Overnight operating hours (e.g. 19:00 to 03:00 next day)
      // Open if time >= 19:00 OR time < 03:00
      // Closed if time < 19:00 AND time >= 03:00
      if (currentTimeStr < cleanOpen && currentTimeStr >= cleanClose) {
        return {
          isOpen: false,
          currentTimeStr,
          reason: `Operating hours are ${formatTimeTo12Hr(cleanOpen)} – ${formatTimeTo12Hr(cleanClose)}`,
        };
      }
    }

    return { isOpen: true, currentTimeStr };
  }

  return { isOpen: true };
}

/**
 * Automatic Rush Mode Evaluator with Hysteresis:
 * Prevents rapid flapping on/off when orders hover around a single threshold.
 *
 * @param currentBusy Current `isKitchenBusy` state of restaurant
 * @param activeOrdersCount Number of active orders currently preparing in kitchen
 * @param highThreshold High watermark to trigger Rush Mode (default: 8 active orders)
 * @param lowThreshold Low watermark to clear Rush Mode (default: 4 active orders)
 */
export function evaluateRushModeHysteresis(
  currentBusy: boolean,
  activeOrdersCount: number,
  highThreshold: number = 8,
  lowThreshold: number = 4
): { isBusy: boolean; stateChanged: boolean; message: string } {
  if (!currentBusy && activeOrdersCount >= highThreshold) {
    return {
      isBusy: true,
      stateChanged: true,
      message: `Kitchen queue exceeded capacity (${activeOrdersCount} active orders). Rush Mode activated.`,
    };
  }

  if (currentBusy && activeOrdersCount <= lowThreshold) {
    return {
      isBusy: false,
      stateChanged: true,
      message: `Kitchen queue returned to normal (${activeOrdersCount} active orders). Rush Mode deactivated.`,
    };
  }

  return {
    isBusy: currentBusy,
    stateChanged: false,
    message: currentBusy
      ? `Rush Mode remains ACTIVE (${activeOrdersCount} active orders, deactivation threshold <= ${lowThreshold}).`
      : `Normal mode (${activeOrdersCount} active orders, activation threshold >= ${highThreshold}).`,
  };
}
