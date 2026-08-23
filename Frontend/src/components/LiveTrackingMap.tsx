"use client";

import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { BASE_URL } from "@/config/api";
import { motion } from "framer-motion";

import { Navigation, Loader2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";

// Dynamically import Leaflet to avoid SSR issues
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet webpack issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ─── Vehicle Icon SVGs ────────────────────────────────────────────────────────
const VEHICLE_SVGS: Record<string, string> = {
  bicycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#10b981" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🚲</text>
  </svg>`,
  bike: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#f97316" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
  scooter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#f97316" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
  motorcycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#8b5cf6" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🏍️</text>
  </svg>`,
  car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#3b82f6" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🚗</text>
  </svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="22" fill="#10b981" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" fill="white">🛵</text>
  </svg>`,
};

const makeVehicleIcon = (vehicleName?: string) => {
  const key = vehicleName?.toLowerCase() || "default";
  const svgKey = Object.keys(VEHICLE_SVGS).find(k => key.includes(k)) ?? "default";
  const svg = VEHICLE_SVGS[svgKey];
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const makeRestaurantIcon = () =>
  L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);border:3px solid white;box-shadow:0 4px 15px rgba(249,115,22,0.6);display:flex;align-items:center;justify-content:center;font-size:20px;">🍽️</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const makeCustomerIcon = () =>
  L.divIcon({
    html: `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:3px solid white;box-shadow:0 4px 15px rgba(59,130,246,0.6);display:flex;align-items:center;justify-content:center;font-size:20px;">📍</div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });

// ─── Map auto-fit bounds helper ───────────────────────────────────────────────
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
};

// ─── Custom Zoom Controls ─────────────────────────────────────────────────────
const ZoomControls: React.FC<{ fitPositions: [number, number][] }> = ({ fitPositions }) => {
  const map = useMap();
  const btnStyle: React.CSSProperties = {
    width: "36px", height: "36px", borderRadius: "10px", background: "white",
    border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: "18px", fontWeight: "bold", color: "#f97316",
  };
  const handleFit = () => {
    if (fitPositions.length === 1) map.setView(fitPositions[0], 14);
    else if (fitPositions.length >= 2) {
      const bounds = L.latLngBounds(fitPositions.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
    }
  };
  return (
    <div style={{ position: "absolute", bottom: "80px", right: "12px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "6px" }}>
      <button onClick={() => map.zoomIn()} style={btnStyle} title="Zoom In">+</button>
      <button onClick={() => map.zoomOut()} style={{ ...btnStyle, fontSize: "22px" }} title="Zoom Out">−</button>
      <button onClick={handleFit} style={{ ...btnStyle, fontSize: "14px", color: "#334155" }} title="Fit All Markers">🎯</button>
    </div>
  );
};

// ─── Smooth moving marker helper ─────────────────────────────────────────────
const SmoothMarker: React.FC<{
  position: [number, number];
  icon: L.DivIcon;
  popup?: string;
}> = ({ position, icon, popup }) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position[0], position[1]]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {popup && <Popup>{popup}</Popup>}
    </Marker>
  );
};

// ─── Distance Calculator ──────────────────────────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Number(distance.toFixed(1));
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LiveTrackingMapProps {
  orderId: string;
  restaurantCoords?: [number, number]; // [lng, lat]
  customerCoords?: [number, number];   // [lng, lat]
  restaurantName?: string;
  customerName?: string;
  orderStatus?: string;
  hasRider?: boolean;
  riderVehicle?: string;
  riderStatus?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  restaurantCoords = [72.978088, 19.21833],
  customerCoords,
  restaurantName = "Restaurant",
  customerName = "You",
  orderStatus = "preparing",
  hasRider = false,
  riderVehicle,
  riderStatus,
}) => {
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  const [waitingRider, setWaitingRider] = useState(true);

  // Convert [lng, lat] → [lat, lng] for Leaflet
  const restLatLng: [number, number] = [restaurantCoords[1], restaurantCoords[0]];

  // Guaranteed Customer Location:
  // Safely parse coords. If missing/zeros, fallback to a realistic offset near restaurant (~1.5km)
  // so the Customer 📍 pin is ALWAYS rendered on the map!
  const defaultCustLat = Number((restLatLng[0] + 0.012).toFixed(6));
  const defaultCustLng = Number((restLatLng[1] + 0.015).toFixed(6));

  const custLatLng: [number, number] = (customerCoords && customerCoords[0] && customerCoords[1] && Number(customerCoords[0]) !== 0 && Number(customerCoords[1]) !== 0)
    ? [Number(customerCoords[1]), Number(customerCoords[0])]
    : [defaultCustLat, defaultCustLng];

  // Socket: listen for real-time rider position
  useEffect(() => {
    if (!orderId) return;
    const socket = io(BASE_URL);
    socket.emit("join_order", orderId);

    socket.on("rider_location_updated", (data: { lat: number; lng: number }) => {
      setRiderPos([data.lat, data.lng]);
      setWaitingRider(false);
    });

    return () => { socket.disconnect(); };
  }, [orderId]);

  // Phase logic:
  // - Phase 1 (Accepted/Heading to Restaurant): Restaurant 🍽️ + Customer 📍 + Rider 🛵 (Live)
  // - Phase 2 (Reached Restaurant / Out for Delivery): Rider 🛵 + Customer 📍 ONLY (Restaurant is hidden)
  // - Phase 3 (Delivered): Customer 📍 (Delivered)
  const normalizedStatus = (orderStatus || "").toLowerCase();
  const isOutForDelivery = normalizedStatus === "outfordelivery" || riderStatus === "reached_restaurant";
  const isDelivered = normalizedStatus === "delivered";

  const showRestaurantMarker = !isOutForDelivery && !isDelivered;
  const showCustomerMarker = true;
  const showRiderMarker = !!riderPos && !isDelivered;

  // Dynamic ETA & Distance Logic
  const getEtaAndDistance = () => {
    if (normalizedStatus === "delivered") {
      return { eta: "Delivered ✓", dist: "Enjoy your meal!" };
    }
    if (normalizedStatus === "cancelled") {
      return { eta: "Cancelled", dist: "" };
    }

    if (normalizedStatus === "pending") {
      const deliveryDistance = calculateDistance(restLatLng[0], restLatLng[1], custLatLng[0], custLatLng[1]);
      return {
        eta: "Awaiting Confirmation",
        dist: `Prep + Delivery (~${deliveryDistance} KM)`
      };
    }

    // Out for delivery (rider has order, traveling to customer)
    if (isOutForDelivery && riderPos) {
      const distance = calculateDistance(riderPos[0], riderPos[1], custLatLng[0], custLatLng[1]);
      const minutes = Math.max(2, Math.ceil(distance * 3) + 2);
      return {
        eta: `Arriving in ~${minutes} mins`,
        dist: `${distance} KM from doorstep`
      };
    }

    // Ready for riders / accepted (rider traveling to restaurant, or waiting for pickup)
    if ((normalizedStatus === "ready_for_riders" || normalizedStatus === "preparing" || normalizedStatus === "confirmed") && riderPos) {
      const distanceToRest = calculateDistance(riderPos[0], riderPos[1], restLatLng[0], restLatLng[1]);
      const pickupMins = Math.max(2, Math.ceil(distanceToRest * 3) + 2);
      const deliveryDistance = calculateDistance(restLatLng[0], restLatLng[1], custLatLng[0], custLatLng[1]);
      const deliveryMins = Math.ceil(deliveryDistance * 3) + 2;
      const totalMins = pickupMins + deliveryMins + (normalizedStatus === "preparing" ? 15 : 5);

      return {
        eta: `Estimated delivery: ~${totalMins} mins`,
        dist: `Rider is ${distanceToRest} KM from restaurant`
      };
    }

    // Default static fallback when no rider is sharing location yet
    const fallbackDistance = calculateDistance(restLatLng[0], restLatLng[1], custLatLng[0], custLatLng[1]);
    const prepBuffer = normalizedStatus === "preparing" ? 25 : 15;
    const totalFallbackMins = Math.ceil(fallbackDistance * 3) + prepBuffer;

    return {
      eta: `Estimated delivery: ~${totalFallbackMins} mins`,
      dist: `Prep + Delivery (${fallbackDistance} KM)`
    };
  };

  const { eta: etaText, dist: distanceText } = getEtaAndDistance();

  const vehicleIcon = makeVehicleIcon(riderVehicle);
  const restaurantIcon = makeRestaurantIcon();
  const customerIcon = makeCustomerIcon();

  // Map center:
  // When Out for Delivery: midpoint between Rider and Customer
  // When Heading to Restaurant: midpoint between Restaurant and Customer
  const mapCenter: [number, number] = isOutForDelivery && riderPos
    ? [(riderPos[0] + custLatLng[0]) / 2, (riderPos[1] + custLatLng[1]) / 2]
    : [(restLatLng[0] + custLatLng[0]) / 2, (restLatLng[1] + custLatLng[1]) / 2];

  // Bounds for auto-fit based on current phase
  const fitPositions: [number, number][] = isOutForDelivery
    ? [...(riderPos ? [riderPos] : []), custLatLng]
    : [restLatLng, ...(riderPos ? [riderPos] : []), custLatLng];

  const getStatusBadge = () => {
    const s = (orderStatus || "").toLowerCase();
    if (s === "delivered") return { label: "Delivered ✓", cls: "bg-green-600 text-white" };
    if (s === "outfordelivery") return { label: "🚀 Out for Delivery", cls: "bg-orange-500 text-white animate-pulse" };
    if (s === "ready_for_riders") return { label: hasRider ? "🛵 Rider Assigned" : "🕐 Finding Rider", cls: "bg-purple-500 text-white" };
    if (s === "preparing") return { label: "👨‍🍳 Preparing", cls: "bg-blue-500 text-white" };
    if (s === "confirmed") return { label: "✓ Confirmed", cls: "bg-emerald-500 text-white" };
    if (s === "pending") return { label: "⏳ Pending Confirmation", cls: "bg-amber-500 text-white" };
    if (s === "cancelled") return { label: "✕ Cancelled", cls: "bg-red-500 text-white" };
    return { label: s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending", cls: "bg-amber-500 text-white" };
  };

  const statusBadge = getStatusBadge();

  const getVehicleLabel = () => {
    if (!riderVehicle) return "";
    const v = riderVehicle.toLowerCase();
    if (v.includes("bicycle")) return "🚲 Bicycle";
    if (v.includes("motorcycle") || v.includes("bike")) return "🏍️ Motorcycle";
    if (v.includes("scooter")) return "🛵 Scooter";
    if (v.includes("car")) return "🚗 Car";
    return `🛵 ${riderVehicle}`;
  };

  return (
    <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-orange-400 animate-pulse" />
            Live Delivery Tracking
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Real-time map powered by OpenStreetMap
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge className={`text-xs px-3 py-1 rounded-full font-bold ${statusBadge.cls}`}>
            {statusBadge.label}
          </Badge>
          {riderVehicle && (
            <span className="text-[10px] text-slate-300 font-semibold">{getVehicleLabel()}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* Map Legend */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
          {showRestaurantMarker && (
            <span className="flex items-center gap-1.5">
              <span className="text-base">🍽️</span>
              <span className="font-semibold">{restaurantName || "Restaurant"}</span>
            </span>
          )}
          {showCustomerMarker && (
            <span className="flex items-center gap-1.5">
              <span className="text-base">📍</span>
              <span className="font-semibold">{customerName || "Customer"}</span>
            </span>
          )}
          {showRiderMarker && (
            <span className="flex items-center gap-1.5">
              <span className="text-base">🛵</span>
              <span className="font-semibold">Rider (Live)</span>
            </span>
          )}
          {isOutForDelivery && (
            <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full ml-auto">
              ✓ Food Picked Up • Heading to Customer
            </span>
          )}
        </div>

        {/* Real Leaflet Map */}
        <div className="relative w-full h-[400px] z-0 isolate">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: "0 0 24px 24px" }}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-fit bounds when positions change */}
            <FitBounds positions={fitPositions} />

            {/* Custom Zoom Controls */}
            <ZoomControls fitPositions={fitPositions} />

            {/* Restaurant marker - visible in Phase 1 (pickup), hidden in Phase 2 (out for delivery) */}
            {showRestaurantMarker && (
              <Marker position={restLatLng} icon={restaurantIcon}>
                <Popup>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{restaurantName} 🍽️</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Restaurant pickup location</div>
                </Popup>
              </Marker>
            )}

            {/* Customer marker — always visible with valid coordinates */}
            {showCustomerMarker && (
              <Marker position={custLatLng} icon={customerIcon}>
                <Popup>
                  <div style={{ fontWeight: "bold", fontSize: "13px" }}>{customerName} 📍</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Customer delivery destination</div>
                </Popup>
              </Marker>
            )}

            {/* Path routing logic: */}
            {/* 1. Out for delivery: Active polyline directly from Rider to Customer */}
            {isOutForDelivery && riderPos && (
              <Polyline
                positions={[riderPos, custLatLng]}
                pathOptions={{ color: "#f97316", weight: 4.5, opacity: 0.9, dashArray: "9 7" }}
              />
            )}

            {/* 2. Rider heading to restaurant: Polyline from Rider to Restaurant, and dashed path to Customer */}
            {!isOutForDelivery && riderPos && (
              <>
                <Polyline
                  positions={[riderPos, restLatLng]}
                  pathOptions={{ color: "#f97316", weight: 4.5, opacity: 0.9, dashArray: "9 7" }}
                />
                <Polyline
                  positions={[restLatLng, custLatLng]}
                  pathOptions={{ color: "#94a3b8", weight: 3, opacity: 0.55, dashArray: "6 6" }}
                />
              </>
            )}

            {/* 3. Static overview (before rider assigned): dashed path from restaurant to customer */}
            {!riderPos && (
              <Polyline
                positions={[restLatLng, custLatLng]}
                pathOptions={{ color: "#94a3b8", weight: 3, opacity: 0.55, dashArray: "6 6" }}
              />
            )}

            {/* Moving vehicle marker */}
            {showRiderMarker && riderPos && (
              <SmoothMarker
                position={riderPos}
                icon={vehicleIcon}
                popup={`Rider is here ${getVehicleLabel()}`}
              />
            )}
          </MapContainer>

          {/* Floating ETA overlay */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/20 dark:border-slate-800 z-[1000] flex justify-between items-center gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/40 rounded-xl flex items-center justify-center text-xl shrink-0">
                {normalizedStatus === "pending" ? "⏳" : "⏰"}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {normalizedStatus === "pending" ? "Order Status" : "Estimated Delivery"}
                </p>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                  {etaText}
                </h4>
              </div>
            </div>
            {distanceText && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Details</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{distanceText}</p>
              </div>
            )}
          </motion.div>

          {/* Waiting overlay */}
          {waitingRider && hasRider && !isDelivered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-[1000]"
            >
              <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Waiting for rider to share live location…
              </p>
            </motion.div>
          )}

          {!hasRider && !isDelivered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-4 right-14 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-[1000]"
            >
              <Package className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {(() => {
                  if (normalizedStatus === "confirmed") {
                    return "Order confirmed! Kitchen will start preparation soon 👨‍🍳";
                  }
                  if (normalizedStatus === "preparing") {
                    return "Your food is being prepared in the kitchen 🍳";
                  }
                  if (normalizedStatus === "pending") {
                    return "Order placed! Awaiting restaurant confirmation ⏳";
                  }
                  return "Waiting for a rider to accept your order… 🛵";
                })()}
              </p>
            </motion.div>
          )}

        </div>

        {/* Live Status Footer */}
        {riderPos && !isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-t border-green-100 dark:border-green-900/50 flex justify-between items-center"
          >
            <div>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">Live Tracking</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                {isOutForDelivery ? "Rider is heading to your delivery location!" : "Rider is heading to the restaurant!"}
              </p>
            </div>
            {riderVehicle && (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehicle</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{getVehicleLabel()}</p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
