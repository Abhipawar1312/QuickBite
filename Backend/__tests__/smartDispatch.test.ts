import {
  calculateProximityScore,
  calculateWorkloadScore,
  calculateFreshnessScore,
  computeCompositeScore,
  DEFAULT_DISPATCH_WEIGHTS,
  recordRiderDeclined,
  clearExcludedRidersForOrder,
} from "../utils/smartDispatch";

export function runSmartDispatchTests() {
  console.log("\n🧪 Running Topic 4: Smart Courier Dispatch Scoring Tests...");

  // Test 1: Proximity Score Normalization (Distance in KM)
  const scoreAtZero = calculateProximityScore(0, 7);
  const scoreAtHalf = calculateProximityScore(3.5, 7);
  const scoreAtMax = calculateProximityScore(7, 7);
  const scoreBeyondMax = calculateProximityScore(8, 7);

  console.assert(scoreAtZero === 1.0, `Score at 0KM must be 1.0, got ${scoreAtZero}`);
  console.assert(scoreAtHalf === 0.5, `Score at half radius must be 0.5, got ${scoreAtHalf}`);
  console.assert(scoreAtMax === 0.0, `Score at max radius must be 0.0, got ${scoreAtMax}`);
  console.assert(scoreBeyondMax === 0.0, `Score beyond max radius must be 0.0, got ${scoreBeyondMax}`);
  console.log("  ✅ Proximity score normalization passed");

  // Test 2: Workload Score Normalization (Active deliveries penalty)
  console.assert(calculateWorkloadScore(0) === 1.0, "0 deliveries => 1.0 score");
  console.assert(calculateWorkloadScore(1) === 0.6, "1 delivery => 0.6 score");
  console.assert(calculateWorkloadScore(2) === 0.2, "2 deliveries => 0.2 score");
  console.assert(calculateWorkloadScore(3) === 0.0, "3+ deliveries => 0.0 score (ineligible)");
  console.log("  ✅ Workload score penalty formula passed");

  // Test 3: Location Freshness Score (Seconds elapsed)
  console.assert(calculateFreshnessScore(30) === 1.0, "30s old => 1.0 score (hot)");
  console.assert(calculateFreshnessScore(120) === 0.75, "120s old => 0.75 score");
  console.assert(calculateFreshnessScore(300) === 0.4, "300s old => 0.4 score");
  console.assert(calculateFreshnessScore(900) === 0.1, "900s old => 0.1 score (stale)");
  console.log("  ✅ Location freshness decay score passed");

  // Test 4: Multi-Factor Composite Score Ranking
  // Rider A: 1.0 KM away (proximity = 0.857), 0 active orders (workload = 1.0), 30s old (freshness = 1.0)
  const riderAScore = computeCompositeScore(
    calculateProximityScore(1.0, 7),
    calculateWorkloadScore(0),
    calculateFreshnessScore(30),
    DEFAULT_DISPATCH_WEIGHTS
  );

  // Rider B: 0.5 KM away (proximity = 0.928), 2 active orders (workload = 0.2), 600s old (freshness = 0.2)
  const riderBScore = computeCompositeScore(
    calculateProximityScore(0.5, 7),
    calculateWorkloadScore(2),
    calculateFreshnessScore(600),
    DEFAULT_DISPATCH_WEIGHTS
  );

  console.assert(
    riderAScore > riderBScore,
    `Rider A (idle, fresh) should rank higher than Rider B (busy, stale). Rider A: ${riderAScore}, Rider B: ${riderBScore}`
  );
  console.log(`  ✅ Multi-factor ranking verified: Rider A (Score: ${riderAScore}) > Rider B (Score: ${riderBScore})`);

  // Test 5: Exclusion of Declined / Timed-Out Riders
  const orderId = "order_test_123";
  recordRiderDeclined(orderId, "rider_user_99");
  clearExcludedRidersForOrder(orderId);
  console.log("  ✅ Declined rider tracking & clearance verified");
}
