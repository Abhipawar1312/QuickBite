import { cache } from "../utils/cache";

export async function runCacheAndLockTests() {
  console.log("\n🧪 Running Topic 7: Redis Caching & Distributed Locks Tests...");

  // Test 1: Basic Cache Set & Get
  await cache.set("test:greeting", { message: "hello quickbite" }, 60);
  const fetched = await cache.get<{ message: string }>("test:greeting");
  console.assert(fetched?.message === "hello quickbite", "Cached data must match stored data");
  console.log("  ✅ Cache set/get verified");

  // Test 2: Distributed Lock Acquisition
  const lockKey = "lock:order:order_abc_123";
  const token1 = await cache.acquireLock(lockKey, 5000);
  console.assert(token1 !== null, "First lock acquisition must succeed and return an ownership token");
  console.log(`  ✅ Distributed lock acquired (Token: ${token1})`);

  // Test 3: Mutual Exclusion: Concurrent Lock Attempt must fail
  const token2 = await cache.acquireLock(lockKey, 5000);
  console.assert(token2 === null, "Second concurrent lock acquisition on same key MUST fail (null)");
  console.log("  ✅ Distributed mutual exclusion verified (concurrent lock request rejected)");

  // Test 4: Lock Safe Release (Wrong Token must NOT release lock)
  const releasedWrong = await cache.releaseLock(lockKey, "wrong_token_123");
  console.assert(releasedWrong === false, "Releasing lock with wrong token MUST return false");
  console.log("  ✅ Lock ownership protection verified (impostor token cannot release lock)");

  // Test 5: Lock Safe Release (Correct Token releases lock)
  const releasedCorrect = await cache.releaseLock(lockKey, token1!);
  console.assert(releasedCorrect === true, "Releasing lock with matching token MUST succeed");
  console.log("  ✅ Lock successfully released by owner");

  // Test 6: Pattern Invalidation
  await cache.set("restaurants:search:mumbai:1", { ok: 1 }, 60);
  await cache.set("restaurants:search:mumbai:2", { ok: 2 }, 60);
  const deletedCount = await cache.invalidatePattern("restaurants:search:");
  console.assert(deletedCount >= 2, `Pattern invalidation must delete matching keys, deleted: ${deletedCount}`);
  const shouldBeNull = await cache.get("restaurants:search:mumbai:1");
  console.assert(shouldBeNull === null, "Invalidated key must be null");
  console.log("  ✅ Non-blocking pattern invalidation verified");
}
