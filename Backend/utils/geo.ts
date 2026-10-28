/**
 * Geographic Distance & Geospatial Utilities for QuickBite
 * Implements Haversine distance, coordinate validation, GeoJSON conversions,
 * bearing, and travel time estimation.
 */

export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS_METERS = 6371000;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validates spherical latitude and longitude coordinates.
 * Latitude must be within [-90, 90] degrees.
 * Longitude must be within [-180, 180] degrees.
 */
export function isValidCoordinate(latitude?: number | null, longitude?: number | null): boolean {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return false;
  }
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/**
 * Converts degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates geodesic distance between two points using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 (in degrees)
 * @param lon1 Longitude of point 1 (in degrees)
 * @param lat2 Latitude of point 2 (in degrees)
 * @param lon2 Longitude of point 2 (in degrees)
 * @param unit Return unit: 'km' (default) or 'meters'
 * @returns Geodesic distance
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "km" | "meters" = "km"
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error(
      `Invalid geographic coordinates provided: [lat1=${lat1}, lon1=${lon1}], [lat2=${lat2}, lon2=${lon2}]`
    );
  }

  // Identical coordinates check to avoid precision rounding artifacts
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const radLat1 = degreesToRadians(lat1);
  const radLat2 = degreesToRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Clamp 'a' to [0, 1] to prevent NaN from floating-point inaccuracy in Math.sqrt
  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  if (unit === "meters") {
    return Math.round(EARTH_RADIUS_METERS * c);
  }

  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Converts GeoJSON coordinate array [longitude, latitude] into { latitude, longitude }.
 * NOTE: MongoDB and GeoJSON specify coordinates in [longitude, latitude] order!
 */
export function geoJsonToLatLng(coordinates: [number, number]): Coordinates {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error("Invalid GeoJSON coordinates: Expected array of [longitude, latitude]");
  }
  return {
    latitude: coordinates[1],
    longitude: coordinates[0],
  };
}

/**
 * Converts latitude and longitude into GeoJSON [longitude, latitude] tuple.
 */
export function latLngToGeoJson(latitude: number, longitude: number): [number, number] {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
  }
  return [Number(longitude), Number(latitude)];
}

/**
 * Calculates initial compass bearing (heading) in degrees [0, 360) from point 1 to point 2.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error("Invalid coordinates for bearing calculation");
  }

  const radLat1 = degreesToRadians(lat1);
  const radLat2 = degreesToRadians(lat2);
  const dLon = degreesToRadians(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  let brng = radiansToDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Estimates delivery transit time in minutes based on distance and average urban transit speed.
 *
 * @param distanceKM Road or estimated travel distance in kilometers
 * @param avgSpeedKMH Average speed in km/h (default 22 km/h for urban motorbike/scooter)
 * @param bufferMinutes Buffer for traffic lights, parking, and building entry (default 5 mins)
 */
export function estimateTransitTimeMinutes(
  distanceKM: number,
  avgSpeedKMH: number = 22,
  bufferMinutes: number = 5
): number {
  if (distanceKM <= 0) return bufferMinutes;
  const transitMinutes = (distanceKM / avgSpeedKMH) * 60;
  return Math.ceil(transitMinutes + bufferMinutes);
}
