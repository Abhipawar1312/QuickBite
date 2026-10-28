import { runGeoTests } from "./geo.test";
import { runRoutingTests } from "./routing.test";
import { runSpatialIndexTests } from "./spatialIndex.test";
import { runSmartDispatchTests } from "./smartDispatch.test";
import { runOrderStateMachineTests } from "./orderStateMachine.test";
import { runOperatingHoursTests } from "./operatingHours.test";
import { runCacheAndLockTests } from "./cacheAndLocks.test";

async function main() {
  console.log("================================================================");
  console.log("🚀 QUICKBITE DOMAIN ENGINES & ALGORITHMS TEST SUITE");
  console.log("================================================================");

  const startTime = Date.now();

  try {
    runGeoTests();
    await runRoutingTests();
    runSpatialIndexTests();
    runSmartDispatchTests();
    runOrderStateMachineTests();
    runOperatingHoursTests();
    await runCacheAndLockTests();

    const elapsed = Date.now() - startTime;
    console.log("\n================================================================");
    console.log(`🎉 ALL DOMAIN ALGORITHM TESTS PASSED IN ${elapsed}ms!`);
    console.log("================================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED WITH ERROR:", error);
    process.exit(1);
  }
}

main();
