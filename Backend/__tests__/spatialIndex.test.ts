import { encodeGeohash, decodeGeohash } from "../utils/spatialIndex";

export function runSpatialIndexTests() {
  console.log("\n🧪 Running Topic 3: Geospatial Indexing (Geohash) Tests...");

  // Test 1: Geohash Encoding
  // Gateway of India, Mumbai: 18.9220° N, 72.8347° E
  const lat = 18.9220;
  const lon = 72.8347;

  const hash6 = encodeGeohash(lat, lon, 6);
  console.assert(hash6.length === 6, `Geohash length should be 6, got: ${hash6.length}`);
  console.assert(typeof hash6 === "string", "Geohash must be a string");
  console.log(`  ✅ Geohash encode (Precision 6): [${lat}, ${lon}] => "${hash6}"`);

  // Test 2: Geohash Precision Variation
  const hash5 = encodeGeohash(lat, lon, 5);
  const hash8 = encodeGeohash(lat, lon, 8);
  console.assert(hash8.startsWith(hash6), "Higher precision geohash must have lower precision as prefix");
  console.assert(hash6.startsWith(hash5), "Prefix matching enables hierarchical spatial cell search");
  console.log(`  ✅ Hierarchical cell prefix matching verified: "${hash8}" starts with "${hash6}" starts with "${hash5}"`);

  // Test 3: Geohash Decoding
  const decoded = decodeGeohash(hash6);
  console.assert(Math.abs(decoded.latitude - lat) < 0.05, `Decoded latitude (${decoded.latitude}) should be within cell error of ${lat}`);
  console.assert(Math.abs(decoded.longitude - lon) < 0.05, `Decoded longitude (${decoded.longitude}) should be within cell error of ${lon}`);
  console.log(`  ✅ Geohash decode verified: "${hash6}" => [lat: ${decoded.latitude}, lon: ${decoded.longitude}] (cell tolerance: ±${decoded.error.latitude})`);

  // Test 4: Invalid Bounds Rejection
  let invalidCaught = false;
  try {
    encodeGeohash(100, 50);
  } catch {
    invalidCaught = true;
  }
  console.assert(invalidCaught === true, "Geohash encoding must throw error on out-of-range coordinates");
  console.log("  ✅ Out-of-range coordinates rejected cleanly");
}
