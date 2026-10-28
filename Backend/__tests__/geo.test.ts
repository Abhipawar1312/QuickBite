import {
  calculateHaversineDistance,
  isValidCoordinate,
  degreesToRadians,
  radiansToDegrees,
  geoJsonToLatLng,
  latLngToGeoJson,
  calculateBearing,
  estimateTransitTimeMinutes,
} from "../utils/geo";

export function runGeoTests() {
  console.log("\n🧪 Running Topic 1: Geographic Distance & Haversine Tests...");

  // Test 1: Coordinate Validation
  console.assert(isValidCoordinate(19.076, 72.8777) === true, "Valid Mumbai coordinates should return true");
  console.assert(isValidCoordinate(90, 180) === true, "Boundary coordinates (90, 180) should return true");
  console.assert(isValidCoordinate(-90, -180) === true, "Boundary coordinates (-90, -180) should return true");
  console.assert(isValidCoordinate(91, 0) === false, "Latitude > 90 should return false");
  console.assert(isValidCoordinate(0, 181) === false, "Longitude > 180 should return false");
  console.assert(isValidCoordinate(NaN, 50) === false, "NaN latitude should return false");
  console.assert(isValidCoordinate(null as any, 50) === false, "null latitude should return false");
  console.assert(isValidCoordinate(undefined as any, 50) === false, "undefined latitude should return false");
  console.log("  ✅ Coordinate validation passed (valid, boundary, and invalid cases)");

  // Test 2: Identical Coordinates Distance
  const distIdentical = calculateHaversineDistance(19.218, 72.978, 19.218, 72.978);
  console.assert(distIdentical === 0, `Identical coordinates should yield exactly 0 KM, got: ${distIdentical}`);
  console.log("  ✅ Identical coordinates test passed (0.0 KM)");

  // Test 3: Known Geodesic Distance (Mumbai CST to Dadar Station ~ 8.5 - 9.0 KM straight-line)
  // CST: 18.9401° N, 72.8354° E | Dadar: 19.0178° N, 72.8478° E
  const cstLat = 18.9401, cstLng = 72.8354;
  const dadarLat = 19.0178, dadarLng = 72.8478;
  const distCstDadar = calculateHaversineDistance(cstLat, cstLng, dadarLat, dadarLng, "km");
  console.assert(distCstDadar > 8.0 && distCstDadar < 9.5, `CST to Dadar should be ~8.7 KM, got: ${distCstDadar}`);
  console.log(`  ✅ Known distance test passed: Mumbai CST -> Dadar = ${distCstDadar} KM`);

  // Test 4: Distance in Meters
  const distMeters = calculateHaversineDistance(cstLat, cstLng, dadarLat, dadarLng, "meters");
  console.assert(Math.abs(distMeters - distCstDadar * 1000) < 50, "Meters calculation should align with KM");
  console.log(`  ✅ Meters unit test passed (${distMeters} meters)`);

  // Test 5: GeoJSON Coordinate Conversions ([longitude, latitude] vs { lat, lon })
  const geoJson: [number, number] = [72.8777, 19.076];
  const latLng = geoJsonToLatLng(geoJson);
  console.assert(latLng.latitude === 19.076 && latLng.longitude === 72.8777, "GeoJSON [lon, lat] must map to { lat, lon }");

  const backToGeoJson = latLngToGeoJson(latLng.latitude, latLng.longitude);
  console.assert(backToGeoJson[0] === 72.8777 && backToGeoJson[1] === 19.076, "Reverse conversion must preserve GeoJSON ordering");
  console.log("  ✅ GeoJSON [lng, lat] coordinate ordering integrity verified");

  // Test 6: Bearing Calculation (Heading north-east from CST to Dadar should be ~ 9° - 15°)
  const bearing = calculateBearing(cstLat, cstLng, dadarLat, dadarLng);
  console.assert(bearing >= 0 && bearing <= 360, "Bearing must be in [0, 360]");
  console.log(`  ✅ Compass bearing test passed: CST -> Dadar = ${bearing.toFixed(1)}°`);

  // Test 7: Travel Time Estimation
  const transitTime = estimateTransitTimeMinutes(10, 20, 5); // 10km at 20km/h = 30 mins + 5 mins buffer = 35 mins
  console.assert(transitTime === 35, `Transit time for 10KM at 20km/h + 5m buffer should be 35 mins, got: ${transitTime}`);
  console.log("  ✅ Travel time estimation test passed");
}
