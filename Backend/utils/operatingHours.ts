export function formatTimeTo12Hr(time24?: string): string {
    if (!time24) return "";
    const parts = time24.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    if (isNaN(h)) return time24;
    const period = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${String(h).padStart(2, "0")}:${m} ${period}`;
}

export function isRestaurantCurrentlyOpen(restaurant: {
    isOpen?: boolean;
    operatingHours?: { openTime?: string; closeTime?: string };
}): { isOpen: boolean; reason?: string } {
    if (restaurant.isOpen === false) {
        return { isOpen: false, reason: "Closed by merchant" };
    }

    if (restaurant.operatingHours?.openTime && restaurant.operatingHours?.closeTime) {
        const { openTime, closeTime } = restaurant.operatingHours;
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, "0");
        const currentMinutes = String(now.getMinutes()).padStart(2, "0");
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        // Normal operating hours within same day (e.g. 09:00 to 17:00)
        if (openTime <= closeTime) {
            if (currentTimeStr < openTime || currentTimeStr >= closeTime) {
                return {
                    isOpen: false,
                    reason: `Operating hours are ${formatTimeTo12Hr(openTime)} – ${formatTimeTo12Hr(closeTime)}`
                };
            }
        } else {
            // Overnight operating hours (e.g. 18:00 to 02:00 next day)
            if (currentTimeStr < openTime && currentTimeStr >= closeTime) {
                return {
                    isOpen: false,
                    reason: `Operating hours are ${formatTimeTo12Hr(openTime)} – ${formatTimeTo12Hr(closeTime)}`
                };
            }
        }
    }

    return { isOpen: true };
}
