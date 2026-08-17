import Redis from "ioredis";

/**
 * High-Speed Caching Layer (Redis + In-Memory Fallback)
 * Provides sub-10ms caching for restaurant listings, menus, cuisines, and recommendations.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheService {
  private memoryStore: Map<string, CacheEntry<any>> = new Map();
  private redisClient: Redis | null = null;
  private isRedisConnected: boolean = false;
  private defaultTTL: number = 60 * 5; // 5 minutes in seconds

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 2000,
        retryStrategy: () => null, // Don't spam retries if Redis is not installed locally
      });

      this.redisClient.connect()
        .then(() => {
          this.isRedisConnected = true;
          console.log("✅ Redis connected successfully. Caching layer active on Redis.");
        })
        .catch(() => {
          this.isRedisConnected = false;
          console.log("ℹ️ Redis not reachable. Using high-speed In-Memory Cache (sub-10ms latency).");
        });

      this.redisClient.on("error", () => {
        this.isRedisConnected = false;
      });
    } catch (err) {
      this.isRedisConnected = false;
      console.log("ℹ️ Using In-Memory Cache (sub-10ms latency).");
    }
  }

  /**
   * Get cached item by key
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const raw = await this.redisClient.get(key);
        if (raw) return JSON.parse(raw) as T;
      }
    } catch (e) {
      // Fallback to memory on Redis read failure
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached item with TTL in seconds
   */
  public async set<T>(key: string, data: T, ttlSeconds: number = this.defaultTTL): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(data));
      }
    } catch (e) {
      // Fallback to memory
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.memoryStore.set(key, { data, expiry });
  }

  /**
   * Invalidate specific key
   */
  public async del(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (e) {
      // ignore
    }
    this.memoryStore.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. "restaurants:*", "cuisines:*", "menus:*")
   */
  public async invalidatePattern(patternPrefix: string): Promise<number> {
    let count = 0;
    try {
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(`${patternPrefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          count += keys.length;
        }
      }
    } catch (e) {
      // ignore
    }

    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(patternPrefix)) {
        this.memoryStore.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache store
   */
  public async flushAll(): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushdb();
      }
    } catch (e) {
      // ignore
    }
    this.memoryStore.clear();
  }

  /**
   * Get cache stats
   */
  public getStats(): { totalKeys: number; driver: string } {
    return {
      totalKeys: this.memoryStore.size,
      driver: this.isRedisConnected ? "Redis" : "In-Memory (Fast Map)",
    };
  }
}

export const cache = new CacheService();

