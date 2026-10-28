/**
 * Road Routing & ETA Calculation Service for QuickBite
 *
 * Implements:
 * 1. OSRM (Open Source Routing Machine) turn-by-turn road distance and duration.
 * 2. Strict timeout and error handling.
 * 3. Graceful fallback to Haversine with urban winding factor (detour multiplier: 1.35x).
 * 4. Coordinate quantization and caching (100m grid precision) to prevent API spam.
 * 5. Explicit disclaimer: Standard OSRM provides topological driving routes,
 *    not real-time live traffic congestion delays.
 */

import { calculateHaversineDistance, isValidCoordinate } from "../utils/geo";
import { cache } from "../utils/cache";

export interface RouteResult {
  source: "osrm" | "haversine_fallback" | "cache";
  distanceKM: number;
  durationMinutes: number;
  isLiveTraffic: boolean;
  coordinates: {
    origin: [number, number]; // [lat, lon]
    destination: [number, number];
  };
}

export interface IRoutingService {
  calculateRoute(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): Promise<RouteResult>;
}

export class RoutingService implements IRoutingService {
  private osrmBaseUrl: string;
  private timeoutMs: number;
  private urbanDetourMultiplier: number = 1.35; // Urban road network winding factor
  private urbanSpeedKmh: number = 22; // Typical two-wheeler urban speed in Indian cities
  private terminalBufferMinutes: number = 4; // Pickup/drop-off & parking buffer

  constructor(
    osrmBaseUrl: string = process.env.OSRM_BASE_URL || "https://router.project-osrm.org",
    timeoutMs: number = 2500
  ) {
    this.osrmBaseUrl = osrmBaseUrl.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
  }

  /**
   * Quantizes coordinates to 3 decimal places (~110 meters) for cache key generation.
   * This prevents distinct cache entries for minor GPS jitter.
   */
  private getCacheKey(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const qLat1 = lat1.toFixed(3);
    const qLon1 = lon1.toFixed(3);
    const qLat2 = lat2.toFixed(3);
    const qLon2 = lon2.toFixed(3);
    return `routing:route:${qLat1},${qLon1}->${qLat2},${qLon2}`;
  }

  /**
   * Computes fallback route estimation when external routing provider is unavailable.
   */
  public calculateFallbackRoute(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): RouteResult {
    const straightLineKM = calculateHaversineDistance(originLat, originLon, destLat, destLon, "km");
    
    // Urban road driving distance is approximately 30-40% longer than straight-line distance
    const estimatedRoadDistanceKM = Number((straightLineKM * this.urbanDetourMultiplier).toFixed(2));
    
    // Travel duration in minutes based on average urban speed + parking/entry buffer
    const travelDuration = (estimatedRoadDistanceKM / this.urbanSpeedKmh) * 60;
    const durationMinutes = Math.ceil(travelDuration + this.terminalBufferMinutes);

    return {
      source: "haversine_fallback",
      distanceKM: estimatedRoadDistanceKM,
      durationMinutes,
      isLiveTraffic: false,
      coordinates: {
        origin: [originLat, originLon],
        destination: [destLat, destLon],
      },
    };
  }

  /**
   * Calculates road route with caching, external provider call, and resilient fallback.
   */
  public async calculateRoute(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ): Promise<RouteResult> {
    if (!isValidCoordinate(originLat, originLon) || !isValidCoordinate(destLat, destLon)) {
      throw new Error(
        `Invalid coordinates provided to routing service: [${originLat}, ${originLon}] -> [${destLat}, ${destLon}]`
      );
    }

    // Check if origin and destination are identical
    if (originLat === destLat && originLon === destLon) {
      return {
        source: "cache",
        distanceKM: 0,
        durationMinutes: 0,
        isLiveTraffic: false,
        coordinates: {
          origin: [originLat, originLon],
          destination: [destLat, destLon],
        },
      };
    }

    // 1. Check cache
    const cacheKey = this.getCacheKey(originLat, originLon, destLat, destLon);
    try {
      const cached = await cache.get<RouteResult>(cacheKey);
      if (cached) {
        return {
          ...cached,
          source: "cache",
        };
      }
    } catch {
      // Ignore cache lookup errors
    }

    // 2. Query OSRM API with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      // OSRM coordinates format: {longitude},{latitude};{longitude},{latitude}
      const osrmUrl = `${this.osrmBaseUrl}/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=false`;

      const response = await fetch(osrmUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "QuickBite-FoodDelivery/1.0" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM API responded with status ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const distanceKM = Number((primaryRoute.distance / 1000).toFixed(2)); // meters -> km
        const durationMinutes = Math.ceil(primaryRoute.duration / 60) + this.terminalBufferMinutes; // seconds -> mins

        const result: RouteResult = {
          source: "osrm",
          distanceKM,
          durationMinutes,
          isLiveTraffic: false, // Standard OSRM provides topological driving estimate, not live congestion
          coordinates: {
            origin: [originLat, originLon],
            destination: [destLat, destLon],
          },
        };

        // Cache successful route for 1 hour
        await cache.set(cacheKey, result, 3600);
        return result;
      }
    } catch (err: any) {
      console.warn(
        `[RoutingService] External routing unavailable (${err.message || err.name}). Falling back to urban distance model.`
      );
    }

    // 3. Fallback to Haversine urban road model
    const fallback = this.calculateFallbackRoute(originLat, originLon, destLat, destLon);
    // Cache fallback for 15 minutes
    await cache.set(cacheKey, fallback, 900);
    return fallback;
  }
}

export const routingService = new RoutingService();
