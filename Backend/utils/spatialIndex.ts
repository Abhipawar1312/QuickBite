/**
 * Spatial Indexing Utility: Geohash & Spatial Cell Partitioning
 *
 * Provides:
 * 1. Standard Base-32 Geohash encoding and decoding.
 * 2. Precision-based spatial cell calculation.
 * 3. Bounding box computation for proximity filtering.
 * 4. Architectural guidance on MongoDB 2dsphere vs Geohash vs Uber H3 vs Redis GEO.
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface DecodedGeohash {
  latitude: number;
  longitude: number;
  error: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Encodes latitude and longitude into a standard Geohash string.
 *
 * @param latitude Latitude in degrees [-90, 90]
 * @param longitude Longitude in degrees [-180, 180]
 * @param precision Character length of geohash (1 to 12). Default 6 (~1.2km x 0.6km cell)
 */
export function encodeGeohash(latitude: number, longitude: number, precision: number = 6): string {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid coordinate bounds: lat=${latitude}, lon=${longitude}`);
  }

  let latMin = -90.0;
  let latMax = 90.0;
  let lonMin = -180.0;
  let lonMax = 180.0;

  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    let mid: number;
    if (isEven) {
      mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Decodes a Geohash string back into center latitude, longitude, and bounding box error.
 */
export function decodeGeohash(geohash: string): DecodedGeohash {
  let latMin = -90.0;
  let latMax = 90.0;
  let lonMin = -180.0;
  let lonMax = 180.0;
  let isEven = true;

  const lower = geohash.toLowerCase();
  for (let i = 0; i < lower.length; i++) {
    const cd = BASE32.indexOf(lower[i]);
    if (cd === -1) {
      throw new Error(`Invalid geohash character at index ${i}: ${lower[i]}`);
    }

    for (let j = 0; j < 5; j++) {
      const mask = 1 << (4 - j);
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if ((cd & mask) !== 0) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if ((cd & mask) !== 0) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  const latitude = (latMin + latMax) / 2;
  const longitude = (lonMin + lonMax) / 2;

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    error: {
      latitude: Number(((latMax - latMin) / 2).toFixed(6)),
      longitude: Number(((lonMax - lonMin) / 2).toFixed(6)),
    },
  };
}

/**
 * Scale Evaluation Guide for QuickBite Engineering:
 *
 * 1. Current Phase (MVP / Single Region, < 5,000 active riders):
 *    - Best Choice: MongoDB 2dsphere index with $near / $geoNear.
 *    - Rationale: Fully managed by MongoDB, supports spherical trigonometry directly,
 *      requires no extra infrastructure, and queries execute in < 2ms for local datasets.
 *
 * 2. Medium Scale (City-wide expansion, 5,000 - 50,000 concurrent riders):
 *    - Best Choice: Redis GEO (GEOADD, GEORADIUS / GEOSEARCH).
 *    - Rationale: High-throughput in-memory updates every 3-5 seconds without disk write overhead.
 *      Redis GEO uses internal 52-bit Geohash sorted sets for sub-millisecond proximity queries.
 *
 * 3. Hyper-Scale (Multi-City / National, > 50,000 riders, dynamic surge pricing):
 *    - Best Choice: Uber H3 (Discrete Global Grid System).
 *    - Rationale: Hexagonal cells have equidistant neighbors (unlike rectangular geohashes with diagonal distortion),
 *      making demand/supply density modeling, surge clustering, and dispatch partitioning mathematically uniform.
 */
