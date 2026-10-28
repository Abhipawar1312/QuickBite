import { RoutingService } from "../services/routing.service";

export async function runRoutingTests() {
  console.log("\n🧪 Running Topic 2: Road Routing & Fallback ETA Tests...");

  const routingService = new RoutingService("https://invalid-osrm-host-for-testing.org", 500);

  // Test 1: Identical Coordinates
  const routeIdentical = await routingService.calculateRoute(19.218, 72.978, 19.218, 72.978);
  console.assert(routeIdentical.distanceKM === 0, "Distance between identical points must be 0");
  console.assert(routeIdentical.durationMinutes === 0, "Duration between identical points must be 0");
  console.log("  ✅ Zero-distance identical points route passed");

  // Test 2: Fallback Route Estimation when Provider Unreachable (Urban Detour Factor 1.35x)
  const cstLat = 18.9401, cstLng = 72.8354;
  const dadarLat = 19.0178, dadarLng = 72.8478;

  const fallbackRoute = await routingService.calculateRoute(cstLat, cstLng, dadarLat, dadarLng);
  console.assert(fallbackRoute.source === "haversine_fallback", "When OSRM fails, source must be 'haversine_fallback'");
  console.assert(fallbackRoute.distanceKM > 10.0 && fallbackRoute.distanceKM < 13.0, `Urban road distance should be ~11.7KM (1.35x of 8.7KM), got: ${fallbackRoute.distanceKM}`);
  console.assert(fallbackRoute.durationMinutes > 25, `Duration should account for urban speed + terminal buffer, got: ${fallbackRoute.durationMinutes} mins`);
  console.assert(fallbackRoute.isLiveTraffic === false, "isLiveTraffic must be explicitly false for non-traffic providers");
  console.log(`  ✅ Fallback road model verified: Road Dist = ${fallbackRoute.distanceKM} KM, ETA = ${fallbackRoute.durationMinutes} mins (Source: ${fallbackRoute.source})`);

  // Test 3: Invalid Coordinates Rejection
  let errorCaught = false;
  try {
    await routingService.calculateRoute(999, 0, 19, 72);
  } catch (err) {
    errorCaught = true;
  }
  console.assert(errorCaught === true, "Routing service must reject out-of-bounds coordinates");
  console.log("  ✅ Out-of-bounds coordinates properly rejected with error");
}
